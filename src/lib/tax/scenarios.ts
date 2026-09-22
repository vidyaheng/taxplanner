import {
  DeductionData,
} from "@/types/deductions";

import {
  PlanningData,
  PlanningLimitReason,
  PlanningSideEffect,
  PlanningSideEffectKey,
  PlanningUsageResult,
} from "@/types/planning";

import {
  TaxResult,
} from "@/types/taxResult";

/*
 * IMPORTANT:
 * ลำดับนี้ต้องสอดคล้องกับ allocation priority
 * ของ Tax Engine เพราะ calculatePlanningUsage*
 * วัด "deduction ที่เพิ่มขึ้นจริง" แบบ cumulative
 *
 * Current Engine priority ที่เกี่ยวข้อง:
 * - Life ก่อน Health ภายใต้ combined cap
 * - Pension extra ก่อน RMF ภายใต้
 *   retirement shared ceiling
 *
 * ห้ามเปลี่ยนลำดับนี้เพียงเพื่อเหตุผลด้าน UI
 * โดยไม่ตรวจ Engine และ scenarios tests พร้อมกัน
 */
const planningFieldOrder:
  (keyof PlanningData)[] = [
    "lifeInsurance",
    "healthInsuranceSelf",
    "pensionInsurance",
    "rmf",
    "thaiEsg",
  ];


function safePlanning(
  planning?: PlanningData
): PlanningData {
  return {
    lifeInsurance:
      planning?.lifeInsurance ?? 0,

    healthInsuranceSelf:
      planning?.healthInsuranceSelf ?? 0,

    pensionInsurance:
      planning?.pensionInsurance ?? 0,

    rmf:
      planning?.rmf ?? 0,

    thaiEsg:
      planning?.thaiEsg ?? 0,
  };
}


function emptyPlanning():
  PlanningData {
  return {
    lifeInsurance: 0,
    healthInsuranceSelf: 0,
    pensionInsurance: 0,
    rmf: 0,
    thaiEsg: 0,
  };
}

function getPlanningFieldAllowed(
  result: TaxResult,
  key: keyof PlanningData
): number {
  switch (key) {
    case "lifeInsurance":
      return result
        .insuranceDeductions
        .lifeInsurance
        .allowed;

    case "healthInsuranceSelf":
      return result
        .insuranceDeductions
        .healthInsuranceSelf
        .allowed;

    case "pensionInsurance":
      return result
        .retirementDeductions
        .pensionInsurance
        .allowed;

    case "rmf":
      return result
        .retirementDeductions
        .rmf
        .allowed;

    case "thaiEsg":
      return result
        .generalDeductions
        .thaiEsg
        .allowed;
  }
}


function getTrackedDeductionAllowed(
  result: TaxResult
): Partial<
  Record<
    PlanningSideEffectKey,
    number
  >
> {
  return {
    lifeInsurance:
      result.insuranceDeductions
        .lifeInsurance.allowed,

    healthInsuranceSelf:
      result.insuranceDeductions
        .healthInsuranceSelf.allowed,

    pensionInsurance:
      result.retirementDeductions
        .pensionInsurance.allowed,

    providentFund:
      result.retirementDeductions
        .providentFund.allowed,

    gpf:
      result.retirementDeductions
        .gpf.allowed,

    privateTeacherFund:
      result.retirementDeductions
        .privateTeacherFund.allowed,

    nsf:
      result.retirementDeductions
        .nsf.allowed,

    rmf:
      result.retirementDeductions
        .rmf.allowed,

    thaiEsg:
      result.generalDeductions
        .thaiEsg.allowed,

    socialSecurity:
      result.generalDeductions
        .socialSecurity.allowed,

    homeLoanInterest:
      result.generalDeductions
        .homeLoanInterest.allowed,

    socialEnterpriseInvestment:
      result.generalDeductions
        .socialEnterpriseInvestment
        .allowed,

    solarRooftop:
      result.generalDeductions
        .solarRooftop?.allowed ?? 0,

    artPurchase:
      result.generalDeductions
        .artPurchase?.allowed ?? 0,

    specialDonation:
      result.donationDeductions
        .specialDonation.allowed,

    generalDonation:
      result.donationDeductions
        .generalDonation.allowed,

    airForceStupaDonation:
      result.donationDeductions
        .airForceStupaDonation
        ?.allowed ?? 0,

    politicalDonation:
      result.donationDeductions
        .politicalDonation.allowed,
  };
}

export function applyPlanningToDeductions(
  current: DeductionData,
  planning?: PlanningData
): DeductionData {
  const safe =
    safePlanning(planning);

  return {
    ...current,

    lifeInsurance:
      current.lifeInsurance +
      safe.lifeInsurance,

    healthInsuranceSelf:
      current.healthInsuranceSelf +
      safe.healthInsuranceSelf,

    pensionInsurance:
      current.pensionInsurance +
      safe.pensionInsurance,

    rmf:
      current.rmf +
      safe.rmf,

    thaiEsg:
      current.thaiEsg +
      safe.thaiEsg,
  };
}


/*
 * คำนวณว่า planning แต่ละรายการ
 * ทำให้ "ค่าลดหย่อนรวมที่ใช้ได้จริง"
 * เพิ่มขึ้นเท่าไร
 *
 * ไม่คำนวณ tax rules ที่นี่
 * แต่ให้ caller ส่ง Tax Engine
 * ผ่าน getAllowedTotal เข้ามา
 */
export function calculatePlanningUsage(
  current: DeductionData,
  planning: PlanningData | undefined,
  getAllowedTotal: (
    deductions: DeductionData
  ) => number
): PlanningData {
  const safe =
    safePlanning(planning);

  const cumulative =
    emptyPlanning();

  const usage =
    emptyPlanning();

  let previousAllowed =
    getAllowedTotal(current);

  for (
    const key of
    planningFieldOrder
  ) {
    const amount =
      safe[key];

    if (amount <= 0) {
      continue;
    }

    cumulative[key] =
      amount;

    const nextDeductions =
      applyPlanningToDeductions(
        current,
        cumulative
      );

    const nextAllowed =
      getAllowedTotal(
        nextDeductions
      );

    usage[key] =
      Math.max(
        0,
        nextAllowed -
          previousAllowed
      );

    previousAllowed =
      nextAllowed;
  }

  return usage;
}

export function calculatePlanningUsageDetails(
  current: DeductionData,
  planning: PlanningData | undefined,
  getTaxResult: (
    deductions: DeductionData
  ) => TaxResult
): PlanningUsageResult {
  const safe =
    safePlanning(planning);

  const cumulative =
    emptyPlanning();

  const details: PlanningUsageResult = {
    lifeInsurance: {
      planned: 0,
      allowedAdditional: 0,
      excess: 0,
      netDeductionChange: 0,
      sideEffects: [],
      reasons: [],
    },

    healthInsuranceSelf: {
      planned: 0,
      allowedAdditional: 0,
      excess: 0,
      netDeductionChange: 0,
      sideEffects: [],
      reasons: [],
    },

    pensionInsurance: {
      planned: 0,
      allowedAdditional: 0,
      excess: 0,
      netDeductionChange: 0,
      sideEffects: [],
      reasons: [],
    },

    rmf: {
      planned: 0,
      allowedAdditional: 0,
      excess: 0,
      netDeductionChange: 0,
      sideEffects: [],
      reasons: [],
    },

    thaiEsg: {
      planned: 0,
      allowedAdditional: 0,
      excess: 0,
      netDeductionChange: 0,
      sideEffects: [],
      reasons: [],
    },
  };

  let previousResult =
    getTaxResult(current);

  for (
    const key of
    planningFieldOrder
  ) {
    const amount =
      safe[key];

    if (amount <= 0) {
      continue;
    }

    cumulative[key] =
      amount;

    const nextDeductions =
      applyPlanningToDeductions(
        current,
        cumulative
      );

    const nextResult =
      getTaxResult(
        nextDeductions
      );

    const previousFieldAllowed =
      getPlanningFieldAllowed(
        previousResult,
        key
      );

    const nextFieldAllowed =
      getPlanningFieldAllowed(
        nextResult,
        key
      );

    const allowedAdditional =
      Math.max(
        0,
        nextFieldAllowed -
          previousFieldAllowed
      );

    const netDeductionChange =
      nextResult.totalCurrentDeductions -
      previousResult.totalCurrentDeductions;

    const beforeAllowed =
      getTrackedDeductionAllowed(
        previousResult
      );

    const afterAllowed =
      getTrackedDeductionAllowed(
        nextResult
      );

    const sideEffects:
      PlanningSideEffect[] =
        Object.entries(
          afterAllowed
        )
          .map(
            ([rawKey, after]) => {
              const sideEffectKey =
                rawKey as PlanningSideEffectKey;

              /*
              * รายการที่กำลังวางแผน
              * ไม่ถือเป็น side effect
              */
              if (
                sideEffectKey === key
              ) {
                return null;
              }

              const before =
                beforeAllowed[
                  sideEffectKey
                ] ?? 0;

              const afterAllowedValue =
                after ?? 0;

              const change =
                afterAllowedValue -
                before;

              if (change === 0) {
                return null;
              }

              return {
                key:
                  sideEffectKey,

                beforeAllowed:
                  before,

                afterAllowed:
                  afterAllowedValue,

                change,
              };
            }
          )
          .filter(
            (
              item
            ): item is PlanningSideEffect =>
              item !== null
          );

    const excess =
      Math.max(
        0,
        amount -
          allowedAdditional
      );

    const reasons:
      PlanningLimitReason[] = [];

    /*
     * -------------------------
     * Life + Health
     * -------------------------
     *
     * ใช้ metadata ที่มาจาก
     * Tax Engine เท่านั้น
     * ไม่มี tax rule hardcode ที่นี่
     */

    if (
      excess > 0 &&
      (
        key ===
          "lifeInsurance" ||
        key ===
          "healthInsuranceSelf"
      )
    ) {
      const insurance =
        previousResult
          .insuranceDeductions;

      /*
       * Health มีเพดานเฉพาะ
       */
      if (
        key ===
        "healthInsuranceSelf"
      ) {
        const limit =
          insurance.limits
            .healthSelfMax;

        const used =
          insurance
            .healthInsuranceSelf
            .allowed;

        const remaining =
          Math.max(
            0,
            limit - used
          );

        if (
          amount >
          remaining
        ) {
          reasons.push({
            type:
              "individual_limit",

            title:
              "ติดเพดานประกันสุขภาพตนเอง",

            limit,
            used,
            remaining,
          });
        }
      }

      /*
       * Life + Health
       * ใช้เพดานร่วมกัน
       */
      const combinedLimit =
        insurance.limits
          .lifeAndHealthCombinedMax;

      const combinedUsed =
        insurance
          .lifeInsurance
          .allowed +
        insurance
          .healthInsuranceSelf
          .allowed;

      const combinedRemaining =
        Math.max(
          0,
          combinedLimit -
            combinedUsed
        );

      if (
        amount >
        combinedRemaining
      ) {
        reasons.push({
          type:
            "combined_limit",

          title:
            "ติดเพดานประกันชีวิตและสุขภาพรวม",

          limit:
            combinedLimit,

          used:
            combinedUsed,

          remaining:
            combinedRemaining,
        });
      }
    }

    /*
     * -------------------------
     * Pension insurance
     * -------------------------
     *
     * แยกเพดานส่วนเพิ่มออกเป็น
     * - เพดานตาม % ของเงินได้
     * - เพดานสูงสุดของรายการ
     *
     * ส่วน shared retirement ceiling
     * จะเพิ่มเป็นอีก reason ในขั้นถัดไป
     */
    if (
      excess > 0 &&
      key === "pensionInsurance"
    ) {
      const retirement =
        previousResult
          .retirementDeductions;

      const pensionPaid =
        retirement
          .pensionInsurance
          .paid;

      /*
       * ordinary life room
       * ที่มีอยู่ก่อน Pension ใช้สิทธิ
       */
      const lifeRoomBeforePension =
        retirement
          .pensionLifeRoomAvailable;

      const lifeRoomUsed =
        retirement
          .pensionUsedAsLifeInsurance;

      const lifeRoomRemaining =
        Math.max(
          0,
          lifeRoomBeforePension -
            lifeRoomUsed
        );

      /*
       * Pension ส่วนที่อยู่นอก
       * ordinary life room
       */
      const currentExtraPaid =
        Math.max(
          0,
          pensionPaid -
            lifeRoomUsed
        );

      const incomeLimit =
        retirement.limits
          .pensionIncomeLimit;

      const absoluteLimit =
        retirement.limits
          .pensionExtraMax;

      const effectiveExtraLimit =
        Math.min(
          incomeLimit,
          absoluteLimit
        );

      const extraUsed =
        Math.min(
          currentExtraPaid,
          effectiveExtraLimit
        );

      const extraRemaining =
        Math.max(
          0,
          effectiveExtraLimit -
            extraUsed
        );

      /*
       * Planning Pension ยังสามารถ
       * ใช้ ordinary life room ที่เหลือ
       * ก่อนเข้าสู่ pension extra limit
       */
      const pensionSpecificRemaining =
        lifeRoomRemaining +
        extraRemaining;

      if (
        amount >
        pensionSpecificRemaining
      ) {
        /*
         * ถ้า % ของรายได้เป็นตัวจำกัด
         */
        if (
          incomeLimit <=
          absoluteLimit
        ) {
          reasons.push({
            type:
              "income_percentage_limit",

            title:
              "ติดเพดานประกันบำนาญตามรายได้",

            limit:
              incomeLimit,

            used:
              extraUsed,

            remaining:
              extraRemaining,

            incomeRate:
              retirement.limits
                .pensionIncomeRate,

            assessableIncome:
              previousResult
                .totalGrossIncome,
          });
        } else {
          /*
           * ถ้าเพดาน 200,000
           * เป็นตัวจำกัดก่อน
           */
          reasons.push({
            type:
              "individual_limit",

            title:
              "ติดเพดานประกันบำนาญส่วนเพิ่ม",

            limit:
              absoluteLimit,

            used:
              extraUsed,

            remaining:
              extraRemaining,
          });
        }
      }

      /*
       * Planning Pension ใช้
       * ordinary life room ก่อน
       *
       * เฉพาะส่วนที่เหลือจึงต้อง
       * ใช้ retirement shared ceiling
       */
      const planningLifeRoomUsed =
        Math.min(
          amount,
          lifeRoomRemaining
        );

      const planningExtraEligible =
        Math.min(
          Math.max(
            0,
            amount -
              planningLifeRoomUsed
          ),
          extraRemaining
        );

      const sharedLimit =
        retirement.limits
          .sharedMax;

      const sharedRemaining =
        retirement
          .sharedLimitRemaining;

      const sharedUsed =
        Math.max(
          0,
          sharedLimit -
            sharedRemaining
        );

      if (
        planningExtraEligible >
        sharedRemaining
      ) {
        reasons.push({
          type:
            "shared_retirement_limit",

          title:
            "ติดเพดานกลุ่มเกษียณรวม",

          limit:
            sharedLimit,

          used:
            sharedUsed,

          remaining:
            sharedRemaining,
        });
      }
    }

    /*
     * -------------------------
     * RMF
     * -------------------------
     *
     * ขั้นนี้ตรวจเฉพาะ
     * - % ของเงินได้
     * - เพดานสูงสุดของ RMF
     *
     * retirement shared ceiling
     * จะเพิ่มในขั้นถัดไป
     */
    if (
      excess > 0 &&
      key === "rmf"
    ) {
      const retirement =
        previousResult
          .retirementDeductions;

      const rmfPaid =
        retirement.rmf.paid;

      const incomeLimit =
        retirement.limits
          .rmfIncomeLimit;

      const absoluteLimit =
        retirement.limits
          .rmfMax;

      const effectiveLimit =
        Math.min(
          incomeLimit,
          absoluteLimit
        );

      const used =
        Math.min(
          rmfPaid,
          effectiveLimit
        );

      const remaining =
        Math.max(
          0,
          effectiveLimit -
            used
        );

      if (
        amount >
        remaining
      ) {
        /*
         * 30% ของรายได้
         * เป็นตัวจำกัดก่อน
         */
        if (
          incomeLimit <=
          absoluteLimit
        ) {
          reasons.push({
            type:
              "income_percentage_limit",

            title:
              "ติดเพดาน RMF ตามรายได้",

            limit:
              incomeLimit,

            used,

            remaining,

            incomeRate:
              retirement.limits
                .rmfIncomeRate,

            assessableIncome:
              previousResult
                .totalGrossIncome,
          });
        } else {
          /*
           * เพดานสูงสุดของ RMF
           * เป็นตัวจำกัดก่อน
           */
          reasons.push({
            type:
              "individual_limit",

            title:
              "ติดเพดาน RMF สูงสุด",

            limit:
              absoluteLimit,

            used,

            remaining,
          });
        }
      }

      /*
       * -------------------------
       * Retirement shared ceiling
       * -------------------------
       *
       * ตรวจเฉพาะส่วนของ Planning RMF
       * ที่ยังมีสิทธิตามเพดานเฉพาะ RMF
       * ว่าถูกจำกัดด้วยเพดานกลุ่มรวมอีกหรือไม่
       */
      const sharedLimit =
        retirement.limits
          .sharedMax;

      const sharedRemaining =
        retirement
          .sharedLimitRemaining;

      const sharedUsed =
        Math.max(
          0,
          sharedLimit -
            sharedRemaining
        );

      const planningEligible =
        Math.min(
          amount,
          remaining
        );

      if (
        planningEligible >
        sharedRemaining
      ) {
        reasons.push({
          type:
            "shared_retirement_limit",

          title:
            "ติดเพดานกลุ่มเกษียณรวม",

          limit:
            sharedLimit,

          used:
            sharedUsed,

          remaining:
            sharedRemaining,
        });
      }
    }

    /*
     * -------------------------
     * Thai ESG
     * -------------------------
     */
    if (
      excess > 0 &&
      key === "thaiEsg"
    ) {
      const general =
        previousResult
          .generalDeductions;

      const thaiEsgPaid =
        general.thaiEsg.paid;

      const incomeLimit =
        general.limits
          .thaiEsgIncomeLimit;

      const absoluteLimit =
        general.limits
          .thaiEsgMax;

      const effectiveLimit =
        Math.min(
          incomeLimit,
          absoluteLimit
        );

      const used =
        Math.min(
          thaiEsgPaid,
          effectiveLimit
        );

      const remaining =
        Math.max(
          0,
          effectiveLimit -
            used
        );

      if (
        amount >
        remaining
      ) {
        if (
          incomeLimit <=
          absoluteLimit
        ) {
          reasons.push({
            type:
              "income_percentage_limit",

            title:
              "ติดเพดาน Thai ESG ตามรายได้",

            limit:
              incomeLimit,

            used,

            remaining,

            incomeRate:
              general.limits
                .thaiEsgIncomeRate,

            assessableIncome:
              previousResult
                .totalGrossIncome,
          });
        } else {
          reasons.push({
            type:
              "individual_limit",

            title:
              "ติดเพดาน Thai ESG สูงสุด",

            limit:
              absoluteLimit,

            used,

            remaining,
          });
        }
      }
    }

    details[key] = {
      planned: amount,

      allowedAdditional,

      netDeductionChange,

      excess,

      sideEffects,

      reasons,
    };

    previousResult =
      nextResult;
  }

  return details;
}

export function calculatePlanningCapacity(
  current: DeductionData,
  getTaxResult: (
    deductions: DeductionData
  ) => TaxResult
): PlanningData {
  const currentResult =
    getTaxResult(current);

  /*
   * จำนวนสำหรับใช้ probe แต่ละรายการ
   *
   * ไม่ใช่ Tax Rule ใหม่
   * แต่ดึงเพดานที่ Tax Engine
   * ส่งออกมาอยู่แล้ว เพื่อให้ยอด
   * มากพอที่จะชนเพดานแน่นอน
   */
  const probeAmounts: PlanningData = {
    lifeInsurance:
      currentResult
        .insuranceDeductions
        .limits
        .lifeAndHealthCombinedMax,

    healthInsuranceSelf:
      currentResult
        .insuranceDeductions
        .limits
        .healthSelfMax,

    pensionInsurance:
      currentResult
        .retirementDeductions
        .pensionLifeRoomAvailable +
      currentResult
        .retirementDeductions
        .limits
        .pensionExtraMax,

    rmf:
      currentResult
        .retirementDeductions
        .limits
        .rmfMax,

    thaiEsg:
      currentResult
        .generalDeductions
        .limits
        .thaiEsgMax,
  };

  const capacity =
    emptyPlanning();

  for (
    const key of
    planningFieldOrder
  ) {
    const probe =
      emptyPlanning();

    /*
    * Capacity ในฟังก์ชันนี้หมายถึง:
    *
    * "จาก current deductions
    * ถ้าเพิ่มรายการนี้เพียงรายการเดียว
    * จะทำให้ deduction เพิ่มได้อีก
    * สูงสุดเท่าไร"
    *
    * จึง probe ทีละรายการจาก current
    * และไม่รวม planning ของ field อื่น
    *
    * ไม่ใช่ remaining capacity
    * หลังรวม planning ทุก field แล้ว
    */
    probe[key] =
      probeAmounts[key];

    const details =
      calculatePlanningUsageDetails(
        current,
        probe,
        getTaxResult
      );

    capacity[key] =
      details[key]
        .allowedAdditional;
  }

  return capacity;
}