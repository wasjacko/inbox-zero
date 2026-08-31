"use client";

import {
  ArchiveIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FilePenLineIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import {
  MobileFullScreenDialog,
  MobileSheet,
} from "@/components/mobile/MobilePrimitives";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { TabSelect } from "@/components/TabSelect";
import { toastSuccess } from "@/components/Toast";
import { MutedText } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AutomationTab = "rules" | "test" | "history" | "settings";

const tabs = [
  { id: "rules", label: "Règles" },
  { id: "test", label: "Tester" },
  { id: "history", label: "Historique" },
  { id: "settings", label: "Préférences" },
] satisfies { id: AutomationTab; label: string }[];

const initialRules = [
  {
    id: "to-reply",
    name: "À répondre",
    prompt: "Messages auxquels je dois répondre",
    actions: ["Étiqueter", "Préparer un brouillon"],
    enabled: true,
  },
  {
    id: "awaiting-reply",
    name: "En attente de réponse",
    prompt: "Messages pour lesquels j’attends le retour d’un contact",
    actions: ["Étiqueter"],
    enabled: true,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    prompt: "Newsletters, blogs et publications",
    actions: ["Étiqueter"],
    enabled: true,
  },
  {
    id: "marketing",
    name: "Marketing",
    prompt: "Messages promotionnels sur des produits, ventes ou offres",
    actions: ["Étiqueter", "Archiver"],
    enabled: true,
  },
  {
    id: "receipt",
    name: "Factures et reçus",
    prompt: "Factures, reçus et confirmations de paiement",
    actions: ["Étiqueter"],
    enabled: false,
  },
];

export function AutomationPreview({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<AutomationTab>("rules");
  const [rules, setRules] = useState(initialRules);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <PageHeader
          title={embedded ? "Paramètres IA" : "Assistant IA"}
          video={{
            title: "Bien démarrer avec votre assistant IA",
            description:
              "Découvrez comment utiliser votre assistant IA pour étiqueter, archiver et organiser vos messages.",
            muxPlaybackId: "VwIP7UAw4MXDjkvmLjJzGsY00ee9jxIZVI952DoBBfp8",
          }}
        />
        {!embedded ? (
          <Button
            className="ml-4 hidden sm:inline-flex"
            size="sm"
            variant="outline"
          >
            <SparklesIcon className="mr-2 size-4" />
            Discuter avec Mue
          </Button>
        ) : null}
      </div>

      <div className="border-neutral-200 border-b pt-2">
        <TabSelect options={tabs} selected={tab} onSelect={setTab} />
      </div>

      <div className="mt-2 mb-10">
        {tab === "rules" ? (
          <RulesPreview rules={rules} setRules={setRules} />
        ) : null}
        {tab === "test" ? <TestPreview /> : null}
        {tab === "history" ? <HistoryPreview /> : null}
        {tab === "settings" ? <SettingsPreview /> : null}
      </div>
    </>
  );

  return (
    <>
      <MobileAutomationPreview
        embedded={embedded}
        rules={rules}
        setRules={setRules}
      />
      <div className="hidden lg:block">
        <PageWrapper>{content}</PageWrapper>
      </div>
    </>
  );
}

function MobileAutomationPreview({
  embedded,
  rules,
  setRules,
}: {
  embedded: boolean;
  rules: typeof initialRules;
  setRules: React.Dispatch<React.SetStateAction<typeof initialRules>>;
}) {
  const [activeTab, setActiveTab] = useState<AutomationTab>("rules");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftActions, setDraftActions] = useState<string[]>(["Étiqueter"]);
  const [mobileSettings, setMobileSettings] = useState({
    drafts: true,
    learning: true,
    summaries: true,
  });
  const selectedRule = rules.find(({ id }) => id === selectedRuleId);

  const toggleRule = (id: string, enabled: boolean) => {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
    );
  };

  const toggleDraftAction = (action: string) => {
    setDraftActions((current) =>
      current.includes(action)
        ? current.filter((item) => item !== action)
        : [...current, action],
    );
  };

  const createRule = () => {
    const name = draftName.trim();
    const prompt = draftPrompt.trim();
    if (!name || !prompt || !draftActions.length) return;

    setRules((current) => [
      ...current,
      {
        id: `mobile-rule-${Date.now()}`,
        name,
        prompt,
        actions: draftActions,
        enabled: true,
      },
    ]);
    setDraftName("");
    setDraftPrompt("");
    setDraftActions(["Étiqueter"]);
    setCreateOpen(false);
    toastSuccess({ description: "La règle est maintenant active." });
  };

  return (
    <main className="px-4 pb-28 pt-6 lg:hidden">
      <div className="mx-auto max-w-2xl">
        <header>
          <h1 className="font-semibold text-2xl tracking-tight">
            {embedded ? "Paramètres IA" : "Vos automatisations"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm leading-5">
            Mue organise vos messages selon les règles que vous activez.
          </p>
        </header>

        <nav
          aria-label="Sections des automatisations"
          className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-2">
            {tabs.map(({ id, label }) => (
              <button
                aria-current={activeTab === id ? "page" : undefined}
                className={cn(
                  "min-h-11 rounded-full border px-4 font-medium text-sm",
                  activeTab === id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "bg-background text-muted-foreground",
                )}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === "rules" ? (
          <section className="mt-6">
            <div className="grid gap-2 min-[390px]:grid-cols-2">
              <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
                <PlusIcon className="size-4" />
                Ajouter une règle
              </Button>
              <Button
                className="min-h-11"
                onClick={() =>
                  toastSuccess({
                    description:
                      "Les anciens messages sont en cours d’analyse.",
                  })
                }
                variant="outline"
              >
                <HistoryIcon className="size-4" />
                Analyser l’historique
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {rules.map((rule) => (
                <article
                  className={cn(
                    "rounded-2xl border bg-card p-4 transition-opacity",
                    !rule.enabled && "opacity-60",
                  )}
                  key={rule.id}
                >
                  <div className="flex min-h-11 items-start gap-3">
                    <button
                      aria-label={`Ouvrir la règle ${rule.name}`}
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedRuleId(rule.id)}
                      type="button"
                    >
                      <strong className="block font-medium text-sm">
                        {rule.name}
                      </strong>
                      <span className="mt-1 line-clamp-2 block text-muted-foreground text-xs leading-4">
                        {rule.prompt}
                      </span>
                    </button>
                    <span className="grid min-h-11 min-w-11 shrink-0 place-items-center">
                      <Switch
                        aria-label={`Activer ${rule.name}`}
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          toggleRule(rule.id, enabled)
                        }
                      />
                    </span>
                  </div>
                  <button
                    aria-label={`Voir les détails de ${rule.name}`}
                    className="mt-3 flex min-h-11 w-full items-center gap-2 border-t pt-3 text-left"
                    onClick={() => setSelectedRuleId(rule.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                      {rule.actions.map((action) => (
                        <Badge
                          color={action === "Archiver" ? "yellow" : "blue"}
                          key={action}
                        >
                          {action}
                        </Badge>
                      ))}
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "test" ? (
          <section className="mt-6 rounded-2xl border bg-card p-5">
            <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <SparklesIcon className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold text-lg">Tester vos règles</h2>
            <p className="mt-1 text-muted-foreground text-sm leading-5">
              Choisissez un ancien message pour voir quelle règle serait
              appliquée, sans rien modifier.
            </p>
            <Button
              className="mt-5 min-h-11 w-full"
              onClick={() =>
                toastSuccess({ description: "Message de test sélectionné." })
              }
            >
              Sélectionner un message
            </Button>
          </section>
        ) : null}

        {activeTab === "history" ? (
          <section className="mt-6 rounded-2xl border border-dashed p-8 text-center">
            <HistoryIcon className="mx-auto size-6 text-muted-foreground" />
            <h2 className="mt-3 font-medium">Aucune activité récente</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Les prochaines actions de vos règles apparaîtront ici.
            </p>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="mt-6 space-y-3">
            {[
              {
                id: "drafts" as const,
                name: "Brouillons de réponse",
                description: "Préparer des réponses à relire avant envoi.",
              },
              {
                id: "learning" as const,
                name: "Préférences apprises",
                description:
                  "Adapter les suggestions à votre façon de travailler.",
              },
              {
                id: "summaries" as const,
                name: "Résumé des messages",
                description: "Faire ressortir les informations importantes.",
              },
            ].map((setting) => (
              <button
                aria-pressed={mobileSettings[setting.id]}
                className="flex min-h-[76px] w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left"
                key={setting.id}
                onClick={() =>
                  setMobileSettings((current) => ({
                    ...current,
                    [setting.id]: !current[setting.id],
                  }))
                }
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{setting.name}</strong>
                  <span className="mt-1 block text-muted-foreground text-xs leading-4">
                    {setting.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors",
                    mobileSettings[setting.id] && "bg-blue-600",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                      mobileSettings[setting.id] && "translate-x-5",
                    )}
                  />
                </span>
              </button>
            ))}
          </section>
        ) : null}
      </div>

      <MobileSheet
        description="Décrivez simplement les messages concernés et ce que Mue doit faire."
        footer={
          <Button
            className="min-h-11 w-full"
            disabled={
              !draftName.trim() || !draftPrompt.trim() || !draftActions.length
            }
            onClick={createRule}
          >
            Activer la règle
          </Button>
        }
        onOpenChange={setCreateOpen}
        open={createOpen}
        title="Nouvelle règle"
      >
        <div className="space-y-4">
          <label className="block space-y-2" htmlFor="mobile-rule-name">
            <span className="font-medium text-sm">Nom</span>
            <Input
              className="min-h-11"
              id="mobile-rule-name"
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Ex. Demandes urgentes"
              value={draftName}
            />
          </label>
          <label className="block space-y-2" htmlFor="mobile-rule-prompt">
            <span className="font-medium text-sm">Instruction</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="mobile-rule-prompt"
              onChange={(event) => setDraftPrompt(event.target.value)}
              placeholder="Quels messages cette règle doit-elle reconnaître ?"
              value={draftPrompt}
            />
          </label>
          <fieldset>
            <legend className="font-medium text-sm">Actions</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Étiqueter", "Préparer un brouillon", "Archiver"].map(
                (action) => (
                  <button
                    aria-pressed={draftActions.includes(action)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm",
                      draftActions.includes(action) &&
                        "border-blue-600 bg-blue-50 text-blue-700",
                    )}
                    key={action}
                    onClick={() => toggleDraftAction(action)}
                    type="button"
                  >
                    {action}
                  </button>
                ),
              )}
            </div>
          </fieldset>
        </div>
      </MobileSheet>

      <MobileFullScreenDialog
        footer={
          <Button
            className="min-h-11 w-full"
            onClick={() => setSelectedRuleId(null)}
          >
            Terminer
          </Button>
        }
        onOpenChange={(open) => !open && setSelectedRuleId(null)}
        open={Boolean(selectedRule)}
        title={selectedRule?.name ?? "Règle"}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Instruction
            </p>
            <p className="mt-2 text-sm leading-5">{selectedRule?.prompt}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="font-medium text-sm">Actions appliquées</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedRule?.actions.map((action) => (
                <Badge color="blue" key={action}>
                  <CheckCircle2Icon className="mr-1 size-3" />
                  {action}
                </Badge>
              ))}
            </div>
          </div>
          {selectedRule ? (
            <button
              aria-pressed={selectedRule.enabled}
              className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border p-4 text-left"
              onClick={() => toggleRule(selectedRule.id, !selectedRule.enabled)}
              type="button"
            >
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">Règle active</strong>
                <span className="mt-1 block text-muted-foreground text-xs">
                  Mue l’applique aux nouveaux messages.
                </span>
              </span>
              <span
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors",
                  selectedRule.enabled && "bg-blue-600",
                )}
              >
                <span
                  className={cn(
                    "absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                    selectedRule.enabled && "translate-x-5",
                  )}
                />
              </span>
            </button>
          ) : null}
        </div>
      </MobileFullScreenDialog>
    </main>
  );
}

function RulesPreview({
  rules,
  setRules,
}: {
  rules: typeof initialRules;
  setRules: React.Dispatch<React.SetStateAction<typeof initialRules>>;
}) {
  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <MutedText className="hidden sm:block">
          Votre assistant organise automatiquement les messages reçus selon ces
          règles.
        </MutedText>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline">
            <HistoryIcon className="mr-2 size-4" />
            Appliquer aux anciens messages
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 size-4" />
            Ajouter une règle
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 px-2 sm:px-4">Actif</TableHead>
              <TableHead className="px-2 sm:px-4">Nom</TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                Instruction
              </TableHead>
              <TableHead className="px-2 sm:px-4">Action</TableHead>
              <TableHead className="w-12 px-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow
                className={rule.enabled ? "" : "bg-muted opacity-60"}
                key={rule.id}
              >
                <TableCell className="p-2 text-center sm:p-4">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(enabled) =>
                      setRules((current) =>
                        current.map((item) =>
                          item.id === rule.id ? { ...item, enabled } : item,
                        ),
                      )
                    }
                    size="sm"
                  />
                </TableCell>
                <TableCell className="p-2 font-medium sm:p-4">
                  {rule.name}
                </TableCell>
                <TableCell className="hidden p-2 text-muted-foreground text-sm sm:table-cell sm:p-4">
                  {rule.prompt}
                </TableCell>
                <TableCell className="p-2 sm:p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.actions.map((action) => (
                      <Badge
                        color={action === "Archiver" ? "yellow" : "blue"}
                        key={action}
                      >
                        {action === "Archiver" ? (
                          <ArchiveIcon className="mr-1 size-3" />
                        ) : action === "Préparer un brouillon" ? (
                          <FilePenLineIcon className="mr-1 size-3" />
                        ) : (
                          <TagIcon className="mr-1 size-3" />
                        )}
                        {action}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-2">
                  <Button
                    aria-label="Actions de la règle"
                    size="icon"
                    variant="ghost"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function TestPreview() {
  return (
    <Card className="mt-5 p-6">
      <h2 className="font-semibold text-lg">Tester vos règles</h2>
      <MutedText className="mt-1">
        Vérifiez le comportement de vos règles sur d’anciens messages.
      </MutedText>
      <Button className="mt-5">Sélectionner un message</Button>
    </Card>
  );
}

function HistoryPreview() {
  return (
    <Card className="mt-5 p-6">
      <h2 className="font-semibold text-lg">Historique</h2>
      <MutedText className="mt-1">
        L’activité récente de vos règles apparaîtra ici.
      </MutedText>
    </Card>
  );
}

function SettingsPreview() {
  const settings = [
    {
      name: "Brouillons de réponse",
      description: "Préparer des réponses que vous pourrez relire avant envoi.",
    },
    {
      name: "Préférences apprises",
      description: "Adapter les suggestions à votre manière de travailler.",
    },
    {
      name: "Résumé des messages",
      description: "Regrouper les informations importantes dans un résumé.",
    },
  ];

  return (
    <div className="mt-5 max-w-3xl space-y-4">
      {settings.map((setting) => (
        <Card
          className="flex items-center justify-between gap-4 p-5"
          key={setting.name}
        >
          <div>
            <div className="font-medium">{setting.name}</div>
            <MutedText className="mt-1">{setting.description}</MutedText>
          </div>
          <Switch defaultChecked />
        </Card>
      ))}
    </div>
  );
}
