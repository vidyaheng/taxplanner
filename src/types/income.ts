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
}

export interface Section40_3AnnuityIncomeData {
  id: string;
  incomeType: "annuity";
  amount: number;
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

  category:
    Section40_8Category | null;

  expenseMethod:
    ExpenseMethod;

  actualExpense: number;
}

export interface IncomeData {
  monthlySalary: number;
  annualBonus: number;
  otherEmploymentIncome: number;

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