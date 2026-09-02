"use client";

import {
  ArrowRightIcon,
  Building2Icon,
  BriefcaseBusinessIcon,
  CheckIcon,
  ChevronLeftIcon,
  Clock3Icon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toastError } from "@/components/Toast";
import { useAccounts } from "@/hooks/useAccounts";
import { cn } from "@/utils";
import { getAccountLinkingUrl } from "@/utils/account-linking";
import { signIn, signUp } from "@/utils/auth-client";
import {
  getPreviewOnboardingDestination,
  grantPreviewOnboardingAccess,
  savePreviewConnectedChannels,
  startPreviewOnboarding,
} from "@/utils/preview-onboarding";
import { savePreviewFreelancerName } from "@/utils/preview-profile";
import { savePreviewWorkspaceName } from "@/utils/preview-workspace";
import { redirectToSafeUrl } from "@/utils/redirect";

function SplitOnboardingShell({
  children,
  footer,
  compact = false,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <main className="min-h-svh bg-muted/20">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-7 sm:px-10 sm:py-9">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Retour à l’accueil Freescale"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="font-semibold text-xl tracking-[-0.04em]">
              Freescale
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Retour au site
          </Link>
        </div>
        <div
          className={cn(
            "mx-auto flex w-full flex-1 items-center py-8 sm:py-10",
            compact ? "max-w-md" : "max-w-lg",
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "w-full rounded-2xl border bg-background shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)]",
              compact ? "p-5 sm:p-6" : "p-5 sm:p-8",
            )}
          >
            {children}
          </motion.div>
        </div>
        {footer ? (
          <div className="mx-auto w-full max-w-lg">{footer}</div>
        ) : null}
      </section>
    </main>
  );
}

export function AuthPreview() {
  return (
    <>
      <MobileAuthPreview />
      <div className="hidden lg:block">
        <DesktopAuthPreview />
      </div>
    </>
  );
}

type AuthMode = "signup" | "login";
type AuthLoading = "google" | "email" | null;

function useFreescaleAuthentication(mode: AuthMode) {
  const router = useRouter();
  const [loading, setLoading] = useState<AuthLoading>(null);
  const [error, setError] = useState<string | null>(null);

  const continueWithGoogle = async () => {
    setLoading("google");
    setError(null);

    try {
      if (mode === "signup") startPreviewOnboarding(window.localStorage);
      await signIn.social({
        provider: "google",
        callbackURL: `/welcome-redirect?intent=${mode}`,
        errorCallbackURL: "/login?error=oauth",
      });
    } catch (authError) {
      setError(getFreescaleAuthError(authError));
      setLoading(null);
    }
  };

  const continueWithEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setLoading("email");
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result =
        mode === "signup"
          ? await signUp.email({
              name: normalizedEmail.split("@")[0] || "Utilisateur",
              email: normalizedEmail,
              password,
              callbackURL: "/onboarding",
            })
          : await signIn.email({
              email: normalizedEmail,
              password,
              callbackURL: "/welcome-redirect?intent=login",
              rememberMe: true,
            });

      if (mode === "signup" && isUserAlreadyExistsError(result.error)) {
        const signInResult = await signIn.email({
          email: normalizedEmail,
          password,
          callbackURL: "/chat?notice=existing-account",
          rememberMe: true,
        });

        if (signInResult.error) {
          setError(
            "Ce compte existe déjà. Connectez-vous avec son mot de passe habituel ou utilisez Google.",
          );
          setLoading(null);
          return;
        }

        router.push("/chat?notice=existing-account");
        router.refresh();
        return;
      }

      if (result.error) throw result.error;

      if (mode === "signup") {
        startPreviewOnboarding(window.localStorage);
      }

      router.push(
        mode === "signup" ? "/onboarding" : "/welcome-redirect?intent=login",
      );
      router.refresh();
    } catch (authError) {
      setError(getFreescaleAuthError(authError));
      setLoading(null);
    }
  };

  return {
    continueWithEmail,
    continueWithGoogle,
    error,
    loading,
    resetError: () => setError(null),
  };
}

function getFreescaleAuthError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("USER_ALREADY_EXISTS")) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (
    code.includes("INVALID_EMAIL_OR_PASSWORD") ||
    code.includes("INVALID_PASSWORD") ||
    code.includes("USER_NOT_FOUND")
  ) {
    return "Adresse email ou mot de passe incorrect.";
  }

  return "La connexion n’a pas abouti. Vérifiez vos informations puis réessayez.";
}

function isUserAlreadyExistsError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return String(error.code).includes("USER_ALREADY_EXISTS");
}

function MobileAuthPreview() {
  const searchParams = useSearchParams();
  const mode: AuthMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { continueWithEmail, continueWithGoogle, error, loading } =
    useFreescaleAuthentication(mode);

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "signup" && password !== passwordConfirmation) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    continueWithEmail({ email, password }).catch(() => undefined);
  };

  return (
    <main className="flex min-h-svh flex-col bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden">
      <header className="flex items-center justify-between gap-4">
        <Link
          aria-label="Retour à l’accueil Freescale"
          className="mobile-touch-target inline-flex items-center rounded-xl font-semibold text-lg tracking-[-0.04em]"
          href="/"
        >
          Freescale
        </Link>
        <Link
          className="mobile-touch-target inline-flex items-center gap-1 rounded-xl px-2 text-muted-foreground text-sm active:bg-muted"
          href="/"
        >
          <ChevronLeftIcon className="size-4" /> Retour
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 items-center py-8">
        <div className="w-full rounded-3xl border bg-card p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] sm:p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <SparklesIcon className="size-5" />
          </span>
          <h1 className="mt-5 font-semibold text-3xl tracking-tight">
            {mode === "signup" ? "Bienvenue chez Freescale" : "Bon retour"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {mode === "signup"
              ? "Créez votre espace et laissez Mue retrouver l’essentiel dans vos échanges."
              : "Retrouvez votre espace, vos messages et vos prochaines actions."}
          </p>
          {mode === "signup" ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-blue-950 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
              <p className="font-medium text-sm">14 jours d’essai gratuit</p>
              <p className="mt-1 text-xs leading-5 opacity-80">
                Sans engagement. Après l’essai, choisissez le plan à 19 € ou 29
                € par mois. Vous gardez vos données dans tous les cas.
              </p>
            </div>
          ) : null}

          <Button
            className="mt-8 h-12 w-full rounded-xl bg-background text-foreground shadow-sm hover:bg-muted"
            disabled={loading !== null}
            onClick={() => continueWithGoogle().catch(() => undefined)}
            variant="outline"
          >
            <Image alt="" height={20} src="/images/google.svg" width={20} />
            {loading === "google"
              ? "Connexion en cours…"
              : mode === "signup"
                ? "Créer avec Google"
                : "Continuer avec Google"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-muted-foreground text-xs">
            <span className="h-px flex-1 bg-border" />
            ou avec votre email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3.5" onSubmit={handleEmailSubmit}>
            <label className="block">
              <span className="mb-1.5 block font-medium text-xs">
                Adresse email
              </span>
              <input
                autoComplete="email"
                className="h-12 w-full rounded-xl border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring"
                inputMode="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="vous@exemple.com"
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-medium text-xs">
                Mot de passe
              </span>
              <span className="relative block">
                <input
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className="h-12 w-full rounded-xl border bg-background px-3.5 pr-12 text-base outline-none focus:ring-2 focus:ring-ring"
                  minLength={8}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </span>
            </label>
            {mode === "signup" ? (
              <label className="block">
                <span className="mb-1.5 block font-medium text-xs">
                  Confirmer le mot de passe
                </span>
                <input
                  aria-invalid={passwordMismatch}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border bg-background px-3.5 text-base outline-none focus:ring-2 focus:ring-ring"
                  minLength={8}
                  onChange={(event) => {
                    setPasswordConfirmation(event.currentTarget.value);
                    setPasswordMismatch(false);
                  }}
                  required
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirmation}
                />
              </label>
            ) : null}
            {passwordMismatch ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm"
                role="alert"
              >
                Les deux mots de passe ne correspondent pas.
              </p>
            ) : null}
            {error ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button
              className="h-12 w-full rounded-xl"
              disabled={loading !== null}
              type="submit"
            >
              {loading === "email"
                ? "Connexion en cours…"
                : mode === "signup"
                  ? "Créer mon compte"
                  : "Se connecter"}
              {loading !== "email" ? (
                <ArrowRightIcon className="size-4" />
              ) : null}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-2xl bg-muted/60 p-3 text-muted-foreground text-xs leading-5">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              Freescale demande uniquement les accès nécessaires pour connecter
              et organiser vos échanges.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-md text-center text-muted-foreground text-sm">
        {mode === "signup" ? "Vous avez déjà un compte ?" : "Nouveau ici ?"}{" "}
        <Link
          className="mobile-touch-target inline-flex items-center font-medium text-foreground underline-offset-4 active:underline"
          href={mode === "signup" ? "/login" : "/login?mode=signup"}
        >
          {mode === "signup" ? "Se connecter" : "Créer un compte"}
        </Link>
      </footer>
    </main>
  );
}

function DesktopAuthPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signup" | "login">(
    searchParams.get("mode") === "signup" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { continueWithEmail, continueWithGoogle, error, loading, resetError } =
    useFreescaleAuthentication(mode);

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "signup" && password !== passwordConfirmation) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    continueWithEmail({ email, password }).catch(() => undefined);
  };

  return (
    <SplitOnboardingShell
      compact
      eyebrow="Le copilote des freelances"
      title="Vos clients avancent. Votre charge mentale recule."
    >
      <div className="mb-5">
        <h2 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          {mode === "signup" ? "Créer votre compte" : "Connexion à Freescale"}
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          {mode === "signup"
            ? "Créez votre compte pour configurer votre premier espace de travail."
            : "Connectez-vous pour accéder à votre espace de travail."}
        </p>
        {mode === "signup" ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-blue-950 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
            <p className="font-medium text-sm">14 jours d’essai gratuit</p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              Sans engagement, puis choisissez 19 € ou 29 € par mois.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-background font-medium text-sm transition-colors hover:bg-muted/50"
          disabled={loading !== null}
          onClick={() => continueWithGoogle().catch(() => undefined)}
          type="button"
        >
          <Image alt="Google" height={18} src="/images/google.svg" width={18} />
          {loading === "google"
            ? "Connexion en cours…"
            : "Continuer avec Google"}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-muted-foreground text-xs">
        <span className="h-px flex-1 bg-border" />
        ou continuer avec votre email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-3.5" onSubmit={handleEmailSubmit}>
        <label className="block">
          <span className="mb-1.5 block font-medium text-xs">
            Adresse email
          </span>
          <input
            autoComplete="email"
            className="h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="vous@exemple.com"
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-medium text-xs">Mot de passe</span>
          <span className="relative block">
            <input
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="h-11 w-full rounded-xl border bg-background px-3.5 pr-11 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              minLength={8}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </span>
        </label>
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-1.5 block font-medium text-xs">
              Confirmer le mot de passe
            </span>
            <input
              aria-invalid={passwordMismatch}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              minLength={8}
              onChange={(event) => {
                setPasswordConfirmation(event.currentTarget.value);
                setPasswordMismatch(false);
              }}
              required
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
            />
          </label>
        ) : null}

        {passwordMismatch ? (
          <p
            className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm dark:bg-red-950/30 dark:text-red-300"
            role="alert"
          >
            Les deux mots de passe ne correspondent pas.
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm dark:bg-red-950/30 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button
          className="mt-2 w-full"
          disabled={loading !== null}
          size="lg"
          type="submit"
        >
          {loading === "email"
            ? "Connexion en cours…"
            : mode === "signup"
              ? "Créer mon espace"
              : "Se connecter"}
          {loading !== "email" ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-5 text-center text-muted-foreground text-sm">
        {mode === "signup"
          ? "Vous avez déjà un compte ?"
          : "Pas encore de compte ?"}{" "}
        <button
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            const nextMode = mode === "signup" ? "login" : "signup";
            setMode(nextMode);
            setPassword("");
            setPasswordConfirmation("");
            setPasswordMismatch(false);
            resetError();
            router.replace(
              nextMode === "signup" ? "/login?mode=signup" : "/login",
            );
          }}
          type="button"
        >
          {mode === "signup" ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
    </SplitOnboardingShell>
  );
}

const onboardingSteps = [
  {
    title: "Faisons connaissance.",
    description: "Vous et votre activité, simplement.",
  },
  {
    title: "Créez votre espace.",
    description: "Un nom, et c’est chez vous.",
  },
  {
    title: "Où échangez-vous ?",
    description: "Choisissez vos canaux.",
  },
  {
    title: "Relions vos comptes.",
    description: "Un par un, simplement.",
  },
  {
    title: "Place au premier brief.",
    description: "Mue repère l’essentiel.",
  },
];

const channelOptions = [
  {
    id: "gmail",
    label: "Gmail",
    detail: "Emails clients",
    logo: "/images/google.svg",
  },
  {
    id: "outlook",
    label: "Outlook",
    detail: "Emails et calendrier",
    logo: "/images/microsoft.svg",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    detail: "Messages directs",
    logo: "/images/whatsapp.svg",
  },
  {
    id: "slack",
    label: "Slack",
    detail: "Canaux projets",
    logo: "/images/slack.svg",
  },
] as const;

export function OnboardingPreview() {
  return (
    <>
      <MobileOnboardingPreview />
      <div className="hidden lg:block">
        <DesktopOnboardingPreview />
      </div>
    </>
  );
}

const mobileOnboardingStorageKey = "freescale-preview-onboarding";

type MobileOnboardingState = {
  step: number;
  selectedChannels: string[];
  businessProfile: {
    freelancerName: string;
    businessName: string;
    activity: string;
  };
  workspaceName: string;
  connectedChannels: string[];
};

function useOnboardingChannelConnections() {
  const { data: accountsData } = useAccounts();
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);
  const [connectingChannels, setConnectingChannels] = useState<string[]>([]);

  useEffect(() => {
    if (!accountsData) return;

    const connected = accountsData.emailAccounts.flatMap((emailAccount) => {
      if (emailAccount.account.provider === "google") return ["gmail"];
      if (emailAccount.account.provider === "microsoft") return ["outlook"];
      return [];
    });

    setConnectedChannels([...new Set(connected)]);
  }, [accountsData]);

  const connectChannel = async (channel: string) => {
    if (
      connectedChannels.includes(channel) ||
      connectingChannels.includes(channel)
    ) {
      return;
    }

    const provider =
      channel === "gmail"
        ? "google"
        : channel === "outlook"
          ? "microsoft"
          : null;
    if (!provider) return;

    setConnectingChannels((current) => [...current, channel]);

    try {
      const url = await getAccountLinkingUrl(provider, {
        returnTo: "/onboarding",
      });
      redirectToSafeUrl(url, { allowExternal: true });
    } catch (error) {
      console.error(`Error initiating ${provider} account linking:`, error);
      setConnectingChannels((current) =>
        current.filter((item) => item !== channel),
      );
      toastError({
        title: `Impossible de connecter ${channel === "gmail" ? "Gmail" : "Outlook"}`,
        description: "Réessayez dans quelques instants.",
      });
    }
  };

  return {
    connectedChannels,
    connectingChannels,
    connectChannel,
  };
}

function MobileOnboardingPreview() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "gmail",
    "whatsapp",
  ]);
  const [businessProfile, setBusinessProfile] = useState({
    freelancerName: "",
    businessName: "",
    activity: "",
  });
  const [workspaceName, setWorkspaceName] = useState("");
  const { connectedChannels, connectingChannels, connectChannel } =
    useOnboardingChannelConnections();
  const [preparing, setPreparing] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(mobileOnboardingStorageKey);
      if (saved) {
        const state = JSON.parse(saved) as Partial<MobileOnboardingState>;
        if (typeof state.step === "number") {
          setStep(
            Math.min(Math.max(state.step, 0), onboardingSteps.length - 1),
          );
        }
        if (Array.isArray(state.selectedChannels)) {
          setSelectedChannels(state.selectedChannels);
        }
        if (state.businessProfile) {
          setBusinessProfile((current) => ({
            ...current,
            ...state.businessProfile,
            freelancerName:
              typeof state.businessProfile?.freelancerName === "string"
                ? state.businessProfile.freelancerName
                : "",
          }));
        }
        if (typeof state.workspaceName === "string") {
          setWorkspaceName(state.workspaceName);
        }
      }
    } catch {
      window.localStorage.removeItem(mobileOnboardingStorageKey);
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    const state: MobileOnboardingState = {
      step,
      selectedChannels,
      businessProfile,
      workspaceName,
      connectedChannels,
    };
    window.localStorage.setItem(
      mobileOnboardingStorageKey,
      JSON.stringify(state),
    );
  }, [
    businessProfile,
    connectedChannels,
    restored,
    selectedChannels,
    step,
    workspaceName,
  ]);

  const toggleSelectedChannel = (value: string) => {
    setSelectedChannels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const continueOnboarding = () => {
    if (step === 0) {
      savePreviewFreelancerName(businessProfile.freelancerName);
    }
    if (step === 1) savePreviewWorkspaceName(workspaceName);
    if (step < onboardingSteps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    setPreparing(true);
    savePreviewConnectedChannels(connectedChannels);
    window.localStorage.removeItem(mobileOnboardingStorageKey);
    grantPreviewOnboardingAccess(window.localStorage, "completed");
    window.setTimeout(() => {
      router.push(getPreviewOnboardingDestination(connectedChannels));
    }, 520);
  };

  const skipOnboarding = () => {
    savePreviewConnectedChannels([]);
    grantPreviewOnboardingAccess(window.localStorage, "skipped");
    router.push(getPreviewOnboardingDestination([]));
  };

  const canContinue =
    (step !== 0 ||
      Boolean(
        businessProfile.activity &&
          businessProfile.businessName.trim() &&
          businessProfile.freelancerName.trim(),
      )) &&
    (step !== 1 || Boolean(workspaceName.trim())) &&
    (step !== 2 || selectedChannels.length > 0) &&
    (step !== 4 || scanComplete);
  const connectionCta =
    connectedChannels.length === 0
      ? "Passer cette étape"
      : connectedChannels.length === selectedChannels.length
        ? "Continuer"
        : `Continuer avec ${connectedChannels.length}`;
  const primaryLabel =
    step === onboardingSteps.length - 1
      ? scanComplete
        ? "Accéder à l’espace"
        : "Analyse en cours…"
      : step === 3
        ? connectionCta
        : "Continuer";

  return (
    <main className="fixed inset-0 z-[100] flex min-h-svh flex-col overflow-hidden bg-white text-slate-950 lg:hidden dark:bg-slate-950 dark:text-white">
      <header
        className="relative shrink-0 overflow-hidden px-5 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 125% 105% at 88% 125%, rgba(255,239,197,0.42), rgba(255,239,197,0) 58%), linear-gradient(145deg, #0b36c8 0%, #2458df 100%)",
        }}
      >
        <div className="flex min-h-11 items-center justify-between gap-4">
          <Link
            className="mobile-touch-target inline-flex items-center rounded-xl font-semibold text-lg tracking-[-0.04em]"
            href="/"
          >
            Freescale
          </Link>
          <button
            className="mobile-touch-target -mr-2 rounded-xl px-2 text-white/75 text-xs active:bg-white/10"
            onClick={skipOnboarding}
            type="button"
          >
            Configurer plus tard
          </button>
        </div>
        <div
          className="mt-3 flex gap-1.5"
          aria-label="Progression de l’onboarding"
          aria-valuemax={onboardingSteps.length}
          aria-valuemin={1}
          aria-valuenow={step + 1}
          role="progressbar"
        >
          {onboardingSteps.map((item, index) => (
            <span
              className={cn(
                "h-px flex-1 bg-white/30 transition-colors duration-300",
                index <= step && "bg-white",
              )}
              key={item.title}
            />
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pr-14"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 5 }}
            key={step}
            transition={{ duration: 0.24 }}
          >
            <p className="font-light text-[9px] text-white/60 tracking-[0.2em]">
              0{step + 1} — 0{onboardingSteps.length}
            </p>
            <p className="mt-1.5 font-light text-[1.35rem] leading-tight tracking-[-0.035em]">
              {onboardingSteps[step]?.title}
            </p>
          </motion.div>
        </AnimatePresence>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            initial={{ opacity: 0, x: 12 }}
            key={step}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 ? (
              <BusinessProfileStep
                onChange={(field, value) =>
                  setBusinessProfile((current) => ({
                    ...current,
                    [field]: value,
                  }))
                }
                profile={businessProfile}
              />
            ) : null}
            {step === 1 ? (
              <WorkspaceStep
                businessName={businessProfile.businessName}
                mobile
                onChange={setWorkspaceName}
                value={workspaceName}
              />
            ) : null}
            {step === 2 ? (
              <ChannelsStep
                onToggle={toggleSelectedChannel}
                selected={selectedChannels}
              />
            ) : null}
            {step === 3 ? (
              <ConnectChannelsStep
                connected={connectedChannels}
                connecting={connectingChannels}
                onConnect={connectChannel}
                selected={selectedChannels}
              />
            ) : null}
            {step === 4 ? (
              <FirstValueScanStep
                connected={connectedChannels}
                onStatusChange={setScanComplete}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="shrink-0 border-slate-100 border-t bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3 max-[360px]:flex-col-reverse">
          {step > 0 ? (
            <Button
              className="mobile-touch-target max-[360px]:w-full"
              disabled={preparing}
              onClick={() => setStep((current) => current - 1)}
              variant="ghost"
            >
              <ChevronLeftIcon className="size-4" />
              Retour
            </Button>
          ) : null}
          <Button
            className="mobile-touch-target ml-auto min-w-40 rounded-xl bg-blue-600 max-[360px]:w-full hover:bg-blue-700"
            disabled={!canContinue || preparing}
            onClick={continueOnboarding}
            size="lg"
          >
            {preparing ? "Ouverture…" : primaryLabel}
            {!preparing ? <ArrowRightIcon className="size-4" /> : null}
          </Button>
        </div>
      </footer>
    </main>
  );
}

function DesktopOnboardingPreview() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState([
    "gmail",
    "whatsapp",
  ]);
  const [businessProfile, setBusinessProfile] = useState({
    freelancerName: "",
    businessName: "",
    activity: "",
  });
  const [workspaceName, setWorkspaceName] = useState("");
  const { connectedChannels, connectingChannels, connectChannel } =
    useOnboardingChannelConnections();
  const [preparing, setPreparing] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const toggleValue = (
    value: string,
    values: string[],
    setter: (values: string[]) => void,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  const next = () => {
    if (step === 0) {
      savePreviewFreelancerName(businessProfile.freelancerName);
    }
    if (step === 1) savePreviewWorkspaceName(workspaceName);
    if (step < onboardingSteps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    setPreparing(true);
    savePreviewConnectedChannels(connectedChannels);
    grantPreviewOnboardingAccess(window.localStorage, "completed");
    window.setTimeout(() => {
      router.push(getPreviewOnboardingDestination(connectedChannels));
    }, 700);
  };

  const skipOnboarding = () => {
    savePreviewConnectedChannels([]);
    grantPreviewOnboardingAccess(window.localStorage, "skipped");
    router.push(getPreviewOnboardingDestination([]));
  };

  const connectionCta =
    connectedChannels.length === 0
      ? "Passer cette étape"
      : connectedChannels.length === selectedChannels.length
        ? "Continuer"
        : `Continuer avec ${connectedChannels.length} ${connectedChannels.length > 1 ? "canaux" : "canal"}`;

  return (
    <main className="fixed inset-0 z-[100] flex overflow-y-auto bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <aside
        className="relative hidden min-h-svh w-[35%] min-w-[390px] max-w-[560px] shrink-0 overflow-hidden px-10 py-8 text-white lg:flex lg:flex-col xl:px-14 xl:py-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 210% 62% at 50% 112%, rgba(255,239,197,0.94) 0%, rgba(252,225,201,0.72) 24%, rgba(199,185,218,0.38) 49%, rgba(43,91,229,0) 78%), linear-gradient(180deg, #0b36c8 0%, #1244d7 48%, #2458df 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.055] mix-blend-soft-light"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 160 160%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.68%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%22.72%22/%3E%3C/svg%3E")',
            backgroundSize: "160px 160px",
          }}
        />
        <div className="relative flex items-center">
          <Link className="font-semibold text-lg tracking-[-0.04em]" href="/">
            Freescale
          </Link>
        </div>

        <div className="relative mt-12 flex gap-1.5">
          {onboardingSteps.map((item, index) => (
            <span
              className={cn(
                "h-0.5 flex-1 rounded-full bg-white/20 transition-colors",
                (index <= step || step === onboardingSteps.length) &&
                  "bg-white",
              )}
              key={`${item.title}-${index}`}
            />
          ))}
        </div>

        <div className="relative mt-8">
          <p className="font-light text-white/55 text-[10px] tracking-[0.24em]">
            {step < onboardingSteps.length
              ? `0${step + 1}  —  0${onboardingSteps.length}`
              : "Prêt"}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 10 }}
              key={step}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="mt-3 max-w-sm font-light text-3xl leading-[1.12] tracking-[-0.04em] xl:text-[2.15rem]">
                {onboardingSteps[step]?.title}
              </h1>
              <p className="mt-4 max-w-xs text-white/68 text-sm leading-6">
                {onboardingSteps[step]?.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-auto flex items-end justify-between pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: step % 2 === 0 ? -1.5 : 1.5,
              }}
              className="relative"
              exit={{ opacity: 0, y: 16, scale: 0.88 }}
              initial={{ opacity: 0, y: 26, scale: 0.82, rotate: -5 }}
              key={`mue-${step}`}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="absolute inset-2 rounded-full bg-white/30 blur-2xl" />
              <Image
                alt="Mue, votre copilote Freescale"
                className="relative h-24 w-24 object-contain drop-shadow-[0_18px_24px_rgba(8,30,112,0.28)] xl:h-28 xl:w-28"
                height={128}
                priority
                sizes="(max-width: 1279px) 96px, 112px"
                src="/images/mue/mue-setup-icon.png"
                width={128}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>

      <section className="flex min-h-svh min-w-0 flex-1 flex-col bg-white px-5 py-6 sm:px-10 lg:px-14 lg:py-8 xl:px-20 dark:bg-slate-950">
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            className="inline-flex min-h-11 items-center font-semibold text-lg tracking-[-0.04em] lg:hidden"
            data-mobile-onboarding-brand
            href="/"
          >
            Freescale
          </Link>
          <button
            className="text-slate-400 text-sm transition-colors hover:text-slate-950 dark:hover:text-white"
            onClick={skipOnboarding}
            type="button"
          >
            Configurer plus tard
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col pt-10 sm:pt-14 lg:pt-8">
          {step < onboardingSteps.length ? (
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="font-light text-slate-400 text-[10px] tracking-[0.2em]">
                0{step + 1} — 0{onboardingSteps.length}
              </span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.span
                  animate={{
                    width: `${((step + 1) / onboardingSteps.length) * 100}%`,
                  }}
                  className="block h-full rounded-full bg-slate-950 dark:bg-white"
                />
              </span>
            </div>
          ) : null}

          <div className="my-auto py-8">
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                initial={{ opacity: 0, x: 18 }}
                key={step}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 ? (
                  <BusinessProfileStep
                    profile={businessProfile}
                    onChange={(field, value) =>
                      setBusinessProfile((current) => ({
                        ...current,
                        [field]: value,
                      }))
                    }
                  />
                ) : null}
                {step === 1 ? (
                  <WorkspaceStep
                    businessName={businessProfile.businessName}
                    onChange={setWorkspaceName}
                    value={workspaceName}
                  />
                ) : null}
                {step === 2 ? (
                  <ChannelsStep
                    selected={selectedChannels}
                    onToggle={(value) =>
                      toggleValue(value, selectedChannels, setSelectedChannels)
                    }
                  />
                ) : null}
                {step === 3 ? (
                  <ConnectChannelsStep
                    connected={connectedChannels}
                    connecting={connectingChannels}
                    onConnect={connectChannel}
                    selected={selectedChannels}
                  />
                ) : null}
                {step === 4 ? (
                  <FirstValueScanStep
                    connected={connectedChannels}
                    onStatusChange={setScanComplete}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < onboardingSteps.length ? (
            <div className="mt-auto flex items-center justify-between pt-8">
              <Button
                className={cn(step === 0 && "invisible")}
                disabled={preparing}
                onClick={() => setStep((value) => value - 1)}
                variant="ghost"
              >
                <ChevronLeftIcon className="size-4" />
                Retour
              </Button>
              <Button
                className="min-w-36 rounded-lg bg-blue-600 hover:bg-blue-700"
                disabled={
                  preparing ||
                  (step === 0 &&
                    Object.values(businessProfile).some(
                      (value) => !value.trim(),
                    )) ||
                  (step === 1 && !workspaceName.trim()) ||
                  (step === 2 && selectedChannels.length === 0) ||
                  (step === 4 && !scanComplete)
                }
                onClick={next}
                size="lg"
              >
                {preparing
                  ? "Finalisation…"
                  : step === onboardingSteps.length - 1
                    ? connectedChannels.length > 0
                      ? scanComplete
                        ? "Accéder à l’espace"
                        : "Analyse en cours…"
                      : scanComplete
                        ? "Accéder à l’espace"
                        : "Préparation…"
                    : step === 3
                      ? connectionCta
                      : "Continuer"}
                {!preparing ? <ArrowRightIcon className="size-4" /> : null}
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="max-w-xl font-medium text-2xl tracking-[-0.03em] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground text-sm leading-6 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function ContextStep() {
  const contexts = [
    {
      id: "sarah",
      initials: "SL",
      client: "Sarah Lemoine",
      project: "Refonte de la landing page",
      messages: "6 échanges",
    },
    {
      id: "northstar",
      initials: "NS",
      client: "Northstar Studio",
      project: "Proposition commerciale",
      messages: "4 échanges",
    },
    {
      id: "atlas",
      initials: "AM",
      client: "Alex Morgan",
      project: "Lancement Atlas",
      messages: "5 échanges",
    },
  ];
  const [confirmed, setConfirmed] = useState(["sarah", "atlas"]);

  return (
    <>
      <StepHeading
        title="Vérifiez ce que Freescale a compris."
        description="Un message bien rattaché évite à Mue de mélanger deux clients ou deux projets. Confirmez les associations proposées."
      />
      <div className="overflow-hidden rounded-xl border">
        {contexts.map((context) => {
          const isConfirmed = confirmed.includes(context.id);
          return (
            <div
              className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0"
              key={context.id}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700 text-xs dark:bg-blue-950/40 dark:text-blue-300">
                {context.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm">
                  {context.client}
                </span>
                <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                  {context.project} · {context.messages}
                </span>
              </span>
              <button
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium text-[11px] transition-colors",
                  isConfirmed
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300",
                )}
                onClick={() =>
                  setConfirmed((current) =>
                    current.includes(context.id)
                      ? current.filter((id) => id !== context.id)
                      : [...current, context.id],
                  )
                }
                type="button"
              >
                {isConfirmed ? "Confirmé" : "Confirmer"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-3 rounded-xl bg-muted/35 p-4">
        <UsersRoundIcon className="mt-0.5 size-5 shrink-0 text-blue-600" />
        <p className="text-muted-foreground text-xs leading-5">
          Vous pourrez corriger, fusionner ou ajouter un client depuis Canaux.
          Ces associations servent uniquement à restituer le bon contexte.
        </p>
      </div>
    </>
  );
}

function BusinessProfileStep({
  profile,
  onChange,
}: {
  profile: {
    freelancerName: string;
    businessName: string;
    activity: string;
  };
  onChange: (
    field: "freelancerName" | "businessName" | "activity",
    value: string,
  ) => void;
}) {
  const fieldClassName =
    "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base outline-none transition-colors placeholder:text-slate-400 focus:border-[#6f91ec] focus:ring-2 focus:ring-[#4771df]/10 sm:text-sm dark:border-slate-700 dark:bg-slate-950";

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-6">
        <div>
          <h1 className="max-w-xl font-medium text-2xl tracking-[-0.03em] sm:text-3xl">
            Parlez-nous de vous
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground text-sm leading-6 sm:text-base">
            Ces informations personnalisent votre espace et votre accueil.
          </p>
        </div>
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative hidden size-20 shrink-0 sm:block"
          initial={{ opacity: 0, scale: 0.92, y: 5 }}
          transition={{ delay: 0.08, duration: 0.36 }}
        >
          <Image
            alt="Mue vous accueille"
            className="object-contain drop-shadow-[0_10px_14px_rgba(95,73,180,0.14)]"
            fill
            loading="eager"
            sizes="80px"
            src="/images/mue/mue-welcome.png"
          />
        </motion.div>
      </div>
      <div className="space-y-5">
        <label className="block">
          <span className="font-medium text-sm">Votre prénom</span>
          <input
            autoCapitalize="words"
            autoComplete="given-name"
            autoFocus
            className={fieldClassName}
            enterKeyHint="next"
            maxLength={40}
            onChange={(event) => onChange("freelancerName", event.target.value)}
            placeholder="Ex. Wassil"
            type="text"
            value={profile.freelancerName}
          />
        </label>
        <label className="block">
          <span className="font-medium text-sm">Votre activité freelance</span>
          <select
            className={cn(
              fieldClassName,
              !profile.activity && "text-slate-400",
            )}
            onChange={(event) => onChange("activity", event.target.value)}
            value={profile.activity}
          >
            <option disabled value="">
              Sélectionnez votre activité
            </option>
            <option value="graphic-design">Design graphique</option>
            <option value="ui-ux">UX / UI design</option>
            <option value="web-design">Web design</option>
            <option value="branding">Identité de marque</option>
            <option value="no-code">No-code / automatisation</option>
            <option value="ai-data">IA / data</option>
            <option value="consulting">Conseil / stratégie</option>
            <option value="coaching">Coaching / formation</option>
            <option value="digital-marketing">Marketing digital</option>
            <option value="social-media">Social media</option>
            <option value="copywriting">Copywriting / rédaction</option>
            <option value="content">Création de contenu</option>
            <option value="photo-video">Photo / vidéo</option>
            <option value="translation">Traduction</option>
            <option value="virtual-assistant">Assistance virtuelle</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <label className="block">
          <span className="font-medium text-sm">Business name</span>
          <input
            autoComplete="organization"
            className={fieldClassName}
            onChange={(event) => onChange("businessName", event.target.value)}
            placeholder="Le nom de votre activité"
            type="text"
            value={profile.businessName}
          />
        </label>
      </div>
    </>
  );
}

function WorkspaceStep({
  businessName,
  value,
  onChange,
  mobile = false,
}: {
  businessName: string;
  value: string;
  onChange: (value: string) => void;
  mobile?: boolean;
}) {
  useEffect(() => {
    if (!value && businessName) onChange(businessName);
  }, [businessName, onChange, value]);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        {!mobile ? (
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <Building2Icon className="size-5" />
          </span>
        ) : null}
        <h1 className="font-medium text-2xl tracking-[-0.03em] sm:text-3xl">
          {mobile
            ? "Comment souhaitez-vous appeler votre espace ?"
            : "Comment s’appelle votre espace ?"}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-6 sm:text-base">
          C’est ici que vos canaux, clients et projets seront réunis.
        </p>
      </div>
      <label className="block">
        <span className="font-medium text-sm">Nom de l’espace</span>
        <input
          autoComplete="organization"
          autoFocus={!mobile}
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition-colors placeholder:text-slate-400 focus:border-[#6f91ec] focus:ring-2 focus:ring-[#4771df]/10 dark:border-slate-700 dark:bg-slate-950"
          maxLength={48}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex. Studio Wacil"
          type="text"
          value={value}
        />
        <span className="mt-2 block text-muted-foreground text-xs">
          Vous pourrez le modifier plus tard.
        </span>
      </label>
    </div>
  );
}

function ChannelsStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <>
      <StepHeading
        title="Quels canaux utilisez-vous ?"
        description="Choisissez vos canaux pour simplifier votre relation client."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {channelOptions.map((channel) => {
          const active = selected.includes(channel.id);
          return (
            <button
              className={cn(
                "group relative flex w-full items-center gap-3 border-b border-slate-100 bg-white px-4 py-4 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
                active && "bg-[#f6f8ff] dark:bg-[#141d35]",
              )}
              key={channel.id}
              onClick={() => onToggle(channel.id)}
              type="button"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-100">
                <Image
                  alt={channel.label}
                  height={20}
                  src={channel.logo}
                  width={20}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">
                  {channel.label}
                </span>
                <span className="mt-0.5 block text-muted-foreground text-xs">
                  {channel.detail}
                </span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors dark:bg-slate-700",
                  active
                    ? "bg-[#4771df] dark:bg-[#5f85ed]"
                    : "bg-slate-200 dark:bg-slate-700",
                )}
              >
                <span
                  className={cn(
                    "absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform",
                    active && "translate-x-5",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-muted-foreground text-xs">
        Modifiable à tout moment.
      </p>
    </>
  );
}

function ConnectChannelsStep({
  selected,
  connected,
  connecting = [],
  onConnect,
}: {
  selected: string[];
  connected: string[];
  connecting?: string[];
  onConnect: (value: string) => void;
}) {
  const channels = channelOptions.filter((channel) =>
    selected.includes(channel.id),
  );

  return (
    <>
      <StepHeading
        title="Connectez vos outils, on s’occupe du reste"
        description="Un clic par canal, et c’est prêt."
      />
      <div className="space-y-3">
        {channels.map((channel) => {
          const active = connected.includes(channel.id);
          const isConnecting = connecting.includes(channel.id);
          const isAvailable =
            channel.id === "gmail" || channel.id === "outlook";
          return (
            <div
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
              key={channel.id}
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-100">
                <Image
                  alt={channel.label}
                  height={20}
                  src={channel.logo}
                  width={20}
                />
                {active ? (
                  <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-950">
                    <CheckIcon className="size-2.5" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">
                  {channel.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    active ? "text-emerald-600" : "text-muted-foreground",
                  )}
                >
                  {active
                    ? "Connecté"
                    : isConnecting
                      ? "Connexion…"
                      : isAvailable
                        ? "À connecter"
                        : "Bientôt disponible"}
                </span>
              </span>
              <Button
                className={cn(
                  "min-w-28",
                  !active && "bg-[#4771df] text-white hover:bg-[#3c63c9]",
                )}
                disabled={active || isConnecting || !isAvailable}
                onClick={() => onConnect(channel.id)}
                size="sm"
                variant={active ? "outline" : "default"}
              >
                {active
                  ? "Connecté"
                  : isConnecting
                    ? "Connexion…"
                    : isAvailable
                      ? "Connecter"
                      : "Bientôt"}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}

const sourceScanMeta: Record<
  (typeof channelOptions)[number]["id"],
  { count: number; unit: string }
> = {
  gmail: { count: 130, unit: "mails" },
  outlook: { count: 86, unit: "mails" },
  whatsapp: { count: 47, unit: "messages" },
  slack: { count: 32, unit: "messages" },
};

const understandingSteps = [
  "Conversations regroupées",
  "Intentions comprises",
  "Relances repérées",
  "Priorités organisées",
];

function FirstValueScanStep({
  connected,
  onStatusChange,
}: {
  connected: string[];
  onStatusChange: (complete: boolean) => void;
}) {
  const connectedOptions = channelOptions.filter((channel) =>
    connected.includes(channel.id),
  );
  const connectedCount = connectedOptions.length;
  const sourceDuration = Math.max(connectedCount, 1) * 2500;
  const understandingDuration = 5000;
  const totalDuration = sourceDuration + understandingDuration;
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setElapsed(0);
    setComplete(false);
    onStatusChange(false);

    if (connectedCount === 0) {
      const emptyTimer = window.setTimeout(() => {
        setComplete(true);
        onStatusChange(true);
      }, 700);
      return () => window.clearTimeout(emptyTimer);
    }

    const startedAt = performance.now();
    let frameId = 0;
    const updateScan = (now: number) => {
      const nextElapsed = Math.min(totalDuration, now - startedAt);
      setElapsed(nextElapsed);

      if (nextElapsed >= totalDuration) {
        setComplete(true);
        onStatusChange(true);
        return;
      }
      frameId = window.requestAnimationFrame(updateScan);
    };
    frameId = window.requestAnimationFrame(updateScan);

    return () => window.cancelAnimationFrame(frameId);
  }, [connectedCount, onStatusChange, totalDuration]);

  const phase =
    complete || elapsed >= totalDuration
      ? "complete"
      : elapsed < sourceDuration
        ? "sources"
        : "understanding";
  const activeSourceIndex = Math.min(
    connectedCount - 1,
    Math.floor(elapsed / 2500),
  );
  const understandingElapsed = Math.max(0, elapsed - sourceDuration);
  const understandingIndex = Math.min(
    understandingSteps.length - 1,
    Math.floor(
      understandingElapsed /
        (understandingDuration / understandingSteps.length),
    ),
  );
  const mueExpression =
    phase === "complete"
      ? {
          alt: "Mue sourit, le brief est prêt",
          src: "/images/mue/mue-success.png",
        }
      : phase === "understanding"
        ? {
            alt: "Mue comprend vos échanges",
            src: "/images/mue/mue-insight.png",
          }
        : {
            alt: "Mue analyse vos sources",
            src: "/images/mue/mue-focus.png",
          };
  const mueExpressions = [
    "/images/mue/mue-focus.png",
    "/images/mue/mue-insight.png",
    "/images/mue/mue-success.png",
  ];
  const heading =
    phase === "sources"
      ? "Connexion à vos sources"
      : phase === "understanding"
        ? "Mue comprend vos échanges"
        : "Votre brief est prêt.";
  const eyebrow =
    phase === "sources"
      ? "Récupération"
      : phase === "understanding"
        ? "Compréhension"
        : "Terminé";

  return (
    <div className="mx-auto flex min-h-[510px] max-w-3xl flex-col justify-center py-3 text-center">
      <div className="relative mx-auto mb-4 h-20 w-24">
        {mueExpressions.map((src) => (
          <motion.div
            animate={{
              filter: src === mueExpression.src ? "blur(0px)" : "blur(2px)",
              opacity: src === mueExpression.src ? 1 : 0,
            }}
            className="absolute inset-0"
            initial={false}
            key={src}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              alt={src === mueExpression.src ? mueExpression.alt : ""}
              className="object-contain drop-shadow-[0_10px_16px_rgba(95,73,180,0.14)]"
              fill
              loading="eager"
              sizes="96px"
              src={src}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative h-[76px]">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="absolute inset-0"
            exit={{ filter: "blur(2px)", opacity: 0, y: -4 }}
            initial={{ filter: "blur(2px)", opacity: 0, y: 4 }}
            key={phase}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-medium text-[#4771df] text-sm">{eyebrow}</p>
            <h1 className="mt-2 font-medium text-3xl tracking-[-0.045em] sm:text-[2.45rem]">
              {heading}
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-8 min-h-[230px]">
        <AnimatePresence initial={false} mode="sync">
          {phase === "sources" ? (
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1 }}
              className="absolute inset-0 flex items-start justify-center gap-10 sm:gap-16"
              exit={{ filter: "blur(2px)", opacity: 0 }}
              initial={{ filter: "blur(2px)", opacity: 0 }}
              key="sources"
              transition={{ duration: 0.48 }}
            >
              {connectedOptions.map((channel, index) => {
                const meta = sourceScanMeta[channel.id];
                const localElapsed = elapsed - index * 2500;
                const localProgress = Math.max(
                  0,
                  Math.min(1, localElapsed / 2500),
                );
                const isActive = index === activeSourceIndex;
                const isComplete =
                  index < activeSourceIndex || localProgress >= 1;
                const visibleCount = Math.round(meta.count * localProgress);
                const circumference = 2 * Math.PI * 34;

                return (
                  <div
                    className={cn(
                      "w-28 transition-opacity duration-500",
                      !isActive && !isComplete && "opacity-35",
                    )}
                    key={channel.id}
                  >
                    <div className="relative mx-auto size-20">
                      <svg
                        aria-hidden="true"
                        className="-rotate-90 absolute inset-0 size-20"
                        viewBox="0 0 80 80"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          fill="none"
                          r="34"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          fill="none"
                          r="34"
                          stroke="currentColor"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference * (1 - localProgress)}
                          strokeLinecap="round"
                          strokeWidth="3"
                          className="text-emerald-500"
                        />
                      </svg>
                      <span className="absolute inset-2 flex items-center justify-center rounded-full bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)] dark:bg-slate-950">
                        <Image
                          alt={channel.label}
                          height={28}
                          src={channel.logo}
                          width={28}
                        />
                      </span>
                      {isComplete ? (
                        <motion.span
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-slate-950"
                          initial={{ opacity: 0, scale: 0.7 }}
                        >
                          <CheckIcon className="size-3.5" strokeWidth={3} />
                        </motion.span>
                      ) : null}
                    </div>
                    <p className="mt-4 font-medium text-sm">{channel.label}</p>
                    <p className="mt-1 h-5 text-muted-foreground text-xs tabular-nums">
                      {localProgress > 0
                        ? `${visibleCount} ${meta.unit}`
                        : "En attente"}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          ) : phase === "understanding" ? (
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1 }}
              className="absolute inset-0 mx-auto w-full max-w-sm text-left"
              exit={{ filter: "blur(2px)", opacity: 0 }}
              initial={{ filter: "blur(2px)", opacity: 0 }}
              key="understanding"
              transition={{ duration: 0.48 }}
            >
              <div className="space-y-1">
                {understandingSteps.map((label, index) => {
                  const done = index < understandingIndex;
                  const active = index === understandingIndex;
                  return (
                    <motion.div
                      animate={{ opacity: done || active ? 1 : 0.32 }}
                      className="flex h-12 items-center gap-3"
                      key={label}
                    >
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border border-slate-200 text-slate-300 transition-colors duration-500 dark:border-slate-700",
                          done &&
                            "border-emerald-500 bg-emerald-500 text-white",
                          active && "border-[#4771df] text-[#4771df]",
                        )}
                      >
                        {done ? (
                          <CheckIcon className="size-3.5" strokeWidth={3} />
                        ) : active ? (
                          <span className="size-2 animate-pulse rounded-full bg-[#4771df]" />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "text-muted-foreground text-sm transition-colors duration-500",
                          (done || active) && "text-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className="absolute inset-0 grid gap-3 sm:grid-cols-3"
              initial={{ filter: "blur(2px)", opacity: 0, y: 8 }}
              key="complete"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                {
                  Icon: MailIcon,
                  title: "12 réponses",
                  description: "Des clients attendent votre retour",
                  tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
                },
                {
                  Icon: Clock3Icon,
                  title: "5 relances",
                  description: "À ne pas laisser filer",
                  tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/40",
                },
                {
                  Icon: SparklesIcon,
                  title: "3 priorités",
                  description: "À traiter aujourd’hui",
                  tone: "bg-violet-50 text-violet-600 dark:bg-violet-950/40",
                },
              ].map(({ Icon, title, description, tone }, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border bg-white p-5 text-left shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)] dark:bg-slate-950"
                  initial={{ opacity: 0, y: 10 }}
                  key={title}
                  transition={{ delay: index * 0.09 }}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      tone,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-5 font-medium text-xl tracking-[-0.03em]">
                    {title}
                  </p>
                  <p className="mt-1.5 text-muted-foreground text-xs leading-5">
                    {description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FirstScanStep({ channelCount }: { channelCount: number }) {
  const [period, setPeriod] = useState(30);
  const scopeRows = [
    {
      Icon: MailIcon,
      label: "Sources incluses",
      value: `${channelCount} ${channelCount > 1 ? "sources sélectionnées" : "source sélectionnée"}`,
    },
    {
      Icon: Clock3Icon,
      label: "Période parcourue",
      value: `${period} derniers jours`,
    },
    {
      Icon: ShieldCheckIcon,
      label: "Actions autorisées",
      value: "Lecture et suggestions uniquement",
    },
  ];

  return (
    <>
      <StepHeading
        title="Choisissez une période"
        description="Elle servira à créer votre premier brief."
      />
      <div className="mb-4 flex rounded-xl bg-muted p-1">
        {[7, 30, 90].map((value) => (
          <button
            className={cn(
              "flex-1 rounded-lg px-3 py-2 font-medium text-muted-foreground text-xs transition-all",
              period === value && "bg-background text-foreground shadow-sm",
            )}
            key={value}
            onClick={() => setPeriod(value)}
            type="button"
          >
            {value} jours
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border">
        {scopeRows.map(({ Icon, label, value }) => (
          <div
            className="flex items-center gap-3 border-b px-4 py-3.5 last:border-0"
            key={label}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted/60">
              <Icon className="size-4 text-blue-600" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-muted-foreground text-[11px]">
                {label}
              </span>
              <span className="mt-0.5 block font-medium text-sm">{value}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
        <div className="flex gap-3">
          <SparklesIcon className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-sm">Un brief, puis votre décision</p>
            <p className="mt-1 text-muted-foreground text-xs leading-5">
              Après le scan, Mue affiche les sources de chaque suggestion. Rien
              n’est envoyé et aucune tâche n’est créée automatiquement.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ReadyStep({
  channelCount,
  onOpen,
}: {
  channelCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckIcon className="size-6" />
      </span>
      <h1 className="mt-6 font-semibold text-3xl tracking-tight sm:text-4xl">
        Tout est prêt.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground text-sm leading-6 sm:text-base">
        {channelCount} sources connectées. Votre premier brief vous attend.
      </p>
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left dark:border-blue-950 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <SparklesIcon className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-sm">Votre essai gratuit est lancé</p>
            <p className="mt-1 text-muted-foreground text-xs leading-5">
              14 jours pour tester Freescale. Vous pourrez ensuite choisir
              sereinement entre les plans 19 € et 29 € par mois.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
        {[
          [BriefcaseBusinessIcon, "3 projets", "identifiés"],
          [MailIcon, "18 messages", "à parcourir"],
          [SparklesIcon, "5 actions", "proposées par Mue"],
        ].map(([Icon, value, label]) => (
          <div className="rounded-xl bg-muted/35 p-4" key={value as string}>
            <Icon className="size-4 text-blue-600" />
            <p className="mt-3 font-semibold text-sm">{value as string}</p>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {label as string}
            </p>
          </div>
        ))}
      </div>
      <Button className="mt-8" onClick={onOpen} size="lg">
        Ouvrir Freescale
        <ArrowRightIcon className="size-4" />
      </Button>
      <p className="mt-3 text-muted-foreground text-[11px]">
        Vous gardez la main sur chaque action.
      </p>
    </div>
  );
}
