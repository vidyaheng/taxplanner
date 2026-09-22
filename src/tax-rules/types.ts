export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface TaxRuleSet {
  taxYear: number;

  employmentExpense: {
    rate: number;
    max: number;
  };

  incomeExemptions: {
    seniorResidentMax: number;

    /*
    * พ.ร.ฎ. 805
    * ยกเว้นเงินได้เพิ่ม 50%
    * ของยอดลงทุนอนุรักษ์พลังงาน
    * ที่เข้าเงื่อนไข
    */
    energyEfficientInvestmentRate: number;
  };

  allowances: {
    taxpayer: number;
    spouse: number;

    childBase: number;
    childAdditional: number;
    childAdditionalBornFromBE: number;

    parent: number;
    disabledDependent: number;
  };

  otherIncomeExpenses: {
    section40_3Rights: {
      standardRate: number;
      standardMax: number;
    };

    section40_5Rental: {
      standardRates: {
        building: number;
        agriculturalLand: number;
        nonAgriculturalLand: number;
        vehicle: number;
        otherProperty: number;
      };
    };

    section40_6Professional: {
      standardRates: {
        medical: number;
        fineArts: number;
        other: number;
      };
    };

    section40_7Contract: {
      standardRate: number;
    };

    section40_8Business: {
      standardRate: number;

      performer: {
        firstTierLimit: number;
        firstTierRate: number;
        excessRate: number;
        maxExpense: number;
      };
    };
  };

  eligibility: {
    childIncomeLimitExclusive: number;

    parentMinAge: number;
    parentIncomeLimitInclusive: number;

    disabledIncomeLimitInclusive: number;

    maxAdoptedChildren: number;
    maxOtherDisabledDependents: number;
  };

  deductions: {
    insurance: {
      lifeAndHealthCombinedMax: number;
      healthSelfMax: number;
      spouseLifeMax: number;
      parentHealthMax: number;
    };

    retirement: {
      sharedMax: number;

      providentFundWageRate: number;
      providentFundMax: number;

      gpfMax: number;

      privateTeacherFundMax: number;

      nsfMax: number;

      rmfIncomeRate: number;
      rmfMax: number;

      pensionIncomeRate: number;
      pensionExtraMax: number;
    };

    general: {
      socialSecurityMax: number;

      homeLoanInterestMax: number;

      socialEnterpriseInvestmentMax: number;

      solarRooftopMax: number;

      artPurchaseMax: number;
    };

    sustainableInvestment: {
      thaiEsgIncomeRate: number;

      thaiEsgMax: number;

      thaiEsgxTransferMax: number;

      thaiEsgxFirstYearMax: number;

      thaiEsgxCarryForwardYears: number;
    };

    familyMedical: {
      pregnancyPerPregnancyMax: number;
    };

    donation: {
      politicalMax: number;

      specialMultiplier: number;
      specialLimitRate: number;

      generalLimitRate: number;
    };
  };

  alternativeTax: {
    threshold: number;
    rate: number;
    exemptIfTaxNotOver: number;
  };

  taxBrackets: TaxBracket[];
}