import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Source-level UI copy checks, not actual browser acceptance.
const pages = {
  income: readFileSync(new URL("../../app/planning/income/page.tsx", import.meta.url), "utf8"),
  family: readFileSync(new URL("../../app/planning/family/page.tsx", import.meta.url), "utf8"),
  deductions: readFileSync(new URL("../../app/planning/deductions/page.tsx", import.meta.url), "utf8"),
  planner: readFileSync(new URL("../../app/planning/planner/page.tsx", import.meta.url), "utf8"),
  results: readFileSync(new URL("../../app/planning/results/page.tsx", import.meta.url), "utf8"),
};
describe("UX Microcopy Director contracts", () => {
  it("preserves two mandatory Thai tax labels exactly", () => {
    expect(pages.income).toContain('label="ภาษีหัก ณ ที่จ่ายจากเงินได้ 40(1)"');
    expect(pages.family.match(/label="เงินได้พึงประเมินทั้งปี"/g)).toHaveLength(2);
  });
  it("uses concise equivalent labels and verified tax-payable binding", () => {
    expect(pages.income).toContain('label="รายได้อื่นจากนายจ้างทั้งปี"');
    expect(pages.family).toContain("มีคนอื่นใช้สิทธิลดหย่อนบิดา/มารดาท่านนี้แล้วหรือไม่?");
    expect(pages.family).toContain("อัตราภาษีขั้นสูงสุด");
    expect(pages.results).toContain("อัตราภาษีขั้นสูงสุด");
    expect(pages.planner.match(/ภาษีที่คาดว่าจะประหยัดเพิ่ม/g)).toHaveLength(2);
    expect(pages.results).toContain('label="ภาษีที่ต้องจ่ายเพิ่ม"');
    expect(pages.results).toContain("currentResult.taxPayable");
    expect(pages.results).toContain("plannedResult.taxPayable");
    // The value is creditable withheld tax, not all withheld tax.
    expect(pages.results).toContain('label="เครดิตภาษีหัก ณ ที่จ่าย"');
  });
  it("retains conditional validation warnings after shortening introductions", () => {
    expect(pages.family).toContain("ข้อมูลยังไม่ครบ กรุณาตรวจสอบรายการด้านล่างเพื่อคำนวณภาษี");
    expect(pages.deductions).toContain("ยอดลดหย่อนอาจเปลี่ยนเมื่อกรอกข้อมูลครบ");
    expect(pages.planner).toContain("ยังเปรียบเทียบผลไม่ได้ กรุณากรอกข้อมูลที่ขาดตามคำเตือนด้านบน");
    expect(pages.results).toContain("กรอกข้อมูลให้ครบเพื่อดูผลภาษีก่อนและหลังวางแผน");
    expect(pages.family).toContain("taxResult.warnings.map(");
    expect(pages.deductions).toContain("taxResult.warnings.map(");
    expect(pages.planner).toContain("planningWarnings.map(");
    expect(pages.results).toContain("resultWarnings.map(");
  });
  it("preserves complete legal texts in native keyboard-accessible details", () => {
    expect(pages.deductions).toContain("conditionDetails?: string;");
    expect(pages.deductions).toContain("field.conditionDetails");
    expect(pages.deductions).toContain("{conditionDetails && (");
    expect(pages.deductions.match(/<details className=/g)).toHaveLength(2);
    expect(pages.deductions.match(/<summary className=/g)).toHaveLength(2);
    expect(pages.deductions.match(/ดูเงื่อนไข/g)).toHaveLength(2);
    expect(pages.deductions).toContain("focus-visible:outline-2");
    expect(pages.deductions).toContain("max-w-full break-words");
    expect(pages.deductions).toContain("กรอกเฉพาะค่าซื้อและติดตั้งที่เข้าเงื่อนไข ระบบต้องติดตั้งบนที่อยู่อาศัย เชื่อมต่อโครงข่าย MEA/PEA สำเร็จ และมี e-Tax Invoice ใช้สิทธิได้ 1 ครั้ง 1 ระบบ สูงสุด 200,000 บาท");
    expect(pages.deductions).toContain("กรอกเฉพาะยอดซื้อผลงานที่เข้าเงื่อนไข เช่น จิตรกรรม ประติมากรรม ภาพพิมพ์ ภาพถ่าย หรือสื่อผสม ใช้สิทธิได้ตามจริงสูงสุด 100,000 บาท");
    expect(pages.deductions).toContain("สำหรับเงินที่บริจาคผ่านบัญชีเฉพาะของกองทัพอากาศเพื่อโครงการสร้างพระสถูปเจดีย์ ใช้สิทธิ 1 เท่า และใช้เพดาน 10% ร่วมกับเงินบริจาคทั่วไป");
    expect(pages.deductions).toContain("เพื่อให้ระบบตรวจสิทธิและกรณีร่วมจ่ายได้ถูกต้อง");
    expect(pages.deductions).toContain("ปี 2569 การบริจาคให้วัด มูลนิธิ");
  });
  it("keeps all five planning steps and navigation links", () => {
    for (const page of Object.values(pages)) {
      expect(page).toContain("<PlanningStepper");
      expect(page).toContain("currentStep={");
      expect(page).toContain('href="/planning/');
    }
  });
});
