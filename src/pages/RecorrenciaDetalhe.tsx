import { memo, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Repeat,
  Calendar,
  CalendarOff,
  Infinity as InfinityIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveRecurrences } from "@/features/recurrences/hooks/use-recurrences";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { api, apiEndpoints } from "@/lib/api/client";
import type { Recurrence } from "@/shared/types";
import { fmtBRL, fmtNumber } from "@/lib/format";

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<Recurrence["frequency"], string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

// ─── Date helpers (no external libs) ─────────────────────────────────────────

/**
 * Parseia "YYYY-MM-DD" como data LOCAL (não UTC).
 * new Date("YYYY-MM-DD") interpreta como UTC midnight, causando bugs de
 * timezone em Brasil (UTC-3): Dec 31 21h local → getMonth() = 11 (dez) em vez de 0 (jan).
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight — sem timezone shift
}

/** "YYYY-MM-DD" a partir de Date local (sem conversão UTC). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addInterval(date: Date, frequency: Recurrence["frequency"]): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

/** Returns all installment dates from startDate to endDate (inclusive).
 *  O endDate na API pode ser startDate + N meses (N = número de parcelas),
 *  então calculamos diffMonths entre start e end, e esse é o total de parcelas.
 *  Ex: jul/2026 a jul/2027 = 12 meses de diff = 12 parcelas (jul..jun).
 */
function buildInstallments(
  startDate: string,
  endDate: string,
  frequency: Recurrence["frequency"]
): Date[] {
  const dates: Date[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const departure = new Date(start);
  for (let i = 0; i < diffMonths; i++) {
    const parcelDate = new Date(departure.getFullYear(), departure.getMonth() + i, departure.getDate());
    dates.push(parcelDate);
  }
  console.log("buildInstallments result:", dates.map(d => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`));
  return dates;
}

/** Returns occurrences from 12 months ago to next N occurrences. */
function buildOccurrences(
  startDate: string,
  frequency: Recurrence["frequency"],
  count: number,
  endDate?: string
): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startWindow = new Date(today);
  startWindow.setMonth(startWindow.getMonth() - 12);
  const end = endDate ? parseLocalDate(endDate) : null;
  const results: Date[] = [];
  let current = parseLocalDate(startDate);
  let guard = 0;

  while (results.length < count && guard < 10000) {
    if (end && current > end) break;
    if (current >= startWindow) {
      results.push(new Date(current));
    }
    current = addInterval(current, frequency);
    guard++;
  }
  return results;
}

// fmt = fmtNumber (importado de @/lib/format)
const fmt = fmtNumber;

function fmtDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <Repeat className="h-14 w-14 text-muted-foreground/30 mb-4" />
      <h2 className="text-lg font-semibold mb-2">Recorrência não encontrada</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Esta recorrência pode ter sido removida ou o link está incorreto.
      </p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Recorrências
      </Button>
    </div>
  );
}

// ─── Projection card (when endDate exists) ────────────────────────────────────

function ProjectionTable({
  rec,
  amount,
}: {
  rec: Recurrence;
  amount: number;
}) {
  const isIncome = rec.type === "INCOME";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = buildInstallments(rec.startDate, rec.endDate!, rec.frequency);
  const total = dates.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total de parcelas</span>
        <span className="font-semibold">{total}</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Parcela
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Vencimento
                </th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dates.map((date, i) => {
                const isPast = date < today;
                return (
                  <tr
                    key={i}
                    className="bg-background hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className={`px-3 py-2 font-medium ${isPast ? "text-muted-foreground" : ""}`}
                    >
                      {i + 1}/{total}
                    </td>
                    <td
                      className={`px-3 py-2 ${isPast ? "text-muted-foreground" : ""}`}
                    >
                      {fmtDate(date)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        isPast
                          ? "text-muted-foreground"
                          : isIncome
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      R$ {fmt(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Feature 1: Payment Calendar ─────────────────────────────────────────────

function PaymentCalendar({
  calMonth,
  setCalMonth,
  paymentDateSet,
  paidDates,
  isIncome,
  hasPendingInMonth,
}: {
  calMonth: Date;
  setCalMonth: (d: Date) => void;
  paymentDateSet: Set<string>;
  paidDates: Set<string>;
  isIncome: boolean;
  hasPendingInMonth: boolean;
}) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);

  const prevMonth = () => {
    const d = new Date(calMonth);
    d.setMonth(d.getMonth() - 1);
    setCalMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(calMonth);
    d.setMonth(d.getMonth() + 1);
    setCalMonth(d);
  };

  const monthLabel = calMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const slots: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return toLocalDateStr(d);
    }),
  ];

  return (
    <div className="space-y-3">
      {/* Aviso de pendência no mês */}
      {hasPendingInMonth && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          Este mês possui pagamento{paymentDateSet.size > 1 ? "s" : ""} pendente{paymentDateSet.size > 1 ? "s" : ""}
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="text-xs font-medium text-muted-foreground py-1">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {slots.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;
          const day = parseInt(dateStr.split("-")[2]);
          const isPayment = paymentDateSet.has(dateStr);
          const isPaid = paidDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isOverdue = isPayment && !isPaid && new Date(dateStr + "T12:00:00") < today;
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center justify-center rounded-lg py-1 text-xs transition-colors
                ${isToday ? "ring-1 ring-primary ring-offset-1" : ""}
                ${isOverdue ? "bg-red-100 ring-1 ring-red-300" : ""}
                ${isPayment && !isPaid && !isOverdue ? (isIncome ? "bg-emerald-500/10" : "bg-red-500/10") : ""}
                ${isPaid ? "bg-muted" : ""}
              `}
            >
              <span className={`font-medium ${isToday ? "text-primary" : isOverdue ? "text-red-600" : isPaid ? "text-muted-foreground line-through" : ""}`}>
                {day}
              </span>
              {isPayment && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isPaid ? "bg-muted-foreground" : isOverdue ? "bg-red-600" : isIncome ? "bg-emerald-500" : "bg-red-500"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`w-2 h-2 rounded-full ${isIncome ? "bg-emerald-500" : "bg-red-500"}`} />
          Pagamento
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          Pago
        </div>
      </div>
    </div>
  );
}

// ─── Feature 2: Payment List ──────────────────────────────────────────────────

function PaymentList({
  allDates,
  amount,
  isIncome,
  paidDates,
  isFinite,
}: {
  allDates: Date[];
  amount: number;
  isIncome: boolean;
  paidDates: Set<string>;
  isFinite: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const colorClass = isIncome ? "text-emerald-500" : "text-red-500";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm min-w-[360px]">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {isFinite ? "Parcela" : "Ocorrência"}
              </th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Vencimento</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Valor</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allDates.map((date, i) => {
              const dateStr = toLocalDateStr(date);
              const isPaid = paidDates.has(dateStr);
              const isPast = date < today && !isPaid;
              const total = allDates.length;
              return (
                <tr key={i} className={`bg-background hover:bg-muted/30 transition-colors ${isPaid ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2 font-medium text-xs">
                    {isFinite ? `${i + 1}${total > 1 ? `/${total}` : ""}` : i + 1}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(date)}</td>
                  <td className={`px-3 py-2 text-right font-semibold text-xs ${isPaid ? "text-muted-foreground line-through" : colorClass}`}>
                    R$ {fmt(amount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isPaid ? (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                        ✓ Pago
                      </Badge>
                    ) : isPast ? (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-500 border-red-200">
                        Vencido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Futuro
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const RecorrenciaDetalhePage = memo(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Feature state
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const { recurrences, isLoading: recLoading } = useActiveRecurrences();
  const { categories, isLoading: catLoading } = useCategories();

  const isLoading = recLoading || catLoading;
  const rec = recurrences.find((r) => r.id === id);

  const allDates = useMemo<Date[]>(() => {
    if (!rec) return [];
    const dates = rec.endDate
      ? buildInstallments(rec.startDate, rec.endDate, rec.frequency)
      : buildOccurrences(rec.startDate, rec.frequency, 24, undefined);
    return dates;
  }, [rec?.startDate, rec?.endDate, rec?.frequency, rec?.id]);

  const paymentDateSet = useMemo(
    () => new Set(allDates.map((d) => toLocalDateStr(d))),
    [allDates]
  );

  // Busca transações reais pra marcar parcelas como pagas. Parcelas de
  // "Compra parcelada" são lançadas como transações comuns (o backend não
  // preenche recurringId nesse fluxo), então além do vínculo por recurringId
  // também casamos por categoria + tipo + data prevista da parcela.
  const { data: allRealTransactions = [] } = useQuery({
    queryKey: ["transactions", "all-for-recurrence"],
    queryFn: async () => {
      try {
        const res = await api.get<{
          data: {
            id: string;
            categoryId: string;
            type: "INCOME" | "EXPENSE";
            occurredAt: string;
            amount: number;
            recurringId?: string | null;
          }[];
        }>(apiEndpoints.transactions.list);
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const realTransactions = useMemo(() => {
    if (!rec) return [];
    return allRealTransactions.filter((tx) => {
      if (tx.recurringId === id) return true;
      if (tx.categoryId !== rec.categoryId || tx.type !== rec.type) return false;
      return paymentDateSet.has(toLocalDateStr(new Date(tx.occurredAt)));
    });
  }, [allRealTransactions, rec, id, paymentDateSet]);

  const paidDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Set(
      realTransactions
        .filter((tx) => {
          const txDate = new Date(tx.occurredAt);
          return txDate <= today;
        })
        .map((tx) => toLocalDateStr(new Date(tx.occurredAt)))
    );
  }, [realTransactions]);

  const isIncome = rec?.type === "INCOME";
  const category = categories.find((c) => c?.id === rec?.categoryId);
  const colorClass = isIncome ? "text-emerald-500" : "text-red-500";
  const bgClass = isIncome ? "bg-emerald-500/10" : "bg-red-500/10";

  const startDisplay = rec
    ? new Date(rec.startDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const endDisplay = rec?.endDate
    ? new Date(rec.endDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const hasPendingInMonth = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(paymentDateSet).some((dateStr) => {
      const d = new Date(dateStr + "T12:00:00");
      return d.getFullYear() === year && d.getMonth() === month && d < today && !paidDates.has(dateStr);
    });
  }, [calMonth, paymentDateSet, paidDates]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!rec) {
    return <NotFound onBack={() => navigate("/dashboard/recorrencias")} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/dashboard/recorrencias")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b border-border/60">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ring-1 ${
            isIncome ? "ring-emerald-500/20" : "ring-red-500/20"
          } ${bgClass}`}
        >
          {isIncome ? (
            <TrendingUp className={`w-7 h-7 ${colorClass}`} strokeWidth={2.25} />
          ) : (
            <TrendingDown className={`w-7 h-7 ${colorClass}`} strokeWidth={2.25} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight truncate">
            {rec.description || category?.name || "Sem descrição"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${
                isIncome
                  ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                  : "text-red-600 border-red-300 bg-red-50"
              }`}
            >
              {isIncome ? "Receita" : "Despesa"}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <Repeat className="w-3 h-3" />
              {FREQUENCY_LABELS[rec.frequency]}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Seção 1: Informações (+ Calendário, só despesa) ── */}
      <div className={`grid gap-6 mb-6 ${isIncome ? "justify-items-center" : "lg:grid-cols-2"}`}>
        {/* Card Informações */}
        <Card className={`border-border shadow-sm w-full ${isIncome ? "max-w-2xl" : ""}`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Valor destacado */}
            <div
              className={`relative overflow-hidden flex items-center justify-between py-4 px-5 rounded-2xl border ${
                isIncome ? "border-emerald-200/60 bg-emerald-500/[0.06]" : "border-red-200/60 bg-red-500/[0.06]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
                  {isIncome ? (
                    <TrendingUp className={`w-5 h-5 ${colorClass}`} />
                  ) : (
                    <TrendingDown className={`w-5 h-5 ${colorClass}`} />
                  )}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {rec.endDate ? "Valor da parcela" : "Valor recorrente"}
                </span>
              </div>
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${colorClass}`}>
                {isIncome ? "+" : "-"}R$ {fmt(rec.amount)}
              </span>
            </div>

            {/* Detalhes */}
            <div className="divide-y divide-border/70">
              <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">
                    🏷️
                  </span>
                  Categoria
                </span>
                <span className="text-sm font-medium text-right">
                  {category?.name ?? (
                    <span className="text-muted-foreground italic">Sem categoria</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Repeat className="w-3.5 h-3.5" />
                  </span>
                  Frequência
                </span>
                <span className="text-sm font-medium">{FREQUENCY_LABELS[rec.frequency]}</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  Início
                </span>
                <span className="text-sm font-medium text-right">{startDisplay}</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <CalendarOff className="w-3.5 h-3.5" />
                  </span>
                  Término
                </span>
                <span className="text-sm font-medium text-right">
                  {endDisplay ?? (
                    <span className="text-muted-foreground italic">Sem data de término</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={
                    rec.active
                      ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                      : "text-gray-500 border-gray-300 bg-gray-50"
                  }
                >
                  {rec.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            {/* Elemento secundário — só receita, evita card vazio em telas largas */}
            {isIncome && (
              <div className="flex items-center gap-3 pt-1 px-4 py-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  {rec.endDate ? (
                    <CalendarOff className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <InfinityIcon className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {rec.endDate
                    ? `Receita programada até ${endDisplay}, gerada automaticamente a cada ciclo ${FREQUENCY_LABELS[rec.frequency].toLowerCase()}.`
                    : `Receita contínua, sem data de término — gerada automaticamente a cada ciclo ${FREQUENCY_LABELS[rec.frequency].toLowerCase()}.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Calendário de Pagamentos — só despesa */}
        {!isIncome && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold">Calendário de Pagamentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentCalendar
                calMonth={calMonth}
                setCalMonth={setCalMonth}
                paymentDateSet={paymentDateSet}
                paidDates={paidDates}
                isIncome={isIncome}
                hasPendingInMonth={hasPendingInMonth}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Seção 2: Listagem + Projeção — só despesa ── */}
      {!isIncome && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card Listagem de Pagamentos */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Listagem de Pagamentos
                  {paidDates.size > 0 && (
                    <span className="ml-2 text-xs font-normal text-emerald-600">
                      {paidDates.size} pago{paidDates.size > 1 ? "s" : ""}
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentList
                allDates={allDates}
                amount={rec.amount}
                isIncome={isIncome}
                paidDates={paidDates}
                isFinite={!!rec.endDate}
              />
            </CardContent>
          </Card>

          {/* Card Projeção */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <InfinityIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold">Projeção</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {rec.endDate ? (
                <ProjectionTable rec={rec} amount={rec.amount} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ${bgClass} ${isIncome ? "ring-emerald-500/20" : "ring-red-500/20"}`}>
                    <InfinityIcon className={`w-7 h-7 ${colorClass}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Recorrência contínua</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Esta recorrência não possui data de término definida e continuará sendo
                      gerada automaticamente.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

RecorrenciaDetalhePage.displayName = "RecorrenciaDetalhePage";

export default RecorrenciaDetalhePage;
