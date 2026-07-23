/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";

// ============================================
// TIPOS
// ============================================

export type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

export interface AdminReportsStats {
  totalRevenue: number;
  revenueChange: string;
  revenueTrend: "up" | "down";
  newUsers: number;
  usersChange: string;
  usersTrend: "up" | "down";
  conversionRate: number;
  conversionChange: string;
  conversionTrend: "up" | "down";
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  netRevenue: number;
  mrr: number;
  newSubscriptions: number;
  cancellations: number;
  churnRate: number;
}

export interface RevenueChartData {
  labels: string[];
  datasets: {
    revenue: number[];
    expenses: number[];
    netRevenue: number[];
  };
}

export interface UserGrowthDataPoint {
  period: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
}

export interface PlanDistributionData {
  planId: string;
  planName: string;
  subscribers: number;
  revenue: number;
  percentage: number;
}

export interface ChurnDataPoint {
  period: string;
  cancelledCount: number;
  cancelledRevenue: number;
  churnRate: number;
  reason: string;
}

export interface CashflowEntry {
  id: string;
  date: string;
  type: "revenue" | "expense";
  category: string;
  description: string;
  amount: number;
  balance: number;
}

export interface AdminReportsData {
  stats: AdminReportsStats;
  revenueData: RevenueDataPoint[];
  revenueChart: RevenueChartData;
  userGrowth: UserGrowthDataPoint[];
  planDistribution: PlanDistributionData[];
  churnData: ChurnDataPoint[];
  cashflow: CashflowEntry[];
  failedEndpoints: string[];
  apiErrors: Record<string, string>;
}

// ============================================
// HELPERS
// ============================================

function extractData<T>(result: any): T | null {
  if (result?.status === "fulfilled") {
    const value = result.value;
    return value?.data ?? value;
  }
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getTrendFromChange(changeStr: string | number | null | undefined): "up" | "down" {
  if (changeStr == null) return "up";
  const num = typeof changeStr === "number" ? changeStr : parseFloat(String(changeStr).replace(/[+%]/g, ""));
  return isNaN(num) || num >= 0 ? "up" : "down";
}

function toStringChange(val: string | number | null | undefined): string {
  if (val == null) return "+0%";
  if (typeof val === "number") return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
  return String(val);
}

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  return [];
}

// ============================================
// VALORES PADRÃO QUANDO A API FALHA (sem dado fictício — fica vazio/zerado
// e o endpoint entra em `failedEndpoints`, mostrado no banner de aviso)
// ============================================

const EMPTY_STATS: AdminReportsStats = {
  totalRevenue: 0,
  revenueChange: "+0%",
  revenueTrend: "up",
  newUsers: 0,
  usersChange: "+0%",
  usersTrend: "up",
  conversionRate: 0,
  conversionChange: "+0%",
  conversionTrend: "up",
};

const EMPTY_REVENUE_CHART: RevenueChartData = {
  labels: [],
  datasets: { revenue: [], expenses: [], netRevenue: [] },
};

// ============================================
// FETCHERS
// ============================================

async function fetchStats(period: PeriodType): Promise<AdminReportsStats> {
  const data = await api.get<any>(`${apiEndpoints.admin.stats}?period=${period}`);
  const s = data?.data ?? data ?? {};
  return {
    totalRevenue: s.totalRevenue ?? s.mrr ?? 0,
    revenueChange: toStringChange(s.revenueGrowth ?? s.mrrChange),
    revenueTrend: getTrendFromChange(s.revenueGrowth ?? s.mrrChange),
    newUsers: s.newUsers ?? s.totalClients ?? 0,
    usersChange: toStringChange(s.usersGrowth ?? s.clientsChange),
    usersTrend: getTrendFromChange(s.usersGrowth ?? s.clientsChange),
    conversionRate: typeof s.conversionRate === "number" ? s.conversionRate : parseFloat(s.conversionRate ?? "0"),
    conversionChange: toStringChange(s.conversionGrowth),
    conversionTrend: getTrendFromChange(s.conversionGrowth),
  };
}

async function fetchRevenueData(period: PeriodType): Promise<RevenueDataPoint[]> {
  const year = new Date().getFullYear();
  const data = await api.get<any>(`${apiEndpoints.admin.revenue}?period=${period}&year=${year}`);
  const raw = toArray<any>(data?.data ?? data);
  return raw.map((r: any) => ({
    month: r.month ?? r.period ?? "",
    revenue: r.revenue ?? 0,
    expenses: r.expenses ?? 0,
    netRevenue: r.netRevenue ?? r.revenue - (r.expenses ?? 0),
    mrr: r.mrr ?? r.revenue ?? 0,
    newSubscriptions: r.newSubscriptions ?? r.newMRR ?? 0,
    cancellations: r.cancellations ?? 0,
    churnRate: r.churnRate ?? 0,
  }));
}

async function fetchRevenueChart(period: PeriodType): Promise<RevenueChartData> {
  const year = new Date().getFullYear();
  const res = await api.get<any>(`${apiEndpoints.admin.revenue}/chart?period=${period}&year=${year}`);
  const data = res?.data ?? res;
  return {
    labels: data?.labels ?? [],
    datasets: {
      revenue: data?.datasets?.revenue ?? [],
      expenses: data?.datasets?.expenses ?? [],
      netRevenue: data?.datasets?.netRevenue ?? [],
    },
  };
}

async function fetchUserGrowth(period: PeriodType): Promise<UserGrowthDataPoint[]> {
  const year = new Date().getFullYear();
  const data = await api.get<any>(`${apiEndpoints.admin.users}/growth?period=${period}&year=${year}`);
  const raw = toArray<any>(data?.data ?? data);
  return raw.map((r: any) => ({
    period: r.period ?? r.month ?? "",
    totalUsers: r.totalUsers ?? 0,
    newUsers: r.newUsers ?? 0,
    activeUsers: r.activeUsers ?? 0,
    inactiveUsers: r.inactiveUsers ?? 0,
    blockedUsers: r.blockedUsers ?? 0,
  }));
}

async function fetchPlanDistribution(period: PeriodType): Promise<PlanDistributionData[]> {
  const data = await api.get<any>(`${apiEndpoints.admin.plans}/distribution?period=${period}`);
  const raw = toArray<any>(data?.data ?? data?.plans ?? data);
  return raw.map((p: any) => ({
    planId: p.planId ?? p.id ?? "",
    planName: p.planName ?? p.name ?? "",
    subscribers: p.subscribers ?? 0,
    revenue: p.revenue ?? 0,
    percentage: p.percentage ?? 0,
  }));
}

async function fetchChurnData(period: PeriodType): Promise<ChurnDataPoint[]> {
  const year = new Date().getFullYear();
  const data = await api.get<any>(`${apiEndpoints.admin.churn}?period=${period}&year=${year}`);
  const raw = toArray<any>(data?.churnByPeriod ?? data);
  return raw.map((c: any) => ({
    period: c.period ?? "",
    cancelledCount: c.cancelledCount ?? 0,
    cancelledRevenue: c.cancelledRevenue ?? 0,
    churnRate: c.churnRate ?? 0,
    reason: c.reason ?? "",
  }));
}

async function fetchCashflow(): Promise<CashflowEntry[]> {
  const year = new Date().getFullYear();
  const data = await api.get<any>(`${apiEndpoints.admin.cashflow}?year=${year}`);
  const raw = toArray<any>(data?.data ?? data?.entries ?? data);
  return raw.map((e: any) => ({
    id: e.id ?? "",
    date: e.date ?? "",
    type: e.type ?? "revenue",
    category: e.category ?? "",
    description: e.description ?? "",
    amount: e.amount ?? 0,
    balance: e.balance ?? 0,
    subscriptionId: e.subscriptionId ?? null,
    userId: e.userId ?? null,
  }));
}

// ============================================
// COMBINED FETCHER
// ============================================

const ENDPOINT_LABELS: Record<number, string> = {
  0: "Stats",
  1: "Receita",
  2: "Gráfico de Receita",
  3: "Crescimento de Usuários",
  4: "Distribuição de Planos",
  5: "Churn",
  6: "Cashflow",
};

async function fetchAdminReports(period: PeriodType): Promise<AdminReportsData> {
  const results = await Promise.allSettled([
    fetchStats(period),
    fetchRevenueData(period),
    fetchRevenueChart(period),
    fetchUserGrowth(period),
    fetchPlanDistribution(period),
    fetchChurnData(period),
    fetchCashflow(),
  ]);

  const [stats, revenueData, revenueChart, userGrowth, planDistribution, churnData, cashflow] = results;

  const failedEndpoints: string[] = [];
  const apiErrors: Record<string, string> = {};

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const label = ENDPOINT_LABELS[index];
      failedEndpoints.push(label);
      const err = result.reason;
      apiErrors[label] = err?.response?.data?.message ?? err?.message ?? String(err);
    }
  });

  return {
    stats: extractData<AdminReportsStats>(stats) ?? EMPTY_STATS,
    revenueData: extractData<RevenueDataPoint[]>(revenueData) ?? [],
    revenueChart: extractData<RevenueChartData>(revenueChart) ?? EMPTY_REVENUE_CHART,
    userGrowth: extractData<UserGrowthDataPoint[]>(userGrowth) ?? [],
    planDistribution: extractData<PlanDistributionData[]>(planDistribution) ?? [],
    churnData: extractData<ChurnDataPoint[]>(churnData) ?? [],
    cashflow: extractData<CashflowEntry[]>(cashflow) ?? [],
    failedEndpoints,
    apiErrors,
  };
}

// ============================================
// HOOK
// ============================================

export function useAdminReports(period: PeriodType = "monthly") {
  return useQuery({
    queryKey: ["admin", "reports", period],
    queryFn: () => fetchAdminReports(period),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

