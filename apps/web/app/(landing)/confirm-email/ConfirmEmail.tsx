"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSession, signIn, verifyEmail } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { startPreviewOnboarding } from "@/utils/preview-onboarding";

export function ConfirmEmail() {
  const token = useSearchParams().get("token");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const continueToOnboarding = () => {
    try {
      startPreviewOnboarding(window.localStorage);
    } catch {}
    window.location.assign("/onboarding");
  };

  async function confirm() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const result = await verifyEmail({ query: { token } });
      if (result.error)
        throw new Error(
          "Ce lien est invalide ou expiré. Demandez un nouvel e-mail de confirmation depuis la connexion.",
        );
      // The server has verified the signature. Read the address only to ensure
      // that an existing browser session belongs to this confirmation link.
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const verifiedEmail = String(payload.email).toLowerCase();
      setEmail(verifiedEmail);
      // Already redeemed links confirm the address but don't create a session.
      // Never enter the authenticated onboarding until the cookie is present.
      const session = await getSession({ query: { disableCookieCache: true } });
      if (session.data?.user.email.toLowerCase() === verifiedEmail)
        continueToOnboarding();
      else setNeedsLogin(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La confirmation a échoué. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <section className="w-full max-w-md space-y-5 rounded-2xl border p-8">
        <h1 className="text-2xl font-semibold">Confirmer votre adresse</h1>
        {needsLogin ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              try {
                const result = await signIn.email({
                  email: email.trim(),
                  password,
                });
                if (result.error) {
                  setError("Adresse ou mot de passe incorrect.");
                  return;
                }
                continueToOnboarding();
              } catch {
                setError("La connexion a échoué. Réessayez.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>
              Votre adresse a déjà été confirmée. Saisissez vos identifiants
              pour ouvrir votre onboarding sur ce navigateur.
            </p>
            <label className="block">
              Adresse e-mail
              <input
                className="mt-1 w-full rounded border p-3"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              Mot de passe
              <input
                className="mt-1 w-full rounded border p-3"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={busy}>
              Ouvrir mon onboarding
            </Button>
          </form>
        ) : (
          <>
            <p>
              Confirmez votre adresse pour activer votre compte et commencer
              votre onboarding.
            </p>
            <Button onClick={confirm} disabled={busy || !token}>
              {busy ? "Confirmation…" : "Confirmer et commencer"}
            </Button>
          </>
        )}
        {!token && <p role="alert">Le lien de confirmation est incomplet.</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
