import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plannedComparisonClass, plannedComparisonRowClass } from "../../lib/ui/planned-comparison";
import { TAX_RULES_2569 } from "../../tax-rules/2569";

const income = readFileSync(new URL("../../app/planning/income/page.tsx", import.meta.url), "utf8");
const results = readFileSync(new URL("../../app/planning/results/page.tsx", import.meta.url), "utf8");
const planner = readFileSync(new URL("../../app/planning/planner/page.tsx", import.meta.url), "utf8");

describe("UX-C1 — change-only Results comparison", () => {
  const baht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat("th-TH", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const bahtStyle = (current: number, planned: number) =>
    plannedComparisonClass(`${baht.format(current)} บาท`, `${baht.format(planned)} บาท`);
  const percentStyle = (current: number, planned: number) =>
    plannedComparisonClass(percent.format(current), percent.format(planned));

  it("gives equal displayed Baht values neutral styling, including zero values", () => {
    expect(bahtStyle(100_000, 100_000)).toBe("font-medium text-slate-700");
    expect(bahtStyle(0, 0)).toBe("font-medium text-slate-700");
  });

  it("emphasizes visible increases and decreases with the same bold blue", () => {
    expect(bahtStyle(100_000, 99_000)).toBe("font-bold text-blue-600");
    expect(bahtStyle(99_000, 100_000)).toBe("font-bold text-blue-600");
  });

  it("does not highlight raw Baht differences hidden by displayed rounding", () => {
    expect(bahtStyle(100_000.001, 100_000.002)).toBe("font-medium text-slate-700");
    expect(bahtStyle(100.01, 100.49)).toBe("font-medium text-slate-700");
  });

  it("highlights when Baht values cross a display-rounding boundary", () => {
    expect(bahtStyle(100.49, 100.51)).toBe("font-bold text-blue-600");
    expect(bahtStyle(100.51, 100.49)).toBe("font-bold text-blue-600");
  });

  it("matches percentage display precision and its 2-decimal boundary", () => {
    expect(percentStyle(0.1000001, 0.1000002)).toBe("font-medium text-slate-700");
    expect(percentStyle(0.10004, 0.10006)).toBe("font-bold text-blue-600");
    expect(percentStyle(0.10006, 0.10004)).toBe("font-bold text-blue-600");
    expect(percentStyle(0, 0)).toBe("font-medium text-slate-700");
  });

  it("compares exact displayed Results text without changing numeric engine inputs", () => {
    expect(results).toContain("current: number;");
    expect(results).toContain("planned: number;");
    expect(results).toContain("current={currentResult.totalGrossIncome}");
    expect(results).toContain("planned={plannedResult.totalGrossIncome}");
    expect(results).toContain("plannedComparisonClass(displayedCurrent, displayedPlanned)");
    expect(results).toContain("plannedComparisonClass(formatNumber(item.current), formatNumber(item.planned))");
    expect(results).toContain("plannedComparisonClass(formatPercent(currentResult.marginalTaxRate), formatPercent(plannedResult.marginalTaxRate))");
    expect(results).toContain('unit="percent"');
    expect(results).not.toContain("text-blue-700");
    expect(results).not.toContain("text-teal-900");
    expect(results).toContain("formatNumber(item.planned) !== formatNumber(item.current)");
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

  it("removes unclassified income input while retaining the legacy record key", () => {
    expect(income).toContain('id: "other"'); // Non-UI compatibility definition
    expect(income).toContain("return otherIncomeDefinitions.reduce("); // Old summary not rewritten
    expect(income).toContain('.filter((item) => item.id === "commission")');
    const commissionUI = income.slice(
      income.indexOf("                  {otherIncomeDefinitions"),
      income.indexOf('ค่าลิขสิทธิ์ / ค่าสิทธิ 40(3)')
    );
    expect(commissionUI).toContain('label="รายได้ค่านายหน้า / ค่าตอบแทนทั้งปี"');
    expect(commissionUI).not.toContain('aria-label={item.label}');
    expect(commissionUI).not.toContain("setOtherIncome(item.id, parseNumber(e.target.value))");
    expect(income).not.toContain('setOtherIncome("other",');
  });

  it("shows a read-only nonzero legacy income notice even when the category toggle is false", () => {
    expect(income).toContain('{(income.otherIncome.other ?? 0) !== 0 && (');
    expect(income).toContain('role="alert"');
    expect(income).toContain("formatNumber(income.otherIncome.other ?? 0)");
    expect(income).toContain("ระบบยังเก็บยอดเดิมไว้โดยไม่ลบหรือย้ายไปมาตรา 40 ใด");
    expect(income).toContain("กรุณาตรวจสอบเอกสารรายได้และกรอกยอดในหมวดเงินได้ 40(1)–40(8)");
    expect(income.indexOf('{(income.otherIncome.other ?? 0) !== 0 && (')).toBeLessThan(
      income.indexOf("{income.hasOtherIncome && (")
    );
  });

  it("preserves PR #8 and #9 exact 40(1) labels and read-only estimator", () => {
    expect(income).toContain('label="รายได้อื่นจากนายจ้างทั้งปี"');
    expect(income.match(/label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40\(1\)"/g)).toHaveLength(1);
    expect(income).toContain("estimateSection40_1Withholding");
    expect(income).toContain("illustrativeMonthlyAverage");
    expect(income).toMatch(/setIncome\(\{\s*section40_1TaxWithheld:\s*value,?\s*\}\)/);
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

describe("UX-C1 — Director three-point final correction", () => {
  const baht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat("th-TH", {
    style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 2,
  });

  it("uses the existing 2569 royalty rights 50% rule directly inside the standard button", () => {
    expect(TAX_RULES_2569.otherIncomeExpenses.section40_3Rights.standardRate).toBe(0.5);
    const rights = income.slice(
      income.indexOf("ค่าลิขสิทธิ์ / ค่าสิทธิ 40(3)"),
      income.indexOf("เงินได้ประเภท Annuity 40(3)")
    );
    const standard = rights.slice(
      rights.indexOf('expenseMethod: "standard"'),
      rights.indexOf('expenseMethod: "actual"')
    );
    expect(standard).toContain("หักค่าใช้จ่ายแบบเหมา");
    expect(standard).toContain("TAX_RULES_2569.otherIncomeExpenses.section40_3Rights.standardRate * 100");
    expect(standard).toContain('className="mt-1 text-xs leading-5 opacity-75"');
    expect(standard).not.toContain("contractStandardRate");
    expect(standard).not.toContain("standardMax");
    expect(rights).toContain("หักค่าใช้จ่ายตามจริง");
    expect(rights).toContain("ใช้ค่าใช้จ่ายที่เกี่ยวข้องและมีหลักฐาน");
    const annuity = income.slice(income.indexOf("เงินได้ประเภท Annuity 40(3)"));
    expect(annuity.slice(0, 1600)).not.toContain("section40_3Rights.standardRate");
    expect(income).toContain("updateRightsIncome({");
    expect(income).toContain("rightsIncome?.taxWithheld ?? 0");
  });

  it("shows independent medical practice examples in both 40(6) selectors without changing keys", () => {
    const medicalName = "การประกอบโรคศิลป (เช่น แพทย์ประกอบวิชาชีพอิสระ)";
    expect(income.split(medicalName)).toHaveLength(3);
    expect(income.match(/<option value="medical">/g)).toHaveLength(2);
    expect(income.match(/<option value="fineArts">/g)).toHaveLength(2);
    expect(income.match(/<option value="other">/g)).toHaveLength(2);
    expect(income).toContain('professionalIncome?.professionalType === "medical"');
    expect(income).toContain('item.professionalType === "medical"');
    const caption = "ไม่ใช่เงินเดือนแพทย์จากนายจ้างโดยอัตโนมัติ";
    expect(income.split(caption)).toHaveLength(3);
    expect(income.match(/min-w-0 max-w-full w-full truncate rounded-xl/g)).toHaveLength(2);
    expect(income).toContain('break-words text-xs leading-5 text-slate-600');
  });

  it("highlights entire changed comparison row but never a display-equivalent row", () => {
    expect(plannedComparisonRowClass("100 บาท", "100 บาท")).toBe("");
    expect(plannedComparisonRowClass("100 บาท", "101 บาท")).toBe("bg-blue-50/70");
    expect(plannedComparisonRowClass("101 บาท", "100 บาท")).toBe("bg-blue-50/70");
    expect(plannedComparisonRowClass(baht.format(100.01), baht.format(100.49))).toBe("");
    expect(plannedComparisonRowClass(baht.format(100.49), baht.format(100.51))).toBe("bg-blue-50/70");
    expect(plannedComparisonRowClass(percent.format(0.1000001), percent.format(0.1000002))).toBe("");
    expect(plannedComparisonRowClass(percent.format(0.10004), percent.format(0.10006))).toBe("bg-blue-50/70");
    expect(plannedComparisonClass("100 บาท", "101 บาท")).toBe("font-bold text-blue-600");
    expect(plannedComparisonClass("100 บาท", "100 บาท")).toBe("font-medium text-slate-700");
  });

  it("applies row-level, display-precise highlighting to summaries, deductions, details, and tax rates", () => {
    expect(results).toContain("plannedComparisonRowClass(displayedCurrent, displayedPlanned)");
    expect(results).toContain("plannedComparisonRowClass(formatNumber(current), formatNumber(planned))");
    expect(results).toContain("plannedComparisonRowClass(formatNumber(item.current), formatNumber(item.planned))");
    expect(results).toContain(
      "plannedComparisonRowClass(formatPercent(currentResult.marginalTaxRate), formatPercent(plannedResult.marginalTaxRate))"
    );
    expect((results.match(/plannedComparisonRowClass\(/g) ?? []).length).toBe(4);
    expect(results).toContain('unit="percent"'); // effective rate uses CompareRow
    expect(results).toContain('className="border-b border-slate-100"'); // do not color entire detail section
    expect(results).toContain('formatNumber(item.planned) !== formatNumber(item.current)');
    expect(results).toContain("currentResult.taxCredits.withholdingTax");
    expect(results).toContain("plannedResult.taxCredits.withholdingTax");
    expect(results).toContain("const currentResult = calculateTax({");
    expect(results).toContain("const plannedResult = calculateTax({");
  });
});
