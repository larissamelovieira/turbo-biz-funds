import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import { useActiveRecurrences } from "@/features/recurrences/hooks/use-recurrences";
import { fmtBRL, fmtNumber } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiTransaction {
  id: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  occurredAt: string;
  recurringId?: string | null;
}

interface ApiCategory {
  id: string;
  name: string;
}

interface Recurrence {
  id: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  active: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2026;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FREQUENCY_LABELS: Record<Recurrence["frequency"], string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// fmt = fmtNumber (importado de @/lib/format)
const fmt = fmtNumber;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface MonthGroupProps {
  monthIndex: number;
  transactions: ApiTransaction[];
  catMap: Map<string, string>;
}

function MonthGroup({ monthIndex, transactions, catMap }: MonthGroupProps) {
  const [expanded, setExpanded] = useState(true);

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Month header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">
            {MONTH_NAMES[monthIndex]}
          </span>
          <span className="text-xs text-muted-foreground">
            ({transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-emerald-500 hidden sm:inline">
            +R$ {fmt(income)}
          </span>
          <span className="text-xs font-medium text-red-500 hidden sm:inline">
            −R$ {fmt(expense)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Transaction rows */}
      {expanded && (
        <div className="divide-y divide-border">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === "INCOME";
            const catName = catMap.get(transaction.categoryId) ?? "Sem categoria";
            return (
              <div
                key={transaction.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-4 py-3 bg-card hover:bg-accent/40 transition-all duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm leading-tight truncate">
                      {transaction.description ?? "Sem descrição"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0 h-5 bg-background font-normal shrink-0"
                      >
                        {catName}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(transaction.occurredAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 sm:ml-3 pl-12 sm:pl-0">
                  <span
                    className={`font-bold text-sm ${
                      isIncome ? "text-emerald-500" : "text-foreground"
                    }`}
                  >
                    {isIncome ? "+" : "−"}R$ {fmt(transaction.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RecurrenceCardProps {
  recurrence: Recurrence;
  catMap: Map<string, string>;
}

function RecurrenceCard({ recurrence, catMap }: RecurrenceCardProps) {
  const isIncome = recurrence.type === "INCOME";
  const catName = catMap.get(recurrence.categoryId) ?? "Sem categoria";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-all duration-150">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}
        >
          <RefreshCw
            className={`w-4 h-4 ${isIncome ? "text-emerald-500" : "text-red-500"}`}
          />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm leading-tight truncate">
            {recurrence.description ?? "Sem descrição"}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-5 bg-background font-normal shrink-0"
            >
              {catName}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-5 bg-primary/5 border-primary/20 text-primary font-normal shrink-0"
            >
              {FREQUENCY_LABELS[recurrence.frequency]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0 h-5 font-normal shrink-0 ${
                recurrence.active
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {recurrence.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="text-left sm:text-right shrink-0 sm:ml-3 pl-[52px] sm:pl-0">
        <span
          className={`font-bold text-base ${
            isIncome ? "text-emerald-500" : "text-foreground"
          }`}
        >
          {isIncome ? "+" : "−"}R$ {fmt(recurrence.amount)}
        </span>
        <p className="text-xs text-muted-foreground capitalize">
          {isIncome ? "receita" : "despesa"}
        </p>
      </div>
    </div>
  );
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "income" ? "Receitas" : "Despesas"}: {fmtBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function RelatorioSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-14 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-10 rounded-lg bg-muted w-48" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function RelatorioPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());

  // period=30d é uma janela relativa que só olha pra trás a partir de hoje,
  // então nunca trazia lançamentos fora dos últimos 30 dias (incluindo
  // futuros, tipo salário lançado via bot pra um mês adiante). Buscamos um
  // range fixo e amplo via period=custom uma única vez — o filtro por
  // ano/mês selecionado continua sendo feito no client, como antes.
  const rangeStart = new Date(START_YEAR, 0, 1).toISOString();
  const rangeEnd = new Date(CURRENT_YEAR + 3, 11, 31, 23, 59, 59, 999).toISOString();
  const { data: transactionsRes, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions", "relatorio"],
    queryFn: () =>
      api.get<{ data: ApiTransaction[] }>(
        `${apiEndpoints.transactions.list}?period=custom&from=${rangeStart}&to=${rangeEnd}`
      ),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch categories
  const { data: categoriesRes, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<{ data: ApiCategory[] }>(apiEndpoints.categories.list),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recurrences — usa o mesmo hook (e mesma query key) das outras páginas
  const { recurrences, isLoading: isLoadingRecurrences } = useActiveRecurrences();

  const isLoading =
    isLoadingTransactions || isLoadingCategories || isLoadingRecurrences;

  const allTransactions = transactionsRes?.data ?? [];
  const categories = categoriesRes?.data ?? [];

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  // Anos disponíveis — inclui anos futuros alcançados por parcelas de
  // recorrências (ex: compra parcelada em 24x pode terminar 2 anos à frente)
  // ou por transações reais fora do ano atual (ex: lançamento manual/bot
  // com data futura).
  const availableYears = useMemo(() => {
    let maxYear = CURRENT_YEAR;
    for (const r of recurrences) {
      if (r.endDate) {
        const y = new Date(r.endDate).getFullYear();
        if (y > maxYear) maxYear = y;
      }
    }
    for (const t of allTransactions) {
      const y = new Date(t.occurredAt).getFullYear();
      if (y > maxYear) maxYear = y;
    }
    return Array.from({ length: maxYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);
  }, [recurrences, allTransactions]);

  // Filter transactions by selected year
  const yearTransactions = useMemo(
    () =>
      allTransactions.filter((t) => {
        const year = new Date(t.occurredAt).getFullYear();
        return year === selectedYear;
      }),
    [allTransactions, selectedYear]
  );

  // Visible months for the month selector — always all 12 months
  const visibleMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  // Filter by selected month
  const filteredTransactions = useMemo(
    () =>
      selectedMonth !== null
        ? yearTransactions.filter(
            (t) => new Date(t.occurredAt).getMonth() === selectedMonth
          )
        : yearTransactions,
    [yearTransactions, selectedMonth]
  );

  // Projeção baseada em recorrências ativas — usada quando o mês não tem
  // transação real (ex: mês futuro), já que o backend só gera a transação
  // real quando o mês efetivamente chega. Considera todas as frequências,
  // não só mensal.
  // Recorrências ainda não pagas nesse mês (sem transação real com esse recurringId)
  // — soma sobre o que já existe de real, não substitui. Considera todas as
  // frequências, não só mensal.
  // Itens (não só totais) das recorrências ainda não pagas nesse mês, pra
  // poder listar junto das transações reais.
  const unpaidRecurrenceEntriesForMonth = (
    year: number,
    monthIdx: number,
    monthTxs: ApiTransaction[]
  ): ApiTransaction[] => {
    const paidRecurrenceIds = new Set(
      monthTxs.filter((t) => t.recurringId).map((t) => t.recurringId)
    );
    const monthStart = new Date(year, monthIdx, 1);
    const monthEnd = new Date(year, monthIdx + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const entries: ApiTransaction[] = [];
    for (const r of recurrences) {
      if (!r.active) continue;
      if (paidRecurrenceIds.has(r.id)) continue;
      const start = new Date(r.startDate);
      const end = r.endDate ? new Date(r.endDate) : null;
      if (start > monthEnd) continue;
      if (end && end < monthStart) continue;

      const frequency = r.frequency?.toLowerCase();
      let occurrencesInMonth = 0;
      if (frequency === "monthly") occurrencesInMonth = 1;
      else if (frequency === "yearly") occurrencesInMonth = start.getMonth() === monthIdx ? 1 : 0;
      else if (frequency === "weekly") occurrencesInMonth = daysInMonth / 7;
      else if (frequency === "daily") occurrencesInMonth = daysInMonth;

      if (occurrencesInMonth === 0) continue;
      const value = r.amount * occurrencesInMonth;
      entries.push({
        id: `recurring-projected-${r.id}-${year}-${monthIdx}`,
        categoryId: r.categoryId,
        type: r.type,
        amount: value,
        description: `${r.description ?? "Recorrência"} (recorrência)`,
        occurredAt: (start > monthStart ? start : monthStart).toISOString(),
        recurringId: r.id,
      });
    }
    return entries;
  };

  const unpaidRecurrencesForMonth = (
    year: number,
    monthIdx: number,
    monthTxs: ApiTransaction[]
  ) => {
    const entries = unpaidRecurrenceEntriesForMonth(year, monthIdx, monthTxs);
    return {
      income: entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0),
      expense: entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0),
    };
  };

  const hasRealDataForMonth = (year: number, monthIdx: number) =>
    allTransactions.some((t) => {
      const d = new Date(t.occurredAt);
      return d.getFullYear() === year && d.getMonth() === monthIdx;
    });

  // Valor real + recorrências ainda não pagas desse mês
  const monthlyValues = (year: number, monthIdx: number) => {
    const monthTxs = allTransactions.filter((t) => {
      const d = new Date(t.occurredAt);
      return d.getFullYear() === year && d.getMonth() === monthIdx;
    });
    const realIncome = monthTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const realExpense = monthTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const unpaid = unpaidRecurrencesForMonth(year, monthIdx, monthTxs);
    return {
      income: realIncome + unpaid.income,
      expense: realExpense + unpaid.expense,
      projected: unpaid.income > 0 || unpaid.expense > 0,
    };
  };

  // Summary totals — soma todos os meses do período selecionado (mês único
  // ou o ano inteiro), usando real quando existe e projeção quando não existe.
  const isProjectedPeriod =
    selectedMonth !== null && !hasRealDataForMonth(selectedYear, selectedMonth);

  const totalIncome = selectedMonth !== null
    ? monthlyValues(selectedYear, selectedMonth).income
    : visibleMonths.reduce((s, m) => s + monthlyValues(selectedYear, m).income, 0);
  const totalExpense = selectedMonth !== null
    ? monthlyValues(selectedYear, selectedMonth).expense
    : visibleMonths.reduce((s, m) => s + monthlyValues(selectedYear, m).expense, 0);
  const balance = totalIncome - totalExpense;

  // Group by month (0-indexed) — inclui transações reais + recorrências
  // ainda não pagas desse mês (ex: parcela do mês que ainda não caiu).
  const transactionsByMonth = useMemo(() => {
    const map = new Map<number, ApiTransaction[]>();
    for (const t of filteredTransactions) {
      const month = new Date(t.occurredAt).getMonth();
      const existing = map.get(month) ?? [];
      map.set(month, [...existing, t]);
    }

    const monthsToCheck = selectedMonth !== null ? [selectedMonth] : visibleMonths;
    for (const monthIdx of monthsToCheck) {
      const monthTxs = allTransactions.filter((t) => {
        const d = new Date(t.occurredAt);
        return d.getFullYear() === selectedYear && d.getMonth() === monthIdx;
      });
      const unpaidEntries = unpaidRecurrenceEntriesForMonth(selectedYear, monthIdx, monthTxs);
      if (unpaidEntries.length === 0) continue;
      const existing = map.get(monthIdx) ?? [];
      map.set(monthIdx, [...existing, ...unpaidEntries]);
    }

    // Sort within each month by date descending
    for (const [key, txs] of map.entries()) {
      map.set(
        key,
        [...txs].sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
      );
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTransactions, allTransactions, recurrences, selectedYear, selectedMonth, visibleMonths]);

  // Months present in data, sorted ascending
  const presentMonths = useMemo(
    () => [...transactionsByMonth.keys()].sort((a, b) => a - b),
    [transactionsByMonth]
  );

  // Total exibido na lista — inclui transações reais + parcelas/recorrências
  // projetadas ainda não pagas, senão a contagem e o "sem transações" ficam
  // fora de sincronia com o que os cards de resumo mostram.
  const totalDisplayedCount = useMemo(
    () =>
      Array.from(transactionsByMonth.values()).reduce(
        (s, txs) => s + txs.length,
        0
      ),
    [transactionsByMonth]
  );

  // Chart data — uses yearTransactions (full year, ignores month filter).
  // Meses sem transação real usam projeção de recorrências ativas.
  const chartData = useMemo(() => {
    return visibleMonths.map((mIdx) => {
      const values = monthlyValues(selectedYear, mIdx);
      return {
        month: MONTH_NAMES[mIdx].slice(0, 3),
        monthIndex: mIdx,
        income: values.income,
        expense: values.expense,
        projected: values.projected,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonths, yearTransactions, recurrences, selectedYear]);

  function exportExcel() {
    // Sheet 1: Transações
    const txRows = filteredTransactions.map((t) => ({
      Data: new Date(t.occurredAt).toLocaleDateString("pt-BR"),
      Tipo: t.type === "INCOME" ? "Receita" : "Despesa",
      Categoria: catMap.get(t.categoryId) ?? "Sem categoria",
      Descrição: t.description ?? "",
      "Valor (R$)": t.amount,
    }));

    // Sheet 2: Recorrências
    const recRows = recurrences.map((r) => ({
      Descrição: r.description ?? "",
      Tipo: r.type === "INCOME" ? "Receita" : "Despesa",
      Categoria: catMap.get(r.categoryId) ?? "Sem categoria",
      Frequência: FREQUENCY_LABELS[r.frequency],
      "Valor (R$)": r.amount,
      Ativo: r.active ? "Sim" : "Não",
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transações");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), "Recorrências");

    const label = selectedMonth !== null
      ? `${MONTH_NAMES[selectedMonth]}_${selectedYear}`
      : `${selectedYear}`;
    XLSX.writeFile(wb, `relatorio_${label}.xlsx`);
  }

  if (isLoading) return <RelatorioSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1a3799]/10 shrink-0">
            <BarChart2 className="h-5 w-5 text-[#1a3799]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Relatório</h2>
            <p className="text-sm text-gray-500">
              Acompanhe seu desempenho financeiro
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none"
            onClick={exportExcel}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Ano:</span>
        <div className="flex gap-1.5 bg-muted/50 rounded-lg p-1 border border-border">
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => { setSelectedYear(year); setSelectedMonth(null); }}
              className={`px-3 py-1 text-sm rounded-md transition-colors font-medium ${
                selectedYear === year
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground shrink-0">Mês:</span>
        <div className="flex gap-1 flex-wrap overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedMonth(null)}
            className={`px-3 py-1 text-sm rounded-md transition-colors font-medium border ${
              selectedMonth === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {visibleMonths.map((mIdx) => (
            <button
              key={mIdx}
              type="button"
              onClick={() => setSelectedMonth(mIdx)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors font-medium border whitespace-nowrap ${
                selectedMonth === mIdx
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="hidden sm:inline">{MONTH_NAMES[mIdx]}</span>
              <span className="sm:hidden">{MONTH_NAMES[mIdx].slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary notice */}
      <p className="text-xs text-muted-foreground -mt-2">
        {isProjectedPeriod
          ? `Este mês ainda não tem lançamentos — valores abaixo são uma projeção baseada nas suas recorrências ativas.`
          : `Exibindo transações disponíveis no sistema para ${selectedYear}. Os dados refletem o histórico carregado da API.`}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Receitas
              </p>
              <p className="text-xl font-bold text-emerald-500">
                R$ {fmt(totalIncome)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Despesas
              </p>
              <p className="text-xl font-bold text-red-500">
                R$ {fmt(totalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                balance >= 0 ? "bg-primary/10" : "bg-red-500/10"
              }`}
            >
              <Wallet
                className={`w-5 h-5 ${
                  balance >= 0 ? "text-primary" : "text-red-500"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Saldo
              </p>
              <p
                className={`text-xl font-bold ${
                  balance >= 0 ? "text-primary" : "text-red-500"
                }`}
              >
                {balance < 0 ? "−" : ""}R$ {fmt(Math.abs(balance))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions: chart left + list right */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Transações de {selectedYear}
              </h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalDisplayedCount} transaç{totalDisplayedCount === 1 ? "ão" : "ões"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: chart */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Evolução Mensal
              </p>
              {chartData.every((d) => d.income === 0 && d.expense === 0) ? (
                <div className="text-center py-10 text-muted-foreground">
                  <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sem dados para exibir</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(value) =>
                        value === "income" ? "Receitas" : "Despesas"
                      }
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Bar
                      dataKey="income"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="income"
                      opacity={
                        selectedMonth !== null
                          ? chartData.map((d) =>
                              d.monthIndex === selectedMonth ? 1 : 0.35
                            )
                          : 1
                      }
                    />
                    <Bar
                      dataKey="expense"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      name="expense"
                      opacity={
                        selectedMonth !== null
                          ? chartData.map((d) =>
                              d.monthIndex === selectedMonth ? 1 : 0.35
                            )
                          : 1
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* RIGHT: list */}
            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
              {totalDisplayedCount === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm mt-1 opacity-70">
                    Selecione outro período ou registre movimentações.
                  </p>
                </div>
              ) : (
                presentMonths.map((monthIndex) => {
                  const txs = transactionsByMonth.get(monthIndex) ?? [];
                  return (
                    <MonthGroup
                      key={monthIndex}
                      monthIndex={monthIndex}
                      transactions={txs}
                      catMap={catMap}
                    />
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recurrences section — always visible */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Transações Recorrentes
              </h3>
            </div>
            {recurrences.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {recurrences.length} recorrênci
                {recurrences.length === 1 ? "a" : "as"}
              </span>
            )}
          </div>
          {recurrences.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhuma recorrência ativa</p>
              <p className="text-xs mt-1 opacity-70">
                Adicione transações recorrentes para acompanhá-las aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: chart */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Valor por Recorrência
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={recurrences.map((r) => ({
                      name: (r.description ?? "Sem desc.").slice(0, 12),
                      value: r.amount,
                    }))}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
                      width={52}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        fmtBRL(value),
                        "Valor",
                      ]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {recurrences.map((r) => (
                        <Cell
                          key={r.id}
                          fill={r.type === "INCOME" ? "#10b981" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* RIGHT: list */}
              <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2">
                {recurrences.map((recurrence) => (
                  <RecurrenceCard
                    key={recurrence.id}
                    recurrence={recurrence}
                    catMap={catMap}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
