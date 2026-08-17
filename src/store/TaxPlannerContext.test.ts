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
      "migrate state รุ่นเก่าที่ไม่มี planning เป็น schema version 1 โดยรักษาข้อมูลเดิม",
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
        ).toBe(1);

        expect(
          migrated.income
        ).toEqual({
          monthlySalary:
            100_000,
        });

        expect(
          migrated.deductions
        ).toEqual({
          thaiEsg:
            100_000,
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
      "รักษาค่า planning เดิมและเติม field ที่ขาดเมื่อ migrate เป็น schema version 1",
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
        ).toBe(1);

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
      "ไม่ลด schemaVersion หากข้อมูลใหม่กว่า App เวอร์ชันปัจจุบัน",
      () => {
        const newerState = {
          schemaVersion: 2,

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
        ).toBe(2);

        expect(
          migrated.planning
        ).toEqual(
        newerState.planning
        );
      }
    );
  }
);