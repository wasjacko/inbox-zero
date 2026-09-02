import { createSearchParams } from "@/utils/url";

export const CHANNELS_THREADS_CACHE_KEY =
  "/api/threads?type=inbox&limit=25&view=list&includePlans=false";

export const BULK_UNSUBSCRIBE_THREADS_CACHE_KEY =
  "/api/threads?type=inbox&limit=100&view=list&includePlans=false";

export const BULK_UNSUBSCRIBE_CACHE_KEY = `/api/user/stats/newsletters?${createSearchParams(
  {
    types: ["read", "unread", "archived", "unarchived"],
    filters: ["unhandled", "unsubscribed", "autoArchived", "approved"],
    orderBy: "emails",
    orderDirection: "desc",
    limit: 50,
    includeMissingUnsubscribe: true,
  },
)}`;
