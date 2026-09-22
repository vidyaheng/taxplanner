import { describe, expect, it } from "vitest";

import {
  calculateSection40_4Dividend,
} from "./dividend-income";

describe(
  "calculateSection40_4Dividend",
  () => {
    it(
      "คืนค่าเริ่มต้นเมื่อไม่มีรายการเงินปันผล",
      () => {
        const result =
          calculateSection40_4Dividend(
            []
          );

        expect(result).toEqual({
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
        });
      }
    );

    it(
      "รวมเงินปันผล เครดิตภาษีเงินปันผล และภาษีหัก ณ ที่จ่ายเมื่อเลือก include",
      () => {
        const result =
          calculateSection40_4Dividend([
            {
              id: "dividend-1",
              amount: 80_000,
              taxWithheld: 8_000,
              dividendTaxCredit: 20_000,
              taxTreatment: "include",
            },
            {
              id: "dividend-2",
              amount: 40_000,
              taxWithheld: 4_000,
              dividendTaxCredit: 10_000,
              taxTreatment: "include",
            },
          ]);

        expect(
          result.grossDividend
        ).toBe(120_000);

        expect(
          result.taxTreatment
        ).toBe("include");

        expect(
          result.includedDividend
        ).toBe(120_000);

        expect(
          result.dividendTaxCredit
        ).toBe(30_000);

        /*
         * เงินปันผล 120,000
         * + เครดิตภาษีเงินปันผล 30,000
         * = เงินได้พึงประเมิน 150,000
         */
        expect(
          result.includedAssessableIncome
        ).toBe(150_000);

        expect(
          result.creditableWithholdingTax
        ).toBe(12_000);

        expect(
          result.creditableDividendTaxCredit
        ).toBe(30_000);

        expect(
          result.finalTaxIncome
        ).toBe(0);

        expect(
          result.finalWithholdingTax
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "เงินปันผลที่เลือก final จะไม่เข้าเงินได้สำหรับคำนวณปลายปีและไม่สร้างเครดิตภาษี",
      () => {
        const result =
          calculateSection40_4Dividend([
            {
              id: "dividend-final",
              amount: 100_000,
              taxWithheld: 10_000,

              /*
               * แม้ข้อมูลต้นทางจะมีค่า
               * หากเลือก final จะไม่นำมาใช้
               * เป็นเครดิตภาษีปลายปี
               */
              dividendTaxCredit: 25_000,

              taxTreatment: "final",
            },
          ]);

        expect(
          result.grossDividend
        ).toBe(100_000);

        expect(
          result.taxTreatment
        ).toBe("final");

        expect(
          result.includedDividend
        ).toBe(0);

        expect(
          result.dividendTaxCredit
        ).toBe(0);

        expect(
          result.includedAssessableIncome
        ).toBe(0);

        expect(
          result.finalTaxIncome
        ).toBe(100_000);

        expect(
          result.creditableWithholdingTax
        ).toBe(0);

        expect(
          result.creditableDividendTaxCredit
        ).toBe(0);

        expect(
          result.finalWithholdingTax
        ).toBe(10_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อมี include และ final ปะปนกัน",
      () => {
        const result =
          calculateSection40_4Dividend([
            {
              id: "dividend-include",
              amount: 80_000,
              taxWithheld: 8_000,
              dividendTaxCredit: 20_000,
              taxTreatment: "include",
            },
            {
              id: "dividend-final",
              amount: 40_000,
              taxWithheld: 4_000,
              dividendTaxCredit: 10_000,
              taxTreatment: "final",
            },
          ]);

        expect(
          result.grossDividend
        ).toBe(120_000);

        expect(
          result.taxTreatment
        ).toBeNull();

        expect(
          result.includedDividend
        ).toBe(0);

        expect(
          result.includedAssessableIncome
        ).toBe(0);

        expect(
          result.creditableWithholdingTax
        ).toBe(0);

        expect(
          result.creditableDividendTaxCredit
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );
  }
);