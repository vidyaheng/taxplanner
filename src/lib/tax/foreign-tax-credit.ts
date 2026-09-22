import type {
  ForeignTaxCreditResult,
} from "@/types/taxResult";

import type {
  ForeignIncomeAggregateResult,
  ForeignIncomeSection,
} from "./foreign-income-aggregate";

export interface ForeignTaxCreditEligibilityDecision {
  section: ForeignIncomeSection;

  id: string;

  /*
   * true
   * = ตรวจ DTA แล้วว่ามีสิทธิ FTC
   *
   * false
   * = ตรวจแล้วว่าไม่มีสิทธิ
   *
   * null
   * = ยังตรวจไม่ครบ
   */
  isEligible: boolean | null;

  /*
   * จำนวนภาษีต่างประเทศของยอดที่นำเข้า
   * ที่สามารถนำมาพิจารณา FTC ได้
   * หลังตรวจ taxing right / tax rate cap
   * ตาม DTA ของประเทศ + ประเภทเงินได้แล้ว
   *
   * null / undefined
   * = ยังตรวจจำนวนไม่ได้ครบ
   *
   * ใช้เฉพาะเมื่อ isEligible = true
   */
  creditableForeignTaxPaidForRemittedIncome?:
    number | null;
}

export function buildForeignTaxCreditEligibilityDecisions(
  foreignAggregate: ForeignIncomeAggregateResult
): ForeignTaxCreditEligibilityDecision[] {
  return foreignAggregate.items.map(
    (item) => {
      const review =
        item.foreignTaxCreditDtaReview;

      if (!review) {
        return {
          section: item.section,
          id: item.id,
          isEligible: null,
        };
      }

      if (!review.isEligible) {
        return {
          section: item.section,
          id: item.id,
          isEligible: false,
        };
      }

      return {
        section: item.section,
        id: item.id,
        isEligible: true,

        creditableForeignTaxPaidForRemittedIncome:
          review
            .creditableForeignTaxPaidForRemittedIncome ??
          null,
      };
    }
  );
}

export interface CalculateForeignTaxCreditInput {
  /*
   * ผล foreign aggregation
   * ที่ผ่าน taxability/remittance
   * มาแล้ว
   */
  foreignAggregate:
    ForeignIncomeAggregateResult;

  /*
   * (K)
   * เงินได้พึงประเมินรวมทุกแหล่ง
   * ก่อนหักค่าใช้จ่ายและค่าลดหย่อน
   */
  totalGrossIncome: number;

  /*
   * (L)
   * ภาษีไทยที่ใช้เป็นฐาน
   * สำหรับ Credit Limitation
   *
   * ยังไม่ผูกกับ Engine field ใด
   * จนกว่าจะตรวจตำแหน่ง L
   * ตอน integration
   */
  thaiTaxForCreditLimitation: number;

  /*
   * ผลการตรวจสิทธิ DTA
   * แยกราย foreign income item
   */
  eligibility:
    ForeignTaxCreditEligibilityDecision[];
}

function itemKey(
  section: ForeignIncomeSection,
  id: string
) {
  return `${section}:${id}`;
}

interface CountryAccumulator {
  country: string;

  foreignIncomeRemitted: number;

  /*
   * O ตามข้อมูลจริง
   */
  foreignTaxPaidForRemittedIncome:
    number;

  /*
   * ส่วนของ O ที่ผ่าน
   * DTA review แล้ว
   */
  creditableForeignTaxPaidForRemittedIncome:
    number;
}

export function calculateForeignTaxCredit({
  foreignAggregate,
  totalGrossIncome,
  thaiTaxForCreditLimitation,
  eligibility,
}: CalculateForeignTaxCreditInput):
  ForeignTaxCreditResult {
  const grossIncome =
    Math.max(
      0,
      totalGrossIncome
    );

  const thaiTax =
    Math.max(
      0,
      thaiTaxForCreditLimitation
    );

  const eligibilityByItem =
    new Map<
        string,
        ForeignTaxCreditEligibilityDecision
    >();

    for (
    const decision of eligibility
    ) {
    eligibilityByItem.set(
        itemKey(
        decision.section,
        decision.id
        ),
        decision
    );
    }

  const countryMap =
    new Map<
      string,
      CountryAccumulator
    >();

  let isComplete =
    foreignAggregate.isComplete;

  for (
    const item of
    foreignAggregate.items
  ) {
    /*
     * FTC พิจารณาเฉพาะ foreign income
     * ที่ taxable และนำเข้าไทย
     */
    if (
      !item.isComplete ||
      !item.isTaxable ||
      item.taxableRemittance <= 0
    ) {
      continue;
    }

    const actualForeignTax =
      Math.max(
        0,
        item
          .foreignTaxPaidAttributableToRemittance
      );

    /*
    * ไม่มีภาษีต่างประเทศของยอดที่นำเข้า
    * จึงไม่มี FTC ที่ต้องตรวจ DTA
    */
    if (actualForeignTax <= 0) {
      continue;
    }

    const eligibilityDecision =
        eligibilityByItem.get(
            itemKey(
            item.section,
            item.id
            )
        );

        if (
        eligibilityDecision ===
            undefined ||
        eligibilityDecision.isEligible ===
            null
        ) {
        isComplete = false;

        continue;
        }

        if (
          !eligibilityDecision.isEligible
        ) {
          const country =
            item.country.trim();

          /*
          * แม้ไม่มีสิทธิ FTC
          * ยังต้องเก็บ foreign tax ที่จ่ายจริง
          * เพื่อ reporting / disallowed credit
          */
          if (!country) {
            isComplete = false;

            continue;
          }

          const actualForeignTax =
            Math.max(
              0,
              item
                .foreignTaxPaidAttributableToRemittance
            );

          const current =
            countryMap.get(country) ?? {
              country,

              foreignIncomeRemitted: 0,

              foreignTaxPaidForRemittedIncome:
                0,

              creditableForeignTaxPaidForRemittedIncome:
                0,
            };

          current.foreignIncomeRemitted +=
            Math.max(
              0,
              item.taxableRemittance
            );

          current
            .foreignTaxPaidForRemittedIncome +=
            actualForeignTax;

          /*
          * ไม่มีสิทธิ FTC
          * ดังนั้น DTA-creditable tax = 0
          */
          countryMap.set(
            country,
            current
          );

          continue;
        }

        const dtaCreditableTax =
        eligibilityDecision
            .creditableForeignTaxPaidForRemittedIncome;

        /*
        * มีสิทธิ แต่ยังไม่ทราบ
        * จำนวนที่ผ่าน DTA cap
        * ห้ามเดาเป็น foreign tax เต็มก้อน
        */
        if (
        dtaCreditableTax ===
            undefined ||
        dtaCreditableTax === null
        ) {
        isComplete = false;

        continue;
        }

        /*
        * defensive:
        * จำนวนที่เครดิตได้ตาม DTA
        * ห้ามมากกว่าภาษีที่จ่ายจริง
        */
        const creditableForeignTax =
        Math.min(
            actualForeignTax,
            Math.max(
            0,
            dtaCreditableTax
            )
        );

    const country =
      item.country.trim();

    /*
     * ไม่มีประเทศ
     * ไม่สามารถทำ credit limitation
     * รายประเทศได้
     */
    if (!country) {
      isComplete = false;

      continue;
    }

    const current =
      countryMap.get(country) ?? {
        country,

        foreignIncomeRemitted: 0,

        foreignTaxPaidForRemittedIncome:
          0,

        creditableForeignTaxPaidForRemittedIncome:
            0,
      };

    current.foreignIncomeRemitted +=
        Math.max(
            0,
            item.taxableRemittance
        );

        /*
        * ภาษีต่างประเทศที่จ่ายจริง
        * สำหรับ reporting
        */
        current
        .foreignTaxPaidForRemittedIncome +=
        actualForeignTax;

        /*
        * จำนวนที่ผ่าน DTA review แล้ว
        * สำหรับนำไปคำนวณ FTC
        */
        current
        .creditableForeignTaxPaidForRemittedIncome +=
        creditableForeignTax;

    countryMap.set(
      country,
      current
    );
  }

  const byCountry =
    Array.from(
      countryMap.values()
    )
      .sort(
        (a, b) =>
          a.country.localeCompare(
            b.country
          )
      )
      .map((country) => {
        /*
         * (P)
         * = N / K × L
         */
        const thaiTaxCreditLimit =
          grossIncome > 0
            ? (
                country
                  .foreignIncomeRemitted /
                grossIncome
              ) * thaiTax
            : 0;

        /*
         * (Q)
         * = min(O, P)
         */
        const allowedCredit =
            Math.min(
                country
                .creditableForeignTaxPaidForRemittedIncome,

                Math.max(
                0,
                thaiTaxCreditLimit
                )
            );

        const disallowedCredit =
          Math.max(
            0,

            country
              .foreignTaxPaidForRemittedIncome -
              allowedCredit
          );

        return {
          country:
            country.country,

          foreignIncomeRemitted:
            country
              .foreignIncomeRemitted,

          foreignTaxPaidForRemittedIncome:
            country
              .foreignTaxPaidForRemittedIncome,

          thaiTaxCreditLimit,

          allowedCredit,

          disallowedCredit,
        };
      });

  const totalForeignTaxPaidForRemittedIncome =
    byCountry.reduce(
      (total, country) =>
        total +
        country
          .foreignTaxPaidForRemittedIncome,
      0
    );

  const totalAllowedCredit =
    byCountry.reduce(
      (total, country) =>
        total +
        country.allowedCredit,
      0
    );

  const totalDisallowedCredit =
    byCountry.reduce(
      (total, country) =>
        total +
        country.disallowedCredit,
      0
    );

  return {
    byCountry,

    totalForeignTaxPaidForRemittedIncome,

    totalAllowedCredit,

    totalDisallowedCredit,

    isComplete,
  };
}