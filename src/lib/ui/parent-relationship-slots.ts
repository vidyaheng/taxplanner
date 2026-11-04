import type { ParentData, ParentOwner, ParentRelation } from "@/types/family";

export type ParentSlot = Pick<ParentData, "owner" | "relation">;

export const PARENT_RELATIONSHIP_SLOTS: ReadonlyArray<ParentSlot & { label: string }> = [
  { owner: "taxpayer", relation: "father", label: "บิดาของผู้เสียภาษี" },
  { owner: "taxpayer", relation: "mother", label: "มารดาของผู้เสียภาษี" },
  { owner: "spouse", relation: "father", label: "บิดาของคู่สมรส" },
  { owner: "spouse", relation: "mother", label: "มารดาของคู่สมรส" },
];

export function parentSlotKey(slot: ParentSlot): string {
  return `${slot.owner}:${slot.relation}`;
}

export function getParentSlotLabel(slot: ParentSlot): string {
  return PARENT_RELATIONSHIP_SLOTS.find(
    (candidate) => candidate.owner === slot.owner && candidate.relation === slot.relation,
  )?.label ?? "ความสัมพันธ์ที่ไม่รู้จัก";
}

export function getFirstUnusedParentSlot(parents: readonly ParentData[]): ParentSlot | null {
  const occupied = new Set(parents.map(parentSlotKey));
  const candidate = PARENT_RELATIONSHIP_SLOTS.find(
    (slot) => !occupied.has(parentSlotKey(slot)),
  );
  return candidate ? { owner: candidate.owner, relation: candidate.relation } : null;
}

/** Active record IDs, not indexes. Legacy duplicates are deliberately left intact. */
export function getDuplicateParentSlotKeys(parents: readonly ParentData[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const parent of parents) {
    const key = parentSlotKey(parent);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

/** Prevent new duplicate owner/relation pairs without changing any stored parent. */
export function canAssignParentSlot(
  parents: readonly ParentData[],
  recordId: string,
  candidate: ParentSlot,
): boolean {
  return PARENT_RELATIONSHIP_SLOTS.some(
    (slot) => slot.owner === candidate.owner && slot.relation === candidate.relation,
  ) && !parents.some(
    (parent) => parent.id !== recordId && parentSlotKey(parent) === parentSlotKey(candidate),
  );
}

export function slotFromKey(value: string): ParentSlot | null {
  const slot = PARENT_RELATIONSHIP_SLOTS.find((candidate) => parentSlotKey(candidate) === value);
  return slot ? { owner: slot.owner as ParentOwner, relation: slot.relation as ParentRelation } : null;
}
