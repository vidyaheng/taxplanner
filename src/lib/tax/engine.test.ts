import { describe, expect, it } from "vitest";

import { calculateTax } from "./engine";

import { IncomeData } from "@/types/income";
import { FamilyData } from "@/types/family";

import {
  DeductionData,
} from "@/types/deductions";

function createIncome(
  values: Partial<IncomeData> = {}
): IncomeData {
  return {
    monthlySalary: 0,
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

    ...values,
  };
}

function createFamily(
  values: Partial<FamilyData> = {}
): FamilyData {
  return {
    taxpayerBirthYearBE: null,

    isThaiNational: null,

    maritalStatus: "single",
    spouseHasIncome: false,

    children: [],
    parents: [],
    disabledDependents: [],

    marriedFullTaxYear: false,

    pregnancies: [],

    ...values,
  };
}

function createDeductions(
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

describe("Tax Engine 2569", () => {
  it("คำนวณเงินเดือน 100,000 บาทต่อเดือน กรณีโสด", () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        monthlySalary: 100_000,
      }),

      family: createFamily(),

      deductions:
        createDeductions(),
    });

    expect(
      result.totalGrossIncome
    ).toBe(1_200_000);

    expect(
      result.employmentExpense
    ).toBe(100_000);

    expect(
      result.familyAllowances.taxpayer
    ).toBe(60_000);

    expect(
      result.familyAllowances.total
    ).toBe(60_000);

    expect(
      result.taxableIncome
    ).toBe(1_040_000);

    expect(
      result.method1Tax
    ).toBe(125_000);

    expect(
      result.taxBeforeCredits
    ).toBe(125_000);

    expect(
      result.marginalTaxRate
    ).toBe(0.25);

    expect(
      result.isComplete
    ).toBe(true);
  });

  it("เพิ่มค่าลดหย่อนคู่สมรสเมื่อสมรสและคู่สมรสไม่มีเงินได้", () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        monthlySalary: 100_000,
      }),

      family: createFamily({
        maritalStatus: "married",
        spouseHasIncome: false,
      }),

      deductions:
        createDeductions(),
    });

    expect(
      result.familyAllowances.taxpayer
    ).toBe(60_000);

    expect(
      result.familyAllowances.spouse
    ).toBe(60_000);

    expect(
      result.familyAllowances.total
    ).toBe(120_000);

    expect(
      result.taxableIncome
    ).toBe(980_000);

    expect(
      result.method1Tax
    ).toBe(111_000);

    expect(
      result.marginalTaxRate
    ).toBe(0.2);
  });

  it("ไม่ลดหย่อนคู่สมรสเมื่อคู่สมรสมีเงินได้", () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        monthlySalary: 100_000,
      }),

      family: createFamily({
        maritalStatus: "married",
        spouseHasIncome: true,
      }),

      deductions:
        createDeductions(),
    });

    expect(
      result.familyAllowances.spouse
    ).toBe(0);

    expect(
      result.taxableIncome
    ).toBe(1_040_000);

    expect(
      result.taxBeforeCredits
    ).toBe(125_000);
  });

  it("รายได้ต่ำจนไม่มีภาษีต้องชำระ", () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        monthlySalary: 20_000,
      }),

      family: createFamily(),

      deductions:
  createDeductions(),
    });

    expect(
      result.taxBeforeCredits
    ).toBe(0);

    expect(
      result.marginalTaxRate
    ).toBe(0);
  });

  it("หักค่าใช้จ่าย 40(1) ไม่เกิน 100,000 บาท", () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        monthlySalary: 300_000,
      }),

      family: createFamily(),

      deductions:
        createDeductions(),
    });

    expect(
      result.employmentExpense
    ).toBe(100_000);
  });

  it(
    "นำ insurance deduction ไปหักจาก taxable income จริง",
    () => {
        const result =
        calculateTax({
            taxYear: 2569,

            income:
            createIncome({
                monthlySalary:
                100_000,
            }),

            family:
            createFamily(),

            deductions:
            createDeductions({
                lifeInsurance:
                90_000,

                healthInsuranceSelf:
                25_000,
            }),
        });

        /*
        * Income 1,200,000
        * Expense -100,000
        * Personal -60,000
        *
        * Before insurance
        * = 1,040,000
        */

        expect(
        result.incomeAfterFamilyAllowances
        ).toBe(1_040_000);

        /*
        * Life 90,000
        * Health ใช้ได้อีก 10,000
        */
        expect(
        result.insuranceDeductions
            .lifeInsurance.allowed
        ).toBe(90_000);

        expect(
        result.insuranceDeductions
            .healthInsuranceSelf.allowed
        ).toBe(10_000);

        expect(
        result.insuranceDeductions
            .totalAllowed
        ).toBe(100_000);

        expect(
        result.insuranceDeductions
            .totalExcess
        ).toBe(15_000);

        /*
        * Taxable:
        * 1,040,000 - 100,000
        */
        expect(
        result.taxableIncome
        ).toBe(940_000);

        /*
        * Progressive tax
        * = 103,000
        */
        expect(
        result.taxBeforeCredits
        ).toBe(103_000);

        expect(
        result.marginalTaxRate
        ).toBe(0.2);
    }
  );

  it(
    "Thai ESG จำกัด 30% ของเงินได้ และไม่เกิน 300,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily(),

          deductions:
            createDeductions({
              thaiEsg:
                400_000,
            }),
        });

      /*
      * รายได้ 1.2 ล้าน
      * 30% = 360,000
      *
      * แต่ Thai ESG max
      * = 300,000
      */

      expect(
        result.generalDeductions
          .thaiEsg.allowed
      ).toBe(300_000);

      expect(
        result.generalDeductions
          .thaiEsg.excess
      ).toBe(100_000);
    }
  );

  it(
    "ดอกเบี้ยบ้านใช้สิทธิสูงสุด 100,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily(),

          deductions:
            createDeductions({
              homeLoanInterest:
                150_000,
            }),
        });

      expect(
        result.generalDeductions
          .homeLoanInterest
          .allowed
      ).toBe(100_000);

      expect(
        result.generalDeductions
          .homeLoanInterest
          .excess
      ).toBe(50_000);
    }
  );

  it(
    "ประกันสังคมปี 2569 จำกัดเพดาน 10,500 บาทใน validation ปัจจุบัน",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily(),

          deductions:
            createDeductions({
              socialSecurity:
                12_000,
            }),
        });

      expect(
        result.generalDeductions
          .socialSecurity
          .allowed
      ).toBe(10_500);

      expect(
        result.generalDeductions
          .socialSecurity
          .excess
      ).toBe(1_500);
    }
  );

  it(
    "ค่าฝากครรภ์และคลอดบุตร จำกัด 60,000 บาทต่อการตั้งครรภ์",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily({
              pregnancies: [
                {
                  id: "p1",
                  paidThisYear:
                    80_000,

                  claimedPreviousYears:
                    0,
                },
              ],
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.pregnancyDeductions
          .totalPaid
      ).toBe(80_000);

      expect(
        result.pregnancyDeductions
          .totalAllowed
      ).toBe(60_000);

      expect(
        result.pregnancyDeductions
          .totalExcess
      ).toBe(20_000);
    }
  );

  it(
    "การตั้งครรภ์สองคราวสามารถมีสิทธิแยกกันคราวละ 60,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily({
              pregnancies: [
                {
                  id: "p1",
                  paidThisYear:
                    60_000,

                  claimedPreviousYears:
                    0,
                },

                {
                  id: "p2",
                  paidThisYear:
                    60_000,

                  claimedPreviousYears:
                    0,
                },
              ],
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.pregnancyDeductions
          .totalAllowed
      ).toBe(120_000);
    }
  );

  it(
    "การตั้งครรภ์สองคราวสามารถมีสิทธิแยกกันคราวละ 60,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily({
              pregnancies: [
                {
                  id: "p1",
                  paidThisYear:
                    60_000,

                  claimedPreviousYears:
                    0,
                },

                {
                  id: "p2",
                  paidThisYear:
                    60_000,

                  claimedPreviousYears:
                    0,
                },
              ],
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.pregnancyDeductions
          .totalAllowed
      ).toBe(120_000);
    }
  );

  it(
    "การตั้งครรภ์เดียวกันใช้สิทธิรวมข้ามปีไม่เกิน 60,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                100_000,
            }),

          family:
            createFamily({
              pregnancies: [
                {
                  id: "p1",

                  paidThisYear:
                    40_000,

                  claimedPreviousYears:
                    30_000,
                },
              ],
            }),

          deductions:
            createDeductions(),
        });

      /*
      * เคยใช้ไป 30,000
      * เหลืออีกเพียง 30,000
      */
      expect(
        result.pregnancyDeductions
          .totalAllowed
      ).toBe(30_000);

      expect(
        result.pregnancyDeductions
          .totalExcess
      ).toBe(10_000);
    }
  );

  it(
      "เงินบริจาคพรรคการเมืองใช้สิทธิสูงสุด 10,000 บาทสำหรับสัญชาติไทย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                isThaiNational:
                  true,
              }),

            deductions:
              createDeductions({
                politicalDonation:
                  20_000,
              }),
          });

        expect(
          result.donationDeductions
            .politicalDonation.allowed
        ).toBe(10_000);

        expect(
          result.donationDeductions
            .politicalDonation.excess
        ).toBe(10_000);
      }
    );

    it(
      "เงินบริจาคพิเศษคำนวณสิทธิ 2 เท่า",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily(),

            deductions:
              createDeductions({
                specialDonation:
                  50_000,
              }),
          });

        /*
        * ฐานก่อนบริจาค
        * 1,040,000
        *
        * 10% = 104,000
        *
        * บริจาค 50,000 × 2
        * = 100,000
        */

        expect(
          result.donationDeductions
            .specialDonation.paid
        ).toBe(50_000);

        expect(
          result.donationDeductions
            .specialDonation
            .deductionBeforeCap
        ).toBe(100_000);

        expect(
          result.donationDeductions
            .specialDonation.allowed
        ).toBe(100_000);
      }
    );

    it(
      "เงินบริจาคพิเศษถูกจำกัดด้วยเพดาน 10% ของฐานก่อนบริจาค",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily(),

            deductions:
              createDeductions({
                specialDonation:
                  100_000,
              }),
          });

        /*
        * potential deduction
        * = 200,000
        *
        * แต่ 10% ของ 1,040,000
        * = 104,000
        */

        expect(
          result.donationDeductions
            .specialDonation.allowed
        ).toBe(104_000);
      }
    );

    it(
      "เงินบริจาคทั่วไปคำนวณเพดานหลังหักเงินบริจาคพิเศษ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily(),

            deductions:
              createDeductions({
                specialDonation:
                  50_000,

                generalDonation:
                  100_000,
              }),
          });

        /*
        * Base = 1,040,000
        *
        * Special:
        * 50,000 × 2 = 100,000
        *
        * Remaining:
        * 940,000
        *
        * General cap:
        * 94,000
        */

        expect(
          result.donationDeductions
            .specialDonation.allowed
        ).toBe(100_000);

        expect(
          result.donationDeductions
            .generalDonation.allowed
        ).toBe(94_000);

        expect(
          result.donationDeductions
            .totalAllowed
        ).toBe(194_000);

        expect(
          result.taxableIncome
        ).toBe(846_000);
      }
    );
});