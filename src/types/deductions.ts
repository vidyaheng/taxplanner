export interface ParentHealthInsurancePolicyData {
  id: string;

  /*
   * parent.id จาก FamilyData.parents
   *
   * null = ยังไม่ได้เลือก
   * ว่ากรมธรรม์นี้ทำให้บิดา/มารดาคนใด
   */
  parentId: string | null;

  /*
   * เบี้ยประกันสุขภาพที่จ่ายจริง
   * สำหรับกรมธรรม์นี้ในปีภาษี
   *
   * ถ้ามีหลายคนร่วมจ่าย
   * ให้กรอกยอดรวมของกรมธรรม์
   * ก่อนนำมาเฉลี่ย
   */
  premiumPaidThisYear: number;

  /*
   * จำนวนผู้มีเงินได้ที่ร่วมกัน
   * จ่ายเบี้ยกรมธรรม์นี้
   *
   * 1 = ผู้ใช้จ่ายคนเดียว
   * มากกว่า 1 = ร่วมจ่าย
   * null = ยังไม่ได้ตอบ
   */
  jointPayerCount: number | null;
}

export interface DeductionData {
  /*
   * Insurance
   */
  lifeInsurance: number;
  healthInsuranceSelf: number;
  spouseLifeInsurance: number;

  /*
  * legacy aggregate field
  */
  parentHealthInsurance: number;

  /*
  * รายการแบบละเอียด
  *
  * undefined = legacy localStorage
  */
  parentHealthInsurancePolicies?:
    ParentHealthInsurancePolicyData[];

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
  * Temporary tax measures / exemptions
  *
  * optional เพื่อรองรับ localStorage
  * จาก schema เวอร์ชันเก่า
  */
  solarRooftop?: number;
  artPurchase?: number;

  /*
   * Donations
   */
  politicalDonation: number;
  specialDonation: number;
  generalDonation: number;

  /*
  * พ.ร.ฎ. 804
  * เงินบริจาคให้กองทัพอากาศ
  * เพื่อโครงการสร้างพระสถูปเจดีย์
  *
  * เป็นสิทธิ 1 เท่า และอยู่ในกลุ่ม
  * เพดานร่วมกับเงินบริจาคทั่วไป
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  airForceStupaDonation?: number;

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

  solarRooftop?: DeductionUsageItem;

  artPurchase?: DeductionUsageItem;

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

    solarRooftopMax?: number;

    artPurchaseMax?: number;
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
  * optional ระหว่าง migration
  * จนกว่า Engine/UI จะรองรับครบ
  */
  airForceStupaDonation?:
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