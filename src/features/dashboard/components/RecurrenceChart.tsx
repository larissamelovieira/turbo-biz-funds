import { useQuery } from "@tanstack/react-query";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw } from "lucide-react";
import { api, apiEndpoints } from "@/lib/api/client";
import { fmtBRL } from "@/lib/format";
import type { Recurrence } from "@/shared/types";

const CHART_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#94a3b8", "#8b5cf6", "#ec4899", "#14b8a6",
];

interface CategoryItem { id: string; name: string }

interface RecurrenceChartData {
  name: string;
  value: number;
  color: string;
}

async function fetchRecurrenceChartData(): Promise<RecurrenceChartData[]> {
  const [recRes, catRes] = await Promise.all([
    api.get<{ data: Recurrence[] }>(apiEndpoints.recurrences.active),
    api.get<{ data: CategoryItem[] }>(apiEndpoints.categories.list),
  ]);

  const recurrences: Recurrence[] = Array.isArray(recRes)
    ? (recRes as unknown as Recurrence[])
    : Array.isArray(recRes?.data)
      ? recRes.data
      : [];

  const categories: CategoryItem[] = Array.isArray(catRes)
    ? (catRes as unknown as CategoryItem[])
    : catRes.data ?? [];

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const monthlyEquivalent = (amount: number, frequency: string): number => {
    switch (frequency?.toLowerCase()) {
      case "daily": return amount * 30;
      case "weekly": return amount * (52 / 12);
      case "yearly": return amount / 12;
      default: return amount;
    }
  };

  const totals = new Map<string, number>();
  recurrences
    .filter((r) => r.active && r.type === "EXPENSE")
    .forEach((r) => {
      const prev = totals.get(r.categoryId) ?? 0;
      totals.set(r.categoryId, prev + monthlyEquivalent(r.amount, r.frequency));
    });

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([catId, value], i) => ({
      name: catMap.get(catId) ?? "Outros",
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

export function RecurrenceChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["recurrence-chart"],
    queryFn: fetchRecurrenceChartData,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">Recorrências por Categoria</span>
        </div>
        <p className="text-xs text-gray-400 ml-9">Total mensal de despesas fixas</p>
      </div>

      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-muted-foreground/30 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Nenhuma recorrência de despesa</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <RePieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 16px -2px rgb(0 0 0 / 0.08)",
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value: number, name: string) => [fmtBRL(value), name]}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
              {data.map((cat, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate max-w-24">{cat.name}</span>
                  <span className="text-gray-400">{fmtBRL(cat.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
