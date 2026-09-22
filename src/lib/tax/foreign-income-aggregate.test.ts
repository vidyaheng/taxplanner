import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  IncomeData,
} from "@/types/income";

import {
  aggregateForeignIncome,
} from "./foreign-income-aggregate";

function createIncome(
  values:
    Partial<IncomeData> = {}
): IncomeData {
  return {
    monthlySalary: 0,
    annualBonus: 0,
    otherEmploymentIncome: 0,

    section40_1TaxWithheld: 0,
    section40_2TaxWithheld: 0,

    hasOtherIncome: false,

    section40_1ForeignIncome: [],
    section40_2ForeignIncome: [],

    ...values,

    otherIncome: {
      commission: 0,
      rent: 0,
      professional: 0,
      business: 0,
      investment: 0,
      other: 0,
      ...values.otherIncome,
    },

    detailedOtherIncome: {
      section40_3: [],
      section40_4Interest: [],
      section40_4Dividend: [],
      section40_5: [],
      section40_6: [],
      section40_7: [],
      section40_8: [],
      ...values.detailedOtherIncome,
    },
  };
}

describe(
  "Foreign income aggregation",
  () => {
    it(
      "รวม foreign 40(1) ตามยอดที่นำเข้าไทย",
      () => {
        const income =
          createIncome({
            section40_1ForeignIncome:
              [
                {
                  id: "salary-us",

                  amount:
                    500_000,

                  foreignSource: {
                    country:
                      "USA",

                    incomeTaxYear:
                      2568,

                    remittedToThailandThisTaxYear:
                      200_000,

                    foreignIncomeTaxPaid:
                      50_000,

                    isThaiTaxResidentInIncomeYear:
                      true,
                  },
                },
              ],
          });

        const result =
          aggregateForeignIncome({
            income,
            filingTaxYear:
              2569,
          });

        expect(
          result.taxableBySection
            .section40_1
        ).toBe(200_000);

        expect(
          result
            .foreignTaxPaidOnTaxableRemittanceBySection
            .section40_1
        ).toBe(20_000);

        expect(
          result.totalTaxableRemittance
        ).toBe(200_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign interest ยังถูก aggregate แม้ taxTreatment เดิมเป็น final",
      () => {
        const income =
          createIncome({
            detailedOtherIncome: {
              section40_4Interest:
                [
                  {
                    id:
                      "foreign-interest",

                    amount:
                      100_000,

                    taxWithheld:
                      0,

                    taxTreatment:
                      "final",

                    foreignSource: {
                      country:
                        "Japan",

                      incomeTaxYear:
                        2569,

                      remittedToThailandThisTaxYear:
                        100_000,

                      foreignIncomeTaxPaid:
                        15_000,

                      isThaiTaxResidentInIncomeYear:
                        true,
                    },
                  },
                ],
            } as IncomeData[
              "detailedOtherIncome"
            ],
          });

        const result =
          aggregateForeignIncome({
            income,
            filingTaxYear:
              2569,
          });

        expect(
          result.taxableBySection
            .section40_4Interest
        ).toBe(100_000);

        expect(
          result.items[0]
            .isTaxable
        ).toBe(true);
      }
    );

    it(
      "ไม่รวม domestic item ใน foreign aggregation",
      () => {
        const income =
          createIncome({
            detailedOtherIncome: {
              section40_4Interest:
                [
                  {
                    id:
                      "thai-interest",

                    amount:
                      300_000,

                    taxWithheld:
                      45_000,

                    taxTreatment:
                      "include",
                  },
                ],
            } as IncomeData[
              "detailedOtherIncome"
            ],
          });

        const result =
          aggregateForeignIncome({
            income,
            filingTaxYear:
              2569,
          });

        expect(
          result.items
        ).toHaveLength(0);

        expect(
          result.totalTaxableRemittance
        ).toBe(0);
      }
    );

    it(
      "ถ้ามี foreign item ที่ residence ยังไม่ครบ ให้ aggregate เป็น incomplete",
      () => {
        const income =
          createIncome({
            section40_2ForeignIncome:
              [
                {
                  id:
                    "consulting-cn",

                  amount:
                    300_000,

                  foreignSource: {
                    country:
                      "China",

                    incomeTaxYear:
                      2568,

                    remittedToThailandThisTaxYear:
                      100_000,

                    foreignIncomeTaxPaid:
                      30_000,

                    isThaiTaxResidentInIncomeYear:
                      null,
                  },
                },
              ],
          });

        const result =
          aggregateForeignIncome({
            income,
            filingTaxYear:
              2569,
          });

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.totalTaxableRemittance
        ).toBe(0);

        expect(
          result.items[0].reason
        ).toBe(
          "residency_unknown"
        );
      }
    );
  }
);