"use client";

import type { LucideIcon } from "lucide-react";
import { Clock3Icon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { MobileEmptyState } from "@/components/mobile/MobilePrimitives";
import { cn } from "@/utils";

type MobileSearchScope = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

type MobileSearchResult = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  scope: string;
  href: string;
  Icon: LucideIcon;
  tone: string;
};

const recentSearches = [
  "Northstar",
  "Factures de juin",
  "Messages sans réponse",
];

export function MobileGlobalSearch({
  query,
  activeScope,
  scopes,
  results,
  onQueryChange,
  onScopeChange,
  onCancel,
  onResultClick,
}: {
  query: string;
  activeScope: string;
  scopes: readonly MobileSearchScope[];
  results: readonly MobileSearchResult[];
  onQueryChange: (query: string) => void;
  onScopeChange: (scope: string) => void;
  onCancel: () => void;
  onResultClick: () => void;
}) {
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  const resultsId = useId();
  const statusId = useId();
  const groupedResults = useMemo(
    () =>
      scopes
        .filter(({ id }) => id !== "all")
        .map((scope) => ({
          ...scope,
          results: results.filter((result) => result.scope === scope.id),
        }))
        .filter((group) => group.results.length > 0),
    [results, scopes],
  );

  return (
    <div className="flex h-dvh w-full min-w-0 max-w-full flex-col overflow-hidden bg-background lg:hidden">
      <header className="mobile-safe-top w-full min-w-0 max-w-full shrink-0 overflow-hidden border-b bg-background">
        <div className="mobile-safe-x-sm flex h-16 items-center gap-2">
          <label
            className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-muted px-3"
            role="search"
          >
            <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Rechercher dans Freescale</span>
            <input
              autoFocus
              autoComplete="off"
              aria-controls={resultsId}
              aria-describedby={statusId}
              aria-label="Rechercher dans Freescale"
              className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-base shadow-none outline-none placeholder:text-muted-foreground focus:border-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              enterKeyHint="search"
              inputMode="search"
              onChange={(event) => onQueryChange(event.currentTarget.value)}
              placeholder="Rechercher"
              spellCheck={false}
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="Effacer la recherche"
                className="mobile-touch-target -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-background"
                onClick={() => onQueryChange("")}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </label>
          <button
            className="mobile-touch-target shrink-0 rounded-xl px-1 font-medium text-sm text-blue-600 active:opacity-60"
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>
        </div>

        <div
          aria-label="Filtrer les résultats"
          className="scrollbar-none flex w-full min-w-0 max-w-full snap-x gap-2 overflow-x-auto px-4 pb-3"
          role="group"
        >
          {scopes.map(({ id, label, Icon }) => (
            <button
              aria-pressed={activeScope === id}
              className={cn(
                "mobile-touch-target flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 font-medium text-xs transition-colors",
                activeScope === id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground active:bg-muted",
              )}
              key={id}
              onClick={() => onScopeChange(id)}
              type="button"
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <section
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        id={resultsId}
      >
        {!query && activeScope === "all" && showRecentSearches ? (
          <section className="border-b px-4 py-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Recherches récentes</h2>
              <button
                className="mobile-touch-target -mr-2 px-2 text-muted-foreground text-xs"
                onClick={() => setShowRecentSearches(false)}
                type="button"
              >
                Effacer
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((recent) => (
                <button
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm active:bg-muted"
                  key={recent}
                  onClick={() => onQueryChange(recent)}
                  type="button"
                >
                  <Clock3Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{recent}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mobile-safe-bottom px-4 py-5">
          <p aria-live="polite" className="sr-only" id={statusId} role="status">
            {results.length} résultat{results.length === 1 ? "" : "s"}
            {query ? ` pour ${query}` : ""}
          </p>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-semibold text-sm">
              {query ? "Résultats" : "Récents dans votre espace"}
            </h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              {results.length} résultat{results.length === 1 ? "" : "s"}
            </span>
          </div>

          {groupedResults.length ? (
            <div className="space-y-6">
              {groupedResults.map(({ id, label, results: groupResults }) => (
                <section key={id}>
                  <h3 className="mb-1.5 px-1 font-medium text-muted-foreground text-[11px] uppercase tracking-[0.12em]">
                    {label}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    {groupResults.map((result, index) => {
                      const Icon = result.Icon;
                      return (
                        <Link
                          className={cn(
                            "flex min-h-[72px] items-center gap-3 px-3.5 py-3 active:bg-muted",
                            index !== groupResults.length - 1 && "border-b",
                          )}
                          href={result.href}
                          key={result.id}
                          onClick={onResultClick}
                        >
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-xl",
                              result.tone,
                            )}
                          >
                            <Icon className="size-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-medium text-sm">
                                {result.title}
                              </span>
                              <span className="shrink-0 text-muted-foreground text-[11px]">
                                {result.meta}
                              </span>
                            </span>
                            <span className="mt-1 line-clamp-2 block text-muted-foreground text-xs leading-4">
                              {result.detail}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <MobileEmptyState
              className="min-h-72 rounded-none border-0"
              description="Essayez un client, un projet ou quelques mots du message."
              icon={<SearchIcon className="size-5" />}
              title="Aucun résultat"
            />
          )}
        </div>
      </section>
    </div>
  );
}
