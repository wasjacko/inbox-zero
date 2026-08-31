import { Suspense } from "react";
import { TasksPreview } from "@/components/preview/TasksPreview";

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPreview />
    </Suspense>
  );
}
