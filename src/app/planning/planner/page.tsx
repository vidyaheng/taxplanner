"use client";

import {
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import {
  calculateTax,
} from "@/lib/tax/engine";

import {
  applyPlanningToDeductions,
  calculatePlanningCapacity,
  calculatePlanningUsageDetails,
} from "@/lib/tax/scenarios";

import {
  PlanningData,
  PlanningLimitReason,
} from "@/types/planning";


type PlanningFieldKey =
  keyof PlanningData;


const planningFields: {
  key: PlanningFieldKey;
  label: string;
  description: string;
}[] = [
  {
    key: "lifeInsurance",
    label: "ประกันชีวิตเพิ่ม",
    description:
      "เบี้ยประกันชีวิตที่กำลังพิจารณาซื้อเพิ่ม",
  },
  {
    key: "healthInsuranceSelf",
    label: "ประกันสุขภาพตนเองเพิ่ม",
    description:
      "เบี้ยประกันสุขภาพที่กำลังพิจารณาซื้อเพิ่ม",
  },
  {
    key: "pensionInsurance",
    label: "ประกันบำนาญเพิ่ม",
    description:
      "เบี้ยประกันบำนาญที่กำลังพิจารณาจ่ายเพิ่ม",
  },
  {
    key: "rmf",
    label: "RMF เพิ่ม",
    description:
      "เงินลงทุน RMF ที่กำลังพิจารณาลงทุนเพิ่ม",
  },
  {
    key: "thaiEsg",
    label: "Thai ESG เพิ่ม",
    description:
      "เงินลงทุน Thai ESG ที่กำลังพิจารณาลงทุนเพิ่ม",
  },
];


function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "th-TH",
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}


function parseNumber(
  value: string
) {
  const cleaned =
    value.replace(/[^\d]/g, "");

  if (!cleaned) {
    return 0;
  }

  return Number(cleaned);
}


export default function PlannerPage() {
  const {
    state,
    setPlanning,
  } = useTaxPlanner();

  const router = useRouter();

  const planning: PlanningData = {
    lifeInsurance:
        state.planning?.lifeInsurance ?? 0,

    healthInsuranceSelf:
        state.planning?.healthInsuranceSelf ?? 0,

    pensionInsurance:
        state.planning?.pensionInsurance ?? 0,

    rmf:
        state.planning?.rmf ?? 0,

    thaiEsg:
        state.planning?.thaiEsg ?? 0,
    };

  /*
   * -------------------------
   * CURRENT
   * -------------------------
   *
   * คำนวณจากสิ่งที่ผู้ใช้
   * มีอยู่แล้วเท่านั้น
   */

  const currentResult =
    calculateTax({
      taxYear: state.taxYear,
      income: state.income,
      family: state.family,
      deductions:
        state.deductions,
    });


  /*
   * -------------------------
   * PLANNED SCENARIO
   * -------------------------
   *
   * Current deductions
   * +
   * สิ่งที่วางแผนซื้อเพิ่ม
   */

  const plannedDeductions =
    applyPlanningToDeductions(
      state.deductions,
      planning
    );


  const plannedResult =
    calculateTax({
      taxYear: state.taxYear,
      income: state.income,
      family: state.family,
      deductions:
        plannedDeductions,
    });


  /*
   * -------------------------
   * COMPARISON
   * -------------------------
   */

  const totalPlannedPayment =
    Object.values(
      planning
    ).reduce(
      (total, value) =>
        total + value,
      0
    );


  const additionalDeductionAllowed =
    Math.max(
      0,
      plannedResult
        .totalCurrentDeductions -
        currentResult
          .totalCurrentDeductions
    );


  const unusedPlannedAmount =
    Math.max(
      0,
      totalPlannedPayment -
        additionalDeductionAllowed
    );


  const additionalTaxSaving =
    Math.max(
      0,
      currentResult.taxBeforeCredits -
        plannedResult.taxBeforeCredits
    );


  function clearPlanning() {
    setPlanning({
      lifeInsurance: 0,
      healthInsuranceSelf: 0,
      pensionInsurance: 0,
      rmf: 0,
      thaiEsg: 0,
    });
  }


  /*
  * สิทธิที่เกิดจากแผนใหม่
  * แยกตามประเภท
  *
  * ให้ Tax Engine เป็นผู้คำนวณ
  * สิทธิที่เพิ่มขึ้นจริง เพื่อรองรับ
  * กรณีที่รายการต่าง ๆ ใช้เพดานร่วมกัน
  */

  const planningDetails =
    calculatePlanningUsageDetails(
      state.deductions,
      planning,
      (deductions) =>
        calculateTax({
          taxYear: state.taxYear,
          income: state.income,
          family: state.family,
          deductions,
        })
    );

  const planningCapacity =
    calculatePlanningCapacity(
      state.deductions,
      (deductions) =>
        calculateTax({
          taxYear: state.taxYear,
          income: state.income,
          family: state.family,
          deductions,
        })
    );


  return (
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* HEADER */}

      <div className="mb-8">
        <div className="text-sm font-medium text-blue-600">
          ขั้นตอนที่ 4 จาก 5
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          วางแผนลดภาษี
        </h1>

        <p className="mt-2 max-w-3xl text-slate-500">
          ทดลองเพิ่มประกันและเงินลงทุน
          โดยไม่เปลี่ยนข้อมูลสิทธิที่คุณมีอยู่แล้ว
          ระบบจะแสดงผลภาษีของแผนใหม่แบบทันที
        </p>
      </div>


      {/* MAIN 2 COLUMNS */}

      <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:items-start xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">

        {/* LEFT */}

        <div className="min-w-0 space-y-6">

          {/* INPUTS */}

          <div className="rounded-3xl border border-slate-200 bg-white">

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  สิ่งที่กำลังพิจารณาเพิ่ม
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  กรอกเฉพาะยอดที่คิดว่าจะซื้อหรือลงทุนเพิ่มจากของเดิม
                </p>
              </div>

              {totalPlannedPayment > 0 && (
                <button
                  type="button"
                  onClick={clearPlanning}
                  className="shrink-0 text-sm font-medium text-slate-400 hover:text-red-600"
                >
                  ล้างแผน
                </button>
              )}

            </div>


            <div className="divide-y divide-slate-100">

              {planningFields.map((field) => (
                <PlannerInput
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={planning[field.key]}
                  allowed={
                    planningDetails[field.key]
                      .allowedAdditional
                  }
                  capacity={
                    planningCapacity[field.key]
                  }
                  reasons={
                    planningDetails[field.key]
                      .reasons
                  }
                  onChange={(value) =>
                    setPlanning({
                      [field.key]: value,
                    })
                  }
                />
              ))}

            </div>

          </div>


          {/* WARNINGS */}

          {plannedResult.warnings.length > 0 && (
            <div className="space-y-2">

              {plannedResult.warnings.map(
                (warning, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
                  >
                    {warning}
                  </div>
                )
              )}

            </div>
          )}


          {/* RESULT TITLE */}

          <div className="pt-2">

            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              ผลจากแผนที่คุณเลือก
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              ตัวเลขจะเปลี่ยนตามยอดที่คุณกรอกด้านบนแบบทันที
            </p>

          </div>


          {/* COMPARISON */}

          <div className="grid gap-4 md:grid-cols-2">

            <TaxCard
              title="สถานะปัจจุบัน"
              tax={
                currentResult.taxBeforeCredits
              }
              taxableIncome={
                currentResult.taxableIncome
              }
              deductions={
                currentResult.totalCurrentDeductions
              }
            />

            <TaxCard
              title="หลังวางแผน"
              tax={
                plannedResult.taxBeforeCredits
              }
              taxableIncome={
                plannedResult.taxableIncome
              }
              deductions={
                plannedResult.totalCurrentDeductions
              }
              highlight
            />

          </div>


          {/* SAVING HERO */}

          <div className="rounded-3xl bg-blue-600 p-4 text-white sm:p-6">

            <div className="text-sm text-blue-100">
              หากทำตามแผนนี้
            </div>

            <div className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">
              ประหยัดภาษีเพิ่ม{" "}
              {formatNumber(
                additionalTaxSaving
              )}{" "}
              บาท
            </div>

            <div className="mt-3 text-sm text-blue-100">
              จากภาษี{" "}
              {formatNumber(
                currentResult.taxBeforeCredits
              )}{" "}
              บาท เหลือ{" "}
              {formatNumber(
                plannedResult.taxBeforeCredits
              )}{" "}
              บาท
            </div>

          </div>


          {/* NAV */}

          <div className="flex items-center justify-between pt-2">

            <Link
              href="/planning/deductions"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← ย้อนกลับ
            </Link>

            <Link
              href="/planning/results"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ดูผลสรุป →
            </Link>

          </div>

        </div>


        {/* RIGHT SIDEBAR */}

        <aside className="min-w-0">

          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 min-[960px]:sticky min-[960px]:top-6">

            <div className="text-lg font-semibold text-slate-900">
              สรุปแผน
            </div>


            <div className="mt-5 space-y-4">

              <SummaryRow
                label="ซื้อ / ลงทุนเพิ่ม"
                value={totalPlannedPayment}
              />

              <SummaryRow
                label="ใช้ลดหย่อนเพิ่มได้"
                value={additionalDeductionAllowed}
                highlight
              />

              {unusedPlannedAmount > 0 && (
                <SummaryRow
                  label="ยอดที่ไม่ช่วยลดภาษีเพิ่ม"
                  value={unusedPlannedAmount}
                />
              )}

            </div>


            <div className="mt-5 border-t border-slate-100 pt-5">

              <div className="text-sm text-slate-500">
                ภาษีปัจจุบัน
              </div>

              <div className="mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-slate-900">
                {formatNumber(
                  currentResult.taxBeforeCredits
                )}{" "}
                บาท
              </div>

            </div>


            <div className="mt-4">

              <div className="text-sm text-slate-500">
                ภาษีหลังวางแผน
              </div>

              <div className="mt-1 whitespace-nowrap text-2xl font-bold tabular-nums text-blue-700">
                {formatNumber(
                  plannedResult.taxBeforeCredits
                )}{" "}
                บาท
              </div>

            </div>


            <div className="mt-5 rounded-2xl bg-blue-50 p-4">

              <div className="text-sm text-blue-700">
                ประหยัดภาษีเพิ่ม
              </div>

              <div className="mt-1 whitespace-nowrap text-2xl font-bold tabular-nums text-blue-700 sm:text-3xl">
                {formatNumber(
                  additionalTaxSaving
                )}{" "}
                บาท
              </div>

            </div>


            {totalPlannedPayment > 0 && (
              <div className="mt-5 text-xs leading-5 text-slate-400">
                ระบบคำนวณจากสิทธิที่มีอยู่แล้วรวมกับยอดที่กำลังวางแผน
                และใช้เพดานค่าลดหย่อนของแต่ละประเภทอัตโนมัติ
              </div>
            )}

          </div>

        </aside>

      </div>

    </div>
  </main>
);
}


function PlannerInput({
  label,
  description,
  value,
  allowed,
  capacity,
  reasons,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  allowed: number;
  capacity: number;

  reasons:
    PlanningLimitReason[];

  onChange: (
    value: number
  ) => void;
}) {
  const unused =
    Math.max(
      0,
      value - allowed
    );

  return (
    <div className="p-4 sm:p-6">

      <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-start">

        <div>
          <div className="font-medium text-slate-900">
            {label}
          </div>

          <div className="mt-1 text-sm leading-5 text-slate-400">
            {description}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            สิทธิลดหย่อนที่ยังเพิ่มได้โดยประมาณ{" "}
            <span className="font-medium text-slate-700">
              {formatNumber(
                capacity
              )}{" "}
              บาท
            </span>
          </div>


          {value > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">

              <span className="font-medium text-blue-700">
                ใช้ลดหย่อนเพิ่มได้{" "}
                {formatNumber(
                  allowed
                )}{" "}
                บาท
              </span>

              {unused > 0 && (
                <div className="flex items-center gap-2">

                  <span className="font-medium text-amber-600">
                    ส่วนที่เกินสิทธิลดหย่อน{" "}
                    {formatNumber(
                      unused
                    )}{" "}
                    บาท
                  </span>

                  {reasons.length > 0 && (
                    <LimitReasonButton
                      reasons={reasons}
                    />
                  )}

                </div>
              )}

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
                  e.target.value
                )
              )
            }
            placeholder="0"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-right text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            บาท
          </span>

        </div>

      </div>

    </div>
  );
}

function LimitReasonButton({
  reasons,
}: {
  reasons:
    PlanningLimitReason[];
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="ดูเหตุผลที่ใช้สิทธิลดหย่อนได้ไม่เต็มจำนวน"
        onClick={() =>
          setIsOpen(true)
        }
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
      >
        !
      </button>


      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={() =>
            setIsOpen(false)
          }
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-label="เหตุผลที่ใช้สิทธิลดหย่อนได้ไม่เต็มจำนวน"
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="text-lg font-semibold text-slate-900">
                  ทำไมใช้สิทธิได้ไม่เต็มจำนวน?
                </div>

                <div className="mt-1 text-sm leading-6 text-slate-500">
                  ระบบตรวจพบข้อจำกัดของสิทธิลดหย่อนในแผนนี้
                </div>
              </div>


              <button
                type="button"
                aria-label="ปิด"
                onClick={() =>
                  setIsOpen(false)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>

            </div>


            <div className="mt-5 space-y-4">

              {reasons.map(
                (
                  reason,
                  index
                ) => (
                  <LimitReasonCard
                    key={`${reason.type}-${index}`}
                    reason={reason}
                  />
                )
              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}


function LimitReasonCard({
  reason,
}: {
  reason:
    PlanningLimitReason;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

      <div className="font-semibold text-amber-900">
        {reason.title}
      </div>


      {reason.incomeRate !==
        undefined &&
        reason.assessableIncome !==
          undefined && (
        <div className="mt-3 space-y-2 text-sm text-slate-600">

          <ReasonRow
            label="เงินได้พึงประเมิน"
            value={
              reason
                .assessableIncome
            }
          />

          <div className="flex items-center justify-between gap-4">
            <span>
              อัตราสูงสุดตามรายได้
            </span>

            <span className="font-medium text-slate-900">
              {new Intl.NumberFormat(
                "th-TH",
                {
                  style:
                    "percent",
                  maximumFractionDigits:
                    0,
                }
              ).format(
                reason.incomeRate
              )}
            </span>
          </div>

        </div>
      )}


      <div className="mt-3 space-y-2 border-t border-amber-200 pt-3 text-sm">

        {reason.limit !==
          undefined && (
          <ReasonRow
            label="เพดานสิทธิ"
            value={
              reason.limit
            }
          />
        )}

        {reason.used !==
          undefined && (
          <ReasonRow
            label="ใช้สิทธิอยู่แล้ว"
            value={
              reason.used
            }
          />
        )}

        {reason.remaining !==
          undefined && (
          <ReasonRow
            label="เหลือสิทธิ"
            value={
              reason.remaining
            }
            highlight
          />
        )}

      </div>

    </div>
  );
}


function ReasonRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-slate-600">
        {label}
      </span>

      <span
        className={
          highlight
            ? "font-semibold text-blue-700"
            : "font-medium text-slate-900"
        }
      >
        {formatNumber(value)} บาท
      </span>

    </div>
  );
}

function TaxCard({
  title,
  tax,
  taxableIncome,
  deductions,
  highlight = false,
}: {
  title: string;
  tax: number;
  taxableIncome: number;
  deductions: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl border border-blue-200 bg-blue-50 p-4 sm:p-6"
          : "rounded-3xl border border-slate-200 bg-white p-4 sm:p-6"
      }
    >

      <div
        className={
          highlight
            ? "text-sm font-medium text-blue-700"
            : "text-sm font-medium text-slate-500"
        }
      >
        {title}
      </div>

      <div
        className={
          highlight
            ? "mt-2 text-2xl sm:text-3xl font-bold text-blue-700"
            : "mt-2 text-2xl sm:text-3xl font-bold text-slate-900"
        }
      >
        {formatNumber(tax)} บาท
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-200/70 pt-4 text-sm">

        <SummaryRow
          label="เงินได้สุทธิ"
          value={taxableIncome}
        />

        <SummaryRow
          label="ค่าลดหย่อนรวม"
          value={deductions}
        />

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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <span className="min-w-0 text-sm leading-6 text-slate-500">
        {label}
      </span>

      <span
        className={[
          "whitespace-nowrap text-right text-sm tabular-nums",
          highlight
            ? "font-semibold text-blue-700"
            : "font-medium text-slate-900",
        ].join(" ")}
      >
        {formatNumber(value)} บาท
      </span>
    </div>
  );
}