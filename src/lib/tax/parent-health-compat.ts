import type { DeductionData, ParentHealthInsurancePolicyData, ParentHealthEligibilityProfile, ParentHealthRelationshipKey } from "@/types/deductions";
import type { FamilyData } from "@/types/family";
import type { TaxRuleSet } from "@/tax-rules/types";

/** Dormant C3.1A compatibility layer. No page-load conversion or state mutation. */
export type ParentHealthResolution = {
  source: "legacy-aggregate" | "legacy-linked" | "direct";
  status: "eligible" | "ineligible" | "incomplete" | "unresolved" | "conflict";
  policyId: string | null;
  originalParentId: string | null;
  paid: number;
  share: number;
  eligibleShare: number;
};

export function relationshipKeyOf(parent: FamilyData["parents"][number]): ParentHealthRelationshipKey {
  return `${parent.owner}:${parent.relation}` as ParentHealthRelationshipKey;
}

function spouseParentEligible(family: FamilyData): boolean {
  const spouseIncome = family.spouseHasAssessableIncome !== undefined
    ? family.spouseHasAssessableIncome : family.spouseHasIncome;
  return (family.maritalStatus === "married" && spouseIncome === false) ||
    ((family.maritalStatus === "divorced" || family.maritalStatus === "widowed") &&
      family.marriageEndedThisTaxYear === true &&
      family.formerSpouseHadAssessableIncomeThisTaxYear === false);
}

function legacyParentEligible(parent: FamilyData["parents"][number], family: FamilyData, rules: TaxRuleSet): boolean {
  return parent.annualAssessableIncome <= rules.eligibility.parentIncomeLimitInclusive &&
    (family.isThaiTaxResident !== false || parent.isInThailand === true || parent.isInThailand === undefined) &&
    (parent.owner === "taxpayer" || (parent.owner === "spouse" && spouseParentEligible(family)));
}

export function evaluateDirectParentHealth(
  policy: ParentHealthInsurancePolicyData,
  profile: ParentHealthEligibilityProfile | undefined,
  family: FamilyData,
  rules: TaxRuleSet
): "eligible" | "ineligible" | "incomplete" | "conflict" {
  if (!policy.relationshipKey || !(
    ["taxpayer:father", "taxpayer:mother", "spouse:father", "spouse:mother"] as string[]
  ).includes(policy.relationshipKey)) return "incomplete";
  if (!profile || profile.relationshipKey !== policy.relationshipKey ||
      profile.taxYear !== rules.taxYear || policy.conversionStatus === "conflict") return "incomplete";
  if (profile.incomeConfirmed !== true || profile.annualAssessableIncome === null ||
      !Number.isFinite(profile.annualAssessableIncome) || profile.annualAssessableIncome < 0 ||
      profile.legalChildConfirmed === null || profile.legalChildConfirmed === undefined ||
      policy.qualifyingInsuranceConfirmed == null || policy.evidenceConfirmed == null ||
      (family.isThaiTaxResident === false && profile.isInThailand == null) ||
      family.isThaiTaxResident === null) return "incomplete";
  if (profile.annualAssessableIncome > rules.eligibility.parentIncomeLimitInclusive ||
      profile.legalChildConfirmed === false || policy.qualifyingInsuranceConfirmed === false ||
      policy.evidenceConfirmed === false ||
      (family.isThaiTaxResident === false && profile.isInThailand !== true)) return "ineligible";
  if (policy.relationshipKey.startsWith("spouse:") && !spouseParentEligible(family)) return "ineligible";
  return "eligible";
}

/** A single normalizer for legacy aggregate, linked policies, and opt-in direct policies. */
export function resolveParentHealthPolicies(deductions: DeductionData, family: FamilyData, rules: TaxRuleSet): ParentHealthResolution[] {
  const policies = deductions.parentHealthInsurancePolicies;
  if (policies === undefined) {
    const paid = Math.max(0, deductions.parentHealthInsurance);
    const valid = family.parents.some(parent => legacyParentEligible(parent, family, rules));
    return [{ source: "legacy-aggregate", status: valid ? "eligible" : "ineligible",
      policyId: null, originalParentId: null, paid, share: paid, eligibleShare: valid ? paid : 0 }];
  }
  const profiles = deductions.parentHealthEligibilityProfiles ?? [];
  return policies.filter(p => p.premiumPaidThisYear > 0).map(policy => {
    const premium = Math.max(0, policy.premiumPaidThisYear);
    if (policy.relationshipKey !== undefined && (!Number.isFinite(premium) || premium < 0))
      return { source: "direct" as const, status: "incomplete" as const,
        policyId: policy.id, originalParentId: policy.parentId, paid: 0, share: 0, eligibleShare: 0 };
    const payers = policy.jointPayerCount;
    if (payers === null || !Number.isInteger(payers) || payers < 1) return {
      source: policy.relationshipKey ? "direct" as const : "legacy-linked" as const,
      status: "incomplete" as const, policyId: policy.id, originalParentId: policy.parentId,
      paid: 0, share: 0, eligibleShare: 0 };
    const share = premium / payers;
    if (policy.relationshipKey !== undefined) {
      const profile = profiles.find(p => p.relationshipKey === policy.relationshipKey && p.taxYear === rules.taxYear);
      const duplicates = profiles.filter(p => p.relationshipKey === policy.relationshipKey && p.taxYear === rules.taxYear);
      const duplicatePolicyId = policies.filter(candidate => candidate.id === policy.id).length > 1;
      const status = duplicates.length > 1 || duplicatePolicyId ? "conflict" as const :
        evaluateDirectParentHealth(policy, profile, family, rules);
      return { source: "direct" as const, status, policyId: policy.id, originalParentId: policy.parentId,
        paid: share, share, eligibleShare: status === "eligible" ? share : 0 };
    }
    const parent = family.parents.find(p => p.id === policy.parentId);
    const status = !parent ? "unresolved" as const : legacyParentEligible(parent, family, rules) ? "eligible" as const : "ineligible" as const;
    return { source: "legacy-linked" as const, status, policyId: policy.id,
      originalParentId: policy.parentId, paid: share, share, eligibleShare: status === "eligible" ? share : 0 };
  });
}
