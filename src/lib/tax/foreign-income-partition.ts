import type {
  ForeignIncomeSourceData,
  IncomeData,
} from "@/types/income";

import {
  aggregateForeignIncome,
  type ForeignIncomeAggregateItem,
  type ForeignIncomeAggregateResult,
  type ForeignIncomeSection,
} from "./foreign-income-aggregate";

export interface ForeignIncomePartitionResult {
  incomeForTaxEngine: IncomeData;

  aggregate:
    ForeignIncomeAggregateResult;

  isComplete: boolean;

  warnings: string[];
}

interface PartitionInput {
  income: IncomeData;
  filingTaxYear: number;
}

function itemKey(
  section: ForeignIncomeSection,
  id: string
) {
  return `${section}:${id}`;
}

function requiresAttributedExpense({
  expenseMethod,
  isSublease = false,
}: {
  expenseMethod?: "standard" | "actual";
  isSublease?: boolean;
}) {
  return (
    expenseMethod === "actual" ||
    isSublease
  );
}

function resolveExpense({
  fullIncomeAmount,
  taxableRemittance,
  originalExpense,
  foreignSource,
}: {
  fullIncomeAmount: number;
  taxableRemittance: number;
  originalExpense: number;

  foreignSource:
    ForeignIncomeSourceData;
}) {
  const fullIncome =
    Math.max(
      0,
      fullIncomeAmount
    );

  const taxable =
    Math.max(
      0,
      taxableRemittance
    );

  /*
   * ถ้านำเงินได้ทั้งก้อนเข้ามา
   * ไม่ต้องแบ่งค่าใช้จ่าย
   */
  if (
    fullIncome > 0 &&
    taxable >= fullIncome
  ) {
    return {
      expense:
        Math.max(
          0,
          originalExpense
        ),

      isComplete: true,
    };
  }

  const attributed =
    foreignSource
      .expenseAttributableToRemittance;

  if (
    attributed === undefined
  ) {
    return {
      expense: 0,
      isComplete: false,
    };
  }

  return {
    expense:
      Math.max(
        0,
        attributed
      ),

    isComplete: true,
  };
}

export function partitionForeignIncome({
  income,
  filingTaxYear,
}: PartitionInput):
  ForeignIncomePartitionResult {
  const aggregate =
    aggregateForeignIncome({
      income,
      filingTaxYear,
    });

  const warnings: string[] = [];

  const aggregateByKey =
    new Map<
      string,
      ForeignIncomeAggregateItem
    >();

  for (
    const item of
    aggregate.items
  ) {
    aggregateByKey.set(
      itemKey(
        item.section,
        item.id
      ),
      item
    );
  }

  let partitionComplete =
    aggregate.isComplete;

  function getAggregateItem(
    section: ForeignIncomeSection,
    id: string
  ) {
    return aggregateByKey.get(
      itemKey(section, id)
    );
  }

  function markMissingExpense(
    section: ForeignIncomeSection,
    id: string
  ) {
    partitionComplete = false;

    warnings.push(
      `เงินได้ต่างประเทศ ${section} รายการ ${id} นำเข้าไทยเพียงบางส่วนและยังไม่ได้ระบุค่าใช้จ่ายที่สัมพันธ์กับยอดที่นำเข้า`
    );
  }

  function normalizeEnergyInvestment({
    originalAmount,
    taxableRemittance,
    foreignIncomeAmount,
    section,
    id,
  }: {
    originalAmount:
      number | undefined;

    taxableRemittance: number;
    foreignIncomeAmount: number;

    section:
      ForeignIncomeSection;

    id: string;
  }) {
    const investment =
      Math.max(
        0,
        originalAmount ?? 0
      );

    if (investment <= 0) {
      return 0;
    }

    /*
     * ถ้าเงินได้ทั้งก้อนถูกนำมา
     * คำนวณภาษีในปีนี้
     * ไม่เกิดปัญหาการแบ่งสัดส่วน
     */
    if (
      foreignIncomeAmount > 0 &&
      taxableRemittance >=
        foreignIncomeAmount
    ) {
      return investment;
    }

    /*
     * ยังไม่มีข้อมูลว่า qualifying
     * investment เท่าไรสัมพันธ์
     * กับยอด remit บางส่วน
     */
    partitionComplete = false;

    warnings.push(
      `เงินได้ต่างประเทศ ${section} รายการ ${id} มีสิทธิลงทุนอนุรักษ์พลังงาน แต่ยอดเงินได้ถูกนำเข้าไทยเพียงบางส่วน ระบบจึงยังไม่นำสิทธิ พ.ร.ฎ. 805 มาคำนวณอัตโนมัติ`
    );

    return 0;
  }

  /*
   * -------------------------
   * DOMESTIC BASE
   * -------------------------
   *
   * สำคัญ:
   * ถ้า hasOtherIncome เดิมเป็น false
   * ต้องไม่ปลุก legacy income เดิม
   * เพียงเพราะ foreign income
   * ทำให้เราต้องเปิด flag นี้
   */
  const domesticOtherIncome =
    income.hasOtherIncome
      ? {
          ...income.otherIncome,
        }
      : {
          commission: 0,
          rent: 0,
          professional: 0,
          business: 0,
          investment: 0,
          other: 0,
        };

  const domesticDetailed =
    income.hasOtherIncome
      ? {
          section40_3:
            income.detailedOtherIncome
              .section40_3
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_4Interest:
            income.detailedOtherIncome
              .section40_4Interest
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_4Dividend:
            income.detailedOtherIncome
              .section40_4Dividend
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_5:
            income.detailedOtherIncome
              .section40_5
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_6:
            income.detailedOtherIncome
              .section40_6
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_7:
            income.detailedOtherIncome
              .section40_7
              .filter(
                (item) =>
                  !item.foreignSource
              ),

          section40_8:
            income.detailedOtherIncome
              .section40_8
              .filter(
                (item) =>
                  !item.foreignSource
              ),
        }
      : {
          section40_3: [],
          section40_4Interest: [],
          section40_4Dividend: [],
          section40_5: [],
          section40_6: [],
          section40_7: [],
          section40_8: [],
        };

  /*
   * -------------------------
   * 40(3)
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_3
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const section =
      item.incomeType === "annuity"
        ? "section40_3Annuity"
        : "section40_3Rights";

    const taxability =
      getAggregateItem(
        section,
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    if (
      item.incomeType === "annuity"
    ) {
      domesticDetailed
        .section40_3
        .push({
          ...item,

          amount:
            taxability
              .taxableRemittance,

          taxWithheld: 0,

          foreignSource:
            undefined,
        });

      continue;
    }

    let actualExpense = 0;

    if (
      item.expenseMethod ===
      "actual"
    ) {
      const resolved =
        resolveExpense({
          fullIncomeAmount:
            item.amount,

          taxableRemittance:
            taxability
              .taxableRemittance,

          originalExpense:
            item.actualExpense,

          foreignSource:
            item.foreignSource,
        });

      actualExpense =
        resolved.expense;

      if (!resolved.isComplete) {
        markMissingExpense(
          section,
          item.id
        );
      }
    }

    domesticDetailed
      .section40_3
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        actualExpense,

        taxWithheld: 0,

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(4) INTEREST
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_4Interest
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_4Interest",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    domesticDetailed
      .section40_4Interest
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        /*
         * foreign 40(4)
         * ต้องเข้า progressive
         * calculation
         */
        taxTreatment:
          "include",

        /*
         * foreign tax
         * ไม่ใช่ Thai WHT
         */
        taxWithheld: 0,

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(4) DIVIDEND
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_4Dividend
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_4Dividend",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    domesticDetailed
      .section40_4Dividend
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        taxTreatment:
          "include",

        taxWithheld: 0,

        /*
         * เครดิตเงินปันผลเดิม
         * เป็นเครดิตตามระบบไทย
         */
        dividendTaxCredit: 0,

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(5)
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_5
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_5",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    let attributedExpense = 0;

    if (
      requiresAttributedExpense({
        expenseMethod:
          item.expenseMethod,

        isSublease:
          item.isSublease,
      })
    ) {
      const originalExpense =
        item.expenseMethod === "actual"
          ? item.actualExpense
          : item.subleaseRentPaid;

      const resolved =
        resolveExpense({
          fullIncomeAmount:
            item.amount,

          taxableRemittance:
            taxability
              .taxableRemittance,

          originalExpense,

          foreignSource:
            item.foreignSource,
        });

      attributedExpense =
        resolved.expense;

      if (!resolved.isComplete) {
        markMissingExpense(
          "section40_5",
          item.id
        );
      }
    }

    domesticDetailed
      .section40_5
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        taxWithheld: 0,

        actualExpense:
          item.expenseMethod ===
          "actual"
            ? attributedExpense
            : 0,

        subleaseRentPaid:
          item.isSublease
            ? attributedExpense
            : 0,

        energyEfficientInvestment:
          normalizeEnergyInvestment({
            originalAmount:
              item.energyEfficientInvestment,

            taxableRemittance:
              taxability
                .taxableRemittance,

            foreignIncomeAmount:
              taxability
                .foreignIncomeAmount,

            section:
              "section40_5",

            id:
              item.id,
          }),

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(6)
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_6
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_6",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    let actualExpense = 0;

    if (
      item.expenseMethod ===
      "actual"
    ) {
      const resolved =
        resolveExpense({
          fullIncomeAmount:
            item.amount,

          taxableRemittance:
            taxability
              .taxableRemittance,

          originalExpense:
            item.actualExpense,

          foreignSource:
            item.foreignSource,
        });

      actualExpense =
        resolved.expense;

      if (!resolved.isComplete) {
        markMissingExpense(
          "section40_6",
          item.id
        );
      }
    }

    domesticDetailed
      .section40_6
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        actualExpense,

        taxWithheld: 0,

        energyEfficientInvestment:
          normalizeEnergyInvestment({
            originalAmount:
              item.energyEfficientInvestment,

            taxableRemittance:
              taxability
                .taxableRemittance,

            foreignIncomeAmount:
              taxability
                .foreignIncomeAmount,

            section:
              "section40_6",

            id:
              item.id,
          }),

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(7)
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_7
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_7",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    let actualExpense = 0;

    if (
      item.expenseMethod ===
      "actual"
    ) {
      const resolved =
        resolveExpense({
          fullIncomeAmount:
            item.amount,

          taxableRemittance:
            taxability
              .taxableRemittance,

          originalExpense:
            item.actualExpense,

          foreignSource:
            item.foreignSource,
        });

      actualExpense =
        resolved.expense;

      if (!resolved.isComplete) {
        markMissingExpense(
          "section40_7",
          item.id
        );
      }
    }

    domesticDetailed
      .section40_7
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        actualExpense,

        taxWithheld: 0,

        energyEfficientInvestment:
          normalizeEnergyInvestment({
            originalAmount:
              item.energyEfficientInvestment,

            taxableRemittance:
              taxability
                .taxableRemittance,

            foreignIncomeAmount:
              taxability
                .foreignIncomeAmount,

            section:
              "section40_7",

            id:
              item.id,
          }),

        foreignSource:
          undefined,
      });
  }

  /*
   * -------------------------
   * 40(8)
   * -------------------------
   */
  for (
    const item of
    income.detailedOtherIncome
      .section40_8
  ) {
    if (!item.foreignSource) {
      continue;
    }

    const taxability =
      getAggregateItem(
        "section40_8",
        item.id
      );

    if (
      !taxability ||
      taxability.taxableRemittance <=
        0
    ) {
      continue;
    }

    let actualExpense = 0;

    if (
      item.expenseMethod ===
      "actual"
    ) {
      const resolved =
        resolveExpense({
          fullIncomeAmount:
            item.amount,

          taxableRemittance:
            taxability
              .taxableRemittance,

          originalExpense:
            item.actualExpense,

          foreignSource:
            item.foreignSource,
        });

      actualExpense =
        resolved.expense;

      if (!resolved.isComplete) {
        markMissingExpense(
          "section40_8",
          item.id
        );
      }
    }

    domesticDetailed
      .section40_8
      .push({
        ...item,

        amount:
          taxability
            .taxableRemittance,

        actualExpense,

        taxWithheld: 0,

        energyEfficientInvestment:
          normalizeEnergyInvestment({
            originalAmount:
              item.energyEfficientInvestment,

            taxableRemittance:
              taxability
                .taxableRemittance,

            foreignIncomeAmount:
              taxability
                .foreignIncomeAmount,

            section:
              "section40_8",

            id:
              item.id,
          }),

        foreignSource:
          undefined,
      });
  }

  /*
   * foreign 40(1)
   * เข้า bucket employment เดิม
   */
  const foreign40_1 =
    aggregate.taxableBySection
      .section40_1;

  /*
   * foreign 40(2)
   * เข้า bucket commission เดิม
   */
  const foreign40_2 =
    aggregate.taxableBySection
      .section40_2;

  const hasForeignOtherIncome =
    foreign40_2 > 0 ||
    domesticDetailed
      .section40_3.length > 0 ||
    domesticDetailed
      .section40_4Interest.length > 0 ||
    domesticDetailed
      .section40_4Dividend.length > 0 ||
    domesticDetailed
      .section40_5.length > 0 ||
    domesticDetailed
      .section40_6.length > 0 ||
    domesticDetailed
      .section40_7.length > 0 ||
    domesticDetailed
      .section40_8.length > 0;

  const incomeForTaxEngine:
    IncomeData = {
    ...income,

    /*
     * foreign 40(1)
     * ไม่ใช่ monthly salary
     * จึงรวมไว้ใน other employment
     */
    otherEmploymentIncome:
      income.otherEmploymentIncome +
      foreign40_1,

    /*
     * Engine ต้องไม่เห็น foreign array
     * ซ้ำอีกหลัง normalize
     */
    section40_1ForeignIncome: [],
    section40_2ForeignIncome: [],

    section40_2TaxWithheld:
      income.hasOtherIncome
        ? income.section40_2TaxWithheld
        : 0,

    hasOtherIncome:
      income.hasOtherIncome ||
      hasForeignOtherIncome,

    otherIncome: {
      ...domesticOtherIncome,

      commission:
        domesticOtherIncome
          .commission +
        foreign40_2,
    },

    detailedOtherIncome:
      domesticDetailed,
  };

  if (!aggregate.isComplete) {
    warnings.push(
      "มีเงินได้ต่างประเทศบางรายการที่ข้อมูลยังไม่ครบ ระบบจึงยังไม่สามารถสรุปภาษีรายการนั้นได้สมบูรณ์"
    );
  }

  return {
    incomeForTaxEngine,

    aggregate,

    isComplete:
      partitionComplete,

    warnings,
  };
}