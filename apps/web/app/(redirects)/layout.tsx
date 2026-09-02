import { PreviewAppLayout } from "@/components/PreviewAppLayout";

export default function RedirectsPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PreviewAppLayout>{children}</PreviewAppLayout>;
}
