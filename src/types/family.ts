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

  // ใช้พิจารณากรณีอายุ 20-25 ปี
  studyingHigherEducation: boolean;

  // เงินได้พึงประเมินของบุตรในปีภาษี
  annualAssessableIncome: number;

  // อยู่ในความอุปการะ
  supportedByTaxpayer: boolean;
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

  annualAssessableIncome: number;

  supportedByTaxpayer: boolean;

  // มีบุคคลอื่นใช้สิทธิคนนี้แล้วหรือไม่
  claimedByOtherTaxpayer: boolean;
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

  // มีหลักฐาน/สถานะตามเกณฑ์หรือไม่
  hasRequiredEvidence: boolean;
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

  marriedFullTaxYear: boolean;

  children: ChildData[];

  parents: ParentData[];

  disabledDependents: DisabledDependentData[];

  pregnancies: PregnancyExpenseData[];
}