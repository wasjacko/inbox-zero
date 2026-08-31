"use client";

import { ChevronRightIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAccount } from "@/providers/EmailAccountProvider";
import { prefixPath } from "@/utils/path";
import { useSetupProgress } from "@/hooks/useSetupProgress";
import { usePreviewSetupProgress } from "@/hooks/usePreviewSetupProgress";

export function SetupProgressCard({
  previewProgress,
}: {
  previewProgress?: { completed: number; total: number };
}) {
  const preview = usePreviewSetupProgress();

  if (previewProgress) {
    return (
      <SetupProgressCardContent
        completed={
          preview.hydrated ? preview.completed : previewProgress.completed
        }
        total={preview.total}
        href="/setup"
      />
    );
  }

  return <ConnectedSetupProgressCard />;
}

function ConnectedSetupProgressCard() {
  const { emailAccountId } = useAccount();
  const { data, isLoading } = useSetupProgress();

  if (isLoading || !data || data.isComplete) {
    return null;
  }

  return (
    <SetupProgressCardContent
      completed={data.completed}
      href={prefixPath(emailAccountId, "/setup")}
      total={data.total}
    />
  );
}

function SetupProgressCardContent({
  completed,
  total,
  href,
}: {
  completed: number;
  total: number;
  href: string;
}) {
  const isComplete = completed >= total;
  const title = isComplete
    ? "Configuration"
    : completed === 0
      ? "Commencer la configuration"
      : completed === total - 1
        ? "Terminer la configuration"
        : "Continuer la configuration";

  return (
    <div className="px-3 pt-4">
      <Link
        aria-label={isComplete ? "Ouvrir la configuration" : undefined}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={href}
      >
        <Card className="cursor-pointer p-2.5 shadow-none transition-colors hover:bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProgressCircle completed={completed} total={total} />

              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  {isComplete
                    ? "Terminée · Modifier"
                    : `${completed} étape${completed > 1 ? "s" : ""} sur ${total}`}
                </p>
              </div>
            </div>

            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </Link>
    </div>
  );
}

function ProgressCircle({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = (completed / total) * 100;
  const radius = 13;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-8 w-8">
      <svg className="h-8 w-8 -rotate-90 transform" width="32" height="32">
        {/* Background circle */}
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          r={normalizedRadius}
          cx={16}
          cy={16}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          r={normalizedRadius}
          cx={16}
          cy={16}
          className="text-green-500 transition-all duration-300 ease-in-out"
        />
      </svg>
    </div>
  );
}
