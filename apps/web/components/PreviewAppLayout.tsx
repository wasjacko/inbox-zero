import { Inter } from "next/font/google";
import { PreviewOnboardingGate } from "@/components/PreviewOnboardingGate";
import { SideNavWithTopNav } from "@/components/SideNavWithTopNav";
import { EmailAccountPreviewProvider } from "@/providers/EmailAccountProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  preload: true,
  display: "swap",
});

export function PreviewAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmailAccountPreviewProvider>
      <PreviewOnboardingGate>
        <div className={`${inter.variable} min-h-svh font-inter`}>
          <SideNavWithTopNav defaultOpen previewMode>
            {children}
          </SideNavWithTopNav>
        </div>
      </PreviewOnboardingGate>
    </EmailAccountPreviewProvider>
  );
}
