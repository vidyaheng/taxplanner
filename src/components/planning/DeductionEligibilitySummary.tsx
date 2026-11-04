/**
 * UX-C2.2 — presentation only.
 * Receive Tax Engine output directly; do not derive any financial ceiling here.
 */
interface EligibilityUsage {
  allowed: number;
  excess: number;
}

export function DeductionEligibilitySummary({ usage }: { usage: EligibilityUsage }) {
  const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);

  return (
    <div data-c2-information-row aria-live="polite" aria-atomic="true"
      className="mt-3 min-w-0 border-t border-slate-100 pt-3">
      <div className={usage.excess > 0 ? "grid min-w-0 grid-cols-2 gap-3" : "grid min-w-0 grid-cols-1 gap-3"}>
        <div className="min-w-0 px-1 py-1">
          <p className="text-xs leading-5 text-slate-500">ใช้ลดหย่อนได้</p>
          <p className="mt-1 min-w-0 break-words text-base font-semibold tabular-nums text-teal-800 sm:text-lg">
            {money(usage.allowed)} <span className="text-xs font-normal text-slate-500">บาท</span>
          </p>
        </div>
        {usage.excess > 0 && (
          <div role="status" className="min-w-0 rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-xs leading-5 text-amber-800">เกินสิทธิ</p>
            <p className="mt-1 min-w-0 break-words text-base font-semibold tabular-nums text-amber-800 sm:text-lg">
              {money(usage.excess)} <span className="text-xs font-normal">บาท</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
