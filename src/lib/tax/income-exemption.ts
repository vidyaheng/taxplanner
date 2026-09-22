import type {
  SeniorIncomeExemptionAllocation,
} from "@/types/family";

interface SeniorIncomeBySection {
  section40_1: number;
  section40_2: number;

  section40_3Annuity: number;
  section40_3Rights: number;

  section40_4Interest: number;
  section40_4Dividend: number;

  section40_5: number;
  section40_6: number;
  section40_7: number;

  /*
  * optional เพื่อให้ caller/test เดิม
  * ที่ยังไม่ส่ง 40(8) ใช้งานต่อได้
  */
  section40_8?: number;
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

  const requestedSection40_7 =
    Math.max(
      0,
      requested.section40_7 ?? 0
    );

  const incomeSection40_7 =
    Math.max(
      0,
      income.section40_7 ?? 0
    );

  const requestedSection40_8 =
  Math.max(
    0,
    requested.section40_8 ?? 0
  );

  const incomeSection40_8 =
    Math.max(
      0,
      income.section40_8 ?? 0
    );

  if (!eligible) {
    return {
      allocation: {
        section40_1: 0,
        section40_2: 0,

        section40_3Annuity: 0,
        section40_3Rights: 0,

        section40_4Interest: 0,
        section40_4Dividend: 0,

        section40_5: 0,
        section40_6: 0,
        section40_7: 0,
        section40_8: 0,
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
    ) +
    Math.max(
      0,
      requested.section40_4Interest
    ) +
    Math.max(
      0,
      requested.section40_4Dividend
    ) +
    Math.max(
      0,
      requested.section40_5
    ) +
    Math.max(
      0,
      requested.section40_6
    ) +
    requestedSection40_7 +
    requestedSection40_8;

  const isCustomAllocation =
    requestedTotal > 0;

  /*
   * ค่า 0 ทุกประเภทหมายถึง
   * ยังไม่ได้กำหนด allocation เอง
   *
   * รักษาพฤติกรรมเดิม:
   * 40(2) ก่อน แล้ว 40(1)
   *
   * 40(3) และ 40(4)
   * จะไม่ถูกจัดสรรให้อัตโนมัติ
   * เพื่อไม่ให้ผลคำนวณเดิมเปลี่ยน
   * โดยไม่ตั้งใจ
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

      section40_4Interest: 0,
      section40_4Dividend: 0,

      section40_5: 0,
      section40_6: 0,
      section40_7: 0,
      section40_8: 0,
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

    section40_4Interest:
      Math.min(
        Math.max(
          0,
          requested.section40_4Interest
        ),
        Math.max(
          0,
          income.section40_4Interest
        )
      ),

    section40_4Dividend:
      Math.min(
        Math.max(
          0,
          requested.section40_4Dividend
        ),
        Math.max(
          0,
          income.section40_4Dividend
        )
      ),

    section40_5:
      Math.min(
        Math.max(
          0,
          requested.section40_5
        ),
        Math.max(
          0,
          income.section40_5
        )
      ),
    
    section40_6:
      Math.min(
        Math.max(
          0,
          requested.section40_6
        ),
        Math.max(
          0,
          income.section40_6
        )
      ),
    section40_7:
      Math.min(
        requestedSection40_7,
        incomeSection40_7
      ),
    section40_8:
      Math.min(
        requestedSection40_8,
        incomeSection40_8
      ),
  };

  const total =
    allocation.section40_1 +
    allocation.section40_2 +
    allocation.section40_3Annuity +
    allocation.section40_3Rights +
    allocation.section40_4Interest +
    allocation.section40_4Dividend +
    allocation.section40_5 +
    allocation.section40_6 +
    allocation.section40_7 +
    (allocation.section40_8 ?? 0);

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
      income.section40_3Rights &&
    requested.section40_4Interest <=
      income.section40_4Interest &&
    requested.section40_4Dividend <=
      income.section40_4Dividend &&
    requested.section40_5 <=
      income.section40_5 &&
    requested.section40_6 <=
      income.section40_6 &&
    requestedSection40_7 <=
      incomeSection40_7 &&
    requestedSection40_8 <=
      incomeSection40_8;

  return {
    allocation,
    total,
    isCustomAllocation: true,
    isValid,
  };
}