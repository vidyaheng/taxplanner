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

export interface IncomeExemptionBreakdown {
  seniorResident: number;

  total: number;
}

export interface ForeignTaxCreditCountryResult {
  /*
   * ประเทศแหล่งเงินได้
   */
  country: string;

  /*
   * (N)
   * เงินได้ต่างประเทศที่นำเข้าไทย
   * และนำมาคำนวณ FTC
   */
  foreignIncomeRemitted: number;

  /*
   * (O)
   * ภาษีต่างประเทศที่สัมพันธ์
   * กับเงินได้ส่วนที่นำเข้า
   */
  foreignTaxPaidForRemittedIncome:
    number;

  /*
   * (P)
   * เพดานเครดิตภาษีไทย
   *
   * = N / Gross Income ทั้งหมด
   *   × ภาษีไทยที่ต้องชำระ
   */
  thaiTaxCreditLimit: number;

  /*
   * (Q)
   * เครดิตที่ใช้ได้จริง
   *
   * = min(O, P)
   */
  allowedCredit: number;

  /*
   * ส่วนที่ใช้เครดิตไม่ได้
   */
  disallowedCredit: number;
}

export interface ForeignTaxCreditResult {
  /*
   * FTC ต้องคำนวณ
   * แยกตามประเทศ
   */
  byCountry:
    ForeignTaxCreditCountryResult[];

  totalForeignTaxPaidForRemittedIncome:
    number;

  totalAllowedCredit: number;

  totalDisallowedCredit: number;

  /*
   * false เช่น
   * ยังตรวจสิทธิตาม DTA ไม่ครบ
   */
  isComplete: boolean;
}

export interface TaxCreditBreakdown {
  /*
   * ภาษีหัก ณ ที่จ่ายในประเทศไทย
   */
  withholdingTax: number;

  /*
   * เครดิตภาษีเงินปันผล
   * ตามมาตรา 47 ทวิ
   */
  dividendTaxCredit: number;

  /*
   * เครดิตภาษีเงินได้
   * จากต่างประเทศ
   *
   * optional ระหว่าง migration
   * เพื่อไม่ให้ consumer เดิมพัง
   */
  foreignTaxCredit?:
    ForeignTaxCreditResult;

  /*
   * เครดิตภาษีรวมที่ใช้
   * ในการคำนวณภาษี
   */
  total: number;
}

export interface TaxResult {
  taxYear: number;

  totalGrossIncome: number;

  /*
   * เงินได้ที่ได้รับยกเว้น
   * ไม่ใช่ค่าลดหย่อน
   */
  incomeExemptions:
    IncomeExemptionBreakdown;

  /*
   * เงินได้หลังหักเงินได้ที่ได้รับยกเว้น
   * แต่ก่อนหักค่าใช้จ่าย
   */
  incomeAfterExemptions: number;


  supportedIncome: {
    section40_1: number;
    section40_2: number;
    section40_3Annuity: number;
    section40_3Rights: number;
    section40_4Interest: number;
    section40_4Dividend: number;
    section40_5: number;
    section40_6: number;
    section40_7: number;
     /*
    * optional ระหว่าง migration
    * เพื่อไม่ให้ consumer เดิมพัง
    */
    section40_8?: number;
    total: number;
  };

  employmentExpense: number;

  incomeAfterExpenses: number;

  /*
  * พ.ร.ฎ. 805
  * ยอดลงทุนที่ผู้ใช้ยืนยันว่าเข้าเงื่อนไข
  * สำหรับเงินได้ 40(5)-40(8)
  */
  energyEfficientInvestmentQualifyingAmount:
    number;

  /*
  * เงินได้ที่ได้รับยกเว้นเพิ่มเติม
  * = qualifying investment × 50%
  */
  energyEfficientInvestmentExemption:
    number;

  /*
  * เงินได้หลังหักค่าใช้จ่ายปกติ
  * และสิทธิยกเว้น พ.ร.ฎ. 805
  * แต่ก่อนค่าลดหย่อนครอบครัว
  */
  incomeAfterEnergyEfficientInvestmentExemption:
    number;

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

  taxCredits: TaxCreditBreakdown;

  /*
  * ภาษีที่ยังต้องชำระหลังหักเครดิต
  */
  taxPayable: number;

  /*
  * เครดิตภาษีที่เกินภาษีที่คำนวณได้
  */
  taxRefund: number;

  taxSavingsFromCurrentDeductions: number;

  marginalTaxRate: number;

  effectiveTaxRate: number;

  isComplete: boolean;

  warnings: string[];
}