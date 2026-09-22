"use client";

import type {
  ForeignIncomeSourceData,
} from "@/types/income";

interface ForeignIncomeTaxabilitySummary {
  isComplete: boolean;
  isTaxable: boolean;
  taxableRemittance: number;
}

interface ForeignTaxCreditReviewFieldsProps {
  foreignSource:
    ForeignIncomeSourceData;

  taxability?:
    ForeignIncomeTaxabilitySummary | null;

  onForeignSourceChange: (
    values:
      Partial<ForeignIncomeSourceData>
  ) => void;
}

export default function ForeignTaxCreditReviewFields({
  foreignSource,
  taxability,
  onForeignSourceChange,
}: ForeignTaxCreditReviewFieldsProps) {
  const shouldReviewForeignTaxCredit =
    !!taxability &&
    taxability.isComplete &&
    taxability.isTaxable &&
    taxability.taxableRemittance > 0 &&
    foreignSource.foreignIncomeTaxPaid > 0;

  if (!shouldReviewForeignTaxCredit) {
    return null;
  }

  const dtaReview =
    foreignSource.foreignTaxCreditDtaReview;

  return (
    <>
      <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
        <div className="text-sm font-medium text-slate-800">
          การตรวจสิทธิ Foreign Tax Credit (DTA)
        </div>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          ระบุผลหลังตรวจอนุสัญญาภาษีซ้อน
          ของประเทศและประเภทเงินได้รายการนี้แล้ว
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                foreignTaxCreditDtaReview:
                  undefined,
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              !dtaReview
                ? "border-slate-500 bg-white text-slate-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            ยังไม่ได้ตรวจ
          </button>

          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                foreignTaxCreditDtaReview: {
                  isEligible: false,
                },
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              dtaReview?.isEligible ===
              false
                ? "border-rose-500 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            ไม่มีสิทธิ FTC
          </button>

          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                foreignTaxCreditDtaReview: {
                  isEligible: true,
                  creditableForeignTaxPaidForRemittedIncome:
                    dtaReview?.isEligible
                      ? dtaReview
                          .creditableForeignTaxPaidForRemittedIncome ??
                        null
                      : null,
                },
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              dtaReview?.isEligible ===
              true
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            มีสิทธิ FTC
          </button>
        </div>

        {dtaReview?.isEligible ===
          true && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ภาษีต่างประเทศที่ใช้พิจารณา FTC หลังตรวจ DTA
            </label>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={
                dtaReview
                  .creditableForeignTaxPaidForRemittedIncome ??
                ""
              }
              onChange={(e) => {
                const raw =
                  e.target.value;

                onForeignSourceChange({
                  foreignTaxCreditDtaReview: {
                    isEligible: true,
                    creditableForeignTaxPaidForRemittedIncome:
                      raw === ""
                        ? null
                        : Math.max(
                            0,
                            Number(raw) ||
                              0
                          ),
                  },
                });
              }}
              placeholder="0"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            <p className="mt-2 text-sm leading-5 text-slate-400">
              กรอกจำนวนภาษีของยอดที่นำเข้าไทย
              ที่ยังใช้พิจารณาเครดิตได้
              หลังตรวจ DTA แล้ว
            </p>
          </div>
        )}
      </div>

      {dtaReview?.isEligible ===
        true &&
        dtaReview
          .creditableForeignTaxPaidForRemittedIncome ==
          null && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            ระบุว่ามีสิทธิ Foreign Tax Credit แล้ว
            แต่ยังไม่ได้กรอกจำนวนภาษีที่ใช้พิจารณาได้
            หลังตรวจ DTA
          </div>
        )}
    </>
  );
}