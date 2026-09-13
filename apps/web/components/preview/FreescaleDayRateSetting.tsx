"use client";

import { useId, useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/utils/auth-client";
import { saveFreescaleDayRateAction } from "@/utils/actions/mue-activity";
import { MUE_ACTIVITY_EVENT } from "@/utils/relations/savings";
import { Button } from "@/components/ui/button";
import { toastError } from "@/components/Toast";

export function FreescaleDayRateSetting() {
  const inputId = useId();
  const savingRef = useRef(false);
  const { data: session } = useSession();
  const { data, mutate, isLoading } = useSWR<{ dayRateCents: number | null }>(
    session?.user?.id ? ["/api/user/day-rate", session.user.id] : null,
    async ([url]: [string, string]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("day_rate_load_failed");
      return response.json();
    },
  );
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const value =
    edit ??
    (data?.dayRateCents !== null && data?.dayRateCents !== undefined
      ? String(data.dayRateCents / 100)
      : "");
  const save = async () => {
    if (savingRef.current || edit === null) return;
    const cents = value.trim() ? Math.round(Number(value) * 100) : null;
    if (
      cents !== null &&
      (!Number.isFinite(cents) || cents < 0 || cents > 10_000_000)
    ) {
      toastError({
        description: "Indiquez un TJM compris entre 0 et 100 000 € par jour.",
      });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await saveFreescaleDayRateAction({ dayRateCents: cents });
      if (!result?.data || result.serverError) throw new Error("save_failed");
      await mutate(result.data, { revalidate: false });
      setEdit(null);
      setSaved(true);
      window.dispatchEvent(new Event(MUE_ACTIVITY_EVENT));
    } catch {
      toastError({
        description: "Votre TJM n’a pas été enregistré. Réessayez.",
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={inputId}>
        Votre TJM{" "}
        <span className="font-normal text-muted-foreground">· facultatif</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          aria-describedby={`${inputId}-help`}
          type="number"
          min="0"
          max="100000"
          step="0.01"
          inputMode="decimal"
          placeholder="Ex. 500"
          className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/20"
          value={value}
          onChange={(event) => {
            setEdit(event.target.value);
            setSaved(false);
          }}
          onBlur={() => {
            if (edit !== null) save();
          }}
          disabled={saving || isLoading}
        />
        <span className="shrink-0 text-xs text-muted-foreground">€/jour</span>
        <Button
          size="sm"
          type="button"
          variant="ghost"
          disabled={saving || edit === null}
          onClick={() => {
            if (!saving) save();
          }}
        >
          {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
        </Button>
      </div>
      <p
        id={`${inputId}-help`}
        className="text-xs leading-5 text-muted-foreground"
      >
        Pour estimer la valeur du temps libéré, sur une base de 8 h/jour. Ce
        n’est pas un revenu encaissé. Vous pourrez le modifier dans Relations
        clients.
      </p>
    </div>
  );
}
