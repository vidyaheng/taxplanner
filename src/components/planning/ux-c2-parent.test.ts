import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ParentData } from "../../types/family";
import {
  PARENT_RELATIONSHIP_SLOTS,
  getFirstUnusedParentSlot,
  getDuplicateParentSlotKeys,
  canAssignParentSlot,
  getParentSlotLabel,
  parentSlotKey,
  slotFromKey,
} from "../../lib/ui/parent-relationship-slots";
import {
  migrateStoredState,
  persistPlannerReset,
} from "../../store/TaxPlannerContext";

const page = readFileSync(new URL("../../app/planning/family/page.tsx", import.meta.url), "utf8");
const context = readFileSync(new URL("../../store/TaxPlannerContext.tsx", import.meta.url), "utf8");
const engine = readFileSync(new URL("../../lib/tax/engine.ts", import.meta.url), "utf8");
const rules = readFileSync(new URL("../../tax-rules/2569/index.ts", import.meta.url), "utf8");
const deductions = readFileSync(new URL("../../app/planning/deductions/page.tsx", import.meta.url), "utf8");

function parent(id: string, owner: ParentData["owner"], relation: ParentData["relation"]): ParentData {
  return {
    id, owner, relation, birthYearBE: 2500, age60OrOlder: true,
    annualAssessableIncome: 12000, supportedByTaxpayer: true,
    claimedByOtherTaxpayer: false, isInThailand: true,
  };
}

describe("UX-C2.1 — parent relationships (presentation-only)", () => {
  it("exposes exactly the four approved Thai relationships", () => {
    expect(PARENT_RELATIONSHIP_SLOTS.map(slot => slot.label)).toEqual([
      "บิดาของผู้เสียภาษี", "มารดาของผู้เสียภาษี",
      "บิดาของคู่สมรส", "มารดาของคู่สมรส",
    ]);
    expect(PARENT_RELATIONSHIP_SLOTS.map(parentSlotKey)).toEqual([
      "taxpayer:father", "taxpayer:mother", "spouse:father", "spouse:mother",
    ]);
    expect(slotFromKey("taxpayer:father")).toEqual({ owner: "taxpayer", relation: "father" });
    expect(slotFromKey("spouse:mother")).toEqual({ owner: "spouse", relation: "mother" });
    expect(slotFromKey("invalid:father")).toBeNull();
  });

  it("suggests first unused slot in deterministic order, across all four positions", () => {
    const all = [
      parent("A", "taxpayer", "father"),
      parent("B", "taxpayer", "mother"),
      parent("C", "spouse", "father"),
      parent("D", "spouse", "mother"),
    ];
    expect(getFirstUnusedParentSlot([])).toEqual({ owner: "taxpayer", relation: "father" });
    expect(getFirstUnusedParentSlot(all.slice(0, 1))).toEqual({ owner: "taxpayer", relation: "mother" });
    expect(getFirstUnusedParentSlot(all.slice(0, 2))).toEqual({ owner: "spouse", relation: "father" });
    expect(getFirstUnusedParentSlot(all.slice(0, 3))).toEqual({ owner: "spouse", relation: "mother" });
    expect(getFirstUnusedParentSlot(all)).toBeNull();
    expect(getFirstUnusedParentSlot([all[3], all[1]])).toEqual({ owner: "taxpayer", relation: "father" });
  });

  it("disallows all occupied combinations but preserves the current record's own slot", () => {
    const all = [
      parent("A", "taxpayer", "father"),
      parent("B", "taxpayer", "mother"),
      parent("C", "spouse", "father"),
      parent("D", "spouse", "mother"),
    ];
    for (const current of all) {
      expect(canAssignParentSlot(all, current.id, current)).toBe(true);
      for (const other of all.filter(x => x.id !== current.id)) {
        expect(canAssignParentSlot(all, current.id, other)).toBe(false);
      }
    }
    expect(canAssignParentSlot(all, "A", { owner: "spouse", relation: "other" as "father" })).toBe(false);
  });

  it("permits an edit to an unused slot without mutating the original record", () => {
    const original = parent("keep-id", "taxpayer", "father");
    const all = [original, parent("B", "spouse", "mother")];
    const target = { owner: "spouse" as const, relation: "father" as const };
    expect(canAssignParentSlot(all, original.id, target)).toBe(true);
    expect(canAssignParentSlot(all, original.id, { owner: "spouse", relation: "mother" })).toBe(false);
    expect(getParentSlotLabel(original)).toBe("บิดาของผู้เสียภาษี");
    expect(all[0]).toEqual(original);
    expect(original).toMatchObject({
      id: "keep-id", age60OrOlder: true, annualAssessableIncome: 12000,
      supportedByTaxpayer: true, claimedByOtherTaxpayer: false, isInThailand: true,
    });
  });

  it("does not remove, combine, or reassign duplicate legacy records", () => {
    const legacy = [
      parent("first-id", "taxpayer", "father"),
      { ...parent("second-id", "taxpayer", "father"), annualAssessableIncome: 25000 },
      parent("third-id", "spouse", "mother"),
    ];
    const unchanged = JSON.stringify(legacy);
    expect(getDuplicateParentSlotKeys(legacy)).toEqual(["taxpayer:father"]);
    expect(getFirstUnusedParentSlot(legacy)).toEqual({ owner: "taxpayer", relation: "mother" });
    // An existing duplicated record is intentionally not treated as a new slot.
    expect(canAssignParentSlot(legacy, "second-id", { owner: "taxpayer", relation: "father" })).toBe(false);
    expect(canAssignParentSlot(legacy, "second-id", { owner: "spouse", relation: "father" })).toBe(true);
    expect(JSON.stringify(legacy)).toBe(unchanged);
    expect(legacy.map(x => x.id)).toEqual(["first-id", "second-id", "third-id"]);
  });

  it("keeps the add guard, duplicate review warning and disabled four-slot maximum in UI", () => {
    expect(page).toContain("const firstUnusedParentSlot = getFirstUnusedParentSlot(family.parents);");
    expect(page).toContain("const nextSlot = getFirstUnusedParentSlot(family.parents);");
    expect(page).toContain("if (!nextSlot) return;");
    expect(page).toContain("owner: nextSlot.owner");
    expect(page).toContain("relation: nextSlot.relation");
    expect(page).toContain("disabled={!firstUnusedParentSlot}");
    expect(page).toContain("บันทึกครบทั้ง 4 ความสัมพันธ์แล้ว");
    expect(page).toContain("duplicateParentSlotKeys.length > 0");
    expect(page).toContain('role="alert"');
    expect(page).toContain("ระบบยังเก็บข้อมูลทุกรายการไว้");
    expect(page).toContain('disabled={occupiedByOther && !isCurrent}');
  });

  it("prevents invalid edits in the event handler and updates only owner/relation fields", () => {
    expect(page).toContain("if (!slot || !canAssignParentSlot(family.parents, id, slot)) return;");
    expect(page).toContain("updateParent(id, { owner: slot.owner, relation: slot.relation });");
    expect(page).toContain("parent.id === id");
    expect(page).toContain("...parent,");
    expect(page).toContain("...values,");
    expect(page).toContain("family.parents.filter(");
    expect(page).toContain("parent.id !== id");
    expect(page).toContain("getParentSlotLabel(parent)");
    expect(page).toContain("ความสัมพันธ์กับผู้เสียภาษี");
    expect(page).not.toContain('<option value="taxpayer">\n                                คุณ');
  });

  it("retains accessible desktop/mobile controls and existing delete danger styling", () => {
    expect(page).toContain("flex flex-wrap items-start justify-between gap-3");
    expect(page).toContain('className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2"');
    expect(page).toContain("sm:col-span-2");
    expect(page).toContain("min-w-0");
    expect(page).toContain("focus:ring-4 focus:ring-blue-50");
    expect(page).toContain("htmlFor={`parent-slot-${parent.id}`}");
    expect(page).toContain("id={`parent-slot-${parent.id}`}");
    expect(page).toContain("onChange={(e) => changeParentRelationship(parent.id, e.target.value)}");
    expect(page).toContain("className=\"tp-b2-delete\"");
    expect(page).toContain("focus-visible:outline");
  });

  it("does not migrate or rewrite saved parents or parentId health policies", () => {
    const existing = [
      parent("parent-reference", "taxpayer", "father"),
      parent("duplicate-reference", "taxpayer", "father"),
    ];
    const saved = {
      schemaVersion: 14,
      taxYear: 2569,
      family: { parents: existing },
      deductions: {
        parentHealthInsurance: 0,
        parentHealthInsurancePolicies: [{
          id: "policy-id", parentId: "duplicate-reference",
          premiumPaidThisYear: 1200, jointPayerCount: 1,
        }],
      },
    };
    const migrated = migrateStoredState(saved as Parameters<typeof migrateStoredState>[0]);
    expect(migrated.family?.parents).toEqual(existing);
    expect(migrated.deductions?.parentHealthInsurancePolicies?.[0].parentId).toBe("duplicate-reference");
    expect(context).toContain("loaded.family?.parents ??");
    expect(deductions).toContain("parentId:");
  });

  it("preserves Reset/Resume and parent-related tax rules at source level", () => {
    const local = new Map<string, string>();
    const reset = persistPlannerReset({ setItem: (key, val) => local.set(key, val) }, "ux-c2-reset-id");
    expect(reset.family.parents).toEqual([]);
    expect(reset.family.taxpayerAge65OrOlder).toBe(null);
    expect(reset.family.isThaiTaxResident).toBe(null);
    expect(reset.family.isThaiNational).toBe(null);
    expect(reset.resetId).toBe("ux-c2-reset-id");
    expect(JSON.parse(local.get("thai-tax-planner-v0.1")!).family.parents).toEqual([]);
    expect(context).toContain("isStalePlannerTab");
    expect(engine).toContain("function calculateParentAllowance(");
    expect(engine).toContain("canClaimSpouseParentAllowance(");
    expect(rules).toContain("parent: 30_000");
    expect(page).not.toContain("parentHealthInsurancePolicies:");
  });
});
