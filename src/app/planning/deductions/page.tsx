"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import {
  DeductionData,
} from "@/types/deductions";

import {
  calculateTax,
} from "@/lib/tax/engine";

import {
  PregnancyExpenseData,
} from "@/types/family";

type DeductionKey =
  keyof DeductionData;

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
      "ประกันชีวิต สุขภาพ และประกันบำนาญที่มีอยู่แล้ว",
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
      {
        key: "parentHealthInsurance",
        label: "เบี้ยประกันสุขภาพบิดา / มารดา",
      },
      {
        key: "pensionInsurance",
        label: "เบี้ยประกันชีวิตแบบบำนาญ",
        description:
          "ระบบจะตรวจเพดานร่วมกับกลุ่มเกษียณภายหลัง",
      },
    ],
  },

  {
    id: "retirement",
    title: "การออมเพื่อเกษียณ",
    description:
      "เงินสะสมและเงินลงทุนเพื่อการเกษียณ",
    fields: [
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
        key: "thaiEsgxCarryForward",
        label: "Thai ESGX — สิทธิจาก LTF",
        description:
          "เฉพาะสิทธิที่กระจายมาจากการสับเปลี่ยน LTF เดิม",
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

  const [openSections, setOpenSections] =
    useState<string[]>([
      "insurance",
    ]);

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

  function getSectionTotal(
    section:
      DeductionSectionData
  ) {
    let total =
      section.fields.reduce(
        (sum, field) =>
          sum +
          deductions[field.key],
        0
      );

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
      (total, [key, value]) => {
        /*
        * field เก่าค้างไว้เพื่อ compatibility
        * แต่เราไม่ใช้มันแล้ว
        */
        if (
          key ===
          "pregnancyAndChildbirth"
        ) {
          return total;
        }

        return total + value;
      },
      0
    );

  const enteredTotal =
    enteredDeductionTotal +
    pregnancyUsage.totalPaid;

  const usedSections =
    sections.filter(
      (section) =>
        getSectionTotal(
          section
        ) > 0
    ).length;

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

            <div className="mb-3 flex items-center justify-between text-sm">

              <span className="font-medium text-blue-600">
                3. ค่าลดหย่อน
              </span>

              <span className="text-slate-400">
                ขั้นตอนที่ 3 จาก 5
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-3/5 rounded-full bg-blue-600" />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
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
                        className="flex w-full items-center justify-between gap-4 bg-white p-5 text-left transition hover:bg-slate-50"
                      >
                        <div>
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
                        <div className="border-t border-slate-100 bg-slate-50/60 p-5">

                          <div className="space-y-4">

                            {section.fields.map(
                              (
                                field
                              ) => (
                                <DeductionInput
                                  key={
                                    field.key
                                  }
                                  label={
                                    field.label
                                  }
                                  description={
                                    field.description
                                  }
                                  value={
                                    deductions[
                                      field
                                        .key
                                    ]
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    setDeductions(
                                      {
                                        [field.key]:
                                          value,
                                      }
                                    )
                                  }
                                />
                              )
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
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">

            <div className="text-sm font-medium text-slate-500">
              สรุปค่าลดหย่อน
            </div>

            <div className="mt-5">

              <div className="text-sm text-slate-500">
                จำนวนที่กรอกทั้งหมด
              </div>

              <div className="mt-1 text-3xl font-bold text-slate-900">
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

            {taxResult.totalCurrentDeductions > 0 && (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                <div className="text-sm font-semibold text-blue-800">
                  ผลต่อภาษี
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
                      ประหยัดภาษี
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
  value: number;
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