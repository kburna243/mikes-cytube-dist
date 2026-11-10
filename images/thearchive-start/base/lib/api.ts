import { API_BASE } from "./config";

export interface DashboardData {
  total_value: number;
  item_count: number;
  category_distribution: { label: string; value: string }[];
  recent_scans: {
    id: string;
    title: string;
    brand: string;
    category: string;
    created_at: string;
  }[];
  plan?: {
    id: string;
    name: string;
    subscription_status: string;
  };
  usage?: UsageData;
}

export interface ItemListItem {
  id: number;
  archive_id: string;
  title: string;
  brand: string | null;
  category: string | null;
  condition: string | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  classification_status: string;
  created_at: string;
  thumbnail_url: string | null;
}

export interface ItemImage {
  id: number;
  url: string;
  thumbnail_url: string | null;
  view_type: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ItemDetail extends ItemListItem {
  description: string | null;
  model: string | null;
  estimated_year: number | null;
  origin: string | null;
  condition_score: number | null;
  production_code: string | null;
  size: string | null;
  is_public: boolean;
  tenant_id: number | null;
  updated_at: string;
  images: ItemImage[];
}

export interface CollectionItem {
  id: number;
  archive_id: string;
  title: string;
  brand: string | null;
  category: string | null;
}

export interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  theme: string | null;
  is_public: boolean;
  slug: string;
  items: CollectionItem[];
}

export interface PlanInfo {
  id: string;
  name: string;
  price_monthly: number;
  features: string[];
}

export interface QuotaItem {
  used: number;
  limit: number | null;
}

export interface UsageData {
  items: QuotaItem;
  collections: QuotaItem;
  identify: QuotaItem;
}

export interface BillingInfo {
  plan: string;
  plan_name: string;
  subscription_status: string | null;
  plans: PlanInfo[];
  usage: UsageData;
  stripe_publishable_key: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d) => d.detail)
      .catch(() => "API error");
    throw new Error(detail);
  }
  return res.json();
}

export async function getDashboard(token?: string): Promise<DashboardData> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetchJSON<DashboardData>("/api/dashboard", { headers });
}

export async function getItems(
  category?: string,
  token?: string,
): Promise<ItemListItem[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetchJSON<ItemListItem[]>(`/api/items${params}`, { headers });
}

export async function getItem(id: number, token?: string): Promise<ItemDetail> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetchJSON<ItemDetail>(`/api/items/${id}`, { headers });
}

export async function getCollections(
  token?: string,
): Promise<CollectionDetail[]> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetchJSON<CollectionDetail[]>("/api/collections", { headers });
}

export async function getCollection(
  id: number,
  token?: string,
): Promise<CollectionDetail> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetchJSON<CollectionDetail>(`/api/collections/${id}`, { headers });
}

export async function getBillingInfo(token: string): Promise<BillingInfo> {
  return fetchJSON<BillingInfo>("/api/billing/info", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCheckout(
  planId: string,
  token: string,
): Promise<{
  url: string | null;
  status: string;
  plan: string;
  message?: string;
}> {
  return fetchJSON(`/api/billing/checkout?plan_id=${planId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createPortalSession(
  token: string,
): Promise<{ url: string }> {
  return fetchJSON("/api/billing/portal", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function downgradeToFree(
  token: string,
): Promise<{ status: string; plan: string; message: string }> {
  return fetchJSON("/api/billing/downgrade", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function verifyEmail(
  token: string,
): Promise<{ status: string; message: string }> {
  return fetchJSON("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token: token }),
  });
}

export async function resendVerification(
  token: string,
): Promise<{ status: string; message: string }> {
  return fetchJSON("/api/auth/resend-verification", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function completeOnboarding(
  data: { tenant_name?: string; interests?: string[] },
  token: string,
): Promise<{ status: string }> {
  return fetchJSON("/api/auth/onboarding", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
