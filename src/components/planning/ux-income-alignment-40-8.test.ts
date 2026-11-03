import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const income = readFileSync(new URL("../../app/planning/income/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/planning-design-system.css", import.meta.url), "utf8");

describe("Income paired fields and Section 40(8) guidance — source boundary", () => {
  it("retains all 40(3) rights/annuity income and withholding bindings", () => {
    expect(income).toContain("rightsIncome?.amount ?? 0");
    expect(income).toContain("rightsIncome?.taxWithheld ?? 0");
    expect(income).toContain("annuityIncome?.amount ?? 0");
    expect(income).toContain("annuityIncome?.taxWithheld ?? 0");
    expect(income).toMatch(/updateRightsIncome\(\{\s*amount: value,?\s*\}\)/);
    expect(income).toMatch(/updateRightsIncome\(\{\s*taxWithheld: value,?\s*\}\)/);
    expect(income).toMatch(/updateAnnuityIncome\(\{\s*amount: value,?\s*\}\)/);
    expect(income).toMatch(/updateAnnuityIncome\(\{\s*taxWithheld: value,?\s*\}\)/);
    expect(income.match(/className="tp-income-financial-row mt-5"/g)).toHaveLength(2);
  });

  it("places optional MoneyInput help text under the input but keeps accessible labels", () => {
    const money = income.slice(income.indexOf("function MoneyInput({"), income.indexOf("function BusinessExpenseCategoryGuidance({"));
    const inputAt = money.indexOf("<input");
    const descriptionAt = money.indexOf("{description && (");
    expect(inputAt).toBeGreaterThan(0);
    expect(descriptionAt).toBeGreaterThan(inputAt);
    expect(money).toContain('<label htmlFor={inputId}');
    expect(money).toContain('id={`${inputId}-hint`}');
    expect(money).toContain('aria-describedby={`${description ? `${inputId}-hint ` : ""}${inputId}-unit`}');
    expect(money).toContain("parseNumber(");
    expect(money).toContain("formatNumber(value)");
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain("@media (min-width: 768px)");
  });

  it("keeps exactly three 40(8) category values in both domestic and foreign selectors", () => {
    for (const category of ["standard60", "performer", "actualOnly"]) {
      expect(income.match(new RegExp('<option value="' + category + '">', "g"))).toHaveLength(2);
    }
    expect(income.match(/Section40_8BusinessIncomeData\["category"\]/g)).toHaveLength(2);
    expect(income).toContain("updateBusinessIncome(");
    expect(income).toContain("updateForeignBusinessIncome(");
    expect(income).toContain("expenseMethod:");
    expect(income).toContain('"actual" as const');
    expect(income).toContain('"standard"');
  });

  it("adds concise accessible guidance to both 40(8) selectors", () => {
    expect(income.match(/กลุ่มกิจการตามเกณฑ์หักค่าใช้จ่าย/g)).toHaveLength(2);
    expect(income.match(/<BusinessExpenseCategoryGuidance/g)).toHaveLength(2);
    expect(income).toContain('aria-describedby={`income-field-3-category-help-${item.id}`}');
    expect(income).toContain('aria-describedby={`income-field-7-category-help-${item.id}`}');
    const content = income.slice(income.indexOf("function BusinessExpenseCategoryGuidance({"), income.indexOf("function SummaryRow({"));
    expect(content).toContain("ดูตัวอย่างกิจการและเงื่อนไข");
    expect(content).toContain("<details");
    expect(content).toContain("<summary");
    expect(content).toContain("focus-visible:outline-2");
    expect(content).toContain("ร้านขายของชำ");
    expect(content).toContain("นักกีฬาอาชีพ");
    expect(content).toContain("ไม่ใช่ทุกกิจการหักเหมา 60% ได้");
    expect(content).toContain("กรมสรรพากร");
    expect(content).toContain("https://www.rd.go.th/2375.html");
    expect(content).toContain("https://www.rd.go.th/62149.html");
    expect(content).toContain("https://www.rd.go.th/61549.html");
  });

  it("keeps existing incomplete-category and expense-method safeguards", () => {
    expect(income.match(/กรุณาเลือกกลุ่มกิจการ/g)).toHaveLength(2);
    expect(income).toContain("conflictingBusinessActivityKeys.has(");
    expect(income).toMatch(/item\.category ===\s*"actualOnly"/);
    expect(income).toContain('item.category !== "actualOnly"');
    expect(income).toContain("taxability?.isComplete");
    expect(income).toContain("formatNumber(");
  });
});
