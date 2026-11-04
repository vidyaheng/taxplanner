import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateTax } from "../../lib/tax/engine";
import { migrateStoredState, persistPlannerReset } from "../../store/TaxPlannerContext";
import type { DeductionData } from "../../types/deductions";
import type { FamilyData } from "../../types/family";

const page = readFileSync(new URL("../../app/planning/deductions/page.tsx", import.meta.url), "utf8");
const presenter = readFileSync(new URL("./DeductionEligibilitySummary.tsx", import.meta.url), "utf8");
const engine = readFileSync(new URL("../../lib/tax/deductions.ts", import.meta.url), "utf8");
const planner = readFileSync(new URL("../../app/planning/planner/page.tsx", import.meta.url), "utf8");
const familyPage = readFileSync(new URL("../../app/planning/family/page.tsx", import.meta.url), "utf8");

function deductions(overrides: Partial<DeductionData> = {}): DeductionData {
  return {
    lifeInsurance: 0, healthInsuranceSelf: 0, spouseLifeInsurance: 0, parentHealthInsurance: 0,
    pensionInsurance: 0, providentFund: 0, gpf: 0, privateTeacherFund: 0, nsf: 0, rmf: 0,
    thaiEsg: 0, ltfToThaiEsgxTransferAmount: 0, socialSecurity: 0, homeLoanInterest: 0,
    pregnancyAndChildbirth: 0, socialEnterpriseInvestment: 0, politicalDonation: 0,
    specialDonation: 0, generalDonation: 0, ...overrides,
  };
}
const family: FamilyData = {
  taxpayerAge65OrOlder: null, isThaiTaxResident: null, isThaiNational: null,
  seniorIncomeExemptionAllocation: {
    section40_1: 0, section40_2: 0, section40_3Annuity: 0, section40_3Rights: 0,
    section40_4Interest: 0, section40_4Dividend: 0, section40_5: 0, section40_6: 0,
    section40_7: 0,
  },
  maritalStatus: "single", spouseHasIncome: false, marriedFullTaxYear: false,
  children: [], parents: [], disabledDependents: [], pregnancies: [],
};
const income = {
  monthlySalary: 50_000, annualBonus: 0, otherEmploymentIncome: 0,
  hasOtherIncome: false,
  otherIncome: { commission: 0, rent: 0, professional: 0, business: 0, investment: 0, other: 0 },
  detailedOtherIncome: {
    section40_3: [], section40_4Interest: [], section40_4Dividend: [],
    section40_5: [], section40_6: [], section40_7: [], section40_8: [],
  },
};
function result(data: DeductionData, customFamily: FamilyData = family) {
  return calculateTax({ taxYear: 2569, income, family: customFamily, deductions: data });
}

describe("UX-C2.2 — Deductions input-first, engine-output-only", () => {
  it("keeps exactly one generic summary per supported field and no old repeated panels", () => {
    expect(page.match(/<DeductionEligibilitySummary usage=/g)).toHaveLength(1);
    expect(page).toContain("const standardUsage =");
    expect(page).toContain("usage={standardUsage}");
    expect(page).not.toContain("{retirementFieldUsage &&");
    expect(page).not.toContain('{field.key === "lifeInsurance" &&');
    expect(page).toContain("usage && (value ?? 0) > 0");
  });

  it("renders Action in desktop horizontal row, mobile stacked, Information underneath", () => {
    const source = page.slice(page.indexOf("function DeductionInput({"), page.indexOf("function SummaryRow({"));
    expect(source).toContain("data-c2-action-row");
    expect(source).toContain("md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)]");
    expect(source).toContain("min-w-0");
    expect(source).toContain("tabular-nums");
    expect(source.indexOf("data-c2-action-row")).toBeLessThan(source.indexOf("<DeductionEligibilitySummary"));
    expect(source).toContain("focus:border-blue-500 focus:ring-4");
  });

  it("preserves numeric handler and associated input labels", () => {
    const source = page.slice(page.indexOf("function DeductionInput({"), page.indexOf("function SummaryRow({"));
    expect(source).toContain("const inputId = useId()");
    expect(source).toContain("htmlFor={inputId}");
    expect(source).toContain("id={inputId}");
    expect(source).toContain('inputMode="numeric"');
    expect(source).toContain("parseNumber(");
    expect(source).toContain("onChange(");
    expect(page).toContain("setDeductions({");
    expect(page).toContain("[field.key]:");
  });

  it("shows only Engine allowed and positive excess, with no independent capacity math", () => {
    expect(presenter).toContain("usage.allowed");
    expect(presenter).toContain("usage.excess > 0");
    expect(presenter).toContain("ใช้ลดหย่อนได้");
    expect(presenter).toContain("เกินสิทธิ");
    expect(presenter).toContain('role="status"');
    expect(presenter).toContain('aria-live="polite"');
    expect((presenter.match(/<p className="text-xs leading-5/g) ?? []).length).toBe(2);
    expect(presenter).not.toMatch(/TAX_RULES|Math\.min|Math\.max|calculatePlanningCapacity|getCapacityDisplay|statutory/i);
    expect(presenter).not.toContain("เหลือสิทธิ");
  });

  it("keeps social security separate, Thai ESGX schedule, donation preview and special eligibility", () => {
    expect(page).toContain('field.key === "socialSecurity" ? null');
    expect(page).toContain('field.key === "socialSecurity" && generalFieldUsage');
    expect(page).toMatch(/thaiEsgxTransfer\s*\.\s*allowedThisYear/);
    expect(page).toContain("thaiEsgxTransfer.schedule");
    expect(page).toContain("donationPlanningChanged");
    expect(page).toContain("donationPlanningDelta");
    expect(page).toContain(".deductionBeforeCap");
    expect(page).toContain(".disallowedDeduction");
  });

  it("retains pension ordinary/extra detail and warnings visible outside disclosure", () => {
    expect(page).toContain("ที่มาของสิทธิประกันบำนาญ");
    expect(page).toContain("retirementUsage.pensionUsedAsLifeInsurance");
    expect(page).toContain("retirementUsage.pensionExtraAllowed");
    expect(page).toContain("taxResult.warnings");
    expect(page).toContain("border border-amber-200 bg-amber-50");
    expect(page).toContain("isOpen");
    expect(page).toContain("aria-expanded={isOpen}");
  });

  it("preserves parent health policy and pregnancy record controls", () => {
    expect(page).toContain("parentHealthInsurancePolicies");
    expect(page).toContain("addParentHealthPolicy");
    expect(page).toContain("removeParentHealthPolicy");
    expect(page).toContain("parentId:");
    expect(page).toContain("addPregnancy");
    expect(page).toContain("removePregnancy");
    expect(page.match(/className="tp-b2-delete"/g)).toHaveLength(2);
  });

  it("insurance life/health results remain Engine-authoritative and shared", () => {
    const r = result(deductions({lifeInsurance:90_000, healthInsuranceSelf:25_000}));
    expect(r.insuranceDeductions.lifeInsurance.allowed).toBe(90_000);
    expect(r.insuranceDeductions.healthInsuranceSelf.allowed).toBe(10_000);
    expect(r.insuranceDeductions.healthInsuranceSelf.excess).toBe(15_000);
    expect(r.insuranceDeductions.totalAllowed).toBe(100_000);
  });

  it("retirement pension ordinary/extra and RMF shared ceiling remain Engine-authoritative", () => {
    const r = result(deductions({lifeInsurance:40_000, pensionInsurance:150_000, gpf:450_000, rmf:50_000}));
    expect(r.retirementDeductions.pensionInsurance.allowed).toBe(
      r.retirementDeductions.pensionUsedAsLifeInsurance + r.retirementDeductions.pensionExtraAllowed
    );
    expect(r.retirementDeductions.pensionUsedAsLifeInsurance).toBeLessThanOrEqual(60_000);
    expect(r.retirementDeductions.sharedLimitUsed).toBeLessThanOrEqual(500_000);
    expect(r.retirementDeductions.rmf.excess).toBeGreaterThanOrEqual(0);
  });

  it("Thai ESG income limit remains 30% of 600,000 income, without adding to retirement pool", () => {
    const r = result(deductions({thaiEsg:210_000, gpf:500_000}));
    expect(r.generalDeductions.thaiEsg.allowed).toBe(180_000);
    expect(r.generalDeductions.thaiEsg.excess).toBe(30_000);
    expect(r.retirementDeductions.sharedLimitUsed).toBe(500_000);
  });

  it("special donation paid is distinct from deduction after multiplier and cap", () => {
    const r = result(deductions({specialDonation:20_000}));
    expect(r.donationDeductions.specialDonation.paid).toBe(20_000);
    expect(r.donationDeductions.specialDonation.deductionBeforeCap).toBe(40_000);
    expect(r.donationDeductions.specialDonation.allowed).toBeLessThanOrEqual(40_000);
    expect(page).toContain("plannedDonationUsage");
  });

  it("parent-health legacy/detailed and social security flows remain unchanged", () => {
    const legacy = deductions({parentHealthInsurance:5000,socialSecurity:11_000});
    const r = result(legacy);
    expect(r.generalDeductions.socialSecurity.allowed).toBeLessThanOrEqual(10_500);
    expect(r.generalDeductions.socialSecurity.excess).toBeGreaterThanOrEqual(500);
    expect(r.insuranceDeductions.parentHealthInsurance.allowed).toBeGreaterThanOrEqual(0);
    expect(page).toContain("parentHealthInsurancePolicies");
    expect(engine).toContain("resolveParentHealthInsurance");
  });

  it("keeps Reset/Resume and other page source unchanged; no new finance state", () => {
    const local = new Map<string,string>();
    const reset = persistPlannerReset({setItem:(k,v)=>local.set(k,v)},"ux-c2-2-reset");
    expect(reset.deductions.lifeInsurance).toBe(0);
    expect(reset.deductions.rmf).toBe(0);
    const restored = migrateStoredState(JSON.parse(local.get("thai-tax-planner-v0.1")!));
    expect(restored.deductions?.lifeInsurance).toBe(0);
    expect(planner).toContain("getCapacityDisplay");
    expect(familyPage).toContain("getFirstUnusedParentSlot");
    expect(page).not.toContain("calculatePlanningCapacity(");
  });
});
