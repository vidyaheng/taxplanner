import type {
  ForeignIncomeSourceData,
} from "@/types/income";

export type ForeignIncomeTaxabilityReason =
  | "taxable"
  | "income_before_2567"
  | "non_resident_in_income_year"
  | "residency_unknown"
  | "future_income_year"
  | "no_remittance";

export interface ForeignIncomeTaxabilityResult {
  /*
   * เงินได้ทั้งหมดของรายการ
   */
  foreignIncomeAmount: number;

  /*
   * เงินที่นำเข้าไทยในปีที่กำลังคำนวณ
   * หลัง clamp ไม่ให้เกิน amount
   */
  remittedAmount: number;

  /*
   * จำนวนเงินได้ที่ต้องนำมารวม
   * คำนวณภาษีไทยในปีนี้
   */
  taxableRemittance: number;

  /*
   * ภาษีต่างประเทศทั้งหมด
   * ที่เกี่ยวกับเงินได้ก้อนนี้
   */
  foreignTaxPaid: number;

  /*
   * ภาษีต่างประเทศส่วนที่สัมพันธ์
   * กับยอดที่นำเข้าไทย
   *
   * ยังไม่ใช่เครดิตภาษีที่ใช้ได้จริง
   */
  foreignTaxPaidAttributableToRemittance:
    number;

  isTaxable: boolean;

  /*
   * false เมื่อยังขาดข้อมูลสำคัญ
   * เช่น residence ในปีที่เกิดเงินได้
   */
  isComplete: boolean;

  reason:
    ForeignIncomeTaxabilityReason;
}

interface CalculateForeignIncomeTaxabilityInput {
  amount: number;

  foreignSource:
    ForeignIncomeSourceData;

  filingTaxYear: number;
}

export function calculateForeignIncomeTaxability(
  input:
    CalculateForeignIncomeTaxabilityInput
): ForeignIncomeTaxabilityResult {
  const {
    amount,
    foreignSource,
    filingTaxYear,
  } = input;

  const foreignIncomeAmount =
    Math.max(
      0,
      amount
    );

  const remittedAmount =
    Math.min(
      foreignIncomeAmount,
      Math.max(
        0,
        foreignSource
          .remittedToThailandThisTaxYear
      )
    );

  const foreignTaxPaid =
    Math.max(
      0,
      foreignSource.foreignIncomeTaxPaid
    );

  const foreignTaxPaidAttributableToRemittance =
    foreignIncomeAmount > 0
      ? foreignTaxPaid *
        (
          remittedAmount /
          foreignIncomeAmount
        )
      : 0;

  /*
   * ป.161 / ป.162
   * เงินได้ก่อน 1 ม.ค. 2567
   * ไม่อยู่ในหลักใหม่
   */
  if (
    foreignSource.incomeTaxYear <
    2567
  ) {
    return {
      foreignIncomeAmount,
      remittedAmount,
      taxableRemittance: 0,
      foreignTaxPaid,
      foreignTaxPaidAttributableToRemittance:
        0,
      isTaxable: false,
      isComplete: true,
      reason:
        "income_before_2567",
    };
  }

  /*
   * ปีเกิดเงินได้ไม่ควร
   * อยู่หลังปีที่กำลังยื่น
   */
  if (
    foreignSource.incomeTaxYear >
    filingTaxYear
  ) {
    return {
      foreignIncomeAmount,
      remittedAmount,
      taxableRemittance: 0,
      foreignTaxPaid,
      foreignTaxPaidAttributableToRemittance:
        0,
      isTaxable: false,
      isComplete: false,
      reason:
        "future_income_year",
    };
  }

  if (remittedAmount <= 0) {
    return {
      foreignIncomeAmount,
      remittedAmount,
      taxableRemittance: 0,
      foreignTaxPaid,
      foreignTaxPaidAttributableToRemittance:
        0,
      isTaxable: false,
      isComplete: true,
      reason:
        "no_remittance",
    };
  }

  if (
    foreignSource
      .isThaiTaxResidentInIncomeYear ===
    null
  ) {
    return {
      foreignIncomeAmount,
      remittedAmount,
      taxableRemittance: 0,
      foreignTaxPaid,
      foreignTaxPaidAttributableToRemittance,
      isTaxable: false,
      isComplete: false,
      reason:
        "residency_unknown",
    };
  }

  if (
    !foreignSource
      .isThaiTaxResidentInIncomeYear
  ) {
    return {
      foreignIncomeAmount,
      remittedAmount,
      taxableRemittance: 0,
      foreignTaxPaid,
      foreignTaxPaidAttributableToRemittance:
        0,
      isTaxable: false,
      isComplete: true,
      reason:
        "non_resident_in_income_year",
    };
  }

  return {
    foreignIncomeAmount,
    remittedAmount,
    taxableRemittance:
      remittedAmount,
    foreignTaxPaid,
    foreignTaxPaidAttributableToRemittance,
    isTaxable: true,
    isComplete: true,
    reason: "taxable",
  };
}