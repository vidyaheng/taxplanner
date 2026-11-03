"use client";

import Link from "next/link";
import ResetPlannerButton from "./ResetPlannerButton";

type PlanningStep = 1 | 2 | 3 | 4 | 5;
interface PlanningStepperProps { currentStep: PlanningStep }
const steps: { step: PlanningStep; label: string; shortLabel: string; href: string }[] = [
  { step: 1, label: "รายได้", shortLabel: "รายได้", href: "/planning/income" },
  { step: 2, label: "ครอบครัว", shortLabel: "ครอบครัว", href: "/planning/family" },
  { step: 3, label: "ค่าลดหย่อน", shortLabel: "ลดหย่อน", href: "/planning/deductions" },
  { step: 4, label: "วางแผน", shortLabel: "วางแผน", href: "/planning/planner" },
  { step: 5, label: "ผลสรุป", shortLabel: "ผลสรุป", href: "/planning/results" },
];

export default function PlanningStepper({ currentStep }: PlanningStepperProps) {
  return (
    <div className="tp-planning-shell">
      <div className="tp-shell-heading">
        <div>
          <p className="tp-shell-eyebrow">แผนภาษีของคุณ</p>
          <p className="tp-shell-progress">ขั้นตอน {currentStep} จาก 5 <span aria-hidden="true">·</span> {steps[currentStep - 1].label}</p>
        </div>
        <ResetPlannerButton />
      </div>
      <nav aria-label="ขั้นตอนการวางแผนภาษี">
        <ol className="tp-step-list">
          {steps.map((item) => {
            const isCurrent = item.step === currentStep;
            // A positional progress marker, not a claim that financial data is complete.
            const isPrevious = item.step < currentStep;
            return (
              <li key={item.step} className="tp-step-item" data-state={isCurrent ? "current" : isPrevious ? "previous" : "upcoming"}>
                <Link href={item.href} aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${item.step}. ${item.label}${isCurrent ? " — ขั้นตอนปัจจุบัน" : isPrevious ? " — ขั้นตอนก่อนหน้า" : ""}`}
                  className="tp-step-link">
                  <span className="tp-step-number" aria-hidden="true">
                    {isPrevious ? <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : item.step}
                  </span>
                  <span className="tp-step-label"><span className="sm:hidden">{item.shortLabel}</span><span className="hidden sm:inline">{item.label}</span></span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
