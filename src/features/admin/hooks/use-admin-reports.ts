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
// DADOS MOCK (FALLBACK)
// ============================================

const MOCK_STATS: AdminReportsStats = {
  totalRevenue: 12450,
  revenueChange: "+12%",
  revenueTrend: "up",
  newUsers: 1234,
  usersChange: "+8%",
  usersTrend: "up",
  conversionRate: 23.4,
  conversionChange: "+2.1%",
  conversionTrend: "up",
};

const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { month: "2026-01", revenue: 10000, expenses: 2000, netRevenue: 8000, mrr: 10000, newSubscriptions: 50, cancellations: 10, churnRate: 2.5 },
  { month: "2026-02", revenue: 11000, expenses: 2200, netRevenue: 8800, mrr: 11000, newSubscriptions: 55, cancellations: 8, churnRate: 2.1 },
  { month: "2026-03", revenue: 11500, expenses: 2400, netRevenue: 9100, mrr: 11500, newSubscriptions: 45, cancellations: 12, churnRate: 2.8 },
  { month: "2026-04", revenue: 12000, expenses: 2500, netRevenue: 9500, mrr: 12000, newSubscriptions: 60, cancellations: 9, churnRate: 2.0 },
  { month: "2026-05", revenue: 12450, expenses: 2600, netRevenue: 9850, mrr: 12450, newSubscriptions: 58, cancellations: 7, churnRate: 1.8 },
];

const MOCK_REVENUE_CHART: RevenueChartData = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
  datasets: {
    revenue: [10000, 11000, 11500, 12000, 12450],
    expenses: [2000, 2200, 2400, 2500, 2600],
    netRevenue: [8000, 8800, 9100, 9500, 9850],
  },
};

const MOCK_USER_GROWTH: UserGrowthDataPoint[] = [
  { period: "2026-01", totalUsers: 500, newUsers: 80, activeUsers: 420, inactiveUsers: 50, blockedUsers: 30 },
  { period: "2026-02", totalUsers: 580, newUsers: 100, activeUsers: 480, inactiveUsers: 60, blockedUsers: 40 },
  { period: "2026-03", totalUsers: 680, newUsers: 120, activeUsers: 550, inactiveUsers: 80, blockedUsers: 50 },
  { period: "2026-04", totalUsers: 780, newUsers: 140, activeUsers: 630, inactiveUsers: 90, blockedUsers: 60 },
  { period: "2026-05", totalUsers: 900, newUsers: 160, activeUsers: 720, inactiveUsers: 100, blockedUsers: 80 },
];

const MOCK_PLAN_DISTRIBUTION: PlanDistributionData[] = [
  { planId: "free", planName: "Gratuito", subscribers: 500, revenue: 0, percentage: 65 },
  { planId: "pro", planName: "Pro", subscribers: 200, revenue: 5980, percentage: 26 },
  { planId: "business", planName: "Business", subscribers: 70, revenue: 6470, percentage: 9 },
];

const MOCK_CHURN_DATA: ChurnDataPoint[] = [
  { period: "2026-01", cancelledCount: 10, cancelledRevenue: 299, churnRate: 2.5, reason: "cancelado pelo usuário" },
  { period: "2026-02", cancelledCount: 8, cancelledRevenue: 249, churnRate: 2.1, reason: "falta de uso" },
  { period: "2026-03", cancelledCount: 12, cancelledRevenue: 399, churnRate: 2.8, reason: "problemas financeiros" },
  { period: "2026-04", cancelledCount: 9, cancelledRevenue: 299, churnRate: 2.0, reason: "cancelado pelo usuário" },
  { period: "2026-05", cancelledCount: 7, cancelledRevenue: 199, churnRate: 1.8, reason: "falta de uso" },
];

const MOCK_CASHFLOW: CashflowEntry[] = [
  { id: "1", date: "2026-05-01", type: "revenue", category: "assinatura", description: "Nova assinatura Pro", amount: 29.90, balance: 12450, subscriptionId: "sub-1", userId: "user-1" },
  { id: "2", date: "2026-05-02", type: "revenue", category: "upgrade", description: "Upgrade para Business", amount: 99.90, balance: 12540, subscriptionId: "sub-2", userId: "user-2" },
  { id: "3", date: "2026-05-03", type: "expense", category: "infraestrutura", description: "Servidor AWS", amount: -250, balance: 12290, subscriptionId: null, userId: null },
  { id: "4", date: "2026-05-05", type: "revenue", category: "assinatura", description: "Renovação Business", amount: 99.90, balance: 12390, subscriptionId: "sub-3", userId: "user-3" },
  { id: "5", date: "2026-05-06", type: "expense", category: "marketing", description: "Ads Facebook", amount: -150, balance: 12240, subscriptionId: null, userId: null },
];

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
    labels: data?.labels ?? MOCK_REVENUE_CHART.labels,
    datasets: {
      revenue: data?.datasets?.revenue ?? MOCK_REVENUE_CHART.datasets.revenue,
      expenses: data?.datasets?.expenses ?? MOCK_REVENUE_CHART.datasets.expenses,
      netRevenue: data?.datasets?.netRevenue ?? MOCK_REVENUE_CHART.datasets.netRevenue,
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
    stats: extractData<AdminReportsStats>(stats) ?? MOCK_STATS,
    revenueData: extractData<RevenueDataPoint[]>(revenueData) ?? MOCK_REVENUE_DATA,
    revenueChart: extractData<RevenueChartData>(revenueChart) ?? MOCK_REVENUE_CHART,
    userGrowth: extractData<UserGrowthDataPoint[]>(userGrowth) ?? MOCK_USER_GROWTH,
    planDistribution: extractData<PlanDistributionData[]>(planDistribution) ?? MOCK_PLAN_DISTRIBUTION,
    churnData: extractData<ChurnDataPoint[]>(churnData) ?? MOCK_CHURN_DATA,
    cashflow: extractData<CashflowEntry[]>(cashflow) ?? MOCK_CASHFLOW,
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

// ============================================
// EXPORTS
// ============================================

export { MOCK_STATS, MOCK_REVENUE_DATA, MOCK_USER_GROWTH, MOCK_PLAN_DISTRIBUTION, MOCK_CHURN_DATA };