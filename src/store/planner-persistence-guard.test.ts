import {describe,it,expect} from "vitest";
import {persistPlannerReset,savePlannerStateSerialized,migrateStoredState} from "./TaxPlannerContext";
import type {TaxPlannerState} from "./TaxPlannerContext";
import {PLANNER_KEY,RESET_WITNESS_KEY,readPlannerProtected} from "./planner-persistence-guard";
const initial = {
  schemaVersion:14,taxYear:2569,resetId:"old-generation",persistRevision:1,
  income:{monthlySalary:75000},family:{maritalStatus:"married"},
  deductions:{parentHealthInsurance:9000,parentHealthInsurancePolicies:[
    {id:"policy-original",parentId:"parent-original",premiumPaidThisYear:9000,jointPayerCount:3}
  ]},planning:{rmf:50000}
} as unknown as TaxPlannerState;
type Outcome=Awaited<ReturnType<typeof savePlannerStateSerialized>>;
function store(value:TaxPlannerState=initial) {
  const map=new Map<string,string>([[PLANNER_KEY,JSON.stringify(value)]]);
  const storage={
    getItem:(key:string)=>map.get(key)??null,
    setItem:(key:string,val:string)=>{map.set(key,val);},
    removeItem:(key:string)=>{map.delete(key);},
    key:(index:number)=>[...map.keys()][index]??null,
    get length(){return map.size;}
  };
  return {map,storage,raw:()=>JSON.parse(map.get(PLANNER_KEY)!),current:()=>readPlannerProtected(storage)};
}
const immediate=async(cb:()=>Outcome)=>cb();
describe("TAX-C3.1A deterministic reset / stale-write interleavings",()=>{
  it("queued normal save cannot revive old inputs after synchronous Reset",async()=>{
    const db=store();
    let execute:(()=>Outcome)|undefined;
    const queued=(cb:()=>Outcome)=>new Promise<Outcome>(resolve=>{execute=()=>{const v=cb();resolve(v);return v;}});
    const saving=savePlannerStateSerialized(db.storage,initial,1,queued);
    const clean=persistPlannerReset(db.storage,"new-reset");
    expect(db.raw().resetId).toBe("new-reset");
    execute!();
    expect(await saving).toEqual({status:"conflict"});
    expect(db.current().state?.resetId).toBe("new-reset");
    expect(db.current().state?.income?.monthlySalary).toBe(0);
    expect(clean.resetId).toBe("new-reset");
  });
  it("Reset interrupted between a stale journal write and main write is detected",async()=>{
    const db=store();
    let inserted=false;
    const storage={...db.storage,setItem:(key:string,val:string)=>{
      db.storage.setItem(key,val);
      if(!inserted && key.includes("-safe-journal-")) {
        inserted=true;
        persistPlannerReset(db.storage,"after-journal");
      }
    }};
    const result=await savePlannerStateSerialized(storage,initial,1,immediate);
    expect(result).toEqual({status:"conflict"});
    expect(db.current().state?.resetId).toBe("after-journal");
    expect(db.current().state?.deductions?.parentHealthInsurance).toBe(0);
  });
  it("Reset occurring inside a main-key write is witnessed even if stale write lands last",async()=>{
    const db=store();let inserted=false;
    const storage={...db.storage,setItem:(key:string,val:string)=>{
      if(key===PLANNER_KEY && !inserted) {
        inserted=true;
        persistPlannerReset(db.storage,"reset-during-write");
      }
      db.storage.setItem(key,val);
    }};
    const result=await savePlannerStateSerialized(storage,initial,1,immediate);
    expect(result).toEqual({status:"conflict"});
    // Physical primary was overwritten, but authoritative reset witness survives.
    expect(db.raw().resetId).toBe("old-generation");
    expect(db.current().source).toBe("reset-witness");
    expect(db.current().state?.resetId).toBe("reset-during-write");
    expect(db.current().state?.income?.monthlySalary).toBe(0);
    expect(db.map.has(RESET_WITNESS_KEY)).toBe(true);
  });
  it("old-version tab overwrites primary after a new-version save; journal preserves financial data",async()=>{
    const db=store();
    const newIncome={...initial,income:{...initial.income,monthlySalary:81000}};
    expect(await savePlannerStateSerialized(db.storage,newIncome,1,immediate)).toEqual({status:"saved",revision:2});
    // Old JS has no journal guard and writes an older full snapshot.
    db.storage.setItem(PLANNER_KEY,JSON.stringify(initial));
    const recovered=db.current();
    expect(recovered.conflict).toBe(true);
    expect(recovered.source).toBe("journal");
    expect(recovered.state?.income?.monthlySalary).toBe(81000);
    expect(recovered.state?.deductions?.parentHealthInsurancePolicies?.[0].id).toBe("policy-original");
    expect(db.raw().income.monthlySalary).toBe(75000); // no automatic destructive rewrite
  });
  it("explicit synchronous Reset removes financial journals from all older generations",async()=>{
    const db=store();
    expect(await savePlannerStateSerialized(db.storage,initial,1,immediate)).toMatchObject({status:"saved"});
    expect([...db.map.keys()].some(k=>k.includes("safe-journal-"))).toBe(true);
    db.storage.setItem("thai-tax-planner-v0.1-safe-journal-an-older-token",JSON.stringify(initial));
    persistPlannerReset(db.storage,"clean-private");
    expect([...db.map.keys()].some(k=>k.includes("safe-journal-"))).toBe(false);
    expect(db.current().state?.deductions?.parentHealthInsurance).toBe(0);
  });
  it("a malformed old-app document cannot hide valid independent recovery journal",async()=>{
    const db=store();
    expect(await savePlannerStateSerialized(db.storage,initial,1,immediate)).toMatchObject({status:"saved"});
    db.storage.setItem(PLANNER_KEY,"{malformed JSON");
    const recovered=db.current();
    expect(recovered.conflict).toBe(true);
    expect(recovered.source).toBe("journal");
    expect(recovered.state?.income?.monthlySalary).toBe(75000);
    expect(db.storage.getItem(PLANNER_KEY)).toBe("{malformed JSON");
  });
  it("journal storage failure prevents main-key mutation and rejects unsafe write",async()=>{
    const db=store();
    const storage={...db.storage,setItem:(key:string,val:string)=>{
      if(key.includes("-safe-journal-")) throw new Error("journal write failed");
      db.storage.setItem(key,val);
    }};
    await expect(savePlannerStateSerialized(storage,initial,1,immediate))
      .rejects.toThrow("journal write failed");
    expect(db.raw()).toEqual(initial);
  });
  it("old-version tab cannot erase authoritative reset witness",()=>{
    const db=store();
    persistPlannerReset(db.storage,"reset-v2");
    db.storage.setItem(PLANNER_KEY,JSON.stringify(initial));
    const recovered=db.current();
    expect(recovered.conflict).toBe(true);
    expect(recovered.source).toBe("reset-witness");
    expect(recovered.state?.resetId).toBe("reset-v2");
    expect(recovered.state?.planning?.rmf).toBe(0);
  });
  it("newer incompatible primary schema cannot silently replace protected journal",async()=>{
    const db=store();
    expect(await savePlannerStateSerialized(db.storage,initial,1,immediate)).toMatchObject({status:"saved"});
    db.storage.setItem(PLANNER_KEY,JSON.stringify({...initial,schemaVersion:999}));
    expect(db.current()).toMatchObject({source:"journal",conflict:true});
  });
  it("old snapshot survives reset guard without altering Family/Income/Deductions/Planner on attempted stale write",async()=>{
    const db=store();
    persistPlannerReset(db.storage,"clean");
    const result=await savePlannerStateSerialized(db.storage,initial,1,immediate);
    expect(result.status).toBe("conflict");
    const newState=migrateStoredState(db.current().state!);
    expect(newState.income?.monthlySalary).toBe(0);
    expect(newState.family?.maritalStatus).toBe("single");
    expect(newState.deductions?.parentHealthInsurance).toBe(0);
    expect(newState.planning?.rmf).toBe(0);
  });
});
