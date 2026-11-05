import { describe, expect, it } from "vitest";
import { TAX_RULES_2569 } from "@/tax-rules/2569";
import type { DeductionData, ParentHealthInsurancePolicyData, ParentHealthEligibilityProfile, ParentHealthRelationshipKey } from "@/types/deductions";
import type { FamilyData } from "@/types/family";
import { calculateInsuranceDeductions } from "./deductions";
import { resolveParentHealthPolicies } from "./parent-health-compat";
import { prepareParentHealthConversion, confirmParentHealthConversion, rollbackParentHealthConversion } from "./parent-health-conversion";

const relationships: ParentHealthRelationshipKey[] =
  ["taxpayer:father", "taxpayer:mother", "spouse:father", "spouse:mother"];
const zeroDeductions: DeductionData = {
  lifeInsurance: 0, healthInsuranceSelf: 0, spouseLifeInsurance: 0,
  parentHealthInsurance: 0, pensionInsurance: 0,
  providentFund: 0, gpf: 0, privateTeacherFund: 0, nsf: 0, rmf: 0,
  thaiEsg: 0, ltfToThaiEsgxTransferAmount: 0,
  socialSecurity: 0, homeLoanInterest: 0, pregnancyAndChildbirth: 0,
  socialEnterpriseInvestment: 0, politicalDonation: 0, specialDonation: 0, generalDonation: 0
};
const baseFamily: FamilyData = {
  taxpayerAge65OrOlder: null, isThaiTaxResident: true, isThaiNational: null,
  seniorIncomeExemptionAllocation: {
    section40_1: 0, section40_2: 0, section40_3Annuity: 0,
    section40_3Rights: 0, section40_4Interest: 0,
    section40_4Dividend: 0, section40_5: 0, section40_6: 0, section40_7: 0,
  },
  maritalStatus: "single", spouseHasIncome: false, marriedFullTaxYear: false,
  children: [], parents: [], disabledDependents: [], pregnancies: []
};
function policy(id: string, key: ParentHealthRelationshipKey, amount: number, payers: number | null = 1): ParentHealthInsurancePolicyData {
  return { id, parentId: null, relationshipKey: key, premiumPaidThisYear: amount,
    jointPayerCount: payers, qualifyingInsuranceConfirmed: true, evidenceConfirmed: true };
}
function profile(key: ParentHealthRelationshipKey, income: number | null = 0): ParentHealthEligibilityProfile {
  return { relationshipKey: key, taxYear: 2569, annualAssessableIncome: income,
    incomeConfirmed: income === null ? null : true, isInThailand: true, legalChildConfirmed: true };
}
function calc(policies: ParentHealthInsurancePolicyData[], profiles: ParentHealthEligibilityProfile[], family: FamilyData = baseFamily, aggregate = 0) {
  return calculateInsuranceDeductions({ deductions: { ...zeroDeductions, parentHealthInsurance: aggregate,
    parentHealthInsurancePolicies: policies, parentHealthEligibilityProfiles: profiles },
    family, rules: TAX_RULES_2569 });
}
describe("TAX-C3.1A dormant independent parent health foundation", () => {
  it("all four relationship keys work without Family parents and spouse rules stay unchanged", () => {
    for (const key of relationships) {
      const result = calc([policy("p",key,12000,2)],[profile(key)]);
      expect(result.parentHealthInsurance.paid).toBe(6000);
      expect(result.parentHealthInsurance.allowed).toBe(key.startsWith("spouse:") ? 0 : 6000);
    }
  });
  it("30,000 is inclusive; 30,001 and unknown are never eligible", () => {
    expect(calc([policy("1","taxpayer:father",12000)],[profile("taxpayer:father",30000)])
      .parentHealthInsurance.allowed).toBe(12000);
    expect(calc([policy("1","taxpayer:father",12000)],[profile("taxpayer:father",30001)])
      .parentHealthInsurance.allowed).toBe(0);
    expect(calc([policy("1","taxpayer:father",12000)],[profile("taxpayer:father",null)])
      .parentHealthInsurance.allowed).toBe(0);
  });
  it("eligibility and policy evidence must be confirmed per policy", () => {
    const good = policy("good","taxpayer:father",8000);
    const unchecked = {...policy("unchecked","taxpayer:father",9000),evidenceConfirmed:null};
    const result=calc([good,unchecked],[profile("taxpayer:father")]);
    expect(result.parentHealthInsurance.allowed).toBe(8000);
    expect(result.parentHealthInsurance.paid).toBe(17000);
    expect(calc([good],[{...profile("taxpayer:father"),legalChildConfirmed:null}]).parentHealthInsurance.allowed).toBe(0);
    expect(calc([{...good,qualifyingInsuranceConfirmed:false}],[profile("taxpayer:father")]).parentHealthInsurance.allowed).toBe(0);
  });
  it("two different policies share profile and a single combined 15,000 cap", () => {
    const result=calc([policy("a","taxpayer:father",8000),policy("b","taxpayer:father",9000)],
      [profile("taxpayer:father")]);
    expect(result.parentHealthInsurance.allowed).toBe(15000);
    expect(result.parentHealthInsurance.excess).toBe(2000);
  });
  it("invalid payers and residency unknown fail closed", () => {
    expect(calc([policy("a","taxpayer:father",12000,0)],[profile("taxpayer:father")])
      .parentHealthInsurance.allowed).toBe(0);
    expect(calc([policy("a","taxpayer:father",12000)],[{...profile("taxpayer:father"),isInThailand:null}],
      {...baseFamily,isThaiTaxResident:false}).parentHealthInsurance.allowed).toBe(0);
  });
  it("duplicate independent profiles are a conflict, not multiple entitlement", () => {
    const input={...zeroDeductions,parentHealthInsurancePolicies:[policy("a","taxpayer:father",12000)],
      parentHealthEligibilityProfiles:[profile("taxpayer:father"),profile("taxpayer:father")]};
    expect(resolveParentHealthPolicies(input,baseFamily,TAX_RULES_2569)[0].status).toBe("conflict");
    expect(calculateInsuranceDeductions({deductions:input,family:baseFamily,rules:TAX_RULES_2569})
      .parentHealthInsurance.allowed).toBe(0);
  });
  it("reused direct Policy ID is a conflict, while distinct policies sharing a parent are allowed", () => {
    const one=policy("duplicate","taxpayer:father",8000);
    const two=policy("duplicate","taxpayer:father",9000);
    const input={...zeroDeductions,parentHealthInsurancePolicies:[one,two],
      parentHealthEligibilityProfiles:[profile("taxpayer:father")]};
    const records=resolveParentHealthPolicies(input,baseFamily,TAX_RULES_2569);
    expect(records.map(x=>x.status)).toEqual(["conflict","conflict"]);
    expect(calculateInsuranceDeductions({deductions:input,family:baseFamily,rules:TAX_RULES_2569})
      .parentHealthInsurance.allowed).toBe(0);
  });
  it("non-finite and negative new parent income never produce an entitlement", () => {
    for(const amount of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
      expect(calc([policy("id","taxpayer:father",10000)],[profile("taxpayer:father",amount)])
        .parentHealthInsurance.allowed).toBe(0);
    }
  });
  it("legacy detailed remains authoritative over the aggregate and preserves orphan ID", () => {
    const input:DeductionData={...zeroDeductions,parentHealthInsurance:99999,
      parentHealthInsurancePolicies:[{id:"original",parentId:"missing-family-id",
        premiumPaidThisYear:12000,jointPayerCount:2}]};
    const records=resolveParentHealthPolicies(input,baseFamily,TAX_RULES_2569);
    expect(records).toMatchObject([{policyId:"original",originalParentId:"missing-family-id",
      source:"legacy-linked",status:"unresolved",paid:6000,eligibleShare:0}]);
    const result=calculateInsuranceDeductions({deductions:input,family:baseFamily,rules:TAX_RULES_2569});
    expect(result.parentHealthInsurance).toEqual({paid:6000,allowed:0,excess:6000});
  });
  it("legacy aggregate never creates detailed policy and does not count twice", () => {
    const input:DeductionData={...zeroDeductions,parentHealthInsurance:12000};
    const records=resolveParentHealthPolicies(input,baseFamily,TAX_RULES_2569);
    expect(records[0]).toMatchObject({source:"legacy-aggregate",paid:12000,eligibleShare:0});
    expect(input.parentHealthInsurancePolicies).toBeUndefined();
  });
});

describe("TAX-C3.1A explicit legacy conversion and recovery", () => {
  const legacyParent:FamilyData["parents"][number]={
    id:"original-parent",owner:"taxpayer",relation:"father",
    birthYearBE:null,age60OrOlder:null,annualAssessableIncome:30000,
    supportedByTaxpayer:true,claimedByOtherTaxpayer:null,isInThailand:null
  };
  const original:DeductionData={...zeroDeductions,parentHealthInsurance:33333,
    parentHealthInsurancePolicies:[{id:"original-policy",parentId:"original-parent",premiumPaidThisYear:12000,jointPayerCount:2}]};
  const parentFamily:FamilyData={...baseFamily,parents:[legacyParent]};
  const config={
    deductions:original,family:parentFamily,rules:TAX_RULES_2569,
    policyId:"original-policy",profile:profile("taxpayer:father",30000),
    qualifyingInsuranceConfirmed:true,evidenceConfirmed:true
  };
  it("preview is pure; requires explicit confirmation; identifiers and paid/excess preserved", () => {
    const plan=prepareParentHealthConversion(config);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(original.parentHealthInsurancePolicies?.[0].relationshipKey).toBeUndefined();
    expect(confirmParentHealthConversion(plan.preview,false,original)).toMatchObject({ok:false,reason:"user-confirmation-required"});
    const accepted=confirmParentHealthConversion(plan.preview,true,original);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.next.parentHealthInsurance).toBe(33333);
    expect(accepted.next.parentHealthInsurancePolicies?.[0]).toMatchObject({
      id:"original-policy",parentId:"original-parent",premiumPaidThisYear:12000,jointPayerCount:2,
      relationshipKey:"taxpayer:father"
    });
    expect(plan.preview.previousAllowed).toBe(6000);
    expect(plan.preview.proposedAllowed).toBe(6000);
    expect(plan.preview.previousExcess).toBe(0);
    expect(rollbackParentHealthConversion(plan.preview,accepted.next)).toEqual({ok:true,next:original});
    expect(rollbackParentHealthConversion(plan.preview,{...accepted.next,parentHealthInsurance:99}))
      .toMatchObject({ok:false,reason:"state-conflict"});
  });
  it("orphan and duplicate Family relationships block ambiguous conversion", () => {
    const orphan=prepareParentHealthConversion({...config,family:baseFamily});
    expect(orphan).toMatchObject({ok:false,reason:"unresolved-or-duplicate-parent-id"});
    const duplicate=prepareParentHealthConversion({...config,family:{...parentFamily,parents:[
      legacyParent,{...legacyParent,id:"second-parent"}
    ]}});
    expect(duplicate).toMatchObject({ok:false,reason:"duplicate-legacy-relationship"});
  });
  it("unknown direct eligibility cannot silently replace formerly eligible legacy results", () => {
    expect(prepareParentHealthConversion({...config,profile:profile("taxpayer:father",null)}))
      .toMatchObject({ok:false,reason:"financial-difference-requires-separate-review"});
    expect(prepareParentHealthConversion({...config,evidenceConfirmed:null}))
      .toMatchObject({ok:false,reason:"financial-difference-requires-separate-review"});
  });
  it("intervening edits block stale user confirmation", () => {
    const plan=prepareParentHealthConversion(config);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(confirmParentHealthConversion(plan.preview,true,{...original,parentHealthInsurance:123}))
      .toMatchObject({ok:false,reason:"state-conflict"});
  });
});
