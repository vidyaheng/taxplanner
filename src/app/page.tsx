import Link from "next/link";

import { EVENT_CONFIG } from "@/config/event";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">
              Tax Planner
            </div>

            <div className="text-sm text-slate-500">
              Thailand Personal Income Tax
            </div>
          </div>

          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            ปีภาษี 2569
          </div>
        </header>

        <section className="flex flex-1 items-center py-12">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                สำหรับผู้เข้าร่วมสัมมนา
              </div>

              <div className="mb-5 text-sm font-medium text-slate-500">
                {EVENT_CONFIG.company}
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                ดูภาษีของคุณ
                <br />
                ก่อนตัดสินใจลดหย่อน
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                คำนวณภาษี ตรวจสอบสิทธิลดหย่อนที่ยังเหลือ
                และทดลองแผนประกัน การลงทุน
                และการออมเพื่อเกษียณ ก่อนตัดสินใจจริง
              </p>

              <div className="mt-8">
                {EVENT_CONFIG.active ? (
                  <Link
                    href="/planning/income"
                    className="inline-flex min-h-14 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white transition hover:bg-blue-700"
                  >
                    เริ่มวางแผนภาษี
                  </Link>
                ) : (
                  <div className="inline-flex min-h-14 items-center justify-center rounded-xl bg-slate-200 px-8 text-base font-semibold text-slate-500">
                    สิทธิ์ทดลองใช้งานสิ้นสุดแล้ว
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-slate-400">
                {EVENT_CONFIG.active
                  ? `เปิดให้ทดลองใช้งานถึงวันที่ ${EVENT_CONFIG.expires}`
                  : "ขอบคุณที่เข้าร่วมกิจกรรม"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Tax Planning
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm text-slate-500">
                  สำหรับผู้เข้าร่วมสัมมนา
                </div>

                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {EVENT_CONFIG.company}
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    1
                  </div>

                  <div>
                    <div className="font-medium text-slate-800">
                      กรอกข้อมูลของคุณ
                    </div>

                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      รายได้ ครอบครัว และสิทธิลดหย่อนที่มีอยู่
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    2
                  </div>

                  <div>
                    <div className="font-medium text-slate-800">
                      ทดลองวางแผน
                    </div>

                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      เปรียบเทียบทางเลือกในการใช้สิทธิลดหย่อนเพิ่มเติม
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    3
                  </div>

                  <div>
                    <div className="font-medium text-slate-800">
                      ดูผลก่อนและหลังวางแผน
                    </div>

                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      ดูผลกระทบต่อเงินได้สุทธิและภาษีโดยประมาณ
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">
                เครื่องมือนี้จัดทำเพื่อช่วยประมาณการและวางแผนภาษี
                ผลลัพธ์ไม่ใช่การยื่นแบบภาษีหรือคำวินิจฉัยทางภาษี
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}