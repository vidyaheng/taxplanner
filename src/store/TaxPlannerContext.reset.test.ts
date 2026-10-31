import { describe, expect, it } from "vitest";

import {
  migrateStoredState,
  persistPlannerReset,
  savePlannerStateIfCurrent,
  isStalePlannerTab,
} from "./TaxPlannerContext";

describe("TaxPlanner reset persistence", () => {
  it("overwrites saved income, family, deductions and planning with initial state", () => {
    const records = new Map<string, string>([
      [
        "thai-tax-planner-v0.1",
        JSON.stringify({
          schemaVersion: 14,
          income: { monthlySalary: 200_000 },
          family: { maritalStatus: "married" },
          deductions: { thaiEsg: 50_000 },
          planning: { rmf: 80_000 },
        }),
      ],
    ]);

    persistPlannerReset({
      setItem: (key, value) => {
        records.set(key, value);
      },
    });

    // Simulate a new page load reading the same browser storage.
    const saved = JSON.parse(records.get("thai-tax-planner-v0.1")!);
    expect(saved.schemaVersion).toBe(14);
    expect(saved.taxYear).toBe(2569);
    expect(saved.income.monthlySalary).toBe(0);
    expect(saved.family.maritalStatus).toBe("single");
    expect(saved.family.children).toEqual([]);
    expect(saved.deductions.thaiEsg).toBe(0);
    expect(saved.planning.rmf).toBe(0);
    expect(migrateStoredState(saved)).toEqual(saved);
  });

  it("does not suppress storage failures that must prevent a confirmed reset", () => {
    expect(() =>
      persistPlannerReset({
        setItem: () => {
          throw new Error("Storage unavailable");
        },
      })
    ).toThrow("Storage unavailable");
  });

  it("preserves legacy migration of existing saved data", () => {
    const legacy = {
      schemaVersion: 13,
      income: { monthlySalary: 42_000 },
      deductions: { thaiEsg: 10_000 },
      planning: { rmf: 5_000 },
    };
    const loaded = migrateStoredState(legacy as never);
    expect(loaded.schemaVersion).toBe(14);
    expect(loaded.income?.monthlySalary).toBe(42_000);
    expect(loaded.deductions?.thaiEsg).toBe(10_000);
    expect(loaded.planning?.rmf).toBe(5_000);
  });
  it("rejects writes from a stale second tab after Tab A resets", () => {
    const initial = {
      schemaVersion: 14,
      taxYear: 2569,
      income: { monthlySalary: 180_000 },
      family: { maritalStatus: "married" },
      deductions: { thaiEsg: 25_000 },
      planning: { rmf: 12_000 },
    };
    const records = new Map([[
      "thai-tax-planner-v0.1", JSON.stringify(initial),
    ]]);
    const storage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => { records.set(key, value); },
    };

    // Tab B loaded this legacy snapshot before Tab A reset it.
    const tabB = { ...initial, resetId: undefined } as never;
    const tabA = persistPlannerReset(storage, "reset-in-tab-A");
    expect(tabA.resetId).toBe("reset-in-tab-A");

    // A pending save/effect in Tab B must not revive its old values.
    expect(savePlannerStateIfCurrent(storage, tabB)).toBe(false);
    const saved = JSON.parse(storage.getItem("thai-tax-planner-v0.1")!);
    expect(saved.resetId).toBe("reset-in-tab-A");
    expect(saved.income.monthlySalary).toBe(0);
    expect(saved.family.maritalStatus).toBe("single");
    expect(saved.deductions.thaiEsg).toBe(0);
    expect(saved.planning.rmf).toBe(0);

    // After Tab B reloads and restores the new snapshot it can edit normally.
    const resumedB = {
      ...saved,
      income: { ...saved.income, monthlySalary: 9_000 },
    };
    expect(savePlannerStateIfCurrent(storage, resumedB)).toBe(true);
    expect(JSON.parse(storage.getItem("thai-tax-planner-v0.1")!).income.monthlySalary).toBe(9_000);
  });

  it("signals a remote reset but not ordinary changes from the same generation", () => {
    expect(isStalePlannerTab({ resetId: undefined }, { resetId: "other-tab-reset" })).toBe(true);
    expect(isStalePlannerTab({ resetId: "same" }, { resetId: "same" })).toBe(false);
    expect(isStalePlannerTab({ schemaVersion: 13 }, { schemaVersion: 14 })).toBe(false);
    expect(isStalePlannerTab({ resetId: "old" }, null)).toBe(true);
  });

  it("allows normal saves and resume without any reset generation on legacy data", () => {
    const records = new Map<string, string>([[
      "thai-tax-planner-v0.1", JSON.stringify({ schemaVersion: 13, income: { monthlySalary: 1_000 } }),
    ]]);
    const storage = {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => { records.set(key, value); },
    };
    const restored = migrateStoredState(JSON.parse(storage.getItem("thai-tax-planner-v0.1")!));
    expect(restored.income?.monthlySalary).toBe(1_000);
    expect(savePlannerStateIfCurrent(storage, restored as never)).toBe(true);
    expect(JSON.parse(storage.getItem("thai-tax-planner-v0.1")!).income.monthlySalary).toBe(1_000);
  });
});
