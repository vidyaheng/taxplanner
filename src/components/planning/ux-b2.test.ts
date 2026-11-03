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
});
