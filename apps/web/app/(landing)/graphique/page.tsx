import type { Metadata } from "next";
import { MoneyHistoryGraph } from "@/components/preview/MoneyHistoryGraph";

export const metadata: Metadata = {
  title: "Graphique — Journal d’argent",
};

export default function MoneyGraphPage() {
  return <MoneyHistoryGraph />;
}
