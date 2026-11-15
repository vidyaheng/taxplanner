import Image from "next/image";
import Link from "next/link";

import { EVENT_CONFIG } from "@/config/event";
import "./landing-v84.css";

type SymbolKind = "income" | "deductions" | "overview" | "calculator" | "rights" | "plan";

function SymbolIcon({ kind }: { kind: SymbolKind }) {
  const shared = {
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    focusable: false as const,
  };
  if (kind === "income") {
    return <svg {...shared}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 10V6a2 2 0 0 1 2-2h13M15 14h6" /></svg>;
  }
  if (kind === "deductions") {
    return <svg {...shared}><path d="M7 2h8l4 4v16H7zM15 2v5h4M10 12h6M10 16h6" /></svg>;
  }
  if (kind === "overview") {
    return <svg {...shared}><path d="M3 21v-5h4v5M10 21V10h4v11M17 21V4h4v17" /></svg>;
  }
  if (kind === "calculator") {
    return <svg {...shared}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2" /></svg>;
  }
  if (kind === "rights") {
    return <svg {...shared}><path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6zM8 12l3 3 5-6" /></svg>;
  }
  return <svg {...shared}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 12 21 3" /></svg>;
}

const journey = [
  { label: "รายได้", icon: "income" },
  { label: "ค่าลดหย่อน", icon: "deductions" },
  { label: "ภาพรวมภาษี", icon: "overview" },
] as const;

const features = [
  { label: "คำนวณภาษี", description: "ประมาณการภาษีจากข้อมูลของคุณ", icon: "calculator" },
  { label: "ตรวจสอบสิทธิ", description: "สำรวจรายการลดหย่อนที่เกี่ยวข้อง", icon: "rights" },
  { label: "วางแผนภาษี", description: "ทดลองทางเลือกและเปรียบเทียบผล", icon: "plan" },
] as const;

/**
 * Public generic V8.4 landing. Presentation/company query parameters are
 * intentionally ignored here: no modification to team access or event gating.
 */
export default function Home() {
  return (
    <main className="tp-v84" id="top">
      <header className="tp-v84__header">
        <Link href="/" className="tp-v84__brand" aria-label="TaxPlanner หน้าแรก">
          <span className="tp-v84__mark" aria-hidden="true" />
          <span>TaxPlanner</span>
        </Link>
        <a href="#features" className="tp-v84__nav">เกี่ยวกับเครื่องมือ</a>
      </header>

      <section className="tp-v84__hero" aria-labelledby="tp-v84-heading">
        <div className="tp-v84__hero-inner">
          <div className="tp-v84__copy">
            <p className="tp-v84__eyebrow">PERSONAL TAX PLANNING</p>
            <h1 className="tp-v84__headline" id="tp-v84-heading">
              ลดภาษี<span>ง่ายกว่าที่คิด</span>
            </h1>
            <p className="tp-v84__subtitle">คำนวณภาษี · เช็กสิทธิ · วางแผน</p>
            {EVENT_CONFIG.active ? (
              <Link href="/planning/income" className="tp-v84__cta">
                เริ่มวางแผน <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <div className="tp-v84__cta-disabled" role="status">
                สิทธิ์ทดลองใช้งานสิ้นสุดแล้ว
              </div>
            )}

            <div className="tp-v84__mobile-visual" aria-label="ขั้นตอนการวางแผนภาษี">
              <Image
                className="tp-v84__mobile-character"
                src="/taxplanner/v84-friendly-character.png"
                alt=""
                width={760}
                height={570}
                quality={75}
                sizes="(max-width: 360px) 144px, 168px"
              />
              <div className="tp-v84__journey">
                {journey.map((step) => (
                  <div className="tp-v84__journey-item" key={step.label}>
                    <span className="tp-v84__journey-icon"><SymbolIcon kind={step.icon} /></span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tp-v84__desktop-art" aria-hidden="true">
            <div className="tp-v84__board">
              <h2>แผนภาษีของคุณ</h2>
              {journey.map((step) => (
                <div className="tp-v84__board-row" key={step.label}>
                  <span className="tp-v84__empty-check" />
                  <SymbolIcon kind={step.icon} />
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <Image
              className="tp-v84__desktop-character"
              src="/taxplanner/v84-friendly-character.png"
              alt=""
              width={760}
              height={570}
              quality={75}
              sizes="(min-width: 1101px) 32vw, 37vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="tp-v84__features" id="features" aria-labelledby="tp-v84-features-title">
        <h2 id="tp-v84-features-title">สิ่งที่ TaxPlanner ช่วยคุณได้</h2>
        <div className="tp-v84__feature-grid">
          {features.map((feature) => (
            <div className="tp-v84__feature" key={feature.label}>
              <span className="tp-v84__feature-symbol"><SymbolIcon kind={feature.icon} /></span>
              <div>
                <h3>{feature.label}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="tp-v84__footer">
        ผลคำนวณเป็นการประมาณการเพื่อการวางแผน
      </footer>
    </main>
  );
}
