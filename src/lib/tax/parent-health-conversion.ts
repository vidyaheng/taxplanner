import type { DeductionData, ParentHealthEligibilityProfile, ParentHealthInsurancePolicyData } from "@/types/deductions";
import type { FamilyData } from "@/types/family";
import type { TaxRuleSet } from "@/tax-rules/types";
import { calculateInsuranceDeductions } from "./deductions";
import { relationshipKeyOf } from "./parent-health-compat";

export type ParentHealthConversionPreview = {
  original: DeductionData;
  proposed: DeductionData;
  policyId: string;
  previousAllowed: number;
  proposedAllowed: number;
  previousExcess: number;
  proposedExcess: number;
};
export type ParentHealthConversionPlan =
  | { ok: true; preview: ParentHealthConversionPreview }
  | { ok: false; reason: string };

export function prepareParentHealthConversion(input: {
  deductions: DeductionData;
  family: FamilyData;
  rules: TaxRuleSet;
  policyId: string;
  profile: ParentHealthEligibilityProfile;
  qualifyingInsuranceConfirmed: boolean | null;
  evidenceConfirmed: boolean | null;
}): ParentHealthConversionPlan {
  const { deductions, family, rules, policyId, profile } = input;
  const policies = deductions.parentHealthInsurancePolicies;
  if (!policies) return { ok: false, reason: "legacy-aggregate-is-not-a-policy" };
  if (policies.filter(p => p.id === policyId).length !== 1) return { ok: false, reason: "policy-id-not-unique" };
  const source = policies.find(p => p.id === policyId)!;
  if (!source.parentId) return { ok: false, reason: "unresolved-parent-id" };
  if (source.relationshipKey !== undefined) return { ok: false, reason: "already-direct" };
  const parents = family.parents.filter(p => p.id === source.parentId);
  if (parents.length !== 1) return { ok: false, reason: "unresolved-or-duplicate-parent-id" };
  const relationship = relationshipKeyOf(parents[0]);
  if (family.parents.filter(p => relationshipKeyOf(p) === relationship).length !== 1)
    return { ok: false, reason: "duplicate-legacy-relationship" };
  if (profile.relationshipKey !== relationship || profile.taxYear !== rules.taxYear)
    return { ok: false, reason: "relationship-or-tax-year-mismatch" };
  const priorProfiles = deductions.parentHealthEligibilityProfiles ?? [];
  if (priorProfiles.some(p => p.relationshipKey === relationship && p.taxYear === rules.taxYear))
    return { ok: false, reason: "profile-already-exists-review-before-replacement" };
  const converted: ParentHealthInsurancePolicyData = {
    ...source, relationshipKey: relationship, conversionStatus: "confirmed",
    qualifyingInsuranceConfirmed: input.qualifyingInsuranceConfirmed,
    evidenceConfirmed: input.evidenceConfirmed
  };
  const proposed: DeductionData = {
    ...deductions,
    parentHealthInsurancePolicies: policies.map(p => p.id === policyId ? converted : p),
    parentHealthEligibilityProfiles: [...priorProfiles, { ...profile }]
  };
  const previous = calculateInsuranceDeductions({ deductions, family, rules }).parentHealthInsurance;
  const next = calculateInsuranceDeductions({ deductions: proposed, family, rules }).parentHealthInsurance;
  if (previous.paid !== next.paid || previous.allowed !== next.allowed || previous.excess !== next.excess)
    return { ok: false, reason: "financial-difference-requires-separate-review" };
  return { ok: true, preview: {
    original: deductions, proposed, policyId,
    previousAllowed: previous.allowed, proposedAllowed: next.allowed,
    previousExcess: previous.excess, proposedExcess: next.excess
  } };
}

/** Explicit confirmation is required; never invoked during hydration. */
export function confirmParentHealthConversion(
  preview: ParentHealthConversionPreview,
  confirmed: boolean,
  current: DeductionData
): { ok: true; next: DeductionData } | { ok: false; reason: string } {
  if (!confirmed) return { ok: false, reason: "user-confirmation-required" };
  if (JSON.stringify(current) !== JSON.stringify(preview.original))
    return { ok: false, reason: "state-conflict" };
  return { ok: true, next: preview.proposed };
}

/** Recovery is conditional: do not revert any intervening user edits. */
export function rollbackParentHealthConversion(
  preview: ParentHealthConversionPreview,
  current: DeductionData
): { ok: true; next: DeductionData } | { ok: false; reason: string } {
  if (JSON.stringify(current) !== JSON.stringify(preview.proposed))
    return { ok: false, reason: "state-conflict" };
  return { ok: true, next: preview.original };
}
