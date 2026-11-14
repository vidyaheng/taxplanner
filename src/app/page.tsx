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
          "radial-gradient(ellipse 65% 55% at 102% 44%, rgba(214,244,243,0.38) 0%, rgba(238,250,250,0.17) 51%, transparent 83%)",
      }}
    >

      {/* A2: widely spaced geometric rhythm, not a spreadsheet or blueprint. */}
      <svg
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[64%] lg:block"
        viewBox="0 0 940 780"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="a2-grid-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A9D6D4" stopOpacity="0" />
            <stop offset="52%" stopColor="#A9D6D4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#A6D6D3" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <g stroke="url(#a2-grid-fade)" strokeWidth="1">
          <path d="M160 260L930 260M160 390L930 390M160 520L930 520" />
          <path d="M360 90L360 710M510 90L510 710M660 90L660 710M810 90L810 710" />
          <path d="M330 560L730 160M430 680L920 190" opacity="0.45" />
        </g>
        <g fill="#B0DBD7" opacity="0.42">
          <circle cx="660" cy="390" r="2.5" />
          <circle cx="810" cy="260" r="2.5" />
          <circle cx="510" cy="520" r="2.5" />
        </g>
      </svg>

      <header className="relative z-10 mx-auto flex h-[88px] w-full max-w-[1176px] items-center px-7 max-sm:h-[76px] max-sm:px-[19px]">
        <Link
          href="/"
          aria-label="TaxPlanner หน้าแรก"
          className="text-[24px] font-extrabold tracking-[-0.9px] text-[#162b3a] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d8b8f]"
        >
          Tax<span className="text-[#0d8b8f]">Planner</span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-164px)] w-full max-w-[1176px] flex-1 items-center px-7 pb-[88px] pt-6 max-sm:min-h-[calc(100svh-146px)] max-sm:px-[19px] max-sm:pb-16 max-sm:pt-2">
        <div className="min-w-0 max-w-[760px]">
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

          <ul className="mb-[34px] flex flex-wrap items-center gap-x-7 gap-y-3 text-[clamp(16px,1.65vw,18px)] font-medium leading-relaxed text-[#536977]" aria-label="สิ่งที่คุณทำได้">
            <li className="whitespace-nowrap">คำนวณภาษี</li>
            <li className="whitespace-nowrap">เช็กสิทธิ</li>
            <li className="whitespace-nowrap">วางแผน</li>
          </ul>

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

      <footer className="relative z-10 mx-auto w-full max-w-[1176px] border-t border-[#e7edef] px-7 py-[22px] text-xs text-[#8a98a3] max-sm:px-[19px]">
        ผลคำนวณเป็นการประมาณการเพื่อการวางแผน
      </footer>
    </main>
  );
}
