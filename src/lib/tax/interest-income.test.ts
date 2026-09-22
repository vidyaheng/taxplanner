import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSection40_4Interest,
} from "./interest-income";

describe(
  "Section 40(4)(a) Interest",
  () => {
    it(
      "ไม่มีดอกเบี้ยให้คืนค่าเริ่มต้นและถือว่าข้อมูลครบ",
      () => {
        const result =
          calculateSection40_4Interest(
            []
          );

        expect(
          result.grossIncome
        ).toBe(0);

        expect(
          result.taxTreatment
        ).toBeNull();

        expect(
          result.includedIncome
        ).toBe(0);

        expect(
          result.finalTaxIncome
        ).toBe(0);

        expect(
          result.creditableWithholdingTax
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
      "เลือก include ให้นำดอกเบี้ยทั้งหมดมารวมและใช้ภาษีหัก ณ ที่จ่ายเป็นเครดิต",
      () => {
        const result =
          calculateSection40_4Interest(
            [
              {
                id: "interest-1",
                amount: 100_000,
                taxWithheld: 15_000,
                taxTreatment:
                  "include",
              },
              {
                id: "interest-2",
                amount: 50_000,
                taxWithheld: 7_500,
                taxTreatment:
                  "include",
              },
            ]
          );

        expect(
          result.grossIncome
        ).toBe(150_000);

        expect(
          result.taxTreatment
        ).toBe("include");

        expect(
          result.includedIncome
        ).toBe(150_000);

        expect(
          result.finalTaxIncome
        ).toBe(0);

        expect(
          result.creditableWithholdingTax
        ).toBe(22_500);

        expect(
          result.finalWithholdingTax
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "เลือก final ให้นำดอกเบี้ยออกจากการคำนวณปลายปีและไม่ใช้ภาษีหัก ณ ที่จ่ายเป็นเครดิต",
      () => {
        const result =
          calculateSection40_4Interest(
            [
              {
                id: "interest-1",
                amount: 100_000,
                taxWithheld: 15_000,
                taxTreatment:
                  "final",
              },
              {
                id: "interest-2",
                amount: 50_000,
                taxWithheld: 7_500,
                taxTreatment:
                  "final",
              },
            ]
          );

        expect(
          result.grossIncome
        ).toBe(150_000);

        expect(
          result.taxTreatment
        ).toBe("final");

        expect(
          result.includedIncome
        ).toBe(0);

        expect(
          result.finalTaxIncome
        ).toBe(150_000);

        expect(
          result.creditableWithholdingTax
        ).toBe(0);

        expect(
          result.finalWithholdingTax
        ).toBe(22_500);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ไม่ให้ Engine เดาเมื่อรายการดอกเบี้ยเลือก include และ final ปะปนกัน",
      () => {
        const result =
          calculateSection40_4Interest(
            [
              {
                id: "interest-include",
                amount: 100_000,
                taxWithheld: 15_000,
                taxTreatment:
                  "include",
              },
              {
                id: "interest-final",
                amount: 50_000,
                taxWithheld: 7_500,
                taxTreatment:
                  "final",
              },
            ]
          );

        expect(
          result.grossIncome
        ).toBe(150_000);

        expect(
          result.taxTreatment
        ).toBeNull();

        expect(
          result.includedIncome
        ).toBe(0);

        expect(
          result.finalTaxIncome
        ).toBe(0);

        expect(
          result.creditableWithholdingTax
        ).toBe(0);

        expect(
          result.finalWithholdingTax
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    
  }
);