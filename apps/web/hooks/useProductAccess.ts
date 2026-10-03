"use client";

import useSWR from "swr";
import type { ProductAccessResponse } from "@/app/api/user/product-access/route";

export function useProductAccess() {
  return useSWR<ProductAccessResponse>("/api/user/product-access", {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });
}
