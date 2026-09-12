"use client";

import { BriefWelcome } from "@/components/preview/BriefWelcome";

export function DesktopRealBrief({
  freelancerName,
}: {
  freelancerName: string;
}) {
  return <BriefWelcome freelancerName={freelancerName} />;
}
