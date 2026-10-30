import { describe, expect, it } from "vitest";

import {
  migrateStoredState,
  persistPlannerReset,
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
});
