import type {
  ExpenseMethod,
  RentalAssetType,
  Section40_3IncomeData,
  Section40_3RightsIncomeData,
  Section40_5RentalIncomeData,
  ProfessionalType,
  Section40_6ProfessionalIncomeData,
  Section40_7ContractIncomeData,
  Section40_8BusinessIncomeData,
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

export interface Section40_5RentalExpenseRule {
  standardRates:
    Record<RentalAssetType, number>;
}

export interface Section40_5RentalExpenseResult {
  grossIncome: number;
  deductibleExpense: number;
  isComplete: boolean;
}

export function calculateSection40_5RentalExpense(
  items: Section40_5RentalIncomeData[],
  rule: Section40_5RentalExpenseRule
): Section40_5RentalExpenseResult {
  const activeItems =
    items.filter(
      (item) =>
        Math.max(0, item.amount) > 0
    );

  const grossIncome =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  if (activeItems.length === 0) {
    return {
      grossIncome: 0,
      deductibleExpense: 0,
      isComplete: true,
    };
  }

  /*
   * ต้องทราบประเภททรัพย์สิน
   * เพื่อเลือกอัตราค่าใช้จ่าย
   * และตรวจความสอดคล้องของวิธีหัก
   */
  if (
    activeItems.some(
      (item) =>
        item.assetType === null
    )
  ) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  const assetTypes =
    new Set(
      activeItems.map(
        (item) =>
          item.assetType as RentalAssetType
      )
    );

  /*
   * ทรัพย์สินประเภทเดียวกัน
   * ต้องเลือกวิธีหักค่าใช้จ่าย
   * ให้สอดคล้องกัน
   */
  for (const assetType of assetTypes) {
    const methods =
      new Set(
        activeItems
          .filter(
            (item) =>
              item.assetType ===
              assetType
          )
          .map(
            (item) =>
              item.expenseMethod
          )
      );

    if (methods.size !== 1) {
      return {
        grossIncome,
        deductibleExpense: 0,
        isComplete: false,
      };
    }
  }

  const deductibleExpense =
    activeItems.reduce(
      (sum, item) => {
        const amount =
          Math.max(0, item.amount);

        /*
         * ค่าใช้จ่ายตามจริง
         */
        if (
          item.expenseMethod ===
          "actual"
        ) {
          return (
            sum +
            Math.max(
              0,
              item.actualExpense
            )
          );
        }

        /*
         * เช่าช่วง:
         * ไม่ใช้อัตราเหมา
         * ใช้ค่าเช่าที่จ่ายให้
         * ผู้ให้เช่าเดิม
         */
        if (item.isSublease) {
          return (
            sum +
            Math.max(
              0,
              item.subleaseRentPaid
            )
          );
        }

        const assetType =
          item.assetType as RentalAssetType;

        return (
          sum +
          amount *
            rule.standardRates[
              assetType
            ]
        );
      },
      0
    );

  return {
    grossIncome,
    deductibleExpense,
    isComplete: true,
  };
}

export interface Section40_6ProfessionalExpenseRule {
  standardRates:
    Record<ProfessionalType, number>;
}

export interface Section40_6ProfessionalExpenseResult {
  grossIncome: number;
  deductibleExpense: number;
  isComplete: boolean;
}

export function calculateSection40_6ProfessionalExpense(
  items: Section40_6ProfessionalIncomeData[],
  rule: Section40_6ProfessionalExpenseRule
): Section40_6ProfessionalExpenseResult {
  const activeItems =
    items.filter(
      (item) =>
        Math.max(0, item.amount) > 0
    );

  const grossIncome =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  if (activeItems.length === 0) {
    return {
      grossIncome: 0,
      deductibleExpense: 0,
      isComplete: true,
    };
  }

  if (
    activeItems.some(
      (item) =>
        item.professionalType === null
    )
  ) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  const professionalTypes =
    new Set(
      activeItems.map(
        (item) =>
          item.professionalType as ProfessionalType
      )
    );

  for (const professionalType of professionalTypes) {
    const methods =
      new Set(
        activeItems
          .filter(
            (item) =>
              item.professionalType ===
              professionalType
          )
          .map(
            (item) =>
              item.expenseMethod
          )
      );

    if (methods.size !== 1) {
      return {
        grossIncome,
        deductibleExpense: 0,
        isComplete: false,
      };
    }
  }

  const deductibleExpense =
    activeItems.reduce(
      (sum, item) => {
        const amount =
          Math.max(0, item.amount);

        if (
          item.expenseMethod ===
          "actual"
        ) {
          return (
            sum +
            Math.max(
              0,
              item.actualExpense
            )
          );
        }

        const professionalType =
          item.professionalType as ProfessionalType;

        return (
          sum +
          amount *
            rule.standardRates[
              professionalType
            ]
        );
      },
      0
    );

  return {
    grossIncome,
    deductibleExpense,
    isComplete: true,
  };
}

export interface Section40_7ContractExpenseRule {
  standardRate: number;
}

export interface Section40_7ContractExpenseResult {
  grossIncome: number;
  deductibleExpense: number;
  isComplete: boolean;
}

export function calculateSection40_7ContractExpense(
  items: Section40_7ContractIncomeData[],
  rule: Section40_7ContractExpenseRule
): Section40_7ContractExpenseResult {
  const activeItems =
    items.filter(
      (item) =>
        Math.max(0, item.amount) > 0
    );

  const grossIncome =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  if (activeItems.length === 0) {
    return {
      grossIncome: 0,
      deductibleExpense: 0,
      isComplete: true,
    };
  }

  const methods =
    new Set(
      activeItems.map(
        (item) =>
          item.expenseMethod
      )
    );

  if (methods.size !== 1) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  const expenseMethod =
    activeItems[0].expenseMethod;

  const deductibleExpense =
    expenseMethod === "actual"
      ? activeItems.reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              item.actualExpense
            ),
          0
        )
      : grossIncome *
        rule.standardRate;

  return {
    grossIncome,
    deductibleExpense,
    isComplete: true,
  };
}

export interface Section40_8BusinessExpenseRule {
  standardRate: number;

  performer: {
    firstTierLimit: number;
    firstTierRate: number;
    excessRate: number;
    maxExpense: number;
  };
}

export interface Section40_8BusinessExpenseResult {
  grossIncome: number;
  deductibleExpense: number;
  isComplete: boolean;
}

export function calculateSection40_8BusinessExpense(
  items: Section40_8BusinessIncomeData[],
  rule: Section40_8BusinessExpenseRule
): Section40_8BusinessExpenseResult {
  const activeItems =
    items.filter(
      (item) =>
        Math.max(0, item.amount) > 0
    );

  const grossIncome =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  if (activeItems.length === 0) {
    return {
      grossIncome: 0,
      deductibleExpense: 0,
      isComplete: true,
    };
  }

  /*
   * ต้องทราบประเภทกิจการ
   * ก่อนจึงจะเลือกวิธีหักค่าใช้จ่ายได้
   */
  if (
    activeItems.some(
      (item) =>
        item.category === null
    )
  ) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  /*
  * เงินได้ 40(8) ประเภทและชนิดเดียวกัน
  * ต้องใช้วิธีหักค่าใช้จ่ายเดียวกัน
  *
  * activityCode ใช้ระบุชนิดกิจการจริง
  * หากข้อมูลเก่าไม่มี activityCode
  * จะถือเป็นกลุ่ม unspecified เดียวกัน
  * เพื่อไม่ให้ Engine เดาชนิดกิจการ
  */
  const activityMethods =
    new Map<string, Set<ExpenseMethod>>();

  for (const item of activeItems) {
    const activityCode =
      item.activityCode?.trim() ||
      "__unspecified__";

    const activityKey =
      `${item.category}:${activityCode}`;

    const methods =
      activityMethods.get(activityKey) ??
      new Set<ExpenseMethod>();

    methods.add(item.expenseMethod);

    activityMethods.set(
      activityKey,
      methods
    );
  }

  if (
    [...activityMethods.values()].some(
      (methods) =>
        methods.size !== 1
    )
  ) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  /*
  * กิจการที่ไม่มีสิทธิหักเหมา
  * ต้องใช้ค่าใช้จ่ายตามจริงเท่านั้น
  */
  if (
    activeItems.some(
      (item) =>
        item.category === "actualOnly" &&
        item.expenseMethod !== "actual"
    )
  ) {
    return {
      grossIncome,
      deductibleExpense: 0,
      isComplete: false,
    };
  }

  /*
  * ค่าใช้จ่ายตามจริง
  * รวมเฉพาะรายการที่เลือก actual
  */
  const actualExpense =
    activeItems
      .filter(
        (item) =>
          item.expenseMethod === "actual"
      )
      .reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.actualExpense
          ),
        0
      );

  /*
  * กิจการ 40(8) ที่มีสิทธิ
  * หักค่าใช้จ่ายเหมา 60%
  */
  const standard60GrossIncome =
    activeItems
      .filter(
        (item) =>
          item.category === "standard60" &&
          item.expenseMethod === "standard"
      )
      .reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.amount
          ),
        0
      );

  const standard60Expense =
    standard60GrossIncome *
    rule.standardRate;

  /*
  * นักแสดงที่เลือกหักแบบเหมา
  * ต้องรวมรายได้ก่อนใช้ tier
  */
  const performerGrossIncome =
    activeItems
      .filter(
        (item) =>
          item.category === "performer" &&
          item.expenseMethod === "standard"
      )
      .reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.amount
          ),
        0
      );

  const performerFirstTierIncome =
    Math.min(
      performerGrossIncome,
      rule.performer.firstTierLimit
    );

  const performerExcessIncome =
    Math.max(
      0,
      performerGrossIncome -
        rule.performer.firstTierLimit
    );

  const performerExpenseBeforeCap =
    performerFirstTierIncome *
      rule.performer.firstTierRate +
    performerExcessIncome *
      rule.performer.excessRate;

  const performerExpense =
    Math.min(
      performerExpenseBeforeCap,
      rule.performer.maxExpense
    );

  const deductibleExpense =
    actualExpense +
    standard60Expense +
    performerExpense;

  return {
    grossIncome,
    deductibleExpense,
    isComplete: true,
  };
}