/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import { Sparkles, Zap, Crown } from "lucide-react";

export interface AdminPlanFeature {
  name: string;
  included: boolean;
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string;
  pricePix: number;
  priceCard: number;
  billingPeriod: string;
  subscribers: number;
  mrr: number;
  popular?: boolean;
  features: AdminPlanFeature[];
}

export interface AdminPlanSubscription {
  id: string;
  client: string;
  plan: string;
  status: string;
  startDate: string;
  nextBilling: string;
  amount: number;
}

interface ApiAdminPlansResponse {
  data: AdminPlan[];
  subscriptions: AdminPlanSubscription[];
}

const PLAN_ICON_MAP: Record<string, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  business: Crown,
};

const PLAN_COLOR_MAP: Record<string, string> = {
  free: "bg-muted",
  pro: "bg-primary/10",
  business: "bg-success/10",
};

export function getAdminPlanIcon(planId: string) {
  return PLAN_ICON_MAP[planId.toLowerCase()] ?? Sparkles;
}

export function getAdminPlanColor(planId: string) {
  return PLAN_COLOR_MAP[planId.toLowerCase()] ?? "bg-muted";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveId(p: any): string {
  // Prefer real UUID fields over slug-like ids
  const candidates = [p.id, p.uuid, p._id, p.planId];
  return candidates.find((c) => typeof c === "string" && UUID_RE.test(c)) ?? p.id ?? "";
}

async function fetchAdminPlans(): Promise<ApiAdminPlansResponse> {
  const res = await api.get<ApiAdminPlansResponse | AdminPlan[]>(apiEndpoints.admin.plans);
  // API may return a flat array or { data: [], subscriptions: [] }
  const raw: any[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
  const plans: AdminPlan[] = raw.map((p: any) => ({
    ...p,
    id: resolveId(p),
    subscribers: p.subscribers ?? 0,
    mrr: p.mrr ?? 0,
    description: p.description ?? "",
    pricePix: p.pricePix ?? 0,
    priceCard: p.priceCard ?? 0,
    billingPeriod: p.billingPeriod ?? "mês",
    features: Array.isArray(p.features)
      ? p.features.map((f: any) =>
          typeof f === "string" ? { name: f, included: true } : f
        )
      : [],
  }));
  const subscriptions: AdminPlanSubscription[] = Array.isArray(res)
    ? []
    : ((res as any)?.subscriptions ?? []);
  return { data: plans, subscriptions };
}

export function useAdminPlans() {
  const query = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: fetchAdminPlans,
    staleTime: 5 * 60 * 1000,
  });

  return {
    plans: query.data?.data ?? [],
    subscriptions: query.data?.subscriptions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface CreatePlanPayload {
  name: string;
  description: string;
  pricePix: number;
  priceCard: number;
  billingPeriod: string;
  features: AdminPlanFeature[];
  popular?: boolean;
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => {
      return api.post(apiEndpoints.admin.plans, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: CreatePlanPayload & { id: string }) =>
      api.patch(apiEndpoints.admin.plan(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!id) return Promise.reject(new Error("ID do plano inválido"));
      return api.delete(apiEndpoints.admin.plan(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}
