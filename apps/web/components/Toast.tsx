import { Toaster as SonnerToaster, toast } from "sonner";

export function toastSuccess(options: {
  title?: string;
  description: string;
  id?: string;
}) {
  return toast.success(options.title || "Succès", {
    description: options.description,
    id: options.id,
  });
}

export function toastError(options: {
  title?: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return toast.error(options.title || "Erreur", {
    description: options.description,
    duration: 10_000,
    action: options.action,
  });
}

export function toastInfo(options: {
  title: string;
  description: string;
  duration?: number;
}) {
  return toast(options.title, {
    description: options.description,
    duration: options.duration,
  });
}

export const Toaster = SonnerToaster;
