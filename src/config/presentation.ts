/** Optional homepage-only presentation identity. Never used for company access. */
export const PRESENTATION_BRANDING = {
  depa: {
    organization: "สำนักงานส่งเสริมเศรษฐกิจดิจิทัล (depa)",
    notice: "ระบบสาธิตเพื่อประกอบการนำเสนอ ไม่ใช่ระบบอย่างเป็นทางการของ depa และไม่ได้แสดงถึงการรับรองจาก depa",
  },
} as const;

export function getPresentationBranding(value: string | string[] | undefined) {
  // Exact, allowlisted query-string selection; unknown/multiple values fall back.
  return value === "depa" ? PRESENTATION_BRANDING.depa : null;
}
