import { useQuery } from "@tanstack/react-query";
import { api, publicApi, apiEndpoints } from "@/lib/api/client";
import type { PlanInfo, ApiItemResponse } from "@/shared/types";
import type { AxiosError } from "axios";

export type { PlanInfo };

const PRO_FEATURES = [
  "Assistente financeiro com IA 24h",
  "Registro por WhatsApp (áudio, foto, texto)",
  "Categorização automática inteligente",
  "Relatórios detalhados mensais",
  "Controle de recorrências e assinaturas",
  "Suporte prioritário",
];

const PLAN_DEFAULTS: Record<string, PlanInfo> = {
  free: {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "1 usuário, recursos básicos",
    features: ["Categorização básica", "Relatórios simples", "Suporte por email"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 99.9,
    pricePix: 99.9,
    priceCard: 99.9,
    period: "/mês",
    description: "Acesso completo mensal",
    features: PRO_FEATURES,
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Mensal",
    price: 99.9,
    pricePix: 99.9,
    priceCard: 99.9,
    period: "/mês",
    description: "Acesso completo mensal",
    features: PRO_FEATURES,
  },
  "pro-annual": {
    id: "pro-annual",
    name: "Pro Anual",
    price: 154.8,
    pricePix: 99.9,
    priceCard: 154.8,
    period: "/ano",
    description: "Acesso completo anual — 12x de R$12,90 sem juros",
    features: PRO_FEATURES,
  },
  business: {
    id: "business",
    name: "Business",
    price: "R$ 297",
    period: "/mês",
    description: "Ilimitado, API + Suporte VIP",
    features: [
      "Tudo do Pro",
      "Contas ilimitadas",
      "API de integração",
      "Suporte VIP",
      "Treinamento dedicado",
    ],
  },
};

function normalizeApiPlanId(planId: string): string {
  if (planId === "pro-monthly" || planId === "pro-annual") return "pro";
  if (planId === "business-annual") return "business";
  return planId;
}

async function fetchPlanInfo(planId: string): Promise<PlanInfo> {
  const apiPlanId = normalizeApiPlanId(planId);
  try {
    const res = await api.get<ApiItemResponse<PlanInfo>>(apiEndpoints.plans.get(apiPlanId));
    return normalizePlan(res.data);
  } catch {
    return PLAN_DEFAULTS[planId] ?? PLAN_DEFAULTS[apiPlanId] ?? { id: planId, name: planId, price: "—", period: "/mês", description: "", features: [] };
  }
}

export function usePlanInfo(planId: string) {
  const query = useQuery({
    queryKey: ["plans", planId],
    queryFn: () => fetchPlanInfo(planId),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(planId),
  });

  return {
    planInfo: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

function billingPeriodToPeriod(billingPeriod?: string): string {
  if (billingPeriod === "ano") return "/ano";
  if (billingPeriod === "semestre") return "/semestre";
  if (billingPeriod === "mês") return "/mês";
  return "/mês";
}

function normalizePlan(plan: PlanInfo): PlanInfo {
  return {
    ...plan,
    // API retorna billingPeriod ("ano"/"mês"/"semestre"), não period ("/ano") —
    // sem isso o checkout não detecta plano anual e esconde o parcelamento.
    period: plan.period ?? billingPeriodToPeriod(plan.billingPeriod),
    features: Array.isArray(plan.features)
      ? plan.features.map((f: string | { name: string }) =>
          typeof f === "string" ? f : f.name
        )
      : [],
  };
}

export function usePlansList() {
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      try {
        const res = await publicApi.get<{ data: PlanInfo[] } | PlanInfo[]>(apiEndpoints.plans.list);
        const plans: PlanInfo[] = Array.isArray(res) ? res : (res as { data: PlanInfo[] }).data ?? [];
        return { data: plans.map(normalizePlan) };
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 401) {
          return { data: Object.values(PLAN_DEFAULTS) };
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return {
    plans: query.data?.data ?? Object.values(PLAN_DEFAULTS),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
