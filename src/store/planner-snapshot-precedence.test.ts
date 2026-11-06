import {describe,it,expect} from "vitest";
import type {TaxPlannerState} from "./TaxPlannerContext";
import {
  PLANNER_KEY, RESET_WITNESS_KEY, JOURNAL_HEAD_KEY,
  readPlannerProtected, writePlannerJournal, writePlannerResetWitness
} from "./planner-persistence-guard";
import {buildRecoveryBundle,serializeRecoveryBundle} from "./planner-recovery-export";

const state=(resetId="g1",persistRevision=1,salary=75000) => ({
  schemaVersion:14,taxYear:2569,resetId,persistRevision,
  income:{monthlySalary:salary},family:{parents:[{id:"parent-original"}]},
  deductions:{parentHealthInsurance:9000,parentHealthInsurancePolicies:[
    {id:"policy-original",parentId:"parent-original",premiumPaidThisYear:9000,jointPayerCount:3}
  ]},planning:{rmf:50000}
}) as unknown as TaxPlannerState;
function storage(initial:TaxPlannerState=state()){
 const map=new Map<string,string>([[PLANNER_KEY,JSON.stringify(initial)]]);
 return {map,
  getItem:(k:string)=>map.get(k)??null,
  setItem:(k:string,v:string)=>{map.set(k,v);},
  removeItem:(k:string)=>{map.delete(k);},
  key:(n:number)=>[...map.keys()][n]??null,
  get length(){return map.size;}
 };
}
describe("C3.1A R2 snapshot authority policy",()=>{
 it("valid matching primary and journal: primary is unambiguous",()=>{
  const db=storage();writePlannerJournal(db,state());
  expect(readPlannerProtected(db)).toMatchObject({source:"primary",conflict:false,reason:null});
 });
 it("primary newer than journal: never silently restores older journal",()=>{
  const db=storage(state("g1",4,81000));writePlannerJournal(db,state("g1",3,75000));
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({conflict:true,state:null,reason:"snapshot-revision-or-content-conflict"});
  expect(read.candidates.map(c=>c.source)).toEqual(["primary","journal"]);
  expect(read.candidates[0].state.persistRevision).toBe(4);
 });
 it("journal newer than primary: fail closed, retain both",()=>{
  const db=storage(state("g1",3,75000));writePlannerJournal(db,state("g1",4,81000));
  const read=readPlannerProtected(db);
  expect(read.state).toBeNull();
  expect(read.candidates[1].state.persistRevision).toBe(4);
 });
 it("reset witness always fences different-generation primary even with stale head",()=>{
  const db=storage(state("old",9,99000));
  writePlannerResetWitness(db,state("new",0,0));
  writePlannerJournal(db,state("old",10,100000));
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({source:"reset-witness",reason:"reset-generation-conflict",conflict:true});
  expect(read.state?.resetId).toBe("new");
 });
 it("old version overwriting primary after reset never reactivates salary",()=>{
  const db=storage(state("new",0,0));writePlannerResetWitness(db,state("new",0,0));
  db.setItem(PLANNER_KEY,JSON.stringify(state("old",9,99999)));
  const read=readPlannerProtected(db);
  expect(read.state?.income?.monthlySalary).toBe(0);
  expect(read.candidates.some(c=>c.source==="primary")).toBe(true);
 });
 it("corrupted primary preserves valid journal candidate but cannot auto activate it",()=>{
  const db=storage();writePlannerJournal(db,state());
  db.setItem(PLANNER_KEY,"{ invalid json");
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({state:null,conflict:true,reason:"invalid-primary"});
  expect(read.candidates.find(c=>c.source==="journal")?.state.deductions?.parentHealthInsurance).toBe(9000);
 });
 it("interrupted journal/main write is ambiguous and retained",()=>{
  const db=storage();writePlannerJournal(db,state("g1",2,80000));
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({state:null,conflict:true});
  expect(read.candidates).toHaveLength(2);
 });
 it("stale journal from older generation cannot supersede reset",()=>{
  const db=storage(state("new",0,0));writePlannerResetWitness(db,state("new",0,0));
  db.setItem(JOURNAL_HEAD_KEY,"old");
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({source:"reset-witness",conflict:true,
    reason:"stale-journal-head-after-reset"});
  expect(read.state?.resetId).toBe("new");
  expect(read.state?.income?.monthlySalary).toBe(0);
 });
 it("malformed pointer and malformed witness both fail closed",()=>{
  const db=storage();db.setItem(JOURNAL_HEAD_KEY,"../bad");
  expect(readPlannerProtected(db)).toMatchObject({state:null,conflict:true});
  db.removeItem(JOURNAL_HEAD_KEY);
  db.setItem(RESET_WITNESS_KEY,"{broken");
  expect(readPlannerProtected(db)).toMatchObject({state:null,reason:"malformed-reset-witness"});
 });
 it("duplicate metadata (pointer to wrong generation) does not guess journal",()=>{
  const db=storage();writePlannerJournal(db,state("g1",3,81000));
  db.setItem(JOURNAL_HEAD_KEY,"g2");
  const read=readPlannerProtected(db);
  expect(read).toMatchObject({state:null,reason:"malformed-or-mismatched-journal-head"});
 });
 it("export preserves distinct unsaved plus primary and journal with original IDs",()=>{
  const candidates=[
   {source:"primary" as const,state:state("g1",1,75000)},
   {source:"journal" as const,state:state("g1",2,81000)}
  ];
  const json=serializeRecoveryBundle(buildRecoveryBundle(JSON.stringify(state("g1",3,85000)),candidates));
  const result=JSON.parse(json);
  expect(result.format).toBe("taxplanner-recovery-bundle-v2");
  expect(result.unsavedSnapshot.income.monthlySalary).toBe(85000);
  expect(result.protectedCandidates.map((c:{source:string})=>c.source)).toEqual(["primary","journal"]);
  expect(result.protectedCandidates[1].state.deductions.parentHealthInsurancePolicies[0])
    .toMatchObject({id:"policy-original",parentId:"parent-original",premiumPaidThisYear:9000,jointPayerCount:3});
  expect(result.protectedCandidates[1].state.planning.rmf).toBe(50000);
  expect(result.protectedCandidates[1].state.family.parents[0].id).toBe("parent-original");
 });
 it("malformed session backup remains non-destructive; no implicit import",()=>{
  const db=storage();
  const bundle=buildRecoveryBundle("{invalid",[]);
  expect(bundle.unsavedSnapshot).toBeNull();
  expect(db.getItem(PLANNER_KEY)).toBe(JSON.stringify(state()));
 });
});
