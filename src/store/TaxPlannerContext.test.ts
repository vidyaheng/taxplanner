import {
  describe,
  expect,
  it,
} from "vitest";

import {
  migrateStoredState,
} from "./TaxPlannerContext";


describe(
  "TaxPlanner localStorage migration",
  () => {
    it(
      "migrate state รุ่นเก่าที่ไม่มี planning เป็น schema version 3 โดยรักษาข้อมูลเดิม",
      () => {
        const oldState = {
          taxYear: 2569,

          income: {
            monthlySalary:
              100_000,
          },

          deductions: {
            thaiEsg:
              100_000,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.income
        ).toEqual({
          monthlySalary:
            100_000,

          detailedOtherIncome: {
            section40_3: [],
            section40_4Interest: [],
            section40_4Dividend: [],
            section40_5: [],
            section40_6: [],
            section40_7: [],
            section40_8: [],
          },
        });

        expect(
          migrated.deductions
        ).toEqual({
          thaiEsg:
            100_000,

          ltfToThaiEsgxTransferAmount:
            0,
        });

        expect(
          migrated.planning
        ).toEqual({
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,
          rmf: 0,
          thaiEsg: 0,
        });
      }
    );

    it(
      "รักษาค่า planning เดิมและเติม field ที่ขาดเมื่อ migrate เป็น schema version 3",
      () => {
        const oldState = {
          taxYear: 2569,

          planning: {
            rmf: 100_000,
            thaiEsg: 50_000,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.planning
        ).toEqual({
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,

          rmf: 100_000,
          thaiEsg: 50_000,
        });
      }
    );

    it(
      "ไม่ตีความสิทธิ Thai ESGX เดิมเป็นยอด LTF ที่สับเปลี่ยนเมื่อ migrate state เก่า",
      () => {
        const oldState = {
          schemaVersion: 1,

          taxYear: 2569,

          deductions: {
            thaiEsg:
              50_000,

            rmf:
              100_000,

            thaiEsgxCarryForward:
              20_000,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.deductions
            ?.thaiEsg
        ).toBe(50_000);

        expect(
          migrated.deductions
            ?.rmf
        ).toBe(100_000);

        expect(
          migrated.deductions
            ?.ltfToThaiEsgxTransferAmount
        ).toBe(0);

        expect(
          "thaiEsgxCarryForward" in
            (migrated.deductions ?? {})
        ).toBe(false);
      }
    );

    it(
      "migrate ปีเกิด 2504 เป็นอายุ 65 ปีขึ้นไปในปีภาษี 2569",
      () => {
        const oldState = {
          schemaVersion: 2,

          taxYear: 2569,

          family: {
            taxpayerBirthYearBE:
              2504,

            isThaiNational:
              true,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.family
            ?.taxpayerAge65OrOlder
        ).toBe(true);

        expect(
          migrated.family
            ?.isThaiTaxResident
        ).toBe(null);

        expect(
          "taxpayerBirthYearBE" in
            (migrated.family ?? {})
        ).toBe(false);
      }
    );

    it(
      "migrate ปีเกิด 2505 เป็นอายุต่ำกว่า 65 ปีในปีภาษี 2569",
      () => {
        const oldState = {
          schemaVersion: 2,

          taxYear: 2569,

          family: {
            taxpayerBirthYearBE:
              2505,

            isThaiNational:
              true,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.family
            ?.taxpayerAge65OrOlder
        ).toBe(false);

        expect(
          migrated.family
            ?.isThaiTaxResident
        ).toBe(null);
      }
    );

    it(
      "migrate schema 3 เป็น 4 โดยเพิ่ม detailedOtherIncome และไม่ตีความรายได้อื่นเดิม",
      () => {
        const oldState = {
          schemaVersion: 3,

          taxYear: 2569,

          income: {
            monthlySalary:
              100_000,

            annualBonus: 0,

            otherEmploymentIncome: 0,

            hasOtherIncome: true,

            otherIncome: {
              commission:
                20_000,

              rent:
                120_000,

              professional: 0,
              business: 0,
              investment: 0,
              other: 0,
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.income
            ?.otherIncome.rent
        ).toBe(120_000);

        expect(
          migrated.income
            ?.otherIncome.commission
        ).toBe(20_000);

        expect(
          migrated.income
            ?.detailedOtherIncome
        ).toEqual({
          section40_3: [],
          section40_4Interest: [],
          section40_4Dividend: [],
          section40_5: [],
          section40_6: [],
          section40_7: [],
          section40_8: [],
        });
      }
    );

    it(
      "migrate schema 4 เป็น 5 โดยเพิ่มการจัดสรรสิทธิยกเว้นเงินได้ผู้สูงอายุ",
      () => {
        const oldState = {
          schemaVersion: 4,

          taxYear: 2569,

          family: {
            taxpayerAge65OrOlder: true,
            isThaiTaxResident: true,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 0,
          section40_2: 0,
          section40_3Annuity: 0,
          section40_3Rights: 0,
        });
      }
    );

    it(
      "migrate schema 5 เป็น 6 โดยแยก 40(3) ของสิทธิผู้สูงอายุโดยไม่เดาประเภทรายได้",
      () => {
        const oldState = {
          schemaVersion: 5,

          taxYear: 2569,

          family: {
            taxpayerAge65OrOlder: true,
            isThaiTaxResident: true,

            seniorIncomeExemptionAllocation: {
              section40_1: 50_000,
              section40_2: 60_000,
              section40_3: 80_000,
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(6);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 50_000,
          section40_2: 60_000,
          section40_3Annuity: 0,
          section40_3Rights: 0,
        });
      }
    );

    it(
      "ไม่ลด schemaVersion หากข้อมูลใหม่กว่า App เวอร์ชันปัจจุบัน",
      () => {
        const newerState = {
          schemaVersion: 7,

          taxYear: 2569,

          planning: {
            lifeInsurance: 10_000,
            healthInsuranceSelf: 0,
            pensionInsurance: 0,
            rmf: 0,
            thaiEsg: 0,
          },
        };

        const migrated =
          migrateStoredState(
            newerState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(7);

        expect(
          migrated.planning
        ).toEqual(
          newerState.planning
        );
      }
    );
  }
);