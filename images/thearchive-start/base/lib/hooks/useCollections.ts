import { useQuery } from "@tanstack/react-query";
import { getCollections, getCollection } from "@/lib/api";

export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (id: number) => [...collectionKeys.details(), id] as const,
};

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("access_token");
  return token ?? undefined;
}

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.lists(),
    queryFn: () => getCollections(getToken()),
    staleTime: 30_000,
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => getCollection(id, getToken()),
    staleTime: 30_000,
    enabled: !!id,
  });
}
