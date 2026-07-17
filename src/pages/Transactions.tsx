import { memo, useState } from "react";
import { Receipt, Plus, Search, ArrowUpRight, ArrowDownRight, Loader2, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/user/PageHeader";
import { TransactionsListSkeleton, PageHeaderSkeleton } from "@/components/ui/page-skeletons";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fmtBRL } from "@/lib/format";
import { useActiveRecurrences } from "@/features/recurrences/hooks/use-recurrences";

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

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case "daily": return amount * 30;
    case "weekly": return amount * (52 / 12);
    case "yearly": return amount / 12;
    default: return amount;
  }
}

type Period = "weekly" | "15d" | "30d";
type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "weekly", label: "7 dias" },
  { value: "15d", label: "15 dias" },
  { value: "30d", label: "30 dias" },
];

const TransactionsPageSkeleton = () => (
  <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
    <PageHeaderSkeleton />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted" />)}
    </div>
    <div className="h-14 rounded-lg bg-muted" />
    <TransactionsListSkeleton />
  </div>
);

const TransactionsPage = memo(() => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("30d");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    description: "",
    occurredAt: new Date().toISOString().split("T")[0],
  });
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [isCreatingInstallments, setIsCreatingInstallments] = useState(false);

  const { data: transactionsRes, isLoading } = useQuery({
    queryKey: ["transactions", period],
    queryFn: () =>
      api.get<{ data: ApiTransaction[] }>(`${apiEndpoints.transactions.list}?period=${period}`),
    staleTime: 2 * 60 * 1000,
  });

  const { data: categoriesRes, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ data: ApiCategory[] }>(apiEndpoints.categories.list),
    staleTime: 5 * 60 * 1000,
  });

  const { recurrences } = useActiveRecurrences();

  const now = new Date();
  const transactions = (transactionsRes?.data ?? []).filter(
    (t) => new Date(t.occurredAt).getTime() <= now.getTime()
  );
  const categories = categoriesRes?.data ?? [];
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Recorrências ativas ainda sem transação real lançada nesse período —
  // viram entradas sintéticas pra que a lista e os cards batam (antes o
  // card somava esse valor mas a lista nunca mostrava a linha correspondente).
  const paidRecurrenceIds = new Set(
    transactions.filter((t) => t.recurringId).map((t) => t.recurringId)
  );
  const unpaidRecurrenceEntries: (ApiTransaction & { isRecurringProjection?: boolean })[] = recurrences
    .filter((r) => r.active !== false && !paidRecurrenceIds.has(r.id))
    .map((r) => ({
      id: `recurring-unpaid-${r.id}`,
      categoryId: r.categoryId,
      type: r.type,
      amount: monthlyEquivalent(r.amount, r.frequency),
      description: `${r.description || "Recorrência"} (recorrência)`,
      occurredAt: new Date().toISOString(),
      recurringId: r.id,
      isRecurringProjection: true,
    }));

  const transactionsWithRecurring = [...transactions, ...unpaidRecurrenceEntries];

  const filtered = transactionsWithRecurring.filter((t) => {
    if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
    if (!search) return true;
    const catName = catMap.get(t.categoryId) ?? "";
    const desc = t.description ?? "";
    return (
      desc.toLowerCase().includes(search.toLowerCase()) ||
      catName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalIncome = filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;


  const createMutation = useMutation({
    mutationFn: (data: {
      categoryId: string;
      type: "INCOME" | "EXPENSE";
      amount: number;
      description?: string;
      occurredAt: string;
    }) => api.post<{ data: ApiTransaction }>(apiEndpoints.transactions.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transação criada com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao criar transação"),
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setForm({
      categoryId: "",
      type: "EXPENSE",
      amount: "",
      description: "",
      occurredAt: new Date().toISOString().split("T")[0],
    });
    setIsInstallment(false);
    setInstallments("2");
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { removed: boolean } }>(apiEndpoints.transactions.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transação removida");
    },
    onError: () => toast.error("Erro ao remover transação"),
  });

  const handleCreate = async () => {
    if (!form.categoryId || !form.amount) {
      toast.error("Preencha categoria e valor");
      return;
    }

    const total = parseFloat(form.amount);

    if (isInstallment && form.type === "EXPENSE") {
      const count = parseInt(installments, 10);
      if (!count || count < 2) {
        toast.error("Informe um número de parcelas válido (mínimo 2)");
        return;
      }
      const installmentAmount = Math.round((total / count) * 100) / 100;
      const roundingAdjustment = Math.round((total - installmentAmount * count) * 100) / 100;
      const baseDate = new Date(form.occurredAt);

      setIsCreatingInstallments(true);
      try {
        for (let i = 0; i < count; i++) {
          const occurredAt = new Date(baseDate);
          occurredAt.setMonth(occurredAt.getMonth() + i);
          const amount = i === count - 1 ? installmentAmount + roundingAdjustment : installmentAmount;
          await api.post(apiEndpoints.transactions.create, {
            categoryId: form.categoryId,
            type: form.type,
            amount,
            description: `${form.description || "Compra parcelada"} (${i + 1}/${count})`,
            occurredAt: occurredAt.toISOString(),
          });
        }
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        toast.success(`${count} parcelas criadas com sucesso!`);
        resetForm();
      } catch {
        toast.error("Erro ao criar parcelas — algumas podem ter sido salvas");
      } finally {
        setIsCreatingInstallments(false);
      }
      return;
    }

    createMutation.mutate({
      categoryId: form.categoryId,
      type: form.type,
      amount: total,
      description: form.description || undefined,
      occurredAt: new Date(form.occurredAt).toISOString(),
    });
  };

  if (isLoading) return <TransactionsPageSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Transações"
        subtitle="Gerencie todas as suas movimentações"
        action={{
          label: "Nova Transação",
          onClick: () => setIsDialogOpen(true),
        }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Receitas</p>
              <p className="text-xl font-bold text-emerald-500">{fmtBRL(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Despesas</p>
              <p className="text-xl font-bold text-red-500">{fmtBRL(totalExpense)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${balance >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}>
              <Wallet className={`w-5 h-5 ${balance >= 0 ? "text-primary" : "text-red-500"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Saldo</p>
              <p className={`text-xl font-bold ${balance >= 0 ? "text-primary" : "text-red-500"}`}>
                {fmtBRL(Math.abs(balance))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou categoria..."
                className="pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Type filter */}
              {(["ALL", "INCOME", "EXPENSE"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
                    typeFilter === t
                      ? t === "INCOME"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : t === "EXPENSE"
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-muted/50 hover:border-primary/60 hover:bg-primary/5 text-muted-foreground"
                  }`}
                >
                  {t === "ALL" ? "Todos" : t === "INCOME" ? "Receitas" : "Despesas"}
                </button>
              ))}
              <div className="flex gap-1.5 bg-muted/50 rounded-lg p-1 border border-border">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors font-medium ${
                      period === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Histórico</h3>
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm mt-1 opacity-70">Tente ajustar os filtros ou adicione uma nova transação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                const catName = catMap.get(transaction.categoryId) ?? "Sem categoria";
                const date = new Date(transaction.occurredAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const parcelaMatch = transaction.description?.match(/\s\((\d+\/\d+)\)$/);
                const baseDescription = parcelaMatch
                  ? transaction.description!.slice(0, parcelaMatch.index)
                  : transaction.description;
                const parcelaLabel = parcelaMatch?.[1];
                const isRecurringProjection = transaction.id.startsWith("recurring-unpaid-");
                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}>
                        {isIncome
                          ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          : <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground leading-tight text-sm truncate">
                          {baseDescription ?? "Sem descrição"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-background font-normal shrink-0">
                            {catName}
                          </Badge>
                          {parcelaLabel && (
                            <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-background font-normal shrink-0">
                              Parcela {parcelaLabel}
                            </Badge>
                          )}
                          {isRecurringProjection && (
                            <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-background font-normal shrink-0">
                              Ainda não lançada
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-border/60 sm:border-t-0">
                      <div className="text-left sm:text-right">
                        <span className={`font-bold text-sm sm:text-base whitespace-nowrap ${isIncome ? "text-emerald-500" : "text-foreground"}`}>
                          {isIncome ? "+" : "−"}{fmtBRL(transaction.amount)}
                        </span>
                        <p className="text-xs text-muted-foreground capitalize hidden sm:block">{isIncome ? "receita" : "despesa"}</p>
                      </div>
                      {!isRecurringProjection && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover transação"
                          className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => deleteMutation.mutate(transaction.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Type toggle */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.type === t
                        ? t === "INCOME"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-red-500 text-white border-red-500 shadow-sm"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t === "INCOME"
                      ? <><TrendingUp className="w-4 h-4" /> Receita</>
                      : <><TrendingDown className="w-4 h-4" /> Despesa</>
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              {isCategoriesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Carregando categorias...
                </div>
              ) : categories.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Nenhuma categoria disponível. Aguarde o administrador cadastrar.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, categoryId: c.id })}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        form.categoryId === c.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/50 hover:border-primary/60 hover:bg-primary/5"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  className="pl-9"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {form.type === "EXPENSE" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="rounded border-input"
                  />
                  Compra parcelada
                </label>
                {isInstallment && (
                  <div className="space-y-2 pl-6">
                    <Label>Número de parcelas</Label>
                    <Input
                      type="number"
                      min="2"
                      max="48"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                    />
                    {form.amount && parseInt(installments, 10) >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        {installments}x de {fmtBRL(parseFloat(form.amount) / parseInt(installments, 10))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                placeholder="Ex: Supermercado"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || isCreatingInstallments} className="flex-1 sm:flex-none">
              {createMutation.isPending || isCreatingInstallments ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Criar transação</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

TransactionsPage.displayName = "TransactionsPage";

export default TransactionsPage;
