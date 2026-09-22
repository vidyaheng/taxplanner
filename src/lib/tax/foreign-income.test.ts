import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateForeignIncomeTaxability,
} from "./foreign-income";

describe(
  "Foreign-source income taxability",
  () => {
    it(
      "นำเงินได้ตั้งแต่ปี 2567 ที่เกิดขณะเป็น tax resident เข้ามาบางส่วน ให้เสียภาษีเฉพาะยอดที่นำเข้า",
      () => {
        const result =
          calculateForeignIncomeTaxability({
            amount: 500_000,

            filingTaxYear: 2569,

            foreignSource: {
              country: "Vietnam",
              incomeTaxYear: 2568,

              remittedToThailandThisTaxYear:
                200_000,

              foreignIncomeTaxPaid:
                150_000,

              isThaiTaxResidentInIncomeYear:
                true,
            },
          });

        expect(
          result.taxableRemittance
        ).toBe(200_000);

        expect(
          result
            .foreignTaxPaidAttributableToRemittance
        ).toBe(60_000);

        expect(
          result.isTaxable
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "เงินได้ที่เกิดก่อนปี 2567 ไม่อยู่ในบังคับแม้นำเข้าไทยปี 2569",
      () => {
        const result =
          calculateForeignIncomeTaxability({
            amount: 500_000,

            filingTaxYear: 2569,

            foreignSource: {
              country: "USA",
              incomeTaxYear: 2566,

              remittedToThailandThisTaxYear:
                500_000,

              foreignIncomeTaxPaid:
                100_000,

              isThaiTaxResidentInIncomeYear:
                true,
            },
          });

        expect(
          result.taxableRemittance
        ).toBe(0);

        expect(
          result.isTaxable
        ).toBe(false);

        expect(result.reason).toBe(
          "income_before_2567"
        );
      }
    );

    it(
      "ไม่เป็น tax resident ในปีที่เกิดเงินได้ ไม่ต้องนำยอดที่ remit มารวม",
      () => {
        const result =
          calculateForeignIncomeTaxability({
            amount: 300_000,

            filingTaxYear: 2569,

            foreignSource: {
              country: "Japan",
              incomeTaxYear: 2568,

              remittedToThailandThisTaxYear:
                300_000,

              foreignIncomeTaxPaid:
                30_000,

              isThaiTaxResidentInIncomeYear:
                false,
            },
          });

        expect(
          result.taxableRemittance
        ).toBe(0);

        expect(result.reason).toBe(
          "non_resident_in_income_year"
        );
      }
    );

    it(
      "ถ้ายังไม่ทราบ residence ในปีเกิดเงินได้ ให้ผลลัพธ์เป็น incomplete",
      () => {
        const result =
          calculateForeignIncomeTaxability({
            amount: 300_000,

            filingTaxYear: 2569,

            foreignSource: {
              country: "China",
              incomeTaxYear: 2568,

              remittedToThailandThisTaxYear:
                100_000,

              foreignIncomeTaxPaid:
                30_000,

              isThaiTaxResidentInIncomeYear:
                null,
            },
          });

        expect(
          result.taxableRemittance
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(result.reason).toBe(
          "residency_unknown"
        );
      }
    );
  }
);