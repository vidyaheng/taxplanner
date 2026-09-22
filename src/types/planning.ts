export interface PlanningData {
  lifeInsurance: number;

  healthInsuranceSelf: number;

  pensionInsurance: number;

  rmf: number;

  thaiEsg: number;
}

export type PlanningField =
  keyof PlanningData;


export type PlanningLimitReasonType =
  | "individual_limit"
  | "income_percentage_limit"
  | "combined_limit"
  | "shared_retirement_limit";


export interface PlanningLimitReason {
  type: PlanningLimitReasonType;

  /*
   * ข้อความหัวข้อสั้น ๆ
   * เช่น "ติดเพดานตามรายได้"
   */
  title: string;

  /*
   * ตัวเลขสำหรับให้ UI อธิบาย
   * โดย UI ไม่ต้องคำนวณสูตรเอง
   */
  limit?: number;
  used?: number;
  remaining?: number;

  /*
   * เช่น 0.15 = 15%
   * ใช้เฉพาะกรณีที่มีเพดานตามรายได้
   */
  incomeRate?: number;

  assessableIncome?: number;
}

export type PlanningSideEffectKey =
  | "lifeInsurance"
  | "healthInsuranceSelf"
  | "pensionInsurance"
  | "providentFund"
  | "gpf"
  | "privateTeacherFund"
  | "nsf"
  | "rmf"
  | "thaiEsg"
  | "socialSecurity"
  | "homeLoanInterest"
  | "socialEnterpriseInvestment"
  | "solarRooftop"
  | "artPurchase"
  | "specialDonation"
  | "generalDonation"
  | "airForceStupaDonation"
  | "politicalDonation";


export interface PlanningSideEffect {
  key: PlanningSideEffectKey;

  /*
   * สิทธิเดิมก่อนเพิ่มรายการนี้
   */
  beforeAllowed: number;

  /*
   * สิทธิหลังเพิ่มรายการนี้
   */
  afterAllowed: number;

  /*
   * afterAllowed - beforeAllowed
   *
   * ถ้าติดลบ = สิทธิเดิมลดลง
   */
  change: number;
}

export interface PlanningUsageItem {
  planned: number;

  /*
   * สิทธิของ "รายการนี้เอง"
   * ที่เพิ่มขึ้นจริง
   *
   * เช่น ซื้อประกันเพิ่ม 100,000
   * และเข้าเงื่อนไขเต็ม
   * = 100,000
   *
   * ห้ามนำผลกระทบต่อ deduction
   * รายการอื่นมาหักออกจากค่านี้
   */
  allowedAdditional: number;

  /*
   * ผลต่อค่าลดหย่อนรวมสุทธิ
   * หลังรวมผลกระทบต่อรายการอื่น
   *
   * เช่น
   * ประกันเพิ่ม +100,000
   * สิทธิบริจาคลด -10,000
   * netDeductionChange = 90,000
   */
  netDeductionChange: number;

  /*
   * ส่วนของยอดที่กำลังวางแผน
   * ซึ่งรายการนี้เองใช้สิทธิไม่ได้
   */
  excess: number;

  /*
   * สิทธิรายการอื่นที่เปลี่ยน
   * เพราะเพิ่มรายการนี้
   */
  sideEffects: PlanningSideEffect[];

  reasons: PlanningLimitReason[];
}


export type PlanningUsageResult = {
  [K in PlanningField]:
    PlanningUsageItem;
};