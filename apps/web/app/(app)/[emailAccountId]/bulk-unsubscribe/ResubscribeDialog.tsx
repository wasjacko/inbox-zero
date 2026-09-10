"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/Loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setFreescaleSenderVisibilityAction } from "@/utils/actions/unsubscriber";
import { CHANNELS_THREADS_CACHE_KEY } from "@/utils/preview-data";
import { clearPageDataEntry } from "@/utils/preview-data-cache";
import { assertActionSucceeded } from "@/utils/error";

interface ResubscribeDialogProps {
  emailAccountId: string;
  mutate: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  senderEmail: string;
  senderName: string;
}

export function ResubscribeDialog({
  open,
  onOpenChange,
  senderName,
  senderEmail,
  emailAccountId,
  mutate,
}: ResubscribeDialogProps) {
  const [restoreLoading, setRestoreLoading] = useState(false);
  const { mutate: mutateGlobal } = useSWRConfig();

  const handleRestore = async () => {
    setRestoreLoading(true);
    try {
      const result = await setFreescaleSenderVisibilityAction(emailAccountId, {
        senderEmail,
        hidden: false,
      });
      assertActionSucceeded(result);
      await mutate();
      clearPageDataEntry(emailAccountId, CHANNELS_THREADS_CACHE_KEY);
      await mutateGlobal([CHANNELS_THREADS_CACHE_KEY, emailAccountId]);
      onOpenChange(false);
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!restoreLoading) onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restaurer « {senderName} » ?</DialogTitle>
          <DialogDescription className="pt-2">
            Cet expéditeur réapparaîtra dans les Canaux Freescale. Aucun
            changement ne sera effectué dans votre messagerie connectée.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restoreLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleRestore} disabled={restoreLoading}>
            {restoreLoading && <ButtonLoader />}
            Restaurer dans Canaux
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
