import { createHash } from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "tax_planner_team_access";

function getTeamAccessCodes() {
  return (process.env.TEAM_ACCESS_CODES ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

function createTeamToken(accessCode: string) {
  return createHash("sha256")
    .update(`tax-planner-team:${accessCode}`)
    .digest("hex");
}

export async function POST(request: Request) {
  const teamAccessCodes = getTeamAccessCodes();

  if (teamAccessCodes.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "ยังไม่ได้ตั้งค่ารหัสสำหรับทีมงาน",
      },
      {
        status: 500,
      }
    );
  }

  const body = await request.json();

  const code =
    typeof body.code === "string"
      ? body.code.trim()
      : "";

  if (!teamAccessCodes.includes(code)) {
    return NextResponse.json(
      {
        success: false,
        message: "รหัสไม่ถูกต้อง",
      },
      {
        status: 401,
      }
    );
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: createTeamToken(code),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}