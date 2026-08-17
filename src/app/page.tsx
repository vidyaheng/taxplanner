import Link from "next/link";

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

        <section className="flex flex-1 items-center">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                วางแผนภาษีง่ายขึ้น
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                ดูภาษีของคุณ
                <br />
                ก่อนตัดสินใจลดหย่อน
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                คำนวณภาษี ตรวจสอบสิทธิลดหย่อนที่ยังเหลือ
                และทดลองแผนประกัน การลงทุน และการออมเพื่อเกษียณ
                ก่อนตัดสินใจจริง
              </p>

              <div className="mt-8">
                <Link
                  href="/planning/income"
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  เริ่มวางแผนภาษี
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                ข้อมูลในขั้นแรกจะถูกใช้เพื่อประมาณการภาษีและสิทธิลดหย่อน
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Tax Planning
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-sm text-slate-500">
                    ภาษีประมาณการ
                  </div>
                  <div className="mt-1 text-3xl font-bold text-slate-900">
                    —
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">
                      ประกันชีวิต / สุขภาพ
                    </span>
                    <span className="text-slate-400">รอข้อมูล</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-0 rounded-full bg-blue-500" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">
                      การออมเพื่อเกษียณ
                    </span>
                    <span className="text-slate-400">รอข้อมูล</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-0 rounded-full bg-blue-500" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">การลงทุนลดหย่อน</span>
                    <span className="text-slate-400">รอข้อมูล</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-0 rounded-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}