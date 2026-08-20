"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export default function TeamAccessPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/team-access",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "ไม่สามารถเข้าใช้งานได้"
        );
        return;
      }

      router.push("/planning/income");
      router.refresh();
    } catch {
      setError(
        "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-sm font-medium text-blue-700">
          Tax Planner
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          สำหรับทีมงาน
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          กรอกรหัสสำหรับทีมงานเพื่อเข้าใช้งาน
          Tax Planner
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-7"
        >
          <label
            htmlFor="team-code"
            className="text-sm font-medium text-slate-700"
          >
            รหัสทีมงาน
          </label>

          <input
            id="team-code"
            type="password"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            autoComplete="current-password"
            placeholder="กรอกรหัส"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              code.trim().length === 0
            }
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "กำลังตรวจสอบ..."
              : "เข้าใช้งาน"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400">
          สำหรับทีมงานที่ได้รับสิทธิ์เท่านั้น
        </div>
      </div>
    </main>
  );
}