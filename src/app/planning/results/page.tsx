"use client";

import Link from "next/link";

import { useTaxPlanner } from "@/store/TaxPlannerContext";
import { calculateTax } from "@/lib/tax/engine";
import { applyPlanningToDeductions } from "@/lib/tax/scenarios";
import PlanningStepper from "@/components/planning/PlanningStepper";

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

function CompareTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_120px] gap-3 border-b border-slate-200 px-5 py-3 text-lg text-slate-900 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8">
      <div>
        รายการ
      </div>

      <div className="pr-2 text-right">
        ก่อนวางแผน
      </div>

      <div className="pr-2 text-right text-blue-700">
        หลังวางแผน
      </div>
    </div>
  );
}

function CompareRow({
  label,
  current,
  planned,
  emphasize = false,
}: CompareRowProps) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 border-b border-slate-100 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8"
    >
      <div
        className={[
          "min-w-0 text-sm",
          emphasize
            ? "font-semibold text-slate-900"
            : "font-medium text-slate-600",
        ].join(" ")}
      >
        {label}
      </div>

      <div
        className={[
          "whitespace-nowrap pr-2 text-right tabular-nums text-slate-800",
          emphasize
            ? "text-base font-semibold sm:text-lg"
            : "text-sm font-semibold sm:text-base",
        ].join(" ")}
      >
        {current}
      </div>

      <div
        className={[
          "whitespace-nowrap pr-2 text-right tabular-nums text-blue-700",
          emphasize
            ? "text-base font-semibold sm:text-lg"
            : "text-sm font-semibold sm:text-base",
        ].join(" ")}
      >
        {planned}
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
    <div className="border-b border-slate-100">
      <div className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8">
        <div className="min-w-0 text-sm font-medium text-slate-600">
          ค่าลดหย่อน
        </div>

        <div className="pr-2 text-right text-sm font-semibold tabular-nums text-slate-800 sm:text-base">
          {formatNumber(current)} บาท
        </div>

        <div className="pr-2 text-right text-sm font-semibold tabular-nums text-blue-700 sm:text-base">
          {formatNumber(planned)} บาท
        </div>
      </div>

      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_120px_120px] gap-3 px-5 pb-4 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <span>
              แสดงรายละเอียดค่าลดหย่อน
            </span>

            <span className="text-lg leading-none text-slate-400 transition-transform group-open:rotate-180">
              ⌄
            </span>
          </div>
        </summary>

        <div className="border-t border-slate-100">
          {visibleDetails.map(
            (item) => (
              <div
                key={item.label}
                className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8"
              >
                <div className="min-w-0 pl-2 text-sm text-slate-500">
                  {item.label}
                </div>

                <div className="whitespace-nowrap text-right text-sm font-medium tabular-nums text-slate-700">
                  {formatNumber(
                    item.current
                  )}
                </div>

                <div
                  className={[
                    "whitespace-nowrap text-right text-sm font-medium tabular-nums",
                    item.planned > item.current
                      ? "text-blue-700"
                      : item.planned < item.current
                        ? "text-amber-700"
                        : "text-slate-700",
                  ].join(" ")}
                >
                  <div>
                    {formatNumber(
                      item.planned
                    )}
                  </div>

                  {item.planned !== item.current && (
                    <div className="mt-0.5 text-xs font-normal">
                      {item.planned > item.current
                        ? `+${formatNumber(
                            item.planned -
                              item.current
                          )}`
                        : `ลดลง ${formatNumber(
                            item.current -
                              item.planned
                          )}`}
                    </div>
                  )}
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

  const resultWarnings = Array.from(
    new Set([
      ...currentResult.warnings,
      ...plannedResult.warnings,
    ])
  );

  const isResultCalculationComplete =
    currentResult.isComplete &&
    plannedResult.isComplete;

  const currentNetTaxPosition =
    currentResult.taxPayable -
    currentResult.taxRefund;

  const plannedNetTaxPosition =
    plannedResult.taxPayable -
    plannedResult.taxRefund;

  const additionalTaxSaving =
    isResultCalculationComplete
      ? Math.max(
          0,
          currentNetTaxPosition -
            plannedNetTaxPosition
        )
      : 0;

  const taxBeforeCreditsReduction =
    isResultCalculationComplete
      ? Math.max(
          0,
          currentResult.taxBeforeCredits -
            plannedResult.taxBeforeCredits
        )
      : 0;

  const currentForeignTaxCredit =
    currentResult.taxCredits
      .foreignTaxCredit
      ?.totalAllowedCredit ?? 0;

  const plannedForeignTaxCredit =
    plannedResult.taxCredits
      .foreignTaxCredit
      ?.totalAllowedCredit ?? 0;

  const currentIncomeExpenses =
    Math.max(
      0,
      currentResult.incomeAfterExemptions -
        currentResult.incomeAfterExpenses
    );

  const plannedIncomeExpenses =
    Math.max(
      0,
      plannedResult.incomeAfterExemptions -
        plannedResult.incomeAfterExpenses
    );

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
      label: "ประกันชีวิต",
      current:
        currentResult.insuranceDeductions
          .lifeInsurance.allowed,
      planned:
        plannedResult.insuranceDeductions
          .lifeInsurance.allowed,
    },
    {
      label: "ประกันสุขภาพตนเอง",
      current:
        currentResult.insuranceDeductions
          .healthInsuranceSelf.allowed,
      planned:
        plannedResult.insuranceDeductions
          .healthInsuranceSelf.allowed,
    },
    {
      label: "ประกันชีวิตคู่สมรส",
      current:
        currentResult.insuranceDeductions
          .spouseLifeInsurance.allowed,
      planned:
        plannedResult.insuranceDeductions
          .spouseLifeInsurance.allowed,
    },
    {
      label: "ประกันสุขภาพบิดามารดา",
      current:
        currentResult.insuranceDeductions
          .parentHealthInsurance.allowed,
      planned:
        plannedResult.insuranceDeductions
          .parentHealthInsurance.allowed,
    },

    {
      label: "ประกันบำนาญ",
      current:
        currentResult.retirementDeductions
          .pensionInsurance.allowed,
      planned:
        plannedResult.retirementDeductions
          .pensionInsurance.allowed,
    },
    {
      label: "กองทุนสำรองเลี้ยงชีพ (PVD)",
      current:
        currentResult.retirementDeductions
          .providentFund.allowed,
      planned:
        plannedResult.retirementDeductions
          .providentFund.allowed,
    },
    {
      label: "กบข. (GPF)",
      current:
        currentResult.retirementDeductions
          .gpf.allowed,
      planned:
        plannedResult.retirementDeductions
          .gpf.allowed,
    },
    {
      label: "กองทุนสงเคราะห์ครูโรงเรียนเอกชน",
      current:
        currentResult.retirementDeductions
          .privateTeacherFund.allowed,
      planned:
        plannedResult.retirementDeductions
          .privateTeacherFund.allowed,
    },
    {
      label: "กอช.",
      current:
        currentResult.retirementDeductions
          .nsf.allowed,
      planned:
        plannedResult.retirementDeductions
          .nsf.allowed,
    },
    {
      label: "RMF",
      current:
        currentResult.retirementDeductions
          .rmf.allowed,
      planned:
        plannedResult.retirementDeductions
          .rmf.allowed,
    },

    {
      label: "Thai ESG",
      current:
        currentResult.generalDeductions
          .thaiEsg.allowed,
      planned:
        plannedResult.generalDeductions
          .thaiEsg.allowed,
    },
    {
      label: "Thai ESGX จากการสับเปลี่ยน LTF",
      current:
        currentResult.generalDeductions
          .thaiEsgxTransfer
          .allowedThisYear,
      planned:
        plannedResult.generalDeductions
          .thaiEsgxTransfer
          .allowedThisYear,
    },
    {
      label: "ประกันสังคม",
      current:
        currentResult.generalDeductions
          .socialSecurity.allowed,
      planned:
        plannedResult.generalDeductions
          .socialSecurity.allowed,
    },
    {
      label: "ดอกเบี้ยสินเชื่อที่อยู่อาศัย",
      current:
        currentResult.generalDeductions
          .homeLoanInterest.allowed,
      planned:
        plannedResult.generalDeductions
          .homeLoanInterest.allowed,
    },
    {
      label: "ลงทุนในวิสาหกิจเพื่อสังคม",
      current:
        currentResult.generalDeductions
          .socialEnterpriseInvestment.allowed,
      planned:
        plannedResult.generalDeductions
          .socialEnterpriseInvestment.allowed,
    },

    {
      label: "Solar Rooftop บ้านอยู่อาศัย",
      current:
        currentResult.generalDeductions
          .solarRooftop?.allowed ?? 0,
      planned:
        plannedResult.generalDeductions
          .solarRooftop?.allowed ?? 0,
    },
    {
      label: "ค่าซื้องานศิลปะด้านทัศนศิลป์",
      current:
        currentResult.generalDeductions
          .artPurchase?.allowed ?? 0,
      planned:
        plannedResult.generalDeductions
          .artPurchase?.allowed ?? 0,
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
      label: "เงินบริจาคพรรคการเมือง",
      current:
        currentResult.donationDeductions
          .politicalDonation.allowed,
      planned:
        plannedResult.donationDeductions
          .politicalDonation.allowed,
    },
    {
      label: "เงินบริจาคพิเศษ",
      current:
        currentResult.donationDeductions
          .specialDonation.allowed,
      planned:
        plannedResult.donationDeductions
          .specialDonation.allowed,
    },
    {
      label: "เงินบริจาคทั่วไป",
      current:
        currentResult.donationDeductions
          .generalDonation.allowed,
      planned:
        plannedResult.donationDeductions
          .generalDonation.allowed,
    },
    {
      label:
        "เงินบริจาคให้กองทัพอากาศตาม พ.ร.ฎ. 804",
      current:
        currentResult.donationDeductions
          .airForceStupaDonation
          ?.allowed ?? 0,
      planned:
        plannedResult.donationDeductions
          .airForceStupaDonation
          ?.allowed ?? 0,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PlanningStepper currentStep={5} />
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

        {(
          !isResultCalculationComplete ||
          resultWarnings.length > 0
        ) && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-7 md:px-8">
            <div className="font-semibold text-amber-900">
              {isResultCalculationComplete
                ? "มีข้อมูลที่ควรตรวจสอบก่อนใช้ผลคำนวณ"
                : "ยังไม่สามารถสรุปผลการคำนวณได้"}
            </div>

            {!isResultCalculationComplete && (
              <div className="mt-2 text-sm leading-6 text-amber-800">
                กรุณาตรวจสอบข้อมูลที่ยังไม่ครบถ้วนก่อน
                ระบบจึงจะแสดงผลเปรียบเทียบภาษีและผลประหยัดภาษี
              </div>
            )}

            {resultWarnings.length > 0 && (
              <div className="mt-2 space-y-2">
                {resultWarnings.map(
                  (warning, index) => (
                    <div
                      key={`${warning}-${index}`}
                      className="text-sm leading-6 text-amber-800"
                    >
                      • {warning}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {isResultCalculationComplete && (
          <>

            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 grid grid-cols-[minmax(0,1fr)_120px_120px] gap-3 px-5 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8"
                aria-hidden="true"
              >
                <div />
                <div className="bg-slate-50" />
                <div className="bg-blue-50" />
              </div>

              <div className="relative z-10">
                <CompareTableHeader />

                <CompareRow
                  label="รายได้พึงประเมิน"
                  current={`${formatNumber(
                    currentResult.totalGrossIncome
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.totalGrossIncome
                  )} บาท`}
                />

                {(
                  currentResult.incomeExemptions.total > 0 ||
                  plannedResult.incomeExemptions.total > 0
                ) && (
                  <CompareRow
                    label="เงินได้ที่ได้รับยกเว้นสำหรับผู้มีอายุ 65 ปีขึ้นไป"
                    current={`${formatNumber(
                      currentResult.incomeExemptions
                        .seniorResident
                    )} บาท`}
                    planned={`${formatNumber(
                      plannedResult.incomeExemptions
                        .seniorResident
                    )} บาท`}
                  />
                )}

                {(
                  currentIncomeExpenses > 0 ||
                  plannedIncomeExpenses > 0
                ) && (
                  <CompareRow
                    label="ค่าใช้จ่ายหักจากเงินได้"
                    current={`${formatNumber(
                      currentIncomeExpenses
                    )} บาท`}
                    planned={`${formatNumber(
                      plannedIncomeExpenses
                    )} บาท`}
                  />
                )}

                {(
                  currentResult
                    .energyEfficientInvestmentQualifyingAmount >
                    0 ||
                  plannedResult
                    .energyEfficientInvestmentQualifyingAmount >
                    0
                ) && (
                  <>
                    <CompareRow
                      label="เงินลงทุนอนุรักษ์พลังงานที่เข้าเงื่อนไข พ.ร.ฎ. 805"
                      current={`${formatNumber(
                        currentResult
                          .energyEfficientInvestmentQualifyingAmount
                      )} บาท`}
                      planned={`${formatNumber(
                        plannedResult
                          .energyEfficientInvestmentQualifyingAmount
                      )} บาท`}
                    />

                    <CompareRow
                      label="เงินได้ยกเว้นเพิ่มจากการลงทุนอนุรักษ์พลังงาน (50%)"
                      current={`${formatNumber(
                        currentResult
                          .energyEfficientInvestmentExemption
                      )} บาท`}
                      planned={`${formatNumber(
                        plannedResult
                          .energyEfficientInvestmentExemption
                      )} บาท`}
                    />

                    <CompareRow
                      label="เงินได้หลังหักค่าใช้จ่ายและสิทธิอนุรักษ์พลังงาน"
                      current={`${formatNumber(
                        currentResult
                          .incomeAfterEnergyEfficientInvestmentExemption
                      )} บาท`}
                      planned={`${formatNumber(
                        plannedResult
                          .incomeAfterEnergyEfficientInvestmentExemption
                      )} บาท`}
                    />
                  </>
                )}

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

                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 border-b border-slate-100 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:px-7 md:px-8">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600">
                      <span>
                        อัตราภาษีขั้นสูงสุด (Marginal Rate)
                      </span>

                      <span className="text-lg leading-none text-slate-400 transition-transform group-open:rotate-180">
                        ⌄
                      </span>
                    </div>

                    <div className="whitespace-nowrap pr-3 text-right text-sm font-semibold tabular-nums text-slate-800 sm:text-base">
                      {formatPercent(
                        currentResult.marginalTaxRate
                      )}
                    </div>

                    <div className="whitespace-nowrap pr-3 text-right text-sm font-semibold tabular-nums text-blue-700 sm:text-base">
                      {formatPercent(
                        plannedResult.marginalTaxRate
                      )}
                    </div>
                  </summary>

                  <CompareRow
                    label="อัตราภาษีที่แท้จริง"
                    current={formatPercent(
                      currentResult.effectiveTaxRate
                    )}
                    planned={formatPercent(
                      plannedResult.effectiveTaxRate
                    )}
                  />
                </details>

                <CompareRow
                  label="ภาษีก่อนหักเครดิตภาษี"
                  current={`${formatNumber(
                    currentResult.taxBeforeCredits
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxBeforeCredits
                  )} บาท`}
                />

                <CompareRow
                  label="เครดิตภาษีหัก ณ ที่จ่าย"
                  current={`${formatNumber(
                    currentResult.taxCredits.withholdingTax
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxCredits.withholdingTax
                  )} บาท`}
                />

                <CompareRow
                  label="เครดิตภาษีเงินปันผล"
                  current={`${formatNumber(
                    currentResult.taxCredits.dividendTaxCredit
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxCredits.dividendTaxCredit
                  )} บาท`}
                />

                {(
                  currentForeignTaxCredit > 0 ||
                  plannedForeignTaxCredit > 0
                ) && (
                  <CompareRow
                    label="เครดิตภาษีเงินได้ต่างประเทศ"
                    current={`${formatNumber(
                      currentForeignTaxCredit
                    )} บาท`}
                    planned={`${formatNumber(
                      plannedForeignTaxCredit
                    )} บาท`}
                  />
                )}

                <CompareRow
                  label="เครดิตภาษีรวม"
                  current={`${formatNumber(
                    currentResult.taxCredits.total
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxCredits.total
                  )} บาท`}
                />

                <CompareRow
                  label="ภาษีที่ต้องชำระหลังเครดิต"
                  current={`${formatNumber(
                    currentResult.taxPayable
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxPayable
                  )} บาท`}
                  emphasize
                />

                <CompareRow
                  label="ภาษีที่ขอคืนได้"
                  current={`${formatNumber(
                    currentResult.taxRefund
                  )} บาท`}
                  planned={`${formatNumber(
                    plannedResult.taxRefund
                  )} บาท`}
                />
                
              </div>
            </div>

            <div className="m-4 rounded-3xl bg-blue-500 p-5 text-white sm:m-6 sm:p-7 md:m-8">
              <div className="text-sm text-white/80">
                จากแผนที่คุณเลือก
              </div>

              <div className="mt-2 text-2xl font-semibold sm:text-3xl">
                ประหยัดภาษีสุทธิได้{" "}
                {formatNumber(
                  additionalTaxSaving
                )}{" "}
                บาท
              </div>

              <div className="mt-3 text-sm leading-6 text-white/80">
                ภาษีก่อนเครดิตลดลง{" "}
                {formatNumber(
                  taxBeforeCreditsReduction
                )}{" "}
                บาท จาก{" "}
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
          </>
        )}
      </section>

      <div className="mt-6 flex justify-start">
        <Link
          href="/planning/planner"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← กลับไปวางแผน
        </Link>
      </div>
    </main>
  );
}