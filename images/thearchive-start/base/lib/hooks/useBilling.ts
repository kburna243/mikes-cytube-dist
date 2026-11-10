"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBillingInfo,
  createCheckout,
  createPortalSession,
  downgradeToFree,
} from "@/lib/api";

export function useBilling(token: string | null) {
  return useQuery({
    queryKey: ["billing"],
    queryFn: () => getBillingInfo(token!),
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useCheckout(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => createCheckout(planId, token!),
    onSuccess: (data: { url: string | null }) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });
}

export function usePortal(token: string | null) {
  return useMutation({
    mutationFn: () => createPortalSession(token!),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
  });
}

export function useDowngrade(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => downgradeToFree(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
