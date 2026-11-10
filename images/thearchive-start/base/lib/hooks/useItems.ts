import { useQuery } from "@tanstack/react-query";
import { getItems, getItem } from "@/lib/api";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (category?: string) => [...itemKeys.lists(), category] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
};

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("access_token");
  return token ?? undefined;
}

export function useItems(category?: string) {
  return useQuery({
    queryKey: itemKeys.list(category),
    queryFn: () => getItems(category, getToken()),
    staleTime: 30_000,
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => getItem(id, getToken()),
    staleTime: 30_000,
    enabled: !!id,
  });
}
