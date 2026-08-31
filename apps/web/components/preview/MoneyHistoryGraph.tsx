"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MONEY_STORAGE_KEY } from "@/components/preview/DailyMoneyJournal";
import { cn } from "@/utils";

type StoredEntry = { amount: number };
type ChartPoint = { date: string; balance: number; amount: number };

const chartWidth = 1200;
const chartHeight = 480;
const padding = { top: 34, right: 28, bottom: 48, left: 76 };
const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function MoneyHistoryGraph() {
  const [entries, setEntries] = useState<Record<string, StoredEntry>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedEntries = window.localStorage.getItem(MONEY_STORAGE_KEY);
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    setLoaded(true);
  }, []);

  const points = useMemo(() => {
    let balance = 0;
    return Object.entries(entries)
      .filter(([, entry]) => Number.isFinite(entry.amount))
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, entry]) => {
        balance += entry.amount;
        return { date, amount: entry.amount, balance };
      });
  }, [entries]);

  return (
    <main className="dark min-h-svh bg-[#0c0c0b] text-[#f2f2ed] selection:bg-[#d7ff67] selection:text-black">
      <GraphHeader />

      <div className="mx-auto max-w-[1760px] px-5 pt-10 pb-24 md:px-8 md:pt-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[#6f6f69] text-[11px] uppercase tracking-[0.12em]">
              Solde cumulé
            </p>
            <h1
              className={cn(
                "font-[family-name:var(--font-title)] text-5xl tracking-[-0.055em] md:text-7xl",
                (points.at(-1)?.balance ?? 0) < 0
                  ? "text-[#f27d75]"
                  : "text-[#f0f0eb]",
              )}
            >
              {money.format(points.at(-1)?.balance ?? 0)}
            </h1>
          </div>
          <p className="max-w-[260px] text-right text-[#74746e] text-xs leading-relaxed">
            Chaque saisie déplace la courbe depuis zéro. Les gains montent, les
            pertes descendent.
          </p>
        </div>

        <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#121211]">
          {loaded && points.length ? (
            <CumulativeChart points={points} />
          ) : (
            <div className="grid min-h-[520px] place-items-center px-6 text-center">
              <div>
                <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <p className="font-medium text-[#d7d7d1] text-sm">
                  La courbe commencera ici, à zéro.
                </p>
                <p className="mt-2 text-[#666660] text-xs">
                  Renseigne une première journée dans le journal.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function GraphHeader() {
  return (
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
                value === "graph"
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
        <span className="w-14 text-right font-medium text-[#6f6f69] text-xs">
          EUR
        </span>
      </div>
    </header>
  );
}

function CumulativeChart({ points }: { points: ChartPoint[] }) {
  const balances = [0, ...points.map((point) => point.balance)];
  const rawMin = Math.min(...balances);
  const rawMax = Math.max(...balances);
  const rawRange = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.15, 10);
  const min = rawMin - rawRange * 0.14;
  const max = rawMax + rawRange * 0.14;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const scaleX = (index: number) =>
    padding.left + (index / points.length) * innerWidth;
  const scaleY = (value: number) =>
    padding.top + ((max - value) / (max - min)) * innerHeight;
  const origin = { x: scaleX(0), y: scaleY(0) };
  const coordinates = [
    origin,
    ...points.map((point, index) => ({
      x: scaleX(index + 1),
      y: scaleY(point.balance),
    })),
  ];
  const linePath = coordinates
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L${coordinates.at(-1)?.x},${origin.y} L${origin.x},${origin.y} Z`;
  const zeroOffset = Math.min(
    100,
    Math.max(0, ((scaleY(0) - padding.top) / innerHeight) * 100),
  );
  const gridValues = Array.from(
    { length: 5 },
    (_, index) => max - (index / 4) * (max - min),
  );

  return (
    <div className="p-3 sm:p-6">
      <svg
        aria-label="Évolution cumulative du solde"
        className="h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="balance-line"
            x1="0"
            x2="0"
            y1={padding.top}
            y2={chartHeight - padding.bottom}
          >
            <stop offset={`${zeroOffset}%`} stopColor="#67d99b" />
            <stop offset={`${zeroOffset}%`} stopColor="#f27d75" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="balance-area"
            x1="0"
            x2="0"
            y1={padding.top}
            y2={chartHeight - padding.bottom}
          >
            <stop offset="0" stopColor="#67d99b" stopOpacity="0.15" />
            <stop
              offset={`${zeroOffset}%`}
              stopColor="#67d99b"
              stopOpacity="0.02"
            />
            <stop
              offset={`${zeroOffset}%`}
              stopColor="#f27d75"
              stopOpacity="0.03"
            />
            <stop offset="1" stopColor="#f27d75" stopOpacity="0.17" />
          </linearGradient>
        </defs>

        {gridValues.map((value) => (
          <g key={value}>
            <line
              stroke="rgba(255,255,255,.055)"
              strokeWidth="1"
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={scaleY(value)}
              y2={scaleY(value)}
            />
            <text
              fill="#5f5f59"
              fontSize="11"
              textAnchor="end"
              x={padding.left - 14}
              y={scaleY(value) + 4}
            >
              {compactMoney(value)}
            </text>
          </g>
        ))}

        <line
          stroke="rgba(255,255,255,.28)"
          strokeDasharray="4 5"
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={origin.y}
          y2={origin.y}
        />
        <path d={areaPath} fill="url(#balance-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#balance-line)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        <circle cx={origin.x} cy={origin.y} fill="#9b9b94" r="3.5" />
        {points.map((point, index) => {
          const coordinate = coordinates[index + 1];
          return (
            <circle
              className="cursor-help"
              cx={coordinate.x}
              cy={coordinate.y}
              fill={point.balance < 0 ? "#f27d75" : "#67d99b"}
              key={point.date}
              r="4"
              stroke="#121211"
              strokeWidth="2"
            >
              <title>{`${formatGraphDate(point.date)} · ${point.amount >= 0 ? "+" : ""}${money.format(point.amount)} · Solde ${money.format(point.balance)}`}</title>
            </circle>
          );
        })}

        <text
          fill="#6d6d67"
          fontSize="11"
          x={padding.left}
          y={chartHeight - 12}
        >
          {formatGraphDate(points[0].date)}
        </text>
        <text
          fill="#6d6d67"
          fontSize="11"
          textAnchor="end"
          x={chartWidth - padding.right}
          y={chartHeight - 12}
        >
          {formatGraphDate(points.at(-1)?.date ?? points[0].date)}
        </text>
      </svg>
    </div>
  );
}

function compactMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatGraphDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}
