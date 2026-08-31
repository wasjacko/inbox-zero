"use client";

import {
  MailIcon,
  MessageSquareIcon,
  PenLineIcon,
  PlugIcon,
} from "lucide-react";
import { MailShell } from "@/app/(app)/[emailAccountId]/mail/MailShell";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { toastSuccess } from "@/components/Toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAIL_SHORTCUT_SCOPES } from "@/lib/shortcuts/registry";
import { ShortcutsProvider } from "@/lib/shortcuts/ShortcutsProvider";

export function ConnectedChannelsPreview() {
  return (
    <ShortcutsProvider scopes={MAIL_SHORTCUT_SCOPES}>
      <PageWrapper>
        <div className="flex flex-col gap-4 pt-1">
          <PageHeader
            title="Canaux"
            description="Gérez vos e-mails et vos messages depuis un seul espace."
          />

          <Tabs defaultValue="email" searchParam="channelView">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-11 w-fit">
                <TabsTrigger className="gap-2" value="email">
                  <MailIcon className="size-4" />
                  Email
                  <Badge
                    className="size-5 justify-center p-0"
                    variant="destructive"
                  >
                    3
                  </Badge>
                </TabsTrigger>
                <TabsTrigger className="gap-2" value="messages">
                  <MessageSquareIcon className="size-4" />
                  Messages
                </TabsTrigger>
              </TabsList>

              <Button
                Icon={PenLineIcon}
                onClick={() =>
                  toastSuccess({
                    description:
                      "La composition est prête pour la future connexion Gmail.",
                  })
                }
                size="sm"
                variant="primaryBlack"
              >
                Nouveau mail
              </Button>
            </div>

            <TabsContent className="mt-6" value="email">
              <Card className="flex h-[calc(100svh-13rem)] min-h-[560px] overflow-hidden">
                <MailShell showMailboxSidebar={false} />
              </Card>
            </TabsContent>

            <TabsContent className="mt-6" value="messages">
              <Card className="flex min-h-[560px]">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquareIcon />
                    </EmptyMedia>
                    <EmptyTitle>Aucun canal de messagerie connecté</EmptyTitle>
                    <EmptyDescription>
                      Connectez Slack ou Telegram pour regrouper vos
                      conversations dans cet espace.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      Icon={PlugIcon}
                      onClick={() =>
                        toastSuccess({
                          description:
                            "La connexion des canaux sera reliée au futur backend.",
                        })
                      }
                      variant="outline"
                    >
                      Connecter un canal
                    </Button>
                  </EmptyContent>
                </Empty>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>
    </ShortcutsProvider>
  );
}
