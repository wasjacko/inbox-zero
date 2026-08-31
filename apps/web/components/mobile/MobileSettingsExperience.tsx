"use client";

import {
  BellIcon,
  Building2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  type MailIcon,
  MoonIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  UserRoundIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { toastError, toastSuccess } from "@/components/Toast";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type SettingsSection =
  | "account"
  | "billing"
  | "mue"
  | "appearance"
  | "advanced";
type Theme = "Clair" | "Sombre" | "Système";
type Density = "Confortable" | "Compacte";

type MobileSettingsPreferences = {
  replySuggestions: boolean;
  actionValidation: boolean;
  dailyBrief: boolean;
  productNews: boolean;
  protectData: boolean;
  theme: Theme;
  density: Density;
};

const mobileSettingsStorageKey = "freescale:mobile-settings:v1";
const defaultMobileSettings: MobileSettingsPreferences = {
  replySuggestions: true,
  actionValidation: true,
  dailyBrief: true,
  productNews: false,
  protectData: true,
  theme: "Système",
  density: "Confortable",
};

function isTheme(value: unknown): value is Theme {
  return value === "Clair" || value === "Sombre" || value === "Système";
}

function isDensity(value: unknown): value is Density {
  return value === "Confortable" || value === "Compacte";
}

function toAppTheme(theme: Theme) {
  if (theme === "Clair") return "light";
  if (theme === "Sombre") return "dark";
  return "system";
}

function applyMobileDensity(density: Density) {
  document.documentElement.dataset.mobileDensity =
    density === "Compacte" ? "compact" : "comfortable";
}

function readMobileSettings(): MobileSettingsPreferences {
  try {
    const saved = window.localStorage.getItem(mobileSettingsStorageKey);
    if (!saved) return defaultMobileSettings;

    const value = JSON.parse(saved) as Partial<MobileSettingsPreferences>;
    return {
      replySuggestions:
        typeof value.replySuggestions === "boolean"
          ? value.replySuggestions
          : defaultMobileSettings.replySuggestions,
      actionValidation:
        typeof value.actionValidation === "boolean"
          ? value.actionValidation
          : defaultMobileSettings.actionValidation,
      dailyBrief:
        typeof value.dailyBrief === "boolean"
          ? value.dailyBrief
          : defaultMobileSettings.dailyBrief,
      productNews:
        typeof value.productNews === "boolean"
          ? value.productNews
          : defaultMobileSettings.productNews,
      protectData:
        typeof value.protectData === "boolean"
          ? value.protectData
          : defaultMobileSettings.protectData,
      theme: isTheme(value.theme) ? value.theme : defaultMobileSettings.theme,
      density: isDensity(value.density)
        ? value.density
        : defaultMobileSettings.density,
    };
  } catch {
    return defaultMobileSettings;
  }
}

const sections: Array<{
  id: SettingsSection;
  icon: typeof MailIcon;
  label: string;
  detail: string;
}> = [
  {
    id: "account",
    icon: UserRoundIcon,
    label: "Compte et messagerie",
    detail: "Profil et canaux connectés",
  },
  {
    id: "billing",
    icon: CreditCardIcon,
    label: "Plan et facturation",
    detail: "Abonnement et paiements",
  },
  {
    id: "mue",
    icon: SparklesIcon,
    label: "Mue et intelligence artificielle",
    detail: "Suggestions et validation",
  },
  {
    id: "appearance",
    icon: Settings2Icon,
    label: "Apparence",
    detail: "Thème et densité",
  },
  {
    id: "advanced",
    icon: ShieldCheckIcon,
    label: "Options avancées",
    detail: "Notifications et confidentialité",
  },
];

export function MobileSettingsExperience() {
  const { setTheme: setAppTheme } = useTheme();
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("mobileSection");
  const activeSection = sections.some(({ id }) => id === rawSection)
    ? (rawSection as SettingsSection)
    : null;
  const [replySuggestions, setReplySuggestions] = useState(true);
  const [actionValidation, setActionValidation] = useState(true);
  const [dailyBrief, setDailyBrief] = useState(true);
  const [productNews, setProductNews] = useState(false);
  const [protectData, setProtectData] = useState(true);
  const [theme, setThemeChoice] = useState<Theme>("Système");
  const [density, setDensity] = useState<Density>("Confortable");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savedSettings, setSavedSettings] = useState(
    JSON.stringify(defaultMobileSettings),
  );
  const currentSettings = useMemo<MobileSettingsPreferences>(
    () => ({
      replySuggestions,
      actionValidation,
      dailyBrief,
      productNews,
      protectData,
      theme,
      density,
    }),
    [
      actionValidation,
      dailyBrief,
      density,
      productNews,
      protectData,
      replySuggestions,
      theme,
    ],
  );
  const currentSettingsSnapshot = JSON.stringify(currentSettings);
  const settingsChanged = currentSettingsSnapshot !== savedSettings;

  useEffect(() => {
    const saved = readMobileSettings();
    setReplySuggestions(saved.replySuggestions);
    setActionValidation(saved.actionValidation);
    setDailyBrief(saved.dailyBrief);
    setProductNews(saved.productNews);
    setProtectData(saved.protectData);
    setThemeChoice(saved.theme);
    setDensity(saved.density);
    setAppTheme(toAppTheme(saved.theme));
    applyMobileDensity(saved.density);
    setSavedSettings(JSON.stringify(saved));
    setSettingsLoaded(true);
  }, [setAppTheme]);

  const saveSettings = () => {
    try {
      window.localStorage.setItem(
        mobileSettingsStorageKey,
        currentSettingsSnapshot,
      );
      setAppTheme(toAppTheme(theme));
      applyMobileDensity(density);
      setSavedSettings(currentSettingsSnapshot);
      toastSuccess({ description: "Préférences enregistrées." });
    } catch {
      toastError({
        description:
          "Impossible d’enregistrer les préférences sur cet appareil.",
      });
    }
  };

  if (!activeSection) return <SettingsIndex />;

  const active = sections.find(({ id }) => id === activeSection);
  return (
    <section
      aria-label={active?.label ?? "Paramètres"}
      className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] scroll-mt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] bg-background pb-28 lg:hidden"
      id="mobile-main-content"
      tabIndex={-1}
    >
      <header className="px-4 pb-5 pt-5">
        <Link
          className="mobile-touch-target -ml-2 inline-flex items-center gap-1 rounded-xl px-2 text-muted-foreground text-sm active:bg-muted"
          href="/settings"
        >
          <ChevronLeftIcon className="size-4" /> Paramètres
        </Link>
        <h1 className="mt-3 font-semibold text-2xl tracking-tight">
          {active?.label}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">{active?.detail}</p>
      </header>

      <div className="px-4">
        {activeSection === "account" ? <AccountSettings /> : null}
        {activeSection === "billing" ? <BillingSettings /> : null}
        {activeSection === "mue" ? (
          <div className="space-y-4">
            <SettingToggle
              detail="Mue prépare une proposition dans vos échanges."
              enabled={replySuggestions}
              icon={SparklesIcon}
              label="Suggestions de réponses"
              onToggle={() => setReplySuggestions((current) => !current)}
            />
            <SettingToggle
              detail="Votre accord reste nécessaire avant chaque action."
              enabled={actionValidation}
              icon={ShieldCheckIcon}
              label="Toujours demander validation"
              onToggle={() => setActionValidation((current) => !current)}
            />
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-950">
              <p className="font-medium text-sm">
                Mue reste sous votre contrôle
              </p>
              <p className="mt-1 text-blue-900/70 text-xs leading-5">
                Les suggestions n’envoient, ne modifient et ne suppriment rien
                sans validation explicite.
              </p>
            </div>
          </div>
        ) : null}
        {activeSection === "appearance" ? (
          <div className="space-y-6">
            <ChoiceGroup
              icon={theme === "Sombre" ? MoonIcon : SunIcon}
              label="Thème"
              onChange={setThemeChoice}
              options={["Clair", "Sombre", "Système"]}
              value={theme}
            />
            <ChoiceGroup
              icon={Settings2Icon}
              label="Densité d’affichage"
              onChange={setDensity}
              options={["Confortable", "Compacte"]}
              value={density}
            />
          </div>
        ) : null}
        {activeSection === "advanced" ? (
          <div className="space-y-4">
            <SettingToggle
              detail="Recevoir un résumé des priorités chaque matin."
              enabled={dailyBrief}
              icon={BellIcon}
              label="Brief quotidien"
              onToggle={() => setDailyBrief((current) => !current)}
            />
            <SettingToggle
              detail="Découvrir les améliorations importantes de Freescale."
              enabled={productNews}
              icon={ZapIcon}
              label="Nouveautés produit"
              onToggle={() => setProductNews((current) => !current)}
            />
            <SettingToggle
              detail="Masquer les contenus sensibles dans les aperçus."
              enabled={protectData}
              icon={ShieldCheckIcon}
              label="Protéger les aperçus"
              onToggle={() => setProtectData((current) => !current)}
            />
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom))] z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Button
          className="min-h-11 w-full"
          disabled={!settingsLoaded || !settingsChanged}
          onClick={saveSettings}
        >
          {settingsChanged ? "Enregistrer" : "Enregistré"}
        </Button>
      </div>
    </section>
  );
}

function SettingsIndex() {
  return (
    <section
      aria-label="Paramètres"
      className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] scroll-mt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] bg-background pb-24 lg:hidden"
      id="mobile-main-content"
      tabIndex={-1}
    >
      <header className="px-4 pb-5 pt-6">
        <h1 className="font-semibold text-3xl tracking-tight">Paramètres</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Compte et préférences
        </p>
      </header>
      <section className="px-4">
        <div className="mb-5 flex items-center gap-3 rounded-2xl border bg-card p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-950 font-medium text-white">
            W
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm">Wacil Ait</strong>
            <span className="block truncate text-muted-foreground text-xs">
              webwacilait@gmail.com
            </span>
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 text-xs">
            Actif
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {sections.map(({ id, icon: Icon, label, detail }, index) => (
            <Link
              className={cn(
                "mobile-touch-target flex min-h-[76px] items-center gap-3 px-3 active:bg-muted",
                index < sections.length - 1 && "border-b",
              )}
              href={`/settings?mobileSection=${id}`}
              key={id}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block font-medium text-sm">{label}</strong>
                <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                  {detail}
                </span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <Link
          className="mobile-touch-target mt-4 flex items-center gap-3 rounded-2xl border bg-card px-3 text-sm active:bg-muted"
          href="/organization"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-muted">
            <Building2Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">Gérer mon espace</span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </Link>
      </section>
    </section>
  );
}

function AccountSettings() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-4">
        <p className="font-medium text-sm">Profil</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-slate-950 text-white">
            W
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm">Wacil Ait</strong>
            <span className="block truncate text-muted-foreground text-xs">
              webwacilait@gmail.com
            </span>
          </span>
          <Button size="sm" variant="outline">
            Modifier
          </Button>
        </div>
      </div>
      <div>
        <h2 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
          Comptes connectés
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <ConnectedAccount icon={<Gmail className="size-5" />} name="Gmail" />
          <ConnectedAccount
            icon={<Outlook className="size-5" />}
            name="Outlook"
          />
        </div>
      </div>
    </div>
  );
}

function ConnectedAccount({
  icon,
  name,
}: {
  icon: React.ReactNode;
  name: string;
}) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 border-b px-3 last:border-b-0">
      <span className="grid size-10 place-items-center rounded-xl bg-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{name}</strong>
        <span className="text-emerald-600 text-xs">Connecté</span>
      </span>
      <Button size="sm" variant="ghost">
        Gérer
      </Button>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sm">Plan Freescale annuel</p>
            <p className="mt-1 text-muted-foreground text-xs">19 € / mois</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs">
            Actif
          </span>
        </div>
        <p className="mt-4 text-muted-foreground text-sm leading-5">
          228 € facturés une fois par an. Prochain renouvellement le 18 août
          2027.
        </p>
        <Button asChild className="mt-5 w-full" variant="outline">
          <Link href="/premium">Gérer le plan</Link>
        </Button>
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <p className="font-medium text-sm">Moyen de paiement</p>
        <p className="mt-2 text-muted-foreground text-sm">Visa •••• 4242</p>
      </div>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  detail,
  enabled,
  onToggle,
}: {
  icon: typeof MailIcon;
  label: string;
  detail: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={enabled}
      className="mobile-touch-target flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left"
      onClick={onToggle}
      type="button"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{label}</strong>
        <span className="mt-1 block text-muted-foreground text-xs leading-4">
          {detail}
        </span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors",
          enabled && "bg-blue-600",
        )}
      >
        <span
          className={cn(
            "absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
            enabled && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

function ChoiceGroup<T extends string>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: typeof MailIcon;
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 px-1 font-medium text-sm">
        <Icon className="size-4 text-muted-foreground" /> {label}
      </h2>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {options.map((option) => (
          <button
            aria-pressed={value === option}
            className={cn(
              "mobile-touch-target flex w-full items-center justify-between border-b px-4 text-sm last:border-b-0",
              value === option && "bg-muted/60",
            )}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
            {value === option ? (
              <CheckIcon className="size-4 text-blue-600" />
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
