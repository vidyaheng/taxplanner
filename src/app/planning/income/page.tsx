"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  useTaxPlanner,
} from "@/store/TaxPlannerContext";

import {
  OtherIncomeKey,
} from "@/types/income";

interface OtherIncomeDefinition {
  id: OtherIncomeKey;
  label: string;
  description: string;
}

const otherIncomeDefinitions:
  OtherIncomeDefinition[] = [
  {
    id: "commission",
    label: "ค่านายหน้า / ค่าตอบแทน",
    description:
      "รายได้จากค่านายหน้า ค่าธรรมเนียม หรือค่าตอบแทนอื่น",
  },
  {
    id: "rent",
    label: "ค่าเช่า",
    description:
      "รายได้จากการให้เช่าบ้าน อาคาร ที่ดิน หรือทรัพย์สิน",
  },
  {
    id: "professional",
    label: "วิชาชีพอิสระ",
    description:
      "รายได้จากการประกอบวิชาชีพอิสระ",
  },
  {
    id: "business",
    label: "ธุรกิจ / ค้าขาย",
    description:
      "รายได้จากธุรกิจ การค้า หรือกิจการอื่น",
  },
  {
    id: "investment",
    label: "ดอกเบี้ย / เงินปันผล",
    description:
      "รายได้จากการลงทุนที่ต้องการนำมาคำนวณภาษี",
  },
  {
    id: "other",
    label: "รายได้อื่น",
    description:
      "รายได้อื่นที่ยังไม่ได้ระบุไว้ด้านบน",
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

export default function IncomePage() {
  const {
    state,
    setIncome,
    setOtherIncome,
  } = useTaxPlanner();

  const income = state.income;

  const annualSalary =
    income.monthlySalary * 12;

  const totalOtherIncome =
    useMemo(() => {
      if (!income.hasOtherIncome) {
        return 0;
      }

      return Object.values(
        income.otherIncome
      ).reduce(
        (total, value) =>
          total + value,
        0
      );
    }, [
      income.hasOtherIncome,
      income.otherIncome,
    ]);

  const totalIncome =
    annualSalary +
    income.annualBonus +
    income.otherEmploymentIncome +
    totalOtherIncome;

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
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-blue-600">
                1. รายได้
              </span>

              <span className="text-slate-400">
                ขั้นตอนที่ 1 จาก 5
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/5 rounded-full bg-blue-600" />
            </div>
          </div>
        </header>

        <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_320px] min-[960px]:items-start">

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              รายได้ของคุณ
            </h1>

            <p className="mt-2 text-slate-500">
              เริ่มจากรายได้ที่ได้รับตลอดปี
              ระบบจะนำไปคำนวณค่าใช้จ่ายและภาษีให้อัตโนมัติ
            </p>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">
                เงินเดือนและรายได้จากงานประจำ
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <MoneyInput
                  label="เงินเดือนต่อเดือน"
                  value={
                    income.monthlySalary
                  }
                  onChange={(value) =>
                    setIncome({
                      monthlySalary:
                        value,
                    })
                  }
                />

                <MoneyInput
                  label="โบนัสทั้งปี"
                  value={
                    income.annualBonus
                  }
                  onChange={(value) =>
                    setIncome({
                      annualBonus:
                        value,
                    })
                  }
                />
              </div>

              <div className="mt-5">

                <MoneyInput
                  label="รายได้จากงานประจำอื่น ๆ ตลอดปี"
                  description="เช่น ค่าตำแหน่ง ค่าตอบแทน หรือรายได้อื่นจากนายจ้าง"
                  value={
                    income.otherEmploymentIncome
                  }
                  onChange={(value) =>
                    setIncome({
                      otherEmploymentIncome:
                        value,
                    })
                  }
                />

              </div>

              {annualSalary > 0 && (
                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  เงินเดือนรวมทั้งปี{" "}
                  <strong>
                    {formatNumber(
                      annualSalary
                    )}{" "}
                    บาท
                  </strong>
                </div>
              )}
            </div>

            <div className="mt-9 border-t border-slate-100 pt-8">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    มีรายได้ประเภทอื่นหรือไม่?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    เช่น ค่าเช่า ค่านายหน้า
                    วิชาชีพอิสระ ธุรกิจ
                    หรือรายได้จากการลงทุน
                  </p>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">

                  <button
                    type="button"
                    onClick={() =>
                      setIncome({
                        hasOtherIncome:
                          false,
                      })
                    }
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                      !income.hasOtherIncome
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    ไม่มี
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIncome({
                        hasOtherIncome:
                          true,
                      })
                    }
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                      income.hasOtherIncome
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    มี
                  </button>
                </div>
              </div>

              {income.hasOtherIncome && (
                <div className="mt-6 space-y-4">

                  {otherIncomeDefinitions.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">

                          <div>
                            <div className="font-medium text-slate-800">
                              {
                                item.label
                              }
                            </div>

                            <div className="mt-1 text-sm text-slate-400">
                              {
                                item.description
                              }
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              inputMode="numeric"
                              value={
                                income
                                  .otherIncome[
                                  item.id
                                ]
                                  ? formatNumber(
                                      income
                                        .otherIncome[
                                        item
                                          .id
                                      ]
                                    )
                                  : ""
                              }
                              onChange={(
                                e
                              ) =>
                                setOtherIncome(
                                  item.id,
                                  parseNumber(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              placeholder="0"
                              className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-16 text-right text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              บาท
                            </span>
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
                href="/"
                className="rounded-xl px-5 py-3 font-medium text-slate-500 transition hover:bg-slate-100"
              >
                ← ย้อนกลับ
              </Link>

              <Link
                href="/planning/family"
                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                ถัดไป →
              </Link>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 min-[960px]:sticky min-[960px]:top-8">

            <div className="text-sm font-medium text-slate-500">
              สรุปรายได้
            </div>

            <div className="mt-5">
              <div className="text-sm text-slate-500">
                รายได้รวมทั้งปี
              </div>

              <div className="mt-1 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                {formatNumber(
                  totalIncome
                )}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                บาท
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">

              <SummaryRow
                label="เงินเดือน"
                value={
                  annualSalary
                }
              />

              <SummaryRow
                label="โบนัส"
                value={
                  income.annualBonus
                }
              />

              <SummaryRow
                label="รายได้จากงานอื่น"
                value={
                  income.otherEmploymentIncome
                }
              />

              {income.hasOtherIncome && (
                <SummaryRow
                  label="รายได้ประเภทอื่น"
                  value={
                    totalOtherIncome
                  }
                />
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              ตอนนี้ยังเป็นรายได้ก่อนหักค่าใช้จ่ายและค่าลดหย่อน
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MoneyInput({
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
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {description && (
        <p className="mb-2 text-sm text-slate-400">
          {description}
        </p>
      )}

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
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-lg text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          บาท
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between gap-3">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-800">
        {formatNumber(value)}
      </span>

    </div>
  );
}