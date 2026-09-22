export type MaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed";

export type ChildRelationship =
  | "legal"
  | "adopted";

export interface ChildData {
  id: string;

  relationship: ChildRelationship;

  // พ.ศ. เช่น 2560
  birthYearBE: number | null;

  /*
  * บิดา / มารดา อายุ 60 ปีขึ้นไปหรือไม่
  *
  * null / undefined = ยังไม่ได้ตอบ
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  age60OrOlder?: boolean | null;

  // ใช้พิจารณากรณีอายุ 20-25 ปี
  studyingHigherEducation: boolean;

  // เงินได้พึงประเมินของบุตรในปีภาษี
  annualAssessableIncome: number;

  // อยู่ในความอุปการะ
  supportedByTaxpayer: boolean;

  /*
  * บุตรอยู่ในประเทศไทยรวมถึง 180 วัน
  * ใช้เฉพาะกรณีผู้มีเงินได้
  * ไม่เป็นผู้อยู่ในประเทศไทย
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  stayedInThailand180Days?: boolean | null;
}

export type ParentOwner =
  | "taxpayer"
  | "spouse";

export type ParentRelation =
  | "father"
  | "mother";

export interface ParentData {
  id: string;

  owner: ParentOwner;

  relation: ParentRelation;

  birthYearBE: number | null;

  /*
  * บิดา / มารดา อายุ 60 ปีขึ้นไปหรือไม่
  *
  * null / undefined = ยังไม่ได้ตอบ
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  age60OrOlder?: boolean | null;

  annualAssessableIncome: number;

  supportedByTaxpayer: boolean;

  /*
  * มีผู้มีเงินได้คนอื่นใช้สิทธิ
  * บุพการีคนนี้แล้วหรือไม่
  *
  * null / undefined = ยังไม่ได้ตอบ
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  claimedByOtherTaxpayer?: boolean | null;

  /*
  * บิดา / มารดาอยู่ในประเทศไทยหรือไม่
  *
  * ใช้เฉพาะกรณีผู้มีเงินได้
  * มิได้เป็นผู้อยู่ในประเทศไทย
  *
  * true = อยู่ในประเทศไทย
  * false = ไม่ได้อยู่ในประเทศไทย
  * null = ยังไม่ได้ตอบ
  * undefined = ข้อมูลเก่าที่ยังไม่มี field นี้
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  isInThailand?: boolean | null;
}

export type DisabledDependentType =
  | "disabled"
  | "incapacitated";

export type DisabledDependentRelation =
  | "father"
  | "mother"
  | "spouseFather"
  | "spouseMother"
  | "spouse"
  | "child"
  | "spouseChild"
  | "other";

export interface DisabledDependentData {
  id: string;

  type: DisabledDependentType;

  relation: DisabledDependentRelation;

  annualAssessableIncome: number;

  supportedByTaxpayer: boolean;

  /*
  * มีผู้มีเงินได้คนอื่นใช้สิทธิ
  * บุคคลนี้แล้วหรือไม่
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  claimedByOtherTaxpayer?: boolean | null;

  /*
  * อยู่ในประเทศไทยรวมถึง 180 วัน
  * ใช้เฉพาะกรณีผู้มีเงินได้
  * ไม่เป็นผู้อยู่ในประเทศไทย
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  stayedInThailand180Days?: boolean | null;

  /*
  * มีหลักฐานตามเงื่อนไขครบหรือไม่
  *
  * null / undefined = ยังไม่ได้ตอบ
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  hasRequiredEvidence?: boolean | null;
}

export interface PregnancyExpenseData {
  id: string;

  /*
   * ค่าใช้จ่ายของการตั้งครรภ์คราวนี้
   * ที่จ่ายในปีภาษีปัจจุบัน
   */
  paidThisYear: number;

  /*
   * สิทธิของการตั้งครรภ์คราวเดียวกัน
   * ที่เคยใช้ไปในปีก่อน
   */
  claimedPreviousYears: number;
}

export interface SeniorIncomeExemptionAllocation {
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
   * optional เพื่อ compatibility
   * กับข้อมูล localStorage เวอร์ชันเดิม
   */
  section40_8?: number;
}

export interface FamilyData {
  /*
   * อายุของผู้มีเงินได้ในปีภาษี
   */
  taxpayerAge65OrOlder: boolean | null;

  /*
   * อยู่ในประเทศไทยรวม 180 วันขึ้นไป
   * ในปีภาษีหรือไม่
   */
  isThaiTaxResident: boolean | null;

  isThaiNational: boolean | null;

  seniorIncomeExemptionAllocation:
  SeniorIncomeExemptionAllocation;

  maritalStatus: MaritalStatus;

  spouseHasIncome: boolean;

  /*
  * คู่สมรสมีเงินได้พึงประเมินหรือไม่
  *
  * true = มีเงินได้
  * false = ไม่มีเงินได้
  * null = ยังไม่ได้ตอบ
  * undefined = ข้อมูลเก่าที่ยังไม่มี field นี้
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  spouseHasAssessableIncome?:
    boolean | null;

  /*
  * มีความเป็นสามีภริยาตลอดปีภาษีหรือไม่
  *
  * true = ตลอดปีภาษี
  * false = ไม่ตลอดปีภาษี
  * null / undefined = ยังไม่ได้ตอบ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  marriedFullTaxYear?: boolean | null;

  /*
  * ใช้เมื่อสถานะปัจจุบันเป็นหย่าหรือหม้าย
  *
  * true = การสมรสสิ้นสุดภายในปีภาษีนี้
  * false = การสมรสสิ้นสุดก่อนปีภาษีนี้
  * null / undefined = ยังไม่ได้ตอบ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  marriageEndedThisTaxYear?: boolean | null;

  /*
  * ใช้เมื่อสถานะเป็นหย่าหรือหม้าย
  * และการสมรสสิ้นสุดภายในปีภาษีนี้
  *
  * true = อดีตคู่สมรสมีเงินได้พึงประเมินในปีภาษีนี้
  * false = ไม่มีเงินได้พึงประเมินในปีภาษีนี้
  * null / undefined = ยังไม่ได้ตอบ
  *
  * optional เพื่อ compatibility
  * กับ localStorage เวอร์ชันเดิม
  */
  formerSpouseHadAssessableIncomeThisTaxYear?:
    boolean | null;

  children: ChildData[];

  parents: ParentData[];

  disabledDependents: DisabledDependentData[];

  pregnancies: PregnancyExpenseData[];
}