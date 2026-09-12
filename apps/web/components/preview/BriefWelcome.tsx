"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount } from "@/providers/EmailAccountProvider";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import { useMueBriefTasks } from "@/hooks/useMueBriefTasks";
import { useContactPhotos } from "@/hooks/useContactPhotos";
import {
  getActiveAccountFirstName,
  getPreviewGreeting,
} from "@/utils/preview-profile";

export function BriefWelcome({ freelancerName }: { freelancerName: string }) {
  const { emailAccount } = useAccount();
  const [revealed, setRevealed] = useState(false);
  const name = getActiveAccountFirstName({
    accountName: emailAccount?.name,
    accountEmail: emailAccount?.email,
    fallbackName: freelancerName,
  });
  const { data: summary, error: summaryError } = usePreloadedPageData<{
    unreadEmails: number;
  }>("/api/user/brief-summary");
  const { data: brief } = useMueBriefTasks();
  const tasks = brief?.tasks ?? [];
  const { photos } = useContactPhotos(tasks.map((task) => task.senderEmail));

  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 pb-16 pt-16 text-center sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-16 -top-10 h-64 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(59,130,246,.10), transparent 68%)",
        }}
      />
      <header className="relative">
        <h1 className="font-medium text-4xl tracking-tight">
          {getPreviewGreeting(name)}
        </h1>
        <p className="mt-4 min-h-6 text-muted-foreground" aria-live="polite">
          {summary
            ? `Vous avez ${summary.unreadEmails} message${summary.unreadEmails === 1 ? "" : "s"} non lu${summary.unreadEmails === 1 ? "" : "s"}.`
            : summaryError
              ? "Vos messages sont connectés."
              : "Chargement de vos messages…"}
        </p>
      </header>

      {tasks.length > 0 ? (
        <div className="relative mt-9" aria-live="polite">
          <p className="text-muted-foreground text-sm sm:text-base">
            Mue a repéré {tasks.length} action{tasks.length === 1 ? "" : "s"}{" "}
            concrète{tasks.length === 1 ? "" : "s"} dans vos échanges.{" "}
            <button
              className="group inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
              type="button"
              aria-expanded={revealed}
              onClick={() => setRevealed((current) => !current)}
            >
              {revealed ? "Masquer" : "Voir le brief"}
              <ArrowRightIcon
                className={`size-3.5 transition-transform ${revealed ? "rotate-90" : "group-hover:translate-x-0.5"}`}
              />
            </button>
          </p>

          {revealed ? (
            <div className="mt-8 grid gap-3 text-left">
              {tasks.slice(0, 3).map((task, index) => (
                <Link
                  className="group flex items-start gap-4 rounded-2xl border bg-background p-5 shadow-[0_10px_35px_rgba(15,23,42,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_40px_rgba(37,99,235,.09)]"
                  href={`/channels-v4?conversation=${encodeURIComponent(task.threadId)}`}
                  key={task.threadId}
                >
                  <Avatar className="mt-0.5 size-11 shrink-0">
                    <AvatarImage
                      src={photos[task.senderEmail.toLowerCase()]}
                      alt=""
                    />
                    <AvatarFallback>
                      {task.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="grid size-5 place-items-center rounded-full bg-blue-50 font-semibold text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {index + 1}
                      </span>
                      <p className="truncate text-muted-foreground text-xs">
                        {task.senderName}
                      </p>
                    </div>
                    <h2 className="mt-1.5 font-semibold leading-5">
                      {task.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-muted-foreground text-sm leading-5">
                      {task.summary}
                    </p>
                  </div>
                  <ArrowRightIcon className="mt-3 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!brief ? (
        <span className="sr-only" role="status">
          Mue analyse vos échanges récents.
        </span>
      ) : null}
    </section>
  );
}
