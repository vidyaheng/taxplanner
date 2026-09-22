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
      "migrate state รุ่นเก่าเป็น schema version ปัจจุบันโดยรักษาข้อมูลเดิม",
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
        ).toBe(14);

        expect(
          migrated.income
        ).toEqual({
          monthlySalary:
            100_000,

          section40_1TaxWithheld: 0,
          section40_2TaxWithheld: 0,

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

          solarRooftop: 0,
          artPurchase: 0,
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
      "รักษาค่า planning เดิมและเติม field ที่ขาดเมื่อ migrate เป็น schema version ปัจจุบัน",
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
        ).toBe(14);

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
        ).toBe(14);

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
        ).toBe(14);

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
        ).toBe(14);

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
        ).toBe(14);

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
        ).toBe(14);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
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
        ).toBe(14);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 50_000,
          section40_2: 60_000,
          section40_3Annuity: 0,
          section40_3Rights: 0,
          section40_4Interest: 0,
          section40_4Dividend: 0,
          section40_5: 0,
          section40_6: 0,
          section40_7: 0,
          section40_8: 0,
        });
      }
    );

    it(
      "migrate schema 6 เป็น 8 โดยเพิ่มการจัดสรรสิทธิผู้สูงอายุสำหรับดอกเบี้ยและเงินปันผล 40(4)",
      () => {
        const oldState = {
          schemaVersion: 6,

          taxYear: 2569,

          family: {
            taxpayerAge65OrOlder: true,
            isThaiTaxResident: true,

            seniorIncomeExemptionAllocation: {
              section40_1: 40_000,
              section40_2: 50_000,
              section40_3Annuity: 60_000,
              section40_3Rights: 40_000,
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(14);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 40_000,
          section40_2: 50_000,
          section40_3Annuity: 60_000,
          section40_3Rights: 40_000,

          /*
          * schema 6 ยังไม่มี 40(4)
          * migration จึงเริ่มค่าใหม่ที่ 0
          */
          section40_4Interest: 0,
          section40_4Dividend: 0,
          section40_5: 0,
          section40_6: 0,
          section40_7: 0,
          section40_8: 0,
        });
      }
    );

    it(
      "migrate schema 7 เป็น 8 โดยเพิ่มการจัดสรรสิทธิผู้สูงอายุสำหรับเงินปันผล 40(4)",
      () => {
        const oldState = {
          schemaVersion: 7,

          taxYear: 2569,

          family: {
            taxpayerAge65OrOlder: true,
            isThaiTaxResident: true,

            seniorIncomeExemptionAllocation: {
              section40_1: 40_000,
              section40_2: 50_000,
              section40_3Annuity: 60_000,
              section40_3Rights: 20_000,
              section40_4Interest: 20_000,
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(14);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 40_000,
          section40_2: 50_000,
          section40_3Annuity: 60_000,
          section40_3Rights: 20_000,
          section40_4Interest: 20_000,

          /*
          * schema 7 ยังไม่มี allocation
          * สำหรับเงินปันผล
          */
          section40_4Dividend: 0,
          section40_5: 0,
          section40_6: 0,
          section40_7: 0,
          section40_8: 0,
        });
      }
    );

    it(
      "migrate schema 11 เป็น 12 โดยเพิ่มการจัดสรรสิทธิผู้สูงอายุสำหรับ 40(8) โดยไม่เดาค่าเดิม",
      () => {
        const oldState = {
          schemaVersion: 11,

          taxYear: 2569,

          family: {
            taxpayerAge65OrOlder: true,
            isThaiTaxResident: true,

            seniorIncomeExemptionAllocation: {
              section40_1: 10_000,
              section40_2: 20_000,
              section40_3Annuity: 30_000,
              section40_3Rights: 40_000,
              section40_4Interest: 10_000,
              section40_4Dividend: 20_000,
              section40_5: 10_000,
              section40_6: 20_000,
              section40_7: 30_000,
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(14);

        expect(
          migrated.family
            ?.seniorIncomeExemptionAllocation
        ).toEqual({
          section40_1: 10_000,
          section40_2: 20_000,
          section40_3Annuity: 30_000,
          section40_3Rights: 40_000,
          section40_4Interest: 10_000,
          section40_4Dividend: 20_000,
          section40_5: 10_000,
          section40_6: 20_000,
          section40_7: 30_000,

          /*
          * schema 11 ยังไม่มี allocation
          * สำหรับรายได้ 40(8)
          *
          * จึงเติม 0 โดยไม่เดาสิทธิให้ผู้ใช้
          */
          section40_8: 0,
        });
      }
    );

    it(
      "migrate schema 12 เป็น 13 โดยเพิ่มภาษีหัก ณ ที่จ่าย 40(1) และ 40(2) โดยไม่เดาค่าเดิม",
      () => {
        const oldState = {
          schemaVersion: 12,

          taxYear: 2569,

          income: {
            monthlySalary: 100_000,
            annualBonus: 20_000,
            otherEmploymentIncome: 0,

            hasOtherIncome: false,

            otherIncome: {
              commission: 0,
              rent: 0,
              professional: 0,
              business: 0,
              investment: 0,
              other: 0,
            },

            detailedOtherIncome: {
              section40_3: [],
              section40_4Interest: [],
              section40_4Dividend: [],
              section40_5: [],
              section40_6: [],
              section40_7: [],
              section40_8: [],
            },
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(14);

        expect(
          migrated.income
            ?.section40_1TaxWithheld
        ).toBe(0);

        expect(
          migrated.income
            ?.section40_2TaxWithheld
        ).toBe(0);

        expect(
          migrated.income
            ?.monthlySalary
        ).toBe(100_000);

        expect(
          migrated.income
            ?.annualBonus
        ).toBe(20_000);
      }
    );

    it(
      "migrate schema 13 เป็น 14 โดยเพิ่ม Solar Rooftop และค่าซื้องานศิลปะโดยไม่เดาค่าเดิม",
      () => {
        const oldState = {
          schemaVersion: 13,

          taxYear: 2569,

          deductions: {
            thaiEsg: 50_000,
          },
        };

        const migrated =
          migrateStoredState(
            oldState as never
          );

        expect(
          migrated.schemaVersion
        ).toBe(14);

        expect(
          migrated.deductions
            ?.thaiEsg
        ).toBe(50_000);

        expect(
          migrated.deductions
            ?.solarRooftop
        ).toBe(0);

        expect(
          migrated.deductions
            ?.artPurchase
        ).toBe(0);

        /*
        * ถ้ามีค่าใหม่อยู่แล้ว
        * migration ต้องรักษาค่านั้นไว้
        * เพราะใช้ ?? 0
        */
        const stateWithExistingValues = {
          schemaVersion: 13,

          taxYear: 2569,

          deductions: {
            solarRooftop: 180_000,
            artPurchase: 70_000,
          },
        };

        const preserved =
          migrateStoredState(
            stateWithExistingValues as never
          );

        expect(
          preserved.deductions
            ?.solarRooftop
        ).toBe(180_000);

        expect(
          preserved.deductions
            ?.artPurchase
        ).toBe(70_000);
      }
    );

    it(
      "ไม่ลด schemaVersion หากข้อมูลใหม่กว่า App เวอร์ชันปัจจุบัน",
      () => {
        const newerState = {
          schemaVersion: 15,

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
        ).toBe(15);

        expect(
          migrated.planning
        ).toEqual(
          newerState.planning
        );
      }
    );
  }
);