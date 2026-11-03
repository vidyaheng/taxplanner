"use client";

import { useTaxPlanner } from "@/store/TaxPlannerContext";

export default function ResetPlannerButton() {
  const { resetPlanner, isHydrated } = useTaxPlanner();

  function handleReset() {
    const confirmed = window.confirm(
      "เริ่มคำนวณใหม่หรือไม่?\n\n" +
        "ข้อมูลรายได้ ครอบครัว ค่าลดหย่อน และแผนภาษีที่บันทึกไว้ในเบราว์เซอร์นี้จะถูกล้างทั้งหมด และไม่สามารถกู้คืนได้"
    );

    if (!confirmed) return;

    if (!resetPlanner()) {
      window.alert(
        "ไม่สามารถล้างข้อมูลที่บันทึกไว้ได้ กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์แล้วลองอีกครั้ง ข้อมูลเดิมยังอยู่"
      );
      return;
    }

    // Remount all page-local form state after the persisted reset.
    window.location.replace("/planning/income");
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={!isHydrated}
      className="tp-button tp-button-reset"
    >
      เริ่มคำนวณใหม่
    </button>
  );
}
