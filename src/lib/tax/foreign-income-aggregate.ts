import type {
  ForeignIncomeSourceData,
  IncomeData,
} from "@/types/income";

import {
  calculateForeignIncomeTaxability,
  type ForeignIncomeTaxabilityReason,
} from "./foreign-income";

export type ForeignIncomeSection =
  | "section40_1"
  | "section40_2"
  | "section40_3Annuity"
  | "section40_3Rights"
  | "section40_4Interest"
  | "section40_4Dividend"
  | "section40_5"
  | "section40_6"
  | "section40_7"
  | "section40_8";

export interface ForeignIncomeAggregateItem {
  id: string;

  section:
    ForeignIncomeSection;

  country: string;

  incomeTaxYear: number;

  foreignIncomeAmount: number;

  remittedAmount: number;

  taxableRemittance: number;

  foreignTaxPaid: number;

  /*
   * ภาษีต่างประเทศส่วนที่สัมพันธ์
   * กับยอด remit
   *
   * ยังไม่ใช่เครดิตภาษี
   * ที่ใช้ได้จริง
   */
  foreignTaxPaidAttributableToRemittance:
    number;

  /*
   * ผล DTA review ของ foreign income item นี้
   *
   * undefined = ยังไม่ได้ตรวจ
   */
  foreignTaxCreditDtaReview?:
    ForeignIncomeSourceData[
      "foreignTaxCreditDtaReview"
    ];

  isTaxable: boolean;

  isComplete: boolean;

  reason:
    ForeignIncomeTaxabilityReason;
}

export type ForeignIncomeSectionTotals =
  Record<
    ForeignIncomeSection,
    number
  >;

export interface ForeignIncomeAggregateResult {
  items:
    ForeignIncomeAggregateItem[];

  taxableBySection:
    ForeignIncomeSectionTotals;

  /*
   * รวมเฉพาะภาษีต่างประเทศ
   * ของเงินได้ที่ taxable แล้ว
   *
   * ยังต้องผ่าน FTC / DTA
   * และ credit limitation ต่อ
   */
  foreignTaxPaidOnTaxableRemittanceBySection:
    ForeignIncomeSectionTotals;

  totalTaxableRemittance: number;

  totalForeignTaxPaidOnTaxableRemittance:
    number;

  isComplete: boolean;
}

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

interface AggregateInput {
  income: IncomeData;

  filingTaxYear: number;
}

export function aggregateForeignIncome({
  income,
  filingTaxYear,
}: AggregateInput):
  ForeignIncomeAggregateResult {
  const items:
    ForeignIncomeAggregateItem[] =
      [];

  function addForeignItem({
    id,
    section,
    amount,
    foreignSource,
  }: {
    id: string;

    section:
      ForeignIncomeSection;

    amount: number;

    foreignSource:
      ForeignIncomeSourceData;
  }) {
    const taxability =
      calculateForeignIncomeTaxability({
        amount,
        foreignSource,
        filingTaxYear,
      });

    items.push({
      id,
      section,

      country:
        foreignSource.country,

      incomeTaxYear:
        foreignSource.incomeTaxYear,

      foreignIncomeAmount:
        taxability
          .foreignIncomeAmount,

      remittedAmount:
        taxability.remittedAmount,

      taxableRemittance:
        taxability.taxableRemittance,

      foreignTaxPaid:
        taxability.foreignTaxPaid,

      foreignTaxPaidAttributableToRemittance:
        taxability
          .foreignTaxPaidAttributableToRemittance,

      foreignTaxCreditDtaReview:
        foreignSource
          .foreignTaxCreditDtaReview,

      isTaxable:
        taxability.isTaxable,

      isComplete:
        taxability.isComplete,

      reason:
        taxability.reason,
    });
  }

  /*
   * -------------------------
   * 40(1)
   * -------------------------
   */
  for (
    const item of
    income.section40_1ForeignIncome ??
      []
  ) {
    addForeignItem({
      id: item.id,

      section:
        "section40_1",

      amount:
        item.amount,

      foreignSource:
        item.foreignSource,
    });
  }

  /*
   * -------------------------
   * 40(2)
   * -------------------------
   */
  for (
    const item of
    income.section40_2ForeignIncome ??
      []
  ) {
    addForeignItem({
      id: item.id,

      section:
        "section40_2",

      amount:
        item.amount,

      foreignSource:
        item.foreignSource,
    });
  }

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

    addForeignItem({
      id: item.id,

      section:
        item.incomeType ===
        "annuity"
          ? "section40_3Annuity"
          : "section40_3Rights",

      amount:
        item.amount,

      foreignSource:
        item.foreignSource,
    });
  }

  /*
   * -------------------------
   * 40(4)(a)
   * Interest
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

    addForeignItem({
      id: item.id,

      section:
        "section40_4Interest",

      amount:
        item.amount,

      foreignSource:
        item.foreignSource,
    });
  }

  /*
   * -------------------------
   * 40(4)(b)
   * Dividend
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

    addForeignItem({
      id: item.id,

      section:
        "section40_4Dividend",

      amount:
        item.amount,

      foreignSource:
        item.foreignSource,
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

    addForeignItem({
      id: item.id,
      section: "section40_5",
      amount: item.amount,
      foreignSource:
        item.foreignSource,
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

    addForeignItem({
      id: item.id,
      section: "section40_6",
      amount: item.amount,
      foreignSource:
        item.foreignSource,
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

    addForeignItem({
      id: item.id,
      section: "section40_7",
      amount: item.amount,
      foreignSource:
        item.foreignSource,
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

    addForeignItem({
      id: item.id,
      section: "section40_8",
      amount: item.amount,
      foreignSource:
        item.foreignSource,
    });
  }

  const taxableBySection =
    emptySectionTotals();

  const foreignTaxPaidOnTaxableRemittanceBySection =
    emptySectionTotals();

  for (const item of items) {
    taxableBySection[
      item.section
    ] += item.taxableRemittance;

    /*
     * ยังไม่เอารายการ incomplete
     * หรือ non-taxable ไปเป็นฐาน
     * Foreign Tax Credit
     */
    if (
      item.isTaxable &&
      item.isComplete
    ) {
      foreignTaxPaidOnTaxableRemittanceBySection[
        item.section
      ] +=
        item
          .foreignTaxPaidAttributableToRemittance;
    }
  }

  const totalTaxableRemittance =
    Object.values(
      taxableBySection
    ).reduce(
      (total, value) =>
        total + value,
      0
    );

  const totalForeignTaxPaidOnTaxableRemittance =
    Object.values(
      foreignTaxPaidOnTaxableRemittanceBySection
    ).reduce(
      (total, value) =>
        total + value,
      0
    );

  return {
    items,

    taxableBySection,

    foreignTaxPaidOnTaxableRemittanceBySection,

    totalTaxableRemittance,

    totalForeignTaxPaidOnTaxableRemittance,

    isComplete:
      items.every(
        (item) =>
          item.isComplete
      ),
  };
}