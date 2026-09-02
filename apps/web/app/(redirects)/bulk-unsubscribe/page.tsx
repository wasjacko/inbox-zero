import { BulkUnsubscribe } from "@/app/(app)/[emailAccountId]/bulk-unsubscribe/BulkUnsubscribeSection";
import { PermissionsCheck } from "@/app/(app)/[emailAccountId]/PermissionsCheck";

export default function BulkUnsubscribePage() {
  return (
    <>
      <PermissionsCheck />
      <BulkUnsubscribe />
    </>
  );
}
