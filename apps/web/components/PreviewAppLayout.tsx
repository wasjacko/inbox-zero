import { Inter } from "next/font/google";
import { PreviewOnboardingGate } from "@/components/PreviewOnboardingGate";
import { PreviewDataGate } from "@/components/PreviewDataGate";
import { PreviewDataPreloader } from "@/components/PreviewDataPreloader";
import { SideNavWithTopNav } from "@/components/SideNavWithTopNav";
import { EmailAccountProvider } from "@/providers/EmailAccountProvider";
import { StatLoaderProvider } from "@/providers/StatLoaderProvider";
import { SWRProvider } from "@/providers/SWRProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  preload: true,
  display: "swap",
});

export function PreviewAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmailAccountProvider>
      <SWRProvider>
        <StatLoaderProvider>
          <PreviewDataPreloader />
          <PreviewOnboardingGate>
            <div className={`${inter.variable} min-h-svh font-inter`}>
              <SideNavWithTopNav defaultOpen previewMode>
                <PreviewDataGate>{children}</PreviewDataGate>
              </SideNavWithTopNav>
            </div>
          </PreviewOnboardingGate>
        </StatLoaderProvider>
      </SWRProvider>
    </EmailAccountProvider>
  );
}
