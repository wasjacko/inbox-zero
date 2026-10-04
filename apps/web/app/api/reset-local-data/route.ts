import { NextResponse } from "next/server";

function page(content: string, headers?: Record<string, string>) {
  return new NextResponse(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Freescale</title><body style="font-family:system-ui;background:#f8f7fc;color:#0c0837;padding:10vh 24px"><main style="max-width:520px;margin:auto;background:white;padding:32px;border-radius:24px"><h1>Freescale</h1>${content}</main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        ...headers,
      },
    },
  );
}

export function GET() {
  return page(
    '<p>Effacez les cookies, le cache et les données locales de Freescale sur ce navigateur pour repartir à zéro.</p><form method="post"><button type="submit">Réinitialiser Freescale sur ce navigateur</button></form>',
  );
}

export function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new NextResponse(null, { status: 403 });
  }
  return page(
    '<p>La réinitialisation des données locales de Freescale a été demandée à votre navigateur.</p><a href="/login?mode=signup">Créer un nouveau compte</a>',
    {
      "Clear-Site-Data": '"cookies", "storage", "cache"',
    },
  );
}
