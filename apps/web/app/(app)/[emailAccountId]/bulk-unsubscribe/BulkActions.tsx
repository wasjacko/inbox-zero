import { useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  Loader2Icon,
  MailXIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useBulkUnsubscribe,
  useBulkApprove,
} from "@/app/(app)/[emailAccountId]/bulk-unsubscribe/hooks";
import { PremiumTooltip } from "@/components/PremiumAlert";
import { usePremium } from "@/hooks/usePremium";
import { usePremiumModal } from "@/app/(app)/premium/PremiumModal";
import { useAccount } from "@/providers/EmailAccountProvider";
import { cn } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DomainIcon } from "@/components/charts/DomainIcon";
import { extractDomainFromEmail } from "@/utils/email";
import type { NewsletterStatsResponse } from "@/app/api/user/stats/newsletters/route";
import { NewsletterStatus } from "@/generated/prisma/enums";
import type { NewsletterFilterType } from "@/app/(app)/[emailAccountId]/bulk-unsubscribe/types";

type Newsletter = NewsletterStatsResponse["newsletters"][number];

function ActionButton({
  icon: Icon,
  label,
  loadingLabel,
  onClick,
  loading,
  showLabelOnMobile,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  loadingLabel?: string;
  onClick: () => void;
  loading?: boolean;
  showLabelOnMobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        loading && "opacity-50 cursor-not-allowed",
      )}
    >
      {loading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      <span className={showLabelOnMobile ? undefined : "hidden sm:inline"}>
        {loading && loadingLabel ? loadingLabel : label}
      </span>
    </button>
  );
}

export function BulkActions({
  selected,
  mutate,
  onClearSelection,
  deselectItem,
  newsletters,
  filter,
  totalCount,
}: {
  selected: Map<string, boolean>;
  // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
  mutate: () => Promise<any>;
  onClearSelection: () => void;
  deselectItem: (id: string) => void;
  newsletters?: Newsletter[];
  filter: NewsletterFilterType;
  totalCount: number;
}) {
  const [evictDialogOpen, setEvictDialogOpen] = useState(false);

  const posthog = usePostHog();
  const { hasUnsubscribeAccess } = usePremium();
  const { PremiumModal, openModal } = usePremiumModal();
  const { emailAccountId } = useAccount();
  const { onBulkUnsubscribe, isBulkUnsubscribing } =
    useBulkUnsubscribe<Newsletter>({
      hasUnsubscribeAccess,
      mutate,
      posthog,
      emailAccountId,
      onDeselectItem: deselectItem,
      filter,
    });

  const { onBulkApprove } = useBulkApprove({
    mutate,
    posthog,
    emailAccountId,
    onDeselectItem: deselectItem,
    filter,
  });

  // Get the selected newsletters with their details
  const selectedNewsletters =
    newsletters?.filter((n) => selected.get(n.name)) || [];
  const selectedCount = selectedNewsletters.length;
  const isVisible = selectedCount > 0;

  // Check if all selected newsletters are already approved
  const allSelectedAreApproved = useMemo(() => {
    if (selectedNewsletters.length === 0) return false;
    return selectedNewsletters.every(
      (n) => n.status === NewsletterStatus.APPROVED,
    );
  }, [selectedNewsletters]);

  // The selection map can hold senders no longer in the fetched rows (e.g.
  // after a search or date-range change), so only offer unsubscribe when we
  // have full rows to act on.
  const allSelectedCanUnsubscribe =
    selectedNewsletters.length > 0 &&
    selectedNewsletters.every(
      (n) => n.status !== NewsletterStatus.UNSUBSCRIBED,
    );

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <PremiumTooltip
              showTooltip={!hasUnsubscribeAccess}
              openModal={openModal}
            >
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-2 flex items-center justify-between gap-1 sm:gap-3">
                {/* Left side: Close button and selection count */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  >
                    <XIcon className="size-4" />
                  </button>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {selectedCount} sur {totalCount}
                    <span className="hidden sm:inline"> sélectionnés</span>
                  </span>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-0 sm:gap-1 flex-nowrap">
                  {allSelectedCanUnsubscribe && (
                    <ActionButton
                      icon={MailXIcon}
                      label="Évincer"
                      loadingLabel="Éviction…"
                      showLabelOnMobile
                      onClick={() => setEvictDialogOpen(true)}
                      loading={isBulkUnsubscribing}
                    />
                  )}
                  <ActionButton
                    icon={
                      allSelectedAreApproved ? ThumbsDownIcon : ThumbsUpIcon
                    }
                    label={
                      allSelectedAreApproved ? "Retirer des favoris" : "Garder"
                    }
                    onClick={() =>
                      onBulkApprove(selectedNewsletters, allSelectedAreApproved)
                    }
                  />
                </div>
              </div>
            </PremiumTooltip>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={evictDialogOpen}
        onOpenChange={(open) => {
          if (!isBulkUnsubscribing) setEvictDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Évincer {selectedCount} contact{selectedCount > 1 ? "s" : ""} ?
            </DialogTitle>
            <DialogDescription>
              Ces expéditeurs seront uniquement masqués dans les Canaux
              Freescale. Rien ne sera modifié dans Gmail ou Outlook, et vous
              pourrez les restaurer à tout moment.
            </DialogDescription>
          </DialogHeader>

          {selectedNewsletters.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {selectedNewsletters.map((newsletter) => {
                  const domain =
                    extractDomainFromEmail(newsletter.name) || newsletter.name;
                  return (
                    <div
                      key={newsletter.name}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <DomainIcon
                        domain={domain}
                        size={32}
                        variant="circular"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {newsletter.fromName || newsletter.name}
                        </span>
                        {newsletter.fromName && (
                          <span className="truncate text-xs text-muted-foreground">
                            {newsletter.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isBulkUnsubscribing}
              onClick={() => setEvictDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              disabled={isBulkUnsubscribing}
              onClick={async () => {
                const result = await onBulkUnsubscribe(selectedNewsletters);
                if (result && !result.stoppedByRateLimit) {
                  setEvictDialogOpen(false);
                }
              }}
            >
              {isBulkUnsubscribing && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              {isBulkUnsubscribing ? "Éviction en cours…" : "Évincer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PremiumModal />
    </>
  );
}
