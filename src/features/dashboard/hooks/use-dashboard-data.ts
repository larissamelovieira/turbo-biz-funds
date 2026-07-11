import { useQuery } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardData, DashboardStat, ExpenseByDay, CategoryExpense, Goal } from "../types";
import type { Transaction, Recurrence } from "@/shared/types";
import { fmtBRL } from "@/lib/format";

const CHART_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#94a3b8", "#8b5cf6", "#ec4899", "#14b8a6",
];

interface BalanceData { income: number; expense: number; balance: number }
interface CategorySummaryItem { categoryId: string; income: number; expense: number }
interface CategoryItem { id: string; name: string }
interface ApiTransaction {
  id: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  occurredAt: string;
  recurringId?: string | null;
}
interface ApiGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  deadline: string;
  color?: string;
  icon?: string;
  category?: string;
}

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case "daily": return amount * 30;
    case "weekly": return amount * (52 / 12);
    case "yearly": return amount / 12;
    default: return amount;
  }
}

async function fetchDashboard(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // backend só reconhece period fixo (weekly/15d/30d) — valores arbitrários voltam vazios
  const period = "30d";

  const [balanceRes, transactionsRes, categoriesRes, catSummaryRes, goalsRes, recurrencesRes] = await Promise.all([
    api.get<{ data: BalanceData }>(`${apiEndpoints.summary.balance}?period=${period}`).catch(() => ({ data: { income: 0, expense: 0, balance: 0 } })),
    api.get<{ data: ApiTransaction[] }>(`${apiEndpoints.transactions.list}?period=${period}`).catch(() => ({ data: [] as ApiTransaction[] })),
    api.get<{ data: CategoryItem[] }>(apiEndpoints.categories.list).catch(() => ({ data: [] as CategoryItem[] })),
    api.get<{ data: CategorySummaryItem[] }>(`${apiEndpoints.summary.categories}?period=${period}`).catch(() => ({ data: [] as CategorySummaryItem[] })),
    api.get<{ data: ApiGoal[] }>(apiEndpoints.goals.list).catch(() => ({ data: [] as ApiGoal[] })),
    api.get<{ data: Recurrence[] }>(apiEndpoints.recurrences.active).catch(() => ({ data: [] as Recurrence[] })),
  ]);

  const recurrences: Recurrence[] = Array.isArray(recurrencesRes?.data)
    ? recurrencesRes.data
    : [];

  const transactions = transactionsRes.data.filter((t) => {
    const d = new Date(t.occurredAt);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const categories = categoriesRes.data;
  let catSummary = catSummaryRes.data;
  const apiGoals = goalsRes.data;

  const paidRecurrenceIds = new Set(
    transactions
      .filter((t) => t.recurringId)
      .map((t) => t.recurringId)
  );

  const unpaidRecurrences = recurrences.filter(
    (r) => !paidRecurrenceIds.has(r.id)
  );

  const recurringIncome = unpaidRecurrences
    .filter((r) => r.type === "INCOME")
    .reduce((acc, r) => acc + monthlyEquivalent(r.amount, r.frequency), 0);

  const recurringExpense = unpaidRecurrences
    .filter((r) => r.type === "EXPENSE")
    .reduce((acc, r) => acc + monthlyEquivalent(r.amount, r.frequency), 0);

  const balance = {
    income: balanceRes.data.income + recurringIncome,
    expense: balanceRes.data.expense + recurringExpense,
    balance: balanceRes.data.balance + recurringIncome - recurringExpense,
  };

  if (catSummary.length === 0 && unpaidRecurrences.length > 0) {
    catSummary = unpaidRecurrences
      .filter((r) => r.type === "EXPENSE")
      .map((r) => ({
        categoryId: r.categoryId,
        income: 0,
        expense: monthlyEquivalent(r.amount, r.frequency),
      }));
  }

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const stats: DashboardStat[] = [
    {
      id: "balance",
      title: "Saldo do Mês",
      value: fmtBRL(balance.balance),
      change: balance.balance >= 0 ? "positivo" : "negativo",
      trend: balance.balance >= 0 ? "up" : "down",
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      id: "income",
      title: "Receitas",
      value: fmtBRL(balance.income),
      change: "",
      trend: "up",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "expenses",
      title: "Despesas",
      value: fmtBRL(balance.expense),
      change: "",
      trend: "down",
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const dayMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const day = new Date(t.occurredAt).getDate().toString().padStart(2, "0");
      dayMap.set(day, (dayMap.get(day) ?? 0) + t.amount);
    });
  const expensesByDay: ExpenseByDay[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day, value }));

  const categoryExpenses: CategoryExpense[] = catSummary
    .filter((item) => item.expense > 0)
    .map((item, i) => ({
      name: catMap.get(item.categoryId) ?? "Sem categoria",
      value: item.expense,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const recentTransactions: Transaction[] = transactions.length > 0
    ? transactions.slice(0, 5).map((t) => ({
        id: t.id,
        description: t.description ?? "Sem descrição",
        amount: t.type === "EXPENSE" ? -t.amount : t.amount,
        date: new Date(t.occurredAt).toLocaleDateString("pt-BR"),
        category: catMap.get(t.categoryId) ?? "Sem categoria",
        type: t.type === "INCOME" ? "income" : "expense",
      }))
    : unpaidRecurrences.slice(0, 5).map((r) => ({
        id: r.id,
        description: r.description ?? (r.type === "EXPENSE" ? "Despesa fixa" : "Receita fixa"),
        amount: r.type === "EXPENSE" ? -r.amount : r.amount,
        date: new Date(r.startDate).toLocaleDateString("pt-BR"),
        category: catMap.get(r.categoryId) ?? "Sem categoria",
        type: r.type === "INCOME" ? "income" : "expense",
      }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goals: Goal[] = apiGoals.slice(0, 4).map((g: any) => ({
    id: g.id,
    name: g.name ?? g.title ?? "",
    current: Number(g.current ?? g.current_value ?? 0),
    target: Number(g.target ?? g.target_value ?? 0),
    deadline: g.deadline ?? g.target_date ?? "",
    color: g.color ?? "#10b981",
    icon: g.icon ?? "🎯",
    category: g.category ?? g.goal_category ?? "Geral",
  }));

  return {
    stats,
    expensesByDay,
    categoryExpenses,
    recentTransactions,
    goals,
  };
}

interface UseDashboardOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useDashboardData = (options: UseDashboardOptions = {}) => {
  const { enabled = true, refetchInterval } = options;

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
