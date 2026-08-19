import {
  ExpenseMethod,
  Section40_3IncomeData,
  Section40_3RightsIncomeData,
} from "@/types/income";

export interface Section40_3RightsExpenseRule {
  standardRate: number;
  standardMax: number;
}

export interface Section40_3RightsExpenseResult {
  grossIncome: number;

  expenseMethod:
    | ExpenseMethod
    | null;

  expenseBeforeCap: number;

  deductibleExpense: number;

  isComplete: boolean;
}

export function calculateSection40_3RightsExpense(
  items: Section40_3IncomeData[],
  rule: Section40_3RightsExpenseRule
): Section40_3RightsExpenseResult {
  const rightsItems =
    items.filter(
      (
        item
      ): item is Section40_3RightsIncomeData =>
        item.incomeType === "rights"
    );

  const grossIncome =
    rightsItems.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.amount
        ),
      0
    );

  if (
    rightsItems.length === 0
  ) {
    return {
      grossIncome: 0,
      expenseMethod: null,
      expenseBeforeCap: 0,
      deductibleExpense: 0,
      isComplete: true,
    };
  }

  const methods =
    new Set(
      rightsItems.map(
        (item) =>
          item.expenseMethod
      )
    );

  /*
   * ไม่อนุญาตให้ Engine เดา
   * หากข้อมูลหลายรายการใช้วิธีหักค่าใช้จ่ายไม่ตรงกัน
   */
  if (methods.size !== 1) {
    return {
      grossIncome,
      expenseMethod: null,
      expenseBeforeCap: 0,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  const expenseMethod =
    rightsItems[0]
      .expenseMethod;

  if (
    expenseMethod ===
    "actual"
  ) {
    const actualExpense =
      rightsItems.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.actualExpense
          ),
        0
      );

    return {
      grossIncome,
      expenseMethod,
      expenseBeforeCap:
        actualExpense,
      deductibleExpense:
        actualExpense,
      isComplete: true,
    };
  }

  const expenseBeforeCap =
    grossIncome *
    rule.standardRate;

  return {
    grossIncome,
    expenseMethod,
    expenseBeforeCap,

    deductibleExpense:
      Math.min(
        expenseBeforeCap,
        rule.standardMax
      ),

    isComplete: true,
  };
}