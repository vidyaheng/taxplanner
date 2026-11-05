import { describe, expect, it } from "vitest";
import {
  migrateStoredState, persistPlannerReset, savePlannerStateSerialized
} from "./TaxPlannerContext";

const KEY = "thai-tax-planner-v0.1";
type WriteOutcome = Awaited<ReturnType<typeof savePlannerStateSerialized>>;
function store(initial: object) {
  const map = new Map<string,string>([[KEY, JSON.stringify(initial)]]);
  return {
    read: () => JSON.parse(map.get(KEY)!),
    storage: {
      getItem: (key:string) => map.get(key) ?? null,
      setItem: (key:string,value:string) => {map.set(key,value);}
    }
  };
}
/** Test serializer models a granted exclusive lock. */
const exclusive = async (cb:()=>WriteOutcome):Promise<WriteOutcome> => cb();
describe("C3.1A serialized browser persistence", () => {
  const initial = {schemaVersion:14,taxYear:2569, resetId:"r1", persistRevision:2,
    deductions:{parentHealthInsurance:9000,parentHealthInsurancePolicies:[
      {id:"policy-1",parentId:"family-1",premiumPaidThisYear:9000,jointPayerCount:3}
    ]},family:{parents:[{id:"family-1",owner:"taxpayer",relation:"father"}]}};
  it("preserves IDs, premiums, payer and legacy aggregate in additive hydration", () => {
    expect(migrateStoredState(initial as never)).toEqual(initial);
  });
  it("an exclusive write increments revision without changing financial data", async () => {
    const db=store(initial);
    const next={...initial, deductions:{...initial.deductions,parentHealthInsurance:10000}};
    const result=await savePlannerStateSerialized(db.storage,next as never,2,exclusive);
    expect(result).toEqual({status:"saved",revision:3});
    expect(db.read().deductions.parentHealthInsurancePolicies).toEqual(initial.deductions.parentHealthInsurancePolicies);
    expect(db.read().deductions.parentHealthInsurance).toBe(10000);
  });
  it("rejects second stale tab and preserves first tab's write", async () => {
    const db=store(initial);
    const tabA={...initial,deductions:{...initial.deductions,parentHealthInsurance:12000}};
    const tabB={...initial,deductions:{...initial.deductions,parentHealthInsurance:50000}};
    expect(await savePlannerStateSerialized(db.storage,tabA as never,2,exclusive)).toMatchObject({status:"saved",revision:3});
    expect(await savePlannerStateSerialized(db.storage,tabB as never,2,exclusive)).toEqual({status:"conflict"});
    expect(db.read().deductions.parentHealthInsurance).toBe(12000);
  });
  it("blocks future-schema writes and does not mutate stored data", async () => {
    const db=store({...initial,schemaVersion:99});
    const result=await savePlannerStateSerialized(db.storage,initial as never,2,exclusive);
    expect(result).toEqual({status:"conflict"});
    expect(db.read().schemaVersion).toBe(99);
  });
  it("fails closed without serializer rather than claiming atomicity", async () => {
    const db=store(initial);
    expect(await savePlannerStateSerialized(db.storage,initial as never,2)).toEqual({status:"unsupported"});
    expect(db.read()).toEqual(initial);
  });
  it("a synchronous reset fences off an obsolete tab and survives reload", async () => {
    const db=store(initial);
    const reset=persistPlannerReset(db.storage,"r2");
    expect(reset.resetId).toBe("r2");
    expect(await savePlannerStateSerialized(db.storage,initial as never,2,exclusive)).toEqual({status:"conflict"});
    expect(db.read().resetId).toBe("r2");
    expect(db.read().deductions.parentHealthInsurance).toBe(0);
    expect(migrateStoredState(db.read()).resetId).toBe("r2");
  });
  it("rejects interrupted lock callbacks and never performs an unlocked write", async () => {
    const db=store(initial);
    const neverAcquired=async (_cb:()=>WriteOutcome):Promise<WriteOutcome> => ({status:"unsupported"});
    expect(await savePlannerStateSerialized(db.storage,initial as never,2,neverAcquired)).toEqual({status:"unsupported"});
    expect(db.read()).toEqual(initial);
  });
});
