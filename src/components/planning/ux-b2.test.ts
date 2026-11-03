import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Scope-level UI regression guards. Financial behavior is covered by the
// existing engine, deduction, state and reset test suites.
const family = readFileSync(new URL("../../app/planning/family/page.tsx", import.meta.url), "utf8");
const deductions = readFileSync(new URL("../../app/planning/deductions/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/planning-design-system.css", import.meta.url), "utf8");

describe("UX B2 presentation contracts", () => {
  it.each([
    ["family", family],
    ["deductions", deductions],
  ])("%s uses only the scoped B2 shell and B1 design tokens", (_name, page) => {
    expect(page).toContain("tp-b2-page");
    expect(page).toContain("tp-b2-grid");
    expect(page).toContain("tp-b2-intro");
    expect(page).toContain("tp-b2-summary");
    expect(page).toContain("tp-brand");
    expect(page).toContain("tp-year-badge");
    expect(page).toContain("<PlanningStepper");
    expect(page).toContain("tp-b2-actions");
  });

  it("keeps family selections exposed as actual pressed states", () => {
    expect(family).toContain("aria-pressed={active}");
    expect(family).toContain("aria-pressed={!value}");
    expect(family).toContain("aria-pressed={value}");
    expect(family).toContain("aria-pressed={family.taxpayerAge65OrOlder === false}");
    expect(family).toContain("aria-pressed={family.taxpayerAge65OrOlder === true}");
  });

  it("keeps deductions accordion states tied to the original isOpen condition", () => {
    expect(deductions).toContain("aria-expanded={isOpen}");
    expect(deductions).toContain("toggleSection(");
    expect(deductions).toContain("openSections.includes(");
    expect(deductions).toContain("tp-b2-accordion-content");
    expect(deductions).toContain("donationPlanningChanged");
  });

  it("associates the shared family and deduction numeric field labels with inputs", () => {
    for (const page of [family, deductions]) {
      expect(page).toContain("const inputId = useId();");
      expect(page).toContain("htmlFor={inputId}");
      expect(page).toContain("id={inputId}");
      expect(page).toContain("onChange(");
    }
  });

  it("preserves visible financial-context cautions on both pages", () => {
    expect(family).toContain("ระบบจะตรวจว่าแต่ละรายการใช้สิทธิลดหย่อนได้จริงเท่าใด");
    expect(deductions).toContain("ยังไม่ใช่ยอดที่ใช้ลดหย่อนภาษีได้จริง");
    expect(deductions).toContain("taxResult.warnings");
  });

  it("defines B2 visual styling using the existing design system variables", () => {
    expect(styles).toContain("/* UX B2: Family and Deductions.");
    expect(styles).toContain(".tp-b2-page");
    expect(styles).toContain(".tp-b2-accordion > button[aria-expanded=\"true\"]");
    expect(styles).toContain("var(--tp-primary)");
    expect(styles).toContain("var(--tp-indigo-deep)");
    expect(styles).toContain("@media (max-width: 639px)");
  });
  it("preserves all three original delete handlers and applies one danger class", () => {
    expect(family.match(/className="tp-b2-delete"/g)).toHaveLength(3);
    expect(family).toMatch(/onClick=\{\(\) =>\s*removeChild\(\s*child\.id\s*\)\s*\}\s*className="tp-b2-delete"/);
    expect(family).toMatch(/onClick=\{\(\) =>\s*removeParent\(\s*parent\.id\s*\)\s*\}\s*className="tp-b2-delete"/);
    expect(family).toMatch(/onClick=\{\(\) =>\s*removeDisabledDependent\(\s*dependent\.id\s*\)\s*\}\s*className="tp-b2-delete"/);
  });

  it("provides danger color, 44px touch targets, and visible keyboard focus", () => {
    expect(styles).toContain(".tp-b2-page .tp-b2-delete {");
    expect(styles).toContain("min-width: 2.75rem;");
    expect(styles).toContain("min-height: 2.75rem;");
    expect(styles).toContain("color: #b42342;");
    expect(styles).toContain("border: 1px solid #f3c4cd;");
    expect(styles).toContain(".tp-b2-page .tp-b2-delete:hover,");
    expect(styles).toContain(".tp-b2-page .tp-b2-delete:focus-visible {");
    expect(styles).toContain("outline: 3px solid #b42342;");
  });

  it("keeps the Family warning conditional, and leaves Deductions warning outside its hero", () => {
    expect(family).toMatch(/taxResult\.isComplete \? \([\s\S]*?\) : \(\s*<div className="tp-b2-summary-warning mt-3 text-sm leading-6"/);
    expect(family).toContain("ยังไม่สามารถคำนวณภาษีได้ครบถ้วน");
    expect(styles).toContain(".tp-family .tp-b2-summary-hero .tp-b2-summary-warning {");
    expect(styles).toContain("color: #6b4311;");
    expect(styles).toContain("background: #fff7e9;");
    expect(deductions).toContain("tp-b2-summary-hero");
    expect(deductions).toContain("border border-amber-200 bg-amber-50");
  });

  it("meets 4.5:1 source-color text contrast on all corrected surfaces", () => {
    const lum = (hex: string) => {
      const rgb = hex.slice(1).match(/.{2}/g);
      if (!rgb || rgb.length !== 3) throw new Error("Expected #RRGGBB");
      const [r, g, b] = rgb.map((part) => {
        const c = Number.parseInt(part, 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return .2126 * r + .7152 * g + .0722 * b;
    };
    for (const [fg, bg] of [
      ["#b42342", "#ffffff"], ["#b42342", "#fff1f3"],
      ["#6b4311", "#fff7e9"], ["#e0e3ff", "#353992"],
      ["#ffffff", "#353992"],
    ]) {
      const a = lum(fg), b = lum(bg);
      expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("uses the shared danger treatment on all Deductions delete actions", () => {
    expect(deductions.match(/className="tp-b2-delete"/g)).toHaveLength(2);
    expect(deductions).not.toContain("text-sm text-slate-400 hover:text-red-600");
    expect(deductions).toMatch(
      /onClick=\{\(\) =>\s*removeParentHealthPolicy\(\s*policy\.id\s*\)\s*\}\s*className="tp-b2-delete"\s*>\s*ลบ\s*<\/button>/,
    );
    expect(deductions).toMatch(
      /onClick=\{\(\) =>\s*removePregnancy\(\s*pregnancy\.id\s*\)\s*\}\s*className="tp-b2-delete"\s*>\s*ลบ\s*<\/button>/,
    );
  });

  it("limits the shared danger control to B2 and keeps Family/Deductions consistent", () => {
    expect(family.match(/className="tp-b2-delete"/g)).toHaveLength(3);
    expect(deductions.match(/className="tp-b2-delete"/g)).toHaveLength(2);
    expect(styles).toContain(".tp-b2-page .tp-b2-delete {");
    expect(styles).toContain(".tp-b2-page .tp-b2-delete:hover,");
    expect(styles).toContain(".tp-b2-page .tp-b2-delete:focus-visible {");
    expect(styles).toContain("min-width: 2.75rem;");
    expect(styles).toContain("min-height: 2.75rem;");
    expect(styles).toContain("background: #fff1f3;");
    expect(styles).toContain("outline: 3px solid #b42342;");
    expect(styles).not.toContain(".tp-family .tp-b2-record .tp-b2-delete");
  });

});
