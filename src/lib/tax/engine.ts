import { IncomeData } from "@/types/income";
import { FamilyData, ChildData } from "@/types/family";
import { TaxResult } from "@/types/taxResult";

import {
  calculateSection40_4Interest,
} from "./interest-income";
import {
  calculateSection40_4Dividend,
} from "./dividend-income";

import { TAX_RULES_2569 } from "@/tax-rules/2569";
import { TaxRuleSet } from "@/tax-rules/types";

import {
  DeductionData,
} from "@/types/deductions";

import {
  calculateInsuranceDeductions,
  calculateRetirementDeductions,
  calculateGeneralDeductions,
  calculatePregnancyDeductions,
  calculateDonationDeductions,
} from "@/lib/tax/deductions";

import {
  calculateSeniorIncomeExemption,
} from "./income-exemption";

import {
  calculateEnergyEfficientInvestment,
} from "./energy-efficient-investment";

import {
  partitionForeignIncome,
} from "./foreign-income-partition";

import {
  aggregateForeignIncome,
} from "./foreign-income-aggregate";

import {
  buildForeignTaxCreditEligibilityDecisions,
  calculateForeignTaxCredit,
} from "./foreign-tax-credit";

import {
  calculateSection40_3RightsExpense,
  calculateSection40_5RentalExpense,
  calculateSection40_6ProfessionalExpense,
  calculateSection40_7ContractExpense,
  calculateSection40_8BusinessExpense,
} from "./income-expense";

interface CalculateTaxInput {
  taxYear: number;

  income: IncomeData;

  family: FamilyData;

  deductions: DeductionData;
}

function getRules(
  taxYear: number
): TaxRuleSet {
  switch (taxYear) {
    case 2569:
      return TAX_RULES_2569;

    default:
      throw new Error(
        `Tax rules for year ${taxYear} are not available`
      );
  }
}

function sum(
  values: number[]
) {
  return values.reduce(
    (total, value) =>
      total + value,
    0
  );
}

function resolveSpouseAssessableIncome(
  family: FamilyData
): boolean | null {
  if (
    family.spouseHasAssessableIncome !==
    undefined
  ) {
    return family.spouseHasAssessableIncome;
  }

  /*
   * legacy localStorage
   */
  return family.spouseHasIncome;
}

function canClaimSpouseParentAllowance(
  family: FamilyData
): boolean {
  const spouseHasAssessableIncome =
    resolveSpouseAssessableIncome(
      family
    );

  const currentSpouseQualifies =
    family.maritalStatus === "married" &&
    spouseHasAssessableIncome === false;

  const formerSpouseQualifies =
    (
      family.maritalStatus === "divorced" ||
      family.maritalStatus === "widowed"
    ) &&
    family.marriageEndedThisTaxYear === true &&
    family.formerSpouseHadAssessableIncomeThisTaxYear ===
      false;

  return (
    currentSpouseQualifies ||
    formerSpouseQualifies
  );
}

function calculateProgressiveTax(
  taxableIncome: number,
  rules: TaxRuleSet
) {
  if (taxableIncome <= 0) {
    return 0;
  }

  let tax = 0;
  let previousLimit = 0;

  for (
    const bracket of
    rules.taxBrackets
  ) {
    const upperLimit =
      bracket.upTo ??
      Infinity;

    if (
      taxableIncome <=
      previousLimit
    ) {
      break;
    }

    const incomeInBracket =
      Math.min(
        taxableIncome,
        upperLimit
      ) - previousLimit;

    if (incomeInBracket > 0) {
      tax +=
        incomeInBracket *
        bracket.rate;
    }

    previousLimit =
      upperLimit;
  }

  return Math.max(0, tax);
}

function getMarginalTaxRate(
  taxableIncome: number,
  rules: TaxRuleSet
) {
  if (taxableIncome <= 0) {
    return 0;
  }

  for (
    const bracket of
    rules.taxBrackets
  ) {
    if (
      bracket.upTo === null ||
      taxableIncome <=
        bracket.upTo
    ) {
      return bracket.rate;
    }
  }

  return 0;
}

/*
 * Child eligibility
 *
 * ตอนนี้ Family UI เก็บปีเกิด
 * ไม่ได้เก็บวัน/เดือนเกิด
 * ดังนั้น boundary age จะยังเป็น
 * preliminary logic
 */
function childMeetsBasicEligibility(
  child: ChildData,
  taxYear: number,
  incomeLimit: number,
  taxpayerIsThaiTaxResident:
    boolean | null,
  warnings: string[]
) {
  if (
    !child.supportedByTaxpayer
  ) {
    return false;
  }

  if (
    taxpayerIsThaiTaxResident ===
      false &&
    child.stayedInThailand180Days !==
      true
  ) {
    return false;
  }

  if (
    child.annualAssessableIncome >=
    incomeLimit
  ) {
    return false;
  }

  if (
    child.birthYearBE === null
  ) {
    return false;
  }

  const ageByYear =
    taxYear -
    child.birthYearBE;

  /*
   * ผู้เยาว์
   */
  if (ageByYear < 20) {
    return true;
  }

  /*
   * อายุ 20-25
   * ต้องศึกษาอุดมศึกษา
   */
  if (
    ageByYear <= 25 &&
    child.studyingHigherEducation
  ) {
    return true;
  }

  /*
   * boundary ที่ต้องใช้วันเกิดจริง
   * จะเพิ่ม birthDate ใน Family v0.2
   */
  if (
    ageByYear === 20 ||
    ageByYear === 26
  ) {
    warnings.push(
      "มีบุตรที่อายุอยู่ใกล้เกณฑ์สิทธิ จำเป็นต้องตรวจวันเกิดจริงในเวอร์ชันถัดไป"
    );
  }

  return false;
}

function calculateChildAllowance(
  family: FamilyData,
  taxYear: number,
  rules: TaxRuleSet,
  warnings: string[]
) {
  const legalChildren =
    family.children.filter(
      (child) =>
        child.relationship ===
        "legal"
    );

  const adoptedChildren =
    family.children.filter(
      (child) =>
        child.relationship ===
        "adopted"
    );

  let allowance = 0;

  /*
   * บุตรชอบด้วยกฎหมาย
   * ไม่มีเพดานจำนวน
   */
  legalChildren.forEach(
    (child, index) => {
      if (
        !childMeetsBasicEligibility(
          child,
          taxYear,
          rules.eligibility
            .childIncomeLimitExclusive,
          family.isThaiTaxResident,
          warnings
        )
      ) {
        return;
      }

      allowance +=
        rules.allowances
          .childBase;

      const inferredBirthOrder =
        index + 1;

      const qualifiesForExtra =
        inferredBirthOrder >= 2 &&
        child.birthYearBE !==
          null &&
        child.birthYearBE >=
          rules.allowances
            .childAdditionalBornFromBE;

      if (
        qualifiesForExtra
      ) {
        allowance +=
          rules.allowances
            .childAdditional;
      }
    }
  );

  /*
   * บุตรบุญธรรม
   *
   * ถ้ามีบุตรชอบด้วยกฎหมาย
   * ตั้งแต่ 3 คนขึ้นไป
   * ไม่สามารถใช้บุตรบุญธรรมเพิ่ม
   */
  const remainingAdoptedSlots =
    Math.max(
      0,
      rules.eligibility
        .maxAdoptedChildren -
        legalChildren.length
    );

  const eligibleAdopted =
    adoptedChildren
      .filter((child) =>
        childMeetsBasicEligibility(
          child,
          taxYear,
          rules.eligibility
            .childIncomeLimitExclusive,
          family.isThaiTaxResident,
          warnings
        )
      )
      .slice(
        0,
        remainingAdoptedSlots
      );

  allowance +=
    eligibleAdopted.length *
    rules.allowances.childBase;

  /*
   * ลำดับบุตรสำหรับสิทธิเพิ่ม
   * ตอนนี้ infer จาก array
   */
  if (
    legalChildren.length >= 2
  ) {
    warnings.push(
      "สิทธิบุตรคนที่ 2 เป็นต้นไปคำนวณจากลำดับบุตรที่กรอกไว้ในขณะนี้"
    );
  }

  return allowance;
}

function calculateParentAllowance(
  family: FamilyData,
  taxYear: number,
  rules: TaxRuleSet
) {
  let allowance = 0;

  const spouseParentAllowanceEligible =
    canClaimSpouseParentAllowance(
      family
    );

  for (
    const parent of
    family.parents
  ) {
    if (
      !parent.supportedByTaxpayer
    ) {
      continue;
    }

    if (
      parent.claimedByOtherTaxpayer !==
      false
    ) {
      continue;
    }

    if (
      family.isThaiTaxResident === false &&
      parent.isInThailand !== true &&
      parent.isInThailand !== undefined
    ) {
      continue;
    }

    const meetsParentAgeRequirement =
      parent.age60OrOlder === true ||
      (
        parent.age60OrOlder === undefined &&
        parent.birthYearBE !== null &&
        taxYear - parent.birthYearBE >=
          rules.eligibility.parentMinAge
      );

    if (!meetsParentAgeRequirement) {
      continue;
    }

    if (
      parent.annualAssessableIncome >
      rules.eligibility
        .parentIncomeLimitInclusive
    ) {
      continue;
    }

    if (
      parent.owner === "spouse" &&
      !spouseParentAllowanceEligible
    ) {
      continue;
    }

    allowance +=
      rules.allowances.parent;
  }

  return allowance;
}

function calculateDisabledAllowance(
  family: FamilyData,
  rules: TaxRuleSet,
  taxpayerIsThaiTaxResident:
    boolean | null
) {
  let allowance = 0;
  let otherDependentCount = 0;

  for (
    const dependent of
    family.disabledDependents
  ) {
    if (
      !dependent
        .supportedByTaxpayer
    ) {
      continue;
    }

    if (
      dependent.claimedByOtherTaxpayer !==
      false
    ) {
      continue;
    }

    if (
      taxpayerIsThaiTaxResident ===
        false &&
      dependent.stayedInThailand180Days !==
        true
    ) {
      continue;
    }

    if (
      !dependent
        .hasRequiredEvidence
    ) {
      continue;
    }

    if (
      dependent
        .annualAssessableIncome >
      rules.eligibility
        .disabledIncomeLimitInclusive
    ) {
      continue;
    }

    /*
     * บุคคลอื่นที่ไม่ใช่ญาติ
     * ตามกลุ่มที่กำหนด
     * จำกัด 1 คน
     */
    if (
      dependent.relation ===
      "other"
    ) {
      if (
        otherDependentCount >=
        rules.eligibility
          .maxOtherDisabledDependents
      ) {
        continue;
      }

      otherDependentCount += 1;
    }

    allowance +=
      rules.allowances
        .disabledDependent;
  }

  return allowance;
}

export function calculateTax({
  taxYear,
  income: rawIncome,
  family,
  deductions,
}: CalculateTaxInput): TaxResult {
  const rules =
    getRules(taxYear);

  const warnings: string[] =
    [];

  const spouseHasAssessableIncome =
    resolveSpouseAssessableIncome(
      family
    );

  const spouseParentAllowanceEligible =
    canClaimSpouseParentAllowance(
      family
    );

  /*
  * --------------------
  * FOREIGN INCOME
  * --------------------
  *
  * แปลง foreign-source income
  * ให้เหลือเฉพาะยอดที่ต้องนำมา
  * คำนวณภาษีในปีนี้
  *
  * หลังจากจุดนี้ Engine ใช้
  * income ที่ normalize แล้ว
  */
  const foreignIncomePartition =
    partitionForeignIncome({
      income: rawIncome,
      filingTaxYear: taxYear,
    });

  warnings.push(
    ...foreignIncomePartition.warnings
  );

  const foreignAggregate =
    aggregateForeignIncome({
      income: rawIncome,
      filingTaxYear: taxYear,
    });

  const foreignTaxCreditEligibility =
    buildForeignTaxCreditEligibilityDecisions(
      foreignAggregate
    );

  const income =
    foreignIncomePartition
      .incomeForTaxEngine;

  /*
   * --------------------
   * INCOME
   * --------------------
   */

  const annualSalary =
    income.monthlySalary * 12;

  const section40_1 =
    annualSalary +
    income.annualBonus +
    income.otherEmploymentIncome;

  /*
   * ตอนนี้ commission
   * ในช่อง "รายได้อื่น"
   * ถูกตีความเป็น 40(2)
   *
   * ถ้าเป็น commission
   * จากนายจ้างโดยตรง
   * ภายหลัง UI จะถามเพิ่ม
   */
  const section40_2 =
    income.hasOtherIncome
      ? income.otherIncome
          .commission
      : 0;

  const section40_3Items =
    income.hasOtherIncome
      ? income.detailedOtherIncome
          .section40_3
      : [];

  const section40_3Annuity =
    section40_3Items.reduce(
      (sum, item) =>
        item.incomeType === "annuity"
          ? sum + Math.max(0, item.amount)
          : sum,
      0
    );

  const section40_3Rights =
    section40_3Items.reduce(
      (sum, item) =>
        item.incomeType === "rights"
          ? sum + Math.max(0, item.amount)
          : sum,
      0
    );

  const section40_4InterestResult =
    calculateSection40_4Interest(
      income.hasOtherIncome
        ? income.detailedOtherIncome
            .section40_4Interest
        : []
    );

  const section40_4Interest =
    section40_4InterestResult
      .includedIncome;

  const section40_4DividendResult =
    calculateSection40_4Dividend(
      income.hasOtherIncome
        ? income.detailedOtherIncome
            .section40_4Dividend
        : []
    );

  const section40_4Dividend =
    section40_4DividendResult
      .includedAssessableIncome;

  const section40_5Items =
    income.hasOtherIncome
      ? income.detailedOtherIncome
          .section40_5
      : [];

  const section40_5 =
    section40_5Items.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  const section40_6Items =
    income.hasOtherIncome
      ? income.detailedOtherIncome
          .section40_6
      : [];

  const section40_6 =
    section40_6Items.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  const section40_7Items =
    income.hasOtherIncome
      ? income.detailedOtherIncome
          .section40_7
      : [];

  const section40_7 =
    section40_7Items.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  const section40_8Items =
    income.hasOtherIncome
      ? income.detailedOtherIncome
          .section40_8
      : [];

  const section40_8 =
    section40_8Items.reduce(
      (sum, item) =>
        sum +
        Math.max(0, item.amount),
      0
    );

  const legacyInvestmentIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.investment
        )
      : 0;

  const legacyRentIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.rent
        )
      : 0; 
      
  const legacyProfessionalIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.professional
        )
      : 0;

  const legacyBusinessIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.business
        )
      : 0;

  const unsupportedOtherIncome =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.otherIncome.other
        )
      : 0;

  const supportedIncome =
    section40_1 +
    section40_2 +
    section40_3Annuity +
    section40_3Rights +
    section40_4Interest +
    section40_4Dividend +
    section40_5 +
    section40_6 +
    section40_7 +
    section40_8;

  const totalGrossIncome =
    supportedIncome +
    legacyRentIncome +
    legacyProfessionalIncome +
    legacyBusinessIncome +
    unsupportedOtherIncome;

  /*
  * --------------------
  * INCOME EXEMPTIONS
  * Senior 65+ resident
  * --------------------
  */

  const isSeniorResidentEligible =
    family.taxpayerAge65OrOlder === true &&
    family.isThaiTaxResident === true;

  const seniorIncomeExemption =
    calculateSeniorIncomeExemption({
      eligible:
        isSeniorResidentEligible,

      maxExemption:
        rules.incomeExemptions
          .seniorResidentMax,

      income: {
        section40_1,
        section40_2,
        section40_3Annuity,
        section40_3Rights,
        section40_4Interest,
        section40_4Dividend,
        section40_5,
        section40_6,
        section40_7,
        section40_8,
      },

      requested:
        family
          .seniorIncomeExemptionAllocation,
    });

  const seniorResidentExemption =
    seniorIncomeExemption.total;

  const section40_1AfterExemptions =
    Math.max(
      0,
      section40_1 -
        seniorIncomeExemption
          .allocation.section40_1
    );

  const section40_2AfterExemptions =
    Math.max(
      0,
      section40_2 -
        seniorIncomeExemption
          .allocation.section40_2
    );

  const section40_3AnnuityAfterExemptions =
    Math.max(
      0,
      section40_3Annuity -
        seniorIncomeExemption
          .allocation.section40_3Annuity
    );

  const section40_3RightsAfterExemptions =
    Math.max(
      0,
      section40_3Rights -
        seniorIncomeExemption
          .allocation.section40_3Rights
    );

  const section40_4InterestAfterExemptions =
  Math.max(
    0,
    section40_4Interest -
      seniorIncomeExemption
        .allocation.section40_4Interest
  );

  const section40_4DividendAfterExemptions =
    Math.max(
      0,
      section40_4Dividend -
        seniorIncomeExemption
          .allocation.section40_4Dividend
    );

  const section40_5AfterExemptions =
    Math.max(
      0,
      section40_5 -
        seniorIncomeExemption
          .allocation.section40_5
    );

  const section40_6AfterExemptions =
    Math.max(
      0,
      section40_6 -
        seniorIncomeExemption
          .allocation.section40_6
    );

  const section40_7AfterExemptions =
    Math.max(
      0,
      section40_7 -
        seniorIncomeExemption
          .allocation.section40_7
    );

  const section40_8AfterExemptions =
    Math.max(
      0,
      section40_8 -
        (
          seniorIncomeExemption
            .allocation.section40_8 ??
          0
        )
    );

  const supportedIncomeAfterExemptions =
    section40_1AfterExemptions +
    section40_2AfterExemptions;

  const incomeAfterExemptions =
    Math.max(
      0,
      totalGrossIncome -
        seniorResidentExemption
    );

  /*
   * --------------------
   * EXPENSES
   * 40(1) + 40(2)
   * --------------------
   */

  const employmentExpense =
    Math.min(
      supportedIncomeAfterExemptions *
        rules.employmentExpense
          .rate,

      rules.employmentExpense
        .max
    );

  let remainingSection40_3RightsExemption =
    seniorIncomeExemption
      .allocation.section40_3Rights;

  const section40_3ItemsAfterExemptions =
    section40_3Items.map((item) => {
      if (item.incomeType !== "rights") {
        return item;
      }

      const amount =
        Math.max(0, item.amount);

      const exemptedAmount =
        Math.min(
          amount,
          remainingSection40_3RightsExemption
        );

      remainingSection40_3RightsExemption =
        Math.max(
          0,
          remainingSection40_3RightsExemption -
            exemptedAmount
        );

      return {
        ...item,
        amount:
          amount -
          exemptedAmount,
      };
    });

  const section40_3RightsExpense =
    calculateSection40_3RightsExpense(
      section40_3ItemsAfterExemptions,
      rules.otherIncomeExpenses
        .section40_3Rights
    );

  const section40_3RightsIncomeAfterExpenses =
    Math.max(
      0,
      section40_3RightsAfterExemptions -
        section40_3RightsExpense
          .deductibleExpense
    );

  let remainingSection40_5Exemption =
    seniorIncomeExemption
      .allocation.section40_5;

  const section40_5ItemsAfterExemptions =
    section40_5Items.map((item) => {
      const amount =
        Math.max(0, item.amount);

      const exemptedAmount =
        Math.min(
          amount,
          remainingSection40_5Exemption
        );

      remainingSection40_5Exemption =
        Math.max(
          0,
          remainingSection40_5Exemption -
            exemptedAmount
        );

      return {
        ...item,
        amount:
          amount -
          exemptedAmount,
      };
    });

  const section40_5RentalExpense =
    calculateSection40_5RentalExpense(
      section40_5ItemsAfterExemptions,
      rules.otherIncomeExpenses
        .section40_5Rental
    );

  const section40_5IncomeAfterExpenses =
    Math.max(
      0,
      section40_5AfterExemptions -
        section40_5RentalExpense
          .deductibleExpense
    );

  let remainingSection40_6Exemption =
    seniorIncomeExemption
      .allocation.section40_6;

  const section40_6ItemsAfterExemptions =
    section40_6Items.map((item) => {
      const amount =
        Math.max(0, item.amount);

      const exemptedAmount =
        Math.min(
          amount,
          remainingSection40_6Exemption
        );

      remainingSection40_6Exemption =
        Math.max(
          0,
          remainingSection40_6Exemption -
            exemptedAmount
        );

      return {
        ...item,
        amount:
          amount -
          exemptedAmount,
      };
    });

  let remainingSection40_7Exemption =
    seniorIncomeExemption
      .allocation.section40_7;

  const section40_7ItemsAfterExemptions =
    section40_7Items.map((item) => {
      const amount =
        Math.max(0, item.amount);

      const exemptedAmount =
        Math.min(
          amount,
          remainingSection40_7Exemption
        );

      remainingSection40_7Exemption =
        Math.max(
          0,
          remainingSection40_7Exemption -
            exemptedAmount
        );

      return {
        ...item,
        amount:
          amount -
          exemptedAmount,
      };
    });

  let remainingSection40_8Exemption =
    Math.max(
      0,
      seniorIncomeExemption
        .allocation.section40_8 ??
        0
    );

  const section40_8ItemsAfterExemptions =
    section40_8Items.map((item) => {
      const amount =
        Math.max(0, item.amount);

      const exemptedAmount =
        Math.min(
          amount,
          remainingSection40_8Exemption
        );

      remainingSection40_8Exemption =
        Math.max(
          0,
          remainingSection40_8Exemption -
            exemptedAmount
        );

      return {
        ...item,
        amount:
          amount -
          exemptedAmount,
      };
    });

  const section40_6ProfessionalExpense =
    calculateSection40_6ProfessionalExpense(
      section40_6ItemsAfterExemptions,
      rules.otherIncomeExpenses
        .section40_6Professional
    );

  const section40_6IncomeAfterExpenses =
    Math.max(
      0,
      section40_6AfterExemptions -
        section40_6ProfessionalExpense
          .deductibleExpense
    );

  const section40_7ContractExpense =
    calculateSection40_7ContractExpense(
      section40_7ItemsAfterExemptions,
      rules.otherIncomeExpenses
        .section40_7Contract
    );

  const section40_7IncomeAfterExpenses =
    Math.max(
      0,
      section40_7AfterExemptions -
        section40_7ContractExpense
          .deductibleExpense
    );

  const section40_8BusinessExpense =
    calculateSection40_8BusinessExpense(
      section40_8ItemsAfterExemptions,
      rules.otherIncomeExpenses
        .section40_8Business
    );

  const section40_8IncomeAfterExpenses =
    Math.max(
      0,
      section40_8AfterExemptions -
        section40_8BusinessExpense
          .deductibleExpense
    );
    
  const incomeAfterExpenses =
    Math.max(
      0,
      supportedIncomeAfterExemptions -
        employmentExpense +
        section40_3AnnuityAfterExemptions +
        section40_3RightsIncomeAfterExpenses +
        section40_4InterestAfterExemptions +
        section40_4DividendAfterExemptions +
        section40_5IncomeAfterExpenses +
        section40_6IncomeAfterExpenses +
        section40_7IncomeAfterExpenses +
        section40_8IncomeAfterExpenses
    );

  /*
  * --------------------
  * ENERGY-EFFICIENT INVESTMENT
  * พ.ร.ฎ. 805
  *
  * เป็นสิทธิยกเว้นเพิ่มเติม 50%
  * หลังหักค่าใช้จ่ายปกติ
  * --------------------
  */
  const energyEfficientInvestment =
    calculateEnergyEfficientInvestment({
      section40_5:
        section40_5Items,

      section40_6:
        section40_6Items,

      section40_7:
        section40_7Items,

      section40_8:
        section40_8Items,

      exemptionRate:
        rules.incomeExemptions
          .energyEfficientInvestmentRate,
    });

  const energyEfficientInvestmentExemption =
    energyEfficientInvestment
      .totalAdditionalExemption;

  const incomeAfterEnergyEfficientInvestmentExemption =
    Math.max(
      0,
      incomeAfterExpenses -
        energyEfficientInvestmentExemption
    );

  const hasIncompleteParentAge =
    family.parents.some((parent) => {
      if (!parent.supportedByTaxpayer) {
        return false;
      }

      if (
        parent.annualAssessableIncome >
        rules.eligibility
          .parentIncomeLimitInclusive
      ) {
        return false;
      }

      if (
        parent.claimedByOtherTaxpayer ===
        true
      ) {
        return false;
      }

      if (
        parent.owner === "spouse" &&
        !spouseParentAllowanceEligible
      ) {
        return false;
      }

      if (parent.age60OrOlder === null) {
        return true;
      }

      if (
        parent.age60OrOlder !==
        undefined
      ) {
        return false;
      }

      return parent.birthYearBE === null;
    });

  if (hasIncompleteParentAge) {
    warnings.push(
      "กรุณาระบุว่าบิดาหรือมารดาอายุ 60 ปีขึ้นไปหรือไม่"
    );
  }

  const hasIncompleteParentOtherClaim =
    family.parents.some((parent) => {
      if (!parent.supportedByTaxpayer) {
        return false;
      }

      const meetsParentAgeRequirement =
        parent.age60OrOlder === true ||
        (
          parent.age60OrOlder ===
            undefined &&
          parent.birthYearBE !== null &&
          taxYear - parent.birthYearBE >=
            rules.eligibility.parentMinAge
        );

      if (!meetsParentAgeRequirement) {
        return false;
      }

      if (
        parent.annualAssessableIncome >
        rules.eligibility
          .parentIncomeLimitInclusive
      ) {
        return false;
      }

      if (
        parent.owner === "spouse" &&
        !spouseParentAllowanceEligible
      ) {
        return false;
      }

      return (
        parent.claimedByOtherTaxpayer ==
        null
      );
    });

  /*
  * --------------------
  * PARENT THAILAND RESIDENCE
  * --------------------
  *
  * ใช้ทั้ง
  * - ค่าลดหย่อนบุพการีปกติ
  * - เบี้ยประกันสุขภาพบิดา / มารดา
  *
  * เฉพาะกรณีผู้มีเงินได้
  * มิได้เป็นผู้อยู่ในประเทศไทย
  */

  /*
  * สิทธิลดหย่อนบุพการี 30,000
  */
  const hasIncompleteBasicParentThailandResidence =
    family.isThaiTaxResident === false &&
    family.parents.some((parent) => {
      if (!parent.supportedByTaxpayer) {
        return false;
      }

      const meetsParentAgeRequirement =
        parent.age60OrOlder === true ||
        (
          parent.age60OrOlder ===
            undefined &&
          parent.birthYearBE !== null &&
          taxYear - parent.birthYearBE >=
            rules.eligibility.parentMinAge
        );

      if (!meetsParentAgeRequirement) {
        return false;
      }

      if (
        parent.annualAssessableIncome >
        rules.eligibility
          .parentIncomeLimitInclusive
      ) {
        return false;
      }

      if (
        parent.claimedByOtherTaxpayer !==
        false
      ) {
        return false;
      }

      if (
        parent.owner === "spouse" &&
        !spouseParentAllowanceEligible
      ) {
        return false;
      }

      /*
      * null = ผู้ใช้ใหม่ยังไม่ได้ตอบ
      *
      * undefined = legacy localStorage
      * ไม่บังคับให้ incomplete
      */
      return (
        parent.isInThailand === null
      );
    });

  /*
  * เบี้ยประกันสุขภาพบิดา / มารดา
  *
  * ไม่ใช้เงื่อนไขอายุ 60 ปี
  * และไม่ใช้ claimedByOtherTaxpayer
  *
  * ตรวจเฉพาะ detailed policy
  * เพราะ undefined คือ legacy data
  */
  const hasIncompleteParentHealthThailandResidence =
    family.isThaiTaxResident === false &&
    deductions.parentHealthInsurancePolicies !==
      undefined &&
    deductions.parentHealthInsurancePolicies.some(
      (policy) => {
        const premiumPaid =
          Math.max(
            0,
            policy.premiumPaidThisYear
          );

        /*
        * ไม่มีเบี้ยจริง
        * ไม่ต้องบังคับตอบ
        */
        if (premiumPaid <= 0) {
          return false;
        }

        /*
        * parentId ที่ว่าง / หาไม่เจอ
        * จะถูก completeness อีกตัวจัดการ
        */
        if (
          !policy.parentId ||
          policy.parentId.trim() === ""
        ) {
          return false;
        }

        const parent =
          family.parents.find(
            (item) =>
              item.id ===
              policy.parentId
          );

        if (!parent) {
          return false;
        }

        /*
        * false = ตอบครบแล้วแต่ไม่มีสิทธิ
        * true  = ตอบครบและอาจมีสิทธิ
        * null  = ยังตอบไม่ครบ
        * undefined = legacy parent data
        */
        return (
          parent.isInThailand === null
        );
      }
    );

  const hasIncompleteParentThailandResidence =
    hasIncompleteBasicParentThailandResidence ||
    hasIncompleteParentHealthThailandResidence;

  if (
    hasIncompleteParentThailandResidence
  ) {
    warnings.push(
      "กรุณาระบุว่าบิดาหรือมารดาอยู่ในประเทศไทยหรือไม่"
    );
  }
  
  /*
  * --------------------
  * PARENT HEALTH POLICY
  * COMPLETENESS
  * --------------------
  *
  * ตรวจเฉพาะ detailed data
  *
  * undefined =
  * legacy parentHealthInsurance
  * จึงไม่บังคับข้อมูลใหม่ย้อนหลัง
  */
  const hasIncompleteParentHealthPolicyDetails =
    deductions.parentHealthInsurancePolicies !==
      undefined &&
    deductions.parentHealthInsurancePolicies.some(
      (policy) => {
        const premiumPaid =
          Math.max(
            0,
            policy.premiumPaidThisYear
          );

        /*
        * ไม่มีเบี้ยจริง
        * ไม่ถือว่าเป็นรายการที่ต้องกรอกให้ครบ
        */
        if (premiumPaid <= 0) {
          return false;
        }

        /*
        * ต้องรู้จำนวนผู้ร่วมจ่าย
        * เพื่อคำนวณส่วนของ taxpayer
        */
        if (
          policy.jointPayerCount === null ||
          !Number.isInteger(
            policy.jointPayerCount
          ) ||
          policy.jointPayerCount < 1
        ) {
          return true;
        }

        /*
        * ต้องเลือกว่าเป็นกรมธรรม์
        * ของบิดา / มารดาคนใด
        */
        if (
          !policy.parentId ||
          policy.parentId.trim() === ""
        ) {
          return true;
        }

        /*
        * parent อาจถูกลบออกจาก Family
        * หลังจากสร้าง policy ไปแล้ว
        */
        const parentExists =
          family.parents.some(
            (parent) =>
              parent.id ===
              policy.parentId
          );

        if (!parentExists) {
          return true;
        }

        return false;
      }
    );

  if (
    hasIncompleteParentHealthPolicyDetails
  ) {
    warnings.push(
      "กรุณากรอกข้อมูลเบี้ยประกันสุขภาพบิดา/มารดาให้ครบ โดยเลือกบิดาหรือมารดาและระบุจำนวนผู้มีเงินได้ที่ร่วมจ่าย"
    );
  }

  if (hasIncompleteParentOtherClaim) {
    warnings.push(
      "กรุณาระบุว่ามีผู้มีเงินได้คนอื่นใช้สิทธิลดหย่อนบุพการีคนนี้แล้วหรือไม่"
    );
  }

  const hasIncompleteChildThailandStay =
    family.isThaiTaxResident === false &&
    family.children.some((child) => {
      if (!child.supportedByTaxpayer) {
        return false;
      }

      if (
        child.annualAssessableIncome >=
        rules.eligibility
          .childIncomeLimitExclusive
      ) {
        return false;
      }

      if (child.birthYearBE === null) {
        return false;
      }

      const ageByYear =
        taxYear - child.birthYearBE;

      const potentiallyEligibleByAge =
        ageByYear < 20 ||
        (
          ageByYear <= 25 &&
          child.studyingHigherEducation
        );

      return (
        potentiallyEligibleByAge &&
        child.stayedInThailand180Days ==
          null
      );
    });

  if (hasIncompleteChildThailandStay) {
    warnings.push(
      "กรุณาระบุว่าบุตรอยู่ในประเทศไทยตั้งแต่ 180 วันขึ้นไปหรือไม่"
    );
  }

  const hasIncompleteDisabledThailandStay =
    family.isThaiTaxResident === false &&
    family.disabledDependents.some(
      (dependent) =>
        dependent.supportedByTaxpayer &&
        dependent.hasRequiredEvidence &&
        dependent.annualAssessableIncome <=
          rules.eligibility
            .disabledIncomeLimitInclusive &&
        dependent.stayedInThailand180Days ==
          null
    );

  if (hasIncompleteDisabledThailandStay) {
    warnings.push(
      "กรุณาระบุว่าผู้พิการหรือทุพพลภาพที่อยู่ในความอุปการะอยู่ในประเทศไทยตั้งแต่ 180 วันขึ้นไปหรือไม่"
    );
  }

  const hasIncompleteDisabledEvidence =
    family.disabledDependents.some(
      (dependent) =>
        dependent.supportedByTaxpayer &&
        dependent.annualAssessableIncome <=
          rules.eligibility
            .disabledIncomeLimitInclusive &&
        dependent.claimedByOtherTaxpayer !==
          true &&
        (
          family.isThaiTaxResident !== false ||
          dependent.stayedInThailand180Days !==
            false
        ) &&
        dependent.hasRequiredEvidence ==
          null
    );

  if (hasIncompleteDisabledEvidence) {
    warnings.push(
      "กรุณาระบุว่าผู้พิการหรือทุพพลภาพมีหลักฐานสำหรับใช้สิทธิลดหย่อนครบตามเงื่อนไขหรือไม่"
    );
  }

  const hasIncompleteDisabledOtherClaim =
    family.disabledDependents.some(
      (dependent) =>
        dependent.supportedByTaxpayer &&
        dependent.hasRequiredEvidence &&
        dependent.annualAssessableIncome <=
          rules.eligibility
            .disabledIncomeLimitInclusive &&
        (
          family.isThaiTaxResident !== false ||
          dependent.stayedInThailand180Days ===
            true
        ) &&
        dependent.claimedByOtherTaxpayer ==
          null
    );

  if (hasIncompleteDisabledOtherClaim) {
    warnings.push(
      "กรุณาระบุว่ามีผู้มีเงินได้คนอื่นใช้สิทธิลดหย่อนผู้พิการหรือทุพพลภาพบุคคลนี้แล้วหรือไม่"
    );
  }

  const hasIncompleteSpouseIncome =
    family.maritalStatus === "married" &&
    family.spouseHasAssessableIncome === null;

  if (hasIncompleteSpouseIncome) {
    warnings.push(
      "กรุณาระบุว่าคู่สมรสมีเงินได้พึงประเมินหรือไม่"
    );
  }

  const hasIncompleteSpouseMarriageDuration =
    deductions.spouseLifeInsurance > 0 &&
    family.maritalStatus === "married" &&
    spouseHasAssessableIncome === false &&
    family.marriedFullTaxYear === null;

  if (hasIncompleteSpouseMarriageDuration) {
    warnings.push(
      "กรุณาระบุว่ามีสถานะสมรสตลอดปีภาษีนี้หรือไม่ เพื่อคำนวณสิทธิเบี้ยประกันชีวิตคู่สมรส"
    );
  }

  const hasIncompleteMarriageEndTiming =
    (
      family.maritalStatus === "divorced" ||
      family.maritalStatus === "widowed"
    ) &&
    family.marriageEndedThisTaxYear == null;

  if (hasIncompleteMarriageEndTiming) {
    warnings.push(
      "กรุณาระบุว่าการสมรสสิ้นสุดภายในปีภาษีนี้หรือไม่"
    );
  }

  const hasIncompleteFormerSpouseIncome =
    (
      family.maritalStatus === "divorced" ||
      family.maritalStatus === "widowed"
    ) &&
    family.marriageEndedThisTaxYear === true &&
    family.formerSpouseHadAssessableIncomeThisTaxYear ==
      null;

  if (hasIncompleteFormerSpouseIncome) {
    warnings.push(
      "กรุณาระบุว่าอดีตคู่สมรสมีเงินได้พึงประเมินในปีภาษีนี้หรือไม่"
    );
  }

  const baseIsComplete =
    !hasIncompleteSpouseIncome &&
    !hasIncompleteSpouseMarriageDuration &&
    !hasIncompleteMarriageEndTiming &&
    !hasIncompleteFormerSpouseIncome &&
    !hasIncompleteParentAge &&
    !hasIncompleteParentOtherClaim &&
    !hasIncompleteParentThailandResidence &&
    !hasIncompleteParentHealthPolicyDetails &&
    !hasIncompleteChildThailandStay &&
    !hasIncompleteDisabledThailandStay &&
    !hasIncompleteDisabledEvidence &&
    !hasIncompleteDisabledOtherClaim &&
    foreignIncomePartition.isComplete &&
    legacyInvestmentIncome === 0 &&
    legacyRentIncome === 0 &&
    legacyProfessionalIncome === 0 &&
    legacyBusinessIncome === 0 &&
    unsupportedOtherIncome === 0 &&
    section40_3RightsExpense.isComplete &&
    section40_4InterestResult.isComplete &&
    section40_4DividendResult.isComplete &&
    section40_5RentalExpense.isComplete &&
    section40_6ProfessionalExpense.isComplete &&
    section40_7ContractExpense.isComplete &&
    section40_8BusinessExpense.isComplete;

  if (legacyInvestmentIncome > 0) {
    warnings.push(
      "พบรายได้จากการลงทุนที่บันทึกไว้จากระบบเวอร์ชันเดิม ระบบจะไม่นำยอดนี้มาคำนวณภาษีอัตโนมัติ กรุณาจัดประเภทรายได้ใหม่ในรายการที่ถูกต้อง"
    );
  }

  if (legacyRentIncome > 0) {
    warnings.push(
      "พบรายได้ค่าเช่าที่บันทึกไว้จากระบบเวอร์ชันเดิม ระบบยังไม่ทราบประเภททรัพย์สินและวิธีหักค่าใช้จ่าย จึงยังไม่สามารถคำนวณรายได้ 40(5) นี้ได้อย่างสมบูรณ์ กรุณากรอกใหม่ในรายการค่าเช่า 40(5)"
    );
  }

  if (legacyProfessionalIncome > 0) {
    warnings.push(
      "พบรายได้วิชาชีพอิสระที่บันทึกไว้จากระบบเวอร์ชันเดิม ระบบยังไม่ทราบประเภทวิชาชีพและวิธีหักค่าใช้จ่าย จึงยังไม่สามารถคำนวณรายได้ 40(6) ได้อย่างสมบูรณ์ กรุณากรอกใหม่ในรายการวิชาชีพอิสระ 40(6)"
    );
  }

  if (legacyBusinessIncome > 0) {
    warnings.push(
      "พบรายได้ธุรกิจหรือค้าขายที่บันทึกไว้จากระบบเวอร์ชันเดิม ระบบยังไม่ทราบประเภทกิจการและวิธีหักค่าใช้จ่าย จึงยังไม่สามารถคำนวณรายได้ 40(8) นี้ได้อย่างสมบูรณ์ กรุณากรอกใหม่ในรายการ 40(8)"
    );
  }

  if (unsupportedOtherIncome > 0) {
    warnings.push(
      "มีรายได้อื่นที่ยังไม่ได้จัดประเภทหรือยังไม่รองรับการคำนวณ ระบบจึงแสดงผลภาษีแบบ Preliminary เท่านั้น"
    );
  }

  if (!section40_3RightsExpense.isComplete) {
    warnings.push(
      "รายได้มาตรา 40(3) ประเภทสิทธิใช้วิธีหักค่าใช้จ่ายไม่ตรงกัน กรุณาเลือกวิธีเดียวกันก่อนคำนวณ"
    );
  }

  if (!section40_4InterestResult.isComplete) {
    warnings.push(
      "รายการดอกเบี้ย 40(4)(ก) เลือกวิธีเสียภาษีไม่สอดคล้องกัน กรุณาตรวจสอบก่อนคำนวณ"
    );
  }

  if (!section40_4DividendResult.isComplete) {
    warnings.push(
      "รายการเงินปันผล 40(4)(ข) เลือกวิธีเสียภาษีไม่สอดคล้องกัน กรุณาตรวจสอบก่อนคำนวณ"
    );
  }

  if (!section40_5RentalExpense.isComplete) {
    warnings.push(
      "รายได้ค่าเช่า 40(5) ยังระบุประเภททรัพย์สินหรือวิธีหักค่าใช้จ่ายไม่ครบหรือไม่สอดคล้องกัน กรุณาตรวจสอบก่อนคำนวณ"
    );
  }

  if (!section40_6ProfessionalExpense.isComplete) {
    warnings.push(
      "รายได้มาตรา 40(6) ยังระบุประเภทวิชาชีพหรือวิธีหักค่าใช้จ่ายไม่ครบ หรือใช้วิธีหักค่าใช้จ่ายไม่สอดคล้องกัน กรุณาตรวจสอบก่อนคำนวณ"
    );
  }

  if (!section40_7ContractExpense.isComplete) {
    warnings.push(
      "รายได้มาตรา 40(7) เลือกวิธีหักค่าใช้จ่ายไม่สอดคล้องกัน กรุณาเลือกวิธีเดียวกันก่อนคำนวณ"
    );
  }

  if (!section40_8BusinessExpense.isComplete) {
    warnings.push(
      "รายได้มาตรา 40(8) ยังระบุประเภทกิจการหรือวิธีหักค่าใช้จ่ายไม่ครบ หรือใช้วิธีหักค่าใช้จ่ายไม่สอดคล้องกัน กรุณาตรวจสอบก่อนคำนวณ"
    );
  }

  /*
   * --------------------
   * FAMILY ALLOWANCES
   * --------------------
   */

  const taxpayerAllowance =
    rules.allowances.taxpayer;

  const currentSpouseQualifies =
    family.maritalStatus === "married" &&
    spouseHasAssessableIncome === false;

  const formerSpouseQualifies =
    (
      family.maritalStatus === "divorced" ||
      family.maritalStatus === "widowed"
    ) &&
    family.marriageEndedThisTaxYear === true &&
    family.formerSpouseHadAssessableIncomeThisTaxYear ===
      false;

  const spouseAllowance =
    currentSpouseQualifies ||
    formerSpouseQualifies
      ? rules.allowances.spouse
      : 0;

  const childAllowance =
    calculateChildAllowance(
      family,
      taxYear,
      rules,
      warnings
    );

  const parentAllowance =
    calculateParentAllowance(
      family,
      taxYear,
      rules
    );

  const disabledAllowance =
    calculateDisabledAllowance(
      family,
      rules,
      family.isThaiTaxResident
    );

  const totalFamilyAllowances =
    taxpayerAllowance +
    spouseAllowance +
    childAllowance +
    parentAllowance +
    disabledAllowance;

  /*
   * --------------------
   * AFTER FAMILY
   * --------------------
   */

   const incomeAfterFamilyAllowances =
      Math.max(
        0,
        incomeAfterEnergyEfficientInvestmentExemption -
          totalFamilyAllowances
      );

  /*
   * --------------------
   * INSURANCE DEDUCTIONS
   * --------------------
   */

   const insuranceDeductions =
     calculateInsuranceDeductions({
       deductions,
       family,
       rules,
     });

   warnings.push(
    ...insuranceDeductions.warnings
   );

   /*
    * พื้นที่ของเบี้ยประกันชีวิตปกติ
    * หลัง Life + Health ใช้ไปแล้ว
    */
    const ordinaryLifeUsed =
      insuranceDeductions.lifeInsurance.allowed +
      insuranceDeductions.healthInsuranceSelf.allowed;

    const ordinaryLifeRoom =
      Math.max(
        0,
        rules.deductions.insurance.lifeAndHealthCombinedMax -
          ordinaryLifeUsed
      );

    const retirementDeductions =
      calculateRetirementDeductions({
        deductions,
        rules,

        assessableIncome:
          totalGrossIncome,

        providentFundWageBase:
          annualSalary,

        ordinaryLifeRoom,
      });

    warnings.push(
      ...retirementDeductions.warnings
    );

    /*
    * --------------------
    * GENERAL DEDUCTIONS
    * --------------------
    */

    const generalDeductions =
      calculateGeneralDeductions({
        deductions,

        rules,

        assessableIncome:
          totalGrossIncome,
      });

    warnings.push(
      ...generalDeductions.warnings
    );

  /*
  * --------------------
  * PREGNANCY / CHILDBIRTH
  * --------------------
  */

  const pregnancyDeductions =
    calculatePregnancyDeductions({
      family,
      rules,
    });

  warnings.push(
    ...pregnancyDeductions.warnings
  );  

 /*
  * --------------------
  * NON-DONATION DEDUCTIONS
  * --------------------
  */

  const nonDonationCurrentDeductions =
    insuranceDeductions.totalAllowed +
    retirementDeductions.totalAllowed +
    generalDeductions.totalAllowed +
    pregnancyDeductions.totalAllowed;

  /*
  * ฐานก่อนหักเงินบริจาค
  */
  const incomeBeforeDonations =
    Math.max(
      0,
      incomeAfterFamilyAllowances -
        nonDonationCurrentDeductions
    );

  /*
  * --------------------
  * DONATIONS
  * --------------------
  */

  const donationDeductions =
    calculateDonationDeductions({
      deductions,

      family,

      rules,

      incomeBeforeDonations,
    });

  warnings.push(
    ...donationDeductions.warnings
  );

  /*
  * รวม deduction ทั้งหมด
  */
  const totalCurrentDeductions =
    nonDonationCurrentDeductions +
    donationDeductions.totalAllowed;

  /*
  * --------------------
  * TAXABLE INCOME
  * --------------------
  */

  const taxableIncome =
    Math.max(
      0,
      incomeAfterFamilyAllowances -
        totalCurrentDeductions
    );

  /*
  * --------------------
  * METHOD 1
  * Progressive tax
  * หลังใช้ค่าลดหย่อนปัจจุบัน
  * --------------------
  */

  const method1Tax =
    calculateProgressiveTax(
      taxableIncome,
      rules
    );

  /*
  * Progressive tax
  * ก่อนใช้ค่าลดหย่อนปัจจุบัน
  */
  const method1BeforeCurrentDeductions =
    calculateProgressiveTax(
      incomeAfterFamilyAllowances,
      rules
    );

  /*
  * --------------------
  * METHOD 2
  * 0.5%
  * --------------------
  */

  const nonEmploymentIncome =
    section40_2AfterExemptions +
    section40_3AnnuityAfterExemptions +
    section40_3RightsAfterExemptions +
    section40_4InterestAfterExemptions +
    section40_4DividendAfterExemptions +
    section40_5AfterExemptions +
    section40_6AfterExemptions +
    section40_7AfterExemptions +
    section40_8AfterExemptions +
    legacyRentIncome +
    legacyProfessionalIncome +
    legacyBusinessIncome +
    unsupportedOtherIncome;

  let method2Tax = 0;

  if (
    nonEmploymentIncome >=
    rules.alternativeTax.threshold
  ) {
    const calculated =
      nonEmploymentIncome *
      rules.alternativeTax.rate;

    if (
      calculated >
      rules.alternativeTax.exemptIfTaxNotOver
    ) {
      method2Tax =
        calculated;
    }
  }

  /*
  * สำคัญ:
  * ต้องอยู่นอก if ด้านบน
  */
  const taxBeforeCurrentDeductions =
    Math.max(
      method1BeforeCurrentDeductions,
      method2Tax
    );
  /*
  * ภาษีหลังใช้ deduction ปัจจุบัน
  */
  const taxBeforeCredits =
    Math.max(
      method1Tax,
      method2Tax
    );

  const foreignTaxCredit =
    calculateForeignTaxCredit({
      foreignAggregate,

      totalGrossIncome,

      thaiTaxForCreditLimitation:
        taxBeforeCredits,

      eligibility:
        foreignTaxCreditEligibility,
    });

  /*
  * --------------------
  * TAX CREDITS
  * --------------------
  *
  * ภาษีหัก ณ ที่จ่ายใช้ยอดที่ถูกหักจริง
  * ตามหนังสือรับรอง
  *
  * ไม่คำนวณอัตราหัก ณ ที่จ่ายจากประเภท
  * เงินได้ภายใน Tax Engine
  */

  const section40_1WithholdingTaxCredit =
    Math.max(
      0,
      income.section40_1TaxWithheld ?? 0
    );

  const section40_2WithholdingTaxCredit =
    income.hasOtherIncome
      ? Math.max(
          0,
          income.section40_2TaxWithheld ?? 0
        )
      : 0;

  const section40_3WithholdingTaxCredit =
    sum(
      section40_3Items.map(
        (item) =>
          Math.max(
            0,
            item.taxWithheld ?? 0
          )
      )
    );

  const section40_5WithholdingTaxCredit =
    sum(
      section40_5Items.map(
        (item) =>
          Math.max(
            0,
            item.taxWithheld ?? 0
          )
      )
    );

  const section40_6WithholdingTaxCredit =
    sum(
      section40_6Items.map(
        (item) =>
          Math.max(
            0,
            item.taxWithheld ?? 0
          )
      )
    );

  const section40_7WithholdingTaxCredit =
    sum(
      section40_7Items.map(
        (item) =>
          Math.max(
            0,
            item.taxWithheld ?? 0
          )
      )
    );

  const section40_8WithholdingTaxCredit =
    sum(
      section40_8Items.map(
        (item) =>
          Math.max(
            0,
            item.taxWithheld ?? 0
          )
      )
    );

  const withholdingTaxCredit =
    section40_1WithholdingTaxCredit +
    section40_2WithholdingTaxCredit +
    section40_3WithholdingTaxCredit +
    section40_4InterestResult
      .creditableWithholdingTax +
    section40_4DividendResult
      .creditableWithholdingTax +
    section40_5WithholdingTaxCredit +
    section40_6WithholdingTaxCredit +
    section40_7WithholdingTaxCredit +
    section40_8WithholdingTaxCredit;

  const dividendTaxCredit =
    section40_4DividendResult
      .creditableDividendTaxCredit;

  const domesticTaxCredits =
  withholdingTaxCredit +
  dividendTaxCredit;

  /*
  * ภ.ง.ด.90:
  * หัก FTC ก่อน
  * แล้วจึงหัก WHT / credit อื่น
  */
  const taxAfterForeignTaxCredit =
    Math.max(
      0,
      taxBeforeCredits -
        foreignTaxCredit.totalAllowedCredit
    );

  const totalTaxCredits =
    domesticTaxCredits +
    foreignTaxCredit.totalAllowedCredit;

  const taxPayable =
    Math.max(
      0,
      taxAfterForeignTaxCredit -
        domesticTaxCredits
    );

  const taxRefund =
    Math.max(
      0,
      domesticTaxCredits -
        taxAfterForeignTaxCredit
    );

  const isComplete =
    baseIsComplete &&
    foreignTaxCredit.isComplete;

  /*
  * ผลประหยัดภาษี
  */
  const taxSavingsFromCurrentDeductions =
    Math.max(
      0,
      taxBeforeCurrentDeductions -
        taxBeforeCredits
    );

  /*
  * Marginal rate หลัง deduction
  */
  const marginalTaxRate =
    getMarginalTaxRate(
      taxableIncome,
      rules
    );

  /*
   * effective tax rate หลัง deduction
   */
  const effectiveTaxRate =
  totalGrossIncome > 0
    ? taxBeforeCredits /
      totalGrossIncome
    : 0;

  return {
    taxYear,

    totalGrossIncome,

    incomeExemptions: {
      seniorResident:
        seniorResidentExemption,

      total:
        seniorResidentExemption,
    },

    incomeAfterExemptions,


    supportedIncome: {
      section40_1,
      section40_2,
      section40_3Annuity,
      section40_3Rights,
      section40_4Interest,
      section40_4Dividend,
      section40_5,
      section40_6,
      section40_7,
      section40_8,
      total: supportedIncome,
    },

    employmentExpense,

    incomeAfterExpenses,

    energyEfficientInvestmentQualifyingAmount:
      energyEfficientInvestment
        .totalQualifyingInvestment,

    energyEfficientInvestmentExemption,

    incomeAfterEnergyEfficientInvestmentExemption,

    familyAllowances: {
      taxpayer: taxpayerAllowance,
      spouse: spouseAllowance,
      children: childAllowance,
      parents: parentAllowance,
      disabledDependents: disabledAllowance,
      total: totalFamilyAllowances,
    },

    incomeAfterFamilyAllowances,

    insuranceDeductions,

    retirementDeductions,

    generalDeductions,

    pregnancyDeductions,

    donationDeductions,

    totalCurrentDeductions,

    taxableIncome,

    method1Tax,

    method2Tax,

    taxBeforeCurrentDeductions,

    taxBeforeCredits,

    taxCredits: {
      withholdingTax:
        withholdingTaxCredit,

      dividendTaxCredit,

      foreignTaxCredit,

      total:
        totalTaxCredits,
    },

    taxPayable,

    taxRefund,

    taxSavingsFromCurrentDeductions,

    marginalTaxRate,

    effectiveTaxRate,

    isComplete,

    warnings,
  };
}