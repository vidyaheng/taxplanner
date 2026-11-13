import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";

import { EVENT_CONFIG } from "@/config/event";
import { getPresentationBranding } from "@/config/presentation";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ presentation?: string | string[] }>;
}) {
  const params = await searchParams;
  const presentation = getPresentationBranding(params.presentation);

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden bg-white text-[#162b3a]"
      style={{
        fontFamily: `${manrope.style.fontFamily}, var(--font-thai), sans-serif`,
        backgroundImage:
          "radial-gradient(ellipse 52% 42% at 88% 52%, #ebf8f7 0%, transparent 74%)",
      }}
    >
      <header className="mx-auto flex h-[88px] w-full max-w-[1176px] items-center px-7 max-sm:h-[76px] max-sm:px-[19px]">
        <Link
          href="/"
          aria-label="TaxPlanner หน้าแรก"
          className="text-[24px] font-extrabold tracking-[-0.9px] text-[#162b3a] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d8b8f]"
        >
          Tax<span className="text-[#0d8b8f]">Planner</span>
        </Link>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-164px)] w-full max-w-[1176px] flex-1 items-center px-7 pb-[88px] pt-6 max-sm:min-h-[calc(100svh-146px)] max-sm:px-[19px] max-sm:pb-16 max-sm:pt-2">
        <div className="max-w-[760px]">
          {presentation ? (
            <div className="mb-8 max-w-xl">
              <div className="mb-3 flex flex-wrap items-center gap-4">
                <Image
                  src="https://www.depa.or.th/storage/app/media/LogoDEPA-01.png"
                  alt="ตราสัญลักษณ์ depa"
                  width={104}
                  height={104}
                  priority
                  unoptimized
                  className="h-20 w-20 object-contain"
                />
                <p className="max-w-[370px] text-sm font-semibold leading-7 text-[#162b3a]">
                  {presentation.organization}
                </p>
              </div>
              <p className="text-sm leading-6 text-[#667887]">{presentation.notice}</p>
            </div>
          ) : null}

          <p className="mb-[18px] text-xs font-bold uppercase tracking-[1.3px] text-[#0d8b8f]">
            Personal Tax Planning
          </p>

          <h1 className="mb-[22px] text-[clamp(52px,7.4vw,92px)] font-extrabold leading-[1.12] tracking-[-2.5px] max-sm:text-[clamp(48px,12vw,64px)]">
            ลดภาษี
            <br />
            <span className="text-[#0d8b8f]">ง่ายกว่าที่คิด</span>
          </h1>

          <p className="mb-[34px] max-w-[560px] text-[clamp(17px,1.95vw,20px)] leading-[1.8] text-[#667887] max-sm:text-base">
            คำนวณภาษี เช็กสิทธิ และลองวางแผนก่อนตัดสินใจ
          </p>

          {EVENT_CONFIG.active ? (
            <Link
              href="/planning/income"
              className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[14px] border border-[#0d8b8f] bg-[#0d8b8f] px-[26px] py-4 text-base font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#09777b] hover:shadow-[0_14px_32px_rgba(13,139,143,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d8b8f] motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              เริ่มวางแผน <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <div className="inline-flex min-h-[56px] items-center rounded-[14px] bg-slate-100 px-[26px] py-4 text-base font-semibold text-slate-500">
              สิทธิ์ทดลองใช้งานสิ้นสุดแล้ว
            </div>
          )}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1176px] border-t border-[#e7edef] px-7 py-[22px] text-xs text-[#8a98a3] max-sm:px-[19px]">
        ผลคำนวณเป็นการประมาณการเพื่อการวางแผน
      </footer>
    </main>
  );
}
