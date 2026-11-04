import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plannedComparisonClass } from "../../lib/ui/planned-comparison";

const income = readFileSync(new URL("../../app/planning/income/page.tsx", import.meta.url), "utf8");
const results = readFileSync(new URL("../../app/planning/results/page.tsx", import.meta.url), "utf8");
const planner = readFileSync(new URL("../../app/planning/planner/page.tsx", import.meta.url), "utf8");

describe("UX-C1 — change-only Results comparison", () => {
  it("gives equal numeric values neutral styling, including zero values", () => {
    expect(plannedComparisonClass(100_000, 100_000)).toBe("font-medium text-slate-700");
    expect(plannedComparisonClass(0, 0)).toBe("font-medium text-slate-700");
  });

  it("emphasizes differences of either sign without implying savings", () => {
    expect(plannedComparisonClass(100_000, 99_000)).toBe("font-bold text-teal-900");
    expect(plannedComparisonClass(99_000, 100_000)).toBe("font-bold text-teal-900");
    // Numeric comparison occurs before currency/percentage display rounding.
    expect(plannedComparisonClass(100_000.001, 100_000.002)).toBe("font-bold text-teal-900");
  });

  it("compares numeric Result row values before formatting them", () => {
    expect(results).toContain("current: number;");
    expect(results).toContain("planned: number;");
    expect(results).toContain("current={currentResult.totalGrossIncome}");
    expect(results).toContain("planned={plannedResult.totalGrossIncome}");
    expect(results).toContain("plannedComparisonClass(current, planned)");
    expect(results).toContain("plannedComparisonClass(item.current, item.planned)");
    expect(results).toContain("plannedComparisonClass(currentResult.marginalTaxRate, plannedResult.marginalTaxRate)");
    expect(results).toContain('unit="percent"');
    expect(results).not.toContain("text-blue-700");
  });

  it("keeps actual tax credits and tax-engine calls unchanged in the Results page", () => {
    expect(results).toContain("const currentResult = calculateTax({");
    expect(results).toContain("const plannedResult = calculateTax({");
    expect(results).toContain("currentResult.taxCredits.withholdingTax");
    expect(results).toContain("plannedResult.taxCredits.withholdingTax");
    expect(results).toContain("currentResult.taxPayable");
    expect(results).toContain("plannedResult.taxRefund");
  });
});

describe("UX-C1 — Income labels and accounting boundaries", () => {
  it("pairs 40(2) annual commission with actual withholding, without a duplicate", () => {
    expect(income).toContain("ค่านายหน้า / ค่าตอบแทน 40(2)");
    expect(income).toContain('className="tp-income-financial-row mt-4"');
    expect(income).toContain('label="รายได้ค่านายหน้า / ค่าตอบแทนทั้งปี"');
    expect(income.match(/label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40\(2\)"/g)).toHaveLength(1);
    expect(income).toContain("setOtherIncome(item.id, value)");
    expect(income).toContain("section40_2TaxWithheld: value");
    expect(income).toContain("income.section40_2TaxWithheld ?? 0");
  });

  it("preserves legacy other-income category separately from 40(2)", () => {
    expect(income).toContain('id: "other"');
    expect(income).toContain("setOtherIncome(item.id, parseNumber(e.target.value))");
    expect(income).toContain('item.id === "commission" ? (');
    expect(income).toContain('item.id !== "rent"');
    expect(income).toContain('item.id !== "professional"');
    expect(income).toContain('item.id !== "business"');
  });

  it("preserves PR #8 and #9 exact 40(1) labels and read-only estimator", () => {
    expect(income).toContain('label="รายได้อื่นจากนายจ้างทั้งปี"');
    expect(income.match(/label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40\(1\)"/g)).toHaveLength(1);
    expect(income).toContain("estimateSection40_1Withholding");
    expect(income).toContain("illustrativeMonthlyAverage");
    expect(income).toContain("section40_1TaxWithheld: value");
  });

  it("preserves two aligned 40(3) pairs and clarifies the annuity category", () => {
    expect(income.match(/className="tp-income-financial-row mt-5"/g)).toHaveLength(2);
    expect(income).toContain("rightsIncome?.amount ?? 0");
    expect(income).toContain("rightsIncome?.taxWithheld ?? 0");
    expect(income).toContain("annuityIncome?.amount ?? 0");
    expect(income).toContain("annuityIncome?.taxWithheld ?? 0");
    expect(income).toContain("เงินรายปีที่ได้รับตามพินัยกรรม");
    expect(income).toContain("คำพิพากษาของศาล");
    expect(income).toContain("ไม่ใช่เงินบำนาญทุกประเภท");
  });

  it("shows six 40(6) professions with the same three stored category keys", () => {
    for (const key of ["medical", "fineArts", "other"]) {
      expect(income.match(new RegExp('<option value="' + key + '">', "g"))).toHaveLength(2);
    }
    for (const name of [
      "การประกอบโรคศิลป", "กฎหมาย", "วิศวกรรม",
      "สถาปัตยกรรม", "การบัญชี", "ประณีตศิลปกรรม",
    ]) {
      expect(income).toContain(name);
    }
    expect(income).toContain("updateProfessionalIncome({");
    expect(income).toContain("updateForeignProfessionalIncome(");
  });

  it("opens the three 40(8) official links safely in new tabs", () => {
    for (const page of ["2375", "62149", "61549"]) {
      expect(income).toContain(
        'href="https://www.rd.go.th/' + page + '.html" target="_blank" rel="noopener noreferrer"',
      );
    }
    expect(income.match(/<BusinessExpenseCategoryGuidance/g)).toHaveLength(2);
    for (const key of ["standard60", "performer", "actualOnly"]) {
      expect(income.match(new RegExp('<option value="' + key + '">', "g"))).toHaveLength(2);
    }
  });

  it("keeps the shared input helper below controls and its accessible associations", () => {
    const money = income.slice(income.indexOf("function MoneyInput({"), income.indexOf("function BusinessExpenseCategoryGuidance({"));
    expect(money.indexOf("{description && (")).toBeGreaterThan(money.indexOf("<input"));
    expect(money).toContain('htmlFor={inputId}');
    expect(money).toContain('id={inputId}');
    expect(money).toContain("aria-describedby");
  });

  it("changes pension purchase wording only, retaining RMF and ESG investments", () => {
    expect(planner).toContain("เบี้ยประกันบำนาญที่กำลังพิจารณาซื้อเพิ่ม");
    expect(planner).not.toContain("เบี้ยประกันบำนาญที่กำลังพิจารณาจ่ายเพิ่ม");
    expect(planner).toContain("เงินลงทุน RMF ที่กำลังพิจารณาลงทุนเพิ่ม");
    expect(planner).toContain("เงินลงทุน Thai ESG ที่กำลังพิจารณาลงทุนเพิ่ม");
  });
});
