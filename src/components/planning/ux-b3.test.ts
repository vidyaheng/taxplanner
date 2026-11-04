import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateTax } from "../../lib/tax/engine";
import {
  applyPlanningToDeductions,
  calculatePlanningCapacity,
  calculatePlanningUsageDetails,
} from "../../lib/tax/scenarios";
import {
  getDeductionCapacityView,
  getPensionCapacitySplit,
} from "../../lib/ui/deduction-capacity";
import { plannedComparisonClass, plannedComparisonRowClass } from "../../lib/ui/planned-comparison";
import type { DeductionData } from "../../types/deductions";
import type { PlanningData } from "../../types/planning";

const planner = readFileSync(new URL("../../app/planning/planner/page.tsx", import.meta.url), "utf8");
const results = readFileSync(new URL("../../app/planning/results/page.tsx", import.meta.url), "utf8");

function emptyDeductions(): DeductionData {
  return {
    lifeInsurance: 0,
    healthInsuranceSelf: 0,
    spouseLifeInsurance: 0,
    parentHealthInsurance: 0,
    pensionInsurance: 0,
    providentFund: 0,
    gpf: 0,
    privateTeacherFund: 0,
    nsf: 0,
    rmf: 0,
    thaiEsg: 0,
    ltfToThaiEsgxTransferAmount: 0,
    socialSecurity: 0,
    homeLoanInterest: 0,
    pregnancyAndChildbirth: 0,
    socialEnterpriseInvestment: 0,
    politicalDonation: 0,
    specialDonation: 0,
    generalDonation: 0,
  };
}

function planned(overrides: Partial<PlanningData> = {}): PlanningData {
  return {
    lifeInsurance: 0,
    healthInsuranceSelf: 0,
    pensionInsurance: 0,
    rmf: 0,
    thaiEsg: 0,
    ...overrides,
  };
}

const income = {
  monthlySalary: 50_000,
  annualBonus: 0,
  otherEmploymentIncome: 0,
  hasOtherIncome: false,
  otherIncome: {
    commission: 0, rent: 0, professional: 0,
    business: 0, investment: 0, other: 0,
  },
  detailedOtherIncome: {
    section40_3: [],
    section40_4Interest: [],
    section40_4Dividend: [],
    section40_5: [],
    section40_6: [],
    section40_7: [],
    section40_8: [],
  },
};

const family = {
  taxpayerAge65OrOlder: null,
  isThaiTaxResident: null,
  isThaiNational: null,
  seniorIncomeExemptionAllocation: {
    section40_1: 0,
    section40_2: 0,
    section40_3Annuity: 0,
    section40_3Rights: 0,
    section40_4Interest: 0,
    section40_4Dividend: 0,
    section40_5: 0,
    section40_6: 0,
    section40_7: 0,
  },
  maritalStatus: "single" as const,
  spouseHasIncome: false,
  marriedFullTaxYear: false,
  children: [],
  parents: [],
  disabledDependents: [],
  pregnancies: [],
};

function fixture(
  deductions: DeductionData = emptyDeductions(),
  planning: PlanningData = planned()
) {
  const originalInputs = JSON.stringify({ deductions, planning, income, family });
  const compute = (d: DeductionData) =>
    calculateTax({ taxYear: 2569, income, family, deductions: d });
  const current = compute(deductions);
  const plannedDeductions = applyPlanningToDeductions(deductions, planning);
  const after = compute(plannedDeductions);
  const beforeCapacity = calculatePlanningCapacity(deductions, compute);
  const afterCapacity = calculatePlanningCapacity(plannedDeductions, compute);
  const usage = calculatePlanningUsageDetails(deductions, planning, compute);
  const view = (key: keyof PlanningData) =>
    getDeductionCapacityView(
      key, current, after, beforeCapacity, afterCapacity, planning, usage
    );
  expect(JSON.stringify({ deductions, planning, income, family })).toBe(originalInputs);
  return { current, after, beforeCapacity, afterCapacity, usage, view,
    split: getPensionCapacitySplit(current, after, beforeCapacity, afterCapacity) };
}

describe("UX-B3 — engine-authoritative deduction capacities (year 2569)", () => {
  it("splits salary 50,000 x 12 pension capacity into 100,000 ordinary + 90,000 extra", () => {
    const f = fixture();
    expect(f.current.totalGrossIncome).toBe(600_000);
    expect(f.current.retirementDeductions.limits.pensionIncomeLimit).toBe(90_000);
    expect(f.current.retirementDeductions.limits.sharedMax).toBe(500_000);
    expect(f.split.ordinaryRemaining).toBe(100_000);
    expect(f.split.extraRemaining).toBe(90_000);
    expect(f.split.totalRemaining).toBe(190_000);
    expect(f.view("pensionInsurance").conditionalCeiling).toBe(190_000);
  });

  it("existing life insurance 40,000 reduces the ordinary pension portion to 60,000", () => {
    const d = { ...emptyDeductions(), lifeInsurance: 40_000 };
    const f = fixture(d);
    expect(f.current.insuranceDeductions.lifeInsurance.allowed).toBe(40_000);
    expect(f.split.ordinaryRemaining).toBe(60_000);
    expect(f.split.extraRemaining).toBe(90_000);
    expect(f.split.totalRemaining).toBe(150_000);
  });

  it("RMF and Thai ESG each have 180,000 income-related individual limits but separate frameworks", () => {
    const f = fixture();
    expect(f.current.retirementDeductions.limits.rmfIncomeLimit).toBe(180_000);
    expect(f.current.generalDeductions.limits.thaiEsgIncomeLimit).toBe(180_000);
    expect(f.beforeCapacity.rmf).toBe(180_000);
    expect(f.beforeCapacity.thaiEsg).toBe(180_000);
    expect(f.current.retirementDeductions.limits.sharedMax).toBe(500_000);
    expect(f.current.generalDeductions.limits.thaiEsgMax).toBe(300_000);
  });

  it("existing other retirement contributions consume the shared limit and may be displaced by pension allocation", () => {
    const d = { ...emptyDeductions(), gpf: 450_000 };
    const f = fixture(d, planned({ pensionInsurance: 190_000 }));
    expect(f.current.retirementDeductions.sharedLimitRemaining).toBe(50_000);
    expect(f.after.retirementDeductions.pensionInsurance.allowed).toBe(190_000);
    expect(f.after.retirementDeductions.gpf.allowed).toBe(410_000);
    expect(f.view("pensionInsurance").additionalAllowed).toBe(190_000);
    expect(f.view("pensionInsurance").netDeductionChange).toBe(150_000);
    expect(f.after.totalCurrentDeductions - f.current.totalCurrentDeductions).toBe(150_000);
    expect(f.usage.pensionInsurance.sideEffects.some(
      (effect) => effect.key === "gpf" && effect.change < 0
    )).toBe(true);
  });

  it("an exhausted shared retirement ceiling allows no net deduction increase when ordinary life room is also full", () => {
    const d = { ...emptyDeductions(), lifeInsurance: 100_000, gpf: 500_000 };
    const f = fixture(d, planned({ pensionInsurance: 120_000 }));
    expect(f.current.retirementDeductions.sharedLimitRemaining).toBe(0);
    expect(f.split.ordinaryRemaining).toBe(0);
    expect(f.after.totalCurrentDeductions).toBe(f.current.totalCurrentDeductions);
    expect(f.view("pensionInsurance").netDeductionChange).toBe(0);
    expect(f.after.retirementDeductions.gpf.allowed).toBeLessThan(
      f.current.retirementDeductions.gpf.allowed
    );
  });

  it("RMF planned above remaining shared limit is capped by existing GPF allocations", () => {
    const f = fixture(
      { ...emptyDeductions(), gpf: 480_000 },
      planned({ rmf: 180_000 })
    );
    expect(f.beforeCapacity.rmf).toBe(20_000);
    expect(f.view("rmf").additionalPayment).toBe(180_000);
    expect(f.view("rmf").allowedAfter).toBe(20_000);
    expect(f.view("rmf").remainingAfter).toBe(0);
    expect(f.after.retirementDeductions.sharedLimitRemaining).toBe(0);
  });

  it("RMF income limit binds at 180,000 even if planned 200,000", () => {
    const f = fixture(emptyDeductions(), planned({ rmf: 200_000 }));
    expect(f.view("rmf").conditionalCeiling).toBe(180_000);
    expect(f.view("rmf").additionalPayment).toBe(200_000);
    expect(f.view("rmf").additionalAllowed).toBe(180_000);
    expect(f.view("rmf").allowedAfter).toBe(180_000);
    expect(f.view("rmf").remainingAfter).toBe(0);
  });

  it("Thai ESG's independent income limit binds even when retirement ceiling is full", () => {
    const d = { ...emptyDeductions(), gpf: 500_000 };
    const f = fixture(d, planned({ thaiEsg: 210_000 }));
    expect(f.beforeCapacity.rmf).toBe(0);
    expect(f.beforeCapacity.thaiEsg).toBe(180_000);
    expect(f.view("thaiEsg").additionalAllowed).toBe(180_000);
    expect(f.view("thaiEsg").allowedAfter).toBe(180_000);
    expect(f.view("thaiEsg").remainingAfter).toBe(0);
    expect(f.after.totalCurrentDeductions - f.current.totalCurrentDeductions).toBe(180_000);
  });

  it("planned eligible values and after-planning remaining capacities come exclusively from engine/scenarios", () => {
    const d = { ...emptyDeductions(), lifeInsurance: 40_000 };
    const f = fixture(d, planned({ lifeInsurance: 30_000, pensionInsurance: 30_000 }));
    expect(f.view("lifeInsurance").allowedCurrent).toBe(f.current.insuranceDeductions.lifeInsurance.allowed);
    expect(f.view("lifeInsurance").allowedAfter).toBe(f.after.insuranceDeductions.lifeInsurance.allowed);
    expect(f.view("pensionInsurance").allowedAfter).toBe(f.after.retirementDeductions.pensionInsurance.allowed);
    expect(f.view("pensionInsurance").remainingAfter).toBe(f.afterCapacity.pensionInsurance);
    expect(f.view("pensionInsurance").additionalAllowed).toBe(f.usage.pensionInsurance.allowedAdditional);
    expect(f.split.totalAfterRemaining).toBe(f.afterCapacity.pensionInsurance);
  });

  it("preserves PR #11 changed-row blue highlight and comparison display precision in Results", () => {
    expect(plannedComparisonRowClass("100 บาท", "100 บาท")).toBe("");
    expect(plannedComparisonRowClass("100 บาท", "101 บาท")).toBe("bg-blue-100/70");
    expect(plannedComparisonClass("100 บาท", "101 บาท")).toBe("font-bold text-blue-600");
    expect(plannedComparisonClass("100 บาท", "100 บาท")).toBe("font-medium text-slate-700");
    expect(results).toContain("plannedComparisonRowClass(formatNumber(item.current), formatNumber(item.planned))");
    expect(results).toContain("plannedComparisonRowClass(displayedCurrent, displayedPlanned)");
    expect(results).toContain("currentResult.taxCredits.withholdingTax");
    expect(results).toContain("plannedResult.taxCredits.withholdingTax");
  });

  it("keeps financial logic out of UX-B3 components and uses five existing planning fields", () => {
    expect(planner).toContain("getDeductionCapacityView(");
    expect(planner).toContain("getPensionCapacitySplit(");
    expect(planner).toContain("calculatePlanningCapacity(");
    expect(planner).toContain("calculatePlanningUsageDetails(");
    expect(planner).toContain("เบี้ยประกันบำนาญที่กำลังพิจารณาซื้อเพิ่ม");
    expect(planner).toContain("แยกจากเพดานเกษียณของ RMF");
    expect(planner).toContain("สิทธิลดหย่อนรวมสุทธิเปลี่ยน");
  });
});
