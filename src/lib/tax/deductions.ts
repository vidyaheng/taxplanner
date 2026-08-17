import {
  DeductionData,
  DeductionUsageItem,
  InsuranceDeductionResult,
  RetirementDeductionResult,
  GeneralDeductionResult,
  PregnancyDeductionResult,
  DonationDeductionResult,
} from "@/types/deductions";
import { FamilyData } from "@/types/family";
import { TaxRuleSet } from "@/tax-rules/types";

function usage(
  paid: number,
  allowed: number
): DeductionUsageItem {
  return {
    paid,
    allowed,
    excess: Math.max(
      0,
      paid - allowed
    ),
  };
}

export function calculateInsuranceDeductions({
  deductions,
  family,
  rules,
}: {
  deductions: DeductionData;
  family: FamilyData;
  rules: TaxRuleSet;
}): InsuranceDeductionResult {
  const warnings: string[] = [];

  const insuranceRules =
    rules.deductions.insurance;

  /*
 * ประกันชีวิตใช้สิทธิก่อน
 * สูงสุดภายใต้เพดานรวม 100,000
 */
const lifeAllowed =
  Math.min(
    deductions.lifeInsurance,
    insuranceRules.lifeAndHealthCombinedMax
  );

/*
 * ประกันสุขภาพตนเอง
 * - ตัวเองไม่เกิน 25,000
 * - Life + Health รวมไม่เกิน 100,000
 */
const remainingHealthRoom =
  Math.max(
    0,
    insuranceRules.lifeAndHealthCombinedMax -
      lifeAllowed
  );

const healthAllowed =
  Math.min(
    deductions.healthInsuranceSelf,
    insuranceRules.healthSelfMax,
    remainingHealthRoom
  );

  /*
   * ประกันชีวิตคู่สมรส
   */
  let spouseLifeAllowed = 0;

  if (
    deductions.spouseLifeInsurance > 0
  ) {
    if (
      family.maritalStatus === "married" &&
      !family.spouseHasIncome &&
      family.marriedFullTaxYear
    ) {
      spouseLifeAllowed =
        Math.min(
          deductions.spouseLifeInsurance,
          insuranceRules.spouseLifeMax
        );
    } else {
      warnings.push(
        "เบี้ยประกันชีวิตคู่สมรสยังไม่ถูกนำมาใช้สิทธิ เพราะต้องเป็นคู่สมรสไม่มีเงินได้และมีความเป็นสามีภริยาตลอดปีภาษี"
      );
    }
  }

  /*
   * ประกันสุขภาพบิดา / มารดา
   *
   * ไม่ใช้เงื่อนไขอายุ 60 ปี
   * แต่ต้องตรวจเรื่องเงินได้ของบิดา/มารดา
   */
  const hasEligibleParent =
    family.parents.some(
      (parent) => {
        const incomeEligible =
          parent.annualAssessableIncome <=
          rules.eligibility
            .parentIncomeLimitInclusive;

        const spouseParentEligible =
          parent.owner === "taxpayer" ||
          (
            parent.owner === "spouse" &&
            family.maritalStatus ===
              "married" &&
            !family.spouseHasIncome
          );

        return (
          incomeEligible &&
          spouseParentEligible
        );
      }
    );

  let parentHealthAllowed = 0;

  if (
    deductions.parentHealthInsurance > 0
  ) {
    if (hasEligibleParent) {
      parentHealthAllowed =
        Math.min(
          deductions.parentHealthInsurance,
          insuranceRules.parentHealthMax
        );
    } else {
      warnings.push(
        "มีเบี้ยประกันสุขภาพบิดา/มารดา แต่ยังไม่มีข้อมูลบิดา/มารดาที่เข้าเงื่อนไขในหน้าครอบครัว"
      );
    }
  }

  const life =
    usage(
      deductions.lifeInsurance,
      lifeAllowed
    );

  const health =
    usage(
      deductions.healthInsuranceSelf,
      healthAllowed
    );

  const spouse =
    usage(
      deductions.spouseLifeInsurance,
      spouseLifeAllowed
    );

  const parent =
    usage(
      deductions.parentHealthInsurance,
      parentHealthAllowed
    );

  const totalPaid =
    life.paid +
    health.paid +
    spouse.paid +
    parent.paid;

  const totalAllowed =
    life.allowed +
    health.allowed +
    spouse.allowed +
    parent.allowed;

  return {
    lifeInsurance: life,

    healthInsuranceSelf:
      health,

    spouseLifeInsurance:
      spouse,

    parentHealthInsurance:
      parent,

    totalPaid,

    totalAllowed,

    totalExcess:
      Math.max(
        0,
        totalPaid -
          totalAllowed
      ),

    limits: {
      lifeAndHealthCombinedMax:
        insuranceRules
          .lifeAndHealthCombinedMax,

      healthSelfMax:
        insuranceRules
          .healthSelfMax,
    },

    warnings,
  };
}

export function calculateRetirementDeductions({
  deductions,
  rules,
  assessableIncome,
  providentFundWageBase,
  ordinaryLifeRoom,
}: {
  deductions: DeductionData;
  rules: TaxRuleSet;

  /*
   * เงินได้พึงประเมินที่ใช้เป็นฐาน
   * RMF และประกันบำนาญ
   */
  assessableIncome: number;

  /*
   * ตอนนี้ใช้เงินเดือน 12 เดือน
   * เป็นฐานค่าจ้าง PVD
   */
  providentFundWageBase: number;

  /*
   * พื้นที่ประกันชีวิตปกติ
   * 100,000 ที่ยังเหลือ
   */
  ordinaryLifeRoom: number;
}): RetirementDeductionResult {
  const retirementRules =
    rules.deductions.retirement;

  const warnings: string[] = [];

  /*
   * -------------------------
   * Pension insurance
   * -------------------------
   *
   * ใช้พื้นที่ประกันชีวิตปกติก่อน
   */
  const pensionUsedAsLifeInsurance =
    Math.min(
      deductions.pensionInsurance,
      ordinaryLifeRoom
    );

  const pensionRemaining =
    Math.max(
      0,
      deductions.pensionInsurance -
        pensionUsedAsLifeInsurance
    );

  const pensionIncomeLimit =
    assessableIncome *
    retirementRules
      .pensionIncomeRate;  

  const pensionExtraCandidate =
    Math.min(
      pensionRemaining,

      pensionIncomeLimit,

      retirementRules.pensionExtraMax
    );

  /*
   * -------------------------
   * Provident Fund
   * -------------------------
   */
  const providentFundCandidate =
    Math.min(
      deductions.providentFund,

      providentFundWageBase *
        retirementRules.providentFundWageRate,

      retirementRules.providentFundMax
    );

  if (
    deductions.providentFund > 0 &&
    providentFundWageBase <= 0
  ) {
    warnings.push(
      "มีเงินสะสมกองทุนสำรองเลี้ยงชีพ แต่ยังไม่มีฐานค่าจ้างสำหรับตรวจเพดาน 15%"
    );
  }

  /*
   * -------------------------
   * Other retirement funds
   * -------------------------
   */
  const gpfCandidate =
    Math.min(
      deductions.gpf,
      retirementRules.gpfMax
    );

  const privateTeacherCandidate =
    Math.min(
      deductions.privateTeacherFund,
      retirementRules.privateTeacherFundMax
    );

  const nsfCandidate =
    Math.min(
      deductions.nsf,
      retirementRules.nsfMax
    );

  const rmfIncomeLimit =
    assessableIncome *
    retirementRules
      .rmfIncomeRate;

  const rmfCandidate =
    Math.min(
      deductions.rmf,

      rmfIncomeLimit,

      retirementRules.rmfMax
    );

  /*
   * -------------------------
   * Shared 500,000 ceiling
   * -------------------------
   *
   * สำหรับ Planner เราจัด allocation:
   *
   * PVD
   * → GPF
   * → Teacher Fund
   * → NSF
   * → Pension extra
   * → RMF
   *
   * เพื่อให้เงินสะสมเดิม/ภาคบังคับใช้พื้นที่ก่อน
   */
  let remainingSharedRoom =
    retirementRules.sharedMax;

  function allocate(
    candidate: number
  ) {
    const allowed =
      Math.min(
        candidate,
        remainingSharedRoom
      );

    remainingSharedRoom -=
      allowed;

    return allowed;
  }

  const providentFundAllowed =
    allocate(
      providentFundCandidate
    );

  const gpfAllowed =
    allocate(
      gpfCandidate
    );

  const privateTeacherAllowed =
    allocate(
      privateTeacherCandidate
    );

  const nsfAllowed =
    allocate(
      nsfCandidate
    );

  const pensionExtraAllowed =
    allocate(
      pensionExtraCandidate
    );

  const rmfAllowed =
    allocate(
      rmfCandidate
    );

  const pensionTotalAllowed =
    pensionUsedAsLifeInsurance +
    pensionExtraAllowed;

  const provident =
    usage(
      deductions.providentFund,
      providentFundAllowed
    );

  const gpf =
    usage(
      deductions.gpf,
      gpfAllowed
    );

  const teacher =
    usage(
      deductions.privateTeacherFund,
      privateTeacherAllowed
    );

  const nsf =
    usage(
      deductions.nsf,
      nsfAllowed
    );

  const rmf =
    usage(
      deductions.rmf,
      rmfAllowed
    );

  const pension =
    usage(
      deductions.pensionInsurance,
      pensionTotalAllowed
    );

  const sharedLimitUsed =
    retirementRules.sharedMax -
    remainingSharedRoom;

  const totalPaid =
    deductions.providentFund +
    deductions.gpf +
    deductions.privateTeacherFund +
    deductions.nsf +
    deductions.rmf +
    deductions.pensionInsurance;

  const totalAllowed =
    provident.allowed +
    gpf.allowed +
    teacher.allowed +
    nsf.allowed +
    rmf.allowed +
    pension.allowed;

  const totalExcess =
    Math.max(
      0,
      totalPaid -
        totalAllowed
    );

  const totalSharedCandidates =
    providentFundCandidate +
    gpfCandidate +
    privateTeacherCandidate +
    nsfCandidate +
    pensionExtraCandidate +
    rmfCandidate;

  if (
    totalSharedCandidates >
    retirementRules.sharedMax
  ) {
    warnings.push(
      "สิทธิกลุ่มเกษียณรวมเกินเพดาน 500,000 บาท ระบบจัดสรรสิทธิให้เงินสะสมเดิมก่อน แล้วจึงประกันบำนาญและ RMF"
    );
  }

  return {
    providentFund:
      provident,

    gpf,

    privateTeacherFund:
      teacher,

    nsf,

    rmf,

    pensionInsurance:
      pension,

    pensionUsedAsLifeInsurance,

    pensionExtraAllowed,

    sharedLimitUsed,

    sharedLimitRemaining:
      remainingSharedRoom,

    totalPaid,

    totalAllowed,

    totalExcess,

    pensionLifeRoomAvailable:
      ordinaryLifeRoom,

    limits: {
      sharedMax:
        retirementRules
          .sharedMax,

      pensionIncomeRate:
        retirementRules
          .pensionIncomeRate,

      pensionIncomeLimit,

      pensionExtraMax:
        retirementRules
          .pensionExtraMax,

      rmfIncomeRate:
        retirementRules
          .rmfIncomeRate,

      rmfIncomeLimit,

      rmfMax:
        retirementRules
          .rmfMax,
    },

    warnings,
  };
}

export function calculateGeneralDeductions({
  deductions,
  rules,
  assessableIncome,
}: {
  deductions: DeductionData;

  rules: TaxRuleSet;

  assessableIncome: number;
}): GeneralDeductionResult {
  const warnings: string[] = [];

  /*
   * -------------------------
   * Social Security
   * -------------------------
   */

  const socialSecurityAllowed =
    Math.min(
      deductions.socialSecurity,
      rules.deductions.general
        .socialSecurityMax
    );

  if (
    deductions.socialSecurity >
    rules.deductions.general
      .socialSecurityMax
  ) {
    warnings.push(
      "เงินสมทบประกันสังคมที่กรอกสูงกว่าเพดานที่ระบบใช้สำหรับปี 2569 กรุณาตรวจสอบประเภทผู้ประกันตนและยอดที่จ่ายจริง"
    );
  }

  /*
   * -------------------------
   * Home Loan Interest
   * -------------------------
   */

  const homeLoanInterestAllowed =
    Math.min(
      deductions.homeLoanInterest,
      rules.deductions.general
        .homeLoanInterestMax
    );

  /*
   * -------------------------
   * Thai ESG
   * -------------------------
   */

  const thaiEsgIncomeLimit =
    assessableIncome *
    rules.deductions
      .sustainableInvestment
      .thaiEsgIncomeRate;

  const thaiEsgAllowed =
    Math.min(
      deductions.thaiEsg,
      thaiEsgIncomeLimit,
      rules.deductions
        .sustainableInvestment
        .thaiEsgMax
    );

  /*
   * -------------------------
   * Social Enterprise
   * -------------------------
   */

  const socialEnterpriseAllowed =
    Math.min(
      deductions.socialEnterpriseInvestment,
      rules.deductions.general
        .socialEnterpriseInvestmentMax
    );

  const socialSecurity =
    usage(
      deductions.socialSecurity,
      socialSecurityAllowed
    );

  const homeLoanInterest =
    usage(
      deductions.homeLoanInterest,
      homeLoanInterestAllowed
    );

  const thaiEsg =
    usage(
      deductions.thaiEsg,
      thaiEsgAllowed
    );

  const socialEnterpriseInvestment =
    usage(
      deductions.socialEnterpriseInvestment,
      socialEnterpriseAllowed
    );

  const totalPaid =
    socialSecurity.paid +
    homeLoanInterest.paid +
    thaiEsg.paid +
    socialEnterpriseInvestment.paid;

  const totalAllowed =
    socialSecurity.allowed +
    homeLoanInterest.allowed +
    thaiEsg.allowed +
    socialEnterpriseInvestment.allowed;

  const totalExcess =
    Math.max(
      0,
      totalPaid -
        totalAllowed
    );

  return {
    socialSecurity,

    homeLoanInterest,

    thaiEsg,

    socialEnterpriseInvestment,

    totalPaid,

    totalAllowed,

    totalExcess,

    limits: {
      thaiEsgIncomeRate:
        rules.deductions
          .sustainableInvestment
          .thaiEsgIncomeRate,

      thaiEsgIncomeLimit,

      thaiEsgMax:
        rules.deductions
          .sustainableInvestment
          .thaiEsgMax,
    },

    warnings,
  };
}

export function calculatePregnancyDeductions({
  family,
  rules,
}: {
  family: FamilyData;
  rules: TaxRuleSet;
}): PregnancyDeductionResult {
  const warnings: string[] = [];

  const maxPerPregnancy =
    rules.deductions.familyMedical
      .pregnancyPerPregnancyMax;

  const items =
    family.pregnancies.map(
      (pregnancy) => {
        const previousClaim =
          Math.max(
            0,
            pregnancy.claimedPreviousYears
          );

        const remainingLimitBeforeThisYear =
          Math.max(
            0,
            maxPerPregnancy -
              previousClaim
          );

        const allowedThisYear =
          Math.min(
            Math.max(
              0,
              pregnancy.paidThisYear
            ),
            remainingLimitBeforeThisYear
          );

        const excessThisYear =
          Math.max(
            0,
            pregnancy.paidThisYear -
              allowedThisYear
          );

        if (
          previousClaim >
          maxPerPregnancy
        ) {
          warnings.push(
            "พบการตั้งครรภ์ที่ระบุสิทธิจากปีก่อนเกิน 60,000 บาท กรุณาตรวจสอบข้อมูล"
          );
        }

        return {
          id: pregnancy.id,

          paidThisYear:
            pregnancy.paidThisYear,

          claimedPreviousYears:
            pregnancy.claimedPreviousYears,

          remainingLimitBeforeThisYear,

          allowedThisYear,

          excessThisYear,
        };
      }
    );

  const totalPaid =
    items.reduce(
      (total, item) =>
        total +
        item.paidThisYear,
      0
    );

  const totalAllowed =
    items.reduce(
      (total, item) =>
        total +
        item.allowedThisYear,
      0
    );

  const totalExcess =
    items.reduce(
      (total, item) =>
        total +
        item.excessThisYear,
      0
    );

  return {
    items,

    totalPaid,

    totalAllowed,

    totalExcess,

    warnings,
  };
}

export function calculateDonationDeductions({
  deductions,
  family,
  rules,
  incomeBeforeDonations,
}: {
  deductions: DeductionData;

  family: FamilyData;

  rules: TaxRuleSet;

  /*
   * เงินได้หลังหักค่าใช้จ่าย +
   * family + insurance + retirement +
   * general + pregnancy แล้ว
   *
   * แต่ยังไม่หัก donation
   */
  incomeBeforeDonations: number;
}): DonationDeductionResult {
  const warnings: string[] = [];

  const donationRules =
    rules.deductions.donation;

  /*
   * -------------------------
   * Political donation
   * -------------------------
   */

  let politicalAllowed = 0;

  if (
    deductions.politicalDonation > 0
  ) {
    if (
      family.isThaiNational === true
    ) {
      politicalAllowed =
        Math.min(
          deductions.politicalDonation,
          donationRules.politicalMax
        );
    } else if (
      family.isThaiNational === false
    ) {
      warnings.push(
        "เงินบริจาคให้พรรคการเมืองไม่ถูกนำมาใช้ลดหย่อน เนื่องจากสิทธินี้กำหนดให้ผู้มีเงินได้ต้องเป็นบุคคลธรรมดาสัญชาติไทย"
      );
    } else {
      warnings.push(
        "กรุณาระบุสัญชาติในหน้าข้อมูลครอบครัว เพื่อให้ระบบตรวจสอบสิทธิเงินบริจาคให้พรรคการเมือง"
      );
    }
  }

  const politicalDonation =
    usage(
      deductions.politicalDonation,
      politicalAllowed
    );

  /*
   * พรรคการเมืองเป็นค่าลดหย่อนก่อน
   * donation cap กลุ่มทั่วไป
   */
  const baseForSpecialDonation =
    Math.max(
      0,
      incomeBeforeDonations -
        politicalDonation.allowed
    );

  /*
   * -------------------------
   * Special donation
   * -------------------------
   *
   * ผู้ใช้กรอกยอด "จ่ายจริง"
   * Engine คูณ 2 ให้เอง
   */

  const specialDeductionBeforeCap =
    deductions.specialDonation *
    donationRules.specialMultiplier;

  const specialDonationLimit =
    baseForSpecialDonation *
    donationRules.specialLimitRate;

  const specialAllowed =
    Math.min(
      specialDeductionBeforeCap,
      specialDonationLimit
    );

  const specialDonation = {
    paid:
      deductions.specialDonation,

    multiplier:
      donationRules.specialMultiplier,

    deductionBeforeCap:
      specialDeductionBeforeCap,

    allowed:
      specialAllowed,

    disallowedDeduction:
      Math.max(
        0,
        specialDeductionBeforeCap -
          specialAllowed
      ),
  };

  /*
   * -------------------------
   * General donation
   * -------------------------
   *
   * คำนวณหลัง special donation
   */

  const baseForGeneralDonation =
    Math.max(
      0,
      baseForSpecialDonation -
        specialDonation.allowed
    );

  const generalDonationLimit =
    baseForGeneralDonation *
    donationRules.generalLimitRate;

  const generalAllowed =
    Math.min(
      deductions.generalDonation,
      generalDonationLimit
    );

  const generalDonation =
    usage(
      deductions.generalDonation,
      generalAllowed
    );

  const totalPaid =
    deductions.politicalDonation +
    deductions.specialDonation +
    deductions.generalDonation;

  /*
   * special donation ใช้ยอด deduction
   * หลังคูณ 2 ไม่ใช่ยอดที่จ่ายจริง
   */
  const totalAllowed =
    politicalDonation.allowed +
    specialDonation.allowed +
    generalDonation.allowed;

  if (
    specialDonation.disallowedDeduction >
    0
  ) {
    warnings.push(
      "เงินบริจาคที่ได้สิทธิพิเศษมีจำนวนลดหย่อนหลังคูณสิทธิเกินเพดาน 10% ระบบจึงใช้สิทธิได้เพียงบางส่วน"
    );
  }

  if (
    generalDonation.excess > 0
  ) {
    warnings.push(
      "เงินบริจาคทั่วไปเกินเพดานที่ใช้ลดหย่อนได้จากฐานเงินได้ของคุณ"
    );
  }

  return {
    politicalDonation,

    specialDonation,

    generalDonation,

    baseBeforeDonations:
      incomeBeforeDonations,

    baseForSpecialDonation,

    specialDonationLimit,

    baseForGeneralDonation,

    generalDonationLimit,

    totalPaid,

    totalAllowed,

    warnings,
  };
}