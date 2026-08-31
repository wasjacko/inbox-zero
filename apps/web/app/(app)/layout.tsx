import "../../styles/globals.css";
import type { Metadata } from "next";
import { PreviewAppLayout } from "@/components/PreviewAppLayout";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PreviewAppLayout>{children}</PreviewAppLayout>;
}
