export type OtherIncomeKey =
  | "commission"
  | "rent"
  | "professional"
  | "business"
  | "investment"
  | "other";

export interface OtherIncomeData {
  commission: number;
  rent: number;
  professional: number;
  business: number;
  investment: number;
  other: number;
}

export interface IncomeData {
  monthlySalary: number;
  annualBonus: number;
  otherEmploymentIncome: number;

  hasOtherIncome: boolean;

  otherIncome: OtherIncomeData;
}