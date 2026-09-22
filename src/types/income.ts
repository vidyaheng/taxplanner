export type OtherIncomeKey =
  | "commission"
  | "rent"
  | "professional"
  | "business"
  | "investment"
  | "other";

export type ExpenseMethod =
  | "standard"
  | "actual";

/*
 * -------------------------
 * Foreign-source income
 * มาตรา 41 วรรคสอง
 * -------------------------
 *
 * ใช้กับเงินได้ตามมาตรา 40
 * ที่เกิดจากแหล่งต่างประเทศ
 *
 * จำนวนเงินทั้งหมดเก็บเป็นเงินบาท
 * หลังแปลงอัตราแลกเปลี่ยนแล้ว
 */

export interface ForeignTaxCreditDtaReviewData {
  isEligible: boolean;

  creditableForeignTaxPaidForRemittedIncome?:
    number | null;
}
export interface ForeignIncomeSourceData {
  /*
   * ประเทศแหล่งเงินได้
   */
  country: string;

  /*
   * ปีภาษีที่ "เกิดเงินได้"
   * เช่น 2567, 2568, 2569
   */
  incomeTaxYear: number;

  /*
   * จำนวนจากเงินได้ก้อนนี้
   * ที่นำเข้าประเทศไทย
   * ในปีภาษีที่กำลังคำนวณ
   *
   * ตัว amount ของ income item
   * ยังคงหมายถึงเงินได้ทั้งหมด
   * ที่เกิดในต่างประเทศ
   */
  remittedToThailandThisTaxYear:
    number;

  /*
   * ภาษีเงินได้ที่ชำระ
   * ในต่างประเทศของเงินได้ก้อนนี้
   *
   * ห้ามนำไปรวมกับ taxWithheld
   * ของประเทศไทย
   */
  foreignIncomeTaxPaid: number;

  /*
  * ค่าใช้จ่ายที่สัมพันธ์กับ
  * เงินได้ส่วนที่นำเข้าไทย
  * และต้องนำมาคำนวณภาษีในปีนี้
  *
  * ใช้เฉพาะกรณีที่ประเภทเงินได้
  * เลือกหักค่าใช้จ่ายตามจริง
  * หรือกรณีที่ต้องระบุค่าใช้จ่ายจริง
  *
  * ไม่ให้ Engine คำนวณสัดส่วนเอง
  * เพราะต้องอาศัยข้อเท็จจริงของรายการ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  expenseAttributableToRemittance?:
    number;

  /*
   * ต้องตรวจ residence
   * ใน "ปีที่เกิดเงินได้"
   * ไม่ใช่ปีที่นำเงินเข้าไทย
   */
  isThaiTaxResidentInIncomeYear:
    boolean | null;

  /*
   * ผลการตรวจสิทธิ Foreign Tax Credit
   * ตาม DTA ของเงินได้รายการนี้
   *
   * undefined = ยังไม่ได้ตรวจ
   *
   * optional เพื่อ compatibility
   * กับ localStorage เดิม
   */
  foreignTaxCreditDtaReview?:
    ForeignTaxCreditDtaReviewData;
}

export interface Section40_1ForeignIncomeData {
  id: string;

  /*
   * เงินได้ทั้งหมดที่เกิด
   * จากต่างประเทศ
   */
  amount: number;

  foreignSource:
    ForeignIncomeSourceData;
}

export interface Section40_2ForeignIncomeData {
  id: string;

  amount: number;

  foreignSource:
    ForeignIncomeSourceData;
}

/*
 * -------------------------
 * Section 40(3)
 * Goodwill / copyright /
 * other rights
 * -------------------------
 */

export interface Section40_3RightsIncomeData {
  id: string;
  amount: number;
  incomeType: "rights";
  expenseMethod:
    ExpenseMethod;

  actualExpense: number;

  /*
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  taxWithheld?: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;
}

export interface Section40_3AnnuityIncomeData {
  id: string;
  incomeType: "annuity";
  amount: number;

  /*
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  taxWithheld?: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;
}

export type Section40_3IncomeData =
  | Section40_3RightsIncomeData
  | Section40_3AnnuityIncomeData;

export type Section40_4TaxTreatment =
  | "final"
  | "include";


/*
 * -------------------------
 * Section 40(4)(a)
 * Interest
 * -------------------------
 */

export interface Section40_4InterestIncomeData {
  id: string;
  amount: number;

  /*
   * ภาษีที่ถูกหัก ณ ที่จ่าย
   * ตามหนังสือรับรอง
   */
  taxWithheld: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
   * final =
   * เลือกไม่นำมารวมคำนวณ
   *
   * include =
   * นำมารวมคำนวณภาษีปลายปี
   */
  taxTreatment:
    Section40_4TaxTreatment;
}


/*
 * -------------------------
 * Section 40(4)(b)
 * Dividend / profit share
 * -------------------------
 */

export interface Section40_4DividendIncomeData {
  id: string;
  amount: number;

  taxWithheld: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
   * เครดิตภาษีเงินปันผล
   * กรอกตามข้อมูลจากหนังสือรับรอง /
   * ข้อมูลผู้จ่าย
   */
  dividendTaxCredit: number;

  taxTreatment:
    Section40_4TaxTreatment;
}


/*
 * -------------------------
 * Section 40(5)
 * Rental income
 * -------------------------
 */

export type RentalAssetType =
  | "building"
  | "agriculturalLand"
  | "nonAgriculturalLand"
  | "vehicle"
  | "otherProperty";

export interface Section40_5RentalIncomeData {
  id: string;
  amount: number;

  /*
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  taxWithheld?: number;
  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
  * ค่าใช้จ่ายลงทุนในเครื่องจักร /
  * อุปกรณ์ประสิทธิภาพสูง หรือวัสดุ
  * เพื่อการอนุรักษ์พลังงาน
  *
  * เก็บ "ยอดลงทุนจริงที่เข้าเงื่อนไข"
  * ไม่รวมสิทธิเพิ่ม 50%
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  energyEfficientInvestment?: number;

  assetType:
    RentalAssetType | null;

  expenseMethod:
    ExpenseMethod;

  actualExpense: number;

  /*
   * กรณีเช่าช่วง
   */
  isSublease: boolean;

  subleaseRentPaid: number;
}


/*
 * -------------------------
 * Section 40(6)
 * Liberal professions
 * -------------------------
 */

export type ProfessionalType =
  | "medical"
  | "fineArts"
  | "other";

export interface Section40_6ProfessionalIncomeData {
  id: string;
  amount: number;

  taxWithheld?: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
  * ค่าใช้จ่ายลงทุนในเครื่องจักร /
  * อุปกรณ์ประสิทธิภาพสูง หรือวัสดุ
  * เพื่อการอนุรักษ์พลังงาน
  *
  * เก็บ "ยอดลงทุนจริงที่เข้าเงื่อนไข"
  * ไม่รวมสิทธิเพิ่ม 50%
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  energyEfficientInvestment?: number;

  professionalType:
    ProfessionalType | null;

  expenseMethod:
    ExpenseMethod;

  actualExpense: number;
}


/*
 * -------------------------
 * Section 40(7)
 * Contract work
 * -------------------------
 */

export interface Section40_7ContractIncomeData {
  id: string;
  amount: number;

  taxWithheld?: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
  * ค่าใช้จ่ายลงทุนในเครื่องจักร /
  * อุปกรณ์ประสิทธิภาพสูง หรือวัสดุ
  * เพื่อการอนุรักษ์พลังงาน
  *
  * เก็บ "ยอดลงทุนจริงที่เข้าเงื่อนไข"
  * ไม่รวมสิทธิเพิ่ม 50%
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  energyEfficientInvestment?: number;

  expenseMethod:
    ExpenseMethod;

  actualExpense: number;
}


/*
 * -------------------------
 * Section 40(8)
 * Business / commerce /
 * agriculture / transport /
 * other activities
 * -------------------------
 */

export type Section40_8Category =
  | "standard60"
  | "performer"
  | "actualOnly";

export interface Section40_8BusinessIncomeData {

  id: string;

  amount: number;

  /*
   * ภาษีที่ถูกหัก ณ ที่จ่ายจริง
   * ตามหนังสือรับรอง
   *
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  taxWithheld?: number;

  /*
  * มีค่าเมื่อรายการนี้
  * เป็นเงินได้จากต่างประเทศ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  foreignSource?:
    ForeignIncomeSourceData;

  /*
  * ค่าใช้จ่ายลงทุนในเครื่องจักร /
  * อุปกรณ์ประสิทธิภาพสูง หรือวัสดุ
  * เพื่อการอนุรักษ์พลังงาน
  *
  * เก็บ "ยอดลงทุนจริงที่เข้าเงื่อนไข"
  * ไม่รวมสิทธิเพิ่ม 50%
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  energyEfficientInvestment?: number;

  category:
    Section40_8Category | null;

  /*
   * ระบุชนิดกิจการจริง
   * ใช้แยกเงินได้ 40(8)
   * ที่อยู่ใน category เดียวกัน
   *
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  activityCode?: string | null;

  expenseMethod:
    ExpenseMethod;

  actualExpense: number;

}

export interface IncomeData {
  monthlySalary: number;
  annualBonus: number;
  otherEmploymentIncome: number;

  /*
   * ภาษีหัก ณ ที่จ่ายของเงินได้ 40(1)
   * เช่น เงินเดือน โบนัส ค่าจ้าง
   *
   * optional เพื่อ compatibility
   * กับ localStorage เดิม
   */
  section40_1TaxWithheld?: number;

  /*
   * ภาษีหัก ณ ที่จ่ายของเงินได้ 40(2)
   *
   * ตอนนี้ 40(2) ยังใช้โครงสร้าง
   * commission เดิมของระบบ
   *
   * optional เพื่อ compatibility
   */
  section40_2TaxWithheld?: number;

  /*
  * 40(1) และ 40(2) จากต่างประเทศ
  *
  * แยกรายการเพราะต้องรู้
  * ประเทศ + ปีที่เกิดเงินได้
  * + จำนวนที่นำเข้าไทย
  *
  * optional เพื่อ compatibility
  * กับ localStorage เดิม
  */
  section40_1ForeignIncome?:
    Section40_1ForeignIncomeData[];

  section40_2ForeignIncome?:
    Section40_2ForeignIncomeData[];

  hasOtherIncome: boolean;

  /*
   * โครงเดิม
   * เก็บไว้ชั่วคราวเพื่อ compatibility
   */
  otherIncome: OtherIncomeData;

  /*
   * รายได้ 40(3) - 40(8)
   * แบบแยกรายการ
   */
  detailedOtherIncome:
    DetailedOtherIncomeData;
}

export interface OtherIncomeData {
  commission: number;
  rent: number;
  professional: number;
  business: number;
  investment: number;
  other: number;
}

export interface DetailedOtherIncomeData {
  section40_3:
    Section40_3IncomeData[];

  section40_4Interest:
    Section40_4InterestIncomeData[];

  section40_4Dividend:
    Section40_4DividendIncomeData[];

  section40_5:
    Section40_5RentalIncomeData[];

  section40_6:
    Section40_6ProfessionalIncomeData[];

  section40_7:
    Section40_7ContractIncomeData[];

  section40_8:
    Section40_8BusinessIncomeData[];
}