import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { TrendingDown } from "lucide-react";
import { ExpenseByDay } from "../types";
import { fmtBRL } from "@/lib/format";

interface ExpenseChartProps {
  data: ExpenseByDay[];
}

export const ExpenseChart = ({ data }: ExpenseChartProps) => {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">Gastos do Mês</span>
        </div>
        <p className="text-xs text-gray-400 ml-9">Evolução dos seus gastos ao longo do mês</p>
      </div>

      <div className="px-2 pb-4">
        {data.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2">
            <TrendingDown className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 24, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 93%)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 16px -2px rgb(0 0 0 / 0.08)",
                  fontSize: 12,
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [fmtBRL(value), "Despesa"]}
                cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: "#ef4444", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#ef4444", strokeWidth: 0 }}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={10}
                  formatter={(value: number) => fmtBRL(value)}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#ef4444" }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
