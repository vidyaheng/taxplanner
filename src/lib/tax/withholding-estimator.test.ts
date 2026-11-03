import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { estimateSection40_1Withholding } from "./withholding-estimator";

const estimate = (
  salary: number,
  bonus = 0,
  other = 0,
  opts: { months?: number; socialSecurity?: number | null; taxYear?: number } = {},
) =>
  estimateSection40_1Withholding({
    taxYear: opts.taxYear ?? 2569,
    income: {
      monthlySalary: salary,
      annualBonus: bonus,
      otherEmploymentIncome: other,
    },
    salaryMonthsInYear: opts.months,
    annualSocialSecurityPaid: opts.socialSecurity,
  });

describe("Section 40(1) read-only withholding estimator, tax year 2569", () => {
  it("returns zero without employment income and does not present a value as actual tax", () => {
    const x = estimate(0);
    expect(x.hasEmploymentIncome).toBe(false);
    expect(x.annualEmploymentIncome).toBe(0);
    expect(x.estimatedAnnualTax).toBe(0);
    expect(x.illustrativeMonthlyAverage).toBe(0);
    expect(x.socialSecuritySource).toBe("excluded");
  });

  it("does not levy tax below the progressive threshold", () => {
    const x = estimate(20_000);
    expect(x.annualSalary).toBe(240_000);
    expect(x.employmentExpense).toBe(100_000);
    expect(x.taxableIncome).toBe(80_000);
    expect(x.estimatedAnnualTax).toBe(0);
  });

  it("makes the first 150,000 baht of net income tax-free", () => {
    const x = estimate(0, 310_000);
    expect(x.employmentExpense).toBe(100_000);
    expect(x.taxableIncome).toBe(150_000);
    expect(x.estimatedAnnualTax).toBe(0);
  });

  it.each([
    [460_000, 300_000, 7_500],
    [660_000, 500_000, 27_500],
    [910_000, 750_000, 65_000],
    [1_160_000, 1_000_000, 115_000],
    [2_160_000, 2_000_000, 365_000],
    [5_160_000, 5_000_000, 1_265_000],
  ])("reuses 2569 brackets at annual gross %i", (gross, taxable, tax) => {
    const x = estimate(0, gross);
    expect(x.taxableIncome).toBe(taxable);
    expect(x.estimatedAnnualTax).toBe(tax);
  });

  it("adds an annual bonus exactly once, rather than treating it as monthly", () => {
    const x = estimate(50_000, 120_000);
    expect(x.annualSalary).toBe(600_000);
    expect(x.annualBonus).toBe(120_000);
    expect(x.annualEmploymentIncome).toBe(720_000);
    expect(x.taxableIncome).toBe(560_000);
    expect(x.estimatedAnnualTax).toBe(36_500);
  });

  it("includes other annual 40(1) employment earnings exactly once", () => {
    const x = estimate(50_000, 0, 120_000);
    expect(x.annualOtherEmploymentIncome).toBe(120_000);
    expect(x.annualEmploymentIncome).toBe(720_000);
    expect(x.estimatedAnnualTax).toBe(36_500);
  });

  it("never counts Section 40(2) commission as 40(1) salary", () => {
    const income = {
      monthlySalary: 50_000,
      annualBonus: 0,
      otherEmploymentIncome: 0,
      hasOtherIncome: true,
      otherIncome: { commission: 200_000 },
    };
    const x = estimateSection40_1Withholding({ taxYear: 2569, income });
    expect(x.annualEmploymentIncome).toBe(600_000);
    expect(x.employmentExpense).toBe(100_000);
  });

  it("applies 50% expenses with one shared 100,000 baht ceiling", () => {
    expect(estimate(10_000).employmentExpense).toBe(60_000);
    expect(estimate(100_000).employmentExpense).toBe(100_000);
    expect(estimate(100_000).estimatedAnnualTax).toBe(125_000);
  });

  it("uses actual annual social-security contributions only when entered", () => {
    const unknown = estimate(50_000);
    const zero = estimate(50_000, 0, 0, { socialSecurity: 0 });
    const known = estimate(50_000, 0, 0, { socialSecurity: 10_000 });
    expect(unknown.socialSecuritySource).toBe("excluded");
    expect(zero.socialSecuritySource).toBe("excluded");
    expect(unknown.socialSecurityDeduction).toBe(0);
    expect(unknown.estimatedAnnualTax).toBe(21_500);
    expect(known.socialSecuritySource).toBe("recorded");
    expect(known.socialSecurityDeduction).toBe(10_000);
    expect(known.estimatedAnnualTax).toBe(20_500);
  });

  it("caps actually entered contributions using the shared 2569 rules", () => {
    const x = estimate(50_000, 0, 0, { socialSecurity: 50_000 });
    expect(x.socialSecurityDeduction).toBe(10_500);
    expect(x.taxableIncome).toBe(429_500);
    expect(x.estimatedAnnualTax).toBe(20_450);
  });

  it("shows illustrative annual / 12 average, not a payroll schedule", () => {
    const x = estimate(50_000, 120_000);
    expect(x.illustrativeMonthlyAverage).toBeCloseTo(36_500 / 12, 2);
    expect(x.estimatedAnnualTax).not.toBe(x.illustrativeMonthlyAverage);
  });

  it("makes default full-year salary assumption explicit and supports zero/part-year inputs", () => {
    const normal = estimate(100_000);
    const six = estimate(100_000, 0, 0, { months: 6 });
    const none = estimate(100_000, 120_000, 0, { months: 0 });
    expect(normal.salaryMonthsUsed).toBe(12);
    expect(normal.salaryMonthsAssumed).toBe(true);
    expect(six.salaryMonthsUsed).toBe(6);
    expect(six.salaryMonthsAssumed).toBe(false);
    expect(six.annualEmploymentIncome).toBe(600_000);
    expect(none.annualSalary).toBe(0);
    expect(none.annualBonus).toBe(120_000);
    expect(none.annualEmploymentIncome).toBe(120_000);
    expect(estimate(0, 120_000).annualEmploymentIncome).toBe(120_000);
  });

  it("rejects unsupported year and invalid pay-period counts", () => {
    expect(() => estimate(50_000, 0, 0, { taxYear: 2570 })).toThrow(/2569/);
    expect(() => estimate(50_000, 0, 0, { months: -1 })).toThrow(RangeError);
    expect(() => estimate(50_000, 0, 0, { months: 13 })).toThrow(RangeError);
    expect(() => estimate(50_000, 0, 0, { months: 2.5 })).toThrow(RangeError);
  });

  it("is pure and independent from the actual withholding field", () => {
    const income = {
      monthlySalary: 100_000,
      annualBonus: 0,
      otherEmploymentIncome: 0,
      section40_1TaxWithheld: 12_345,
    };
    const before = structuredClone(income);
    const first = estimateSection40_1Withholding({ taxYear: 2569, income });
    const incomeWithDifferentActual = {
      ...income,
      section40_1TaxWithheld: 99_999,
    };
    const second = estimateSection40_1Withholding({
      taxYear: 2569,
      income: incomeWithDifferentActual,
    });
    expect(income).toEqual(before);
    expect(first).toEqual(second);
    expect(first.estimatedAnnualTax).toBe(125_000);
  });

  it("keeps one salary/bonus input each and preserves the actual 40(1) input handler", () => {
    const page = readFileSync(
      new URL("../../app/planning/income/page.tsx", import.meta.url),
      "utf8",
    );
    const logic = readFileSync(new URL("./withholding-estimator.ts", import.meta.url), "utf8");
    expect(page.match(/label="เงินเดือนต่อเดือน"/g)).toHaveLength(1);
    expect(page.match(/label="โบนัสทั้งปี"/g)).toHaveLength(1);
    expect(page.match(/label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40\(1\)"/g)).toHaveLength(1);
    expect(page).toMatch(/setIncome\(\{\s*section40_1TaxWithheld:\s*value\s*\}\)/);
    expect(page).toContain("estimatedAnnualTax");
    expect(page).toContain("ดูวิธีประมาณการ");
    expect(logic).not.toContain("section40_1TaxWithheld");
    expect(logic).not.toContain("calculateTax(");
    expect(logic).not.toContain("setIncome(");
    expect(logic).not.toContain("localStorage");
  });
});
