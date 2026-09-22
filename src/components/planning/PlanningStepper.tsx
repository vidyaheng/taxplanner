"use client";

import Link from "next/link";

type PlanningStep =
  | 1
  | 2
  | 3
  | 4
  | 5;

interface PlanningStepperProps {
  currentStep: PlanningStep;
}

const steps: {
  step: PlanningStep;
  label: string;
  shortLabel: string;
  href: string;
}[] = [
  {
    step: 1,
    label: "รายได้",
    shortLabel: "รายได้",
    href: "/planning/income",
  },
  {
    step: 2,
    label: "ครอบครัว",
    shortLabel: "ครอบครัว",
    href: "/planning/family",
  },
  {
    step: 3,
    label: "ค่าลดหย่อน",
    shortLabel: "ลดหย่อน",
    href: "/planning/deductions",
  },
  {
    step: 4,
    label: "วางแผน",
    shortLabel: "วางแผน",
    href: "/planning/planner",
  },
  {
    step: 5,
    label: "ผลสรุป",
    shortLabel: "ผลสรุป",
    href: "/planning/results",
  },
];

export default function PlanningStepper({
  currentStep,
}: PlanningStepperProps) {
  return (
    <nav
      aria-label="ขั้นตอนการวางแผนภาษี"
      className="w-full"
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[620px] items-center">

          {steps.map(
            (item, index) => {
              const isCurrent =
                item.step ===
                currentStep;

              return (
                <div
                  key={item.step}
                  className="flex min-w-0 flex-1 items-center"
                >
                  <Link
                    href={item.href}
                    aria-current={
                      isCurrent
                        ? "step"
                        : undefined
                    }
                    className="group flex min-w-0 flex-col items-center gap-2"
                  >
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                        isCurrent
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 group-hover:border-blue-300 group-hover:text-blue-700",
                      ].join(" ")}
                    >
                      {item.step}
                    </span>

                    <span
                      className={[
                        "whitespace-nowrap text-xs font-medium transition sm:text-sm",
                        isCurrent
                          ? "text-blue-700"
                          : "text-slate-500 group-hover:text-blue-700",
                      ].join(
                        " "
                      )}
                    >
                      <span className="sm:hidden">
                        {
                          item.shortLabel
                        }
                      </span>

                      <span className="hidden sm:inline">
                        {item.label}
                      </span>
                    </span>
                  </Link>

                  {index <
                    steps.length -
                      1 && (
                    <div className="mx-2 h-px flex-1 bg-slate-200" />
                  )}
                </div>
              );
            }
          )}

        </div>
      </div>
    </nav>
  );
}