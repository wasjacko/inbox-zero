import { Suspense } from "react";
import type { Metadata, Viewport } from "next";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AxiomWebVitals } from "next-axiom";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics as DubAnalytics } from "@dub/analytics/react";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "../styles/globals.css";
import { PostHogPageview, PostHogProvider } from "@/providers/PostHogProvider";
import { env } from "@/env";
import { GlobalProviders } from "@/providers/GlobalProviders";
import { UTM } from "@/app/utm";
import { startupImage } from "@/app/startup-image";
import { Toaster } from "@/components/Toast";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND_NAME } from "@/utils/branding";
import { appViewport } from "@/app/viewport-config";

const aeonikFont = localFont({
  src: "../styles/aeonik-medium.woff",
  variable: "--font-title",
  preload: true,
  display: "swap",
});
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"], // font-normal, font-medium, font-semibold, font-bold
  display: "swap",
});

const title = `${BRAND_NAME} | Votre activité, enfin au clair`;
const description =
  "Freescale rassemble vos échanges, fait ressortir les priorités et vous aide à avancer avec Mue.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: BRAND_NAME,
    type: "website",
    url: env.NEXT_PUBLIC_BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  // issues with robots.txt: https://github.com/vercel/next.js/issues/58615#issuecomment-1852457285
  robots: {
    index: true,
    follow: true,
  },
  // pwa
  applicationName: BRAND_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
    startupImage,
  },
  formatDetection: {
    telephone: false,
  },
  // safe area for iOS PWA
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = appViewport;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head />
      <body
        className={`h-full ${env.NEXT_PUBLIC_USE_AEONIK_FONT ? aeonikFont.variable : ""} ${geist.variable} font-sans antialiased`}
      >
        <PostHogProvider>
          <Suspense>
            <PostHogPageview />
          </Suspense>
          <ThemeProvider attribute="class" defaultTheme="light">
            <GlobalProviders>
              {children}
              <Toaster closeButton richColors theme="light" visibleToasts={9} />
            </GlobalProviders>
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
        <AxiomWebVitals />
        <UTM />
        <SpeedInsights />
        {env.NEXT_PUBLIC_DUB_REFER_DOMAIN && (
          <DubAnalytics
            apiHost="/_proxy/dub"
            scriptProps={{ src: "/_proxy/dub/script.js" }}
            domainsConfig={{ refer: env.NEXT_PUBLIC_DUB_REFER_DOMAIN }}
          />
        )}
        {env.NEXT_PUBLIC_GTM_ID ? (
          <GoogleTagManager gtmId={env.NEXT_PUBLIC_GTM_ID} />
        ) : null}
      </body>
    </html>
  );
}
