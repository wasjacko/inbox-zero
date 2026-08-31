"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";

type DayEntry = {
  amount: number;
};

type DayCard = {
  date: Date;
  id: string;
};

type Currency = "EUR" | "USD" | "GBP" | "CHF";

export const MONEY_STORAGE_KEY = "freescale-daily-money-v2";
const TIMELINE_START_KEY = "freescale-money-timeline-start-v1";
const DAY_MS = 86_400_000;
const fallbackRates: Record<Currency, number> = {
  EUR: 1,
  USD: 1.17,
  GBP: 0.86,
  CHF: 0.93,
};
const currencies: Currency[] = ["EUR", "USD", "GBP", "CHF"];

export function DailyMoneyJournal() {
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [parisToday, setParisToday] = useState(getParisToday);
  const [timelineStart, setTimelineStart] = useState(() =>
    localDateId(getParisToday()),
  );
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftDirection, setDraftDirection] = useState<"gain" | "loss">("gain");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [rates, setRates] = useState(fallbackRates);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const days = useMemo(() => {
    const start = parseLocalDate(timelineStart);
    const count = Math.max(calendarDayDifference(parisToday, start) + 1, 1);
    return buildDays(count, parisToday).reverse();
  }, [parisToday, timelineStart]);
  const monthGroups = useMemo(() => groupDaysByMonth(days), [days]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency],
  );

  useEffect(() => {
    const savedEntries = window.localStorage.getItem(MONEY_STORAGE_KEY);
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }

    const savedStart = window.localStorage.getItem(TIMELINE_START_KEY);
    if (savedStart) {
      setTimelineStart(savedStart);
    } else {
      const start = localDateId(getParisToday());
      window.localStorage.setItem(TIMELINE_START_KEY, start);
      setTimelineStart(start);
    }
  }, []);

  useEffect(() => {
    const refreshParisDay = () => {
      const nextParisDay = getParisToday();
      setParisToday((currentParisDay) =>
        localDateId(currentParisDay) === localDateId(nextParisDay)
          ? currentParisDay
          : nextParisDay,
      );
    };
    const timer = window.setInterval(refreshParisDay, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,CHF")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { rates?: Partial<Record<Currency, number>> }) => {
        setRates({ ...fallbackRates, ...data.rates, EUR: 1 });
      })
      .catch(() => setRates(fallbackRates));
  }, []);

  const openEntry = (day: DayCard) => {
    const current = entries[day.id];
    setEditingDay(day.id);
    setDraftDirection((current?.amount ?? 0) < 0 ? "loss" : "gain");
    setDraftAmount(
      current
        ? String(Math.round(Math.abs(current.amount) * rates[currency]))
        : "",
    );
  };

  const saveEntry = () => {
    if (!editingDay) return;
    const parsedAmount = Number(draftAmount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    const amountInEuros = parsedAmount / rates[currency];
    const nextEntries = {
      ...entries,
      [editingDay]: {
        amount: draftDirection === "gain" ? amountInEuros : -amountInEuros,
      },
    };
    setEntries(nextEntries);
    window.localStorage.setItem(MONEY_STORAGE_KEY, JSON.stringify(nextEntries));
    setEditingDay(null);
  };

  return (
    <main className="dark min-h-svh bg-[#0c0c0b] text-[#f2f2ed] selection:bg-[#d7ff67] selection:text-black">
      <header className="sticky top-0 z-30 border-white/8 border-b bg-[#0c0c0b]/88 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <p className="font-[family-name:var(--font-title)] text-[13px] text-[#e8e8e2] tracking-[0.16em]">
            JOURNAL D’ARGENT
          </p>

          <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/8 bg-[#171716] p-1">
            {(
              [
                ["journal", "Journal", "/"],
                ["graph", "Graphique", "/graphique"],
              ] as const
            ).map(([value, label, href]) => (
              <Link
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-medium text-xs transition",
                  value === "journal"
                    ? "bg-[#eeeeea] text-[#11110f]"
                    : "text-[#888880] hover:text-[#d1d1ca]",
                )}
                href={href}
                key={value}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="relative">
            <button
              aria-expanded={currencyOpen}
              className="flex items-center gap-2 rounded-lg border border-white/8 bg-[#171716] px-3 py-2 font-medium text-xs transition hover:border-white/15"
              onClick={() => setCurrencyOpen((open) => !open)}
              type="button"
            >
              {currency}
              <ChevronDownIcon
                className={cn(
                  "size-3.5 text-[#92928a] transition",
                  currencyOpen && "rotate-180",
                )}
              />
            </button>
            {currencyOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-40 min-w-24 overflow-hidden rounded-xl border border-white/10 bg-[#191918] p-1 shadow-[0_18px_50px_rgba(0,0,0,.5)]">
                {currencies.map((item) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-medium text-xs transition hover:bg-white/6",
                      currency === item ? "text-[#d7ff67]" : "text-[#aaa9a1]",
                    )}
                    key={item}
                    onClick={() => {
                      setCurrency(item);
                      setCurrencyOpen(false);
                    }}
                    type="button"
                  >
                    {item}
                    {currency === item && <CheckIcon className="size-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1760px] px-5 pt-5 pb-24 md:px-8 md:pt-7">
        <div className="space-y-10">
          {monthGroups.map((group) => (
            <section key={group.id}>
              <div className="mb-3 flex items-center">
                <h2 className="inline-flex h-7 items-center rounded-full border border-white/80 bg-[#eeeeea] px-3 font-medium text-[#11110f] text-[11px] capitalize tracking-[0.01em]">
                  {formatMonthHeading(group.days[0].date)}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {group.days.map((day) => (
                  <MoneyDayCard
                    available={day.id <= localDateId(parisToday)}
                    currencyFormatter={currencyFormatter}
                    day={day}
                    entry={entries[day.id]}
                    key={day.id}
                    onOpen={() => openEntry(day)}
                    rate={rates[currency]}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-[4px] sm:items-center">
          <button
            aria-label="Fermer"
            className="absolute inset-0"
            onClick={() => setEditingDay(null)}
            type="button"
          />
          <section className="relative z-10 w-full max-w-[440px] rounded-[22px] border border-white/10 bg-[#171716] p-6 text-[#f2f2ed] shadow-[0_24px_80px_rgba(0,0,0,.6)]">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[#898981] text-xs">Bilan du jour</p>
                <h2 className="font-[family-name:var(--font-title)] text-2xl tracking-[-0.035em]">
                  {formatLongDate(editingDay)}
                </h2>
              </div>
              <div className="grid size-9 place-items-center rounded-full bg-[#262624]">
                <TrendingUpIcon className="size-4" />
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#0f0f0e] p-1">
              <button
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-[9px] font-medium text-sm transition",
                  draftDirection === "gain"
                    ? "bg-[#282824] text-[#72e4a7] shadow-sm"
                    : "text-[#888880]",
                )}
                onClick={() => setDraftDirection("gain")}
                type="button"
              >
                <PlusIcon className="size-4" /> J’ai gagné
              </button>
              <button
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-[9px] font-medium text-sm transition",
                  draftDirection === "loss"
                    ? "bg-[#282824] text-[#ff8e86] shadow-sm"
                    : "text-[#888880]",
                )}
                onClick={() => setDraftDirection("loss")}
                type="button"
              >
                <MinusIcon className="size-4" /> J’ai perdu
              </button>
            </div>

            <label
              className="mb-1.5 block font-medium text-xs"
              htmlFor="daily-amount"
            >
              Montant
            </label>
            <div className="relative mb-4">
              <Input
                autoFocus
                className="h-14 rounded-xl border-white/10 bg-[#10100f] pr-12 font-[family-name:var(--font-title)] text-2xl text-[#f2f2ed] shadow-none focus-visible:ring-[#d7ff67]/30"
                id="daily-amount"
                inputMode="decimal"
                onChange={(event) => setDraftAmount(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && saveEntry()}
                placeholder="0"
                value={draftAmount}
              />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 font-medium text-[#8f8f87]">
                {currencySymbol(currency)}
              </span>
            </div>

            <Button
              className="mt-6 h-12 w-full rounded-xl bg-[#d7ff67] text-[#11110f] hover:bg-[#c8f054]"
              onClick={saveEntry}
            >
              <CheckIcon className="mr-2 size-4" />
              Enregistrer ma journée
            </Button>
          </section>
        </div>
      )}
    </main>
  );
}

function MoneyDayCard({
  available,
  currencyFormatter,
  day,
  entry,
  onOpen,
  rate,
}: {
  available: boolean;
  currencyFormatter: Intl.NumberFormat;
  day: DayCard;
  entry?: DayEntry;
  onOpen: () => void;
  rate: number;
}) {
  const positive = (entry?.amount ?? 0) >= 0;
  return (
    <button
      className={cn(
        "group relative flex min-h-[148px] flex-col overflow-hidden rounded-[15px] border p-4 text-left transition-colors",
        available
          ? "border-white/8 bg-[#151514] hover:border-white/15 hover:bg-[#191918]"
          : "cursor-default border-white/5 bg-[#111110] text-white/30",
      )}
      disabled={!available}
      onClick={available ? onOpen : undefined}
      type="button"
    >
      <p className="font-[family-name:var(--font-title)] text-[#d4d4ce] text-[28px] tracking-[-0.045em]">
        {day.date.getDate()}
      </p>

      <div className="mt-auto">
        {entry ? (
          <p
            className={cn(
              "font-[family-name:var(--font-title)] text-2xl tracking-[-0.045em]",
              positive ? "text-[#67d99b]" : "text-[#f27d75]",
            )}
          >
            {entry.amount > 0 ? "+" : "−"}
            {currencyFormatter.format(Math.abs(entry.amount) * rate)}
          </p>
        ) : available ? (
          <div className="grid size-7 place-items-center rounded-full border border-white/8 text-[#64645f] transition-colors group-hover:border-white/15 group-hover:text-[#96968e]">
            <PlusIcon className="size-3.5" />
          </div>
        ) : (
          <span className="size-7" />
        )}
      </div>
    </button>
  );
}

function buildDays(count: number, today = getParisToday()): DayCard[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return { date, id: localDateId(date) };
  });
}

function formatMonthHeading(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
  }).format(date);
}

function formatLongDate(dateId: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateId}T12:00:00`));
}

function groupDaysByMonth(days: DayCard[]) {
  const groups: Array<{ id: string; days: DayCard[] }> = [];
  for (const day of days) {
    const id = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}`;
    const currentGroup = groups.at(-1);
    if (currentGroup?.id === id) currentGroup.days.push(day);
    else groups.push({ id, days: [day] });
  }
  return groups;
}

function localDateId(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getParisToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12,
  );
}

function parseLocalDate(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function calendarDayDifference(laterDate: Date, earlierDate: Date) {
  const later = Date.UTC(
    laterDate.getFullYear(),
    laterDate.getMonth(),
    laterDate.getDate(),
  );
  const earlier = Date.UTC(
    earlierDate.getFullYear(),
    earlierDate.getMonth(),
    earlierDate.getDate(),
  );
  return Math.floor((later - earlier) / DAY_MS);
}

function currencySymbol(currency: Currency) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value;
}
