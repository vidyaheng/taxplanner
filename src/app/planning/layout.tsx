import { createHash } from "crypto";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EVENT_CONFIG } from "@/config/event";

const COOKIE_NAME =
  "tax_planner_team_access";

function getTeamAccessCodes() {
  return (process.env.TEAM_ACCESS_CODES ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

function createTeamToken(
  accessCode: string
) {
  return createHash("sha256")
    .update(
      `tax-planner-team:${accessCode}`
    )
    .digest("hex");
}

export default async function PlanningLayout({
  children,
}: {
  children: ReactNode;
}) {
  // ช่วงที่กิจกรรมยังเปิดอยู่
  // ผู้เข้าร่วมสัมมนาเข้าได้ตามปกติ
  if (EVENT_CONFIG.active) {
    return children;
  }

  // ถ้ากิจกรรมปิดแล้ว
  // ตรวจว่านี่คือทีมงานที่เคยกรอกรหัสถูกต้องหรือไม่
  const teamAccessCodes =
    getTeamAccessCodes();

  const cookieStore = await cookies();

  const teamCookie =
    cookieStore.get(
      COOKIE_NAME
    )?.value;

  const validTeamTokens =
    teamAccessCodes.map(
      createTeamToken
    );

  const hasTeamAccess =
    Boolean(teamCookie) &&
    validTeamTokens.includes(
      teamCookie!
    );

  // ไม่ใช่ทีมงาน → กลับหน้าแรก
  if (!hasTeamAccess) {
    redirect("/");
  }

  // ทีมงาน → เข้า Planner ได้
  return children;
}