import { TAX_RULES_2569 } from "@/tax-rules/2569";
import type { IncomeData } from "@/types/income";

/**
 * Educational estimate of annual personal income tax attributable to
 * domestic Section 40(1) employment income. This is NOT an employer
 * withholding schedule or a credit in the final Tax Engine.
 *
 * - Salary is monthly; annual bonus and other employment income are annual.
 * - 12 salary payments are *assumed* unless an explicit count is supplied.
 * - Recorded annual social-security contributions are applied only if > 0.
 * - Section 40(2), foreign income, other exemptions and payroll adjustments
 *   are deliberately outside this simple estimator.
 */
export type EmploymentEstimateIncome = Readonly<
  Pick<IncomeData, "monthlySalary" | "annualBonus" | "otherEmploymentIncome">
>;

export interface WithholdingEstimateInput {
  taxYear: number;
  income: EmploymentEstimateIncome;
  annualSocialSecurityPaid?: number | null;
  /** Optional explicit number of monthly salary payments (0..12); not a UI input. */
  salaryMonthsInYear?: number | null;
}

export interface WithholdingEstimate {
  taxYear: 2569;
  hasEmploymentIncome: boolean;
  salaryMonthsUsed: number;
  salaryMonthsAssumed: boolean;
  annualSalary: number;
  annualBonus: number;
  annualOtherEmploymentIncome: number;
  annualEmploymentIncome: number;
  employmentExpense: number;
  personalAllowance: number;
  socialSecurityDeduction: number;
  socialSecuritySource: "recorded" | "excluded";
  taxableIncome: number;
  estimatedAnnualTax: number;
  illustrativeMonthlyAverage: number;
}

const safeNonnegative = (amount: number | null | undefined): number =>
  typeof amount === "number" && Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;

const roundSatang = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

export function estimateSection40_1Withholding(
  input: Readonly<WithholdingEstimateInput>,
): WithholdingEstimate {
  const rules = TAX_RULES_2569;
  if (input.taxYear !== rules.taxYear) {
    throw new Error("Section 40(1) withholding estimate supports tax year 2569 only");
  }

  const salaryMonthsAssumed = input.salaryMonthsInYear == null;
  const salaryMonthsUsed = salaryMonthsAssumed ? 12 : input.salaryMonthsInYear!;
  if (
    !Number.isInteger(salaryMonthsUsed) ||
    salaryMonthsUsed < 0 ||
    salaryMonthsUsed > 12
  ) {
    throw new RangeError("Salary months must be a whole number from 0 to 12");
  }

  const annualSalary =
    safeNonnegative(input.income.monthlySalary) * salaryMonthsUsed;
  const annualBonus = safeNonnegative(input.income.annualBonus);
  const annualOtherEmploymentIncome =
    safeNonnegative(input.income.otherEmploymentIncome);
  const annualEmploymentIncome =
    annualSalary + annualBonus + annualOtherEmploymentIncome;
  const employmentExpense = Math.min(
    annualEmploymentIncome * rules.employmentExpense.rate,
    rules.employmentExpense.max,
  );
  const personalAllowance = rules.allowances.taxpayer;

  const socialSecuritySource =
    input.annualSocialSecurityPaid != null &&
    Number.isFinite(input.annualSocialSecurityPaid) &&
    input.annualSocialSecurityPaid > 0
      ? "recorded"
      : "excluded";
  const socialSecurityDeduction =
    socialSecuritySource === "recorded"
      ? Math.min(
          safeNonnegative(input.annualSocialSecurityPaid),
          rules.deductions.general.socialSecurityMax,
        )
      : 0;

  const taxableIncome = Math.max(
    0,
    annualEmploymentIncome -
      employmentExpense -
      personalAllowance -
      socialSecurityDeduction,
  );

  let tax = 0;
  let bracketFloor = 0;
  // Reuse the same verified 2569 progressive brackets as the Tax Engine.
  for (const bracket of rules.taxBrackets) {
    const bracketCeiling = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const taxablePortion = Math.max(
      0,
      Math.min(taxableIncome, bracketCeiling) - bracketFloor,
    );
    tax += taxablePortion * bracket.rate;
    bracketFloor = bracketCeiling;
    if (taxableIncome <= bracketCeiling) break;
  }
  const estimatedAnnualTax = roundSatang(tax);

  return {
    taxYear: 2569,
    hasEmploymentIncome: annualEmploymentIncome > 0,
    salaryMonthsUsed,
    salaryMonthsAssumed,
    annualSalary,
    annualBonus,
    annualOtherEmploymentIncome,
    annualEmploymentIncome,
    employmentExpense,
    personalAllowance,
    socialSecurityDeduction,
    socialSecuritySource,
    taxableIncome,
    estimatedAnnualTax,
    illustrativeMonthlyAverage: roundSatang(estimatedAnnualTax / 12),
  };
}
