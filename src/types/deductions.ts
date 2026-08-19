export interface DeductionData {
  /*
   * Insurance
   */
  lifeInsurance: number;
  healthInsuranceSelf: number;
  spouseLifeInsurance: number;
  parentHealthInsurance: number;
  pensionInsurance: number;

  /*
   * Retirement
   */
  providentFund: number;
  gpf: number;
  privateTeacherFund: number;
  nsf: number;
  rmf: number;

  /*
   * Sustainable investment
   */
  thaiEsg: number;

  /*
  * มูลค่า LTF ที่สับเปลี่ยนเป็น Thai ESGX
  * ตามมาตรการปี 2568
  *
  * ผู้ใช้กรอกยอดที่สับเปลี่ยนจริง
  * Engine เป็นผู้คำนวณสิทธิปี 2569-2572
  */
  ltfToThaiEsgxTransferAmount: number;

  /*
   * General deductions
   */
  socialSecurity: number;
  homeLoanInterest: number;
  pregnancyAndChildbirth: number;
  socialEnterpriseInvestment: number;

  /*
   * Donations
   */
  politicalDonation: number;
  specialDonation: number;
  generalDonation: number;
}

export interface DeductionUsageItem {
  paid: number;
  allowed: number;
  excess: number;
}

export interface InsuranceDeductionResult {
  lifeInsurance: DeductionUsageItem;

  healthInsuranceSelf: DeductionUsageItem;

  spouseLifeInsurance: DeductionUsageItem;

  parentHealthInsurance: DeductionUsageItem;

  totalPaid: number;

  totalAllowed: number;

  totalExcess: number;

  limits: {
    lifeAndHealthCombinedMax: number;
    healthSelfMax: number;
  };

  warnings: string[];
}

export interface RetirementDeductionResult {
  providentFund: DeductionUsageItem;

  gpf: DeductionUsageItem;

  privateTeacherFund: DeductionUsageItem;

  nsf: DeductionUsageItem;

  rmf: DeductionUsageItem;

  pensionInsurance: DeductionUsageItem;

  pensionUsedAsLifeInsurance: number;

  pensionExtraAllowed: number;

  sharedLimitUsed: number;

  sharedLimitRemaining: number;

  totalPaid: number;

  totalAllowed: number;

  totalExcess: number;

  pensionLifeRoomAvailable: number;

  limits: {
    sharedMax: number;

    pensionIncomeRate: number;
    pensionIncomeLimit: number;
    pensionExtraMax: number;

    rmfIncomeRate: number;
    rmfIncomeLimit: number;
    rmfMax: number;
  };

  warnings: string[];
}

export interface ThaiEsgxTransferYearResult {
  taxYear: number;
  allowed: number;
}

export interface ThaiEsgxTransferResult {
  transferredAmount: number;

  eligibleTransferAmount: number;

  transferAmountOverLimit: number;

  allowedThisYear: number;

  schedule: ThaiEsgxTransferYearResult[];
}

export interface GeneralDeductionResult {
  socialSecurity: DeductionUsageItem;

  homeLoanInterest: DeductionUsageItem;

  thaiEsg: DeductionUsageItem;

  thaiEsgxTransfer:
  ThaiEsgxTransferResult;

  socialEnterpriseInvestment: DeductionUsageItem;

  totalPaid: number;

  totalAllowed: number;

  totalExcess: number;

  limits: {
    thaiEsgIncomeRate: number;
    thaiEsgIncomeLimit: number;
    thaiEsgMax: number;

    thaiEsgxTransferMax: number;
    thaiEsgxFirstYearMax: number;
    thaiEsgxCarryForwardYears: number;
  };

  warnings: string[];
}

export interface PregnancyDeductionItemResult {
  id: string;

  paidThisYear: number;

  claimedPreviousYears: number;

  remainingLimitBeforeThisYear: number;

  allowedThisYear: number;

  excessThisYear: number;
}

export interface PregnancyDeductionResult {
  items: PregnancyDeductionItemResult[];

  totalPaid: number;

  totalAllowed: number;

  totalExcess: number;

  warnings: string[];
}

export interface SpecialDonationUsageItem {
  paid: number;

  multiplier: number;

  deductionBeforeCap: number;

  allowed: number;

  disallowedDeduction: number;
}

export interface DonationDeductionResult {
  politicalDonation:
    DeductionUsageItem;

  specialDonation:
    SpecialDonationUsageItem;

  generalDonation:
    DeductionUsageItem;

  /*
   * ฐานก่อนบริจาคทุกประเภท
   */
  baseBeforeDonations: number;

  /*
   * ฐานหลัง political donation
   * ใช้คำนวณเพดาน special donation
   */
  baseForSpecialDonation: number;

  specialDonationLimit: number;

  /*
   * ฐานหลัง special donation
   * ใช้คำนวณเพดาน general donation
   */
  baseForGeneralDonation: number;

  generalDonationLimit: number;

  totalPaid: number;

  totalAllowed: number;

  warnings: string[];
}