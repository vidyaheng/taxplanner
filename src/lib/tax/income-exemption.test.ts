import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSeniorIncomeExemption,
} from "./income-exemption";

describe(
  "Senior income exemption allocation",
  () => {
    it(
      "ค่า allocation เป็นศูนย์ทั้งหมดจะรักษาพฤติกรรมเดิม 40(2) ก่อน 40(1)",
      () => {
        const result =
          calculateSeniorIncomeExemption({
            eligible: true,
            maxExemption:
              190_000,

            income: {
              section40_1:
                500_000,
              section40_2:
                100_000,
              section40_3Annuity:
                0,
              section40_3Rights:
                0,
            },

            requested: {
              section40_1: 0,
              section40_2: 0,
              section40_3Annuity: 0,
              section40_3Rights: 0,
            },
          });

        expect(
          result.allocation
        ).toEqual({
          section40_1:
            90_000,
          section40_2:
            100_000,
          section40_3Annuity: 0,
  section40_3Rights: 0,
        });

        expect(
          result.total
        ).toBe(190_000);
      }
    );

    it(
      "รองรับการเลือกจัดสรรสิทธิหลายประเภทโดยรวมไม่เกิน 190,000 บาท",
      () => {
        const result =
          calculateSeniorIncomeExemption({
            eligible: true,
            maxExemption:
              190_000,

            income: {
              section40_1:
                500_000,
              section40_2:
                300_000,
              section40_3Annuity:
                100_000,
              section40_3Rights:
                100_000,
            },

            requested: {
              section40_1:
                50_000,
              section40_2:
                60_000,
              section40_3Annuity:
                40_000,
              section40_3Rights:
                40_000,
            },
          });

        expect(
          result.allocation
        ).toEqual({
          section40_1:
            50_000,
          section40_2:
            60_000,
          section40_3Annuity:
            40_000,
        section40_3Rights:
            40_000,
        });

        expect(
          result.total
        ).toBe(190_000);

        expect(
          result.isValid
        ).toBe(true);
      }
    );

    it(
      "ผู้ไม่มีสิทธิจะไม่ได้รับยกเว้นแม้มี allocation",
      () => {
        const result =
          calculateSeniorIncomeExemption({
            eligible: false,
            maxExemption:
              190_000,

            income: {
              section40_1:
                500_000,
              section40_2:
                300_000,
              section40_3Annuity:
                200_000,
              section40_3Rights:
                0,
            },

            requested: {
              section40_1:
                190_000,
              section40_2: 0,
              section40_3Annuity: 0,
              section40_3Rights: 0,
            },
          });

        expect(
          result.total
        ).toBe(0);

        expect(
          result.allocation
        ).toEqual({
          section40_1: 0,
          section40_2: 0,
          section40_3Annuity: 0,
          section40_3Rights: 0,
        });
      }
    );
  }
);