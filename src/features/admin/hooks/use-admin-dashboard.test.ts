import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAdminDashboard } from "./use-admin-dashboard";

const mockStats = {
  mrr: 15000,
  mrrChange: "+12%",
  mrrTrend: "up" as const,
  totalClients: 240,
  clientsChange: "+8",
  activeClients: 198,
  activeChange: "+5",
  conversionRate: "82%",
  conversionChange: "+3%",
  conversionTrend: "up" as const,
};

const mockPlans = [
  { id: "free", name: "Free", subscribers: 80, mrr: 0 },
  { id: "pro", name: "Pro", subscribers: 120, mrr: 11988 },
  { id: "business", name: "Business", subscribers: 40, mrr: 3980 },
];

const mockUsers = [
  { name: "João Silva", email: "joao@email.com", plan: "Pro", status: "Ativo", createdAt: "2026-04-25" },
  { name: "Maria Lima", email: "maria@email.com", plan: "Business", status: "Trial", createdAt: "2026-04-24" },
];

const mockSubscriptions = [
  { status: "active", amount: 99.90, planName: "Pro" },
  { status: "active", amount: 199.90, planName: "Business" },
  { status: "canceled", amount: 0, planName: "Free" },
];

vi.mock("@/lib/api/client", () => ({
  api: {
    get: vi.fn((url: string) => {
      if (!url) return Promise.reject(new Error("No URL"));
      if (url.includes("/v1/admin/stats")) return Promise.resolve({ data: mockStats });
      if (url.includes("/v1/admin/plans")) return Promise.resolve({ data: mockPlans });
      if (url.includes("/v1/admin/users")) return Promise.resolve({ data: mockUsers });
      if (url.includes("/v1/admin/subscriptions")) return Promise.resolve({ data: mockSubscriptions });
      // Endpoints que não existem no backend retornam erro
      if (url.includes("/v1/admin/revenue")) return Promise.reject(new Error("Endpoint not found"));
      if (url.includes("/v1/admin/clients")) return Promise.reject(new Error("Endpoint not found"));
      if (url.includes("/v1/admin/activity")) return Promise.reject(new Error("Endpoint not found"));
      return Promise.reject(new Error("Unknown endpoint"));
    }),
  },
  apiEndpoints: {
    admin: {
      stats: "/v1/admin/stats",
      revenue: "/v1/admin/revenue",
      clients: "/v1/admin/clients",
      activity: "/v1/admin/activity",
      plans: "/v1/admin/plans",
      users: "/v1/admin/users",
      subscriptions: "/v1/admin/subscriptions",
    },
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

describe("useAdminDashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("deve iniciar em loading", () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("deve retornar dados após fetch bem-sucedido", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("deve retornar 4 stats cards", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.stats).toBeDefined());
    expect(result.current.data!.stats).toHaveLength(4);
  });

  it("deve formatar receita mensal corretamente", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.stats).toBeDefined());
    const revenueStat = result.current.data!.stats[0];
    expect(revenueStat.title).toBe("Receita Mensal");
    expect(revenueStat.value).toContain("15");
    expect(revenueStat.trend).toBe("up");
  });

  it("deve retornar revenueData vazio quando /v1/admin/revenue/chart falha (sem simular dado fictício)", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.revenueData).toBeDefined());
    expect(result.current.data!.revenueData).toHaveLength(0);
  });

  it("deve retornar planDistribution derivado dos planos", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.planDistribution).toBeDefined());
    const dist = result.current.data!.planDistribution;
    expect(dist.length).toBe(3);
    expect(dist[0].name).toBe("Free");
    expect(dist[0].value).toBe(80);
    expect(dist[0].color).toBeDefined();
  });

  it("deve retornar recentClients da API /v1/admin/users", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.recentClients).toBeDefined());
    expect(result.current.data!.recentClients.length).toBeGreaterThan(0);
    expect(result.current.data!.recentClients[0].name).toBe("João Silva");
    expect(result.current.data!.recentClients[0].email).toBe("joao@email.com");
  });

  it("deve retornar recentActivity derivado de usuários e assinaturas", async () => {
    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.recentActivity).toBeDefined());
    // Deve ter pelo menos 2 atividades (3 de usuários + 3 de assinaturas, limitado a 5)
    expect(result.current.data!.recentActivity.length).toBeGreaterThan(0);
    expect(result.current.data!.recentActivity.length).toBeLessThanOrEqual(5);
    // Verifica se há atividades de signup (derivadas de usuários)
    const hasSignup = result.current.data!.recentActivity.some(a => a.type === "signup");
    expect(hasSignup).toBe(true);
  });

  it("deve ter planDistribution vazio se plans API falhar", async () => {
    const { api: mockApi } = await import("@/lib/api/client");
    vi.mocked(mockApi.get).mockImplementation((url: string) => {
      if (url.includes("/v1/admin/stats")) return Promise.resolve({ data: mockStats });
      if (url.includes("/v1/admin/revenue")) return Promise.resolve({ data: mockRevenue });
      if (url.includes("/v1/admin/clients")) return Promise.resolve({ data: mockClients });
      if (url.includes("/v1/admin/activity")) return Promise.resolve({ data: mockActivity });
      if (url.includes("/v1/admin/plans")) return Promise.reject(new Error("Plans unavailable"));
      return Promise.reject(new Error("Unknown endpoint"));
    });

    const { result } = renderHook(() => useAdminDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.planDistribution).toHaveLength(0);
    expect(result.current.isError).toBe(false);
  });
});
