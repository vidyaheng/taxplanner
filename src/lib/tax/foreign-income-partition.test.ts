import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  IncomeData,
} from "@/types/income";

import {
  partitionForeignIncome,
} from "./foreign-income-partition";

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
  "Foreign income partition",
  () => {
    it(
      "นำ foreign 40(1) เฉพาะยอด taxable remittance เข้า employment income",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                otherEmploymentIncome:
                  50_000,

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
              }),
          });

        expect(
          result
            .incomeForTaxEngine
            .otherEmploymentIncome
        ).toBe(250_000);

        expect(
          result
            .incomeForTaxEngine
            .section40_1ForeignIncome
        ).toEqual([]);
      }
    );

    it(
      "foreign 40(3) annuity นำเฉพาะ taxable remittance เข้า Tax Engine",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [
                    {
                      id:
                        "foreign-annuity",

                      incomeType:
                        "annuity",

                      amount:
                        500_000,

                      /*
                      * foreign item
                      * ต้องไม่ใช้ Thai WHT
                      */
                      taxWithheld:
                        99_999,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_3[0];

        expect(
          item.incomeType
        ).toBe("annuity");

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          item.foreignSource
        ).toBeUndefined();

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(3) rights ที่ remit บางส่วนใช้ expenseAttributableToRemittance",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [
                    {
                      id:
                        "foreign-rights",

                      incomeType:
                        "rights",

                      amount:
                        500_000,

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      taxWithheld:
                        0,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_3[0];

        expect(
          item.incomeType
        ).toBe("rights");

        if (
          item.incomeType !==
          "rights"
        ) {
          throw new Error(
            "Expected section 40(3) rights item"
          );
        }

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(70_000);

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          item.foreignSource
        ).toBeUndefined();

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(3) rights แบบ actual และ remit บางส่วนที่ไม่ระบุ attribution ต้อง incomplete",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [
                    {
                      id:
                        "foreign-rights-missing-expense",

                      incomeType:
                        "rights",

                      amount:
                        500_000,

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      taxWithheld:
                        0,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_3[0];

        expect(
          item.incomeType
        ).toBe("rights");

        if (
          item.incomeType !==
          "rights"
        ) {
          throw new Error(
            "Expected section 40(3) rights item"
          );
        }

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "foreign interest ถูกบังคับให้ include และไม่ใช้ Thai WHT",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest:
                    [
                      {
                        id:
                          "jp-interest",

                        amount:
                          100_000,

                        taxWithheld:
                          15_000,

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

                  section40_4Dividend:
                    [],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_4Interest[0];

        expect(
          item.taxTreatment
        ).toBe("include");

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          item.amount
        ).toBe(100_000);
      }
    );

    it(
      "foreign 40(5) ที่ remit บางส่วนใช้ expenseAttributableToRemittance",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                /*
                 * legacy rent นี้ถูกปิดไว้
                 * ต้องไม่กลับมาเพราะ
                 * foreign item เปิด hasOtherIncome
                 */
                hasOtherIncome:
                  false,

                otherIncome: {
                  commission: 0,
                  rent: 999_999,
                  professional: 0,
                  business: 0,
                  investment: 0,
                  other: 0,
                },

                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],

                  section40_5: [
                    {
                      id:
                        "foreign-rent",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      assetType:
                        "building",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      isSublease:
                        false,

                      subleaseRentPaid:
                        0,

                      foreignSource: {
                        country:
                          "Singapore",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_5[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(70_000);

        expect(
          result
            .incomeForTaxEngine
            .otherIncome.rent
        ).toBe(0);

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(6) ที่ remit บางส่วนใช้ expenseAttributableToRemittance",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],

                  section40_6: [
                    {
                      id:
                        "foreign-professional",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      foreignSource: {
                        country:
                          "Singapore",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_6[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(70_000);

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(6) แบบ actual และ remit บางส่วนที่ไม่ระบุ attribution ต้อง incomplete",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],

                  section40_6: [
                    {
                      id:
                        "foreign-professional-missing-expense",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      foreignSource: {
                        country:
                          "Singapore",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_6[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "foreign 40(7) ที่ remit บางส่วนใช้ expenseAttributableToRemittance",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id:
                        "foreign-contract",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      energyEfficientInvestment:
                        0,

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      foreignSource: {
                        country:
                          "Singapore",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_7[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(70_000);

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(7) แบบ actual และ remit บางส่วนที่ไม่ระบุ attribution ต้อง incomplete",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id:
                        "foreign-contract-missing-expense",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      energyEfficientInvestment:
                        0,

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      foreignSource: {
                        country:
                          "Singapore",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_8: [],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_7[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "foreign 40(8) ที่ remit บางส่วนใช้ expenseAttributableToRemittance",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id:
                        "foreign-business-attributed",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      energyEfficientInvestment:
                        0,

                      category:
                        "actualOnly",

                      activityCode:
                        "business-1",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        200_000,

                      foreignSource: {
                        country:
                          "Vietnam",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_8[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(70_000);

        expect(
          item.taxWithheld
        ).toBe(0);

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign actual expense แบบ remit บางส่วนที่ไม่ระบุ attribution ต้อง incomplete",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id:
                        "foreign-business",

                      amount:
                        500_000,

                      taxWithheld: 0,

                      category:
                        "actualOnly",

                      activityCode:
                        "business-1",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        200_000,

                      foreignSource: {
                        country:
                          "Vietnam",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        foreignIncomeTaxPaid:
                          20_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],
                },
              }),
          });

        const item =
          result
            .incomeForTaxEngine
            .detailedOtherIncome
            .section40_8[0];

        expect(
          item.amount
        ).toBe(200_000);

        expect(
          item.actualExpense
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "เงินได้ต่างประเทศก่อนปี 2567 ถูกตัดออกและไม่เปิด hasOtherIncome",
      () => {
        const result =
          partitionForeignIncome({
            filingTaxYear: 2569,

            income:
              createIncome({
                section40_2ForeignIncome:
                  [
                    {
                      id:
                        "old-income",

                      amount:
                        300_000,

                      foreignSource: {
                        country:
                          "UK",

                        incomeTaxYear:
                          2566,

                        remittedToThailandThisTaxYear:
                          300_000,

                        foreignIncomeTaxPaid:
                          30_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],
              }),
          });

        expect(
          result
            .incomeForTaxEngine
            .otherIncome.commission
        ).toBe(0);

        expect(
          result
            .incomeForTaxEngine
            .hasOtherIncome
        ).toBe(false);

        expect(
          result.aggregate
            .totalTaxableRemittance
        ).toBe(0);
      }
    );
  }
);