import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { EVENT_CONFIG } from "@/config/event";

export default function PlanningLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!EVENT_CONFIG.active) {
    redirect("/");
  }

  return children;
}