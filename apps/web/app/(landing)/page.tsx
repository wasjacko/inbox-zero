import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { redirectToEmailAccountPath } from "@/utils/account";
import { auth } from "@/utils/auth";

export const metadata: Metadata = {
  title: "Freescale, Votre activité, enfin au clair",
  description:
    "Freescale centralise vos échanges clients, prépare vos réponses et vous aide à avancer sans perdre le contexte.",
  alternates: { canonical: "/" },
};

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    await redirectToEmailAccountPath("/chat");
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://use.typekit.net"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;1,14..32,400;1,14..32,500&family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="https://use.typekit.net/rbx1gft.css" />
      <link rel="stylesheet" href="/home/styles.css?v=1306" />
      <link
        rel="preload"
        as="image"
        href="/home/assets/hero-woman.webp?v=2"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/home/assets/logo-freescale-header.svg?v=3"
      />

      {/* The HTML is a versioned, local artifact from the Freescale repository. */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local landing markup */}
      <div dangerouslySetInnerHTML={{ __html: getLandingBody() }} />
      <script src="/home/script.js?v=1201" defer />
    </>
  );
}

function getLandingBody() {
  const document = readFileSync(
    path.join(process.cwd(), "public", "home", "index.html"),
    "utf8",
  );
  const body = document.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error("The Freescale landing document has no body element");
  }

  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replaceAll('src="assets/', 'src="/home/assets/')
    .replaceAll('poster="assets/', 'poster="/home/assets/')
    .replaceAll('href="index.html', 'href="/')
    .replaceAll('href="tarifs.html', 'href="/home/tarifs.html')
    .replaceAll('href="contact.html', 'href="/home/contact.html')
    .replaceAll(
      'href="download-mobile.html',
      'href="/home/download-mobile.html',
    )
    .replaceAll(
      'href="confidentialite.html',
      'href="/home/confidentialite.html',
    )
    .replaceAll('href="cgu.html', 'href="/home/cgu.html')
    .replaceAll('href="cgv.html', 'href="/home/cgv.html')
    .replaceAll('href="rgpd.html', 'href="/home/rgpd.html');
}
