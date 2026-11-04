import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateTax } from "../../lib/tax/engine";
import {
  applyPlanningToDeductions,
  calculatePlanningCapacity,
  calculatePlanningUsageDetails,
} from "../../lib/tax/scenarios";
import {
  getCapacityDisplay,
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
    expect(planner).toContain("จึงไม่สามารถนำสิทธิ RMF มาบวกซ้ำได้");
    expect(planner).toContain("สิทธิลดหย่อนรวมสุทธิเปลี่ยน");
  });
});

describe("UX-B3 Director simplification — exactly three primary metrics", () => {
  const input = planner.slice(
    planner.indexOf("function PlannerInput({"),
    planner.indexOf("function LimitReasonButton({")
  );

  it("has only three visible primary metric slots and reuses the original planning input", () => {
    expect((input.match(/data-b3-primary-metric="/g) ?? []).length).toBe(3);
    expect(input).toContain('data-b3-primary-metric="available"');
    expect(input).toContain('data-b3-primary-metric="planned"');
    expect(input).toContain('data-b3-primary-metric="balance"');
    expect((input.match(/<input/g) ?? []).length).toBe(1);
    expect(input).toContain("สิทธิที่ใช้ได้");
    expect(input).toContain("วางแผนซื้อเพิ่ม (บาท)");
    expect(input).toContain("วางแผนลงทุนเพิ่ม (บาท)");
    expect(input).toContain('isExcess ? "เกินสิทธิ" : "เหลือหลังวางแผน"');
    expect(input).toContain("onChange={(e) => onChange(parseNumber(e.target.value))}");
    expect(input).not.toContain("เพดานสิทธิ ณ ข้อมูลนี้");
    expect(input).not.toContain("จ่าย/ลงทุนอยู่แล้ว");
    expect(input).not.toContain("ใช้สิทธิหลังวางแผน");
  });

  it("places action beside category on desktop, stacks on mobile and keeps pension collapsed", () => {
    expect(input).toContain("sm:grid-cols-[minmax(0,1fr)_minmax(200px,240px)]");
    expect(input).toContain("data-b3-action-row");
    expect(input).toContain("data-b3-deduction-info");
    expect(input).toContain("grid-cols-2 gap-3 border-t border-slate-100");
    expect(input).toContain("min-w-0");
    expect(input.match(/<details/g)).toHaveLength(1);
    expect(input).not.toContain("<details open");
    expect(input).toContain("ที่มาของสิทธิ");
    expect(input).toContain("pensionSplit.ordinaryRemaining");
    expect(input).toContain("pensionSplit.extraRemaining");
    expect(input).toContain("retirementSharedRemaining");
    expect(input).toContain('isExcess ? "bg-amber-50" : "bg-teal-50/60"');
  });


  it("keeps the input in the category action row and exactly two read-only values beneath", () => {
    const actionStart = input.indexOf("data-b3-action-row");
    const infoStart = input.indexOf("data-b3-deduction-info");
    const disclosureStart = input.indexOf("{showCalculation && pensionSplit && (");
    expect(actionStart).toBeGreaterThan(0);
    expect(infoStart).toBeGreaterThan(actionStart);
    expect(disclosureStart).toBeGreaterThan(infoStart);

    const action = input.slice(actionStart, infoStart);
    const information = input.slice(infoStart, disclosureStart);
    expect(action).toContain("{label}");
    expect(action).toContain("{description}");
    expect(action).toContain("grid min-w-0 gap-3 sm:grid-cols-");
    expect(action).toContain("sm:items-center");
    expect(action.match(/<input/g)).toHaveLength(1);
    expect(action).toContain('data-b3-primary-metric="planned"');
    expect((information.match(/data-b3-primary-metric="/g) ?? []).length).toBe(2);
    expect(information).toContain('data-b3-primary-metric="available"');
    expect(information).toContain('data-b3-primary-metric="balance"');
    expect(information).not.toContain("<input");
    expect(information).toContain("สิทธิที่ใช้ได้");
    expect(information).toContain("เหลือหลังวางแผน");
    expect(information).toContain("เกินสิทธิ");
    expect(information).toContain("aria-live=\"polite\"");
    expect(information).toContain("aria-atomic=\"true\"");
    expect(information).toContain("formatNumber(display.amount)");
    expect(information).toContain('isExcess ? "text-amber-800" : "text-teal-800"');
  });

  it("uses field-specific labels and preserves keyboard/focus and numeric input handlers", () => {
    expect(input).toContain('fieldKey === "rmf" || fieldKey === "thaiEsg"');
    expect(input).toContain("วางแผนลงทุนเพิ่ม (บาท)");
    expect(input).toContain("วางแผนซื้อเพิ่ม (บาท)");
    expect(input).toContain("htmlFor={`planning-add-${fieldKey}`}");
    expect(input).toContain("id={`planning-add-${fieldKey}`}");
    expect(input).toContain("aria-label={`${label} — ${actionLabel}`}");
    expect(input).toContain('inputMode="numeric"');
    expect(input).toContain('value={value ? formatNumber(value) : ""}');
    expect(input).toContain("onChange={(e) => onChange(parseNumber(e.target.value))}");
    expect(input).toContain("focus:border-blue-500 focus:ring-4 focus:ring-blue-50");
  });

  it("keeps mobile amounts wrap-safe without additional financial tiles", () => {
    expect(input).toContain("grid min-w-0 gap-3 sm:grid-cols-");
    expect(input).toContain("grid min-w-0 grid-cols-2 gap-3");
    expect(input).toContain("min-w-0 break-words");
    expect(input).toContain("flex-wrap");
    expect(input).toContain('isExcess ? "bg-amber-50" : "bg-teal-50/60"');
    expect((input.match(/data-b3-primary-metric="/g) ?? []).length).toBe(3);
    expect(input.match(/<details/g)).toHaveLength(1);
    expect(input).not.toContain("<details open");
  });

  it("salary 600,000: pension 190,000 available, 100,000 planned, 90,000 remaining", () => {
    const f = fixture(emptyDeductions(), planned({ pensionInsurance: 100_000 }));
    const v = f.view("pensionInsurance");
    expect(v.remainingCurrent).toBe(190_000);
    expect(v.additionalPayment).toBe(100_000);
    expect(v.additionalAllowed).toBe(100_000);
    expect(v.excess).toBe(0);
    expect(getCapacityDisplay(v)).toEqual({ status: "remaining", amount: 90_000 });
  });

  it("life insurance 40,000 lowers available pension room and keeps remaining after a plan", () => {
    const f = fixture({ ...emptyDeductions(), lifeInsurance: 40_000 }, planned({ pensionInsurance: 100_000 }));
    expect(f.view("pensionInsurance").remainingCurrent).toBe(150_000);
    expect(getCapacityDisplay(f.view("pensionInsurance"))).toEqual({ status: "remaining", amount: 50_000 });
  });

  it("pension purchase exceeding the engine capacity shows scenario excess, not a synthetic tax formula", () => {
    const f = fixture(emptyDeductions(), planned({ pensionInsurance: 210_000 }));
    const v = f.view("pensionInsurance");
    expect(v.remainingCurrent).toBe(190_000);
    expect(v.additionalAllowed).toBe(190_000);
    expect(v.excess).toBe(f.usage.pensionInsurance.excess);
    expect(getCapacityDisplay(v)).toEqual({ status: "excess", amount: 20_000 });
  });

  it("RMF exceeding income cap reports excess 20,000, Thai ESG exceeds separate cap", () => {
    const rmf = fixture(emptyDeductions(), planned({ rmf: 200_000 }));
    expect(getCapacityDisplay(rmf.view("rmf"))).toEqual({ status: "excess", amount: 20_000 });
    const esg = fixture(emptyDeductions(), planned({ thaiEsg: 210_000 }));
    expect(getCapacityDisplay(esg.view("thaiEsg"))).toEqual({ status: "excess", amount: 30_000 });
  });

  it("with shared retirement ceiling fully used, RMF capacity and remaining show zero", () => {
    const d = { ...emptyDeductions(), gpf: 500_000 };
    const f = fixture(d);
    const v = f.view("rmf");
    expect(v.remainingCurrent).toBe(0);
    expect(getCapacityDisplay(v)).toEqual({ status: "remaining", amount: 0 });
    const plannedF = fixture(d, planned({ rmf: 10_000 }));
    expect(getCapacityDisplay(plannedF.view("rmf"))).toEqual({ status: "excess", amount: 10_000 });
  });

  it("other planned retirement additions can create excess even below standalone RMF capacity", () => {
    const d = { ...emptyDeductions(), lifeInsurance: 100_000, gpf: 400_000 };
    const f = fixture(d, planned({ pensionInsurance: 90_000, rmf: 100_000 }));
    const v = f.view("rmf");
    expect(v.remainingCurrent).toBe(100_000);
    expect(v.additionalPayment).toBe(100_000);
    expect(v.additionalAllowed).toBe(10_000);
    expect(v.excess).toBe(90_000);
    expect(getCapacityDisplay(v)).toEqual({ status: "excess", amount: 90_000 });
  });

  it("preserves the warning when a new pension allocation displaces existing retirement rights", () => {
    const f = fixture(
      { ...emptyDeductions(), gpf: 450_000 },
      planned({ pensionInsurance: 190_000 })
    );
    expect(f.view("pensionInsurance").netDeductionChange).toBe(150_000);
    expect(f.view("pensionInsurance").additionalAllowed).toBe(190_000);
    expect(f.usage.pensionInsurance.sideEffects.some(e => e.key === "gpf" && e.change < 0)).toBe(true);
    expect(input).toContain("netDeductionChange !== capacitySummary.additionalAllowed");
    expect(input).toContain("แผนนี้มีผลต่อสิทธิเดิม");
    expect(input).toContain("reducedRights.map");
  });

  it("keeps Results comparison and tax credit treatment independent of UX-B3 formatting", () => {
    expect(plannedComparisonRowClass("100 บาท", "101 บาท")).toBe("bg-blue-100/70");
    expect(plannedComparisonRowClass("100 บาท", "100 บาท")).toBe("");
    expect(results).toContain("plannedComparisonRowClass(formatNumber(item.current), formatNumber(item.planned))");
    expect(results).toContain("currentResult.taxCredits.withholdingTax");
    expect(results).toContain("plannedResult.taxCredits.withholdingTax");
  });
});
