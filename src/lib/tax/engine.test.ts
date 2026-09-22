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

  const hasDetailedOtherIncome =
    Object.values(
      values.detailedOtherIncome ?? {}
    ).some(
      (items) =>
        Array.isArray(items) &&
        items.length > 0
    );

  return {
    monthlySalary: 0,
    annualBonus: 0,
    otherEmploymentIncome: 0,

    section40_1TaxWithheld: 0,
    section40_2TaxWithheld: 0,

    hasOtherIncome:
      values.hasOtherIncome ??
      hasDetailedOtherIncome,

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

    ...values,
  };
}

function createFamily(
  values: Partial<FamilyData> = {}
): FamilyData {
  return {
    taxpayerAge65OrOlder: null,
    isThaiTaxResident: null,

    isThaiNational: null,

    seniorIncomeExemptionAllocation: {
      section40_1: 0,
      section40_2: 0,
      section40_3Annuity: 0,
      section40_3Rights: 0,
      section40_4Interest: 0,
      section40_4Dividend: 0,
      section40_5: 0,
      section40_6: 0,
      section40_7: 0,
    },

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
    ltfToThaiEsgxTransferAmount: 0,

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

it(
  "ไม่คำนวณ legacy investment อัตโนมัติและแจ้งให้ผู้ใช้จัดประเภทรายได้ใหม่",
  () => {
    const result = calculateTax({
      taxYear: 2569,

      income: createIncome({
        hasOtherIncome: true,

        otherIncome: {
          commission: 0,
          rent: 0,
          professional: 0,
          business: 0,
          investment: 1_200_000,
          other: 0,
        },
      }),

      family: createFamily(),

      deductions: createDeductions(),
    });

    expect(
      result.totalGrossIncome
    ).toBe(0);

    expect(
      result.method2Tax
    ).toBe(0);

    expect(
      result.isComplete
    ).toBe(false);

    expect(
      result.warnings.some(
        (warning) =>
          warning.includes(
            "ระบบเวอร์ชันเดิม"
          )
      )
    ).toBe(true);
  }
);

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
      result.effectiveTaxRate
    ).toBeCloseTo(
      125_000 / 1_200_000,
      10
    );

    expect(
      result.isComplete
    ).toBe(true);
  });

  it(
    "ยกเว้นเงินได้ 190,000 บาทเมื่ออายุ 65 ปีขึ้นไปและเป็นผู้อยู่ในประเทศไทย",
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
              taxpayerAge65OrOlder:
                true,

              isThaiTaxResident:
                true,
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.totalGrossIncome
      ).toBe(1_200_000);

      expect(
        result.incomeExemptions
          .seniorResident
      ).toBe(190_000);

      expect(
        result.incomeExemptions
          .total
      ).toBe(190_000);

      expect(
        result.incomeAfterExemptions
      ).toBe(1_010_000);

      expect(
        result.employmentExpense
      ).toBe(100_000);

      expect(
        result.taxableIncome
      ).toBe(850_000);

      expect(
        result.taxBeforeCredits
      ).toBe(85_000);

      expect(
        result.marginalTaxRate
      ).toBe(0.2);
    }
  );

  it(
    "ไม่ให้สิทธิยกเว้น 190,000 บาทเมื่ออายุ 65 ปีขึ้นไปแต่ไม่เป็นผู้อยู่ในประเทศไทย",
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
              taxpayerAge65OrOlder:
                true,

              isThaiTaxResident:
                false,
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.incomeExemptions
          .seniorResident
      ).toBe(0);

      expect(
        result.incomeAfterExemptions
      ).toBe(1_200_000);

      expect(
        result.taxableIncome
      ).toBe(1_040_000);

      expect(
        result.taxBeforeCredits
      ).toBe(125_000);
    }
  );

  it(
    "ผู้มีอายุ 65 ปีขึ้นไปสามารถเลือกใช้สิทธิยกเว้น 190,000 บาทกับ 40(1) แทน 40(2) ได้",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              monthlySalary:
                50_000,

              hasOtherIncome:
                true,

              otherIncome: {
                commission:
                  2_000_000,

                rent: 0,
                professional: 0,
                business: 0,
                investment: 0,
                other: 0,
              },
            }),

          family:
            createFamily({
              taxpayerAge65OrOlder:
                true,

              isThaiTaxResident:
                true,

              seniorIncomeExemptionAllocation:
                {
                  section40_1:
                    190_000,

                  section40_2: 0,
                  section40_3Annuity: 0,
                  section40_3Rights: 0,
                  section40_4Interest: 0,
                  section40_4Dividend: 0,
                  section40_5: 0,
                  section40_6: 0,
                  section40_7: 0,
                },
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.incomeExemptions
          .seniorResident
      ).toBe(190_000);

      expect(
        result.incomeAfterExemptions
      ).toBe(2_410_000);

      /*
      * เลือกใช้สิทธิทั้งหมดกับ 40(1)
      * ดังนั้น 40(2) จำนวน 2,000,000
      * ยังอยู่ในฐานวิธี 0.5% เต็มจำนวน
      */
      expect(
        result.method2Tax
      ).toBe(10_000);
    }
  );

  it(
    "Method 2 ใช้เงินได้ 40(2) หลังหักสิทธิผู้สูงอายุ 190,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              hasOtherIncome:
                true,

              otherIncome: {
                commission:
                  1_200_000,

                rent: 0,
                professional: 0,
                business: 0,
                investment: 0,
                other: 0,
              },
            }),

          family:
            createFamily({
              taxpayerAge65OrOlder:
                true,

              isThaiTaxResident:
                true,
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.incomeExemptions
          .seniorResident
      ).toBe(190_000);

      /*
      * 40(2) หลังยกเว้น
      * = 1,200,000 - 190,000
      * = 1,010,000
      *
      * Method 2
      * = 1,010,000 × 0.5%
      * = 5,050
      */
      expect(
        result.method2Tax
      ).toBe(5_050);
    }
  );

  it(
    "40(3) เงินรายปีเข้าเป็นเงินได้โดยไม่มีค่าใช้จ่ายเหมา 50%",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              detailedOtherIncome: {
                section40_3: [
                  {
                    id: "annuity-1",
                    incomeType:
                      "annuity",
                    amount:
                      500_000,
                  },
                ],

                section40_4Interest: [],
                section40_4Dividend: [],
                section40_5: [],
                section40_6: [],
                section40_7: [],
                section40_8: [],
              },
            }),

          family:
            createFamily(),

          deductions:
            createDeductions(),
        });

      expect(
        result.totalGrossIncome
      ).toBe(500_000);

      /*
      * เงินรายปี 40(3)
      * ไม่ใช้ค่าใช้จ่ายเหมา
      * ของ 40(3) ประเภทสิทธิ
      *
      * 500,000
      * - ค่าลดหย่อนส่วนตัว 60,000
      * = เงินได้สุทธิ 440,000
      */
      expect(
        result.taxableIncome
      ).toBe(440_000);

      expect(
        result.method1Tax
      ).toBe(21_500);

      expect(
        result.isComplete
      ).toBe(true);
    }
  );

  it(
    "40(3) ประเภทสิทธิหักค่าใช้จ่ายเหมา 50% แต่รวมไม่เกิน 100,000 บาท",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              detailedOtherIncome: {
                section40_3: [
                  {
                    id: "rights-1",
                    incomeType:
                      "rights",
                    amount:
                      400_000,
                    expenseMethod:
                      "standard",
                    actualExpense: 0,
                  },
                ],

                section40_4Interest: [],
                section40_4Dividend: [],
                section40_5: [],
                section40_6: [],
                section40_7: [],
                section40_8: [],
              },
            }),

          family:
            createFamily(),

          deductions:
            createDeductions(),
        });

      expect(
        result.totalGrossIncome
      ).toBe(400_000);

      /*
      * ค่าใช้จ่ายเหมา
      * 400,000 × 50% = 200,000
      * แต่เพดานรวม = 100,000
      *
      * 400,000
      * - 100,000 ค่าใช้จ่าย
      * - 60,000 ค่าลดหย่อนส่วนตัว
      * = 240,000
      */
      expect(
        result.taxableIncome
      ).toBe(240_000);

      expect(
        result.method1Tax
      ).toBe(4_500);

      expect(
        result.isComplete
      ).toBe(true);
    }
  );

  it(
    "Method 2 ใช้เงินได้ 40(3) ก่อนหักค่าใช้จ่าย",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              detailedOtherIncome: {
                section40_3: [
                  {
                    id: "rights-method2",
                    incomeType:
                      "rights",
                    amount:
                      1_200_000,
                    expenseMethod:
                      "standard",
                    actualExpense: 0,
                  },
                ],

                section40_4Interest: [],
                section40_4Dividend: [],
                section40_5: [],
                section40_6: [],
                section40_7: [],
                section40_8: [],
              },
            }),

          family:
            createFamily(),

          deductions:
            createDeductions(),
        });

      /*
      * Method 2 ใช้เงินได้พึงประเมิน
      * ก่อนหักค่าใช้จ่าย
      *
      * 1,200,000 × 0.5%
      * = 6,000
      */
      expect(
        result.method2Tax
      ).toBe(6_000);
    }
  );

  it(
    "40(3) ประเภทสิทธิหักยกเว้นผู้สูงอายุก่อนคำนวณค่าใช้จ่าย",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              detailedOtherIncome: {
                section40_3: [
                  {
                    id: "rights-senior",
                    incomeType:
                      "rights",
                    amount:
                      380_000,
                    expenseMethod:
                      "standard",
                    actualExpense: 0,
                  },
                ],

                section40_4Interest: [],
                section40_4Dividend: [],
                section40_5: [],
                section40_6: [],
                section40_7: [],
                section40_8: [],
              },
            }),

          family:
            createFamily({
              taxpayerAge65OrOlder:
                true,

              isThaiTaxResident:
                true,

              seniorIncomeExemptionAllocation:
                {
                  section40_1: 0,
                  section40_2: 0,
                  section40_3Annuity: 0,
                  section40_3Rights:
                    190_000,
                  section40_4Interest: 0,
                  section40_4Dividend: 0,
                  section40_5: 0,
                  section40_6: 0,
                  section40_7: 0,
                },
            }),

          deductions:
            createDeductions(),
        });

      expect(
        result.incomeExemptions
          .seniorResident
      ).toBe(190_000);

      expect(
        result.incomeAfterExemptions
      ).toBe(190_000);

      /*
      * หลังยกเว้นผู้สูงอายุ:
      * 380,000 - 190,000
      * = 190,000
      *
      * ค่าใช้จ่าย 50%
      * = 95,000
      *
      * เหลือ 95,000
      * - ค่าลดหย่อนส่วนตัว 60,000
      * = เงินได้สุทธิ 35,000
      */
      expect(
        result.taxableIncome
      ).toBe(35_000);

      expect(
        result.method1Tax
      ).toBe(0);

      expect(
        result.isComplete
      ).toBe(true);
    }
  );

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

  it(
    "อัตราภาษีที่แท้จริงเป็น 0 เมื่อไม่มีรายได้",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome(),

          family:
            createFamily(),

          deductions:
            createDeductions(),
        });

      expect(
        result.totalGrossIncome
      ).toBe(0);

      expect(
        result.taxBeforeCredits
      ).toBe(0);

      expect(
        result.effectiveTaxRate
      ).toBe(0);
    }
  );

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
    "นำสิทธิ Solar Rooftop และค่าซื้องานศิลปะไปลดเงินได้สุทธิจริง",
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
              solarRooftop:
                250_000,

              artPurchase:
                120_000,
            }),
        });

      /*
      * Solar จ่าย 250,000
      * ใช้ได้สูงสุด 200,000
      *
      * Art จ่าย 120,000
      * ใช้ได้สูงสุด 100,000
      */
      expect(
        result.generalDeductions
          .solarRooftop?.allowed
      ).toBe(200_000);

      expect(
        result.generalDeductions
          .artPurchase?.allowed
      ).toBe(100_000);

      expect(
        result.generalDeductions
          .totalAllowed
      ).toBe(300_000);

      /*
      * เงินเดือน 1,200,000
      * - ค่าใช้จ่าย 40(1) 100,000
      * - ค่าลดหย่อนส่วนตัว 60,000
      * = 1,040,000
      *
      * - Solar + Art 300,000
      * = เงินได้สุทธิ 740,000
      */
      expect(
        result.taxableIncome
      ).toBe(740_000);

      /*
      * ภาษี:
      * 0 - 150,000 = 0
      * 150,001 - 300,000 = 7,500
      * 300,001 - 500,000 = 20,000
      * 500,001 - 740,000 = 36,000
      *
      * รวม = 63,500
      */
      expect(
        result.taxBeforeCredits
      ).toBe(63_500);

      expect(
        result.isComplete
      ).toBe(true);
    }
  );

  it(
    "นำสิทธิยกเว้นเพิ่ม 50% จากการลงทุนอนุรักษ์พลังงานไปลดฐานภาษี Method 1",
    () => {
      const result =
        calculateTax({
          taxYear: 2569,

          income:
            createIncome({
              detailedOtherIncome: {
                section40_3: [],
                section40_4Interest: [],
                section40_4Dividend: [],
                section40_5: [],
                section40_6: [],
                section40_7: [],

                section40_8: [
                  {
                    id: "energy-business-1",

                    amount:
                      500_000,

                    category:
                      "actualOnly",

                    expenseMethod:
                      "actual",

                    actualExpense:
                      100_000,

                    energyEfficientInvestment:
                      200_000,
                  },
                ],
              },
            }),

          family:
            createFamily(),

          deductions:
            createDeductions(),
        });

      /*
      * 40(8) 500,000
      * - ค่าใช้จ่ายจริง 100,000
      * = หลังค่าใช้จ่าย 400,000
      */
      expect(
        result.incomeAfterExpenses
      ).toBe(400_000);

      /*
      * เงินลงทุน 200,000
      * × สิทธิเพิ่ม 50%
      * = ยกเว้นเพิ่ม 100,000
      */
      expect(
        result
          .energyEfficientInvestmentQualifyingAmount
      ).toBe(200_000);

      expect(
        result
          .energyEfficientInvestmentExemption
      ).toBe(100_000);

      expect(
        result
          .incomeAfterEnergyEfficientInvestmentExemption
      ).toBe(300_000);

      /*
      * - ค่าลดหย่อนส่วนตัว 60,000
      * = เงินได้สุทธิ 240,000
      */
      expect(
        result.taxableIncome
      ).toBe(240_000);

      /*
      * 0 - 150,000 = ยกเว้น
      * 90,000 × 5% = 4,500
      */
      expect(
        result.method1Tax
      ).toBe(4_500);

      /*
      * รายได้ 40(8) เพียง 500,000
      * ยังไม่ถึงฐาน Method 2
      */
      expect(
        result.method2Tax
      ).toBe(0);

      expect(
        result.taxBeforeCredits
      ).toBe(4_500);

      expect(
        result.isComplete
      ).toBe(true);
    }
  );

  it(
    "คำนวณสิทธิ Thai ESGX จากยอด LTF ที่สับเปลี่ยน 380,000 บาท",
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
              ltfToThaiEsgxTransferAmount:
                380_000,
            }),
        });

      expect(
        result.generalDeductions
          .thaiEsgxTransfer
          .transferredAmount
      ).toBe(380_000);

      expect(
        result.generalDeductions
          .thaiEsgxTransfer
          .eligibleTransferAmount
      ).toBe(380_000);

      expect(
        result.generalDeductions
          .thaiEsgxTransfer
          .transferAmountOverLimit
      ).toBe(0);

      expect(
        result.generalDeductions
          .thaiEsgxTransfer
          .allowedThisYear
      ).toBe(20_000);

      expect(
        result.generalDeductions
          .totalAllowed
      ).toBe(20_000);

      expect(
        result.generalDeductions
          .thaiEsgxTransfer
          .schedule
      ).toEqual([
        {
          taxYear: 2568,
          allowed: 300_000,
        },
        {
          taxYear: 2569,
          allowed: 20_000,
        },
        {
          taxYear: 2570,
          allowed: 20_000,
        },
        {
          taxYear: 2571,
          allowed: 20_000,
        },
        {
          taxYear: 2572,
          allowed: 20_000,
        },
      ]);
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

    it(
      "40(4)(ก) ดอกเบี้ยที่เลือก include จะนำมารวมคำนวณและใช้ภาษีหัก ณ ที่จ่ายเป็นเครดิต",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest: [
                    {
                      id: "interest-include",
                      amount: 100_000,
                      taxWithheld: 15_000,
                      taxTreatment:
                        "include",
                    },
                  ],

                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_4Interest
        ).toBe(100_000);

        expect(
          result.totalGrossIncome
        ).toBe(100_000);

        /*
        * ดอกเบี้ย 100,000
        * ไม่มีค่าใช้จ่าย
        * - ค่าลดหย่อนส่วนตัว 60,000
        * = เงินได้สุทธิ 40,000
        */
        expect(
          result.taxableIncome
        ).toBe(40_000);

        expect(
          result.taxBeforeCredits
        ).toBe(0);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(15_000);

        expect(
          result.taxCredits.total
        ).toBe(15_000);

        expect(
          result.taxPayable
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(15_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "40(4)(ก) ดอกเบี้ยที่เลือก final จะไม่เข้าการคำนวณปลายปีและไม่ใช้ภาษีหัก ณ ที่จ่ายเป็นเครดิต",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest: [
                    {
                      id: "interest-final",
                      amount: 100_000,
                      taxWithheld: 15_000,
                      taxTreatment:
                        "final",
                    },
                  ],

                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Final Tax:
        * ไม่เข้าฐานคำนวณปลายปี
        */
        expect(
          result.supportedIncome
            .section40_4Interest
        ).toBe(0);

        expect(
          result.taxableIncome
        ).toBe(0);

        expect(
          result.method1Tax
        ).toBe(0);

        expect(
          result.method2Tax
        ).toBe(0);

        /*
        * ภาษีหัก ณ ที่จ่ายของรายการ Final
        * ไม่เอามาเครดิตกับภาษีปลายปี
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้ดอกเบี้ย 40(4)(ก) ที่เลือก include ก่อนหักค่าลดหย่อน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest: [
                    {
                      id: "interest-method2",
                      amount:
                        1_200_000,
                      taxWithheld:
                        180_000,
                      taxTreatment:
                        "include",
                    },
                  ],

                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Method 2
        * 1,200,000 × 0.5%
        * = 6,000
        */
        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(180_000);
      }
    );

    it(
      "ผู้มีอายุ 65 ปีขึ้นไปสามารถเลือกใช้สิทธิยกเว้น 190,000 บาทกับดอกเบี้ย 40(4)(ก) ที่เลือก include",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest: [
                    {
                      id: "interest-senior",
                      amount:
                        380_000,
                      taxWithheld:
                        57_000,
                      taxTreatment:
                        "include",
                    },
                  ],

                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation:
                  {
                    section40_1: 0,
                    section40_2: 0,
                    section40_3Annuity: 0,
                    section40_3Rights: 0,

                    section40_4Interest:
                      190_000,
                    section40_4Dividend: 0,
                    section40_5: 0,
                    section40_6: 0,
                    section40_7: 0,
                  },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.incomeAfterExemptions
        ).toBe(190_000);

        /*
        * 380,000
        * - ยกเว้นผู้สูงอายุ 190,000
        * = 190,000
        *
        * - ค่าลดหย่อนส่วนตัว 60,000
        * = เงินได้สุทธิ 130,000
        */
        expect(
          result.taxableIncome
        ).toBe(130_000);

        expect(
          result.taxBeforeCredits
        ).toBe(0);

        /*
        * WHT ยังถูกหักจากผู้จ่ายตามปกติ
        * เมื่อนำเงินได้มาแสดงจึงเกิดสิทธิขอคืน
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(57_000);

        expect(
          result.taxRefund
        ).toBe(57_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อดอกเบี้ย 40(4)(ก) เลือก include และ final ปะปนกัน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],

                  section40_4Interest: [
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
                  ],

                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "ดอกเบี้ย 40(4)(ก)"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "40(4)(ข) เงินปันผลที่เลือก include จะรวมเครดิตภาษีเงินปันผลเป็นเงินได้และใช้เครดิตภาษีได้",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],

                  section40_4Dividend: [
                    {
                      id: "dividend-include",
                      amount: 80_000,
                      taxWithheld: 8_000,
                      dividendTaxCredit: 20_000,
                      taxTreatment: "include",
                    },
                  ],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * เงินปันผล 80,000
        * + เครดิตภาษีเงินปันผล 20,000
        * = เงินได้พึงประเมิน 100,000
        */
        expect(
          result.supportedIncome
            .section40_4Dividend
        ).toBe(100_000);

        /*
        * 100,000
        * - ค่าลดหย่อนส่วนตัว 60,000
        * = เงินได้สุทธิ 40,000
        */
        expect(
          result.taxableIncome
        ).toBe(40_000);

        expect(
          result.taxBeforeCredits
        ).toBe(0);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(8_000);

        expect(
          result.taxCredits
            .dividendTaxCredit
        ).toBe(20_000);

        expect(
          result.taxCredits.total
        ).toBe(28_000);

        expect(
          result.taxPayable
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(28_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "40(4)(ข) เงินปันผลที่เลือก final จะไม่เข้าการคำนวณปลายปีและไม่สร้างเครดิตภาษี",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],

                  section40_4Dividend: [
                    {
                      id: "dividend-final",
                      amount: 100_000,
                      taxWithheld: 10_000,

                      /*
                      * แม้ข้อมูลต้นทางมีเครดิต
                      * แต่เมื่อเลือก final
                      * จะไม่นำมาใช้ปลายปี
                      */
                      dividendTaxCredit: 25_000,

                      taxTreatment: "final",
                    },
                  ],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_4Dividend
        ).toBe(0);

        expect(
          result.taxableIncome
        ).toBe(0);

        expect(
          result.method1Tax
        ).toBe(0);

        expect(
          result.method2Tax
        ).toBe(0);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(0);

        expect(
          result.taxCredits
            .dividendTaxCredit
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้เงินปันผล 40(4)(ข) ที่เลือก include",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],

                  section40_4Dividend: [
                    {
                      id: "dividend-method2",
                      amount: 1_200_000,
                      taxWithheld: 120_000,

                      /*
                      * test นี้แยกทดสอบ Method 2
                      * จึงตั้งเครดิตเงินปันผลเป็น 0
                      */
                      dividendTaxCredit: 0,

                      taxTreatment: "include",
                    },
                  ],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Method 2
        * 1,200,000 × 0.5%
        * = 6,000
        */
        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(120_000);
      }
    );

    it(
      "ผู้มีอายุ 65 ปีขึ้นไปสามารถจัดสรรสิทธิยกเว้น 190,000 บาทให้เงินปันผลที่เลือก include",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],

                  section40_4Dividend: [
                    {
                      id: "dividend-senior",
                      amount: 380_000,
                      taxWithheld: 38_000,
                      dividendTaxCredit: 0,
                      taxTreatment: "include",
                    },
                  ],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation:
                  {
                    section40_1: 0,
                    section40_2: 0,
                    section40_3Annuity: 0,
                    section40_3Rights: 0,
                    section40_4Interest: 0,

                    section40_4Dividend:
                      190_000,
                    section40_5: 0,
                    section40_6: 0,
                    section40_7: 0,
                  },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.incomeAfterExemptions
        ).toBe(190_000);

        /*
        * 380,000
        * - ยกเว้นผู้สูงอายุ 190,000
        * - ค่าลดหย่อนส่วนตัว 60,000
        * = เงินได้สุทธิ 130,000
        */
        expect(
          result.taxableIncome
        ).toBe(130_000);

        expect(
          result.taxBeforeCredits
        ).toBe(0);

        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(38_000);

        expect(
          result.taxRefund
        ).toBe(38_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อเงินปันผล 40(4)(ข) เลือก include และ final ปะปนกัน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],

                  section40_4Dividend: [
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
                  ],

                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "เงินปันผล 40(4)(ข)"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ไม่นำ detailedOtherIncome มาคำนวณเมื่อเลือกไม่มีรายได้ประเภทอื่น",
      () => {
        const result = calculateTax({
          taxYear: 2569,

          income: createIncome({
            hasOtherIncome: false,

            detailedOtherIncome: {
              section40_3: [
                {
                  id: "annuity-hidden",
                  incomeType: "annuity",
                  amount: 400_000,
                },
              ],

              section40_4Interest: [
                {
                  id: "interest-hidden",
                  amount: 400_000,
                  taxWithheld: 0,
                  taxTreatment: "include",
                },
              ],

              section40_4Dividend: [
                {
                  id: "dividend-hidden",
                  amount: 400_000,
                  taxWithheld: 0,
                  dividendTaxCredit: 0,
                  taxTreatment: "include",
                },
              ],

              section40_5: [
                {
                  id: "rental-hidden",
                  amount: 400_000,

                  assetType: "building",
                  expenseMethod: "standard",

                  actualExpense: 0,

                  isSublease: false,
                  subleaseRentPaid: 0,
                },
              ],
              section40_6: [],
              section40_7: [],
              section40_8: [],
            },
          }),

          family: createFamily(),

          deductions: createDeductions(),
        });

        expect(
          result.totalGrossIncome
        ).toBe(0);

        expect(
          result.method2Tax
        ).toBe(0);
      }
    );

    it(
      "คำนวณรายได้ค่าเช่าอาคาร 40(5) โดยหักค่าใช้จ่ายเหมา 30%",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],

                  section40_5: [
                    {
                      id: "rental-building",
                      amount: 300_000,

                      assetType:
                        "building",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,

                      isSublease: false,
                      subleaseRentPaid: 0,
                    },
                  ],

                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        /*
        * ค่าเช่าอาคาร 300,000
        * หักค่าใช้จ่ายเหมา 30%
        * = 90,000
        *
        * เงินได้หลังหักค่าใช้จ่าย
        * = 210,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(210_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หักสิทธิผู้สูงอายุจากรายได้ค่าเช่า 40(5) ก่อนคำนวณค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],

                  section40_5: [
                    {
                      id: "rental-senior",
                      amount: 380_000,

                      assetType:
                        "building",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,

                      isSublease: false,
                      subleaseRentPaid: 0,
                    },
                  ],

                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation:
                  {
                    section40_1: 0,
                    section40_2: 0,
                    section40_3Annuity: 0,
                    section40_3Rights: 0,
                    section40_4Interest: 0,
                    section40_4Dividend: 0,

                    section40_5:
                      190_000,
                    section40_6: 0,
                    section40_7: 0,
                  },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.totalGrossIncome
        ).toBe(380_000);

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.incomeAfterExemptions
        ).toBe(190_000);

        /*
        * ค่าเช่าเดิม          380,000
        * - ยกเว้นผู้สูงอายุ   190,000
        * = เหลือ              190,000
        *
        * ค่าใช้จ่ายเหมา 30%
        * = 57,000
        *
        * หลังหักค่าใช้จ่าย
        * = 133,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(133_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้รายได้ค่าเช่า 40(5) ก่อนหักค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],

                  section40_5: [
                    {
                      id: "rental-method2",
                      amount: 1_200_000,

                      assetType:
                        "building",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,

                      isSublease: false,
                      subleaseRentPaid: 0,
                    },
                  ],

                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Method 2:
        * 1,200,000 × 0.5%
        * = 6,000
        *
        * ต้องไม่ใช้ยอดหลังหัก
        * ค่าใช้จ่ายอาคาร 30%
        */
        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อรายได้ค่าเช่า 40(5) ยังไม่ระบุประเภททรัพย์สิน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],

                  section40_5: [
                    {
                      id: "rental-incomplete",
                      amount: 300_000,

                      assetType: null,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,

                      isSublease: false,
                      subleaseRentPaid: 0,
                    },
                  ],

                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "40(5)"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ไม่ตีความรายได้ค่าเช่าจากช่อง legacy เป็น detailed 40(5) อัตโนมัติ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                hasOtherIncome: true,

                otherIncome: {
                  commission: 0,

                  /*
                  * ข้อมูลจาก UI / schema เดิม
                  * ยังไม่ทราบประเภททรัพย์สิน
                  * และวิธีหักค่าใช้จ่าย
                  */
                  rent: 300_000,

                  professional: 0,
                  business: 0,
                  investment: 0,
                  other: 0,
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        expect(
          result.supportedIncome
            .section40_5
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "รายได้ค่าเช่า"
              ) &&
              warning.includes(
                "ระบบเวอร์ชันเดิม"
              ) &&
              warning.includes(
                "40(5)"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "คำนวณรายได้วิชาชีพเวชกรรม 40(6) โดยหักค่าใช้จ่ายเหมา 60%",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-medical",
                      amount: 300_000,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_6
        ).toBe(300_000);

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(120_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "คำนวณรายได้วิชาชีพอื่น 40(6) โดยหักค่าใช้จ่ายเหมา 30%",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-other",
                      amount: 300_000,

                      professionalType:
                        "other",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_6
        ).toBe(300_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(210_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หักสิทธิผู้สูงอายุจากรายได้ 40(6) ก่อนคำนวณค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-senior",
                      amount: 300_000,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation: {
                  section40_1: 0,
                  section40_2: 0,
                  section40_3Annuity: 0,
                  section40_3Rights: 0,
                  section40_4Interest: 0,
                  section40_4Dividend: 0,
                  section40_5: 0,
                  section40_6:
                    190_000,
                  section40_7: 0,
                },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(44_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้รายได้ 40(6) ก่อนหักค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-method2",
                      amount: 1_200_000,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ไม่นำ detailed 40(6) มาคำนวณเมื่อเลือกไม่มีรายได้ประเภทอื่น",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                hasOtherIncome: false,

                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-hidden",
                      amount: 500_000,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_6
        ).toBe(0);

        expect(
          result.totalGrossIncome
        ).toBe(0);

        expect(
          result.incomeAfterExpenses
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูลไม่สมบูรณ์เมื่อรายได้ 40(6) ยังไม่ระบุประเภทวิชาชีพ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],

                  section40_6: [
                    {
                      id: "professional-incomplete",
                      amount: 300_000,

                      professionalType: null,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_6
        ).toBe(300_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes("40(6)")
          )
        ).toBe(true);
      }
    );

    it(
      "ไม่ตีความรายได้วิชาชีพจากช่อง legacy เป็น detailed 40(6) อัตโนมัติ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                hasOtherIncome: true,

                otherIncome: {
                  commission: 0,
                  rent: 0,

                  professional: 300_000,

                  business: 0,
                  investment: 0,
                  other: 0,
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_6
        ).toBe(0);

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "ระบบเวอร์ชันเดิม"
              ) &&
              warning.includes(
                "40(6)"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "คำนวณรายได้งานรับเหมา 40(7) โดยหักค่าใช้จ่ายเหมา 60%",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-standard",
                      amount: 300_000,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_7
        ).toBe(300_000);

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(120_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "คำนวณรายได้งานรับเหมา 40(7) โดยหักค่าใช้จ่ายตามจริง",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-actual",
                      amount: 300_000,

                      expenseMethod:
                        "actual",

                      actualExpense: 210_000,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_7
        ).toBe(300_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(90_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หักสิทธิผู้สูงอายุกับรายได้ 40(7) ก่อนคำนวณค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-senior",
                      amount: 300_000,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation: {
                  section40_1: 0,
                  section40_2: 0,
                  section40_3Annuity: 0,
                  section40_3Rights: 0,
                  section40_4Interest: 0,
                  section40_4Dividend: 0,
                  section40_5: 0,
                  section40_6: 0,
                  section40_7: 190_000,
                },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.supportedIncome
            .section40_7
        ).toBe(300_000);

        expect(
          result.incomeAfterExpenses
        ).toBe(44_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้รายได้ 40(7) ก่อนหักค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-method2",
                      amount: 1_200_000,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ไม่คำนวณ detailed 40(7) เมื่อเลือกไม่มีรายได้ประเภทอื่น",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                hasOtherIncome: false,

                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-hidden",
                      amount: 500_000,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_7
        ).toBe(0);

        expect(
          result.totalGrossIncome
        ).toBe(0);

        expect(
          result.incomeAfterExpenses
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูล 40(7) ไม่สมบูรณ์เมื่อเลือกวิธีหักค่าใช้จ่ายไม่สอดคล้องกัน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],

                  section40_7: [
                    {
                      id: "contract-standard",
                      amount: 100_000,
                      expenseMethod:
                        "standard",
                      actualExpense: 0,
                    },
                    {
                      id: "contract-actual",
                      amount: 100_000,
                      expenseMethod:
                        "actual",
                      actualExpense: 70_000,
                    },
                  ],

                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_7
        ).toBe(200_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes("40(7)")
          )
        ).toBe(true);
      }
    );

    it(
      "คำนวณรายได้ 40(8) กลุ่มหักค่าใช้จ่ายเหมา 60%",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-standard60",
                      amount: 300_000,

                      category:
                        "standard60",

                      activityCode:
                        "business-1",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(300_000);

        expect(
          result.totalGrossIncome
        ).toBe(300_000);

        /*
        * ค่าใช้จ่ายเหมา 60%
        * 300,000 × 60%
        * = 180,000
        *
        * เงินได้หลังหักค่าใช้จ่าย
        * = 120,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(120_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "40(8) ผู้แสดงรวมรายได้หลายรายการก่อนคำนวณค่าใช้จ่ายแบบขั้นบันได",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "performer-1",
                      amount: 200_000,

                      category:
                        "performer",

                      activityCode:
                        "performer-a",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },

                    {
                      id: "performer-2",
                      amount: 200_000,

                      category:
                        "performer",

                      activityCode:
                        "performer-b",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(400_000);

        /*
        * รายได้ผู้แสดงรวม
        * = 200,000 + 200,000
        * = 400,000
        *
        * 300,000 แรก × 60%
        * = 180,000
        *
        * ส่วนเกิน 100,000 × 40%
        * = 40,000
        *
        * ค่าใช้จ่ายรวม
        * = 220,000
        *
        * เหลือหลังหักค่าใช้จ่าย
        * = 180,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(180_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "หักสิทธิผู้สูงอายุจากรายได้ 40(8) ก่อนคำนวณค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-senior",
                      amount: 300_000,

                      category:
                        "standard60",

                      activityCode:
                        "business-senior",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily({
                taxpayerAge65OrOlder:
                  true,

                isThaiTaxResident:
                  true,

                seniorIncomeExemptionAllocation: {
                  section40_1: 0,
                  section40_2: 0,
                  section40_3Annuity: 0,
                  section40_3Rights: 0,
                  section40_4Interest: 0,
                  section40_4Dividend: 0,
                  section40_5: 0,
                  section40_6: 0,
                  section40_7: 0,

                  section40_8:
                    190_000,
                },
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(300_000);

        expect(
          result.incomeExemptions
            .seniorResident
        ).toBe(190_000);

        expect(
          result.incomeAfterExemptions
        ).toBe(110_000);

        /*
        * รายได้เดิม
        * = 300,000
        *
        * - ยกเว้นผู้สูงอายุ
        * = 190,000
        *
        * เหลือ
        * = 110,000
        *
        * ค่าใช้จ่ายเหมา 60%
        * = 66,000
        *
        * หลังหักค่าใช้จ่าย
        * = 44,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(44_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Method 2 ใช้รายได้ 40(8) ก่อนหักค่าใช้จ่าย",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-method2",
                      amount: 1_200_000,

                      category:
                        "standard60",

                      activityCode:
                        "business-method2",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(1_200_000);

        /*
        * Method 2 ใช้เงินได้พึงประเมิน
        * ก่อนหักค่าใช้จ่าย
        *
        * 1,200,000 × 0.5%
        * = 6,000
        */
        expect(
          result.method2Tax
        ).toBe(6_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูล 40(8) ไม่สมบูรณ์เมื่อยังไม่ระบุประเภทกิจการ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-incomplete",
                      amount: 300_000,

                      category: null,

                      activityCode:
                        "business-incomplete",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(300_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes("40(8)")
          )
        ).toBe(true);
      }
    );

    it(
      "ถือว่าข้อมูล 40(8) ไม่สมบูรณ์เมื่อกิจการเดียวกันใช้วิธีหักค่าใช้จ่ายต่างกัน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-standard",
                      amount: 100_000,

                      category:
                        "standard60",

                      activityCode:
                        "same-business",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },

                    {
                      id: "business-actual",
                      amount: 100_000,

                      category:
                        "standard60",

                      activityCode:
                        "same-business",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        70_000,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(200_000);

        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes("40(8)")
          )
        ).toBe(true);
      }
    );

    it(
      "40(8) domestic และ foreign taxable กิจการเดียวกันต้องใช้วิธีหักค่าใช้จ่ายเดียวกัน",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id:
                        "domestic-business",

                      amount:
                        100_000,

                      category:
                        "standard60",

                      activityCode:
                        "same-business",

                      expenseMethod:
                        "standard",

                      actualExpense:
                        0,
                    },

                    {
                      id:
                        "foreign-business",

                      amount:
                        100_000,

                      category:
                        "standard60",

                      activityCode:
                        "same-business",

                      expenseMethod:
                        "actual",

                      actualExpense:
                        70_000,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          100_000,

                        foreignIncomeTaxPaid:
                          0,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Domestic 100,000
        * + Foreign taxable 100,000
        */
        expect(
          result.supportedIncome
            .section40_8
        ).toBe(200_000);

        /*
        * กิจการเดียวกัน
        * แต่ใช้ standard / actual ต่างกัน
        */
        expect(
          result.isComplete
        ).toBe(false);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes("40(8)")
          )
        ).toBe(true);
      }
    );

    it(
      "ไม่คำนวณ detailed 40(8) เมื่อเลือกไม่มีรายได้ประเภทอื่น",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                hasOtherIncome: false,

                detailedOtherIncome: {
                  section40_3: [],
                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-hidden",
                      amount: 500_000,

                      category:
                        "standard60",

                      activityCode:
                        "business-hidden",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(0);

        expect(
          result.totalGrossIncome
        ).toBe(0);

        expect(
          result.incomeAfterExpenses
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "รวมภาษีหัก ณ ที่จ่ายจาก 40(1), 40(2), 40(3), 40(5), 40(6), 40(7) และ 40(8)",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary: 100_000,

                section40_1TaxWithheld:
                  10_000,

                section40_2TaxWithheld:
                  2_000,

                hasOtherIncome: true,

                otherIncome: {
                  commission: 100_000,
                  rent: 0,
                  professional: 0,
                  business: 0,
                  investment: 0,
                  other: 0,
                },

                detailedOtherIncome: {
                  section40_3: [
                    {
                      id: "annuity-wht",
                      incomeType: "annuity",
                      amount: 100_000,
                      taxWithheld: 3_000,
                    },
                  ],

                  section40_4Interest: [],
                  section40_4Dividend: [],

                  section40_5: [
                    {
                      id: "rental-wht",
                      amount: 100_000,
                      taxWithheld: 6_000,

                      assetType: "building",
                      expenseMethod:
                        "standard",

                      actualExpense: 0,

                      isSublease: false,
                      subleaseRentPaid: 0,
                    },
                  ],

                  section40_6: [
                    {
                      id: "professional-wht",
                      amount: 100_000,
                      taxWithheld: 7_000,

                      professionalType:
                        "medical",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_7: [
                    {
                      id: "contract-wht",
                      amount: 100_000,
                      taxWithheld: 8_000,

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],

                  section40_8: [
                    {
                      id: "business-wht",
                      amount: 100_000,
                      taxWithheld: 9_000,

                      category:
                        "standard60",

                      activityCode:
                        "business-wht",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * 40(1) = 10,000
        * 40(2) =  2,000
        * 40(3) =  3,000
        * 40(5) =  6,000
        * 40(6) =  7,000
        * 40(7) =  8,000
        * 40(8) =  9,000
        *
        * รวม = 45,000
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(45_000);

        expect(
          result.taxCredits.total
        ).toBe(45_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "ไม่นำภาษีหัก ณ ที่จ่ายของ 40(2)-40(8) มาเครดิตเมื่อเลือกไม่มีรายได้ประเภทอื่น แต่ยังใช้เครดิต 40(1)",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary: 100_000,

                section40_1TaxWithheld:
                  10_000,

                /*
                * ค่าค้างใน state
                * ต้องไม่ถูกใช้เมื่อ
                * hasOtherIncome = false
                */
                section40_2TaxWithheld:
                  20_000,

                hasOtherIncome: false,

                otherIncome: {
                  commission: 100_000,
                  rent: 0,
                  professional: 0,
                  business: 0,
                  investment: 0,
                  other: 0,
                },

                detailedOtherIncome: {
                  section40_3: [
                    {
                      id: "annuity-hidden-wht",
                      incomeType: "annuity",
                      amount: 100_000,
                      taxWithheld: 30_000,
                    },
                  ],

                  section40_4Interest: [],
                  section40_4Dividend: [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],

                  section40_8: [
                    {
                      id: "business-hidden-wht",
                      amount: 100_000,
                      taxWithheld: 40_000,

                      category:
                        "standard60",

                      activityCode:
                        "hidden-business",

                      expenseMethod:
                        "standard",

                      actualExpense: 0,
                    },
                  ],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * ใช้เฉพาะ WHT ของ 40(1)
        *
        * 40(2) และ detailed income
        * ถูกปิดด้วย hasOtherIncome
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(10_000);

        expect(
          result.supportedIncome
            .section40_2
        ).toBe(0);

        expect(
          result.supportedIncome
            .section40_3Annuity
        ).toBe(0);

        expect(
          result.supportedIncome
            .section40_8
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "เงินบริจาคกองทัพอากาศตาม พ.ร.ฎ. 804 ใช้สิทธิ 1 เท่า",
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
                airForceStupaDonation:
                  50_000,
              }),
          });

        /*
        * ฐานก่อนบริจาค
        * = 1,040,000
        *
        * เพดาน 10%
        * = 104,000
        *
        * บริจาค 50,000
        * ใช้สิทธิ 1 เท่าเต็มจำนวน
        */
        expect(
          result.donationDeductions
            .airForceStupaDonation
            ?.paid
        ).toBe(50_000);

        expect(
          result.donationDeductions
            .airForceStupaDonation
            ?.allowed
        ).toBe(50_000);

        expect(
          result.donationDeductions
            .airForceStupaDonation
            ?.excess
        ).toBe(0);

        expect(
          result.donationDeductions
            .totalAllowed
        ).toBe(50_000);

        expect(
          result.taxableIncome
        ).toBe(990_000);
      }
    );

    it(
      "เงินบริจาคกองทัพอากาศตาม พ.ร.ฎ. 804 ใช้เพดาน 10% ร่วมกับเงินบริจาคทั่วไป",
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
                generalDonation:
                  80_000,

                airForceStupaDonation:
                  50_000,
              }),
          });

        /*
        * ฐานก่อนบริจาค
        * = 1,040,000
        *
        * เพดานรวม 10%
        * = 104,000
        *
        * General ใช้ก่อน
        * = 80,000
        *
        * เหลือพื้นที่
        * = 24,000
        *
        * Air Force จ่าย 50,000
        * ใช้ได้ 24,000
        */
        expect(
          result.donationDeductions
            .generalDonation.allowed
        ).toBe(80_000);

        expect(
          result.donationDeductions
            .airForceStupaDonation
            ?.allowed
        ).toBe(24_000);

        expect(
          result.donationDeductions
            .airForceStupaDonation
            ?.excess
        ).toBe(26_000);

        expect(
          result.donationDeductions
            .generalDonationLimit
        ).toBe(104_000);

        expect(
          result.donationDeductions
            .totalAllowed
        ).toBe(104_000);

        expect(
          result.taxableIncome
        ).toBe(936_000);
      }
    );

    it(
      "เงินได้ต่างประเทศ 40(1) นำเข้าไทยบางส่วน ให้ Engine คำนวณเฉพาะยอดที่นำเข้าและไม่ใช้ foreign tax เป็น WHT",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                section40_1ForeignIncome:
                  [
                    {
                      id:
                        "foreign-salary-us",

                      /*
                       * เงินได้เกิดขึ้นทั้งหมด
                       */
                      amount:
                        500_000,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        /*
                         * ปี 2569 นำเข้าไทย
                         * เพียง 200,000
                         */
                        remittedToThailandThisTaxYear:
                          200_000,

                        /*
                         * ภาษีต่างประเทศ
                         * ยังไม่ใช่ Thai WHT
                         * หรือ FTC ที่ใช้ได้ทันที
                         */
                        foreignIncomeTaxPaid:
                          50_000,

                        isThaiTaxResidentInIncomeYear:
                          true,

                        foreignTaxCreditDtaReview: {
                          isEligible: false,
                        },
                      },
                    },
                  ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
         * Engine ต้องเห็นเฉพาะ
         * taxable remittance 200,000
         *
         * ห้ามเอา amount เต็ม
         * 500,000 มาคำนวณ
         */
        expect(
          result.supportedIncome
            .section40_1
        ).toBe(200_000);

        expect(
          result.totalGrossIncome
        ).toBe(200_000);

        /*
         * 40(1)
         * 200,000 × 50%
         * = ค่าใช้จ่าย 100,000
         */
        expect(
          result.employmentExpense
        ).toBe(100_000);

        /*
         * 200,000
         * - ค่าใช้จ่าย 100,000
         * - ค่าลดหย่อนส่วนตัว 60,000
         * = 40,000
         */
        expect(
          result.taxableIncome
        ).toBe(40_000);

        /*
         * foreignIncomeTaxPaid
         * ต้องยังไม่ถูกนับเป็น
         * Thai withholding tax credit
         */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "foreign 40(3) rights ที่ remit บางส่วนให้ Engine ใช้ taxable remittance และ attributed expense",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                /*
                * ตั้งใจปิด domestic other income
                * เพื่อทดสอบว่า foreign taxable item
                * ยังถูกเปิดให้ Engine คำนวณได้
                */
                hasOtherIncome:
                  false,

                /*
                * legacy domestic data ค้างอยู่
                * ต้องไม่ถูกปลุกกลับมา
                */
                otherIncome: {
                  commission:
                    999_999,
                  rent: 0,
                  professional: 0,
                  business: 0,
                  investment: 0,
                  other: 0,
                },

                detailedOtherIncome: {
                  section40_3: [
                    {
                      id:
                        "foreign-rights-engine",

                      incomeType:
                        "rights",

                      amount:
                        500_000,

                      expenseMethod:
                        "actual",

                      actualExpense:
                        180_000,

                      taxWithheld:
                        0,

                      foreignSource: {
                        country:
                          "USA",

                        incomeTaxYear:
                          2568,

                        remittedToThailandThisTaxYear:
                          200_000,

                        /*
                        * ตั้งเป็น 0
                        * เพื่อแยก test นี้ออกจาก FTC/DTA
                        */
                        foreignIncomeTaxPaid:
                          0,

                        expenseAttributableToRemittance:
                          70_000,

                        isThaiTaxResidentInIncomeYear:
                          true,
                      },
                    },
                  ],

                  section40_4Interest:
                    [],
                  section40_4Dividend:
                    [],
                  section40_5: [],
                  section40_6: [],
                  section40_7: [],
                  section40_8: [],
                },
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * domestic legacy commission
        * ต้องยังถูกปิด
        */
        expect(
          result.supportedIncome
            .section40_2
        ).toBe(0);

        /*
        * Foreign Rights:
        * amount 500,000
        * remit taxable 200,000
        */
        expect(
          result.supportedIncome
            .section40_3Rights
        ).toBe(200_000);

        expect(
          result.totalGrossIncome
        ).toBe(200_000);

        /*
        * 200,000
        * - attributed expense 70,000
        * = 130,000
        */
        expect(
          result.incomeAfterExpenses
        ).toBe(130_000);

        /*
        * foreign tax ไม่ใช่ Thai WHT
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ใช้ได้ไม่เกิน Thai credit limitation รายประเทศ",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                /*
                * Domestic 40(1)
                * = 1,200,000
                */
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-vn-ftc",

                    /*
                    * Foreign income
                    * นำเข้าเต็มจำนวน
                    */
                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          true,

                        creditableForeignTaxPaidForRemittedIncome:
                          60_000,
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * K:
        * Domestic 1,200,000
        * + Foreign remitted 300,000
        * = 1,500,000
        */
        expect(
          result.totalGrossIncome
        ).toBe(1_500_000);

        /*
        * 1,500,000
        * - 40(1) expense 100,000
        * - personal allowance 60,000
        * = taxable income 1,340,000
        *
        * Thai tax L = 200,000
        */
        expect(
          result.taxableIncome
        ).toBe(1_340_000);

        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        const foreignTaxCredit =
          result.taxCredits
            .foreignTaxCredit;

        expect(
          foreignTaxCredit
        ).toBeDefined();

        expect(
          foreignTaxCredit
            ?.byCountry
        ).toHaveLength(1);

        /*
        * P
        * = N / K × L
        * = 300,000 / 1,500,000
        *   × 200,000
        * = 40,000
        *
        * Foreign tax = 60,000
        * ดังนั้น FTC ใช้ได้ 40,000
        */
        expect(
          foreignTaxCredit
            ?.byCountry[0]
            .thaiTaxCreditLimit
        ).toBe(40_000);

        expect(
          foreignTaxCredit
            ?.byCountry[0]
            .allowedCredit
        ).toBe(40_000);

        expect(
          foreignTaxCredit
            ?.byCountry[0]
            .disallowedCredit
        ).toBe(20_000);

        expect(
          foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(40_000);

        /*
        * ไม่มี Thai WHT
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(40_000);

        /*
        * 200,000 - FTC 40,000
        * = 160,000
        */
        expect(
          result.taxPayable
        ).toBe(160_000);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ใช้จำนวนหลัง DTA cap ก่อน Thai credit limitation",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-vn-dta-cap",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      /*
                      * จ่ายจริง 60,000
                      */
                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          true,

                        /*
                        * แต่หลัง DTA/treaty cap
                        * ใช้พิจารณา FTC ได้เพียง 25,000
                        */
                        creditableForeignTaxPaidForRemittedIncome:
                          25_000,
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Thai limitation P
        * = 300,000 / 1,500,000
        *   × 200,000
        * = 40,000
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.byCountry[0]
            .thaiTaxCreditLimit
        ).toBe(40_000);

        /*
        * DTA cap = 25,000
        * ต่ำกว่า P = 40,000
        * ดังนั้นใช้ได้ 25,000
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.byCountry[0]
            .allowedCredit
        ).toBe(25_000);

        /*
        * foreign tax จ่ายจริง 60,000
        * ใช้ได้ 25,000
        * ใช้ไม่ได้ 35,000
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.byCountry[0]
            .disallowedCredit
        ).toBe(35_000);

        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(25_000);

        expect(
          result.taxCredits.total
        ).toBe(25_000);

        expect(
          result.taxPayable
        ).toBe(175_000);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ไม่สร้าง tax refund เอง",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-refund-guard",

                    amount:
                      500_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        500_000,

                      foreignIncomeTaxPaid:
                        200_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          true,

                        creditableForeignTaxPaidForRemittedIncome:
                          200_000,
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * 500,000
        * - ค่าใช้จ่าย 40(1) 100,000
        * - ค่าลดหย่อนส่วนตัว 60,000
        * = taxable income 340,000
        *
        * ภาษี = 11,500
        */
        expect(
          result.taxBeforeCredits
        ).toBe(11_500);

        /*
        * N = K = 500,000
        * ดังนั้น P = L = 11,500
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.byCountry[0]
            .thaiTaxCreditLimit
        ).toBe(11_500);

        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(11_500);

        /*
        * FTC ลดภาษีได้ถึง 0
        * แต่ห้ามกลายเป็นเงินคืน
        */
        expect(
          result.taxPayable
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Thai withholding tax ยังสร้าง refund ได้หลังหัก Foreign Tax Credit",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                /*
                * Domestic salary
                * 1,200,000
                *
                * Thai WHT = 180,000
                */
                monthlySalary:
                  100_000,

                section40_1TaxWithheld:
                  180_000,

                /*
                * Foreign income
                * remitted = 300,000
                */
                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-with-wht",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          true,

                        creditableForeignTaxPaidForRemittedIncome:
                          60_000,
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * K = 1,500,000
        * taxable income = 1,340,000
        * L = 200,000
        */
        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        /*
        * FTC limitation:
        * 300,000 / 1,500,000 × 200,000
        * = 40,000
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(40_000);

        /*
        * หลัง FTC:
        * 200,000 - 40,000
        * = 160,000
        */
        expect(
          result.taxCredits
            .withholdingTax
        ).toBe(180_000);

        expect(
          result.taxCredits.total
        ).toBe(220_000);

        /*
        * Thai WHT 180,000
        * มากกว่าภาษีหลัง FTC 160,000
        *
        * refund = 20,000
        *
        * ส่วน FTC 40,000
        * ไม่ได้กลายเป็น refund
        */
        expect(
          result.taxPayable
        ).toBe(0);

        expect(
          result.taxRefund
        ).toBe(20_000);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ยังไม่ complete เมื่อยังไม่มีผล DTA review",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-no-dta-review",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      /*
                      * ตั้งใจไม่ใส่
                      * foreignTaxCreditDtaReview
                      */
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Foreign income ยัง taxable
        * และถูกนำเข้า Engine ตามปกติ
        */
        expect(
          result.totalGrossIncome
        ).toBe(1_500_000);

        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        /*
        * แต่ยังไม่มี DTA decision
        * จึงห้ามเดา FTC
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(0);

        /*
        * ภาษียังไม่ถูกลดด้วย FTC
        */
        expect(
          result.taxPayable
        ).toBe(200_000);

        expect(
          result.taxRefund
        ).toBe(0);

        /*
        * ผลรวมยัง preliminary
        * เพราะ DTA review ไม่ครบ
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.isComplete
        ).toBe(false);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "ไม่มีภาษีต่างประเทศ ไม่ต้องบังคับ DTA review และ Engine ยัง complete",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-zero-foreign-tax",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        0,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      /*
                      * ไม่มีภาษีต่างประเทศ
                      * จึงตั้งใจไม่ใส่
                      * foreignTaxCreditDtaReview
                      */
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Foreign income ยัง taxable
        * และรวมในฐานภาษีไทยตามปกติ
        */
        expect(
          result.totalGrossIncome
        ).toBe(1_500_000);

        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        /*
        * ไม่มี foreign tax
        * จึงไม่มี FTC ให้ใช้
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(0);

        expect(
          result.taxPayable
        ).toBe(200_000);

        expect(
          result.taxRefund
        ).toBe(0);

        /*
        * จุด regression สำคัญ:
        * foreign tax = 0
        * ไม่ต้องบังคับ DTA review
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.isComplete
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ที่ตรวจแล้วว่าไม่มีสิทธิ ให้ complete แต่ FTC = 0",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-ineligible",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          false,
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        /*
        * Foreign income ยัง taxable
        * ตาม remittance rule
        */
        expect(
          result.totalGrossIncome
        ).toBe(1_500_000);

        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        /*
        * ตรวจ DTA แล้วว่าไม่มีสิทธิ
        * จึงไม่มี FTC
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(0);

        expect(
          result.taxPayable
        ).toBe(200_000);

        expect(
          result.taxRefund
        ).toBe(0);

        /*
        * ต่างจากกรณียังไม่ได้ตรวจ:
        * review เสร็จแล้ว
        * จึงถือว่า FTC complete
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.isComplete
        ).toBe(true);

        expect(
          result.isComplete
        ).toBe(true);
      }
    );

    it(
      "Foreign Tax Credit ยังไม่ complete เมื่อมีสิทธิแต่ยังไม่ทราบจำนวนหลัง DTA cap",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,

                section40_1ForeignIncome: [
                  {
                    id:
                      "foreign-salary-eligible-unknown-cap",

                    amount:
                      300_000,

                    foreignSource: {
                      country:
                        "Vietnam",

                      incomeTaxYear:
                        2568,

                      remittedToThailandThisTaxYear:
                        300_000,

                      foreignIncomeTaxPaid:
                        60_000,

                      isThaiTaxResidentInIncomeYear:
                        true,

                      foreignTaxCreditDtaReview: {
                        isEligible:
                          true,

                        /*
                        * ตั้งใจยังไม่ระบุ
                        * creditableForeignTaxPaidForRemittedIncome
                        */
                      },
                    },
                  },
                ],
              }),

            family:
              createFamily(),

            deductions:
              createDeductions(),
          });

        expect(
          result.totalGrossIncome
        ).toBe(1_500_000);

        expect(
          result.taxBeforeCredits
        ).toBe(200_000);

        /*
        * มีสิทธิ แต่ยังไม่รู้ DTA-creditable amount
        * ห้ามใช้ foreign tax 60,000 เต็มก้อนแทน
        */
        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.totalAllowedCredit
        ).toBe(0);

        expect(
          result.taxCredits.total
        ).toBe(0);

        expect(
          result.taxPayable
        ).toBe(200_000);

        expect(
          result.taxRefund
        ).toBe(0);

        expect(
          result.taxCredits
            .foreignTaxCredit
            ?.isComplete
        ).toBe(false);

        expect(
          result.isComplete
        ).toBe(false);
      }
    );

    it(
      "ตรวจสิทธิลดหย่อนบุตรของผู้มีเงินได้ที่ไม่เป็นผู้อยู่ในประเทศไทยตามเงื่อนไขอยู่ไทย 180 วัน",
      () => {
        const childBase = {
          id: "non-resident-child",
          relationship: "legal" as const,
          birthYearBE: 2560,
          studyingHigherEducation: false,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                children: [
                  {
                    ...childBase,
                    stayedInThailand180Days:
                      true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances.children
        ).toBe(30_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const ineligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                children: [
                  {
                    ...childBase,
                    stayedInThailand180Days:
                      false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          ineligibleResult
            .familyAllowances.children
        ).toBe(0);

        expect(
          ineligibleResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                children: [
                  {
                    ...childBase,
                    stayedInThailand180Days:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances.children
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "บุตรอยู่ในประเทศไทยตั้งแต่ 180 วันขึ้นไป"
              )
          )
        ).toBe(true);
      }
    );
    
    it(
      "ตรวจสิทธิลดหย่อนผู้พิการหรือทุพพลภาพของผู้มีเงินได้ที่ไม่เป็นผู้อยู่ในประเทศไทยตามเงื่อนไขอยู่ไทย 180 วัน",
      () => {
        const dependentBase = {
          id: "non-resident-disabled-dependent",
          type: "disabled" as const,
          relation: "father" as const,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: false,
          hasRequiredEvidence: true,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                disabledDependents: [
                  {
                    ...dependentBase,
                    stayedInThailand180Days:
                      true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances
            .disabledDependents
        ).toBe(60_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const ineligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                disabledDependents: [
                  {
                    ...dependentBase,
                    stayedInThailand180Days:
                      false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          ineligibleResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          ineligibleResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                disabledDependents: [
                  {
                    ...dependentBase,
                    stayedInThailand180Days:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "ผู้พิการหรือทุพพลภาพที่อยู่ในความอุปการะอยู่ในประเทศไทยตั้งแต่ 180 วันขึ้นไป"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ตรวจสิทธิลดหย่อนผู้พิการหรือทุพพลภาพกรณีมีผู้มีเงินได้คนอื่นใช้สิทธิบุคคลเดียวกัน",
      () => {
        const dependentBase = {
          id: "disabled-other-claim",
          type: "disabled" as const,
          relation: "father" as const,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          hasRequiredEvidence: true,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    claimedByOtherTaxpayer:
                      false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances
            .disabledDependents
        ).toBe(60_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const claimedByOtherResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    claimedByOtherTaxpayer:
                      true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          claimedByOtherResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          claimedByOtherResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    claimedByOtherTaxpayer:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "มีผู้มีเงินได้คนอื่นใช้สิทธิลดหย่อนผู้พิการหรือทุพพลภาพบุคคลนี้แล้วหรือไม่"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ตรวจสิทธิลดหย่อนผู้พิการหรือทุพพลภาพตามสถานะหลักฐานประกอบ",
      () => {
        const dependentBase = {
          id: "disabled-evidence",
          type: "disabled" as const,
          relation: "father" as const,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: false,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    hasRequiredEvidence:
                      true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances
            .disabledDependents
        ).toBe(60_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const noEvidenceResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    hasRequiredEvidence:
                      false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          noEvidenceResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          noEvidenceResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: true,

                disabledDependents: [
                  {
                    ...dependentBase,
                    hasRequiredEvidence:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances
            .disabledDependents
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "มีหลักฐานสำหรับใช้สิทธิลดหย่อนครบตามเงื่อนไขหรือไม่"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ไม่บังคับตอบเงื่อนไขอยู่ไทย 180 วันเมื่อบุตรเกินเกณฑ์อายุและไม่มีสิทธิลดหย่อนอยู่แล้ว",
      () => {
        const result =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                children: [
                  {
                    id: "ineligible-age-child",
                    relationship: "legal",
                    birthYearBE: 2539,
                    studyingHigherEducation: false,
                    annualAssessableIncome: 0,
                    supportedByTaxpayer: true,
                    stayedInThailand180Days:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          result.familyAllowances.children
        ).toBe(0);

        expect(
          result.isComplete
        ).toBe(true);

        expect(
          result.warnings.some(
            (warning) =>
              warning.includes(
                "บุตรอยู่ในประเทศไทยตั้งแต่ 180 วันขึ้นไป"
              )
          )
        ).toBe(false);
      }
    );

    it(
      "ตรวจสิทธิลดหย่อนบุพการีกรณีมีผู้มีเงินได้คนอื่นใช้สิทธิบุพการีคนเดียวกัน",
      () => {
        const parentBase = {
          id: "parent-other-claim",
          owner: "taxpayer" as const,
          relation: "father" as const,
          birthYearBE: 2500,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    claimedByOtherTaxpayer:
                      false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const claimedByOtherResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    claimedByOtherTaxpayer:
                      true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          claimedByOtherResult
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          claimedByOtherResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    claimedByOtherTaxpayer:
                      null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "มีผู้มีเงินได้คนอื่นใช้สิทธิลดหย่อนบุพการีคนนี้แล้วหรือไม่"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "ตรวจเงื่อนไขอายุ 60 ปีของบุพการีและรองรับข้อมูลเก่าที่มีเฉพาะปีเกิด",
      () => {
        const parentBase = {
          id: "parent-age-condition",
          owner: "taxpayer" as const,
          relation: "father" as const,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: false,
        };

        const eligibleResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    birthYearBE: null,
                    age60OrOlder: true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          eligibleResult
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          eligibleResult.isComplete
        ).toBe(true);

        const underAgeResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    birthYearBE: 2500,
                    age60OrOlder: false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          underAgeResult
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          underAgeResult.isComplete
        ).toBe(true);

        const incompleteResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    birthYearBE: 2500,
                    age60OrOlder: null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteResult
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          incompleteResult.isComplete
        ).toBe(false);

        expect(
          incompleteResult.warnings.some(
            (warning) =>
              warning.includes(
                "บิดาหรือมารดาอายุ 60 ปีขึ้นไปหรือไม่"
              )
          )
        ).toBe(true);

        const legacyResult =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                parents: [
                  {
                    ...parentBase,
                    birthYearBE: 2500,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          legacyResult
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          legacyResult.isComplete
        ).toBe(true);
      }
    );

    it(
      "ตรวจค่าลดหย่อนคู่สมรสกรณีหย่าหรือคู่สมรสเสียชีวิตภายในปีภาษี",
      () => {
        const divorcedEligible =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",
                marriageEndedThisTaxYear: true,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          divorcedEligible
            .familyAllowances
            .spouse
        ).toBe(60_000);

        expect(
          divorcedEligible.isComplete
        ).toBe(true);

        const widowedEligible =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "widowed",
                marriageEndedThisTaxYear: true,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          widowedEligible
            .familyAllowances
            .spouse
        ).toBe(60_000);

        expect(
          widowedEligible.isComplete
        ).toBe(true);

        const endedBeforeTaxYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",
                marriageEndedThisTaxYear: false,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  null,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          endedBeforeTaxYear
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          endedBeforeTaxYear.isComplete
        ).toBe(true);

        const formerSpouseHasIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "widowed",
                marriageEndedThisTaxYear: true,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  true,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          formerSpouseHasIncome
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          formerSpouseHasIncome.isComplete
        ).toBe(true);

        const incompleteTiming =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",
                marriageEndedThisTaxYear: null,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  null,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteTiming
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          incompleteTiming.isComplete
        ).toBe(false);

        expect(
          incompleteTiming.warnings.some(
            (warning) =>
              warning.includes(
                "การสมรสสิ้นสุดภายในปีภาษีนี้หรือไม่"
              )
          )
        ).toBe(true);

        const incompleteFormerSpouseIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "widowed",
                marriageEndedThisTaxYear: true,
                formerSpouseHadAssessableIncomeThisTaxYear:
                  null,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          incompleteFormerSpouseIncome
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          incompleteFormerSpouseIncome
            .isComplete
        ).toBe(false);

        expect(
          incompleteFormerSpouseIncome
            .warnings
            .some(
              (warning) =>
                warning.includes(
                  "อดีตคู่สมรสมีเงินได้พึงประเมินในปีภาษีนี้หรือไม่"
                )
            )
        ).toBe(true);
      }
    );

    it(
      "ตรวจคำตอบเงินได้คู่สมรสและรองรับข้อมูลเก่า",
      () => {
        /*
        * ผู้ใช้ใหม่:
        * เลือกสมรสแล้ว แต่ยังไม่ตอบ
        */
        const unanswered =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: false,

                spouseHasAssessableIncome:
                  null,

                marriedFullTaxYear: false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          unanswered
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          unanswered.isComplete
        ).toBe(false);

        expect(
          unanswered.warnings.some(
            (warning) =>
              warning.includes(
                "คู่สมรสมีเงินได้พึงประเมินหรือไม่"
              )
          )
        ).toBe(true);

        /*
        * ตอบว่าไม่มีเงินได้
        *
        * marriedFullTaxYear = false
        * ต้องยังได้ค่าลดหย่อนคู่สมรส
        * เพราะ basic spouse allowance
        * ไม่ได้กำหนดว่าต้องสมรสตลอดปี
        */
        const noIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: false,

                spouseHasAssessableIncome:
                  false,

                marriedFullTaxYear: false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          noIncome
            .familyAllowances
            .spouse
        ).toBe(60_000);

        expect(
          noIncome.isComplete
        ).toBe(true);

        /*
        * ตอบว่ามีเงินได้
        */
        const hasIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: true,

                spouseHasAssessableIncome:
                  true,

                marriedFullTaxYear: false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          hasIncome
            .familyAllowances
            .spouse
        ).toBe(0);

        expect(
          hasIncome.isComplete
        ).toBe(true);

        /*
        * legacy localStorage:
        * ยังไม่มี spouseHasAssessableIncome
        * ต้อง fallback ไป spouseHasIncome
        */
        const legacyNoIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: false,

                spouseHasAssessableIncome:
                  undefined,

                marriedFullTaxYear: false,
              }),

            deductions:
              createDeductions(),
          });

        expect(
          legacyNoIncome
            .familyAllowances
            .spouse
        ).toBe(60_000);

        expect(
          legacyNoIncome.isComplete
        ).toBe(true);
      }
    );

    it(
      "ตรวจสถานะสมรสตลอดปีเฉพาะเมื่อใช้สิทธิเบี้ยประกันชีวิตคู่สมรส",
      () => {
        const unanswered =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",
                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,
                marriedFullTaxYear: null,
              }),

            deductions:
              createDeductions({
                spouseLifeInsurance:
                  20_000,
              }),
          });

        expect(
          unanswered
            .insuranceDeductions
            .spouseLifeInsurance
            .allowed
        ).toBe(0);

        expect(
          unanswered.isComplete
        ).toBe(false);

        expect(
          unanswered.warnings.some(
            (warning) =>
              warning.includes(
                "สถานะสมรสตลอดปีภาษีนี้หรือไม่"
              )
          )
        ).toBe(true);

        /*
        * ตอบว่าไม่ได้สมรสตลอดปี
        * ข้อมูลครบ แต่ใช้เบี้ยไม่ได้
        */
        const notFullYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",
                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,
                marriedFullTaxYear: false,
              }),

            deductions:
              createDeductions({
                spouseLifeInsurance:
                  20_000,
              }),
          });

        expect(
          notFullYear
            .insuranceDeductions
            .spouseLifeInsurance
            .allowed
        ).toBe(0);

        expect(
          notFullYear.isComplete
        ).toBe(true);

        /*
        * สมรสตลอดปี
        * ใช้ได้สูงสุด 10,000
        */
        const fullYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",
                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,
                marriedFullTaxYear: true,
              }),

            deductions:
              createDeductions({
                spouseLifeInsurance:
                  20_000,
              }),
          });

        expect(
          fullYear
            .insuranceDeductions
            .spouseLifeInsurance
            .allowed
        ).toBe(10_000);

        expect(
          fullYear.isComplete
        ).toBe(true);

        /*
        * ไม่ได้กรอกเบี้ยคู่สมรส
        * ไม่จำเป็นต้องตอบคำถามสมรสตลอดปี
        */
        const noSpousePremium =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",
                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,
                marriedFullTaxYear: null,
              }),

            deductions:
              createDeductions({
                spouseLifeInsurance: 0,
              }),
          });

        expect(
          noSpousePremium.isComplete
        ).toBe(true);
      }
    );

    it(
      "ตรวจสิทธิลดหย่อนบิดามารดาของคู่สมรสตามสถานภาพสมรส",
      () => {
        const spouseParent = {
          id: "spouse-parent-marital-condition",
          owner: "spouse" as const,
          relation: "father" as const,
          birthYearBE: null,
          age60OrOlder: true,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: false,
        };

        /*
        * 1. ยังสมรสอยู่
        * คู่สมรสไม่มีเงินได้
        */
        const marriedNoIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          marriedNoIncome
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          marriedNoIncome.isComplete
        ).toBe(true);

        /*
        * 2. หย่าภายในปีภาษี
        * อดีตคู่สมรสไม่มีเงินได้
        */
        const divorcedThisYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",

                marriageEndedThisTaxYear:
                  true,

                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          divorcedThisYear
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          divorcedThisYear.isComplete
        ).toBe(true);

        /*
        * 3. คู่สมรสเสียชีวิตภายในปีภาษี
        * คู่สมรสไม่มีเงินได้
        */
        const widowedThisYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "widowed",

                marriageEndedThisTaxYear:
                  true,

                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          widowedThisYear
            .familyAllowances
            .parents
        ).toBe(30_000);

        expect(
          widowedThisYear.isComplete
        ).toBe(true);

        /*
        * 4. การสมรสสิ้นสุดก่อนปีภาษี
        * ไม่มีสิทธิพ่อแม่อดีตคู่สมรสแล้ว
        */
        const endedBeforeTaxYear =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",

                marriageEndedThisTaxYear:
                  false,

                formerSpouseHadAssessableIncomeThisTaxYear:
                  null,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          endedBeforeTaxYear
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          endedBeforeTaxYear.isComplete
        ).toBe(true);

        /*
        * 5. ยังสมรสอยู่
        * แต่คู่สมรสมีเงินได้
        */
        const marriedHasIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "married",

                spouseHasIncome: true,
                spouseHasAssessableIncome:
                  true,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          marriedHasIncome
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          marriedHasIncome.isComplete
        ).toBe(true);

        /*
        * 6. หย่าในปีนี้
        * แต่อดีตคู่สมรสมีเงินได้
        */
        const formerSpouseHasIncome =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome(),

            family:
              createFamily({
                maritalStatus: "divorced",

                marriageEndedThisTaxYear:
                  true,

                formerSpouseHadAssessableIncomeThisTaxYear:
                  true,

                parents: [
                  spouseParent,
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          formerSpouseHasIncome
            .familyAllowances
            .parents
        ).toBe(0);

        expect(
          formerSpouseHasIncome.isComplete
        ).toBe(true);
      }
    );

    it(
      "non-resident ใช้ค่าลดหย่อนบุพการีได้เฉพาะบิดามารดาที่อยู่ในประเทศไทย",
      () => {
        const parentBase = {
          id: "parent-thailand-residence",
          owner: "taxpayer" as const,
          relation: "father" as const,

          birthYearBE: null,
          age60OrOlder: true,

          annualAssessableIncome: 0,

          supportedByTaxpayer: true,

          claimedByOtherTaxpayer: false,
        };

        /*
        * 1. อยู่ในประเทศไทย
        * ใช้สิทธิ 30,000
        */
        const inThailand =
          calculateTax({
            taxYear: 2569,

            income: createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: true,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          inThailand
            .familyAllowances.parents
        ).toBe(30_000);

        expect(
          inThailand.isComplete
        ).toBe(true);

        /*
        * 2. ไม่อยู่ในประเทศไทย
        * ไม่มีสิทธิ
        */
        const outsideThailand =
          calculateTax({
            taxYear: 2569,

            income: createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: false,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          outsideThailand
            .familyAllowances.parents
        ).toBe(0);

        expect(
          outsideThailand.isComplete
        ).toBe(true);

        /*
        * 3. ผู้ใช้ใหม่ยังไม่ได้ตอบ
        * ยังไม่ให้สิทธิ + incomplete
        */
        const unanswered =
          calculateTax({
            taxYear: 2569,

            income: createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: null,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          unanswered
            .familyAllowances.parents
        ).toBe(0);

        expect(
          unanswered.isComplete
        ).toBe(false);

        expect(
          unanswered.warnings
        ).toContain(
          "กรุณาระบุว่าบิดาหรือมารดาอยู่ในประเทศไทยหรือไม่"
        );

        /*
        * 4. legacy localStorage
        * ไม่มี field isInThailand
        *
        * รักษา behavior เดิมไว้
        */
        const legacy =
          calculateTax({
            taxYear: 2569,

            income: createIncome(),

            family:
              createFamily({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                  },
                ],
              }),

            deductions:
              createDeductions(),
          });

        expect(
          legacy
            .familyAllowances.parents
        ).toBe(30_000);

        expect(
          legacy.isComplete
        ).toBe(true);
      }
    );

    it(
      "Parent Health detailed ถือว่า incomplete เมื่อยังไม่ได้เลือกบิดาหรือมารดา หรือ parentId หาไม่พบ",
      () => {
        const parent = {
          id: "parent-health-existing",
          owner: "taxpayer" as const,
          relation: "father" as const,

          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,
          supportedByTaxpayer: true,

          /*
          * จงใจ true เพื่อไม่ให้
          * completeness ของค่าลดหย่อน
          * บุพการี 30,000 เข้ามาเกี่ยว
          */
          claimedByOtherTaxpayer: true,

          isInThailand: true,
        };

        /*
        * ยังไม่ได้เลือก parent
        */
        const missingParentId =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary: 100_000,
              }),

            family:
              createFamily({
                parents: [parent],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-missing-parent",

                      parentId: null,

                      premiumPaidThisYear:
                        10_000,

                      jointPayerCount: 1,
                    },
                  ],
              }),
          });

        expect(
          missingParentId.isComplete
        ).toBe(false);

        expect(
          missingParentId.warnings
        ).toContain(
          "กรุณากรอกข้อมูลเบี้ยประกันสุขภาพบิดา/มารดาให้ครบ โดยเลือกบิดาหรือมารดาและระบุจำนวนผู้มีเงินได้ที่ร่วมจ่าย"
        );

        /*
        * parentId เคยมี
        * แต่ parent ถูกลบจาก Family
        */
        const deletedParent =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary: 100_000,
              }),

            family:
              createFamily({
                parents: [parent],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-deleted-parent",

                      parentId:
                        "deleted-parent-id",

                      premiumPaidThisYear:
                        10_000,

                      jointPayerCount: 1,
                    },
                  ],
              }),
          });

        expect(
          deletedParent.isComplete
        ).toBe(false);

        expect(
          deletedParent.warnings
        ).toContain(
          "กรุณากรอกข้อมูลเบี้ยประกันสุขภาพบิดา/มารดาให้ครบ โดยเลือกบิดาหรือมารดาและระบุจำนวนผู้มีเงินได้ที่ร่วมจ่าย"
        );
      }
    );

    it(
      "Parent Health detailed ถือว่า incomplete เมื่อจำนวนผู้ร่วมจ่ายไม่สมบูรณ์",
      () => {
        const parent = {
          id: "parent-health-payer",

          owner: "taxpayer" as const,
          relation: "mother" as const,

          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,
          supportedByTaxpayer: true,

          claimedByOtherTaxpayer: true,

          isInThailand: true,
        };

        for (
          const jointPayerCount of
            [null, 0, 1.5]
        ) {
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
                  parents: [
                    parent,
                  ],
                }),

              deductions:
                createDeductions({
                  parentHealthInsurancePolicies:
                    [
                      {
                        id:
                          `policy-${String(
                            jointPayerCount
                          )}`,

                        parentId:
                          parent.id,

                        premiumPaidThisYear:
                          12_000,

                        jointPayerCount,
                      },
                    ],
                }),
            });

          expect(
            result.isComplete
          ).toBe(false);

          expect(
            result.warnings
          ).toContain(
            "กรุณากรอกข้อมูลเบี้ยประกันสุขภาพบิดา/มารดาให้ครบ โดยเลือกบิดาหรือมารดาและระบุจำนวนผู้มีเงินได้ที่ร่วมจ่าย"
          );
        }

        /*
        * จำนวนผู้ร่วมจ่ายถูกต้อง
        */
        const complete =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                parents: [parent],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id:
                        "policy-valid-payer",

                      parentId:
                        parent.id,

                      premiumPaidThisYear:
                        12_000,

                      jointPayerCount: 2,
                    },
                  ],
              }),
          });

        expect(
          complete.isComplete
        ).toBe(true);

        expect(
          complete
            .insuranceDeductions
            .parentHealthInsurance
            .allowed
        ).toBe(6_000);
      }
    );

    it(
      "Parent Health ของ non-resident บังคับตอบที่อยู่ในประเทศไทยแม้บุพการีอายุต่ำกว่า 60 ปี",
      () => {
        const parentBase = {
          id: "parent-health-nonresident",

          owner: "taxpayer" as const,
          relation: "father" as const,

          /*
          * ต่ำกว่า 60 ปีก็ยังเป็น
          * Parent Health ได้
          */
          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,
          supportedByTaxpayer: true,

          claimedByOtherTaxpayer: true,
        };

        const policy = {
          id: "policy-nonresident",

          parentId:
            parentBase.id,

          premiumPaidThisYear:
            10_000,

          jointPayerCount: 1,
        };

        /*
        * ยังไม่ได้ตอบ
        */
        const unanswered =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                isThaiTaxResident:
                  false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: null,
                  },
                ],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [policy],
              }),
          });

        expect(
          unanswered.isComplete
        ).toBe(false);

        expect(
          unanswered.warnings
        ).toContain(
          "กรุณาระบุว่าบิดาหรือมารดาอยู่ในประเทศไทยหรือไม่"
        );

        expect(
          unanswered
            .insuranceDeductions
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        /*
        * อยู่ประเทศไทย
        */
        const inThailand =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                isThaiTaxResident:
                  false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: true,
                  },
                ],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [policy],
              }),
          });

        expect(
          inThailand.isComplete
        ).toBe(true);

        expect(
          inThailand
            .insuranceDeductions
            .parentHealthInsurance
            .allowed
        ).toBe(10_000);

        /*
        * อยู่นอกประเทศไทย
        *
        * ข้อมูลครบ แต่ไม่มีสิทธิ
        */
        const outsideThailand =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                isThaiTaxResident:
                  false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: false,
                  },
                ],
              }),

            deductions:
              createDeductions({
                parentHealthInsurancePolicies:
                  [policy],
              }),
          });

        expect(
          outsideThailand.isComplete
        ).toBe(true);

        expect(
          outsideThailand
            .insuranceDeductions
            .parentHealthInsurance
            .allowed
        ).toBe(0);
      }
    );

    it(
      "Parent Health detailed ไม่บังคับ field ใหม่เมื่อไม่มีเบี้ย และยังรองรับ legacy localStorage",
      () => {
        /*
        * detailed row ใหม่
        * แต่ premium = 0
        *
        * parentId / payer count
        * ยังว่างได้โดยไม่ทำให้ incomplete
        */
        const zeroPremium =
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
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "empty-policy",

                      parentId: null,

                      premiumPaidThisYear: 0,

                      jointPayerCount: null,
                    },
                  ],
              }),
          });

        expect(
          zeroPremium.isComplete
        ).toBe(true);

        /*
        * legacy localStorage:
        * ไม่มี parentHealthInsurancePolicies
        */
        const legacyParent = {
          id: "legacy-parent-health",

          owner: "taxpayer" as const,
          relation: "mother" as const,

          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,
          supportedByTaxpayer: true,

          claimedByOtherTaxpayer: true,

          /*
          * legacy parent ไม่มี
          * isInThailand ได้
          */
        };

        const legacy =
          calculateTax({
            taxYear: 2569,

            income:
              createIncome({
                monthlySalary:
                  100_000,
              }),

            family:
              createFamily({
                isThaiTaxResident:
                  false,

                parents: [
                  legacyParent,
                ],
              }),

            deductions:
              createDeductions({
                parentHealthInsurance:
                  10_000,

                /*
                * จงใจไม่ใส่
                * parentHealthInsurancePolicies
                */
              }),
          });

        expect(
          legacy.isComplete
        ).toBe(true);

        expect(
          legacy
            .insuranceDeductions
            .parentHealthInsurance
            .allowed
        ).toBe(10_000);
      }
    );

  });