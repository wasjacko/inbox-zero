import { redirect } from "next/navigation";

export default function AssistantPage() {
  redirect("/chat?chatView=assistant");
}
