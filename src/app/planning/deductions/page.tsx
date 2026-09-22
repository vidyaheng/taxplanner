"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import PlanningStepper
  from "@/components/planning/PlanningStepper";

import {
  calculateTax,
} from "@/lib/tax/engine";

import {
  applyPlanningToDeductions,
} from "@/lib/tax/scenarios";

import {
  DeductionData,
  ParentHealthInsurancePolicyData,
} from "@/types/deductions";

import {
  ParentData,
  PregnancyExpenseData,
} from "@/types/family";

type DeductionKey = {
  [K in keyof DeductionData]-?:
    NonNullable<
      DeductionData[K]
    > extends number
      ? K
      : never;
}[keyof DeductionData];

interface DeductionField {
  key: DeductionKey;
  label: string;
  description?: string;
}

interface DeductionSectionData {
  id: string;
  title: string;
  description: string;
  fields: DeductionField[];
}

const sections: DeductionSectionData[] = [
  {
    id: "insurance",
    title: "ประกัน",
    description:
      "ประกันชีวิตและสุขภาพที่มีอยู่แล้ว",
    fields: [
      {
        key: "lifeInsurance",
        label: "เบี้ยประกันชีวิต",
        description:
          "กรอกจำนวนเบี้ยที่เข้าเงื่อนไขทางภาษี",
      },
      {
        key: "healthInsuranceSelf",
        label: "เบี้ยประกันสุขภาพตนเอง",
      },
      {
        key: "spouseLifeInsurance",
        label: "เบี้ยประกันชีวิตคู่สมรส",
        description:
          "สำหรับกรณีคู่สมรสไม่มีเงินได้และเข้าเงื่อนไข",
      },
    ],
  },

  {
    id: "retirement",
    title: "การออมเพื่อเกษียณ",
    description:
      "เบี้ยประกันบำนาญ เงินสะสม และเงินลงทุนเพื่อการเกษียณ",
    fields: [
      {
        key: "pensionInsurance",
        label: "เบี้ยประกันชีวิตแบบบำนาญ",
        description:
          "บางส่วนอาจใช้ในวงเงินประกันชีวิต/สุขภาพ และส่วนเพิ่มเติมใช้เพดานร่วมกับกลุ่มเกษียณ",
      },
      {
        key: "providentFund",
        label: "กองทุนสำรองเลี้ยงชีพ (PVD)",
      },
      {
        key: "gpf",
        label: "กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)",
      },
      {
        key: "privateTeacherFund",
        label: "กองทุนสงเคราะห์ครูโรงเรียนเอกชน",
      },
      {
        key: "nsf",
        label: "กองทุนการออมแห่งชาติ (กอช.)",
      },
      {
        key: "rmf",
        label: "กองทุนรวมเพื่อการเลี้ยงชีพ (RMF)",
      },
    ],
  },

  {
    id: "investment",
    title: "การลงทุนลดหย่อน",
    description:
      "กองทุนเพื่อความยั่งยืนและสิทธิต่อเนื่อง",
    fields: [
      {
        key: "thaiEsg",
        label: "Thai ESG",
        description:
          "ค่าซื้อหน่วยลงทุนในปีภาษีนี้",
      },
      {
        key: "ltfToThaiEsgxTransferAmount",
        label: "Thai ESGX จากการสับเปลี่ยน LTF",
        description:
          "มูลค่า LTF ที่สับเปลี่ยนเป็น Thai ESGX ตามมาตรการปี 2568",
      },
    ],
  },

  {
    id: "general",
    title: "ค่าลดหย่อนอื่น",
    description:
      "ประกันสังคม บ้าน ครอบครัว และสิทธิอื่น",
    fields: [
      {
        key: "socialSecurity",
        label: "เงินสมทบประกันสังคม",
      },
      {
        key: "homeLoanInterest",
        label: "ดอกเบี้ยกู้ซื้อ / สร้างที่อยู่อาศัย",
      },
      {
        key: "socialEnterpriseInvestment",
        label: "เงินลงทุนในวิสาหกิจเพื่อสังคม",
      },
      {
        key: "solarRooftop",
        label: "Solar Rooftop บ้านอยู่อาศัย",
        description:
          "กรอกเฉพาะค่าซื้อและติดตั้งที่เข้าเงื่อนไข ระบบต้องติดตั้งบนที่อยู่อาศัย เชื่อมต่อโครงข่าย MEA/PEA สำเร็จ และมี e-Tax Invoice ใช้สิทธิได้ 1 ครั้ง 1 ระบบ สูงสุด 200,000 บาท",
      },
      {
        key: "artPurchase",
        label: "ค่าซื้องานศิลปะด้านทัศนศิลป์",
        description:
          "กรอกเฉพาะยอดซื้อผลงานที่เข้าเงื่อนไข เช่น จิตรกรรม ประติมากรรม ภาพพิมพ์ ภาพถ่าย หรือสื่อผสม ใช้สิทธิได้ตามจริงสูงสุด 100,000 บาท",
      },
    ],
  },

  {
    id: "donation",
    title: "เงินบริจาค",
    description:
      "กรอกเฉพาะยอดที่เข้าเงื่อนไขใช้สิทธิลดหย่อน",
    fields: [
      {
        key: "specialDonation",
        label:
          "เงินบริจาคที่ได้สิทธิพิเศษ",
        description:
          "กรอกยอดที่จ่ายจริง ไม่ต้องคูณ 2 ระบบจะคำนวณสิทธิให้",
      },
      {
        key: "generalDonation",
        label:
          "เงินบริจาคทั่วไป",
        description:
          "ปี 2569 การบริจาคให้วัด มูลนิธิ และสถานสาธารณกุศลเพื่อใช้สิทธิ ต้องผ่าน e-Donation",
      },
      {
        key: "airForceStupaDonation",
        label:
          "เงินบริจาคให้กองทัพอากาศตาม พ.ร.ฎ. 804",
        description:
          "สำหรับเงินที่บริจาคผ่านบัญชีเฉพาะของกองทัพอากาศเพื่อโครงการสร้างพระสถูปเจดีย์ ใช้สิทธิ 1 เท่า และใช้เพดาน 10% ร่วมกับเงินบริจาคทั่วไป",
      },
      {
        key: "politicalDonation",
        label:
          "เงินบริจาคให้พรรคการเมือง",
        description:
          "คนละเรื่องกับการอุดหนุนเงินภาษี 500 บาท และระบบจะตรวจสัญชาติไทยกับเพดาน 10,000 บาท",
      },
    ],
  },
];

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "th-TH"
  ).format(value || 0);
}

function parseNumber(
  value: string
) {
  return (
    Number(
      value.replace(/,/g, "")
    ) || 0
  );
}

function getParentLabel(
  parent: ParentData
) {
  const relation =
    parent.relation === "father"
      ? "บิดา"
      : "มารดา";

  return parent.owner === "spouse"
    ? `${relation}คู่สมรส`
    : relation;
}

function getParentHealthPolicyShare(
  policy:
    ParentHealthInsurancePolicyData
) {
  const premium =
    Math.max(
      0,
      policy.premiumPaidThisYear
    );

  const payerCount =
    policy.jointPayerCount;

  if (
    premium <= 0 ||
    payerCount === null ||
    !Number.isInteger(
      payerCount
    ) ||
    payerCount < 1
  ) {
    return 0;
  }

  return premium / payerCount;
}

export default function DeductionsPage() {
  const {
    state,
    setDeductions,
    setFamily,
  } = useTaxPlanner();

  const deductions =
    state.deductions;

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

  const insuranceUsage =
    taxResult.insuranceDeductions;

  const retirementUsage =
    taxResult.retirementDeductions;

  const generalUsage =
    taxResult.generalDeductions;

  const pregnancyUsage =
    taxResult.pregnancyDeductions;

  const donationUsage =
    taxResult.donationDeductions;

  const hasPlanning =
  Object.values(
    state.planning
  ).some(
    (value) =>
      (value ?? 0) > 0
  );

const plannedDeductions =
  applyPlanningToDeductions(
    state.deductions,
    state.planning
  );

const plannedTaxResult =
  calculateTax({
    taxYear:
      state.taxYear,

    income:
      state.income,

    family:
      state.family,

    deductions:
      plannedDeductions,
  });

const plannedDonationUsage =
  plannedTaxResult
    .donationDeductions;

const canShowPlanningPreview =
  hasPlanning &&
  taxResult.isComplete &&
  plannedTaxResult.isComplete;

const donationPlanningChanged =
  canShowPlanningPreview &&
  (
    donationUsage
      .baseBeforeDonations !==
      plannedDonationUsage
        .baseBeforeDonations ||

    donationUsage
      .specialDonationLimit !==
      plannedDonationUsage
        .specialDonationLimit ||

    donationUsage
      .generalDonationLimit !==
      plannedDonationUsage
        .generalDonationLimit ||

    donationUsage
      .totalAllowed !==
      plannedDonationUsage
        .totalAllowed
  );

  const [openSections, setOpenSections] =
    useState<string[]>([
      "insurance",
    ]);

  function createParentHealthPolicy(
    premiumPaidThisYear = 0
  ): ParentHealthInsurancePolicyData {
    return {
      id: crypto.randomUUID(),

      parentId: null,

      premiumPaidThisYear:
        Math.max(
          0,
          premiumPaidThisYear
        ),

      jointPayerCount: null,
    };
  }

  function startParentHealthDetailedMode() {
    setDeductions({
      parentHealthInsurancePolicies:
        [
          createParentHealthPolicy(
            deductions
              .parentHealthInsurance
          ),
        ],
    });
  }

  function addParentHealthPolicy() {
    const current =
      deductions
        .parentHealthInsurancePolicies;

    setDeductions({
      parentHealthInsurancePolicies:
        [
          ...(current ?? []),

          createParentHealthPolicy(),
        ],
    });
  }

  function updateParentHealthPolicy(
    id: string,
    values:
      Partial<ParentHealthInsurancePolicyData>
  ) {
    const current =
      deductions
        .parentHealthInsurancePolicies;

    if (current === undefined) {
      return;
    }

    setDeductions({
      parentHealthInsurancePolicies:
        current.map(
          (policy) =>
            policy.id === id
              ? {
                  ...policy,
                  ...values,
                }
              : policy
        ),
    });
  }

  function removeParentHealthPolicy(
    id: string
  ) {
    const current =
      deductions
        .parentHealthInsurancePolicies;

    if (current === undefined) {
      return;
    }

    setDeductions({
      parentHealthInsurancePolicies:
        current.filter(
          (policy) =>
            policy.id !== id
        ),
    });
  }  

  function addPregnancy() {
    const pregnancy: PregnancyExpenseData = {
      id: crypto.randomUUID(),

      paidThisYear: 0,

      claimedPreviousYears: 0,
    };

    setFamily({
      pregnancies: [
        ...state.family.pregnancies,
        pregnancy,
      ],
    });
  }

  function updatePregnancy(
    id: string,
    values: Partial<PregnancyExpenseData>
  ) {
    setFamily({
      pregnancies:
        state.family.pregnancies.map(
          (pregnancy) =>
            pregnancy.id === id
              ? {
                  ...pregnancy,
                  ...values,
                }
              : pregnancy
        ),
    });
  }

  function removePregnancy(
    id: string
  ) {
    setFamily({
      pregnancies:
        state.family.pregnancies.filter(
          (pregnancy) =>
            pregnancy.id !== id
        ),
    });
  }

  function toggleSection(
    sectionId: string
  ) {
    setOpenSections(
      (current) =>
        current.includes(
          sectionId
        )
          ? current.filter(
              (id) =>
                id !==
                sectionId
            )
          : [
              ...current,
              sectionId,
            ]
    );
  }

  const parentHealthEnteredTotal =
    deductions.parentHealthInsurancePolicies ===
    undefined
      ? Math.max(
          0,
          deductions.parentHealthInsurance
        )
      : deductions.parentHealthInsurancePolicies.reduce(
          (total, policy) =>
            total +
            Math.max(
              0,
              policy.premiumPaidThisYear
            ),
          0
        );

  function getSectionTotal(
    section:
      DeductionSectionData
  ) {
    let total =
      section.fields.reduce(
        (sum, field) =>
          sum +
          (
            deductions[field.key] ??
            0
          ),
        0
      );

    if (
      section.id === "insurance"
    ) {
      total += parentHealthEnteredTotal;
    }

    if (
      section.id === "general"
    ) {
      total +=
        pregnancyUsage.totalPaid;
    }

    return total;
  }

  const enteredDeductionTotal =
    Object.entries(
      deductions
    ).reduce(
      (
        total,
        [key, value]
      ) => {
        /*
        * legacy / detailed fields
        * ที่คำนวณแยกด้านล่าง
        */
        if (
          key ===
            "pregnancyAndChildbirth" ||
          key ===
            "parentHealthInsurance" ||
          key ===
            "parentHealthInsurancePolicies"
        ) {
          return total;
        }

        /*
        * ป้องกัน field non-number
        * ในอนาคต
        */
        if (
          typeof value !== "number"
        ) {
          return total;
        }

        return total + value;
      },
      0
    );

  const enteredTotal =
    enteredDeductionTotal +
    pregnancyUsage.totalPaid +
    parentHealthEnteredTotal;

  const usedSections =
    sections.filter(
      (section) =>
        getSectionTotal(
          section
        ) > 0
    ).length;

  const thaiEsgxTransfer =
    generalUsage.thaiEsgxTransfer;

  const [
    isThaiEsgxInfoOpen,
    setIsThaiEsgxInfoOpen,
  ] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">

            <Link
              href="/"
              className="text-xl font-bold text-slate-900"
            >
              Tax Planner
            </Link>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              ปีภาษี{" "}
              {state.taxYear}
            </div>
          </div>

          <div className="mt-7">
            <PlanningStepper
              currentStep={3}
            />
          </div>
        </header>

        <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:items-start">

          {/* Main */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                ค่าลดหย่อนที่คุณมีอยู่แล้ว
              </h1>

              <p className="mt-2 max-w-2xl leading-7 text-slate-500">
                กรอกเฉพาะรายการที่คุณมีอยู่ในปีนี้
                ระบบจะตรวจเพดานและจำนวนที่ใช้สิทธิได้จริงให้อัตโนมัติ
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              ตอนนี้ให้กรอกจำนวนที่จ่ายจริงก่อน
              บางรายการอาจใช้ลดหย่อนภาษีได้ไม่เต็มจำนวน
              เนื่องจากมีเพดานเฉพาะและเพดานร่วม
            </div>

            {/* Sections */}
            <div className="mt-8 space-y-4">

              {sections.map(
                (section) => {
                  const isOpen =
                    openSections.includes(
                      section.id
                    );

                  const sectionTotal =
                    getSectionTotal(
                      section
                    );

                  return (
                    <div
                      key={
                        section.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          toggleSection(
                            section.id
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 bg-white p-4 text-left transition hover:bg-slate-50 sm:p-5"
                      >
                        <div className="min-w-0">
                          <div className="text-lg font-semibold text-slate-900">
                            {
                              section.title
                            }
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {
                              section.description
                            }
                          </div>

                          {section.id === "donation" &&
                            donationPlanningChanged && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 font-bold">
                                  !
                                </span>

                                สิทธิเปลี่ยนตามแผน
                              </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-4">

                          {sectionTotal >
                            0 && (
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-900">
                                {formatNumber(
                                  sectionTotal
                                )}
                              </div>

                              <div className="text-xs text-slate-400">
                                บาท
                              </div>
                            </div>
                          )}

                          <span className="text-xl text-slate-400">
                            {isOpen
                              ? "−"
                              : "+"}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">

                          <div className="space-y-4">

                            {section.id === "donation" && (
                              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                <div className="text-sm font-semibold text-slate-900">
                                  ฐานสำหรับวางแผนเงินบริจาค
                                </div>

                                <div className="mt-4 space-y-3 text-sm">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-500">
                                      เงินได้คงเหลือก่อนใช้สิทธิบริจาค
                                    </span>

                                    <span className="font-semibold text-slate-900">
                                      {formatNumber(
                                        donationUsage.baseBeforeDonations
                                      )}{" "}
                                      บาท
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-500">
                                      ฐานสำหรับเงินบริจาคพิเศษ
                                    </span>

                                    <span className="font-medium text-slate-900">
                                      {formatNumber(
                                        donationUsage.baseForSpecialDonation
                                      )}{" "}
                                      บาท
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-500">
                                      เพดานเงินบริจาคพิเศษ
                                    </span>

                                    <span className="font-semibold text-blue-700">
                                      {formatNumber(
                                        donationUsage.specialDonationLimit
                                      )}{" "}
                                      บาท
                                    </span>
                                  </div>

                                  <div className="border-t border-blue-100 pt-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-500">
                                        ฐานสำหรับบริจาคทั่วไป / กองทัพอากาศ
                                      </span>

                                      <span className="font-medium text-slate-900">
                                        {formatNumber(
                                          donationUsage.baseForGeneralDonation
                                        )}{" "}
                                        บาท
                                      </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-4">
                                      <span className="text-slate-500">
                                        เพดานบริจาคทั่วไป / กองทัพอากาศ
                                      </span>

                                      <span className="font-semibold text-blue-700">
                                        {formatNumber(
                                          donationUsage.generalDonationLimit
                                        )}{" "}
                                        บาท
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {section.id === "donation" &&
                              donationPlanningChanged && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                                  <div className="flex items-start gap-3">

                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                      !
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <div className="text-sm font-semibold text-amber-900">
                                        แผนลดหย่อนมีผลต่อสิทธิเงินบริจาค
                                      </div>

                                      <div className="mt-1 text-xs leading-5 text-amber-700">
                                        ตัวเลขเดิมยังเป็นสิทธิจากข้อมูลที่มีอยู่แล้ว
                                        ส่วนด้านล่างคือผลหากทำตามแผนในหน้าวางแผน
                                      </div>

                                      <div className="mt-4 space-y-3 text-sm">

                                        <div className="flex items-center justify-between gap-4">
                                          <span className="text-amber-800">
                                            เงินได้คงเหลือก่อนบริจาค
                                          </span>

                                          <span className="font-medium text-amber-900">
                                            {formatNumber(
                                              donationUsage
                                                .baseBeforeDonations
                                            )}
                                            {" → "}
                                            {formatNumber(
                                              plannedDonationUsage
                                                .baseBeforeDonations
                                            )}{" "}
                                            บาท
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                          <span className="text-amber-800">
                                            เพดานบริจาคพิเศษ
                                          </span>

                                          <span className="font-medium text-amber-900">
                                            {formatNumber(
                                              donationUsage
                                                .specialDonationLimit
                                            )}
                                            {" → "}
                                            {formatNumber(
                                              plannedDonationUsage
                                                .specialDonationLimit
                                            )}{" "}
                                            บาท
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                          <span className="text-amber-800">
                                            เพดานบริจาคทั่วไป / กองทัพอากาศ
                                          </span>

                                          <span className="font-medium text-amber-900">
                                            {formatNumber(
                                              donationUsage
                                                .generalDonationLimit
                                            )}
                                            {" → "}
                                            {formatNumber(
                                              plannedDonationUsage
                                                .generalDonationLimit
                                            )}{" "}
                                            บาท
                                          </span>
                                        </div>

                                        {donationUsage.totalAllowed !==
                                          plannedDonationUsage.totalAllowed && (
                                          <div className="flex items-center justify-between gap-4 border-t border-amber-200 pt-3">
                                            <span className="font-medium text-amber-900">
                                              สิทธิบริจาครวม
                                            </span>

                                            <span className="font-semibold text-amber-900">
                                              {formatNumber(
                                                donationUsage
                                                  .totalAllowed
                                              )}
                                              {" → "}
                                              {formatNumber(
                                                plannedDonationUsage
                                                  .totalAllowed
                                              )}{" "}
                                              บาท
                                            </span>
                                          </div>
                                        )}

                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {section.fields.map(
                              (field) => {
                                const isThaiEsgx =
                                  field.key ===
                                  "ltfToThaiEsgxTransferAmount";

                                const retirementFieldUsage =
                                  field.key === "providentFund"
                                    ? retirementUsage.providentFund
                                    : field.key === "gpf"
                                      ? retirementUsage.gpf
                                      : field.key === "privateTeacherFund"
                                        ? retirementUsage.privateTeacherFund
                                        : field.key === "nsf"
                                          ? retirementUsage.nsf
                                          : field.key === "rmf"
                                            ? retirementUsage.rmf
                                            : null;

                                const generalFieldUsage =
                                  field.key === "socialSecurity"
                                    ? generalUsage.socialSecurity
                                    : field.key === "homeLoanInterest"
                                      ? generalUsage.homeLoanInterest
                                      : field.key === "socialEnterpriseInvestment"
                                        ? generalUsage.socialEnterpriseInvestment
                                        : field.key === "solarRooftop"
                                          ? generalUsage.solarRooftop ?? null
                                          : field.key === "artPurchase"
                                            ? generalUsage.artPurchase ?? null
                                            : null;

                                const donationFieldUsage =
                                  field.key === "generalDonation"
                                    ? donationUsage.generalDonation
                                    : field.key === "politicalDonation"
                                      ? donationUsage.politicalDonation
                                      : field.key === "airForceStupaDonation"
                                        ? donationUsage.airForceStupaDonation ?? null
                                        : null;

                                const plannedDonationFieldUsage =
                                  field.key === "generalDonation"
                                    ? plannedDonationUsage
                                        .generalDonation
                                    : field.key === "politicalDonation"
                                      ? plannedDonationUsage
                                          .politicalDonation
                                      : field.key === "airForceStupaDonation"
                                        ? plannedDonationUsage
                                            .airForceStupaDonation ?? null
                                        : null;

                                const donationPlanningDelta =
                                  canShowPlanningPreview &&
                                  donationFieldUsage &&
                                  plannedDonationFieldUsage
                                    ? plannedDonationFieldUsage
                                        .allowed -
                                      donationFieldUsage.allowed
                                    : 0;

                                return (
                                  <div key={field.key}>
                                    <DeductionInput
                                      label={field.label}
                                      description={
                                        field.description
                                      }
                                      value={
                                        deductions[field.key]
                                      }
                                      onChange={(value) =>
                                        setDeductions({
                                          [field.key]:
                                            value,
                                        })
                                      }
                                    />

                                    {donationFieldUsage &&
                                      (deductions[field.key] ?? 0) > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                donationFieldUsage.allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                donationFieldUsage.excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          {donationPlanningDelta !== 0 && (
                                            <div className="sm:col-span-2 border-t border-amber-200 pt-3">

                                              <div className="flex items-center justify-between gap-4 text-amber-800">
                                                <span className="font-medium">
                                                  ! หลังทำตามแผน
                                                </span>

                                                <span className="font-semibold">
                                                  {formatNumber(
                                                    donationFieldUsage.allowed
                                                  )}
                                                  {" → "}
                                                  {formatNumber(
                                                    plannedDonationFieldUsage
                                                      ?.allowed ?? 0
                                                  )}{" "}
                                                  บาท
                                                </span>
                                              </div>

                                              <div className="mt-1 text-right text-xs text-amber-700">
                                                {donationPlanningDelta < 0
                                                  ? "สิทธิลดลง"
                                                  : "สิทธิเพิ่มขึ้น"}{" "}
                                                {formatNumber(
                                                  Math.abs(
                                                    donationPlanningDelta
                                                  )
                                                )}{" "}
                                                บาท
                                              </div>

                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {field.key === "specialDonation" &&
                                        deductions.specialDonation > 0 && (
                                          <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                              <div>
                                                <div className="text-slate-500">
                                                  ใช้สิทธิได้
                                                </div>

                                                <div className="mt-1 font-semibold text-blue-700">
                                                  {formatNumber(
                                                    donationUsage.specialDonation.allowed
                                                  )}{" "}
                                                  บาท
                                                </div>
                                              </div>

                                              <div>
                                                <div className="text-slate-500">
                                                  ส่วนที่ใช้สิทธิไม่ได้
                                                </div>

                                                <div className="mt-1 font-semibold text-slate-900">
                                                  {formatNumber(
                                                    donationUsage.specialDonation
                                                      .disallowedDeduction
                                                  )}{" "}
                                                  บาท
                                                </div>
                                              </div>
                                            </div>

                                            {canShowPlanningPreview &&
                                              plannedDonationUsage
                                                .specialDonation.allowed !==
                                                donationUsage
                                                  .specialDonation.allowed && (
                                                <div className="mt-4 border-t border-amber-200 pt-3">

                                                  <div className="flex items-center justify-between gap-4 text-sm text-amber-800">
                                                    <span className="font-medium">
                                                      ! หลังทำตามแผน
                                                    </span>

                                                    <span className="font-semibold">
                                                      {formatNumber(
                                                        donationUsage
                                                          .specialDonation.allowed
                                                      )}
                                                      {" → "}
                                                      {formatNumber(
                                                        plannedDonationUsage
                                                          .specialDonation.allowed
                                                      )}{" "}
                                                      บาท
                                                    </span>
                                                  </div>

                                                  <div className="mt-1 text-right text-xs text-amber-700">
                                                    {plannedDonationUsage
                                                      .specialDonation.allowed <
                                                    donationUsage
                                                      .specialDonation.allowed
                                                      ? "สิทธิลดลง"
                                                      : "สิทธิเพิ่มขึ้น"}{" "}
                                                    {formatNumber(
                                                      Math.abs(
                                                        plannedDonationUsage
                                                          .specialDonation.allowed -
                                                        donationUsage
                                                          .specialDonation.allowed
                                                      )
                                                    )}{" "}
                                                    บาท
                                                  </div>

                                                </div>
                                              )}

                                            <div className="mt-4 border-t border-slate-200 pt-3">
                                              <div className="flex items-center justify-between gap-4">
                                                <span className="text-slate-500">
                                                  จำนวนลดหย่อนหลังคูณสิทธิ
                                                </span>

                                                <span className="font-medium text-slate-900">
                                                  {formatNumber(
                                                    donationUsage.specialDonation
                                                      .deductionBeforeCap
                                                  )}{" "}
                                                  บาท
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                    {generalFieldUsage &&
                                      (deductions[field.key] ?? 0) > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                generalFieldUsage.allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                generalFieldUsage.excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {retirementFieldUsage &&
                                      (deductions[field.key] ?? 0) > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                retirementFieldUsage.allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                retirementFieldUsage.excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {field.key === "lifeInsurance" &&
                                      deductions.lifeInsurance > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                insuranceUsage
                                                  .lifeInsurance
                                                  .allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                insuranceUsage
                                                  .lifeInsurance
                                                  .excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {field.key === "healthInsuranceSelf" &&
                                      deductions.healthInsuranceSelf > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                insuranceUsage
                                                  .healthInsuranceSelf
                                                  .allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                insuranceUsage
                                                  .healthInsuranceSelf
                                                  .excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {field.key === "spouseLifeInsurance" &&
                                      deductions.spouseLifeInsurance > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                insuranceUsage
                                                  .spouseLifeInsurance
                                                  .allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                insuranceUsage
                                                  .spouseLifeInsurance
                                                  .excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {field.key === "pensionInsurance" &&
                                      deductions.pensionInsurance > 0 && (
                                        <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">

                                          <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                              <div className="text-slate-500">
                                                ใช้สิทธิได้รวม
                                              </div>

                                              <div className="mt-1 font-semibold text-blue-700">
                                                {formatNumber(
                                                  retirementUsage
                                                    .pensionInsurance
                                                    .allowed
                                                )}{" "}
                                                บาท
                                              </div>
                                            </div>

                                            <div>
                                              <div className="text-slate-500">
                                                เกินสิทธิ
                                              </div>

                                              <div className="mt-1 font-semibold text-slate-900">
                                                {formatNumber(
                                                  retirementUsage
                                                    .pensionInsurance
                                                    .excess
                                                )}{" "}
                                                บาท
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mt-4 border-t border-slate-200 pt-3">
                                            <div className="text-xs text-slate-500">
                                              รายละเอียดสิทธิที่ใช้ได้
                                            </div>

                                            <div className="mt-2 flex items-center justify-between gap-4">
                                              <span className="text-slate-500">
                                                ส่วนของเบี้ยบำนาญที่ใช้ในวงเงิน 100,000 บาท
                                              </span>

                                              <span className="font-medium text-slate-900">
                                                {formatNumber(
                                                  retirementUsage
                                                    .pensionUsedAsLifeInsurance
                                                )}{" "}
                                                บาท
                                              </span>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between gap-4">
                                              <span className="text-slate-500">
                                                ใช้สิทธิเบี้ยประกันบำนาญ
                                              </span>

                                              <span className="font-medium text-slate-900">
                                                {formatNumber(
                                                  retirementUsage
                                                    .pensionExtraAllowed
                                                )}{" "}
                                                บาท
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {field.key === "thaiEsg" &&
                                      deductions.thaiEsg > 0 && (
                                        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                          <div>
                                            <div className="text-slate-500">
                                              ใช้สิทธิได้
                                            </div>

                                            <div className="mt-1 font-semibold text-blue-700">
                                              {formatNumber(
                                                generalUsage.thaiEsg.allowed
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-slate-500">
                                              เกินสิทธิ
                                            </div>

                                            <div className="mt-1 font-semibold text-slate-900">
                                              {formatNumber(
                                                generalUsage.thaiEsg.excess
                                              )}{" "}
                                              บาท
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {isThaiEsgx &&
                                      deductions
                                        .ltfToThaiEsgxTransferAmount >
                                        0 && (
                                        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                          <div className="flex items-start justify-between gap-4">
                                            <div>
                                              <div className="text-xs text-slate-500">
                                                สิทธิที่ใช้ลดหย่อนได้ในปี{" "}
                                                {state.taxYear}
                                              </div>

                                              <div className="mt-1 text-lg font-semibold text-blue-700">
                                                {formatNumber(
                                                  thaiEsgxTransfer
                                                    .allowedThisYear
                                                )}{" "}
                                                บาท
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                setIsThaiEsgxInfoOpen(true)
                                              }
                                              aria-label="ดูรายละเอียดสิทธิ Thai ESGX"
                                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300 bg-white text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                                            >
                                              ?
                                            </button>
                                          </div>

                                          {thaiEsgxTransfer
                                            .transferAmountOverLimit >
                                            0 && (
                                            <div className="mt-3 border-t border-blue-100 pt-3 text-xs leading-5 text-amber-700">
                                              ยอดสับเปลี่ยนที่เกินเกณฑ์มาตรการ{" "}
                                              {formatNumber(
                                                thaiEsgxTransfer
                                                  .transferAmountOverLimit
                                              )}{" "}
                                              บาท
                                            </div>
                                          )}
                                        </div>
                                      )}  
                                  </div>
                                );
                              }
                            )}

                            {section.id === "insurance" && (
                              <div className="rounded-xl bg-white p-4">

                                <div className="flex items-start justify-between gap-4">

                                  <div>
                                    <div className="font-medium text-slate-800">
                                      เบี้ยประกันสุขภาพบิดา / มารดา
                                    </div>

                                    <div className="mt-1 text-sm leading-5 text-slate-400">
                                      เพิ่มแยกตามกรมธรรม์และบิดา / มารดา
                                      เพื่อให้ระบบตรวจสิทธิและกรณีร่วมจ่ายได้ถูกต้อง
                                    </div>
                                  </div>

                                  {deductions
                                    .parentHealthInsurancePolicies !==
                                    undefined && (
                                    <button
                                      type="button"
                                      onClick={
                                        addParentHealthPolicy
                                      }
                                      className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                    >
                                      + เพิ่ม
                                    </button>
                                  )}
                                </div>

                                {deductions
                                  .parentHealthInsurancePolicies ===
                                undefined ? (
                                  deductions
                                    .parentHealthInsurance >
                                  0 ? (
                                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                                      <div className="text-sm font-medium text-amber-900">
                                        พบข้อมูลจากระบบเดิม
                                      </div>

                                      <div className="mt-1 text-sm leading-6 text-amber-800">
                                        ยอดเบี้ยประกันสุขภาพบิดา /
                                        มารดาเดิม{" "}
                                        <span className="font-semibold">
                                          {formatNumber(
                                            deductions
                                              .parentHealthInsurance
                                          )}{" "}
                                          บาท
                                        </span>
                                      </div>

                                      <div className="mt-2 text-xs leading-5 text-amber-700">
                                        ข้อมูลเดิมยังไม่ทราบว่าเป็นกรมธรรม์ของบิดาหรือมารดาคนใด
                                        และไม่ทราบจำนวนผู้ร่วมจ่าย
                                        คุณสามารถเปลี่ยนเป็นรายการแบบละเอียดได้
                                        โดยยอดเดิมจะถูกนำมาใส่ในรายการแรกให้
                                      </div>

                                      <button
                                        type="button"
                                        onClick={
                                          startParentHealthDetailedMode
                                        }
                                        className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                                      >
                                        เปลี่ยนเป็นรายการแบบละเอียด
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">

                                      <div className="text-sm text-slate-400">
                                        ยังไม่มีเบี้ยประกันสุขภาพบิดา
                                        / มารดา
                                      </div>

                                      <button
                                        type="button"
                                        onClick={
                                          addParentHealthPolicy
                                        }
                                        className="mt-3 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                      >
                                        + เพิ่มกรมธรรม์
                                      </button>
                                    </div>
                                  )
                                ) : deductions
                                    .parentHealthInsurancePolicies
                                    .length === 0 ? (
                                  <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-400">
                                    ยังไม่มีรายการกรมธรรม์
                                  </div>
                                ) : (
                                  <div className="mt-5 space-y-4">

                                    {deductions
                                      .parentHealthInsurancePolicies
                                      .map(
                                        (
                                          policy,
                                          index
                                        ) => {
                                          const selectedParent =
                                            state.family.parents.find(
                                              (parent) =>
                                                parent.id ===
                                                policy.parentId
                                            );

                                          const payerCountValid =
                                            policy.jointPayerCount !==
                                              null &&
                                            Number.isInteger(
                                              policy.jointPayerCount
                                            ) &&
                                            policy.jointPayerCount >=
                                              1;

                                          const taxpayerShare =
                                            getParentHealthPolicyShare(
                                              policy
                                            );

                                          return (
                                            <div
                                              key={policy.id}
                                              className="rounded-2xl border border-slate-200 p-4"
                                            >

                                              <div className="flex items-center justify-between gap-4">

                                                <div className="font-semibold text-slate-900">
                                                  กรมธรรม์ที่{" "}
                                                  {index + 1}
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    removeParentHealthPolicy(
                                                      policy.id
                                                    )
                                                  }
                                                  className="text-sm text-slate-400 hover:text-red-600"
                                                >
                                                  ลบ
                                                </button>
                                              </div>

                                              <div className="mt-4 grid gap-4 md:grid-cols-3">

                                                <div>
                                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    บิดา / มารดา
                                                  </label>

                                                  <select
                                                    value={
                                                      policy.parentId ??
                                                      ""
                                                    }
                                                    onChange={(e) =>
                                                      updateParentHealthPolicy(
                                                        policy.id,
                                                        {
                                                          parentId:
                                                            e.target
                                                              .value ||
                                                            null,
                                                        }
                                                      )
                                                    }
                                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                  >
                                                    <option value="">
                                                      เลือกบิดา / มารดา
                                                    </option>

                                                    {policy.parentId &&
                                                      !selectedParent && (
                                                        <option
                                                          value={
                                                            policy.parentId
                                                          }
                                                        >
                                                          "ไม่พบข้อมูลบิดา / มารดาที่เคยเลือก"
                                                        </option>
                                                      )}

                                                    {state.family.parents.map(
                                                      (parent) => (
                                                        <option
                                                          key={
                                                            parent.id
                                                          }
                                                          value={
                                                            parent.id
                                                          }
                                                        >
                                                          {getParentLabel(
                                                            parent
                                                          )}
                                                        </option>
                                                      )
                                                    )}
                                                  </select>

                                                  <div className="mt-2 text-xs leading-5 text-slate-500">
                                                    รายชื่อมาจากหน้าครอบครัว{" "}
                                                    <Link
                                                      href="/planning/family"
                                                      className="font-medium text-blue-600 underline"
                                                    >
                                                      เพิ่ม / แก้ไขบิดา / มารดา
                                                    </Link>
                                                  </div>

                                                  {policy.parentId &&
                                                    !selectedParent && (
                                                    <div className="mt-2 text-xs leading-5 text-red-600">
                                                      ไม่พบข้อมูลบิดา / มารดาที่เลือกไว้
                                                      อาจถูกลบออกจากหน้าครอบครัวแล้ว
                                                    </div>
                                                  )}
                                                </div>

                                                <div>
                                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    เบี้ยที่จ่ายจริง
                                                  </label>

                                                  <div className="relative">
                                                    <input
                                                      inputMode="numeric"
                                                      value={
                                                        policy
                                                          .premiumPaidThisYear
                                                          ? formatNumber(
                                                              policy
                                                                .premiumPaidThisYear
                                                            )
                                                          : ""
                                                      }
                                                      onChange={(e) =>
                                                        updateParentHealthPolicy(
                                                          policy.id,
                                                          {
                                                            premiumPaidThisYear:
                                                              parseNumber(
                                                                e.target
                                                                  .value
                                                              ),
                                                          }
                                                        )
                                                      }
                                                      placeholder="0"
                                                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-right text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    />

                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                      บาท
                                                    </span>
                                                  </div>
                                                </div>

                                                <div>
                                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    จำนวนผู้ร่วมจ่าย
                                                  </label>

                                                  <div className="relative">
                                                    <input
                                                      type="number"
                                                      min="1"
                                                      step="1"
                                                      inputMode="numeric"
                                                      value={
                                                        policy
                                                          .jointPayerCount ??
                                                        ""
                                                      }
                                                      onChange={(e) => {
                                                        const raw =
                                                          e.target
                                                            .value;

                                                        updateParentHealthPolicy(
                                                          policy.id,
                                                          {
                                                            jointPayerCount:
                                                              raw === ""
                                                                ? null
                                                                : Number(
                                                                    raw
                                                                  ),
                                                          }
                                                        );
                                                      }}
                                                      placeholder="1"
                                                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-14 text-right text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    />

                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                      คน
                                                    </span>
                                                  </div>

                                                  {policy
                                                    .premiumPaidThisYear >
                                                    0 &&
                                                    !payerCountValid && (
                                                      <div className="mt-2 text-xs leading-5 text-red-600">
                                                        กรุณาระบุจำนวนผู้ร่วมจ่ายเป็นจำนวนเต็มตั้งแต่
                                                        1 คนขึ้นไป
                                                      </div>
                                                    )}
                                                </div>
                                              </div>

                                              {policy
                                                .premiumPaidThisYear >
                                                0 &&
                                                !policy.parentId && (
                                                  <div className="mt-3 text-xs leading-5 text-red-600">
                                                    กรุณาเลือกว่ากรมธรรม์นี้เป็นของบิดาหรือมารดาคนใด
                                                  </div>
                                                )}

                                              {policy
                                                .premiumPaidThisYear >
                                                0 &&
                                                payerCountValid && (
                                                  <div className="mt-4 rounded-xl bg-slate-50 p-4">

                                                    <div className="text-xs text-slate-500">
                                                      ส่วนเบี้ยของคุณหลังเฉลี่ยผู้ร่วมจ่าย
                                                    </div>

                                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                                      {formatNumber(
                                                        taxpayerShare
                                                      )}{" "}
                                                      บาท
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        }
                                      )}
                                  </div>
                                )}

                                {deductions
                                  .parentHealthInsurancePolicies !==
                                  undefined && (
                                  <div className="mt-5 grid gap-3 rounded-2xl bg-blue-50 p-4 text-sm sm:grid-cols-3">

                                    <div>
                                      <div className="text-blue-500">
                                        ส่วนของคุณ
                                      </div>

                                      <div className="mt-1 font-semibold text-slate-900">
                                        {formatNumber(
                                          insuranceUsage
                                            .parentHealthInsurance
                                            .paid
                                        )}{" "}
                                        บาท
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-blue-500">
                                        ใช้สิทธิได้
                                      </div>

                                      <div className="mt-1 font-semibold text-blue-700">
                                        {formatNumber(
                                          insuranceUsage
                                            .parentHealthInsurance
                                            .allowed
                                        )}{" "}
                                        บาท
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-blue-500">
                                        เพดานรวม
                                      </div>

                                      <div className="mt-1 font-semibold text-slate-900">
                                        15,000 บาท
                                      </div>
                                    </div>

                                    {insuranceUsage
                                      .parentHealthInsurance
                                      .excess >
                                      0 && (
                                      <div className="sm:col-span-3 border-t border-blue-100 pt-3 text-xs leading-5 text-amber-700">
                                        ส่วนที่ยังใช้สิทธิไม่ได้หรือเกินเพดาน{" "}
                                        {formatNumber(
                                          insuranceUsage
                                            .parentHealthInsurance
                                            .excess
                                        )}{" "}
                                        บาท
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {section.id === "general" && (
                              <div className="rounded-xl bg-white p-4">

                                <div className="flex items-start justify-between gap-4">

                                  <div>
                                    <div className="font-medium text-slate-800">
                                      ค่าฝากครรภ์และค่าคลอดบุตร
                                    </div>

                                    <div className="mt-1 text-sm leading-5 text-slate-400">
                                      เพิ่มแยกตามการตั้งครรภ์แต่ละคราว
                                      เพื่อให้ระบบตรวจเพดานได้ถูกต้อง
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={addPregnancy}
                                    className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                  >
                                    + เพิ่ม
                                  </button>
                                </div>

                                {state.family.pregnancies.length === 0 ? (
                                  <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-400">
                                    ไม่มีค่าฝากครรภ์หรือค่าคลอดบุตร
                                  </div>
                                ) : (
                                  <div className="mt-5 space-y-4">

                                    {state.family.pregnancies.map(
                                      (pregnancy, index) => {
                                        const usage =
                                          pregnancyUsage.items.find(
                                            (item) =>
                                              item.id ===
                                              pregnancy.id
                                          );

                                        return (
                                          <div
                                            key={pregnancy.id}
                                            className="rounded-2xl border border-slate-200 p-4"
                                          >

                                            <div className="flex items-center justify-between">

                                              <div className="font-semibold text-slate-900">
                                                การตั้งครรภ์คราวที่{" "}
                                                {index + 1}
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removePregnancy(
                                                    pregnancy.id
                                                  )
                                                }
                                                className="text-sm text-slate-400 hover:text-red-600"
                                              >
                                                ลบ
                                              </button>
                                            </div>

                                            <div className="mt-4 grid gap-4 md:grid-cols-2">

                                              <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                                  ค่าใช้จ่ายที่จ่ายในปีนี้
                                                </label>

                                                <div className="relative">
                                                  <input
                                                    inputMode="numeric"
                                                    value={
                                                      pregnancy.paidThisYear
                                                        ? formatNumber(
                                                            pregnancy.paidThisYear
                                                          )
                                                        : ""
                                                    }
                                                    onChange={(e) =>
                                                      updatePregnancy(
                                                        pregnancy.id,
                                                        {
                                                          paidThisYear:
                                                            parseNumber(
                                                              e.target.value
                                                            ),
                                                        }
                                                      )
                                                    }
                                                    placeholder="0"
                                                    className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16 text-right"
                                                  />

                                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                    บาท
                                                  </span>
                                                </div>
                                              </div>

                                              <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                                  เคยใช้สิทธิคราวนี้ในปีก่อน
                                                </label>

                                                <div className="relative">
                                                  <input
                                                    inputMode="numeric"
                                                    value={
                                                      pregnancy.claimedPreviousYears
                                                        ? formatNumber(
                                                            pregnancy.claimedPreviousYears
                                                          )
                                                        : ""
                                                    }
                                                    onChange={(e) =>
                                                      updatePregnancy(
                                                        pregnancy.id,
                                                        {
                                                          claimedPreviousYears:
                                                            parseNumber(
                                                              e.target.value
                                                            ),
                                                        }
                                                      )
                                                    }
                                                    placeholder="0"
                                                    className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16 text-right"
                                                  />

                                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                    บาท
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {usage && (
                                              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">

                                                <div>
                                                  <div className="text-slate-400">
                                                    จ่ายปีนี้
                                                  </div>

                                                  <div className="mt-1 font-semibold text-slate-900">
                                                    {formatNumber(
                                                      usage.paidThisYear
                                                    )}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-slate-400">
                                                    ใช้สิทธิได้ปีนี้
                                                  </div>

                                                  <div className="mt-1 font-semibold text-blue-700">
                                                    {formatNumber(
                                                      usage.allowedThisYear
                                                    )}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-slate-400">
                                                    ส่วนเกิน
                                                  </div>

                                                  <div className="mt-1 font-semibold text-slate-900">
                                                    {formatNumber(
                                                      usage.excessThisYear
                                                    )}
                                                  </div>
                                                </div>

                                              </div>
                                            )}

                                          </div>
                                        );
                                      }
                                    )}

                                  </div>
                                )}

                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">

              <Link
                href="/planning/family"
                className="rounded-xl px-5 py-3 font-medium text-slate-500 transition hover:bg-slate-100"
              >
                ← ย้อนกลับ
              </Link>

              <Link
                href="/planning/planner"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                วางแผนลดภาษี →
              </Link>
            </div>
          </section>

          {/* Summary */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 min-[960px]:sticky min-[960px]:top-8">

            <div className="text-sm font-medium text-slate-500">
              สรุปค่าลดหย่อน
            </div>

            <div className="mt-5">

              <div className="text-sm text-slate-500">
                จำนวนที่กรอกทั้งหมด
              </div>

              <div className="mt-1 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                {formatNumber(
                  enteredTotal
                )}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                บาท
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-500">
                  หมวดที่มีข้อมูล
                </span>

                <span className="font-medium text-slate-900">
                  {usedSections}{" "}
                  หมวด
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              ตัวเลขนี้เป็นยอดที่จ่ายหรือกรอกเข้ามา
              ยังไม่ใช่ยอดที่ใช้ลดหย่อนภาษีได้จริง
            </div>

            {(
              !taxResult.isComplete ||
              taxResult.warnings.length > 0
            ) && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {!taxResult.isComplete && (
                  <div className="font-medium">
                    การคำนวณภาษียังไม่สมบูรณ์
                  </div>
                )}

                {!taxResult.isComplete && (
                  <div className="mt-1">
                    จำนวนที่ใช้สิทธิได้บางรายการอาจยังเปลี่ยนแปลงได้
                    กรุณาตรวจสอบข้อมูลที่ยังไม่ครบถ้วน
                  </div>
                )}

                {taxResult.warnings.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {taxResult.warnings.map(
                      (warning, index) => (
                        <div
                          key={`${warning}-${index}`}
                        >
                          • {warning}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {insuranceUsage.totalPaid > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-semibold text-slate-900">
                  ประกัน
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <SummaryRow
                    label="จ่ายจริง"
                    value={insuranceUsage.totalPaid}
                  />

                  <SummaryRow
                    label="ใช้สิทธิได้"
                    value={insuranceUsage.totalAllowed}
                    highlight
                  />

                  {insuranceUsage.totalExcess > 0 && (
                    <SummaryRow
                      label="เกินสิทธิ"
                      value={insuranceUsage.totalExcess}
                    />
                  )}

                </div>
              </div>
            )}


            {retirementUsage.totalPaid > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-semibold text-slate-900">
                  การออมเพื่อเกษียณ
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <SummaryRow
                    label="จ่าย / ลงทุนจริง"
                    value={retirementUsage.totalPaid}
                  />

                  <SummaryRow
                    label="ใช้สิทธิได้"
                    value={retirementUsage.totalAllowed}
                    highlight
                  />

                  {retirementUsage.totalExcess > 0 && (
                    <SummaryRow
                      label="เกินสิทธิ"
                      value={retirementUsage.totalExcess}
                    />
                  )}

                  <div className="border-t border-slate-100 pt-3">

                    <SummaryRow
                      label="ใช้เพดานร่วมแล้ว"
                      value={retirementUsage.sharedLimitUsed}
                    />

                    <SummaryRow
                      label="เพดานร่วมที่เหลือ"
                      value={retirementUsage.sharedLimitRemaining}
                      highlight
                    />

                  </div>
                </div>
              </div>
            )}

            {generalUsage.totalPaid > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-semibold text-slate-900">
                  ค่าลดหย่อนอื่น
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <SummaryRow
                    label="จ่าย / ลงทุนจริง"
                    value={generalUsage.totalPaid}
                  />

                  <SummaryRow
                    label="ใช้สิทธิได้"
                    value={generalUsage.totalAllowed}
                    highlight
                  />

                  {generalUsage.totalExcess > 0 && (
                    <SummaryRow
                      label="เกินสิทธิ"
                      value={generalUsage.totalExcess}
                    />
                  )}

                </div>
              </div>
            )}

            {pregnancyUsage.totalPaid > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-semibold text-slate-900">
                  ฝากครรภ์ / คลอดบุตร
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <SummaryRow
                    label="จ่ายจริง"
                    value={
                      pregnancyUsage.totalPaid
                    }
                  />

                  <SummaryRow
                    label="ใช้สิทธิได้"
                    value={
                      pregnancyUsage.totalAllowed
                    }
                    highlight
                  />

                  {pregnancyUsage.totalExcess > 0 && (
                    <SummaryRow
                      label="เกินสิทธิ"
                      value={
                        pregnancyUsage.totalExcess
                      }
                    />
                  )}

                </div>
              </div>
            )}

            {donationUsage.totalPaid > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                <div className="text-sm font-semibold text-slate-900">
                  เงินบริจาค
                </div>

                <div className="mt-4 space-y-3 text-sm">

                  <SummaryRow
                    label="บริจาคจริง"
                    value={donationUsage.totalPaid}
                  />

                  <SummaryRow
                    label="ใช้ลดหย่อนได้"
                    value={donationUsage.totalAllowed}
                    highlight
                  />

                  {donationUsage.specialDonation.paid > 0 && (
                    <div className="border-t border-slate-100 pt-3">

                      <SummaryRow
                        label="บริจาคพิเศษจริง"
                        value={donationUsage.specialDonation.paid}
                      />

                      <SummaryRow
                        label="หลังคูณสิทธิ"
                        value={
                          donationUsage.specialDonation
                            .deductionBeforeCap
                        }
                      />

                      <SummaryRow
                        label="ใช้สิทธิจริง"
                        value={
                          donationUsage.specialDonation.allowed
                        }
                        highlight
                      />

                    </div>
                  )}

                  {donationUsage.generalDonation.paid > 0 && (
                    <div className="border-t border-slate-100 pt-3">

                      <SummaryRow
                        label="บริจาคทั่วไป"
                        value={
                          donationUsage.generalDonation.paid
                        }
                      />

                      <SummaryRow
                        label="ใช้สิทธิได้"
                        value={
                          donationUsage.generalDonation.allowed
                        }
                        highlight
                      />

                    </div>
                  )}

                  {(
                    donationUsage.airForceStupaDonation
                      ?.paid ?? 0
                  ) > 0 && (
                    <div className="border-t border-slate-100 pt-3">

                      <SummaryRow
                        label="บริจาคกองทัพอากาศ พ.ร.ฎ. 804"
                        value={
                          donationUsage.airForceStupaDonation
                            ?.paid ?? 0
                        }
                      />

                      <SummaryRow
                        label="ใช้สิทธิได้"
                        value={
                          donationUsage.airForceStupaDonation
                            ?.allowed ?? 0
                        }
                        highlight
                      />

                      {(
                        donationUsage.airForceStupaDonation
                          ?.excess ?? 0
                      ) > 0 && (
                        <SummaryRow
                          label="เกินเพดานร่วม"
                          value={
                            donationUsage.airForceStupaDonation
                              ?.excess ?? 0
                          }
                        />
                      )}

                    </div>
                  )}

                  {donationUsage.politicalDonation.paid > 0 && (
                    <div className="border-t border-slate-100 pt-3">

                      <SummaryRow
                        label="บริจาคพรรคการเมือง"
                        value={
                          donationUsage.politicalDonation.paid
                        }
                      />

                      <SummaryRow
                        label="ใช้สิทธิได้"
                        value={
                          donationUsage.politicalDonation.allowed
                        }
                        highlight
                      />

                    </div>
                  )}

                </div>
              </div>
            )}

            {taxResult.isComplete &&
              taxResult.totalCurrentDeductions > 0 && (
                <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                  <div className="text-sm font-semibold text-blue-800">
                    ผลต่อภาษีก่อนเครดิต
                  </div>

                  <div className="mt-4 space-y-3 text-sm">

                    <SummaryRow
                      label="ใช้ลดหย่อนจริง"
                      value={taxResult.totalCurrentDeductions}
                      highlight
                    />

                    <SummaryRow
                      label="ภาษีก่อนค่าลดหย่อน"
                      value={taxResult.taxBeforeCurrentDeductions}
                    />

                    <SummaryRow
                      label="ภาษีหลังค่าลดหย่อน"
                      value={taxResult.taxBeforeCredits}
                      highlight
                    />

                    <div className="border-t border-blue-100 pt-3">

                      <div className="text-sm text-slate-500">
                        ภาษีก่อนเครดิตที่ลดลง
                      </div>

                      <div className="mt-1 text-2xl font-bold text-blue-700">
                        {formatNumber(
                          taxResult.taxSavingsFromCurrentDeductions
                        )}{" "}
                        บาท
                      </div>

                    </div>
                  </div>
                </div>
            )}

            {sections.map(
              (section) => {
                const total =
                  getSectionTotal(
                    section
                  );

                if (
                  total === 0
                ) {
                  return null;
                }

                return (
                  <div
                    key={
                      section.id
                    }
                    className="mt-4 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-500">
                      {
                        section.title
                      }
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatNumber(
                        total
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </aside>
        </div>
      </div>

      {isThaiEsgxInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() =>
            setIsThaiEsgxInfoOpen(false)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="thai-esgx-info-title"
            onClick={(e) =>
              e.stopPropagation()
            }
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  id="thai-esgx-info-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  สิทธิ Thai ESGX
                  จากการสับเปลี่ยน LTF
                </div>

                <div className="mt-2 text-sm leading-6 text-slate-500">
                  ระบบคำนวณสิทธิแต่ละปีจากมูลค่า
                  LTF ที่คุณสับเปลี่ยนเป็น Thai ESGX
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsThaiEsgxInfoOpen(false)
                }
                aria-label="ปิด"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              {thaiEsgxTransfer.schedule.map(
                (item) => {
                  const isCurrentYear =
                    item.taxYear ===
                    state.taxYear;

                  return (
                    <div
                      key={item.taxYear}
                      className={[
                        "flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0",
                        isCurrentYear
                          ? "bg-blue-50"
                          : "bg-white",
                      ].join(" ")}
                    >
                      <div>
                        <div
                          className={[
                            "text-sm",
                            isCurrentYear
                              ? "font-semibold text-blue-700"
                              : "text-slate-600",
                          ].join(" ")}
                        >
                          ปี {item.taxYear}
                        </div>

                        {isCurrentYear && (
                          <div className="mt-0.5 text-xs text-blue-500">
                            ปีภาษีปัจจุบัน
                          </div>
                        )}
                      </div>

                      <div
                        className={[
                          "text-sm font-semibold",
                          isCurrentYear
                            ? "text-blue-700"
                            : "text-slate-900",
                        ].join(" ")}
                      >
                        {formatNumber(
                          item.allowed
                        )}{" "}
                        บาท
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">
                สิทธิที่ใช้ได้ในปี{" "}
                {state.taxYear}
              </div>

              <div className="mt-1 text-xl font-semibold text-blue-700">
                {formatNumber(
                  thaiEsgxTransfer
                    .allowedThisYear
                )}{" "}
                บาท
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsThaiEsgxInfoOpen(false)
              }
              className="mt-5 h-11 w-full rounded-xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function DeductionInput({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number | undefined;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-4">

      <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">

        <div>
          <label className="font-medium text-slate-800">
            {label}
          </label>

          {description && (
            <div className="mt-1 text-sm leading-5 text-slate-400">
              {description}
            </div>
          )}
        </div>

        <div className="relative">

          <input
            inputMode="numeric"
            value={
              value
                ? formatNumber(
                    value
                  )
                : ""
            }
            onChange={(e) =>
              onChange(
                parseNumber(
                  e.target
                    .value
                )
              )
            }
            placeholder="0"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-right text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            บาท
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">

      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={
          highlight
            ? "font-semibold text-blue-700"
            : "font-medium text-slate-900"
        }
      >
        {formatNumber(value)}
      </span>

    </div>
  );
}