import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Histórico" };

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return children;
}
