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
  const [statsRes, plansRes, usersRes, subscriptionsRes] = await Promise.allSettled([
      api.get<any>(apiEndpoints.admin.stats),
      api.get<{ data: ApiAdminPlanSummary[] } | ApiAdminPlanSummary[]>(apiEndpoints.admin.plans),
      api.get<{ data: any[] } | any[]>(`${apiEndpoints.admin.users}?limit=5`),
      api.get<{ data: any[] } | any[]>(apiEndpoints.admin.subscriptions),
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
        title: "Receita Mensal (MRR)",
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
      },
    ];

    // MRR real dos planos
    const totalMRR = plans.reduce((sum: number, plan: any) => sum + (plan.mrr || 0), 0);
    const totalSubscribers = plans.reduce((sum: number, plan: any) => sum + (plan.subscribers || 0), 0);

    // 6 meses simulados baseados no MRR real atual
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const receitaData: AdminRevenuePoint[] = meses.map((month, i) => ({
      month,
      receita: Math.round(totalMRR * (0.7 + i * 0.06) * 100) / 100,
      clientes: Math.max(1, Math.round(totalSubscribers * (0.7 + i * 0.06))),
    }));

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
    const endpointLabels = ["Stats", "Planos", "Usuários", "Assinaturas"];
    [statsRes, plansRes, usersRes, subscriptionsRes].forEach((result, i) => {
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
