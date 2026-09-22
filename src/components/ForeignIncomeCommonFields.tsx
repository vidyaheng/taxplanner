"use client";

import type {
  ForeignIncomeSourceData,
} from "@/types/income";

interface ForeignIncomeTaxabilitySummary {
  isComplete: boolean;
  isTaxable: boolean;
  taxableRemittance: number;
}

interface ForeignIncomeCommonFieldsProps {
  amount: number;

  foreignSource:
    ForeignIncomeSourceData;

  filingTaxYear: number;

  taxability?:
    ForeignIncomeTaxabilitySummary | null;

  onAmountChange: (
    value: number
  ) => void;

  onForeignSourceChange: (
    values:
      Partial<ForeignIncomeSourceData>
  ) => void;
}

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

function MoneyField({
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
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-lg text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          บาท
        </span>
      </div>
    </div>
  );
}

export default function ForeignIncomeCommonFields({
  amount,
  foreignSource,
  filingTaxYear,
  taxability,
  onAmountChange,
  onForeignSourceChange,
}: ForeignIncomeCommonFieldsProps) {
  return (
    <>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            ประเทศที่มาของรายได้
          </label>

          <input
            type="text"
            value={
              foreignSource.country
            }
            onChange={(e) =>
              onForeignSourceChange({
                country:
                  e.target.value,
              })
            }
            placeholder="เช่น United States"
            className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <MoneyField
          label="รายได้จากต่างประเทศทั้งก้อน"
          description="กรอกจำนวนเงินได้ทั้งหมดของรายการนี้"
          value={amount}
          onChange={
            onAmountChange
          }
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            ปีที่เกิดเงินได้
          </label>

          <input
            type="number"
            inputMode="numeric"
            value={
              foreignSource
                .incomeTaxYear ||
              ""
            }
            onChange={(e) =>
              onForeignSourceChange({
                incomeTaxYear:
                  Number(
                    e.target.value
                  ) || 0,
              })
            }
            placeholder="เช่น 2568"
            className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />

          <p className="mt-2 text-sm leading-5 text-slate-400">
            ระบุปีภาษีไทย เช่น 2568
          </p>
        </div>

        <MoneyField
          label={`ยอดที่นำเข้าไทยในปี ${filingTaxYear}`}
          description="กรอกเฉพาะส่วนของเงินได้รายการนี้ที่นำเข้ามาในประเทศไทยในปีภาษีนี้"
          value={
            foreignSource
              .remittedToThailandThisTaxYear
          }
          onChange={(value) =>
            onForeignSourceChange({
              remittedToThailandThisTaxYear:
                value,
            })
          }
        />
      </div>

      <div className="mt-5">
        <MoneyField
          label="ภาษีที่จ่ายในต่างประเทศ"
          description="กรอกภาษีต่างประเทศที่จ่ายสำหรับเงินได้รายการนี้ทั้งก้อน"
          value={
            foreignSource
              .foreignIncomeTaxPaid
          }
          onChange={(value) =>
            onForeignSourceChange({
              foreignIncomeTaxPaid:
                value,
            })
          }
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-medium text-slate-700">
          ในปีที่เกิดเงินได้นี้
          คุณเป็นผู้มีถิ่นที่อยู่ทางภาษีในประเทศไทยหรือไม่?
        </div>

        <p className="mt-1 text-sm leading-5 text-slate-400">
          ข้อมูลนี้ใช้พิจารณาการนำเงินได้จากต่างประเทศ
          เข้ามาคำนวณภาษีไทย
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                isThaiTaxResidentInIncomeYear:
                  null,
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              foreignSource
                .isThaiTaxResidentInIncomeYear ==
              null
                ? "border-slate-500 bg-slate-100 text-slate-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            ยังไม่เลือก
          </button>

          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                isThaiTaxResidentInIncomeYear:
                  true,
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              foreignSource
                .isThaiTaxResidentInIncomeYear ===
              true
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            ใช่
          </button>

          <button
            type="button"
            onClick={() =>
              onForeignSourceChange({
                isThaiTaxResidentInIncomeYear:
                  false,
              })
            }
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              foreignSource
                .isThaiTaxResidentInIncomeYear ===
              false
                ? "border-violet-500 bg-violet-50 text-violet-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            ไม่ใช่
          </button>
        </div>
      </div>

      {taxability && (
        <>
            <div className="mt-5 space-y-3">
            {foreignSource
                .remittedToThailandThisTaxYear >
                amount && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                ยอดที่นำเข้าไทยมากกว่ารายได้ต่างประเทศทั้งก้อน
                กรุณาตรวจสอบจำนวนเงินอีกครั้ง
                </div>
            )}

            {foreignSource
                .incomeTaxYear >
                filingTaxYear && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                ปีที่เกิดเงินได้อยู่หลังปีภาษีที่กำลังคำนวณ
                กรุณาตรวจสอบปีที่เกิดเงินได้
                </div>
            )}

            {foreignSource
                .incomeTaxYear >= 2567 &&
                foreignSource
                .remittedToThailandThisTaxYear >
                0 &&
                foreignSource
                .isThaiTaxResidentInIncomeYear ==
                null && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    กรุณาระบุสถานะผู้มีถิ่นที่อยู่ทางภาษี
                    ในปีที่เกิดเงินได้
                    เพื่อให้ระบบพิจารณาเงินได้ต่างประเทศได้ครบถ้วน
                </div>
                )}
            </div>

            <div className="mt-5">
            {!taxability.isComplete && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                <div className="font-medium">
                    ข้อมูลสำหรับพิจารณาภาษียังไม่ครบ
                </div>

                <div className="mt-1">
                    ระบบยังไม่สามารถสรุปได้ว่า
                    เงินได้รายการนี้ต้องนำมาคำนวณภาษีไทยเท่าใด
                </div>
                </div>
            )}

            {taxability.isComplete &&
                taxability.isTaxable &&
                taxability.taxableRemittance >
                0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                    <div className="font-medium">
                    มีเงินได้ที่นำมาคำนวณภาษีไทย
                    </div>

                    <div className="mt-1">
                    ยอดที่ระบบนำไปคำนวณในปีภาษีนี้{" "}
                    <strong>
                        {formatNumber(
                        taxability.taxableRemittance
                        )}{" "}
                        บาท
                    </strong>
                    </div>
                </div>
                )}

            {taxability.isComplete &&
                (!taxability.isTaxable ||
                taxability.taxableRemittance <=
                    0) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    <div className="font-medium">
                    ไม่มียอดจากรายการนี้
                    ที่นำมาคำนวณภาษีไทยในปีนี้
                    </div>

                    <div className="mt-1 text-slate-500">
                    ตามข้อมูลปีที่เกิดเงินได้
                    การนำเงินเข้าไทย
                    และสถานะผู้มีถิ่นที่อยู่ทางภาษีที่กรอกไว้
                    </div>
                </div>
                )}
            </div>
        </>
        )}
    </>
  );
}