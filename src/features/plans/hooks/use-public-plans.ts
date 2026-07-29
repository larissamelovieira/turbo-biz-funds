import { useQuery } from "@tanstack/react-query";
import { publicApi, apiEndpoints } from "@/lib/api/client";

export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  pricePix: number;
  priceCard: number;
  billingPeriod: string;
  features: string[];
  popular?: boolean;
}

interface ApiPlansResponse {
  data: PublicPlan[];
}

async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const res = await publicApi.get<ApiPlansResponse | PublicPlan[]>(apiEndpoints.plans.list);
  
  // API pode retornar array direto ou { data: [] }
  const raw: PublicPlan[] = Array.isArray(res) ? res : (res as ApiPlansResponse)?.data ?? [];
  
  return raw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    pricePix: p.pricePix ?? 0,
    priceCard: p.priceCard ?? 0,
    billingPeriod: p.billingPeriod ?? "mês",
    features: Array.isArray(p.features) 
      ? p.features.map((f: string | { name: string }) => 
          typeof f === "string" ? f : f.name
        )
      : [],
    popular: p.popular ?? false,
  }));
}

export function usePublicPlans() {
  return useQuery({
    queryKey: ["public", "plans"],
    queryFn: fetchPublicPlans,
    staleTime: 10 * 60 * 1000, // 10 min - planos não mudam frequentemente
  });
}