import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("access_token");
  return token ?? undefined;
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => getDashboard(getToken()),
    staleTime: 60_000,
  });
}
