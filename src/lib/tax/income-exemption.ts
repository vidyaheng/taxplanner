import {
  SeniorIncomeExemptionAllocation,
} from "@/types/family";

interface SeniorIncomeBySection {
  section40_1: number;
  section40_2: number;

  section40_3Annuity: number;
  section40_3Rights: number;
}

interface CalculateSeniorIncomeExemptionInput {
  eligible: boolean;
  maxExemption: number;

  income: SeniorIncomeBySection;

  requested:
    SeniorIncomeExemptionAllocation;
}

export interface SeniorIncomeExemptionResult {
  allocation:
    SeniorIncomeExemptionAllocation;

  total: number;

  isCustomAllocation: boolean;
  isValid: boolean;
}

export function calculateSeniorIncomeExemption(
  input: CalculateSeniorIncomeExemptionInput
): SeniorIncomeExemptionResult {
  const {
    eligible,
    maxExemption,
    income,
    requested,
  } = input;

  if (!eligible) {
    return {
      allocation: {
        section40_1: 0,
        section40_2: 0,
        section40_3Annuity: 0,
        section40_3Rights: 0,
      },

      total: 0,

      isCustomAllocation: false,
      isValid: true,
    };
  }

  const requestedTotal =
    Math.max(
      0,
      requested.section40_1
    ) +
    Math.max(
      0,
      requested.section40_2
    ) +
    Math.max(
      0,
      requested.section40_3Annuity
    ) +
    Math.max(
      0,
      requested.section40_3Rights
    );

  const isCustomAllocation =
    requestedTotal > 0;

  /*
   * ค่า 0 ทุกประเภทหมายถึง
   * ยังไม่ได้กำหนด allocation เอง
   *
   * ตอนนี้รักษาพฤติกรรม Engine เดิม:
   * 40(2) ก่อน แล้ว 40(1)
   *
   * 40(3) ยังไม่ถูกนำเข้า Engine
   * จึงยังไม่จัดสรรให้อัตโนมัติ
   */
  if (!isCustomAllocation) {
    let remaining =
      Math.max(
        0,
        maxExemption
      );

    const section40_2 =
      Math.min(
        Math.max(
          0,
          income.section40_2
        ),
        remaining
      );

    remaining -=
      section40_2;

    const section40_1 =
      Math.min(
        Math.max(
          0,
          income.section40_1
        ),
        remaining
      );

    const allocation = {
      section40_1,
      section40_2,

      section40_3Annuity: 0,
      section40_3Rights: 0,
    };

    return {
      allocation,

      total:
        section40_1 +
        section40_2,

      isCustomAllocation: false,
      isValid: true,
    };
  }

  const allocation = {
    section40_1:
      Math.min(
        Math.max(
          0,
          requested.section40_1
        ),
        Math.max(
          0,
          income.section40_1
        )
      ),

    section40_2:
      Math.min(
        Math.max(
          0,
          requested.section40_2
        ),
        Math.max(
          0,
          income.section40_2
        )
      ),

    section40_3Annuity:
      Math.min(
        Math.max(
          0,
          requested.section40_3Annuity
        ),
        Math.max(
          0,
          income.section40_3Annuity
        )
      ),

    section40_3Rights:
      Math.min(
        Math.max(
          0,
          requested.section40_3Rights
        ),
        Math.max(
          0,
          income.section40_3Rights
        )
      ),
  };

  const total =
    allocation.section40_1 +
    allocation.section40_2 +
    allocation.section40_3Annuity +
    allocation.section40_3Rights;

  const isValid =
    requestedTotal <=
      maxExemption &&
    requested.section40_1 <=
      income.section40_1 &&
    requested.section40_2 <=
      income.section40_2 &&
    requested.section40_3Annuity <=
      income.section40_3Annuity &&
    requested.section40_3Rights <=
      income.section40_3Rights;

  return {
    allocation,
    total,
    isCustomAllocation: true,
    isValid,
  };
}