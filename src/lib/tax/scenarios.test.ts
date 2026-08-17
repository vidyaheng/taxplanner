import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyPlanningToDeductions,
  calculatePlanningUsage,
  calculatePlanningUsageDetails,
  calculatePlanningCapacity,
} from "./scenarios";

import {
  calculateTax,
} from "./engine";

import {
  DeductionData,
} from "@/types/deductions";

function currentDeductions():
  DeductionData {
  return {
    lifeInsurance: 70_000,
    healthInsuranceSelf: 0,
    spouseLifeInsurance: 0,
    parentHealthInsurance: 0,
    pensionInsurance: 0,

    providentFund: 0,
    gpf: 0,
    privateTeacherFund: 0,
    nsf: 0,
    rmf: 100_000,

    thaiEsg: 50_000,
    thaiEsgxCarryForward: 0,

    socialSecurity: 0,
    homeLoanInterest: 0,
    pregnancyAndChildbirth: 0,
    socialEnterpriseInvestment: 0,

    politicalDonation: 0,
    specialDonation: 0,
    generalDonation: 0,
  };
}

describe(
  "Tax planning scenarios",
  () => {
    it(
      "รองรับ state เก่าที่ไม่มี planning โดยใช้ deduction เดิมได้",
      () => {
        const current =
          currentDeductions();

        const scenario =
          applyPlanningToDeductions(
            current,
            undefined
          );

        expect(scenario).toEqual(
          current
        );

        expect(scenario).not.toBe(
          current
        );
      }
    );

    it(
      "คำนวณ validation case Thai ESG เดิม 100,000 และวางแผน RMF เพิ่ม 100,000",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,
          rmf: 0,
          thaiEsg: 100_000,
        };

        const income = {
          monthlySalary: 100_000,
          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "married" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: true,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const currentResult =
          calculateTax({
            taxYear: 2569,
            income,
            family,
            deductions: current,
          });

        const plannedDeductions =
          applyPlanningToDeductions(
            current,
            {
              lifeInsurance: 0,
              healthInsuranceSelf: 0,
              pensionInsurance: 0,
              rmf: 100_000,
              thaiEsg: 0,
            }
          );

        const plannedResult =
          calculateTax({
            taxYear: 2569,
            income,
            family,
            deductions:
              plannedDeductions,
          });

        expect(
          currentResult
            .incomeAfterFamilyAllowances
        ).toBe(980_000);

        expect(
          currentResult.taxableIncome
        ).toBe(880_000);

        expect(
          currentResult.taxBeforeCredits
        ).toBe(91_000);

        expect(
          plannedResult.taxableIncome
        ).toBe(780_000);

        expect(
          plannedResult.taxBeforeCredits
        ).toBe(71_000);

        expect(
          currentResult.taxBeforeCredits -
            plannedResult.taxBeforeCredits
        ).toBe(20_000);

        /*
         * Current deduction ต้องไม่ถูกแก้
         * จาก What-if scenario
         */
        expect(current.rmf).toBe(0);

        expect(
          current.thaiEsg
        ).toBe(100_000);

        expect(
          plannedDeductions.rmf
        ).toBe(100_000);
      }
    );

    it(
      "คำนวณสิทธิเพิ่มจริงเมื่อ life insurance เบียด health insurance ในเพดานร่วม",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,
          healthInsuranceSelf:
            25_000,

          rmf: 0,
          thaiEsg: 0,
        };

        const income = {
          monthlySalary: 100_000,
          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance:
            100_000,

          healthInsuranceSelf: 0,
          pensionInsurance: 0,
          rmf: 0,
          thaiEsg: 0,
        };

        const usage =
          calculatePlanningUsage(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
                .totalCurrentDeductions
          );

        /*
        * เดิม Health ใช้สิทธิ 25,000
        *
        * เมื่อเพิ่ม Life 100,000
        * Life ไปใช้เพดานรวมแทน Health
        *
        * ค่าลดหย่อนรวมจึงเพิ่มจริง
        * เพียง 75,000
        */
        expect(
          usage.lifeInsurance
        ).toBe(75_000);

        expect(
          usage.healthInsuranceSelf
        ).toBe(0);

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details.lifeInsurance
            .planned
        ).toBe(100_000);

        expect(
          details.lifeInsurance
            .allowedAdditional
        ).toBe(75_000);

        expect(
          details.lifeInsurance
            .excess
        ).toBe(25_000);

        expect(
          details.lifeInsurance
            .reasons
        ).toEqual([
          {
            type:
              "combined_limit",

            title:
              "ติดเพดานประกันชีวิตและสุขภาพรวม",

            limit: 100_000,
            used: 25_000,
            remaining: 75_000,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลทั้งเพดาน health และเพดาน life + health เมื่อชนพร้อมกัน",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 90_000,
          healthInsuranceSelf: 0,

          pensionInsurance: 0,
          rmf: 0,
          thaiEsg: 0,
        };

        const income = {
          monthlySalary: 100_000,
          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,

          healthInsuranceSelf:
            30_000,

          pensionInsurance: 0,
          rmf: 0,
          thaiEsg: 0,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details
            .healthInsuranceSelf
            .planned
        ).toBe(30_000);

        expect(
          details
            .healthInsuranceSelf
            .allowedAdditional
        ).toBe(10_000);

        expect(
          details
            .healthInsuranceSelf
            .excess
        ).toBe(20_000);

        expect(
          details
            .healthInsuranceSelf
            .reasons
        ).toEqual([
          {
            type:
              "individual_limit",

            title:
              "ติดเพดานประกันสุขภาพตนเอง",

            limit: 25_000,
            used: 0,
            remaining: 25_000,
          },

          {
            type:
              "combined_limit",

            title:
              "ติดเพดานประกันชีวิตและสุขภาพรวม",

            limit: 100_000,
            used: 90_000,
            remaining: 10_000,
          },
        ]);
      }
    );

    it(
      "คำนวณสิทธิเพิ่มจริงเมื่อ pension insurance เบียด RMF ใน retirement shared ceiling",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,
          healthInsuranceSelf: 0,

          pensionInsurance: 0,
          rmf: 500_000,

          thaiEsg: 0,
        };

        const income = {
          monthlySalary: 200_000,
          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,

          pensionInsurance:
            200_000,

          rmf: 0,
          thaiEsg: 0,
        };

        const usage =
          calculatePlanningUsage(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
                .totalCurrentDeductions
          );

        /*
        * RMF เดิมใช้ shared ceiling อยู่เต็ม
        *
        * Pension ใหม่ 200,000:
        * - 100,000 ใช้ ordinary life room
        * - อีก 100,000 เข้า retirement group
        *   และไปเบียด RMF เดิม
        *
        * ดังนั้น deduction รวมเพิ่มจริง
        * เพียง 100,000
        */
        expect(
          usage.pensionInsurance
        ).toBe(100_000);

        expect(
          usage.rmf
        ).toBe(0);

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details
            .pensionInsurance
            .planned
        ).toBe(200_000);

        expect(
          details
            .pensionInsurance
            .allowedAdditional
        ).toBe(100_000);

        expect(
          details
            .pensionInsurance
            .excess
        ).toBe(100_000);

        expect(
          details
            .pensionInsurance
            .reasons
        ).toEqual([
          {
            type:
              "shared_retirement_limit",

            title:
              "ติดเพดานกลุ่มเกษียณรวม",

            limit: 500_000,
            used: 500_000,
            remaining: 0,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลเมื่อ pension ติดเพดาน 15% ของรายได้",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance:
            100_000,

          healthInsuranceSelf: 0,

          pensionInsurance:
            100_000,

          rmf: 0,
          thaiEsg: 0,
        };

        const income = {
          monthlySalary:
            100_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,

          pensionInsurance:
            200_000,

          rmf: 0,
          thaiEsg: 0,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details
            .pensionInsurance
            .planned
        ).toBe(200_000);

        expect(
          details
            .pensionInsurance
            .allowedAdditional
        ).toBe(80_000);

        expect(
          details
            .pensionInsurance
            .excess
        ).toBe(120_000);

        expect(
          details
            .pensionInsurance
            .reasons
        ).toEqual([
          {
            type:
              "income_percentage_limit",

            title:
              "ติดเพดานประกันบำนาญตามรายได้",

            limit: 180_000,
            used: 100_000,
            remaining: 80_000,

            incomeRate: 0.15,

            assessableIncome:
              1_200_000,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลเมื่อ RMF ติดเพดาน 30% ของรายได้",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,
          healthInsuranceSelf: 0,

          pensionInsurance: 0,

          rmf:
            100_000,

          thaiEsg: 0,
        };

        const income = {
          monthlySalary:
            100_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,

          rmf:
            400_000,

          thaiEsg: 0,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details.rmf.planned
        ).toBe(400_000);

        expect(
          details.rmf
            .allowedAdditional
        ).toBe(260_000);

        expect(
          details.rmf.excess
        ).toBe(140_000);

        expect(
          details.rmf.reasons
        ).toEqual([
          {
            type:
              "income_percentage_limit",

            title:
              "ติดเพดาน RMF ตามรายได้",

            limit:
              360_000,

            used:
              100_000,

            remaining:
              260_000,

            incomeRate:
              0.30,

            assessableIncome:
              1_200_000,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลเมื่อ RMF ติดเพดานกลุ่มเกษียณรวม",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,

          /*
          * PVD ใช้ shared ceiling
          * ไปแล้ว 450,000
          */
          providentFund:
            450_000,

          gpf: 0,
          privateTeacherFund: 0,
          nsf: 0,

          rmf: 0,

          thaiEsg: 0,
        };

        const income = {
          /*
          * รายได้สูงพอให้:
          *
          * PVD 450,000
          * ผ่านเพดาน 15% ของค่าจ้าง
          *
          * และ RMF 100,000
          * ยังไม่ติด 30% ของรายได้
          */
          monthlySalary:
            300_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,

          rmf:
            100_000,

          thaiEsg: 0,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details.rmf.planned
        ).toBe(100_000);

        expect(
          details.rmf
            .allowedAdditional
        ).toBe(50_000);

        expect(
          details.rmf.excess
        ).toBe(50_000);

        expect(
          details.rmf.reasons
        ).toEqual([
          {
            type:
              "shared_retirement_limit",

            title:
              "ติดเพดานกลุ่มเกษียณรวม",

            limit:
              500_000,

            used:
              450_000,

            remaining:
              50_000,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลเมื่อ Thai ESG ติดเพดาน 30% ของรายได้",
      () => {
        const current = {
          ...currentDeductions(),

          thaiEsg:
            100_000,
        };

        const income = {
          monthlySalary:
            50_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,
          rmf: 0,

          thaiEsg:
            200_000,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details.thaiEsg.planned
        ).toBe(200_000);

        expect(
          details.thaiEsg
            .allowedAdditional
        ).toBe(80_000);

        expect(
          details.thaiEsg.excess
        ).toBe(120_000);

        expect(
          details.thaiEsg.reasons
        ).toEqual([
          {
            type:
              "income_percentage_limit",

            title:
              "ติดเพดาน Thai ESG ตามรายได้",

            limit:
              180_000,

            used:
              100_000,

            remaining:
              80_000,

            incomeRate:
              0.30,

            assessableIncome:
              600_000,
          },
        ]);
      }
    );

    it(
      "แสดงเหตุผลเมื่อ Thai ESG ติดเพดานสูงสุด",
      () => {
        const current = {
          ...currentDeductions(),

          thaiEsg:
            100_000,
        };

        const income = {
          monthlySalary:
            100_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const planning = {
          lifeInsurance: 0,
          healthInsuranceSelf: 0,
          pensionInsurance: 0,
          rmf: 0,

          thaiEsg:
            300_000,
        };

        const details =
          calculatePlanningUsageDetails(
            current,
            planning,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          details.thaiEsg
            .allowedAdditional
        ).toBe(200_000);

        expect(
          details.thaiEsg.excess
        ).toBe(100_000);

        expect(
          details.thaiEsg.reasons
        ).toEqual([
          {
            type:
              "individual_limit",

            title:
              "ติดเพดาน Thai ESG สูงสุด",

            limit:
              300_000,

            used:
              100_000,

            remaining:
              200_000,
          },
        ]);
      }
    );

    it(
      "รวม deduction ปัจจุบันกับแผนใหม่โดยไม่แก้ข้อมูลเดิม",
      () => {
        const current =
          currentDeductions();

        const scenario =
          applyPlanningToDeductions(
            current,
            {
              lifeInsurance:
                50_000,

              healthInsuranceSelf:
                25_000,

              pensionInsurance:
                100_000,

              rmf:
                150_000,

              thaiEsg:
                100_000,
            }
          );

        expect(
          scenario.lifeInsurance
        ).toBe(120_000);

        expect(
          scenario.healthInsuranceSelf
        ).toBe(25_000);

        expect(
          scenario.pensionInsurance
        ).toBe(100_000);

        expect(
          scenario.rmf
        ).toBe(250_000);

        expect(
          scenario.thaiEsg
        ).toBe(150_000);

        /*
         * original ต้องไม่ถูก mutate
         */
        expect(
          current.lifeInsurance
        ).toBe(70_000);

        expect(
          current.rmf
        ).toBe(100_000);
      }
    );

    it(
      "คำนวณสิทธิคงเหลือของ life insurance โดยคำนึงถึง health ที่มีอยู่แล้ว",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance: 0,

          healthInsuranceSelf:
            25_000,
        };

        const income = {
          monthlySalary:
            100_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const capacity =
          calculatePlanningCapacity(
            current,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          capacity.lifeInsurance
        ).toBe(75_000);
      }
    );

    it(
      "คำนวณสิทธิคงเหลือของ pension จากเพดานตามรายได้",
      () => {
        const current = {
          ...currentDeductions(),

          lifeInsurance:
            100_000,

          pensionInsurance:
            100_000,

          rmf: 0,
          thaiEsg: 0,
        };

        const income = {
          monthlySalary:
            100_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const capacity =
          calculatePlanningCapacity(
            current,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          capacity.pensionInsurance
        ).toBe(80_000);
      }
    );

    it(
      "คำนวณสิทธิคงเหลือของ RMF จาก retirement shared ceiling",
      () => {
        const current = {
          ...currentDeductions(),

          providentFund:
            450_000,

          pensionInsurance: 0,
          rmf: 0,
          thaiEsg: 0,
        };

        const income = {
          monthlySalary:
            300_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const capacity =
          calculatePlanningCapacity(
            current,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          capacity.rmf
        ).toBe(50_000);
      }
    );

    it(
      "คำนวณสิทธิคงเหลือของ Thai ESG จากเพดานตามรายได้",
      () => {
        const current = {
          ...currentDeductions(),

          thaiEsg:
            100_000,
        };

        const income = {
          monthlySalary:
            50_000,

          annualBonus: 0,
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
        };

        const family = {
          taxpayerBirthYearBE: null,
          isThaiNational: null,

          maritalStatus:
            "single" as const,

          spouseHasIncome: false,
          marriedFullTaxYear: false,

          children: [],
          parents: [],
          disabledDependents: [],
          pregnancies: [],
        };

        const capacity =
          calculatePlanningCapacity(
            current,
            (deductions) =>
              calculateTax({
                taxYear: 2569,
                income,
                family,
                deductions,
              })
          );

        expect(
          capacity.thaiEsg
        ).toBe(80_000);
      }
    );
  }
);