/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import {
  DollarSign,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export interface AdminStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: typeof DollarSign;
  color: string;
  bgColor: string;
  warning?: string;
}

export interface AdminRevenuePoint {
  month: string;
  receita: number;
  clientes: number;
}

export interface AdminPlanDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AdminRecentClient {
  name: string;
  email: string;
  plan: string;
  status: string;
  role: string;
  date: string;
}

export interface AdminActivityItem {
  type: "signup" | "payment" | "upgrade" | "support";
  message: string;
  time: string;
}

export interface AdminDashboardData {
  stats: AdminStat[];
  revenueData: AdminRevenuePoint[];
  planDistribution: AdminPlanDistribution[];
  recentClients: AdminRecentClient[];
  recentActivity: AdminActivityItem[];
  partialErrors: Record<string, string>;
}

interface ApiAdminStats {
  mrr: number;
  mrrChange: string;
  mrrTrend: "up" | "down";
  totalClients: number;
  clientsChange: string;
  activeClients: number;
  activeChange: string;
  conversionRate: string;
  conversionChange: string;
  conversionTrend: "up" | "down";
}

const PLAN_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

interface ApiAdminPlanSummary { id: string; name: string; subscribers: number }

async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const currentYear = new Date().getFullYear();
  const [statsRes, plansRes, usersRes, subscriptionsRes, revenueChartRes] = await Promise.allSettled([
      api.get<any>(apiEndpoints.admin.stats),
      api.get<{ data: ApiAdminPlanSummary[] } | ApiAdminPlanSummary[]>(apiEndpoints.admin.plans),
      api.get<{ data: any[] } | any[]>(`${apiEndpoints.admin.users}?limit=5`),
      api.get<{ data: any[] } | any[]>(apiEndpoints.admin.subscriptions),
      api.get<{ data: any[] } | any[]>(`${apiEndpoints.admin.revenueChart}?year=${currentYear}`),
    ]);

    // Helper para extrair dados de uma resposta (pode vir { data: {...} } ou {... })
    const extractData = <T,>(result: PromiseSettledResult<T>): T | null => {
      if (result.status === "fulfilled") {
        const value = result.value as any;
        return (value?.data ?? value) as T;
      }
      return null;
    };

    const statsData = extractData<any>(statsRes);
    const s = statsData?.data ?? statsData ?? {};

    // API retorna: totalRevenue, newUsers, conversionRate, revenueGrowth, usersGrowth, paidUsers
    // Aliases para compatibilidade:
    const mrr         = s.mrr         ?? s.totalRevenue ?? 0;
    const totalUsers  = s.totalClients ?? s.totalUsers  ?? s.newUsers ?? 0;
    const paidUsers   = s.paidUsers    ?? s.activeClients ?? s.activeUsers ?? 0;
    const convRate    = s.conversionRate ?? 0;
    const convDisplay = typeof convRate === "number" ? `${convRate.toFixed(1)}%` : String(convRate);
    const mrrDisplay  = typeof mrr === "number"
      ? `R$ ${(mrr).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "R$ 0";

    const plansData = extractData<{ data: ApiAdminPlanSummary[] } | ApiAdminPlanSummary[]>(plansRes);
    const plans: ApiAdminPlanSummary[] = (plansData?.data ?? plansData ?? []) as ApiAdminPlanSummary[];

    const planDistribution: AdminPlanDistribution[] = plans
      .filter((p: any) => p.subscribers > 0)
      .map((p: any, i: number) => ({
        name: p.name,
        value: p.subscribers,
        color: PLAN_COLORS[i % PLAN_COLORS.length],
      }));

    const stats: AdminStat[] = [
      {
        title: "Receita Total",
        value: mrrDisplay,
        change: `${s.revenueGrowth ?? s.mrrChange ?? 0}%`,
        trend: (s.revenueGrowth ?? 0) >= 0 ? "up" : "down",
        icon: DollarSign,
        color: "text-success",
        bgColor: "bg-success/10",
      },
      {
        title: "Total de Clientes",
        value: Number(totalUsers).toLocaleString("pt-BR"),
        change: `${s.usersGrowth ?? s.clientsChange ?? 0}%`,
        trend: (s.usersGrowth ?? 0) >= 0 ? "up" : "down",
        icon: Users,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        title: "Clientes Ativos",
        value: Number(s.activeUsers ?? s.activeClients ?? paidUsers).toLocaleString("pt-BR"),
        change: "",
        trend: "up",
        icon: Sparkles,
        color: "text-accent",
        bgColor: "bg-accent/10",
      },
      {
        title: "Taxa de Conversão",
        value: convDisplay,
        change: `${s.conversionGrowth ?? s.conversionChange ?? 0}%`,
        trend: (s.conversionGrowth ?? 0) >= 0 ? "up" : "down",
        icon: TrendingUp,
        color: "text-warning",
        bgColor: "bg-warning/10",
        warning: typeof convRate === "number" && convRate > 100
          ? "Valor acima de 100% — matematicamente inconsistente. Cálculo precisa ser revisado no backend."
          : undefined,
      },
    ];

    // Evolução mensal real, vinda de /v1/admin/revenue/chart. Sem dado real
    // disponível, o gráfico fica vazio em vez de simular números — apresentar
    // dado fictício como se fosse histórico real induz o admin a erro.
    const revenueChartRaw = extractData<any>(revenueChartRes);
    const revenueChartBody = revenueChartRaw?.data ?? revenueChartRaw ?? null;

    let receitaData: AdminRevenuePoint[] = [];
    if (revenueChartBody && Array.isArray(revenueChartBody.labels) && revenueChartBody.datasets) {
      // Formato Chart.js: { labels: string[], datasets: { revenue: number[], users: number[], ... } }
      const ds = revenueChartBody.datasets;
      const revenueArr: number[] = ds.revenue ?? ds.receita ?? ds.mrr ?? [];
      const usersArr: number[] = ds.users ?? ds.clientes ?? ds.subscribers ?? ds.activeUsers ?? [];
      receitaData = (revenueChartBody.labels as string[]).map((month, i) => ({
        month,
        receita: Number(revenueArr[i] ?? 0),
        clientes: Number(usersArr[i] ?? 0),
      }));
    } else if (Array.isArray(revenueChartBody)) {
      receitaData = revenueChartBody
        .map((p: any) => ({
          month: p.month ?? p.label ?? p.period ?? "",
          receita: Number(p.revenue ?? p.receita ?? p.mrr ?? p.value ?? 0),
          clientes: Number(p.users ?? p.clientes ?? p.subscribers ?? p.activeUsers ?? 0),
        }))
        .filter((p) => p.month);
    }

    // Processa clientes recentes da API
    const usersData = extractData<{ data: any[] } | any[]>(usersRes);
    const allUsers: any[] = (usersData?.data ?? usersData ?? []) as any[];
    // Conta usuários ativos a partir da lista real (API stats não retorna esse campo)
    const activeUsersCount = allUsers.filter((u: any) =>
      u.status === "active" || u.status === "ativo"
    ).length;

    const recentClients: AdminRecentClient[] = allUsers.map((u: any) => ({
      name: u.name || u.email || "Usuário",
      email: u.email || "",
      plan: u.plan || "free",
      status: u.status === "blocked" ? "Bloqueado" : u.status === "active" ? "Ativo" : u.status || "Pendente",
      role: u.role || "user",
      date: u.createdAt || u.lastLoginAt || "",
    }));

    // Atividades recentes: USA APENAS CLIENTES (mais simples e robusto)
    const recentActivity: AdminActivityItem[] = recentClients.slice(0, 5).map((client) => ({
      type: "signup" as const,
      message: `Novo cadastro: ${client.name}`,
      time: "Recentemente",
    }));

    const partialErrors: Record<string, string> = {};
    const endpointLabels = ["Stats", "Planos", "Usuários", "Assinaturas", "Evolução da Receita"];
    [statsRes, plansRes, usersRes, subscriptionsRes, revenueChartRes].forEach((result, i) => {
      if (result.status === "rejected") {
        const err = result.reason;
        partialErrors[endpointLabels[i]] = err?.response?.data?.message ?? err?.message ?? String(err);
      }
    });

    return {
      stats,
      revenueData: receitaData,
      planDistribution,
      recentClients,
      recentActivity,
      partialErrors,
    };
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 2 * 60 * 1000,
  });
}
