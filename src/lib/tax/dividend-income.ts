import type {
  Section40_4DividendIncomeData,
  Section40_4TaxTreatment,
} from "@/types/income";

export interface Section40_4DividendResult {
  grossDividend: number;

  taxTreatment:
    | Section40_4TaxTreatment
    | null;

  /*
   * เงินปันผลจริงที่เลือกนำมารวมคำนวณ
   */
  includedDividend: number;

  /*
   * เครดิตภาษีเงินปันผลตามมาตรา 47 ทวิ
   * ที่ต้องนำมารวมเป็นเงินได้ด้วย
   */
  dividendTaxCredit: number;

  /*
   * เงินได้พึงประเมินที่เข้า Method 1 / Method 2
   *
   * includedDividend
   * + dividendTaxCredit
   */
  includedAssessableIncome: number;

  /*
   * เงินปันผลที่เลือกเสีย Final Tax 10%
   */
  finalTaxIncome: number;

  /*
   * ภาษีหัก ณ ที่จ่ายที่ใช้เป็นเครดิต
   * เมื่อเลือก include
   */
  creditableWithholdingTax: number;

  /*
   * เครดิตภาษีเงินปันผลที่ใช้หักภาษี
   * เมื่อเลือก include
   */
  creditableDividendTaxCredit: number;

  /*
   * ภาษีหัก ณ ที่จ่ายของรายการ Final
   * เก็บไว้เพื่อแสดงข้อมูลเท่านั้น
   */
  finalWithholdingTax: number;

  isComplete: boolean;
}

export function calculateSection40_4Dividend(
  items: Section40_4DividendIncomeData[]
): Section40_4DividendResult {
  if (items.length === 0) {
    return {
      grossDividend: 0,
      taxTreatment: null,

      includedDividend: 0,
      dividendTaxCredit: 0,
      includedAssessableIncome: 0,

      finalTaxIncome: 0,

      creditableWithholdingTax: 0,
      creditableDividendTaxCredit: 0,

      finalWithholdingTax: 0,

      isComplete: true,
    };
  }

  const methods =
    new Set(
      items.map(
        (item) =>
          item.taxTreatment
      )
    );

  const grossDividend =
    items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.amount
        ),
      0
    );

  /*
   * ไม่อนุญาตให้ Engine คำนวณต่อ
   * หากมี include / final ปะปนกัน
   *
   * เพราะการเลือกนำเงินปันผล
   * มารวมคำนวณต้องพิจารณา
   * ความครบถ้วนของรายการทั้งปี
   */
  if (methods.size !== 1) {
    return {
      grossDividend,
      taxTreatment: null,

      includedDividend: 0,
      dividendTaxCredit: 0,
      includedAssessableIncome: 0,

      finalTaxIncome: 0,

      creditableWithholdingTax: 0,
      creditableDividendTaxCredit: 0,

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

  const totalDividendTaxCredit =
    items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.dividendTaxCredit
        ),
      0
    );

  if (
    taxTreatment === "final"
  ) {
    return {
      grossDividend,
      taxTreatment,

      includedDividend: 0,
      dividendTaxCredit: 0,
      includedAssessableIncome: 0,

      finalTaxIncome:
        grossDividend,

      creditableWithholdingTax: 0,
      creditableDividendTaxCredit: 0,

      finalWithholdingTax:
        totalWithholdingTax,

      isComplete: true,
    };
  }

  const includedAssessableIncome =
    grossDividend +
    totalDividendTaxCredit;

  return {
    grossDividend,
    taxTreatment,

    includedDividend:
      grossDividend,

    dividendTaxCredit:
      totalDividendTaxCredit,

    includedAssessableIncome,

    finalTaxIncome: 0,

    creditableWithholdingTax:
      totalWithholdingTax,

    creditableDividendTaxCredit:
      totalDividendTaxCredit,

    finalWithholdingTax: 0,

    isComplete: true,
  };
}