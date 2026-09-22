import type {
  Section40_4InterestIncomeData,
  Section40_4TaxTreatment,
} from "@/types/income";

export interface Section40_4InterestResult {
  grossIncome: number;

  taxTreatment:
    | Section40_4TaxTreatment
    | null;

  /*
   * จำนวนที่ต้องนำไปรวมคำนวณภาษีปลายปี
   */
  includedIncome: number;

  /*
   * จำนวนที่เลือกเสียแบบ Final Tax
   * และไม่นำไปรวมคำนวณปลายปี
   */
  finalTaxIncome: number;

  /*
   * ภาษีหัก ณ ที่จ่ายที่ใช้เป็นเครดิตได้
   * เฉพาะรายการที่เลือก include
   */
  creditableWithholdingTax: number;

  /*
   * ภาษีที่ถูกหักสำหรับรายการ Final Tax
   * เก็บไว้เพื่อแสดงข้อมูล
   * แต่ไม่เอาไปเครดิตกับภาษีปลายปี
   */
  finalWithholdingTax: number;

  isComplete: boolean;
}

export function calculateSection40_4Interest(
  items: Section40_4InterestIncomeData[]
): Section40_4InterestResult {
  if (items.length === 0) {
    return {
      grossIncome: 0,
      taxTreatment: null,
      includedIncome: 0,
      finalTaxIncome: 0,
      creditableWithholdingTax: 0,
      finalWithholdingTax: 0,
      isComplete: true,
    };
  }

  const methods = new Set(
    items.map(
      (item) => item.taxTreatment
    )
  );

  const grossIncome = items.reduce(
    (sum, item) =>
      sum + Math.max(0, item.amount),
    0
  );

  /*
   * ไม่ให้ Engine เดาว่าจะรวมดอกเบี้ย
   * เพียงบางรายการ
   */
  if (methods.size !== 1) {
    return {
      grossIncome,
      taxTreatment: null,
      includedIncome: 0,
      finalTaxIncome: 0,
      creditableWithholdingTax: 0,
      finalWithholdingTax: 0,
      isComplete: false,
    };
  }

  const taxTreatment =
    items[0].taxTreatment;

  const totalWithholdingTax =
    items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.taxWithheld
        ),
      0
    );

  if (taxTreatment === "final") {
    return {
      grossIncome,
      taxTreatment,
      includedIncome: 0,
      finalTaxIncome: grossIncome,
      creditableWithholdingTax: 0,
      finalWithholdingTax:
        totalWithholdingTax,
      isComplete: true,
    };
  }

  return {
    grossIncome,
    taxTreatment,
    includedIncome: grossIncome,
    finalTaxIncome: 0,
    creditableWithholdingTax:
      totalWithholdingTax,
    finalWithholdingTax: 0,
    isComplete: true,
  };
}