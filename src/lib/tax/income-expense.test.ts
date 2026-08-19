import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSection40_3RightsExpense,
} from "./income-expense";

const rule = {
  standardRate: 0.5,
  standardMax: 100_000,
};

describe(
  "Section 40(3) rights expense",
  () => {
    it(
      "หักค่าใช้จ่ายเหมา 50% เมื่อยังไม่ถึงเพดาน",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  120_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(120_000);

        expect(
          result.expenseBeforeCap
        ).toBe(60_000);

        expect(
          result.deductibleExpense
        ).toBe(60_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หลายรายการใช้เพดานค่าใช้จ่ายเหมา 100,000 บาทร่วมกัน",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  150_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },

              {
                id: "r2",
                incomeType:
                  "rights",
                amount:
                  150_000,
                expenseMethod:
                  "standard",
                actualExpense:
                  0,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.expenseBeforeCap
        ).toBe(150_000);

        expect(
          result.deductibleExpense
        ).toBe(100_000);
      }
    );

    it(
      "รองรับค่าใช้จ่ายตามจริงโดยไม่ใช้เพดานเหมา 100,000 บาท",
      () => {
        const result =
          calculateSection40_3RightsExpense(
            [
              {
                id: "r1",
                incomeType:
                  "rights",
                amount:
                  300_000,
                expenseMethod:
                  "actual",
                actualExpense:
                  180_000,
              },
            ],
            rule
          );

        expect(
          result.grossIncome
        ).toBe(300_000);

        expect(
          result.deductibleExpense
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );
  }
);