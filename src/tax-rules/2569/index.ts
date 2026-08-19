import { TaxRuleSet } from "@/tax-rules/types";

export const TAX_RULES_2569: TaxRuleSet = {
  taxYear: 2569,

  employmentExpense: {
    rate: 0.5,
    max: 100_000,
  },

  incomeExemptions: {
    seniorResidentMax: 190_000,
  },

  allowances: {
    taxpayer: 60_000,

    spouse: 60_000,

    childBase: 30_000,
    childAdditional: 30_000,
    childAdditionalBornFromBE: 2561,

    parent: 30_000,

    disabledDependent: 60_000,
  },

  otherIncomeExpenses: {
    section40_3Rights: {
      standardRate: 0.50,
      standardMax: 100_000,
    },
  },

  eligibility: {
    // บุตรมีเงินได้ตั้งแต่ 30,000 บาทขึ้นไป
    // จะไม่เข้าเงื่อนไข
    childIncomeLimitExclusive: 30_000,

    parentMinAge: 60,

    parentIncomeLimitInclusive: 30_000,

    disabledIncomeLimitInclusive: 30_000,

    maxAdoptedChildren: 3,

    maxOtherDisabledDependents: 1,
  },

  deductions: {
    insurance: {
      lifeAndHealthCombinedMax: 100_000,
      healthSelfMax: 25_000,
      spouseLifeMax: 10_000,
      parentHealthMax: 15_000,
    },

    retirement: {
      sharedMax: 500_000,

      providentFundWageRate: 0.15,
      providentFundMax: 500_000,

      gpfMax: 500_000,

      privateTeacherFundMax: 500_000,

      nsfMax: 30_000,

      rmfIncomeRate: 0.30,
      rmfMax: 500_000,

      pensionIncomeRate: 0.15,
      pensionExtraMax: 200_000,
    },

    general: {
      /*
      * ปี 2569 ม.33
      * เพดานค่าจ้าง 17,500 บาท
      * เงินสมทบสูงสุด 875 บาท/เดือน
      */
      socialSecurityMax: 10_500,

      homeLoanInterestMax: 100_000,

      socialEnterpriseInvestmentMax: 100_000,
    },

    sustainableInvestment: {
      thaiEsgIncomeRate: 0.30,

      thaiEsgMax: 300_000,

      thaiEsgxTransferMax: 500_000,

      thaiEsgxFirstYearMax: 300_000,

      thaiEsgxCarryForwardYears: 4,
    },

    familyMedical: {
      pregnancyPerPregnancyMax: 60_000,
    },

    donation: {
      politicalMax: 10_000,

      specialMultiplier: 2,
      specialLimitRate: 0.10,

      generalLimitRate: 0.10,
    },
  },

  alternativeTax: {
    threshold: 120_000,
    rate: 0.005,

    // ถ้าวิธีที่ 2 คำนวณได้ไม่เกิน 5,000
    // ได้รับยกเว้นวิธีที่ 2
    exemptIfTaxNotOver: 5_000,
  },

  taxBrackets: [
    {
      upTo: 150_000,
      rate: 0,
    },
    {
      upTo: 300_000,
      rate: 0.05,
    },
    {
      upTo: 500_000,
      rate: 0.1,
    },
    {
      upTo: 750_000,
      rate: 0.15,
    },
    {
      upTo: 1_000_000,
      rate: 0.2,
    },
    {
      upTo: 2_000_000,
      rate: 0.25,
    },
    {
      upTo: 5_000_000,
      rate: 0.3,
    },
    {
      upTo: null,
      rate: 0.35,
    },
  ],
};