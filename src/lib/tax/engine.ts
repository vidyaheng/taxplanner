import { IncomeData } from "@/types/income";
import { FamilyData, ChildData } from "@/types/family";
import { TaxResult } from "@/types/taxResult";

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
  warnings: string[]
) {
  if (
    !child.supportedByTaxpayer
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
      parent.claimedByOtherTaxpayer
    ) {
      continue;
    }

    if (
      parent.birthYearBE ===
      null
    ) {
      continue;
    }

    const age =
      taxYear -
      parent.birthYearBE;

    if (
      age <
      rules.eligibility
        .parentMinAge
    ) {
      continue;
    }

    if (
      parent.annualAssessableIncome >
      rules.eligibility
        .parentIncomeLimitInclusive
    ) {
      continue;
    }

    /*
     * บิดา/มารดาของคู่สมรส
     * ใช้สิทธิใน calculation นี้
     * เฉพาะคู่สมรสไม่มีเงินได้
     */
    if (
      parent.owner ===
        "spouse" &&
      (
        family.maritalStatus !==
          "married" ||
        family.spouseHasIncome
      )
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
  rules: TaxRuleSet
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
  income,
  family,
  deductions,
}: CalculateTaxInput): TaxResult {
  const rules =
    getRules(taxYear);

  const warnings: string[] =
    [];

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

  const unsupportedOtherIncome =
    income.hasOtherIncome
      ? sum([
          income.otherIncome
            .rent,

          income.otherIncome
            .professional,

          income.otherIncome
            .business,

          income.otherIncome
            .investment,

          income.otherIncome
            .other,
        ])
      : 0;

  const supportedIncome =
    section40_1 +
    section40_2;

  const totalGrossIncome =
    supportedIncome +
    unsupportedOtherIncome;

  const isComplete =
    unsupportedOtherIncome ===
    0;

  if (!isComplete) {
    warnings.push(
      "มีรายได้ 40(3)-40(8) ที่ยังไม่ได้คำนวณค่าใช้จ่าย ระบบจึงแสดงผลภาษีแบบ Preliminary เท่านั้น"
    );
  }

  /*
   * --------------------
   * EXPENSES
   * 40(1) + 40(2)
   * --------------------
   */

  const employmentExpense =
    Math.min(
      supportedIncome *
        rules.employmentExpense
          .rate,

      rules.employmentExpense
        .max
    );

  const incomeAfterExpenses =
    Math.max(
      0,
      supportedIncome -
        employmentExpense
    );

  /*
   * --------------------
   * FAMILY ALLOWANCES
   * --------------------
   */

  const taxpayerAllowance =
    rules.allowances.taxpayer;

  const spouseAllowance =
    family.maritalStatus ===
      "married" &&
    !family.spouseHasIncome
      ? rules.allowances
          .spouse
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
      rules
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
       incomeAfterExpenses -
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
    section40_2 +
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

    supportedIncome: {
      section40_1,
      section40_2,
      total: supportedIncome,
    },

    employmentExpense,

    incomeAfterExpenses,

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

    taxSavingsFromCurrentDeductions,

    marginalTaxRate,

    effectiveTaxRate,

    isComplete,

    warnings,
  };
}