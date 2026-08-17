"use client";

import { ReactNode } from "react";
import { TaxPlannerProvider } from "@/store/TaxPlannerContext";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TaxPlannerProvider>
      {children}
    </TaxPlannerProvider>
  );
}