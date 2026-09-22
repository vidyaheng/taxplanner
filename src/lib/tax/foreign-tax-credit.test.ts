import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ForeignIncomeAggregateResult,
  ForeignIncomeAggregateItem,
  ForeignIncomeSectionTotals,
} from "./foreign-income-aggregate";

import {
  buildForeignTaxCreditEligibilityDecisions,
  calculateForeignTaxCredit,
} from "./foreign-tax-credit";

function emptySectionTotals():
  ForeignIncomeSectionTotals {
  return {
    section40_1: 0,
    section40_2: 0,
    section40_3Annuity: 0,
    section40_3Rights: 0,
    section40_4Interest: 0,
    section40_4Dividend: 0,
    section40_5: 0,
    section40_6: 0,
    section40_7: 0,
    section40_8: 0,
  };
}

function createAggregate(
  items:
    ForeignIncomeAggregateItem[],
  isComplete = true
): ForeignIncomeAggregateResult {
  return {
    items,

    taxableBySection:
      emptySectionTotals(),

    foreignTaxPaidOnTaxableRemittanceBySection:
      emptySectionTotals(),

    totalTaxableRemittance:
      items.reduce(
        (total, item) =>
          total +
          item.taxableRemittance,
        0
      ),

    totalForeignTaxPaidOnTaxableRemittance:
      items.reduce(
        (total, item) =>
          total +
          item
            .foreignTaxPaidAttributableToRemittance,
        0
      ),

    isComplete,
  };
}

function createItem(
  values:
    Partial<
      ForeignIncomeAggregateItem
    > = {}
): ForeignIncomeAggregateItem {
  return {
    id: "foreign-1",

    section: "section40_1",

    country: "Vietnam",

    incomeTaxYear: 2568,

    foreignIncomeAmount:
      500_000,

    remittedAmount:
      500_000,

    taxableRemittance:
      500_000,

    foreignTaxPaid:
      150_000,

    foreignTaxPaidAttributableToRemittance:
      150_000,

    isTaxable: true,

    isComplete: true,

    reason: "taxable",

    ...values,
  };
}

describe(
  "Foreign Tax Credit eligibility mapping",
  () => {
    it(
      "ยังไม่ได้ตรวจ DTA -> isEligible = null",
      () => {
        const decisions =
          buildForeignTaxCreditEligibilityDecisions(
            createAggregate([
              createItem(),
            ])
          );

        expect(decisions).toEqual([
          {
            section: "section40_1",
            id: "foreign-1",
            isEligible: null,
          },
        ]);
      }
    );

    it(
      "ตรวจแล้วว่าไม่มีสิทธิ FTC -> isEligible = false",
      () => {
        const decisions =
          buildForeignTaxCreditEligibilityDecisions(
            createAggregate([
              createItem({
                foreignTaxCreditDtaReview: {
                  isEligible: false,
                },
              }),
            ])
          );

        expect(decisions).toEqual([
          {
            section: "section40_1",
            id: "foreign-1",
            isEligible: false,
          },
        ]);
      }
    );

    it(
      "มีสิทธิ FTC และมีจำนวนหลัง DTA cap",
      () => {
        const decisions =
          buildForeignTaxCreditEligibilityDecisions(
            createAggregate([
              createItem({
                foreignTaxCreditDtaReview: {
                  isEligible: true,

                  creditableForeignTaxPaidForRemittedIncome:
                    60_000,
                },
              }),
            ])
          );

        expect(decisions).toEqual([
          {
            section: "section40_1",
            id: "foreign-1",
            isEligible: true,

            creditableForeignTaxPaidForRemittedIncome:
              60_000,
          },
        ]);
      }
    );

    it(
      "มีสิทธิ FTC แต่ยังไม่ทราบจำนวนหลัง DTA cap -> amount = null",
      () => {
        const decisions =
          buildForeignTaxCreditEligibilityDecisions(
            createAggregate([
              createItem({
                foreignTaxCreditDtaReview: {
                  isEligible: true,
                },
              }),
            ])
          );

        expect(decisions).toEqual([
          {
            section: "section40_1",
            id: "foreign-1",
            isEligible: true,

            creditableForeignTaxPaidForRemittedIncome:
              null,
          },
        ]);
      }
    );
  }
);

describe(
  "Foreign Tax Credit",
  () => {
    it(
      "คำนวณตัวอย่าง Credit Limitation: N 500,000 / K 1,500,000 × L 200,000",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem(),
              ]),

            totalGrossIncome:
              1_500_000,

            thaiTaxForCreditLimitation:
              200_000,

            eligibility: [
              {
                section:
                  "section40_1",

                id: "foreign-1",

                isEligible: true,

                creditableForeignTaxPaidForRemittedIncome:
                    150_000,
              },
            ],
          });

        const vietnam =
          result.byCountry[0];

        expect(
          vietnam
            .foreignIncomeRemitted
        ).toBe(500_000);

        expect(
          vietnam
            .foreignTaxPaidForRemittedIncome
        ).toBe(150_000);

        expect(
          vietnam
            .thaiTaxCreditLimit
        ).toBeCloseTo(
          66_666.6666667,
          5
        );

        expect(
          vietnam.allowedCredit
        ).toBeCloseTo(
          66_666.6666667,
          5
        );

        expect(
          vietnam.disallowedCredit
        ).toBeCloseTo(
          83_333.3333333,
          5
        );

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ใช้ foreign tax เต็มจำนวนเมื่อ O ต่ำกว่าเพดาน P",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem({
                  foreignIncomeAmount:
                    200_000,

                  remittedAmount:
                    200_000,

                  taxableRemittance:
                    200_000,

                  foreignTaxPaid:
                    15_000,

                  foreignTaxPaidAttributableToRemittance:
                    15_000,
                }),
              ]),

            totalGrossIncome:
              1_000_000,

            thaiTaxForCreditLimitation:
              200_000,

            eligibility: [
              {
                section:
                  "section40_1",

                id: "foreign-1",

                isEligible: true,

                creditableForeignTaxPaidForRemittedIncome:
                    15_000,
              },
            ],
          });

        /*
         * P
         * = 200,000 / 1,000,000
         *   × 200,000
         * = 40,000
         *
         * O = 15,000
         * Q = 15,000
         */
        expect(
          result.byCountry[0]
            .thaiTaxCreditLimit
        ).toBe(40_000);

        expect(
          result.byCountry[0]
            .allowedCredit
        ).toBe(15_000);

        expect(
          result.byCountry[0]
            .disallowedCredit
        ).toBe(0);
      }
    );

    it(
      "รวมหลายประเภทเงินได้ของประเทศเดียวกันก่อนคำนวณเพดานรายประเทศ",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem({
                  id: "salary",

                  section:
                    "section40_1",

                  taxableRemittance:
                    300_000,

                  remittedAmount:
                    300_000,

                  foreignTaxPaidAttributableToRemittance:
                    30_000,
                }),

                createItem({
                  id: "interest",

                  section:
                    "section40_4Interest",

                  foreignIncomeAmount:
                    200_000,

                  taxableRemittance:
                    200_000,

                  remittedAmount:
                    200_000,

                  foreignTaxPaid:
                    20_000,

                  foreignTaxPaidAttributableToRemittance:
                    20_000,
                }),
              ]),

            totalGrossIncome:
              1_000_000,

            thaiTaxForCreditLimitation:
              100_000,

            eligibility: [
              {
                section:
                  "section40_1",

                id: "salary",

                isEligible: true,

                creditableForeignTaxPaidForRemittedIncome:
                    30_000,
              },
              {
                section:
                  "section40_4Interest",

                id: "interest",

                isEligible: true,

                creditableForeignTaxPaidForRemittedIncome:
                    20_000,
              },
            ],
          });

        expect(
          result.byCountry
        ).toHaveLength(1);

        expect(
          result.byCountry[0]
            .foreignIncomeRemitted
        ).toBe(500_000);

        expect(
          result.byCountry[0]
            .foreignTaxPaidForRemittedIncome
        ).toBe(50_000);

        expect(
          result.byCountry[0]
            .thaiTaxCreditLimit
        ).toBe(50_000);

        expect(
          result.byCountry[0]
            .allowedCredit
        ).toBe(50_000);
      }
    );

    it(
      "ไม่มีภาษีต่างประเทศ ไม่ต้องบังคับตรวจ DTA",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem({
                  foreignTaxPaid: 0,
                  foreignTaxPaidAttributableToRemittance:
                    0,
                }),
              ]),

            totalGrossIncome:
              1_500_000,

            thaiTaxForCreditLimitation:
              200_000,

            eligibility: [],
          });

        expect(
          result.byCountry
        ).toEqual([]);

        expect(
          result.totalAllowedCredit
        ).toBe(0);

        expect(
          result.totalForeignTaxPaidForRemittedIncome
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ไม่ให้เครดิตโดยเดาเมื่อยังไม่มีผลตรวจ DTA",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem(),
              ]),

            totalGrossIncome:
              1_500_000,

            thaiTaxForCreditLimitation:
              200_000,

            eligibility: [],
          });

        expect(
          result.byCountry
        ).toEqual([]);

        expect(
          result.totalAllowedCredit
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "รายการที่ตรวจแล้วว่าไม่มีสิทธิ FTC ยังรายงาน foreign tax เป็น disallowed credit",
      () => {
        const result =
          calculateForeignTaxCredit({
            foreignAggregate:
              createAggregate([
                createItem(),
              ]),

            totalGrossIncome:
              1_500_000,

            thaiTaxForCreditLimitation:
              200_000,

            eligibility: [
              {
                section:
                  "section40_1",

                id: "foreign-1",

                isEligible: false,
              },
            ],
          });

        expect(
          result.byCountry
        ).toHaveLength(1);

        expect(
          result.byCountry[0]
            .country
        ).toBe("Vietnam");

        expect(
          result.byCountry[0]
            .foreignIncomeRemitted
        ).toBe(500_000);

        expect(
          result.byCountry[0]
            .foreignTaxPaidForRemittedIncome
        ).toBe(150_000);

        expect(
          result.byCountry[0]
            .allowedCredit
        ).toBe(0);

        expect(
          result.byCountry[0]
            .disallowedCredit
        ).toBe(150_000);

        expect(
          result
            .totalForeignTaxPaidForRemittedIncome
        ).toBe(150_000);

        expect(
          result.totalAllowedCredit
        ).toBe(0);

        expect(
          result.totalDisallowedCredit
        ).toBe(150_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
        "จำกัด foreign tax ตามผล DTA ก่อนนำไปเทียบ Thai credit limit",
        () => {
            const result =
            calculateForeignTaxCredit({
                foreignAggregate:
                createAggregate([
                    createItem({
                    foreignTaxPaid:
                        150_000,

                    foreignTaxPaidAttributableToRemittance:
                        150_000,
                    }),
                ]),

                totalGrossIncome:
                1_500_000,

                thaiTaxForCreditLimitation:
                300_000,

                eligibility: [
                {
                    section:
                    "section40_1",

                    id: "foreign-1",

                    isEligible: true,

                    creditableForeignTaxPaidForRemittedIncome:
                    60_000,
                },
                ],
            });

            expect(
            result.byCountry[0]
                .foreignTaxPaidForRemittedIncome
            ).toBe(150_000);

            expect(
            result.byCountry[0]
                .thaiTaxCreditLimit
            ).toBe(100_000);

            expect(
            result.byCountry[0]
                .allowedCredit
            ).toBe(60_000);

            expect(
            result.byCountry[0]
                .disallowedCredit
            ).toBe(90_000);

            expect(
            result.isComplete
            ).toBe(true);
        }
        );

        it(
        "มีสิทธิ FTC แต่ยังไม่ทราบจำนวนที่ผ่าน DTA cap ให้ผลเป็น incomplete",
        () => {
            const result =
            calculateForeignTaxCredit({
                foreignAggregate:
                createAggregate([
                    createItem(),
                ]),

                totalGrossIncome:
                1_500_000,

                thaiTaxForCreditLimitation:
                200_000,

                eligibility: [
                {
                    section:
                    "section40_1",

                    id: "foreign-1",

                    isEligible: true,

                    creditableForeignTaxPaidForRemittedIncome:
                    null,
                },
                ],
            });

            expect(
            result.byCountry
            ).toEqual([]);

            expect(
            result.totalAllowedCredit
            ).toBe(0);

            expect(
            result.isComplete
            ).toBe(false);
        }
    );
  }
);