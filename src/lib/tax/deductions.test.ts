import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateGeneralDeductions,
  calculateInsuranceDeductions,
  calculateRetirementDeductions,
} from "./deductions";

import {
  TAX_RULES_2569,
} from "@/tax-rules/2569";

import {
  DeductionData,
} from "@/types/deductions";

import {
  FamilyData,
} from "@/types/family";

function deductions(
  values: Partial<DeductionData> = {}
): DeductionData {
  return {
    lifeInsurance: 0,
    healthInsuranceSelf: 0,
    spouseLifeInsurance: 0,
    parentHealthInsurance: 0,
    pensionInsurance: 0,

    providentFund: 0,
    gpf: 0,
    privateTeacherFund: 0,
    nsf: 0,
    rmf: 0,

    thaiEsg: 0,
    thaiEsgxCarryForward: 0,

    socialSecurity: 0,
    homeLoanInterest: 0,
    pregnancyAndChildbirth: 0,
    socialEnterpriseInvestment: 0,

    politicalDonation: 0,
    specialDonation: 0,
    generalDonation: 0,

    ...values,
  };
}

function family(
  values: Partial<FamilyData> = {}
): FamilyData {
  return {
    taxpayerBirthYearBE: null,

    isThaiNational: null,

    maritalStatus: "single",
    spouseHasIncome: false,
    marriedFullTaxYear: false,

    children: [],
    parents: [],
    disabledDependents: [],

    pregnancies: [],

    ...values,
  };
}

describe(
  "Insurance deductions 2569",
  () => {
    it(
      "life 90,000 + health 25,000 ใช้สิทธิรวม 100,000",
      () => {
        const result =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                lifeInsurance:
                  90_000,
                healthInsuranceSelf:
                  25_000,
              }),

            family: family(),

            rules:
              TAX_RULES_2569,
          });

        expect(
          result.totalPaid
        ).toBe(115_000);

        expect(
          result.totalAllowed
        ).toBe(100_000);

        expect(
          result.totalExcess
        ).toBe(15_000);

        expect(
          result.limits
            .lifeAndHealthCombinedMax
        ).toBe(100_000);

        expect(
          result.limits
            .healthSelfMax
        ).toBe(25_000);
      }
    );

    it(
      "health insurance จำกัด 25,000",
      () => {
        const result =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                healthInsuranceSelf:
                  50_000,
              }),

            family: family(),

            rules:
              TAX_RULES_2569,
          });

        expect(
          result.healthInsuranceSelf
            .allowed
        ).toBe(25_000);
      }
    );

    it(
      "life insurance รวมสูงสุด 100,000",
      () => {
        const result =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                lifeInsurance:
                  200_000,
              }),

            family: family(),

            rules:
              TAX_RULES_2569,
          });

        expect(
          result.lifeInsurance
            .allowed
        ).toBe(100_000);
      }
    );

    it(
      "spouse life insurance ใช้ได้สูงสุด 10,000 เมื่อเข้าเงื่อนไข",
      () => {
        const result =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                spouseLifeInsurance:
                  20_000,
              }),

            family: family({
              maritalStatus:
                "married",

              spouseHasIncome:
                false,

              marriedFullTaxYear:
                true,
            }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          result.spouseLifeInsurance
            .allowed
        ).toBe(10_000);
      }
    );

    it(
      "ไม่ใช้สิทธิ spouse life ถ้าไม่ได้สมรสตลอดปี",
      () => {
        const result =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                spouseLifeInsurance:
                  10_000,
              }),

            family: family({
              maritalStatus:
                "married",

              spouseHasIncome:
                false,

              marriedFullTaxYear:
                false,
            }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          result.spouseLifeInsurance
            .allowed
        ).toBe(0);
      }
    );
  }
);

describe(
  "Retirement deductions 2569",
  () => {
    it(
      "ส่ง pension limit metadata จาก Tax Engine",
      () => {
        const result =
          calculateRetirementDeductions({
            deductions:
              deductions({
                pensionInsurance:
                  300_000,
              }),

            rules:
              TAX_RULES_2569,

            assessableIncome:
              1_200_000,

            providentFundWageBase:
              1_200_000,

            /*
             * สมมติ Life Insurance
             * ใช้พื้นที่ 100,000 เต็มแล้ว
             */
            ordinaryLifeRoom: 0,
          });

        expect(
          result
            .pensionLifeRoomAvailable
        ).toBe(0);

        expect(
          result.limits
            .pensionIncomeRate
        ).toBe(0.15);

        expect(
          result.limits
            .pensionIncomeLimit
        ).toBe(180_000);

        expect(
          result.limits
            .pensionExtraMax
        ).toBe(200_000);

        expect(
          result.limits
            .sharedMax
        ).toBe(500_000);

        expect(
          result.limits
            .rmfIncomeRate
        ).toBe(0.30);

        expect(
          result.limits
            .rmfIncomeLimit
        ).toBe(360_000);

        expect(
          result.limits
            .rmfMax
        ).toBe(500_000);

        expect(
          result
            .pensionInsurance
            .allowed
        ).toBe(180_000);
      }
    );
  }
);

describe(
  "General deductions 2569",
  () => {
    it(
      "ส่ง Thai ESG limit metadata จาก Tax Engine",
      () => {
        const result =
          calculateGeneralDeductions({
            deductions:
              deductions({
                thaiEsg:
                  400_000,
              }),

            rules:
              TAX_RULES_2569,

            assessableIncome:
              1_200_000,
          });

        expect(
          result.limits
            .thaiEsgIncomeRate
        ).toBe(0.30);

        expect(
          result.limits
            .thaiEsgIncomeLimit
        ).toBe(360_000);

        expect(
          result.limits
            .thaiEsgMax
        ).toBe(300_000);

        expect(
          result.thaiEsg.allowed
        ).toBe(300_000);
      }
    );
  }
);