"use client";

import { ArrowLeftIcon, CheckIcon, LockKeyholeIcon } from "lucide-react";
import { useState } from "react";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { toastError } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAccountLinkingUrl } from "@/utils/account-linking";
import { redirectToSafeUrl } from "@/utils/redirect";

const channelOptions = [
  {
    id: "gmail",
    name: "Gmail",
    description: "E-mails et conversations Google Workspace.",
    provider: "google",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "E-mails Microsoft 365 et Outlook.",
    provider: "microsoft",
  },
] as const;

type Channel = (typeof channelOptions)[number];

export function ConnectChannelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<Channel | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSelected(null);
      setIsConnecting(false);
    }
  };

  const connectSelectedChannel = async () => {
    if (!selected || isConnecting) return;
    setIsConnecting(true);

    try {
      const url = await getAccountLinkingUrl(selected.provider, {
        returnTo: "/chat",
      });
      redirectToSafeUrl(url, { allowExternal: true });
    } catch (error) {
      console.error(`Error initiating ${selected.provider} linking:`, error);
      toastError({
        title: `Impossible de connecter ${selected.name}`,
        description: "Réessayez dans quelques instants.",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-xl p-0">
        {selected ? (
          <>
            <DialogHeader className="border-b px-6 py-5 pr-12 text-left">
              <div className="flex items-center gap-3">
                <Button
                  aria-label="Retour à la sélection"
                  onClick={() => setSelected(null)}
                  size="iconSm"
                  variant="ghost"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <div>
                  <DialogTitle>Connecter {selected.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Vérifiez ce qui sera synchronisé avant de continuer.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-6">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
                  <ChannelLogo channel={selected.id} />
                </span>
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {selected.description}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium text-sm">Freescale pourra :</p>
                <ul className="space-y-3 text-sm">
                  {[
                    "Importer vos nouvelles conversations dans Canaux",
                    "Préparer vos briefs à partir de vos vrais échanges",
                    "Synchroniser les statuts et les notifications",
                  ].map((permission) => (
                    <li className="flex items-start gap-3" key={permission}>
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                        <CheckIcon className="size-3" />
                      </span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 text-muted-foreground text-xs leading-5">
                <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" />
                Vous serez redirigé vers {selected.name} pour autoriser la
                connexion, puis ramené directement sur votre accueil.
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button onClick={() => setSelected(null)} variant="outline">
                Retour
              </Button>
              <Button loading={isConnecting} onClick={connectSelectedChannel}>
                Connecter {selected.name}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="border-b px-6 py-5 pr-12 text-left">
              <DialogTitle>Connecter un canal</DialogTitle>
              <DialogDescription>
                Choisissez la messagerie à ajouter à votre espace Freescale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
              {channelOptions.map((channel) => (
                <button
                  className="flex min-h-24 items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/50"
                  key={channel.id}
                  onClick={() => setSelected(channel)}
                  type="button"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-background shadow-sm">
                    <ChannelLogo channel={channel.id} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{channel.name}</span>
                    <span className="mt-1 block text-muted-foreground text-sm leading-5">
                      {channel.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChannelLogo({ channel }: { channel: Channel["id"] }) {
  return channel === "gmail" ? (
    <Gmail height={28} width={28} />
  ) : (
    <Outlook height={28} width={28} />
  );
}
