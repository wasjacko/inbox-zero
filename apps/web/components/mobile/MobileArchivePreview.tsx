"use client";

import {
  ArchiveRestoreIcon,
  CheckIcon,
  FileTextIcon,
  FilterIcon,
  FolderArchiveIcon,
  HardDriveIcon,
  MoreHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toastSuccess } from "@/components/Toast";
import {
  MobileEmptyState,
  MobileSheet,
} from "@/components/mobile/MobilePrimitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils";

type ArchiveCategory = "Conversations" | "Documents" | "Images IA" | "Projets";
type ArchiveFilter = "Tout" | ArchiveCategory;
type ArchiveSort = "Poids" | "Date" | "Nom";

type ArchiveItem = {
  id: string;
  name: string;
  category: ArchiveCategory;
  sizeMb: number;
  size: string;
  date: string;
};

const initialItems: ArchiveItem[] = [
  {
    id: "conversation-orbe",
    name: "Projet Maison Orbe",
    category: "Conversations",
    sizeMb: 18.6,
    size: "18,6 Mo",
    date: "Archivé hier",
  },
  {
    id: "contract",
    name: "Contrat_Maison-Orbe_signé.pdf",
    category: "Documents",
    sizeMb: 42,
    size: "42 Mo",
    date: "Archivé lundi",
  },
  {
    id: "invoice",
    name: "Facture_2026-084.pdf",
    category: "Documents",
    sizeMb: 12.4,
    size: "12,4 Mo",
    date: "Archivé le 24 août",
  },
  {
    id: "campaign-images",
    name: "Campagne Noma · visuels",
    category: "Images IA",
    sizeMb: 68,
    size: "68 Mo",
    date: "Archivé le 21 août",
  },
  {
    id: "noma-context",
    name: "Contexte Campagne Noma Été",
    category: "Projets",
    sizeMb: 2.4,
    size: "2,4 Mo",
    date: "Archivé le 18 août",
  },
  {
    id: "atelier",
    name: "Audit Atelier 17",
    category: "Projets",
    sizeMb: 1.8,
    size: "1,8 Mo",
    date: "Archivé le 12 août",
  },
];

export function MobileArchivePreview() {
  const [items, setItems] = useState<ArchiveItem[]>(initialItems);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filter, setFilter] = useState<ArchiveFilter>("Tout");
  const [sort, setSort] = useState<ArchiveSort>("Poids");
  const [managedId, setManagedId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<Set<string>>(() => new Set());
  const managedItem = items.find(({ id }) => id === managedId) ?? null;
  const usedStorage = Math.round(
    items.reduce((total, item) => total + item.sizeMb, 43.8),
  );
  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => filter === "Tout" || item.category === filter)
        .sort((first, second) => {
          if (sort === "Nom")
            return first.name.localeCompare(second.name, "fr");
          if (sort === "Date")
            return (
              initialItems.findIndex(({ id }) => id === first.id) -
              initialItems.findIndex(({ id }) => id === second.id)
            );
          return second.sizeMb - first.sizeMb;
        }),
    [filter, items, sort],
  );

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const restoreItems = (ids: Set<string>) => {
    const count = ids.size;
    setItems((current) => current.filter((item) => !ids.has(item.id)));
    setSelected(new Set());
    setManagedId(null);
    toastSuccess({
      description: `${count} élément${count > 1 ? "s" : ""} restauré${count > 1 ? "s" : ""}.`,
    });
  };

  return (
    <section
      aria-label="Archivage"
      className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] scroll-mt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] bg-background pb-8 lg:hidden"
      id="mobile-main-content"
      tabIndex={-1}
    >
      <header className="px-4 pb-5 pt-6">
        <h1 className="font-semibold text-3xl tracking-tight">Archives</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {usedStorage} Mo utilisés sur 5 Go
        </p>
      </header>

      <section className="px-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <HardDriveIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <strong>Stockage Freescale</strong>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {usedStorage} Mo / 5 Go
                </span>
              </div>
              <Progress
                className="mt-3 h-2"
                value={(usedStorage / 5120) * 100}
              />
              <p className="mt-2 text-muted-foreground text-xs">
                Plus de 4,5 Go disponibles
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {(
          [
            "Tout",
            "Conversations",
            "Documents",
            "Images IA",
            "Projets",
          ] as ArchiveFilter[]
        ).map((category) => (
          <button
            className={cn(
              "mobile-touch-target shrink-0 rounded-full border px-3 text-sm",
              filter === category && "border-slate-950 bg-slate-950 text-white",
            )}
            key={category}
            onClick={() => setFilter(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <p className="text-muted-foreground text-xs">
          {visibleItems.length} élément{visibleItems.length > 1 ? "s" : ""}
        </p>
        <button
          className={cn(
            "mobile-touch-target flex items-center gap-2 rounded-xl border px-3 text-sm",
            sort !== "Poids" && "border-blue-600 bg-blue-50 text-blue-700",
          )}
          onClick={() => setFiltersOpen(true)}
          type="button"
        >
          <FilterIcon className="size-4" /> Trier
        </button>
      </div>

      <section className="px-4 pb-24">
        {visibleItems.length ? (
          <div className="overflow-hidden rounded-2xl border bg-card">
            {visibleItems.map((item, index) => {
              const checked = selected.has(item.id);
              return (
                <div
                  className={cn(
                    "flex min-h-[92px] items-center gap-3 p-3",
                    index < visibleItems.length - 1 && "border-b",
                  )}
                  data-mobile-defer
                  key={item.id}
                >
                  <button
                    aria-label={`${checked ? "Désélectionner" : "Sélectionner"} ${item.name}`}
                    className={cn(
                      "mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl border",
                      checked && "border-blue-600 bg-blue-600 text-white",
                    )}
                    onClick={() => toggleSelected(item.id)}
                    type="button"
                  >
                    {checked ? (
                      <CheckIcon className="size-4" />
                    ) : item.category === "Documents" ? (
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    ) : item.category === "Images IA" ? (
                      <SparklesIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <FolderArchiveIcon className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setManagedId(item.id)}
                    type="button"
                  >
                    <strong className="block truncate text-sm">
                      {item.name}
                    </strong>
                    <span className="mt-1 block truncate text-muted-foreground text-xs">
                      {item.category} · {item.size}
                    </span>
                    <span className="mt-1 block truncate text-muted-foreground text-[11px]">
                      {item.date}
                    </span>
                  </button>
                  <button
                    aria-label={`Gérer ${item.name}`}
                    className="mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl active:bg-muted"
                    onClick={() => setManagedId(item.id)}
                    type="button"
                  >
                    <MoreHorizontalIcon className="size-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <MobileEmptyState
            description="Cette catégorie ne contient plus aucun élément."
            icon={<FolderArchiveIcon className="size-5" />}
            title="Aucune archive ici"
          />
        )}
      </section>

      {selected.size ? (
        <div className="fixed inset-x-3 bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom)+.75rem)] z-30 grid grid-cols-1 gap-2 rounded-2xl border bg-background p-2 shadow-xl lg:hidden min-[360px]:grid-cols-2">
          <Button onClick={() => restoreItems(selected)} variant="outline">
            <ArchiveRestoreIcon className="size-4" /> Restaurer
          </Button>
          <Button
            onClick={() => setDeleteIds(new Set(selected))}
            variant="outline"
          >
            <Trash2Icon className="size-4" /> Supprimer
          </Button>
        </div>
      ) : null}

      <MobileSheet
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Afficher les archives
          </Button>
        }
        onOpenChange={setFiltersOpen}
        open={filtersOpen}
        title="Trier les archives"
      >
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
          {(["Poids", "Date", "Nom"] as ArchiveSort[]).map((option) => (
            <button
              className={cn(
                "mobile-touch-target rounded-xl border px-2 text-sm",
                sort === option && "border-blue-600 bg-blue-50 text-blue-700",
              )}
              key={option}
              onClick={() => setSort(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet
        onOpenChange={(open) => !open && setManagedId(null)}
        open={Boolean(managedItem)}
        title="Gérer l’archive"
      >
        {managedItem ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-muted p-4">
              <p className="font-medium text-sm">{managedItem.name}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {managedItem.category} · {managedItem.size} · {managedItem.date}
              </p>
            </div>
            <button
              className="mobile-touch-target flex w-full items-center gap-3 rounded-xl border px-3 text-sm"
              onClick={() => restoreItems(new Set([managedItem.id]))}
              type="button"
            >
              <ArchiveRestoreIcon className="size-4 text-muted-foreground" />
              Restaurer
            </button>
            <button
              className="mobile-touch-target flex w-full items-center gap-3 rounded-xl border border-rose-200 px-3 text-left text-rose-700 text-sm"
              onClick={() => {
                setManagedId(null);
                setDeleteIds(new Set([managedItem.id]));
              }}
              type="button"
            >
              <Trash2Icon className="size-4" /> Supprimer définitivement
            </button>
          </div>
        ) : null}
      </MobileSheet>

      <MobileSheet
        footer={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Button onClick={() => setDeleteIds(new Set())} variant="outline">
              Annuler
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                const count = deleteIds.size;
                setItems((current) =>
                  current.filter((item) => !deleteIds.has(item.id)),
                );
                setSelected(new Set());
                setDeleteIds(new Set());
                toastSuccess({
                  description: `${count} élément${count > 1 ? "s" : ""} supprimé${count > 1 ? "s" : ""}.`,
                });
              }}
            >
              Supprimer
            </Button>
          </div>
        }
        onOpenChange={(open) => !open && setDeleteIds(new Set())}
        open={deleteIds.size > 0}
        title="Suppression définitive"
      >
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-950">
          <p className="font-medium text-sm">Cette action est irréversible.</p>
          <p className="mt-2 text-rose-900/70 text-sm leading-5">
            {deleteIds.size} élément{deleteIds.size > 1 ? "s" : ""}{" "}
            {deleteIds.size > 1 ? "seront supprimés" : "sera supprimé"} sans
            possibilité de restauration.
          </p>
        </div>
      </MobileSheet>
    </section>
  );
}
