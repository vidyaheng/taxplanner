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


export interface PlanningUsageItem {
  planned: number;

  /*
   * deduction ที่เพิ่มขึ้นจริง
   */
  allowedAdditional: number;

  /*
   * ส่วนของ planning ที่ไม่ได้
   * ทำให้ deduction เพิ่มขึ้น
   */
  excess: number;

  reasons: PlanningLimitReason[];
}


export type PlanningUsageResult = {
  [K in PlanningField]:
    PlanningUsageItem;
};