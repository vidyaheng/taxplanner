import type { PlanningData, PlanningUsageResult } from "@/types/planning";
import type { TaxResult } from "@/types/taxResult";

/**
 * Presentation-only view model for the existing tax engine/scenario outputs.
 * No tax limits, eligibility conditions or allocation order are reimplemented.
 * "Remaining" is the scenario engine's incremental, single-field capacity,
 * not a second independent statutory allowance that can be added to other rows.
 */
export interface DeductionCapacityView {
  paidCurrent: number;
  allowedCurrent: number;
  conditionalCeiling: number;
  remainingCurrent: number;
  additionalPayment: number;
  additionalAllowed: number;
  netDeductionChange: number;
  /** Non-deductible planned amount returned by the scenario engine. */
  excess: number;
  allowedAfter: number;
  remainingAfter: number;
}

export interface PensionCapacitySplit {
  ordinaryRemaining: number;
  extraRemaining: number;
  totalRemaining: number;
  ordinaryAfterRemaining: number;
  extraAfterRemaining: number;
  totalAfterRemaining: number;
}

function fieldUsage(result: TaxResult, key: keyof PlanningData) {
  switch (key) {
    case "lifeInsurance":
      return result.insuranceDeductions.lifeInsurance;
    case "healthInsuranceSelf":
      return result.insuranceDeductions.healthInsuranceSelf;
    case "pensionInsurance":
      return result.retirementDeductions.pensionInsurance;
    case "rmf":
      return result.retirementDeductions.rmf;
    case "thaiEsg":
      return result.generalDeductions.thaiEsg;
  }
}

export function getDeductionCapacityView(
  key: keyof PlanningData,
  current: TaxResult,
  after: TaxResult,
  currentCapacity: PlanningData,
  afterCapacity: PlanningData,
  planning: PlanningData,
  usage: PlanningUsageResult
): DeductionCapacityView {
  const original = fieldUsage(current, key);
  const projected = fieldUsage(after, key);
  const remainingCurrent = currentCapacity[key];
  return {
    paidCurrent: original.paid,
    allowedCurrent: original.allowed,
    conditionalCeiling: original.allowed + remainingCurrent,
    remainingCurrent,
    additionalPayment: planning[key],
    additionalAllowed: usage[key].allowedAdditional,
    netDeductionChange: usage[key].netDeductionChange,
    excess: usage[key].excess,
    allowedAfter: projected.allowed,
    remainingAfter: afterCapacity[key],
  };
}

/**
 * The engine allocates pension into the ordinary insurance allowance first.
 * Partition only the capacity returned by the scenario engine, using the
 * engine's own "ordinary life room" and "pension used as life" metadata.
 * The "extra" partition already incorporates shared-retirement restrictions.
 */
export function getPensionCapacitySplit(
  current: TaxResult,
  after: TaxResult,
  currentCapacity: PlanningData,
  afterCapacity: PlanningData
): PensionCapacitySplit {
  const currentPension = current.retirementDeductions;
  const afterPension = after.retirementDeductions;
  const ordinaryRemaining = Math.max(
    0,
    currentPension.pensionLifeRoomAvailable -
      currentPension.pensionUsedAsLifeInsurance
  );
  const ordinaryAfterRemaining = Math.max(
    0,
    afterPension.pensionLifeRoomAvailable -
      afterPension.pensionUsedAsLifeInsurance
  );
  return {
    ordinaryRemaining,
    extraRemaining: Math.max(0, currentCapacity.pensionInsurance - ordinaryRemaining),
    totalRemaining: currentCapacity.pensionInsurance,
    ordinaryAfterRemaining,
    extraAfterRemaining: Math.max(0, afterCapacity.pensionInsurance - ordinaryAfterRemaining),
    totalAfterRemaining: afterCapacity.pensionInsurance,
  };
}

/** Keep the primary Planner display to exactly three numbers.
 * "Excess" is the scenario engine's eligible-vs-paid excess, not a
 * subtraction from a standalone headroom which could ignore other plans.
 * "Remaining" is the fresh post-plan engine capacity probe, not an
 * independently implemented tax-cap calculation.
 */
export function getCapacityDisplay(view: DeductionCapacityView):
  { status: "remaining" | "excess"; amount: number } {
  return view.excess > 0
    ? { status: "excess", amount: view.excess }
    : { status: "remaining", amount: view.remainingAfter };
}
