"use client";

import Link from "next/link";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import PlanningStepper
  from "@/components/planning/PlanningStepper";

import {
  ChildData,
  MaritalStatus,
  ParentData,
  DisabledDependentData,
} from "@/types/family";

import {
  calculateTax,
} from "@/lib/tax/engine";

import { TAX_RULES_2569 } from "@/tax-rules/2569";

function parseNumber(
  value: string
) {
  return (
    Number(
      value.replace(/,/g, "")
    ) || 0
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "th-TH"
  ).format(value || 0);
}

function createId() {
  return crypto.randomUUID();
}

export default function FamilyPage() {
  const {
    state,
    setFamily,
  } = useTaxPlanner();

  const family = state.family;

  const spouseHasAssessableIncome =
    family.spouseHasAssessableIncome !==
    undefined
      ? family.spouseHasAssessableIncome
      : family.spouseHasIncome;

  const taxResult =
    calculateTax({
      taxYear:
        state.taxYear,

      income:
        state.income,

      family:
        state.family,

      deductions:
        state.deductions,
    });

  /*
  * ตัวเลขที่ถูกใช้ลดฐานจริง
  * ในแต่ละขั้นของ Engine
  *
  * ใช้ stage difference
  * เพื่อให้ Summary reconcile
  * กับ taxableIncome เสมอ
  */
  const incomeExemptionUsed =
    Math.max(
      0,
      taxResult.totalGrossIncome -
        taxResult.incomeAfterExemptions
    );

  const totalIncomeExpenses =
    Math.max(
      0,
      taxResult.incomeAfterExemptions -
        taxResult.incomeAfterExpenses
    );

  const energyExemptionUsed =
    Math.max(
      0,
      taxResult.incomeAfterExpenses -
        taxResult
          .incomeAfterEnergyEfficientInvestmentExemption
    );

  const familyAllowancesUsed =
    Math.max(
      0,
      taxResult
        .incomeAfterEnergyEfficientInvestmentExemption -
        taxResult
          .incomeAfterFamilyAllowances
    );

  const currentDeductionsUsed =
    Math.max(
      0,
      taxResult
        .incomeAfterFamilyAllowances -
        taxResult.taxableIncome
    );

const isSeniorResidentEligible =
  family.taxpayerAge65OrOlder === true &&
  family.isThaiTaxResident === true;

const seniorExemptionLimit =
  TAX_RULES_2569
    .incomeExemptions
    .seniorResidentMax;

const seniorAllocation =
  family.seniorIncomeExemptionAllocation;

const seniorAllocationTotal =
  seniorAllocation.section40_1 +
  seniorAllocation.section40_2 +
  seniorAllocation.section40_3Annuity +
  seniorAllocation.section40_3Rights +
  seniorAllocation.section40_4Interest +
  seniorAllocation.section40_4Dividend +
  seniorAllocation.section40_5 +
  seniorAllocation.section40_6 +
  seniorAllocation.section40_7 +
  (seniorAllocation.section40_8 ?? 0);

const seniorAllocationRemaining =
  Math.max(
    0,
    seniorExemptionLimit -
      seniorAllocationTotal
  );

  function getSeniorIncomeAmount(
    key:
      keyof typeof seniorAllocation
  ) {
    switch (key) {
      case "section40_1":
        return (
          taxResult.supportedIncome
            .section40_1
        );

      case "section40_2":
        return (
          taxResult.supportedIncome
            .section40_2
        );

      case "section40_3Annuity":
        return (
          taxResult.supportedIncome
            .section40_3Annuity
        );

      case "section40_3Rights":
        return (
          taxResult.supportedIncome
            .section40_3Rights
        );

      case "section40_4Interest":
        return (
          taxResult.supportedIncome
            .section40_4Interest
        );

      case "section40_4Dividend":
        return (
          taxResult.supportedIncome
            .section40_4Dividend
        );

      case "section40_5":
        return (
          taxResult.supportedIncome
            .section40_5
        );

      case "section40_6":
        return (
          taxResult.supportedIncome
            .section40_6
        );

      case "section40_7":
        return (
          taxResult.supportedIncome
            .section40_7
        );

      case "section40_8":
        return (
          taxResult.supportedIncome
            .section40_8 ?? 0
        );

      default:
        return 0;
    }
  }

  const hasSeniorAllocationAboveIncome =
    seniorAllocation.section40_1 >
      getSeniorIncomeAmount("section40_1") ||
    seniorAllocation.section40_2 >
      getSeniorIncomeAmount("section40_2") ||
    seniorAllocation.section40_3Annuity >
      getSeniorIncomeAmount(
        "section40_3Annuity"
      ) ||
    seniorAllocation.section40_3Rights >
      getSeniorIncomeAmount(
        "section40_3Rights"
      ) ||
    seniorAllocation.section40_4Interest >
      getSeniorIncomeAmount(
        "section40_4Interest"
      ) ||
    seniorAllocation.section40_4Dividend >
      getSeniorIncomeAmount(
        "section40_4Dividend"
      ) ||
    seniorAllocation.section40_5 >
      getSeniorIncomeAmount("section40_5") ||
    seniorAllocation.section40_6 >
      getSeniorIncomeAmount("section40_6") ||
    seniorAllocation.section40_7 >
      getSeniorIncomeAmount("section40_7") ||
    (seniorAllocation.section40_8 ?? 0) >
      getSeniorIncomeAmount("section40_8");

  function updateSeniorAllocation(
    key:
      keyof typeof seniorAllocation,
    value: number
  ) {
    const incomeLimit =
      Math.max(
        0,
        getSeniorIncomeAmount(key)
      );

    const currentAllocation =
      Math.max(
        0,
        seniorAllocation[key] ?? 0
      );

    const otherAllocated =
      Math.max(
        0,
        seniorAllocationTotal -
          currentAllocation
      );

    const remainingOverall =
      Math.max(
        0,
        seniorExemptionLimit -
          otherAllocated
      );

    const nextValue =
      Math.min(
        Math.max(0, value),
        incomeLimit,
        remainingOverall
      );

    setFamily({
      seniorIncomeExemptionAllocation: {
        ...seniorAllocation,
        [key]: nextValue,
      },
    });
  }

  function resetSeniorAllocation() {
    setFamily({
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
        section40_8: 0,
      },
    });
  }

  function changeMaritalStatus(
    status: MaritalStatus
  ) {
    /*
    * กดสถานภาพเดิมซ้ำ
    * ไม่ควรล้างคำตอบที่กรอกไว้แล้ว
    */
    if (
      family.maritalStatus === status
    ) {
      return;
    }

    if (status === "married") {
      setFamily({
        maritalStatus: "married",

        spouseHasIncome: false,
        spouseHasAssessableIncome: null,

        marriedFullTaxYear: null,

        marriageEndedThisTaxYear: null,
        formerSpouseHadAssessableIncomeThisTaxYear:
          null,
      });

      return;
    }

    if (
      status === "divorced" ||
      status === "widowed"
    ) {
      setFamily({
        maritalStatus: status,

        /*
        * current spouse fields
        * ไม่ใช้ในสถานภาพนี้
        */
        spouseHasIncome: false,
        spouseHasAssessableIncome: null,

        marriedFullTaxYear: false,

        /*
        * ต้องให้ผู้ใช้ตอบใหม่
        * สำหรับปีภาษีปัจจุบัน
        */
        marriageEndedThisTaxYear: null,

        formerSpouseHadAssessableIncomeThisTaxYear:
          null,
      });

      return;
    }

    /*
    * single
    */
    setFamily({
      maritalStatus: "single",

      spouseHasIncome: false,
      spouseHasAssessableIncome: null,

      marriedFullTaxYear: false,

      marriageEndedThisTaxYear: null,

      formerSpouseHadAssessableIncomeThisTaxYear:
        null,
    });
  }

  function addChild() {
    const child: ChildData = {
      id: createId(),

      relationship: "legal",

      birthYearBE: null,

      studyingHigherEducation:
        false,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      stayedInThailand180Days: null,
    };

    setFamily({
      children: [
        ...family.children,
        child,
      ],
    });
  }

  function updateChild(
    id: string,
    values: Partial<ChildData>
  ) {
    setFamily({
      children:
        family.children.map(
          (child) =>
            child.id === id
              ? {
                  ...child,
                  ...values,
                }
              : child
        ),
    });
  }

  function removeChild(
    id: string
  ) {
    setFamily({
      children:
        family.children.filter(
          (child) =>
            child.id !== id
        ),
    });
  }

  function addParent() {
    const parent: ParentData = {
      id: createId(),

      owner: "taxpayer",

      relation: "father",

      birthYearBE: null,

      age60OrOlder: null,

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer:
        null,

      isInThailand: null,
    };

    setFamily({
      parents: [
        ...family.parents,
        parent,
      ],
    });
  }

  function updateParent(
    id: string,
    values: Partial<ParentData>
  ) {
    setFamily({
      parents:
        family.parents.map(
          (parent) =>
            parent.id === id
              ? {
                  ...parent,
                  ...values,
                }
              : parent
        ),
    });
  }

  function removeParent(
    id: string
  ) {
    setFamily({
      parents:
        family.parents.filter(
          (parent) =>
            parent.id !== id
        ),
    });
  }

  function addDisabledDependent() {
    const dependent:
      DisabledDependentData = {
      id: createId(),

      type: "disabled",

      relation: "other",

      annualAssessableIncome: 0,

      supportedByTaxpayer: true,

      claimedByOtherTaxpayer: null,

      stayedInThailand180Days: null,

      hasRequiredEvidence: null,
    };

    setFamily({
      disabledDependents: [
        ...family.disabledDependents,
        dependent,
      ],
    });
  }

  function updateDisabledDependent(
    id: string,
    values:
      Partial<DisabledDependentData>
  ) {
    setFamily({
      disabledDependents:
        family.disabledDependents.map(
          (dependent) =>
            dependent.id === id
              ? {
                  ...dependent,
                  ...values,
                }
              : dependent
        ),
    });
  }

  function removeDisabledDependent(
    id: string
  ) {
    setFamily({
      disabledDependents:
        family.disabledDependents.filter(
          (dependent) =>
            dependent.id !== id
        ),
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">

        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">

            <Link
              href="/"
              className="text-xl font-bold text-slate-900"
            >
              Tax Planner
            </Link>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              ปีภาษี {state.taxYear}
            </div>
          </div>

          <div className="mt-7">
            <PlanningStepper
              currentStep={2}
            />
          </div>
        </header>

        <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:items-start">

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              ข้อมูลส่วนตัวและครอบครัว
            </h1>

            <p className="mt-2 text-slate-500">
              ใช้เฉพาะข้อมูลที่จำเป็นสำหรับตรวจสอบสิทธิลดหย่อน
            </p>

            {/* Taxpayer */}
            <div className="mt-8">

              <h2 className="text-lg font-semibold text-slate-900">
                เกี่ยวกับคุณ
              </h2>

              <div className="mt-5 max-w-sm">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  อายุในปีภาษี {state.taxYear}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFamily({
                        taxpayerAge65OrOlder: false,
                      })
                    }
                    className={[
                      "rounded-xl border px-4 py-3 text-sm font-medium transition",
                      family.taxpayerAge65OrOlder === false
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    ต่ำกว่า 65 ปี
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFamily({
                        taxpayerAge65OrOlder: true,
                      })
                    }
                    className={[
                      "rounded-xl border px-4 py-3 text-sm font-medium transition",
                      family.taxpayerAge65OrOlder === true
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    65 ปีขึ้นไป
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-medium text-slate-700">
                  อยู่ในประเทศไทยรวม 180 วันขึ้นไปในปีภาษีนี้
                </div>

                <div className="flex max-w-sm gap-2">
                  <StatusButton
                    active={
                      family.isThaiTaxResident === true
                    }
                    onClick={() =>
                      setFamily({
                        isThaiTaxResident: true,
                      })
                    }
                  >
                    ใช่
                  </StatusButton>

                  <StatusButton
                    active={
                      family.isThaiTaxResident === false
                    }
                    onClick={() =>
                      setFamily({
                        isThaiTaxResident: false,
                      })
                    }
                  >
                    ไม่ใช่
                  </StatusButton>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  ใช้ตรวจสอบสิทธิยกเว้นเงินได้สำหรับผู้มีอายุ
                  65 ปีขึ้นไป
                </p>
              </div>

              {isSeniorResidentEligible && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
                  <div>
                    <div className="font-semibold text-slate-900">
                      สิทธิยกเว้นเงินได้สำหรับผู้มีอายุ 65 ปีขึ้นไป
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      ยกเว้นเงินได้รวมได้ไม่เกิน{" "}
                      <strong className="text-slate-700">
                        {formatNumber(
                          seniorExemptionLimit
                        )}{" "}
                        บาท
                      </strong>
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white px-4 py-3">
                      <div className="text-xs text-slate-400">
                        จัดสรรไว้แล้ว
                      </div>

                      <div className="mt-1 font-semibold text-slate-800">
                        {formatNumber(
                          seniorAllocationTotal
                        )}{" "}
                        บาท
                      </div>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3">
                      <div className="text-xs text-slate-400">
                        สิทธิคงเหลือ
                      </div>

                      <div className="mt-1 font-semibold text-blue-700">
                        {formatNumber(
                          seniorAllocationRemaining
                        )}{" "}
                        บาท
                      </div>
                    </div>
                  </div>

                  {seniorAllocationTotal === 0 ? (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                      ตอนนี้ระบบจะจัดสรรสิทธิให้อัตโนมัติ
                      โดยใช้กับเงินได้ 40(2) ก่อน
                      แล้วจึงใช้กับเงินได้ 40(1)
                      หากต้องการกำหนดเอง
                      ให้กรอกจำนวนในแต่ละประเภทเงินได้ด้านล่าง
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      ขณะนี้คุณกำลังกำหนดการจัดสรรสิทธิเอง
                      ระบบจะใช้จำนวนที่กรอกไว้ด้านล่างแทนการจัดสรรอัตโนมัติ
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="text-sm font-medium text-slate-700">
                      กำหนดการจัดสรรเอง
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      ไม่จำเป็นต้องกรอก
                      หากต้องการให้ระบบจัดสรรให้อัตโนมัติ
                      แต่ละประเภทจะจัดสรรได้ไม่เกินรายได้จริง
                      และยอดรวมไม่เกิน{" "}
                      {formatNumber(
                        seniorExemptionLimit
                      )}{" "}
                      บาท
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <MoneyField
                      label="เงินได้ 40(1)"
                      value={
                        seniorAllocation
                          .section40_1
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_1",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="เงินได้ 40(2)"
                      value={
                        seniorAllocation
                          .section40_2
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_2",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="เงินรายปี 40(3)"
                      value={
                        seniorAllocation
                          .section40_3Annuity
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_3Annuity",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="ค่าลิขสิทธิ์ / ค่าสิทธิ 40(3)"
                      value={
                        seniorAllocation
                          .section40_3Rights
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_3Rights",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="ดอกเบี้ย 40(4)"
                      value={
                        seniorAllocation
                          .section40_4Interest
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_4Interest",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="เงินปันผล 40(4)"
                      value={
                        seniorAllocation
                          .section40_4Dividend
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_4Dividend",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="ค่าเช่า 40(5)"
                      value={
                        seniorAllocation
                          .section40_5
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_5",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="วิชาชีพอิสระ 40(6)"
                      value={
                        seniorAllocation
                          .section40_6
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_6",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="รับเหมา 40(7)"
                      value={
                        seniorAllocation
                          .section40_7
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_7",
                          value
                        )
                      }
                    />

                    <MoneyField
                      label="ธุรกิจ / กิจการอื่น 40(8)"
                      value={
                        seniorAllocation
                          .section40_8 ?? 0
                      }
                      onChange={(value) =>
                        updateSeniorAllocation(
                          "section40_8",
                          value
                        )
                      }
                    />
                  </div>

                  {seniorAllocationTotal > 0 && (
                    <button
                      type="button"
                      onClick={
                        resetSeniorAllocation
                      }
                      className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      กลับไปใช้การจัดสรรอัตโนมัติ
                    </button>
                  )}

                  {hasSeniorAllocationAboveIncome && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                      พบจำนวนที่จัดสรรไว้มากกว่ารายได้ปัจจุบันของบางประเภท
                      อาจเกิดจากมีการกลับไปแก้ไขยอดรายได้
                      กรุณาปรับจำนวนที่จัดสรรให้ไม่เกินรายได้ของประเภทนั้น
                    </div>
                  )}

                  {seniorAllocationTotal >
                    seniorExemptionLimit && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                      จำนวนที่จัดสรรรวมเกินสิทธิสูงสุด{" "}
                      {formatNumber(
                        seniorExemptionLimit
                      )}{" "}
                      บาท
                      กรุณาลดจำนวนที่กรอก
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">

                <div className="mb-3 text-sm font-medium text-slate-700">
                  สัญชาติไทย
                </div>

                <div className="flex max-w-sm gap-2">

                  <StatusButton
                    active={
                      family.isThaiNational === true
                    }
                    onClick={() =>
                      setFamily({
                        isThaiNational: true,
                      })
                    }
                  >
                    ใช่
                  </StatusButton>

                  <StatusButton
                    active={
                      family.isThaiNational === false
                    }
                    onClick={() =>
                      setFamily({
                        isThaiNational: false,
                      })
                    }
                  >
                    ไม่ใช่
                  </StatusButton>

                </div>

                <p className="mt-2 text-sm text-slate-400">
                  ใช้ตรวจสอบสิทธิบางรายการ เช่น
                  เงินบริจาคให้พรรคการเมือง
                </p>

              </div>

              <div className="mt-6">

                <div className="mb-3 text-sm font-medium text-slate-700">
                  สถานภาพ
                </div>

                <div className="grid gap-2 sm:grid-cols-4">

                  <StatusButton
                    active={
                      family.maritalStatus ===
                      "single"
                    }
                    onClick={() =>
                      changeMaritalStatus("single")
                    }
                  >
                    โสด
                  </StatusButton>

                  <StatusButton
                    active={
                      family.maritalStatus ===
                      "married"
                    }
                    onClick={() =>
                      changeMaritalStatus("married")
                    }
                  >
                    สมรส
                  </StatusButton>

                  <StatusButton
                    active={
                      family.maritalStatus ===
                      "divorced"
                    }
                    onClick={() =>
                      changeMaritalStatus("divorced")
                    }
                  >
                    หย่า
                  </StatusButton>

                  <StatusButton
                    active={
                      family.maritalStatus ===
                      "widowed"
                    }
                    onClick={() =>
                      changeMaritalStatus("widowed")
                    }
                  >
                    หม้าย
                  </StatusButton>
                </div>
              </div>

              {family.maritalStatus === "married" && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 sm:p-5">

                  <div className="font-medium text-slate-800">
                    คู่สมรสมีเงินได้ในปีภาษีนี้หรือไม่?
                  </div>

                  <div className="mt-4 flex gap-2">

                    <StatusButton
                      active={
                        spouseHasAssessableIncome ===
                        false
                      }
                      onClick={() =>
                        setFamily({
                          spouseHasAssessableIncome:
                            false,

                          /*
                          * sync legacy field
                          */
                          spouseHasIncome: false,
                        })
                      }
                    >
                      ไม่มี
                    </StatusButton>

                    <StatusButton
                      active={
                        spouseHasAssessableIncome ===
                        true
                      }
                      onClick={() =>
                        setFamily({
                          spouseHasAssessableIncome:
                            true,

                          /*
                          * sync legacy field
                          */
                          spouseHasIncome: true,
                        })
                      }
                    >
                      มี
                    </StatusButton>
                  </div>

                  {spouseHasAssessableIncome ===
                    false && (
                    <div className="mt-6 border-t border-slate-200 pt-5">

                      <div className="font-medium text-slate-800">
                        มีสถานะสมรสตลอดปีภาษีนี้หรือไม่?
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        ใช้ตรวจสอบสิทธิบางรายการ เช่น
                        เบี้ยประกันชีวิตของคู่สมรส
                      </p>

                      <div className="mt-4 flex gap-2">

                        <StatusButton
                          active={
                            family.marriedFullTaxYear ===
                            false
                          }
                          onClick={() =>
                            setFamily({
                              marriedFullTaxYear:
                                false,
                            })
                          }
                        >
                          ไม่
                        </StatusButton>

                        <StatusButton
                          active={
                            family.marriedFullTaxYear ===
                            true
                          }
                          onClick={() =>
                            setFamily({
                              marriedFullTaxYear:
                                true,
                            })
                          }
                        >
                          ใช่
                        </StatusButton>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {(
                family.maritalStatus ===
                  "divorced" ||
                family.maritalStatus ===
                  "widowed"
              ) && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 sm:p-5">
                  <div className="font-medium text-slate-800">
                    การสมรสสิ้นสุดภายในปีภาษีนี้หรือไม่?
                  </div>

                  <div className="mt-4 flex gap-2">
                    <StatusButton
                      active={
                        family.marriageEndedThisTaxYear ===
                        false
                      }
                      onClick={() =>
                        setFamily({
                          marriageEndedThisTaxYear:
                            false,
                          formerSpouseHadAssessableIncomeThisTaxYear:
                            null,
                        })
                      }
                    >
                      ไม่
                    </StatusButton>

                    <StatusButton
                      active={
                        family.marriageEndedThisTaxYear ===
                        true
                      }
                      onClick={() =>
                        setFamily({
                          marriageEndedThisTaxYear:
                            true,
                        })
                      }
                    >
                      ใช่
                    </StatusButton>
                  </div>

                  {family.marriageEndedThisTaxYear ===
                    true && (
                    <div className="mt-6 border-t border-slate-200 pt-5">
                      <div className="font-medium text-slate-800">
                        อดีตคู่สมรสมีเงินได้พึงประเมินในปีภาษีนี้หรือไม่?
                      </div>

                      <div className="mt-4 flex gap-2">
                        <StatusButton
                          active={
                            family.formerSpouseHadAssessableIncomeThisTaxYear ===
                            false
                          }
                          onClick={() =>
                            setFamily({
                              formerSpouseHadAssessableIncomeThisTaxYear:
                                false,
                            })
                          }
                        >
                          ไม่มี
                        </StatusButton>

                        <StatusButton
                          active={
                            family.formerSpouseHadAssessableIncomeThisTaxYear ===
                            true
                          }
                          onClick={() =>
                            setFamily({
                              formerSpouseHadAssessableIncomeThisTaxYear:
                                true,
                            })
                          }
                        >
                          มี
                        </StatusButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Children */}
            <div className="mt-10 border-t border-slate-100 pt-8">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    บุตร
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เพิ่มตามลำดับจากบุตรคนโต
                    โดยไม่ต้องกรอกชื่อ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addChild}
                  className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  + เพิ่มบุตร
                </button>
              </div>

              {family.children.length > 0 && (

                <div className="mt-5 space-y-4">

                  {family.children.map(
                    (
                      child,
                      index
                    ) => (
                      <div
                        key={
                          child.id
                        }
                        className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div className="font-semibold text-slate-900">
                            บุตรคนที่{" "}
                            {index + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeChild(
                                child.id
                              )
                            }
                            className="text-sm text-slate-400 hover:text-red-600"
                          >
                            ลบ
                          </button>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              สถานะบุตร
                            </label>

                            <select
                              value={
                                child.relationship
                              }
                              onChange={(e) =>
                                updateChild(
                                  child.id,
                                  {
                                    relationship:
                                      e.target
                                        .value as ChildData["relationship"],
                                  }
                                )
                              }
                              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:border-blue-500"
                            >
                              <option value="legal">
                                บุตรชอบด้วยกฎหมาย
                              </option>

                              <option value="adopted">
                                บุตรบุญธรรม
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              ปีเกิด
                            </label>

                            <input
                              inputMode="numeric"
                              value={
                                child.birthYearBE ??
                                ""
                              }
                              onChange={(e) =>
                                updateChild(
                                  child.id,
                                  {
                                    birthYearBE:
                                      parseNumber(
                                        e
                                          .target
                                          .value
                                      ) ||
                                      null,
                                  }
                                )
                              }
                              placeholder="พ.ศ."
                              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-900 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              กำลังศึกษาในระดับอุดมศึกษา
                            </label>

                            <YesNo
                              value={
                                child.studyingHigherEducation
                              }
                              onChange={(
                                value
                              ) =>
                                updateChild(
                                  child.id,
                                  {
                                    studyingHigherEducation:
                                      value,
                                  }
                                )
                              }
                            />
                          </div>

                          <MoneyField
                            label="เงินได้พึงประเมินของบุตรทั้งปี"
                            value={
                              child.annualAssessableIncome
                            }
                            onChange={(
                              value
                            ) =>
                              updateChild(
                                child.id,
                                {
                                  annualAssessableIncome:
                                    value,
                                }
                              )
                            }
                          />

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              อยู่ในความอุปการะของคุณ
                            </div>

                            <YesNo
                              value={
                                child.supportedByTaxpayer
                              }
                              onChange={(value) =>
                                updateChild(
                                  child.id,
                                  {
                                    supportedByTaxpayer:
                                      value,
                                  }
                                )
                              }
                            />
                          </div>

                          {family.isThaiTaxResident ===
                            false && (
                            <div>
                              <div className="mb-2 text-sm font-medium text-slate-700">
                                บุตรอยู่ในประเทศไทยตั้งแต่
                                180 วันขึ้นไปหรือไม่?
                              </div>

                              <div className="flex gap-2">
                                <StatusButton
                                  active={
                                    child.stayedInThailand180Days ===
                                    false
                                  }
                                  onClick={() =>
                                    updateChild(
                                      child.id,
                                      {
                                        stayedInThailand180Days:
                                          false,
                                      }
                                    )
                                  }
                                >
                                  ไม่
                                </StatusButton>

                                <StatusButton
                                  active={
                                    child.stayedInThailand180Days ===
                                    true
                                  }
                                  onClick={() =>
                                    updateChild(
                                      child.id,
                                      {
                                        stayedInThailand180Days:
                                          true,
                                      }
                                    )
                                  }
                                >
                                  ใช่
                                </StatusButton>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Parents */}
            <div className="mt-10 border-t border-slate-100 pt-8">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    บิดา / มารดา
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เพิ่มเฉพาะบุคคลที่ต้องการตรวจสอบสิทธิลดหย่อน
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addParent}
                  className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  + เพิ่ม
                </button>
              </div>

              {family.parents.length >0 && (

                <div className="mt-5 space-y-4">

                  {family.parents.map(
                    (
                      parent,
                      index
                    ) => (
                      <div
                        key={
                          parent.id
                        }
                        className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div className="font-semibold text-slate-900">
                            บุพการี{" "}
                            {index + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeParent(
                                parent.id
                              )
                            }
                            className="text-sm text-slate-400 hover:text-red-600"
                          >
                            ลบ
                          </button>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              เป็นบิดา /
                              มารดาของ
                            </label>

                            <select
                              value={
                                parent.owner
                              }
                              onChange={(e) =>
                                updateParent(
                                  parent.id,
                                  {
                                    owner:
                                      e.target
                                        .value as ParentData["owner"],
                                  }
                                )
                              }
                              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                            >
                              <option value="taxpayer">
                                คุณ
                              </option>

                              <option value="spouse">
                                คู่สมรส
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              ความสัมพันธ์
                            </label>

                            <select
                              value={
                                parent.relation
                              }
                              onChange={(e) =>
                                updateParent(
                                  parent.id,
                                  {
                                    relation:
                                      e.target
                                        .value as ParentData["relation"],
                                  }
                                )
                              }
                              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                            >
                              <option value="father">
                                บิดา
                              </option>

                              <option value="mother">
                                มารดา
                              </option>
                            </select>
                          </div>

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              อายุ 60 ปีขึ้นไปหรือไม่?
                            </div>

                            <div className="flex gap-2">
                              <StatusButton
                                active={
                                  parent.age60OrOlder ===
                                  false
                                }
                                onClick={() =>
                                  updateParent(
                                    parent.id,
                                    {
                                      age60OrOlder:
                                        false,
                                    }
                                  )
                                }
                              >
                                ไม่
                              </StatusButton>

                              <StatusButton
                                active={
                                  parent.age60OrOlder ===
                                  true
                                }
                                onClick={() =>
                                  updateParent(
                                    parent.id,
                                    {
                                      age60OrOlder:
                                        true,
                                    }
                                  )
                                }
                              >
                                ใช่
                              </StatusButton>
                            </div>
                          </div>

                          <MoneyField
                            label="เงินได้พึงประเมินทั้งปี"
                            value={
                              parent.annualAssessableIncome
                            }
                            onChange={(
                              value
                            ) =>
                              updateParent(
                                parent.id,
                                {
                                  annualAssessableIncome:
                                    value,
                                }
                              )
                            }
                          />

                          {family.isThaiTaxResident === false && (
                            <div>
                              <div className="mb-2 text-sm font-medium text-slate-700">
                                บิดา / มารดาอยู่ในประเทศไทยหรือไม่?
                              </div>

                              <div className="flex gap-2">
                                <StatusButton
                                  active={
                                    parent.isInThailand === false
                                  }
                                  onClick={() =>
                                    updateParent(
                                      parent.id,
                                      {
                                        isInThailand: false,
                                      }
                                    )
                                  }
                                >
                                  ไม่
                                </StatusButton>

                                <StatusButton
                                  active={
                                    parent.isInThailand === true
                                  }
                                  onClick={() =>
                                    updateParent(
                                      parent.id,
                                      {
                                        isInThailand: true,
                                      }
                                    )
                                  }
                                >
                                  ใช่
                                </StatusButton>
                              </div>

                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                ใช้ตรวจสอบสิทธิลดหย่อนบุพการีและเบี้ยประกันสุขภาพบิดา / มารดา
                                สำหรับผู้มีเงินได้ที่มิได้เป็นผู้อยู่ในประเทศไทย
                              </p>
                            </div>
                          )}

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              อยู่ในความอุปการะของคุณ
                            </div>

                            <YesNo
                              value={
                                parent.supportedByTaxpayer
                              }
                              onChange={(
                                value
                              ) =>
                                updateParent(
                                  parent.id,
                                  {
                                    supportedByTaxpayer:
                                      value,
                                  }
                                )
                              }
                            />
                          </div>

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              มีผู้มีเงินได้คนอื่นใช้สิทธิบุพการีคนนี้แล้วหรือไม่?
                            </div>

                            <div className="flex gap-2">
                              <StatusButton
                                active={
                                  parent.claimedByOtherTaxpayer ===
                                  false
                                }
                                onClick={() =>
                                  updateParent(
                                    parent.id,
                                    {
                                      claimedByOtherTaxpayer:
                                        false,
                                    }
                                  )
                                }
                              >
                                ไม่มี
                              </StatusButton>

                              <StatusButton
                                active={
                                  parent.claimedByOtherTaxpayer ===
                                  true
                                }
                                onClick={() =>
                                  updateParent(
                                    parent.id,
                                    {
                                      claimedByOtherTaxpayer:
                                        true,
                                    }
                                  )
                                }
                              >
                                มี
                              </StatusButton>
                            </div>
                          </div>
                        </div>

                        {parent.owner ===
                          "spouse" &&
                          spouseHasAssessableIncome ===
                            true && (
                            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              ระบบจะตรวจเงื่อนไขของบิดา/มารดาคู่สมรสอีกครั้งใน Tax Engine
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Disabled */}
            <div className="mt-10 border-t border-slate-100 pt-8">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    ผู้พิการ /
                    ทุพพลภาพที่อุปการะ
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เพิ่มเฉพาะกรณีที่ต้องการใช้สิทธิ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addDisabledDependent
                  }
                  className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  + เพิ่ม
                </button>
              </div>

              {family
                .disabledDependents
                .length > 0 && (

                <div className="mt-5 space-y-4">

                  {family.disabledDependents.map(
                    (
                      dependent,
                      index
                    ) => (
                      <div
                        key={
                          dependent.id
                        }
                        className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div className="font-semibold text-slate-900">
                            รายการ{" "}
                            {index + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeDisabledDependent(
                                dependent.id
                              )
                            }
                            className="text-sm text-slate-400 hover:text-red-600"
                          >
                            ลบ
                          </button>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              ประเภท
                            </label>

                            <select
                              value={
                                dependent.type
                              }
                              onChange={(e) =>
                                updateDisabledDependent(
                                  dependent.id,
                                  {
                                    type:
                                      e.target
                                        .value as DisabledDependentData["type"],
                                  }
                                )
                              }
                              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                            >
                              <option value="disabled">
                                คนพิการ
                              </option>

                              <option value="incapacitated">
                                คนทุพพลภาพ
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              ความสัมพันธ์
                            </label>

                            <select
                              value={
                                dependent.relation
                              }
                              onChange={(e) =>
                                updateDisabledDependent(
                                  dependent.id,
                                  {
                                    relation:
                                      e.target
                                        .value as DisabledDependentData["relation"],
                                  }
                                )
                              }
                              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                            >
                              <option value="father">
                                บิดา
                              </option>

                              <option value="mother">
                                มารดา
                              </option>

                              <option value="spouse">
                                คู่สมรส
                              </option>

                              <option value="child">
                                บุตร
                              </option>

                              <option value="spouseFather">
                                บิดาคู่สมรส
                              </option>

                              <option value="spouseMother">
                                มารดาคู่สมรส
                              </option>

                              <option value="spouseChild">
                                บุตรของคู่สมรส
                              </option>

                              <option value="other">
                                บุคคลอื่น
                              </option>
                            </select>
                          </div>

                          <MoneyField
                            label="เงินได้พึงประเมินทั้งปี"
                            value={
                              dependent.annualAssessableIncome
                            }
                            onChange={(
                              value
                            ) =>
                              updateDisabledDependent(
                                dependent.id,
                                {
                                  annualAssessableIncome:
                                    value,
                                }
                              )
                            }
                          />

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              อยู่ในความอุปการะของคุณ
                            </div>

                            <YesNo
                              value={
                                dependent.supportedByTaxpayer
                              }
                              onChange={(value) =>
                                updateDisabledDependent(
                                  dependent.id,
                                  {
                                    supportedByTaxpayer:
                                      value,
                                  }
                                )
                              }
                            />
                          </div>

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              มีผู้มีเงินได้คนอื่นใช้สิทธิบุคคลนี้แล้วหรือไม่?
                            </div>

                            <div className="flex gap-2">
                              <StatusButton
                                active={
                                  dependent.claimedByOtherTaxpayer ===
                                  false
                                }
                                onClick={() =>
                                  updateDisabledDependent(
                                    dependent.id,
                                    {
                                      claimedByOtherTaxpayer:
                                        false,
                                    }
                                  )
                                }
                              >
                                ไม่มี
                              </StatusButton>

                              <StatusButton
                                active={
                                  dependent.claimedByOtherTaxpayer ===
                                  true
                                }
                                onClick={() =>
                                  updateDisabledDependent(
                                    dependent.id,
                                    {
                                      claimedByOtherTaxpayer:
                                        true,
                                    }
                                  )
                                }
                              >
                                มี
                              </StatusButton>
                            </div>
                          </div>

                          {family.isThaiTaxResident ===
                            false && (
                            <div>
                              <div className="mb-2 text-sm font-medium text-slate-700">
                                บุคคลนี้อยู่ในประเทศไทยตั้งแต่
                                180 วันขึ้นไปหรือไม่?
                              </div>

                              <div className="flex gap-2">
                                <StatusButton
                                  active={
                                    dependent.stayedInThailand180Days ===
                                    false
                                  }
                                  onClick={() =>
                                    updateDisabledDependent(
                                      dependent.id,
                                      {
                                        stayedInThailand180Days:
                                          false,
                                      }
                                    )
                                  }
                                >
                                  ไม่
                                </StatusButton>

                                <StatusButton
                                  active={
                                    dependent.stayedInThailand180Days ===
                                    true
                                  }
                                  onClick={() =>
                                    updateDisabledDependent(
                                      dependent.id,
                                      {
                                        stayedInThailand180Days:
                                          true,
                                      }
                                    )
                                  }
                                >
                                  ใช่
                                </StatusButton>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                              {dependent.type === "disabled"
                                ? "มีบัตรคนพิการและหลักฐานผู้ดูแลครบตามเงื่อนไข"
                                : "มีใบรับรองแพทย์และหลักฐานการอุปการะครบตามเงื่อนไข"}
                            </div>

                            <p className="mb-2 text-xs leading-5 text-slate-500">
                              {dependent.type === "disabled"
                                ? "รวมถึงหลักฐานสำหรับการใช้สิทธิลดหย่อนคนพิการ"
                                : "รวมถึงใบรับรองแพทย์ และหนังสือรับรองการอุปการะคนทุพพลภาพ"}
                            </p>

                            <div className="flex gap-2">
                              <StatusButton
                                active={
                                  dependent.hasRequiredEvidence ===
                                  false
                                }
                                onClick={() =>
                                  updateDisabledDependent(
                                    dependent.id,
                                    {
                                      hasRequiredEvidence:
                                        false,
                                    }
                                  )
                                }
                              >
                                ไม่ครบ
                              </StatusButton>

                              <StatusButton
                                active={
                                  dependent.hasRequiredEvidence ===
                                  true
                                }
                                onClick={() =>
                                  updateDisabledDependent(
                                    dependent.id,
                                    {
                                      hasRequiredEvidence:
                                        true,
                                    }
                                  )
                                }
                              >
                                ครบ
                              </StatusButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">

              <Link
                href="/planning/income"
                className="rounded-xl px-5 py-3 font-medium text-slate-500 hover:bg-slate-100"
              >
                ← ย้อนกลับ
              </Link>

              <Link
                href="/planning/deductions"
                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700"
              >
                ถัดไป →
              </Link>
            </div>
          </section>

          {/* Summary */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 min-[960px]:sticky min-[960px]:top-8">

            <div className="text-sm font-medium text-slate-500">
              สรุปครอบครัว
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-5">

                <div className="text-sm font-medium text-blue-700">
                    ภาษีคำนวณก่อนหักเครดิตภาษี
                </div>

                {taxResult.isComplete ? (
                    <>
                    <div className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                        {formatNumber(
                        taxResult.taxBeforeCredits
                        )}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                        บาท
                    </div>

                    <div className="mt-4 border-t border-blue-100 pt-4">

                        <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                            เงินได้สุทธิ
                        </span>

                        <span className="font-medium text-slate-900">
                            {formatNumber(
                            taxResult.taxableIncome
                            )}
                        </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">

                        <span className="text-slate-500">
                            อัตราภาษีขั้นสูงสุด (Marginal Rate)
                        </span>

                        <span className="font-medium text-blue-700">
                            {Math.round(
                            taxResult.marginalTaxRate *
                                100
                            )}
                            %
                        </span>
                        </div>
                    </div>
                    </>
                ) : (
                    <div className="mt-3 text-sm leading-6 text-amber-800">
                      ยังไม่สามารถคำนวณภาษีได้ครบถ้วน
                      เนื่องจากมีข้อมูลบางรายการที่ยังไม่สมบูรณ์
                      กรุณาตรวจสอบคำเตือนด้านล่าง
                    </div>
                )}
                </div>  

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-medium text-slate-700">
                    การคำนวณเบื้องต้น
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <Summary
                    label="รายได้รวม"
                    value={`${formatNumber(
                      taxResult.totalGrossIncome
                    )} บาท`}
                  />

                  {incomeExemptionUsed > 0 && (
                    <Summary
                      label="หักยกเว้นเงินได้"
                      value={`-${formatNumber(
                        incomeExemptionUsed
                      )} บาท`}
                    />
                  )}

                  <Summary
                    label="หักค่าใช้จ่าย"
                    value={`-${formatNumber(
                      totalIncomeExpenses
                    )} บาท`}
                  />

                  {energyExemptionUsed > 0 && (
                    <Summary
                      label="หักยกเว้นการลงทุนอนุรักษ์พลังงาน"
                      value={`-${formatNumber(
                        energyExemptionUsed
                      )} บาท`}
                    />
                  )}

                  {familyAllowancesUsed > 0 && (
                    <Summary
                      label="ลดหย่อนครอบครัว"
                      value={`-${formatNumber(
                        familyAllowancesUsed
                      )} บาท`}
                    />
                  )}

                  <div className="border-t border-slate-100 pt-3">

                    {currentDeductionsUsed > 0 && (
                      <Summary
                        label="ค่าลดหย่อนอื่น"
                        value={`-${formatNumber(
                          currentDeductionsUsed
                        )} บาท`}
                      />
                    )}

                    <Summary
                      label="เงินได้สุทธิ"
                      value={`${formatNumber(
                        taxResult.taxableIncome
                      )} บาท`}
                    />

                  </div>
                </div>
                </div>

            {taxResult.warnings.length > 0 && (
                <div className="mt-5 space-y-2">

                    {taxResult.warnings.map(
                    (warning, index) => (
                        <div
                        key={index}
                        className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"
                        >
                        {warning}
                        </div>
                    )
                    )}

                </div>
                )}

            <div className="mt-5 space-y-4 text-sm">

              <Summary
                label="สถานภาพ"
                value={
                  family.maritalStatus ===
                  "single"
                    ? "โสด"
                    : family.maritalStatus ===
                        "married"
                      ? "สมรส"
                      : family.maritalStatus ===
                          "divorced"
                        ? "หย่า"
                        : "หม้าย"
                }
              />

              {family.maritalStatus ===
                "married" && (
                <Summary
                  label="คู่สมรส"
                  value={
                    spouseHasAssessableIncome ===
                    true
                      ? "มีเงินได้"
                      : spouseHasAssessableIncome ===
                          false
                        ? "ไม่มีเงินได้"
                        : "ยังไม่ได้ระบุ"
                  }
                />
              )}

              <Summary
                label="บุตร"
                value={`${family.children.length} คน`}
              />

              <Summary
                label="บิดา / มารดา"
                value={`${family.parents.length} คน`}
              />

              <Summary
                label="ผู้พิการ / ทุพพลภาพ"
                value={`${family.disabledDependents.length} คน`}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              ระบบจะตรวจว่าแต่ละรายการใช้สิทธิลดหย่อนได้จริงเท่าใดในขั้นคำนวณภาษี
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatusButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1">

      <button
        type="button"
        onClick={() =>
          onChange(false)
        }
        className={`flex-1 rounded-lg px-4 py-2 text-sm ${
          !value
            ? "bg-white font-medium text-slate-900 shadow-sm"
            : "text-slate-500"
        }`}
      >
        ไม่
      </button>

      <button
        type="button"
        onClick={() =>
          onChange(true)
        }
        className={`flex-1 rounded-lg px-4 py-2 text-sm ${
          value
            ? "bg-white font-medium text-slate-900 shadow-sm"
            : "text-slate-500"
        }`}
      >
        ใช่
      </button>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">

        <input
          inputMode="numeric"
          value={
            value
              ? formatNumber(value)
              : ""
          }
          onChange={(e) =>
            onChange(
              parseNumber(
                e.target.value
              )
            )
          }
          placeholder="0"
          className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          บาท
        </span>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0 text-slate-500">
        {label}
      </div>

      <div className="whitespace-nowrap text-right tabular-nums text-slate-800">
        {value}
      </div>
    </div>
  );
}