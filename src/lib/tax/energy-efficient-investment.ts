import type {
  Section40_5RentalIncomeData,
  Section40_6ProfessionalIncomeData,
  Section40_7ContractIncomeData,
  Section40_8BusinessIncomeData,
} from "@/types/income";

interface EnergyInvestmentItem {
  energyEfficientInvestment?: number;
}

export interface EnergyEfficientInvestmentSectionResult {
  qualifyingInvestment: number;

  /*
   * สิทธิยกเว้นเพิ่มเติม
   * ไม่รวมค่าใช้จ่ายปกติ
   */
  additionalExemption: number;
}

export interface EnergyEfficientInvestmentResult {
  section40_5:
    EnergyEfficientInvestmentSectionResult;

  section40_6:
    EnergyEfficientInvestmentSectionResult;

  section40_7:
    EnergyEfficientInvestmentSectionResult;

  section40_8:
    EnergyEfficientInvestmentSectionResult;

  totalQualifyingInvestment: number;

  totalAdditionalExemption: number;
}

interface CalculateEnergyEfficientInvestmentInput {
  section40_5:
    Section40_5RentalIncomeData[];

  section40_6:
    Section40_6ProfessionalIncomeData[];

  section40_7:
    Section40_7ContractIncomeData[];

  section40_8:
    Section40_8BusinessIncomeData[];

  exemptionRate: number;
}

function calculateSection(
  items: EnergyInvestmentItem[],
  exemptionRate: number
): EnergyEfficientInvestmentSectionResult {
  const qualifyingInvestment =
    items.reduce(
      (total, item) =>
        total +
        Math.max(
          0,
          item.energyEfficientInvestment ??
            0
        ),
      0
    );

  return {
    qualifyingInvestment,

    additionalExemption:
      qualifyingInvestment *
      Math.max(
        0,
        exemptionRate
      ),
  };
}

export function calculateEnergyEfficientInvestment(
  input:
    CalculateEnergyEfficientInvestmentInput
): EnergyEfficientInvestmentResult {
  const {
    section40_5,
    section40_6,
    section40_7,
    section40_8,
    exemptionRate,
  } = input;

  const result40_5 =
    calculateSection(
      section40_5,
      exemptionRate
    );

  const result40_6 =
    calculateSection(
      section40_6,
      exemptionRate
    );

  const result40_7 =
    calculateSection(
      section40_7,
      exemptionRate
    );

  const result40_8 =
    calculateSection(
      section40_8,
      exemptionRate
    );

  const totalQualifyingInvestment =
    result40_5.qualifyingInvestment +
    result40_6.qualifyingInvestment +
    result40_7.qualifyingInvestment +
    result40_8.qualifyingInvestment;

  const totalAdditionalExemption =
    result40_5.additionalExemption +
    result40_6.additionalExemption +
    result40_7.additionalExemption +
    result40_8.additionalExemption;

  return {
    section40_5: result40_5,
    section40_6: result40_6,
    section40_7: result40_7,
    section40_8: result40_8,

    totalQualifyingInvestment,
    totalAdditionalExemption,
  };
}