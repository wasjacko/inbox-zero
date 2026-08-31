import { Inter } from "next/font/google";
import { MailThemeScope } from "@/app/(app)/[emailAccountId]/mail/MailThemeScope";
import { PreviewOnboardingGate } from "@/components/PreviewOnboardingGate";
import { SideNavWithTopNav } from "@/components/SideNavWithTopNav";
import { MAIL_SHORTCUT_SCOPES } from "@/lib/shortcuts/registry";
import { ShortcutsProvider } from "@/lib/shortcuts/ShortcutsProvider";
import { EmailAccountPreviewProvider } from "@/providers/EmailAccountProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  preload: true,
  display: "swap",
});

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmailAccountPreviewProvider>
      <ShortcutsProvider scopes={MAIL_SHORTCUT_SCOPES}>
        <MailThemeScope />
        <PreviewOnboardingGate>
          <div className={`${inter.variable} h-svh font-inter`}>
            <SideNavWithTopNav defaultOpen previewMode>
              {children}
            </SideNavWithTopNav>
          </div>
        </PreviewOnboardingGate>
      </ShortcutsProvider>
    </EmailAccountPreviewProvider>
  );
}
