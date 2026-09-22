import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateEnergyEfficientInvestment,
} from "./energy-efficient-investment";

describe(
  "Energy-efficient investment 2569",
  () => {
    it(
      "คำนวณสิทธิเพิ่ม 50% จากเงินลงทุน 40(5)-40(8)",
      () => {
        const result =
          calculateEnergyEfficientInvestment({
            section40_5: [
              {
                id: "rent-1",
                amount: 500_000,
                assetType: "building",
                expenseMethod: "actual",
                actualExpense: 200_000,
                isSublease: false,
                subleaseRentPaid: 0,

                energyEfficientInvestment:
                  100_000,
              },
            ],

            section40_6: [
              {
                id: "professional-1",
                amount: 500_000,
                professionalType:
                  "medical",
                expenseMethod: "actual",
                actualExpense: 200_000,

                energyEfficientInvestment:
                  40_000,
              },
            ],

            section40_7: [
              {
                id: "contract-1",
                amount: 500_000,
                expenseMethod: "actual",
                actualExpense: 200_000,

                energyEfficientInvestment:
                  60_000,
              },
            ],

            section40_8: [
              {
                id: "business-1",
                amount: 500_000,
                category: "actualOnly",
                expenseMethod: "actual",
                actualExpense: 200_000,

                energyEfficientInvestment:
                  200_000,
              },
            ],

            exemptionRate: 0.50,
          });

        expect(
          result.totalQualifyingInvestment
        ).toBe(400_000);

        expect(
          result.totalAdditionalExemption
        ).toBe(200_000);

        expect(
          result.section40_5
            .additionalExemption
        ).toBe(50_000);

        expect(
          result.section40_6
            .additionalExemption
        ).toBe(20_000);

        expect(
          result.section40_7
            .additionalExemption
        ).toBe(30_000);

        expect(
          result.section40_8
            .additionalExemption
        ).toBe(100_000);
      }
    );

    it(
      "ไม่ให้ยอดลงทุนติดลบสร้างสิทธิยกเว้น",
      () => {
        const result =
          calculateEnergyEfficientInvestment({
            section40_5: [],
            section40_6: [],
            section40_7: [],
            section40_8: [
              {
                id: "business-negative",
                amount: 500_000,
                category: "actualOnly",
                expenseMethod: "actual",
                actualExpense: 0,

                energyEfficientInvestment:
                  -100_000,
              },
            ],

            exemptionRate: 0.50,
          });

        expect(
          result.totalQualifyingInvestment
        ).toBe(0);

        expect(
          result.totalAdditionalExemption
        ).toBe(0);
      }
    );
  }
);