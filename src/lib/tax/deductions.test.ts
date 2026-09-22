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

function family(
  values: Partial<FamilyData> = {}
): FamilyData {
  return {
    taxpayerAge65OrOlder: null,
    isThaiTaxResident: null,

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

    it(
      "ตรวจสิทธิเบี้ยประกันสุขภาพบิดามารดาของคู่สมรสตามสถานภาพสมรส",
      () => {
        const spouseParent = {
          id: "spouse-parent-health",
          owner: "spouse" as const,
          relation: "father" as const,
          birthYearBE: null,
          age60OrOlder: null,
          annualAssessableIncome: 0,
          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: false,
        };

        /*
        * 1. ยังสมรสอยู่
        * แม้คู่สมรสมีเงินได้ ก็ยังใช้สิทธิได้
        */
        const marriedSpouseHasIncome =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  20_000,
              }),

            family:
              family({
                maritalStatus: "married",

                spouseHasIncome: true,
                spouseHasAssessableIncome:
                  true,

                parents: [
                  spouseParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          marriedSpouseHasIncome
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        const marriedSpouseNoIncome =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  20_000,
              }),

            family:
              family({
                maritalStatus: "married",

                spouseHasIncome: false,
                spouseHasAssessableIncome:
                  false,

                parents: [
                  spouseParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          marriedSpouseNoIncome
            .parentHealthInsurance
            .allowed
        ).toBe(15_000);

        /*
        * 2. หย่าภายในปีภาษี
        */
        const divorcedThisYear =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  12_000,
              }),

            family:
              family({
                maritalStatus: "divorced",

                marriageEndedThisTaxYear:
                  true,

                parents: [
                  spouseParent,
                ],

                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          divorcedThisYear
            .parentHealthInsurance
            .allowed
        ).toBe(12_000);

        /*
        * 3. คู่สมรสเสียชีวิตภายในปีภาษี
        */
        const widowedThisYear =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                maritalStatus: "widowed",

                marriageEndedThisTaxYear:
                  true,

                parents: [
                  spouseParent,
                ],

                formerSpouseHadAssessableIncomeThisTaxYear:
                  false,
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          widowedThisYear
            .parentHealthInsurance
            .allowed
        ).toBe(15_000);

        /*
        * 4. การสมรสสิ้นสุดก่อนปีภาษี
        */
        const endedBeforeTaxYear =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                maritalStatus: "divorced",

                marriageEndedThisTaxYear:
                  false,

                parents: [
                  spouseParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          endedBeforeTaxYear
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        /*
        * 5. พ่อแม่มีเงินได้เกิน 30,000
        * ไม่มีสิทธิ
        */
        const parentIncomeTooHigh =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                maritalStatus: "married",

                spouseHasAssessableIncome:
                  false,

                parents: [
                  {
                    ...spouseParent,
                    annualAssessableIncome:
                      30_001,
                  },
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          parentIncomeTooHigh
            .parentHealthInsurance
            .allowed
        ).toBe(0);
      }
    );

    it(
      "non-resident ใช้เบี้ยประกันสุขภาพบิดามารดาได้เฉพาะกรณีบิดามารดาอยู่ในประเทศไทย",
      () => {
        const parentBase = {
          id: "parent-health-thailand",
          owner: "taxpayer" as const,
          relation: "father" as const,

          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,

          supportedByTaxpayer: true,

          claimedByOtherTaxpayer: true,
        };

        /*
        * 1. อยู่ในประเทศไทย
        * ใช้สิทธิได้
        *
        * จงใจตั้ง age < 60
        * และ claimedByOtherTaxpayer = true
        * เพื่อยืนยันว่า 2 field นี้
        * ไม่ใช่เงื่อนไขของ parent health
        */
        const inThailand =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  20_000,
              }),

            family:
              family({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: true,
                  },
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          inThailand
            .parentHealthInsurance
            .allowed
        ).toBe(15_000);

        /*
        * 2. ไม่อยู่ในประเทศไทย
        * ไม่มีสิทธิ
        */
        const outsideThailand =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: false,
                  },
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          outsideThailand
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        /*
        * 3. ผู้ใช้ใหม่ยังไม่ได้ตอบ
        * ยังไม่ให้สิทธิ
        */
        const unanswered =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                    isInThailand: null,
                  },
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          unanswered
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        /*
        * 4. legacy localStorage
        * ไม่มี field isInThailand
        *
        * รักษา behavior เดิม
        */
        const legacy =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,
              }),

            family:
              family({
                isThaiTaxResident: false,

                parents: [
                  {
                    ...parentBase,
                  },
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          legacy
            .parentHealthInsurance
            .allowed
        ).toBe(15_000);
      }
    );

    it(
      "คำนวณเบี้ยประกันสุขภาพบิดามารดาจากรายการแบบละเอียดและเฉลี่ยตามจำนวนผู้ร่วมจ่าย",
      () => {
        const eligibleParent = {
          id: "parent-health-policy",
          owner: "taxpayer" as const,
          relation: "father" as const,

          birthYearBE: null,
          age60OrOlder: false,

          annualAssessableIncome: 0,

          supportedByTaxpayer: true,
          claimedByOtherTaxpayer: true,

          isInThailand: true,
        };

        /*
        * 1. จ่ายคนเดียว
        * 12,000 / 1 = 12,000
        */
        const singlePayer =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  99_999,

                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-1",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        12_000,

                      jointPayerCount: 1,
                    },
                  ],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          singlePayer
            .parentHealthInsurance
            .paid
        ).toBe(12_000);

        expect(
          singlePayer
            .parentHealthInsurance
            .allowed
        ).toBe(12_000);

        /*
        * 2. ร่วมจ่าย 2 คน
        * 12,000 / 2 = 6,000
        */
        const twoPayers =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-2",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        12_000,

                      jointPayerCount: 2,
                    },
                  ],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          twoPayers
            .parentHealthInsurance
            .paid
        ).toBe(6_000);

        expect(
          twoPayers
            .parentHealthInsurance
            .allowed
        ).toBe(6_000);

        /*
        * 3. ร่วมจ่าย 3 คน
        * 12,000 / 3 = 4,000
        */
        const threePayers =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-3",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        12_000,

                      jointPayerCount: 3,
                    },
                  ],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          threePayers
            .parentHealthInsurance
            .paid
        ).toBe(4_000);

        /*
        * 4. หลายกรมธรรม์
        *
        * 10,000 / 1 = 10,000
        * 12,000 / 3 = 4,000
        *
        * รวมสิทธิ = 14,000
        */
        const multiplePolicies =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-4",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        10_000,

                      jointPayerCount: 1,
                    },
                    {
                      id: "policy-5",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        12_000,

                      jointPayerCount: 3,
                    },
                  ],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          multiplePolicies
            .parentHealthInsurance
            .paid
        ).toBe(14_000);

        expect(
          multiplePolicies
            .parentHealthInsurance
            .allowed
        ).toBe(14_000);

        /*
        * 5. หลายรายการรวมเกิน 15,000
        * ยังติดเพดานรวม 15,000
        */
        const overLimit =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurancePolicies:
                  [
                    {
                      id: "policy-6",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        10_000,

                      jointPayerCount: 1,
                    },
                    {
                      id: "policy-7",
                      parentId:
                        eligibleParent.id,

                      premiumPaidThisYear:
                        10_000,

                      jointPayerCount: 1,
                    },
                  ],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          overLimit
            .parentHealthInsurance
            .paid
        ).toBe(20_000);

        expect(
          overLimit
            .parentHealthInsurance
            .allowed
        ).toBe(15_000);

        /*
        * 6. [] เป็น source of truth
        * ต้องไม่ fallback ไป legacy aggregate
        */
        const emptyDetailedList =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  15_000,

                parentHealthInsurancePolicies:
                  [],
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          emptyDetailedList
            .parentHealthInsurance
            .paid
        ).toBe(0);

        expect(
          emptyDetailedList
            .parentHealthInsurance
            .allowed
        ).toBe(0);

        /*
        * 7. legacy:
        * ไม่มี detailed list
        * ต้องใช้ parentHealthInsurance เดิม
        */
        const legacy =
          calculateInsuranceDeductions({
            deductions:
              deductions({
                parentHealthInsurance:
                  12_000,
              }),

            family:
              family({
                parents: [
                  eligibleParent,
                ],
              }),

            rules:
              TAX_RULES_2569,
          });

        expect(
          legacy
            .parentHealthInsurance
            .paid
        ).toBe(12_000);

        expect(
          legacy
            .parentHealthInsurance
            .allowed
        ).toBe(12_000);
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

it(
  "Solar Rooftop และค่าซื้องานศิลปะใช้สิทธิได้ตามยอดจริงเมื่อไม่เกินเพดาน",
  () => {
    const result =
      calculateGeneralDeductions({
        deductions:
          deductions({
            solarRooftop: 150_000,
            artPurchase: 80_000,
          }),

        rules:
          TAX_RULES_2569,

        assessableIncome:
          1_200_000,
      });

    expect(
      result.solarRooftop?.paid
    ).toBe(150_000);

    expect(
      result.solarRooftop?.allowed
    ).toBe(150_000);

    expect(
      result.artPurchase?.paid
    ).toBe(80_000);

    expect(
      result.artPurchase?.allowed
    ).toBe(80_000);

    expect(
      result.totalPaid
    ).toBe(230_000);

    expect(
      result.totalAllowed
    ).toBe(230_000);

    expect(
      result.totalExcess
    ).toBe(0);
  }
);

it(
  "Solar Rooftop จำกัด 200,000 และค่าซื้องานศิลปะจำกัด 100,000",
  () => {
    const result =
      calculateGeneralDeductions({
        deductions:
          deductions({
            solarRooftop: 250_000,
            artPurchase: 120_000,
          }),

        rules:
          TAX_RULES_2569,

        assessableIncome:
          1_200_000,
      });

    expect(
      result.solarRooftop?.allowed
    ).toBe(200_000);

    expect(
      result.artPurchase?.allowed
    ).toBe(100_000);

    expect(
      result.solarRooftop?.excess
    ).toBe(50_000);

    expect(
      result.artPurchase?.excess
    ).toBe(20_000);

    expect(
      result.totalPaid
    ).toBe(370_000);

    expect(
      result.totalAllowed
    ).toBe(300_000);

    expect(
      result.totalExcess
    ).toBe(70_000);

    expect(
      result.limits.solarRooftopMax
    ).toBe(200_000);

    expect(
      result.limits.artPurchaseMax
    ).toBe(100_000);
  }
);

it(
  "parent health detailed policy ตรวจสิทธิจาก parentId ของแต่ละกรมธรรม์ ไม่ใช้ parent คนอื่นมาช่วยผ่าน",
  () => {
    const eligibleFather = {
      id: "eligible-father",
      owner: "taxpayer" as const,
      relation: "father" as const,

      birthYearBE: null,
      age60OrOlder: false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: true,
    };

    const ineligibleMother = {
      id: "ineligible-mother",
      owner: "taxpayer" as const,
      relation: "mother" as const,

      birthYearBE: null,
      age60OrOlder: false,

      /*
       * เกิน 30,000
       */
      annualAssessableIncome:
        30_001,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: true,
    };

    const result =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurance:
              99_999,

            parentHealthInsurancePolicies:
              [
                {
                  id: "eligible-policy",
                  parentId:
                    eligibleFather.id,

                  premiumPaidThisYear:
                    5_000,

                  jointPayerCount: 1,
                },

                {
                  id: "ineligible-policy",
                  parentId:
                    ineligibleMother.id,

                  premiumPaidThisYear:
                    12_000,

                  jointPayerCount: 1,
                },
              ],
          }),

        family:
          family({
            parents: [
              eligibleFather,
              ineligibleMother,
            ],
          }),

        rules:
          TAX_RULES_2569,
      });

    /*
     * ยอดที่เป็นส่วนของผู้ใช้จริง
     * = 5,000 + 12,000
     */
    expect(
      result
        .parentHealthInsurance
        .paid
    ).toBe(17_000);

    /*
     * แต่ใช้สิทธิได้เฉพาะ
     * policy ของพ่อที่เข้าเงื่อนไข
     */
    expect(
      result
        .parentHealthInsurance
        .allowed
    ).toBe(5_000);

    expect(
      result
        .parentHealthInsurance
        .excess
    ).toBe(12_000);

    expect(
      result.warnings
    ).toContain(
      "มีรายการเบี้ยประกันสุขภาพบิดา/มารดาที่ไม่เข้าเงื่อนไขการใช้สิทธิ จึงไม่นำรายการดังกล่าวมาหักลดหย่อน"
    );
  }
);

it(
  "parent health detailed policy ใช้เงื่อนไข spouse parent และ non-resident กับ parent ที่เลือกจริง",
  () => {
    const spouseFather = {
      id: "spouse-father",
      owner: "spouse" as const,
      relation: "father" as const,

      birthYearBE: null,
      age60OrOlder: false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: true,
    };

    /*
     * 1. คู่สมรสไม่มีเงินได้
     * ใช้สิทธิพ่อของคู่สมรสได้
     */
    const spouseNoIncome =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurancePolicies:
              [
                {
                  id: "spouse-policy-1",

                  parentId:
                    spouseFather.id,

                  premiumPaidThisYear:
                    8_000,

                  jointPayerCount: 1,
                },
              ],
          }),

        family:
          family({
            maritalStatus:
              "married",

            spouseHasIncome:
              false,

            spouseHasAssessableIncome:
              false,

            parents: [
              spouseFather,
            ],
          }),

        rules:
          TAX_RULES_2569,
      });

    expect(
      spouseNoIncome
        .parentHealthInsurance
        .allowed
    ).toBe(8_000);

    /*
     * 2. คู่สมรสมีเงินได้
     * taxpayer ใช้พ่อของคู่สมรสไม่ได้
     */
    const spouseHasIncome =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurancePolicies:
              [
                {
                  id: "spouse-policy-2",

                  parentId:
                    spouseFather.id,

                  premiumPaidThisYear:
                    8_000,

                  jointPayerCount: 1,
                },
              ],
          }),

        family:
          family({
            maritalStatus:
              "married",

            spouseHasIncome:
              true,

            spouseHasAssessableIncome:
              true,

            parents: [
              spouseFather,
            ],
          }),

        rules:
          TAX_RULES_2569,
      });

    expect(
      spouseHasIncome
        .parentHealthInsurance
        .paid
    ).toBe(8_000);

    expect(
      spouseHasIncome
        .parentHealthInsurance
        .allowed
    ).toBe(0);

    /*
     * 3. non-resident
     *
     * มี parent อีกคนที่อยู่ไทยและ
     * เข้าเงื่อนไข แต่ policy เลือก
     * parent ที่ไม่ได้อยู่ไทย
     *
     * ต้องไม่พลอยได้สิทธิ
     */
    const outsideThailandParent = {
      id: "outside-thailand-parent",

      owner: "taxpayer" as const,

      relation: "father" as const,

      birthYearBE: null,
      age60OrOlder: false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: false,
    };

    const insideThailandParent = {
      id: "inside-thailand-parent",

      owner: "taxpayer" as const,

      relation: "mother" as const,

      birthYearBE: null,
      age60OrOlder: false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: true,
    };

    const nonResident =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurancePolicies:
              [
                {
                  id: "nonresident-policy",

                  parentId:
                    outsideThailandParent.id,

                  premiumPaidThisYear:
                    10_000,

                  jointPayerCount: 1,
                },
              ],
          }),

        family:
          family({
            isThaiTaxResident:
              false,

            parents: [
              outsideThailandParent,
              insideThailandParent,
            ],
          }),

        rules:
          TAX_RULES_2569,
      });

    expect(
      nonResident
        .parentHealthInsurance
        .paid
    ).toBe(10_000);

    expect(
      nonResident
        .parentHealthInsurance
        .allowed
    ).toBe(0);
  }
);

it(
  "parent health detailed policy จัดการ parentId และ jointPayerCount ที่ไม่สมบูรณ์อย่างปลอดภัย",
  () => {
    const eligibleParent = {
      id: "existing-parent",

      owner: "taxpayer" as const,

      relation: "father" as const,

      birthYearBE: null,
      age60OrOlder: false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: true,

      isInThailand: true,
    };

    const malformed =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurancePolicies:
              [
                /*
                 * valid payer count
                 * แต่ยังไม่ได้เลือก parent
                 *
                 * paid นับได้
                 * allowed ไม่ได้
                 */
                {
                  id: "missing-parent",

                  parentId: null,

                  premiumPaidThisYear:
                    9_000,

                  jointPayerCount: 1,
                },

                /*
                 * parent เคยมี
                 * แต่ปัจจุบันถูกลบไปแล้ว
                 */
                {
                  id: "deleted-parent",

                  parentId:
                    "deleted-parent-id",

                  premiumPaidThisYear:
                    3_000,

                  jointPayerCount: 1,
                },

                /*
                 * ไม่รู้จำนวนผู้ร่วมจ่าย
                 * จึงยังคำนวณส่วนของ
                 * taxpayer ไม่ได้
                 */
                {
                  id: "payer-null",

                  parentId:
                    eligibleParent.id,

                  premiumPaidThisYear:
                    6_000,

                  jointPayerCount: null,
                },

                /*
                 * จำนวนผู้จ่ายต้อง >= 1
                 */
                {
                  id: "payer-zero",

                  parentId:
                    eligibleParent.id,

                  premiumPaidThisYear:
                    4_000,

                  jointPayerCount: 0,
                },

                /*
                 * จำนวนคนต้องเป็น integer
                 */
                {
                  id: "payer-decimal",

                  parentId:
                    eligibleParent.id,

                  premiumPaidThisYear:
                    4_000,

                  jointPayerCount: 1.5,
                },
              ],
          }),

        family:
          family({
            parents: [
              eligibleParent,
            ],
          }),

        rules:
          TAX_RULES_2569,
      });

    /*
     * นับ paid ได้เฉพาะรายการ
     * ที่หารส่วนผู้ใช้ได้แล้ว
     *
     * 9,000 + 3,000
     */
    expect(
      malformed
        .parentHealthInsurance
        .paid
    ).toBe(12_000);

    expect(
      malformed
        .parentHealthInsurance
        .allowed
    ).toBe(0);

    expect(
      malformed
        .parentHealthInsurance
        .excess
    ).toBe(12_000);

    expect(
      malformed.warnings
    ).toContain(
      "มีรายการเบี้ยประกันสุขภาพบิดา/มารดาที่ยังไม่ได้ระบุจำนวนผู้มีเงินได้ที่ร่วมจ่ายอย่างถูกต้อง"
    );

    expect(
      malformed.warnings
    ).toContain(
      "มีรายการเบี้ยประกันสุขภาพบิดา/มารดาที่ยังไม่ได้เลือกบิดาหรือมารดา หรือข้อมูลบุพการีที่เลือกไว้ไม่พบแล้ว"
    );

    /*
     * premium = 0
     *
     * ถือว่าไม่มีรายการเบี้ยจริง
     * ไม่ควรสร้าง warning แม้ field
     * อื่นยังว่าง
     */
    const zeroPremium =
      calculateInsuranceDeductions({
        deductions:
          deductions({
            parentHealthInsurancePolicies:
              [
                {
                  id: "zero-premium",

                  parentId: null,

                  premiumPaidThisYear: 0,

                  jointPayerCount: null,
                },
              ],
          }),

        family:
          family(),

        rules:
          TAX_RULES_2569,
      });

    expect(
      zeroPremium
        .parentHealthInsurance
        .paid
    ).toBe(0);

    expect(
      zeroPremium
        .parentHealthInsurance
        .allowed
    ).toBe(0);

    expect(
      zeroPremium.warnings
    ).toEqual([]);
  }
);