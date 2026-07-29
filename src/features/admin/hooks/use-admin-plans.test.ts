import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAdminPlans, getAdminPlanIcon, getAdminPlanColor } from "./use-admin-plans";
import { Sparkles, Zap, Crown } from "lucide-react";

const mockPlans = [
  {
    id: "free",
    name: "Free",
    description: "Plano gratuito",
    pricePix: 0,
    priceCard: 0,
    billingPeriod: "monthly",
    subscribers: 85,
    mrr: 0,
    popular: false,
    features: [
      { name: "5 transações/mês", included: true },
      { name: "Relatórios avançados", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profissionais",
    pricePix: 99.9,
    priceCard: 154.8,
    billingPeriod: "monthly",
    subscribers: 130,
    mrr: 12987,
    popular: true,
    features: [
      { name: "Transações ilimitadas", included: true },
      { name: "Relatórios avançados", included: true },
    ],
  },
];

const mockSubscriptions = [
  {
    id: "ps1",
    client: "Fernanda Oliveira",
    plan: "Pro",
    status: "ativa",
    startDate: "2026-03-01",
    nextBilling: "01/05/2026",
    amount: 99.9,
  },
];

vi.mock("@/lib/api/client", () => ({
  api: {
    get: vi.fn((url: string) => {
      if (!url) return Promise.reject(new Error("No URL"));
      if (url.includes("/v1/admin/plans"))
        return Promise.resolve({ data: mockPlans, subscriptions: mockSubscriptions });
      return Promise.reject(new Error("Unknown endpoint"));
    }),
  },
  apiEndpoints: {
    admin: { plans: "/v1/admin/plans" },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe("useAdminPlans", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("deve iniciar em loading", () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it("deve retornar lista de planos após fetch", async () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toHaveLength(2);
  });

  it("deve retornar dados corretos do plano Pro", async () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const pro = result.current.plans.find((p) => p.id === "pro");
    expect(pro).toBeDefined();
    expect(pro!.pricePix).toBe(99.9);
    expect(pro!.priceCard).toBe(154.8);
    expect(pro!.subscribers).toBe(130);
    expect(pro!.popular).toBe(true);
  });

  it("deve retornar features dos planos", async () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const free = result.current.plans.find((p) => p.id === "free");
    expect(Array.isArray(free!.features)).toBe(true);
    expect(free!.features[0].included).toBe(true);
    expect(free!.features[1].included).toBe(false);
  });

  it("deve retornar subscriptions associadas", async () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.subscriptions[0].client).toBe("Fernanda Oliveira");
  });

  it("deve expor refetch como função", async () => {
    const { result } = renderHook(() => useAdminPlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("getAdminPlanIcon", () => {
  it("deve retornar Sparkles para free", () => {
    expect(getAdminPlanIcon("free")).toBe(Sparkles);
  });

  it("deve retornar Zap para pro", () => {
    expect(getAdminPlanIcon("pro")).toBe(Zap);
  });

  it("deve retornar Crown para business", () => {
    expect(getAdminPlanIcon("business")).toBe(Crown);
  });

  it("deve retornar Sparkles como fallback para id desconhecido", () => {
    expect(getAdminPlanIcon("enterprise")).toBe(Sparkles);
  });

  it("deve ser case-insensitive", () => {
    expect(getAdminPlanIcon("PRO")).toBe(Zap);
    expect(getAdminPlanIcon("Business")).toBe(Crown);
  });
});

describe("getAdminPlanColor", () => {
  it("deve retornar bg-muted para free", () => {
    expect(getAdminPlanColor("free")).toBe("bg-muted");
  });

  it("deve retornar bg-primary/10 para pro", () => {
    expect(getAdminPlanColor("pro")).toBe("bg-primary/10");
  });

  it("deve retornar bg-success/10 para business", () => {
    expect(getAdminPlanColor("business")).toBe("bg-success/10");
  });

  it("deve retornar bg-muted como fallback", () => {
    expect(getAdminPlanColor("unknown")).toBe("bg-muted");
  });
});
