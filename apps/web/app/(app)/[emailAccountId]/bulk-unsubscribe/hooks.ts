"use client";

import { useCallback, useState, useEffect } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import type { PostHog } from "posthog-js/react";
import { toastSuccess } from "@/components/Toast";
import {
  setFreescaleSenderVisibilityAction,
  setFreescaleSendersVisibilityAction,
  setSenderStatusAction,
} from "@/utils/actions/unsubscriber";
import { decrementUnsubscribeCreditAction } from "@/utils/actions/premium";
import { NewsletterStatus } from "@/generated/prisma/enums";
import {
  assertActionSucceeded,
  captureException,
  EmailProviderRateLimitError,
} from "@/utils/error";
import {
  addToArchiveSenderThreadQueue,
  useArchiveSenderQueueActions,
} from "@/store/archive-sender-queue";
import { deleteEmails } from "@/store/archive-queue";
import { fetchAllSenderThreads } from "@/store/fetch-sender-threads";
import type {
  NewsletterFilterType,
  Row,
} from "@/app/(app)/[emailAccountId]/bulk-unsubscribe/types";
import type { GetThreadsResponse } from "@/app/api/threads/basic/route";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import { isDefined } from "@/utils/types";
import { fetchWithAccount } from "@/utils/fetch";
import type { UserResponse } from "@/app/api/user/me/route";
import { bulkArchiveAction } from "@/utils/actions/mail-bulk-action";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";
import { CHANNELS_THREADS_CACHE_KEY } from "@/utils/preview-data";
import {
  clearPageDataEntry,
  updatePageDataEntry,
} from "@/utils/preview-data-cache";
import { filterThreadsByMutedSenders } from "@/utils/channels/muted-threads";

type GlobalMutate = ReturnType<typeof useSWRConfig>["mutate"];

function removeSendersFromChannelsData(
  data: ThreadsListResponse | undefined,
  senderEmails: string[],
) {
  if (!data) return data;
  const threads = filterThreadsByMutedSenders(data.threads, senderEmails);
  const removedCount = data.threads.length - threads.length;
  return {
    ...data,
    threads,
    totalCount:
      typeof data.totalCount === "number"
        ? Math.max(0, data.totalCount - removedCount)
        : data.totalCount,
  };
}

async function removeSendersFromChannelsCache({
  emailAccountId,
  senderEmails,
  mutateGlobal,
}: {
  emailAccountId: string;
  senderEmails: string[];
  mutateGlobal: GlobalMutate;
}) {
  updatePageDataEntry<ThreadsListResponse>(
    emailAccountId,
    CHANNELS_THREADS_CACHE_KEY,
    (current) =>
      removeSendersFromChannelsData(current, senderEmails) ?? current,
  );
  await mutateGlobal(
    [CHANNELS_THREADS_CACHE_KEY, emailAccountId],
    (current: ThreadsListResponse | undefined) =>
      removeSendersFromChannelsData(current, senderEmails),
    { revalidate: false },
  );

  // Reconcile in the background when Gmail/Outlook is available. The local
  // removal above remains visible even if the provider is temporarily limited.
  mutateGlobal([CHANNELS_THREADS_CACHE_KEY, emailAccountId]).catch(
    captureException,
  );
}

// Shared type for SWR mutate function
type MutateFn = (
  // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
  data?: any,
  opts?: { revalidate?: boolean },
) => Promise<unknown>;

type QueueArchiveSendersFn = (params: { senders: string[] }) => Promise<number>;

type BulkOperationResult = {
  stoppedByRateLimit: boolean;
  total: number;
  successCount: number;
  failureCount: number;
};

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

function formatSenderNames<T extends Row>(items: T[]): string {
  const names = items.map((item) => item.name);
  return names.length > 3
    ? `${names.slice(0, 3).join(", ")}...`
    : names.join(", ");
}

function itemMatchesFilter(
  status: NewsletterStatus | null | undefined,
  filter: NewsletterFilterType,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unhandled":
      return !status; // null/undefined status means unhandled
    case "unsubscribed":
      return status === NewsletterStatus.UNSUBSCRIBED;
    case "autoArchived":
      return status === NewsletterStatus.AUTO_ARCHIVED;
    case "approved":
      return status === NewsletterStatus.APPROVED;
    default:
      return true;
  }
}

// Generic bulk operation handler to reduce duplication
async function executeBulkOperation<T extends Row>({
  items,
  mutate,
  filter,
  onDeselectItem,
  processItem,
  newStatus,
  getNewStatus,
  loadingMessage,
  successMessage,
  errorMessage,
  onComplete,
  onCompleteRevalidates,
  onSuccess,
}: {
  items: T[];
  mutate: MutateFn;
  filter: NewsletterFilterType;
  onDeselectItem?: (id: string) => void;
  processItem: (item: T) => Promise<void>;
  newStatus: NewsletterStatus | null;
  getNewStatus?: (item: T) => NewsletterStatus | null;
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
  onComplete?: () => Promise<unknown>;
  onCompleteRevalidates?: boolean;
  onSuccess?: () => void;
}): Promise<BulkOperationResult> {
  const total = items.length;
  const toastId = toast.loading(
    `${loadingMessage} ${total} ${pluralize(total, "sender")}...`,
    { description: `0 of ${total} completed` },
  );

  let completed = 0;
  let failureCount = 0;
  let rateLimitError: EmailProviderRateLimitError | undefined;

  const updateItemOptimistically = (item: T) => {
    const optimisticStatus = getNewStatus ? getNewStatus(item) : newStatus;
    mutate(
      // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
      (currentData: any) => {
        if (!currentData?.newsletters) return currentData;
        return {
          ...currentData,
          newsletters: currentData.newsletters
            // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
            .map((n: any) =>
              n.name === item.name ? { ...n, status: optimisticStatus } : n,
            )
            // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
            .filter((n: any) => itemMatchesFilter(n.status, filter)),
        };
      },
      { revalidate: false },
    );
  };

  for (const item of items) {
    updateItemOptimistically(item);

    try {
      await processItem(item);
      onDeselectItem?.(item.name);
    } catch (error) {
      failureCount++;
      if (error instanceof EmailProviderRateLimitError) {
        rateLimitError = error;
      } else {
        captureException(error);
      }
    } finally {
      completed++;
      toast.loading(
        `${loadingMessage} ${total} ${pluralize(total, "sender")}...`,
        {
          id: toastId,
          description: `${completed} of ${total} completed`,
        },
      );
    }

    if (rateLimitError) break;
  }

  let didRevalidateOnComplete = false;
  if (onComplete) {
    try {
      await onComplete();
      didRevalidateOnComplete = onCompleteRevalidates === true;
    } catch (error) {
      captureException(error);
    }
  }

  if (rateLimitError) {
    if (!didRevalidateOnComplete) await mutate();
    const successful = completed - failureCount;
    toast.error(rateLimitError.message, {
      id: toastId,
      description: `${successful} of ${total} completed; stopped to avoid more requests`,
    });
    return {
      stoppedByRateLimit: true,
      total,
      successCount: successful,
      failureCount,
    };
  }

  if (failureCount > 0) {
    await mutate();
    toast.error(
      `${errorMessage} ${failureCount} ${pluralize(failureCount, "sender")}`,
      {
        id: toastId,
        description: `${total - failureCount} of ${total} succeeded`,
      },
    );
  } else {
    toast.success(`${total} ${pluralize(total, "sender")} ${successMessage}`, {
      id: toastId,
      description: undefined,
    });
    onSuccess?.();
  }

  return {
    stoppedByRateLimit: false,
    total,
    successCount: total - failureCount,
    failureCount,
  };
}

async function blockSender({
  sender,
  emailAccountId,
  labelId,
  labelName,
  queueArchiveSenders,
}: {
  sender: string;
  emailAccountId: string;
  labelId?: string;
  labelName?: string;
  queueArchiveSenders: QueueArchiveSendersFn;
}) {
  const statusResult = await setSenderStatusAction(emailAccountId, {
    senderEmail: sender,
    status: NewsletterStatus.AUTO_ARCHIVED,
    labelId,
    labelName,
  });
  assertActionSucceeded(statusResult);
  await decrementUnsubscribeCreditAction();

  if (labelId) {
    await addToArchiveSenderThreadQueue({
      sender,
      labelId,
      emailAccountId,
    });
  } else {
    await queueArchiveSenders({ senders: [sender] });
  }
}

export function useUnsubscribe<T extends Row>({
  item,
  emailAccountId,
  hasUnsubscribeAccess,
  mutate,
  posthog,
}: {
  item: T;
  emailAccountId: string;
  hasUnsubscribeAccess: boolean;
  mutate: () => Promise<void>;
  posthog: PostHog;
}) {
  const analytics = useProductAnalytics("bulk_unsubscribe");
  const { mutate: mutateGlobal } = useSWRConfig();
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

  const onUnsubscribe = useCallback(async () => {
    if (!hasUnsubscribeAccess) return;

    setUnsubscribeLoading(true);

    try {
      posthog.capture("Clicked Unsubscribe");
      analytics.captureAction("freescale_sender_visibility_started", {
        status: item.status,
      });

      const hidden = item.status !== NewsletterStatus.UNSUBSCRIBED;
      const statusResult = await setFreescaleSenderVisibilityAction(
        emailAccountId,
        { senderEmail: item.name, hidden },
      );
      assertActionSucceeded(statusResult);
      await mutate();
      if (hidden) {
        await removeSendersFromChannelsCache({
          emailAccountId,
          senderEmails: [item.name],
          mutateGlobal,
        });
      } else {
        clearPageDataEntry(emailAccountId, CHANNELS_THREADS_CACHE_KEY);
        await mutateGlobal([CHANNELS_THREADS_CACHE_KEY, emailAccountId]);
      }
      analytics.captureAction("freescale_sender_visibility_completed", {
        hidden,
      });
      toastSuccess({
        description: hidden
          ? "Expéditeur masqué des Canaux Freescale."
          : "Expéditeur restauré dans les Canaux Freescale.",
      });
    } catch (error) {
      if (error instanceof EmailProviderRateLimitError) {
        toast.error(error.message);
      } else {
        captureException(error);
        toast.error(`Impossible de modifier la visibilité de ${item.name}`);
      }
    } finally {
      setUnsubscribeLoading(false);
    }
  }, [
    hasUnsubscribeAccess,
    item.name,
    item.status,
    analytics,
    mutate,
    posthog,
    emailAccountId,
    mutateGlobal,
  ]);

  return {
    unsubscribeLoading,
    onUnsubscribe,
  };
}

export function useBulkUnsubscribe<T extends Row>({
  hasUnsubscribeAccess,
  mutate,
  posthog,
  emailAccountId,
  onDeselectItem,
  filter,
  onSuccess,
}: {
  hasUnsubscribeAccess: boolean;
  mutate: MutateFn;
  posthog: PostHog;
  emailAccountId: string;
  onDeselectItem?: (id: string) => void;
  filter: NewsletterFilterType;
  onSuccess?: (items: T[]) => void;
}) {
  const analytics = useProductAnalytics("bulk_unsubscribe");
  const { mutate: mutateGlobal } = useSWRConfig();
  const [isBulkUnsubscribing, setIsBulkUnsubscribing] = useState(false);

  const onBulkUnsubscribe = useCallback(
    async (items: T[]) => {
      if (!hasUnsubscribeAccess) {
        return {
          stoppedByRateLimit: false,
          total: items.length,
          successCount: 0,
          failureCount: items.length,
        };
      }
      if (isBulkUnsubscribing || items.length === 0) return;
      setIsBulkUnsubscribing(true);
      let toastId: string | number | undefined;

      try {
        posthog.capture("Clicked Bulk Unsubscribe");
        analytics.captureAction("bulk_unsubscribe_started", {
          item_count: items.length,
          filter,
        });

        const senderEmails = items.map((item) => item.name);
        const selectedEmails = new Set(senderEmails);
        toastId = toast.loading(
          `Masquage de ${items.length} ${pluralize(items.length, "expéditeur")}…`,
        );

        await mutate(
          // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
          (currentData: any) => {
            if (!currentData?.newsletters) return currentData;
            return {
              ...currentData,
              newsletters: currentData.newsletters
                // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
                .map((newsletter: any) =>
                  selectedEmails.has(newsletter.name)
                    ? {
                        ...newsletter,
                        status: NewsletterStatus.UNSUBSCRIBED,
                      }
                    : newsletter,
                )
                // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
                .filter((newsletter: any) =>
                  itemMatchesFilter(newsletter.status, filter),
                ),
            };
          },
          { revalidate: false },
        );

        const statusResult = await setFreescaleSendersVisibilityAction(
          emailAccountId,
          { senderEmails, hidden: true },
        );
        assertActionSucceeded(statusResult);

        for (const item of items) onDeselectItem?.(item.name);
        await Promise.all([
          mutate(),
          removeSendersFromChannelsCache({
            emailAccountId,
            senderEmails,
            mutateGlobal,
          }),
        ]);

        toast.success(
          `${items.length} ${pluralize(items.length, "expéditeur")} ${items.length === 1 ? "masqué" : "masqués"} de Freescale`,
          { id: toastId },
        );
        onSuccess?.(items);

        const result: BulkOperationResult = {
          stoppedByRateLimit: false,
          total: items.length,
          successCount: items.length,
          failureCount: 0,
        };

        analytics.captureAction("bulk_unsubscribe_completed", {
          item_count: items.length,
          success_count: result.successCount,
          failure_count: 0,
          filter,
        });
        return result;
      } catch (error) {
        captureException(error);
        await mutate();
        toast.error("Impossible de masquer les expéditeurs sélectionnés", {
          id: toastId,
        });
        return {
          stoppedByRateLimit: false,
          total: items.length,
          successCount: 0,
          failureCount: items.length,
        };
      } finally {
        setIsBulkUnsubscribing(false);
      }
    },
    [
      hasUnsubscribeAccess,
      mutate,
      posthog,
      emailAccountId,
      onDeselectItem,
      filter,
      analytics,
      onSuccess,
      isBulkUnsubscribing,
      mutateGlobal,
    ],
  );

  return { onBulkUnsubscribe, isBulkUnsubscribing };
}

async function autoArchive({
  name,
  labelId,
  labelName,
  mutate,
  refetchPremium,
  emailAccountId,
  queueArchiveSenders,
}: {
  name: string;
  labelId: string | undefined;
  labelName: string | undefined;
  mutate: () => Promise<void>;
  refetchPremium: () => Promise<UserResponse | null | undefined>;
  emailAccountId: string;
  queueArchiveSenders: QueueArchiveSendersFn;
}) {
  await blockSender({
    sender: name,
    emailAccountId,
    labelId,
    labelName,
    queueArchiveSenders,
  });
  toastSuccess({ description: "Auto archive enabled!" });
  await mutate();
  await refreshPremium(refetchPremium);
}

export function useAutoArchive<T extends Row>({
  item,
  hasUnsubscribeAccess,
  mutate,
  posthog,
  refetchPremium,
  emailAccountId,
}: {
  item: T;
  hasUnsubscribeAccess: boolean;
  mutate: () => Promise<void>;
  posthog: PostHog;
  refetchPremium: () => Promise<UserResponse | null | undefined>;
  emailAccountId: string;
}) {
  const [autoArchiveLoading, setAutoArchiveLoading] = useState(false);
  const { queueArchiveSenders } = useArchiveSenderQueueActions(emailAccountId);

  const onAutoArchiveClick = useCallback(async () => {
    if (!hasUnsubscribeAccess) return;

    setAutoArchiveLoading(true);

    try {
      await autoArchive({
        name: item.name,
        labelId: undefined,
        labelName: undefined,
        mutate,
        refetchPremium,
        emailAccountId,
        queueArchiveSenders,
      });

      posthog.capture("Clicked Auto Archive");
    } catch (error) {
      captureException(error);
      toast.error("Failed to enable auto archive");
    } finally {
      setAutoArchiveLoading(false);
    }
  }, [
    item.name,
    mutate,
    refetchPremium,
    hasUnsubscribeAccess,
    posthog,
    emailAccountId,
    queueArchiveSenders,
  ]);

  const onDisableAutoArchive = useCallback(async () => {
    setAutoArchiveLoading(true);

    try {
      const statusResult = await setSenderStatusAction(emailAccountId, {
        senderEmail: item.name,
        status: null,
      });
      assertActionSucceeded(statusResult);
      toastSuccess({ description: "Auto archive disabled!" });
      await mutate();
    } catch (error) {
      captureException(error);
      toast.error("Failed to disable auto archive");
    } finally {
      setAutoArchiveLoading(false);
    }
  }, [item.name, mutate, emailAccountId]);

  const onAutoArchiveAndLabel = useCallback(
    async (labelId: string, labelName: string) => {
      if (!hasUnsubscribeAccess) return;

      setAutoArchiveLoading(true);

      try {
        await autoArchive({
          name: item.name,
          labelId,
          labelName,
          mutate,
          refetchPremium,
          emailAccountId,
          queueArchiveSenders,
        });
      } catch (error) {
        captureException(error);
        toast.error("Failed to enable auto archive");
      } finally {
        setAutoArchiveLoading(false);
      }
    },
    [
      item.name,
      mutate,
      refetchPremium,
      hasUnsubscribeAccess,
      emailAccountId,
      queueArchiveSenders,
    ],
  );

  return {
    autoArchiveLoading,
    onAutoArchive: onAutoArchiveClick,
    onDisableAutoArchive,
    onAutoArchiveAndLabel,
  };
}

export function useBulkAutoArchive<T extends Row>({
  hasUnsubscribeAccess,
  mutate,
  refetchPremium,
  emailAccountId,
  onDeselectItem,
  filter,
}: {
  hasUnsubscribeAccess: boolean;
  mutate: MutateFn;
  refetchPremium: () => Promise<UserResponse | null | undefined>;
  emailAccountId: string;
  onDeselectItem?: (id: string) => void;
  filter: NewsletterFilterType;
}) {
  const { queueArchiveSenders } = useArchiveSenderQueueActions(emailAccountId);

  const onBulkAutoArchive = useCallback(
    async (items: T[]) => {
      if (!hasUnsubscribeAccess) return;

      await executeBulkOperation({
        items,
        mutate,
        filter,
        onDeselectItem,
        newStatus: NewsletterStatus.AUTO_ARCHIVED,
        loadingMessage: "Setting auto archive for",
        successMessage: "set to auto archive",
        errorMessage: "Failed to set auto archive for",
        processItem: async (item) => {
          await blockSender({
            sender: item.name,
            emailAccountId,
            queueArchiveSenders,
          });
        },
        onComplete: refetchPremium,
      });
    },
    [
      hasUnsubscribeAccess,
      mutate,
      refetchPremium,
      emailAccountId,
      onDeselectItem,
      filter,
      queueArchiveSenders,
    ],
  );

  return { onBulkAutoArchive };
}

export function useApproveButton<T extends Row>({
  item,
  mutate,
  posthog,
  emailAccountId,
  filter,
}: {
  item: T;
  mutate: (
    // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
    data?: any,
    opts?: {
      revalidate?: boolean;
      // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
      optimisticData?: any;
      rollbackOnError?: boolean;
    },
  ) => Promise<void>;
  posthog: PostHog;
  emailAccountId: string;
  filter: NewsletterFilterType;
}) {
  const [optimisticStatus, setOptimisticStatus] = useState<
    NewsletterStatus | null | undefined
  >(undefined);

  // Reset optimistic state when item.status changes (after mutate)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset when item.status changes
  useEffect(() => {
    setOptimisticStatus(undefined);
  }, [item.status]);

  const onApprove = async () => {
    const previousStatus = item.status;
    const newStatus =
      item.status === NewsletterStatus.APPROVED
        ? null
        : NewsletterStatus.APPROVED;

    // Optimistically update the UI
    setOptimisticStatus(newStatus);

    // Optimistically update status and filter out items that no longer match the current view
    // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
    const optimisticUpdate = (currentData: any) => {
      if (!currentData?.newsletters) return currentData;
      return {
        ...currentData,
        newsletters: currentData.newsletters
          // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
          .map((n: any) =>
            n.name === item.name ? { ...n, status: newStatus } : n,
          )
          // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
          .filter((n: any) => itemMatchesFilter(n.status, filter)),
      };
    };

    // Show toast optimistically
    if (newStatus === NewsletterStatus.APPROVED) {
      toast.success("Sender approved", {
        description: item.name,
      });
    } else {
      toast.success("Sender unapproved", {
        description: item.name,
      });
    }

    // Start optimistic update immediately (don't await - fire and forget for UI)
    mutate(optimisticUpdate, { revalidate: false });

    posthog.capture("Clicked Approve Sender");

    try {
      // Also removes any existing auto-archive filter for the sender
      const result = await setSenderStatusAction(emailAccountId, {
        senderEmail: item.name,
        status: newStatus,
      });
      assertActionSucceeded(result);
      // Don't revalidate - the optimistic update is correct
    } catch (error) {
      // Revert on error by revalidating
      setOptimisticStatus(previousStatus);
      await mutate();
      captureException(error);
      toast.error("Failed to update sender status");
    }
  };

  // Use optimistic status if set, otherwise use the actual item status
  const displayStatus =
    optimisticStatus !== undefined ? optimisticStatus : item.status;

  return {
    approveLoading: false,
    onApprove,
    isApproved: displayStatus === NewsletterStatus.APPROVED,
  };
}

export function useBulkApprove<T extends Row>({
  mutate,
  posthog,
  emailAccountId,
  onDeselectItem,
  filter,
}: {
  mutate: MutateFn;
  posthog: PostHog;
  emailAccountId: string;
  onDeselectItem?: (id: string) => void;
  filter: NewsletterFilterType;
}) {
  const onBulkApprove = async (items: T[], unapprove?: boolean) => {
    posthog.capture(
      unapprove ? "Clicked Bulk Unapprove" : "Clicked Bulk Approve",
    );

    const newStatus = unapprove ? null : NewsletterStatus.APPROVED;
    const actionPast = unapprove ? "unapproved" : "approved";

    await executeBulkOperation({
      items,
      mutate,
      filter,
      onDeselectItem,
      newStatus,
      loadingMessage: unapprove ? "Unapproving" : "Approving",
      successMessage: actionPast,
      errorMessage: `Failed to ${unapprove ? "unapprove" : "approve"}`,
      processItem: async (item) => {
        const result = await setSenderStatusAction(emailAccountId, {
          senderEmail: item.name,
          status: newStatus,
        });
        assertActionSucceeded(result);
      },
    });
  };

  return { onBulkApprove };
}

export function useBulkArchive<T extends Row>({
  posthog,
  emailAccountId,
  mutate,
}: {
  posthog: PostHog;
  emailAccountId: string;
  mutate?: MutateFn;
}) {
  const { executeAsync: executeBulkArchive, isExecuting } = useAction(
    bulkArchiveAction.bind(null, emailAccountId),
  );

  const onBulkArchive = (items: T[]) => {
    posthog.capture("Clicked Bulk Archive");
    const promise = executeBulkArchive({
      froms: items.map((item) => item.name),
    }).then(async (result) => {
      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      await mutate?.(undefined, { revalidate: true });
      return result;
    });

    const displayNames = formatSenderNames(items);

    toast.promise(promise, {
      loading: `Archiving emails from ${displayNames}...`,
      success: () => `Archived emails from ${displayNames}`,
      error: (error: unknown) =>
        getBulkActionErrorMessage(
          error,
          "There was an error archiving the emails",
        ),
    });
  };

  return { onBulkArchive, isBulkArchiving: isExecuting };
}

async function deleteAllFromSender({
  name,
  onFinish,
  emailAccountId,
}: {
  name: string;
  onFinish: () => void;
  emailAccountId: string;
}) {
  toast.promise(
    async () => {
      // 1. search for messages from sender
      const res = await fetchWithAccount({
        url: `/api/threads/basic?fromEmail=${name}`,
        emailAccountId,
      });
      const data: GetThreadsResponse = await res.json();

      // 2. delete messages
      if (data?.threads?.length) {
        await new Promise<void>((resolve, reject) => {
          deleteEmails({
            threadIds: data.threads.map((t) => t.id).filter(isDefined),
            onSuccess: () => {
              onFinish();
              resolve();
            },
            onError: reject,
            emailAccountId,
          });
        });
      }

      return data.threads?.length || 0;
    },
    {
      loading: `Deleting all emails from ${name}`,
      success: (data: number) =>
        data
          ? `Deleting ${data} emails from ${name}...`
          : `No emails to delete from ${name}`,
      error: `There was an error deleting the emails from ${name} :(`,
    },
  );
}

export function useDeleteAllFromSender<T extends Row>({
  item,
  posthog,
  emailAccountId,
}: {
  item: T;
  posthog: PostHog;
  emailAccountId: string;
}) {
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const onDeleteAll = async () => {
    setDeleteAllLoading(true);

    posthog.capture("Clicked Delete All");

    await deleteAllFromSender({
      name: item.name,
      onFinish: () => setDeleteAllLoading(false),
      emailAccountId,
    });
  };

  return {
    deleteAllLoading,
    onDeleteAll,
  };
}

export function useBulkDelete<T extends Row>({
  mutate,
  posthog,
  emailAccountId,
}: {
  mutate: () => Promise<unknown>;
  posthog: PostHog;
  emailAccountId: string;
}) {
  const { mutate: mutateGlobal } = useSWRConfig();
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const onBulkDelete = async (items: T[]) => {
    if (isBulkDeleting || items.length === 0) return;
    setIsBulkDeleting(true);
    posthog.capture("Clicked Bulk Delete");
    const toastId = toast.loading("Préparation de la suppression…", {
      description: `0 sur ${items.length} expéditeur traité`,
    });

    try {
      const threadIds = new Set<string>();

      for (const [index, item] of items.entries()) {
        const data = await fetchAllSenderThreads({
          sender: item.name,
          emailAccountId,
        });
        for (const thread of data.threads) {
          if (thread.id) threadIds.add(thread.id);
        }
        toast.loading("Préparation de la suppression…", {
          id: toastId,
          description: `${index + 1} sur ${items.length} expéditeurs traités`,
        });
      }

      if (threadIds.size === 0) {
        toast.info("Aucun e-mail à supprimer", { id: toastId });
        return;
      }

      deleteEmails({
        threadIds: [...threadIds],
        emailAccountId,
        onSuccess: () => {},
        onComplete: async () => {
          try {
            await mutate();
            clearPageDataEntry(emailAccountId, CHANNELS_THREADS_CACHE_KEY);
            await mutateGlobal([CHANNELS_THREADS_CACHE_KEY, emailAccountId]);
            toast.success("Suppression terminée");
          } catch (error) {
            captureException(error);
            toast.error(
              "Suppression terminée, mais l’affichage n’a pas pu être actualisé",
            );
          }
        },
      });

      toast.success("Suppression lancée", {
        id: toastId,
        description: `${threadIds.size} conversation${threadIds.size > 1 ? "s" : ""} en cours de traitement`,
      });
    } catch (error) {
      captureException(error);
      toast.error(
        getBulkActionErrorMessage(error, "Impossible de supprimer ces e-mails"),
        { id: toastId },
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return { onBulkDelete, isBulkDeleting };
}

export function useBulkUnsubscribeShortcuts<T extends Row>({
  newsletters,
  selectedRow,
  onOpenNewsletter,
  setSelectedRow,
  refetchPremium,
  hasUnsubscribeAccess,
  mutate,
  emailAccountId,
  // userEmail,
}: {
  newsletters?: T[];
  selectedRow?: T;
  setSelectedRow: (row: T) => void;
  onOpenNewsletter: (row: T) => void;
  refetchPremium: () => Promise<UserResponse | null | undefined>;
  hasUnsubscribeAccess: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: existing loose external shape
  mutate: () => Promise<any>;
  emailAccountId: string;
  userEmail: string;
}) {
  const { mutate: mutateGlobal } = useSWRConfig();

  // perform actions using keyboard shortcuts
  // TODO make this available to command-K dialog too
  useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      try {
        const item = selectedRow;
        if (!item) return;

        // to prevent when typing in an input such as Crisp support
        if (document?.activeElement?.tagName !== "BODY") return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const index = newsletters?.findIndex((n) => n.name === item.name);
          if (index === undefined) return;
          const nextItem =
            newsletters?.[index + (e.key === "ArrowDown" ? 1 : -1)];
          if (!nextItem) return;
          setSelectedRow(nextItem);
          return;
        }
        if (e.key === "Enter") {
          // open modal
          e.preventDefault();
          onOpenNewsletter(item);
          return;
        }

        if (!hasUnsubscribeAccess) return;

        if (e.key === "e") {
          // auto archive
          e.preventDefault();
          const statusResult = await setSenderStatusAction(emailAccountId, {
            senderEmail: item.name,
            status: NewsletterStatus.AUTO_ARCHIVED,
          });
          assertActionSucceeded(statusResult);
          toastSuccess({ description: "Auto archive enabled!" });
          await mutate();
          await decrementUnsubscribeCreditAction();
          await refreshPremium(refetchPremium);
          return;
        }
        if (e.key === "u") {
          // Hide only inside Freescale. Never follow a sender link or mutate
          // the connected mailbox for this shortcut.
          e.preventDefault();
          const statusResult = await setFreescaleSenderVisibilityAction(
            emailAccountId,
            { senderEmail: item.name, hidden: true },
          );
          assertActionSucceeded(statusResult);
          await mutate();
          await removeSendersFromChannelsCache({
            emailAccountId,
            senderEmails: [item.name],
            mutateGlobal,
          });
          toastSuccess({
            description: "Expéditeur masqué des Canaux Freescale.",
          });
          return;
        }
        if (e.key === "a") {
          // approve
          e.preventDefault();
          const statusResult = await setSenderStatusAction(emailAccountId, {
            senderEmail: item.name,
            status: NewsletterStatus.APPROVED,
          });
          assertActionSucceeded(statusResult);
          await mutate();
          return;
        }
      } catch (error) {
        captureException(error);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [
    mutate,
    newsletters,
    selectedRow,
    hasUnsubscribeAccess,
    refetchPremium,
    setSelectedRow,
    onOpenNewsletter,
    emailAccountId,
    mutateGlobal,
  ]);
}

export function useNewsletterFilter() {
  const [filter, setFilter] = useState<NewsletterFilterType>("all");

  // Convert single filter to array format for API compatibility
  const filtersArray: (
    | "unhandled"
    | "unsubscribed"
    | "autoArchived"
    | "approved"
  )[] =
    filter === "all"
      ? ["unhandled", "unsubscribed", "autoArchived", "approved"]
      : [filter];

  return {
    filter,
    filtersArray,
    setFilter,
  };
}

/**
 * A stale premium count is cosmetic, so refreshing it must never turn an
 * operation that already succeeded into a failure toast.
 */
async function refreshPremium(
  refetchPremium: () => Promise<UserResponse | null | undefined>,
) {
  try {
    await refetchPremium();
  } catch (error) {
    captureException(error);
  }
}

function getBulkActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "serverError" in error.error &&
    typeof error.error.serverError === "string"
  ) {
    return error.error.serverError;
  }

  return fallback;
}
