"use client";

import {
  CompassIcon,
  Maximize2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils";

type MueSheetHeight = "peek" | "half" | "full";
type MueMobileAction = "create" | "find" | "search" | "edit" | "plan";

const heights: Record<MueSheetHeight, string> = {
  peek: "h-[48dvh]",
  half: "h-[72dvh]",
  full: "h-[94dvh]",
};

const heightOrder: MueSheetHeight[] = ["peek", "half", "full"];

const actions = [
  { id: "create", label: "Créer", Icon: PlusIcon },
  { id: "find", label: "Trouver", Icon: CompassIcon },
  { id: "search", label: "Rechercher", Icon: SearchIcon },
  { id: "edit", label: "Modifier", Icon: PencilIcon },
  { id: "plan", label: "Planifier", Icon: SparklesIcon },
] as const;

const contextByPath: Array<{
  path: string;
  label: string;
  intro: string;
}> = [
  {
    path: "/channels-v4",
    label: "Canaux",
    intro:
      "Je peux retrouver un échange, préparer une réponse ou créer la prochaine action.",
  },
  {
    path: "/tasks",
    label: "Tâches",
    intro:
      "Je peux organiser, prioriser et planifier ce qui demande votre attention.",
  },
  {
    path: "/stats",
    label: "Relations clients",
    intro:
      "Je peux repérer les relations à suivre et préparer vos prochaines relances.",
  },
  {
    path: "/bulk-unsubscribe",
    label: "Désabonnement",
    intro:
      "Je peux retrouver les expéditeurs inutiles et préparer une sélection à valider.",
  },
  {
    path: "/bulk-archive",
    label: "Archivage",
    intro: "Je peux classer vos éléments et préparer un nettoyage contrôlé.",
  },
  {
    path: "/chat",
    label: "Accueil IA",
    intro:
      "Je garde le fil de vos échanges et fais ressortir ce qui mérite votre attention.",
  },
];

const genericProposals: Record<MueMobileAction, string[]> = {
  create: [
    "Créer les tâches des nouveaux messages",
    "Créer une relance client",
    "Créer un brief pour aujourd’hui",
  ],
  find: [
    "Trouver les messages sans réponse",
    "Trouver les clients à relancer",
    "Trouver les pièces jointes récentes",
  ],
  search: [
    "Rechercher une décision récente",
    "Rechercher un client ou un projet",
    "Rechercher dans tous mes canaux",
  ],
  edit: [
    "Modifier un brouillon",
    "Modifier la priorité d’une tâche",
    "Modifier les tags d’un échange",
  ],
  plan: [
    "Planifier mes réponses du jour",
    "Planifier mes prochaines relances",
    "Planifier ma semaine client",
  ],
};

type MobileMueExchange = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export function MobileMueSheet({
  open,
  onOpenChange,
  pathname,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  const [height, setHeight] = useState<MueSheetHeight>("half");
  const [selectedAction, setSelectedAction] = useState<MueMobileAction | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<MobileMueExchange[]>([]);
  const touchStartY = useRef<number | null>(null);

  const context =
    contextByPath.find(({ path }) => pathname === path) ??
    ({
      label: "cette page",
      intro:
        "Je peux vous aider à retrouver, comprendre et préparer la prochaine action.",
    } as const);

  const selectedActionLabel = useMemo(
    () => actions.find(({ id }) => id === selectedAction)?.label,
    [selectedAction],
  );
  const heightLabel =
    height === "peek"
      ? "aperçu"
      : height === "half"
        ? "demi-écran"
        : "plein écran";

  const changeHeight = (direction: "up" | "down") => {
    const currentIndex = heightOrder.indexOf(height);
    const nextIndex =
      direction === "up"
        ? Math.min(heightOrder.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    if (direction === "down" && currentIndex === 0) {
      onOpenChange(false);
      return;
    }
    setHeight(heightOrder[nextIndex]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt) return;

    const timestamp = Date.now();
    setExchanges((current) => [
      ...current,
      { id: timestamp, role: "user", content: prompt },
      {
        id: timestamp + 1,
        role: "assistant",
        content:
          "J’ai trouvé le bon contexte. Je vous prépare une proposition claire avant toute action.",
      },
    ]);
    setDraft("");
    setSelectedAction(null);
    setHeight("full");
  };

  return (
    <Sheet
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) setHeight("half");
      }}
      open={open}
    >
      <SheetContent
        aria-label="Panneau Mue"
        className={cn(
          "w-full max-w-none gap-0 overflow-hidden rounded-t-[28px] border-x-0 p-0 transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none [&>button]:hidden",
          heights[height],
        )}
        side="bottom"
      >
        <div
          className="shrink-0 touch-none pb-1 pt-2"
          onTouchEnd={(event) => {
            if (touchStartY.current === null) return;
            const distance =
              touchStartY.current - event.changedTouches[0].clientY;
            touchStartY.current = null;
            if (Math.abs(distance) < 44) return;
            changeHeight(distance > 0 ? "up" : "down");
          }}
          onTouchStart={(event) => {
            touchStartY.current = event.touches[0].clientY;
          }}
        >
          <button
            aria-label={`Panneau Mue en ${heightLabel}. Changer sa hauteur`}
            className="mobile-touch-target mx-auto grid h-6 w-16 place-items-center"
            onClick={() => changeHeight(height === "full" ? "down" : "up")}
            type="button"
          >
            <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </button>
        </div>

        <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-1 text-left">
          <div className="flex items-center gap-3">
            <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-violet-50">
              <Image
                alt="Mue"
                className="size-11 object-contain"
                height={44}
                loading="lazy"
                sizes="44px"
                src={
                  selectedAction || exchanges.length
                    ? "/images/mue/mue-focus.png"
                    : "/images/mue/mue-welcome.png"
                }
                width={44}
              />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base">Mue</SheetTitle>
              <SheetDescription className="truncate text-xs">
                Sur {context.label}
              </SheetDescription>
            </div>
            <button
              aria-label="Agrandir Mue"
              className="mobile-touch-target grid size-11 place-items-center rounded-full active:bg-muted"
              onClick={() => setHeight(height === "full" ? "half" : "full")}
              type="button"
            >
              <Maximize2Icon className="size-4.5" />
            </button>
            <button
              aria-label="Fermer Mue"
              className="mobile-touch-target grid size-11 place-items-center rounded-full active:bg-muted"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </SheetHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setSelectedAction(null);
          }}
        >
          <p aria-live="polite" className="sr-only" role="status">
            {exchanges.length
              ? `Mue a répondu. ${exchanges.at(-1)?.content}`
              : `Mue est ouverte sur ${context.label}, en ${heightLabel}.`}
          </p>
          {!exchanges.length ? (
            <div className="rounded-2xl bg-muted/55 p-4">
              <p className="font-semibold">Comment puis-je t’aider ?</p>
              <p className="mt-1.5 text-muted-foreground text-sm leading-5">
                {context.intro}
              </p>
              <p className="mt-3 text-muted-foreground text-xs">
                Aucune action sans validation.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {exchanges.map((exchange) => (
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-5",
                    exchange.role === "user"
                      ? "ml-auto rounded-br-md bg-foreground text-background"
                      : "rounded-bl-md bg-muted",
                  )}
                  key={exchange.id}
                >
                  {exchange.content}
                </div>
              ))}
            </div>
          )}

          {selectedAction ? (
            <section className="mt-4">
              <p className="mb-2 font-medium text-muted-foreground text-xs">
                {selectedActionLabel}
              </p>
              <div className="overflow-hidden rounded-2xl border bg-card">
                {genericProposals[selectedAction].map((proposal, index) => (
                  <button
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm active:bg-muted",
                      index !== genericProposals[selectedAction].length - 1 &&
                        "border-b",
                    )}
                    key={proposal}
                    onClick={() => {
                      setDraft(proposal);
                      setHeight("full");
                    }}
                    type="button"
                  >
                    <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span>{proposal}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-background px-4 pt-3">
          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-3">
            {actions.map(({ id, label, Icon }) => (
              <button
                aria-pressed={selectedAction === id}
                className={cn(
                  "mobile-touch-target flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 font-medium text-xs",
                  selectedAction === id
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background active:bg-muted",
                )}
                key={id}
                onClick={() => {
                  setSelectedAction((current) => (current === id ? null : id));
                  if (height === "peek") setHeight("half");
                }}
                type="button"
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <form
            className="mobile-safe-bottom flex items-end gap-2 pb-3"
            onSubmit={submit}
          >
            <label className="flex min-h-11 min-w-0 flex-1 items-center rounded-2xl border bg-muted/35 px-3 py-2">
              <span className="sr-only">Demander à Mue</span>
              <textarea
                autoCapitalize="sentences"
                autoComplete="off"
                autoCorrect="on"
                className="max-h-28 min-h-6 w-full resize-none bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground"
                enterKeyHint="send"
                inputMode="text"
                onChange={(event) => setDraft(event.currentTarget.value)}
                onFocus={() => setHeight("full")}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Demander à Mue…"
                rows={1}
                spellCheck
                value={draft}
              />
            </label>
            <button
              aria-label="Envoyer à Mue"
              className="mobile-touch-target grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-30"
              disabled={!draft.trim()}
              type="submit"
            >
              <SendIcon className="size-4.5" />
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
