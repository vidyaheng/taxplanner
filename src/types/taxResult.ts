import {
  InsuranceDeductionResult,
  RetirementDeductionResult,
  GeneralDeductionResult,
  PregnancyDeductionResult,
  DonationDeductionResult,
} from "@/types/deductions";

export interface FamilyAllowanceBreakdown {
  taxpayer: number;
  spouse: number;
  children: number;
  parents: number;
  disabledDependents: number;

  total: number;
}

export interface TaxResult {
  taxYear: number;

  totalGrossIncome: number;

  supportedIncome: {
    section40_1: number;
    section40_2: number;
    total: number;
  };

  employmentExpense: number;

  incomeAfterExpenses: number;

  familyAllowances:
    FamilyAllowanceBreakdown;

  /*
   * หลังหักค่าใช้จ่าย
   * และค่าลดหย่อนครอบครัว
   * แต่ก่อนหัก deduction อื่น
   */
  incomeAfterFamilyAllowances: number;

  /*
   * Insurance deductions
   */
  insuranceDeductions:
    InsuranceDeductionResult;

  retirementDeductions:
  RetirementDeductionResult;

  generalDeductions:
  GeneralDeductionResult;

  pregnancyDeductions:
  PregnancyDeductionResult;

  donationDeductions:
  DonationDeductionResult;

  /*
   * ตอนนี้รวมเฉพาะ deduction
   * ที่ Engine รองรับแล้ว
   */
  totalCurrentDeductions: number;

  taxableIncome: number;

  method1Tax: number;

  method2Tax: number;

  taxBeforeCurrentDeductions: number;

  taxBeforeCredits: number;

  taxSavingsFromCurrentDeductions: number;

  marginalTaxRate: number;

  isComplete: boolean;

  warnings: string[];
}