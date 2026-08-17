"use client";

import { useTaxPlanner } from "@/store/TaxPlannerContext";
import { calculateTax } from "@/lib/tax/engine";
import { applyPlanningToDeductions } from "@/lib/tax/scenarios";

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

interface CompareRowProps {
  label: string;
  current: string;
  planned: string;
  emphasize?: boolean;
}

interface DeductionDetail {
  label: string;
  current: number;
  planned: number;
}

interface DeductionCompareRowProps {
  current: number;
  planned: number;
  details: DeductionDetail[];
}

function CompareRow({
  label,
  current,
  planned,
  emphasize = false,
}: CompareRowProps) {
  return (
    <div
      className={[
        "border-b border-slate-100 py-5 last:border-b-0",
        emphasize ? "bg-slate-50/70" : "",
      ].join(" ")}
    >
      <div className="mb-3 text-sm font-medium text-slate-600">
        {label}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs text-slate-400">
            ก่อนวางแผน
          </div>

          <div
            className={[
              "break-words font-semibold text-slate-800",
              emphasize
                ? "text-xl sm:text-2xl"
                : "text-base sm:text-lg",
            ].join(" ")}
          >
            {current}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">
            หลังวางแผน
          </div>

          <div
            className={[
              "break-words font-semibold text-slate-800",
              emphasize
                ? "text-xl sm:text-2xl"
                : "text-base sm:text-lg",
            ].join(" ")}
          >
            {planned}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeductionCompareRow({
  current,
  planned,
  details,
}: DeductionCompareRowProps) {
  const visibleDetails = details.filter(
    (item) =>
      item.current > 0 ||
      item.planned > 0
  );

  return (
    <div className="border-b border-slate-100 py-5">
      <div className="mb-3 text-sm font-medium text-slate-600">
        ค่าลดหย่อน
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs text-slate-400">
            ก่อนวางแผน
          </div>

          <div className="text-base font-semibold text-slate-800 sm:text-lg">
            {formatNumber(current)} บาท
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">
            หลังวางแผน
          </div>

          <div className="text-base font-semibold text-slate-800 sm:text-lg">
            {formatNumber(planned)} บาท
          </div>
        </div>
      </div>

      <details className="group mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-slate-600">
          <span>
            แสดงรายละเอียดค่าลดหย่อน
          </span>

          <span className="text-lg leading-none text-slate-400 transition-transform group-open:rotate-180">
            ⌄
          </span>
        </summary>

        <div className="border-t border-slate-200 bg-white">
          {visibleDetails.map(
            (item) => (
              <div
                key={item.label}
                className="border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div className="mb-2 text-sm text-slate-600">
                  {item.label}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-400">
                      ก่อนวางแผน
                    </div>

                    <div className="mt-0.5 text-sm font-medium text-slate-700">
                      {formatNumber(
                        item.current
                      )}{" "}
                      บาท
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">
                      หลังวางแผน
                    </div>

                    <div className="mt-0.5 text-sm font-medium text-slate-700">
                      {formatNumber(
                        item.planned
                      )}{" "}
                      บาท
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </details>
    </div>
  );
}

export default function ResultsPage() {
  const { state } = useTaxPlanner();

  const currentResult = calculateTax({
    taxYear: state.taxYear,
    income: state.income,
    family: state.family,
    deductions: state.deductions,
  });

  const plannedDeductions =
    applyPlanningToDeductions(
      state.deductions,
      state.planning
    );

  const plannedResult = calculateTax({
    taxYear: state.taxYear,
    income: state.income,
    family: state.family,
    deductions: plannedDeductions,
  });

  const currentTotalAllowances =
    currentResult.familyAllowances.total +
    currentResult.totalCurrentDeductions;

  const plannedTotalAllowances =
    plannedResult.familyAllowances.total +
    plannedResult.totalCurrentDeductions;

  const deductionDetails: DeductionDetail[] = [
    {
        label: "ค่าลดหย่อนส่วนตัว",
        current:
        currentResult.familyAllowances
            .taxpayer,
        planned:
        plannedResult.familyAllowances
            .taxpayer,
    },
    {
        label: "คู่สมรส",
        current:
        currentResult.familyAllowances
            .spouse,
        planned:
        plannedResult.familyAllowances
            .spouse,
    },
    {
        label: "บุตร",
        current:
        currentResult.familyAllowances
            .children,
        planned:
        plannedResult.familyAllowances
            .children,
    },
    {
        label: "บิดามารดา",
        current:
        currentResult.familyAllowances
            .parents,
        planned:
        plannedResult.familyAllowances
            .parents,
    },
    {
        label: "ผู้พิการหรือทุพพลภาพ",
        current:
        currentResult.familyAllowances
            .disabledDependents,
        planned:
        plannedResult.familyAllowances
            .disabledDependents,
    },
    {
        label: "ประกันชีวิตและสุขภาพ",
        current:
        currentResult.insuranceDeductions
            .totalAllowed,
        planned:
        plannedResult.insuranceDeductions
            .totalAllowed,
    },
    {
        label: "การออมเพื่อเกษียณ",
        current:
        currentResult.retirementDeductions
            .totalAllowed,
        planned:
        plannedResult.retirementDeductions
            .totalAllowed,
    },
    {
        label: "ค่าลดหย่อนอื่น",
        current:
        currentResult.generalDeductions
            .totalAllowed,
        planned:
        plannedResult.generalDeductions
            .totalAllowed,
    },
    {
        label: "ค่าฝากครรภ์และคลอดบุตร",
        current:
        currentResult.pregnancyDeductions
            .totalAllowed,
        planned:
        plannedResult.pregnancyDeductions
            .totalAllowed,
    },
    {
        label: "เงินบริจาค",
        current:
        currentResult.donationDeductions
            .totalAllowed,
        planned:
        plannedResult.donationDeductions
            .totalAllowed,
    },
  ];

  const taxSavings = Math.max(
    0,
    currentResult.taxBeforeCredits -
      plannedResult.taxBeforeCredits
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-7 md:p-8">
          <div className="text-sm font-medium text-slate-400">
            ผลการวางแผนภาษี ปี {state.taxYear}
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            ก่อนและหลังวางแผน
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            เปรียบเทียบผลการคำนวณภาษีจากข้อมูลปัจจุบัน
            กับแผนลดหย่อนที่คุณเลือก
          </p>
        </div>

        <div className="px-5 sm:px-7 md:px-8">
          <CompareRow
            label="รายได้พึงประเมิน"
            current={`${formatNumber(
              currentResult.totalGrossIncome
            )} บาท`}
            planned={`${formatNumber(
              plannedResult.totalGrossIncome
            )} บาท`}
          />

          <DeductionCompareRow
            current={currentTotalAllowances}
            planned={plannedTotalAllowances}
            details={deductionDetails}
          />

          <CompareRow
            label="เงินได้สุทธิ"
            current={`${formatNumber(
              currentResult.taxableIncome
            )} บาท`}
            planned={`${formatNumber(
              plannedResult.taxableIncome
            )} บาท`}
            emphasize
          />

          <CompareRow
            label="อัตราภาษีสูงสุด"
            current={formatPercent(
              currentResult.marginalTaxRate
            )}
            planned={formatPercent(
              plannedResult.marginalTaxRate
            )}
          />

          <CompareRow
            label="ภาษีที่ต้องเสีย"
            current={`${formatNumber(
              currentResult.taxBeforeCredits
            )} บาท`}
            planned={`${formatNumber(
              plannedResult.taxBeforeCredits
            )} บาท`}
            emphasize
          />

          <CompareRow
            label="อัตราภาษีที่แท้จริง"
            current={formatPercent(
              currentResult.effectiveTaxRate
            )}
            planned={formatPercent(
              plannedResult.effectiveTaxRate
            )}
          />
        </div>

        <div className="m-4 rounded-3xl bg-slate-900 p-5 text-white sm:m-6 sm:p-7 md:m-8">
          <div className="text-sm text-slate-300">
            จากแผนที่คุณเลือก
          </div>

          <div className="mt-2 text-2xl font-semibold sm:text-3xl">
            ประหยัดภาษีได้{" "}
            {formatNumber(taxSavings)} บาท
          </div>

          <div className="mt-3 text-sm leading-6 text-slate-300">
            ภาษีลดจาก{" "}
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
      </section>
    </main>
  );
}