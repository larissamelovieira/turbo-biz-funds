import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, Repeat, TrendingUp, TrendingDown, Trash2, Loader2, CreditCard, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/user/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { logActivity } from "@/features/dashboard/hooks/use-user-notifications";
import {
  useActiveRecurrences,
  useCreateRecurrence,
  useUpdateRecurrence,
  useDeleteRecurrence,
} from "@/features/recurrences/hooks/use-recurrences";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";
import type { RecurrencePayload } from "@/shared/types";
import { fmtBRL, fmtNumber, parseBRNumber as parseBR } from "@/lib/format";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

const defaultForm = (): RecurrencePayload => ({
  categoryId: "",
  type: "EXPENSE",
  amount: 0,
  description: "",
  frequency: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
});

const RecorrenciasPage = memo(() => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { recurrences, isLoading } = useActiveRecurrences();
  const { categories } = useCategories();
  const createRecurrence = useCreateRecurrence();
  const updateRecurrence = useUpdateRecurrence();
  const deleteRecurrence = useDeleteRecurrence();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [acrescimo, setAcrescimo] = useState(0);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const createCategory = useMutation({
    mutationFn: (name: string) =>
      api.post<{ data: { id: string; name: string } }>(apiEndpoints.categories.create, { name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      const created = (res as { data: { id: string; name: string } }).data;
      setForm((f) => ({ ...f, categoryId: created.id }));
      setIsNewCategory(false);
      setNewCategoryName("");
      toast.success("Categoria criada!");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  // Estado do modal de edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    amount: string;
    description: string;
    categoryId: string;
    frequency: RecurrencePayload["frequency"];
    startDate: string;
    endDate: string;
  }>({ amount: "", description: "", categoryId: "", frequency: "monthly", startDate: "", endDate: "" });
  const calcEndDate = (startDate: string, numInstallments: number): string => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + numInstallments - 1);
    return d.toISOString().split("T")[0];
  };

  // parseBRNumber = parseBR (importado de @/lib/format)

  const [form, setForm] = useState<RecurrencePayload & { amount: string }>(
    { ...defaultForm(), amount: "" } as RecurrencePayload & { amount: string }
  );

  const monthlyEquivalent = (amount: number, frequency: string): number => {
    switch (frequency?.toLowerCase()) {
      case "daily":
        return amount * 30;
      case "weekly":
        return amount * (52 / 12);
      case "yearly":
        return amount / 12;
      default:
        return amount;
    }
  };

  const totalIncome = recurrences
    .filter((r) => r.type === "INCOME")
    .reduce((acc, r) => acc + monthlyEquivalent(r.amount, r.frequency), 0);

  const totalExpense = recurrences
    .filter((r) => r.type === "EXPENSE")
    .reduce((acc, r) => acc + monthlyEquivalent(r.amount, r.frequency), 0);

  const handleCreate = async () => {
    if (!form.categoryId || !form.amount || !form.startDate) {
      toast.error("Preencha categoria, valor e data de início");
      return;
    }
    const rawAmount = Number(form.amount);
    const parcelAmount = (rawAmount * (1 + acrescimo / 100)) / installments;
    const payload: RecurrencePayload = {
      categoryId: form.categoryId,
      type: form.type,
      amount: isInstallment ? parcelAmount : rawAmount,
      description: form.description?.trim() || undefined,
      frequency: isInstallment ? "monthly" : form.frequency,
      startDate: `${form.startDate}T00:00:00.000Z`,
      endDate: isInstallment
        ? `${calcEndDate(form.startDate, installments)}T00:00:00.000Z`
        : form.endDate
        ? `${form.endDate}T00:00:00.000Z`
        : undefined,
    };

    const finishUp = () => {
      toast.success("Recorrência criada!");
      logActivity({
        severity: "success",
        title: "Recorrência criada",
        body: `${payload.description ?? "Nova recorrência"} — ${fmtBRL(payload.amount)} (${FREQUENCY_LABELS[payload.frequency] ?? payload.frequency})`,
        action: { label: "Ver recorrências", href: "/dashboard/recorrencias" },
      });
      setIsDialogOpen(false);
      setIsInstallment(false);
      setInstallments(2);
      setAcrescimo(0);
      setForm({ ...defaultForm(), amount: "" } as RecurrencePayload & { amount: string });
    };

    if (isInstallment) {
      // Parcelado tem total e fim definidos — gera as transações reais das
      // parcelas aqui, já que recorrência sozinha não aparece no Relatório
      // (que só lê /v1/transactions).
      const roundingAdjustment = Math.round((rawAmount * (1 + acrescimo / 100) - parcelAmount * installments) * 100) / 100;
      try {
        for (let i = 0; i < installments; i++) {
          const occurredAt = new Date(form.startDate);
          occurredAt.setMonth(occurredAt.getMonth() + i);
          const amount = i === installments - 1 ? parcelAmount + roundingAdjustment : parcelAmount;
          await api.post(apiEndpoints.transactions.create, {
            categoryId: form.categoryId,
            type: form.type,
            amount,
            description: `${form.description?.trim() || "Compra parcelada"} (${i + 1}/${installments})`,
            occurredAt: occurredAt.toISOString(),
          });
        }
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch {
        toast.error("Erro ao criar parcelas — algumas podem ter sido salvas");
        return;
      }
    } else {
      // Mesma lógica do parcelado: recorrência sozinha não aparece no
      // Relatório/Dashboard (que só leem /v1/transactions), então também
      // lançamos a transação real referente à ocorrência atual.
      try {
        await api.post(apiEndpoints.transactions.create, {
          categoryId: form.categoryId,
          type: form.type,
          amount: rawAmount,
          description: form.description?.trim() || (form.type === "EXPENSE" ? "Despesa fixa" : "Receita fixa"),
          occurredAt: payload.startDate,
        });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch {
        toast.error("Erro ao lançar transação da recorrência");
        return;
      }
    }

    createRecurrence.mutate(payload, {
      onSuccess: finishUp,
      onError: (error: unknown) => {
        const msg = (error as { message?: string })?.message;
        toast.error(msg ? `Erro: ${msg}` : "Erro ao criar recorrência");
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteRecurrence.mutate(id, {
      onSuccess: () => toast.success("Recorrência excluída"),
      onError: () => toast.error("Erro ao excluir recorrência"),
    });
  };


  const openEdit = (rec: typeof recurrences[0]) => {
    setEditingId(rec.id);
    setEditForm({
      amount: String(rec.amount),
      description: rec.description ?? "",
      categoryId: rec.categoryId,
      frequency: rec.frequency,
      startDate: rec.startDate.split("T")[0],
      endDate: rec.endDate ? rec.endDate.split("T")[0] : "",
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const amt = parseBR(editForm.amount);
    if (!amt || !editForm.categoryId || !editForm.startDate) {
      toast.error("Preencha categoria, valor e data de início");
      return;
    }
    updateRecurrence.mutate(
      {
        id: editingId,
        amount: amt,
        description: editForm.description.trim() || undefined,
        categoryId: editForm.categoryId,
        frequency: editForm.frequency,
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Recorrência atualizada!");
          logActivity({
            severity: "info",
            title: "Recorrência editada",
            body: `${editForm.description.trim() || "Recorrência"} foi atualizada`,
            action: { label: "Ver recorrências", href: "/dashboard/recorrencias" },
          });
          setEditingId(null);
        },
        onError: () => toast.error("Erro ao atualizar recorrência"),
      }
    );
  };

  // Alias local para compatibilidade com usos existentes
  const fmt = fmtNumber;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Recorrências"
        subtitle="Gerencie receitas e despesas fixas"
        action={{
          label: "Nova Recorrência",
          onClick: () => setIsDialogOpen(true),
        }}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recorrências Ativas</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "—" : recurrences.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas Fixas (mensal)</p>
                <p className="text-2xl font-bold text-emerald-500">{fmtBRL(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas Fixas (mensal)</p>
                <p className="text-2xl font-bold text-red-500">R$ {fmt(totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : recurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma recorrência cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Cadastre contas fixas como aluguel, salário ou assinaturas
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Recorrência
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {recurrences.map((rec) => {
            const category = categories.find((c) => c.id === rec.categoryId);
            const isIncome = rec.type === "INCOME";
            return (
              <Card
                key={rec.id}
                className="border-border shadow-sm transition-all duration-200 hover:shadow-md group cursor-pointer"
                onClick={() => navigate(`/dashboard/recorrencias/${rec.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {rec.description || category?.name || "Sem descrição"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {FREQUENCY_LABELS[rec.frequency]}
                      </Badge>
                      {category && (
                        <span className="text-xs text-muted-foreground">{category.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        desde {new Date(rec.startDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-semibold text-base ${
                        isIncome ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isIncome ? "+" : "-"}R$ {fmt(rec.amount)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar recorrência"
                    className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                    onClick={(e) => { e.stopPropagation(); openEdit(rec); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir recorrência"
                    className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                    disabled={deleteRecurrence.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setIsInstallment(false);
            setInstallments(2);
            setIsNewCategory(false);
            setNewCategoryName("");
            setForm({ ...defaultForm(), amount: "" } as RecurrencePayload & { amount: string });
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nova Recorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 1. Tipo — botões visuais */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: t });
                      if (t === "INCOME") { setIsInstallment(false); setInstallments(2); }
                    }}
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

            {/* 2. Descrição */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</Label>
              <Input
                placeholder={form.type === "INCOME" ? "Ex: Salário, Freelance..." : "Ex: Aluguel, Netflix..."}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* 3. Categoria */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setIsNewCategory((v) => !v)}
                >
                  {isNewCategory ? "Selecionar existente" : "+ Nova categoria"}
                </button>
              </div>
              {isNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Assinaturas, Educação..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newCategoryName.trim() || createCategory.isPending}
                    onClick={() => createCategory.mutate(newCategoryName.trim())}
                  >
                    {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 4. Valor — destacado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor total (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  className="pl-9 text-lg font-semibold h-11"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value as unknown as number })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* 5. Parcelado (só EXPENSE) ou Frequência */}
            {form.type === "EXPENSE" ? (
              <div className="space-y-3">
                {/* Toggle parcelado */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">Parcelado</span>
                      <p className="text-xs text-muted-foreground">Divide em parcelas mensais</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isInstallment}
                    onClick={() => setIsInstallment((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isInstallment ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      isInstallment ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Se parcelado: select de parcelas + tabela */}
                {isInstallment ? (
                  <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                    {/* Nº parcelas + Acréscimo (11x+) */}
                    <div className={`grid gap-3 ${installments >= 11 ? "grid-cols-2" : "grid-cols-1"}`}>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nº de parcelas</Label>
                        <Select
                          value={String(installments)}
                          onValueChange={(v) => { setInstallments(Number(v)); if (Number(v) < 11) setAcrescimo(0); }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60].map((n) => {
                              const amt = Number(form.amount);
                              const total = amt * (1 + acrescimo / 100);
                              const parcel = amt > 0
                                ? `${fmtBRL(total / n)} - ${n}x`
                                : `${n}x`;
                              return <SelectItem key={n} value={String(n)}>{parcel}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {installments >= 11 && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Acréscimo (%)
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="0,00"
                              value={acrescimo === 0 ? "" : acrescimo}
                              onChange={(e) => setAcrescimo(Math.max(0, Number(e.target.value)))}
                              className="pr-7"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                          {acrescimo > 0 && Number(form.amount) > 0 && (
                            <p className="text-xs text-amber-600 font-medium">
                              +{fmtBRL(Number(form.amount) * acrescimo / 100)} de juros
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {Number(form.amount) > 0 && (() => {
                      const totalComAcrescimo = Number(form.amount) * (1 + acrescimo / 100);
                      const parcelAmt = totalComAcrescimo / installments;
                      return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {acrescimo > 0 ? `Total c/ ${acrescimo}% acréscimo` : "Resumo"}
                          </span>
                          <span className="font-bold text-red-500">
                            {fmtBRL(totalComAcrescimo)} total
                          </span>
                        </div>
                        <div className="rounded-lg border border-border overflow-hidden max-h-36 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 z-10 bg-muted">
                              <tr>
                                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Parcela</th>
                                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Vencimento</th>
                                {acrescimo > 0 && <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Base</th>}
                                {acrescimo > 0 && <th className="text-right px-3 py-1.5 font-medium text-amber-600">Juros</th>}
                                <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {Array.from({ length: installments }, (_, i) => {
                                const d = new Date(form.startDate || new Date());
                                d.setMonth(d.getMonth() + i);
                                const baseAmt = Number(form.amount) / installments;
                                const jurosAmt = baseAmt * (acrescimo / 100);
                                return (
                                  <tr key={i} className="bg-background hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-1.5 font-medium">{i + 1}/{installments}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">
                                      {d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                                    </td>
                                    {acrescimo > 0 && (
                                      <td className="px-3 py-1.5 text-right text-muted-foreground">
                                        {fmtBRL(baseAmt)}
                                      </td>
                                    )}
                                    {acrescimo > 0 && (
                                      <td className="px-3 py-1.5 text-right text-amber-600 font-medium">
                                        +{fmtBRL(jurosAmt)}
                                      </td>
                                    )}
                                    <td className="px-3 py-1.5 text-right font-semibold text-red-500">
                                      {fmtBRL(parcelAmt)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                    })()}
                  </div>
                ) : (
                  /* Sem parcelamento: frequência */
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frequência</Label>
                    <Select
                      value={form.frequency}
                      onValueChange={(v) => setForm({ ...form, frequency: v as RecurrencePayload["frequency"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              /* INCOME: frequência */
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frequência</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v as RecurrencePayload["frequency"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 6. Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isInstallment ? "Término (auto)" : "Término (opcional)"}
                </Label>
                <Input
                  type="date"
                  value={isInstallment ? calcEndDate(form.startDate, installments) : (form.endDate ?? "")}
                  readOnly={isInstallment}
                  className={isInstallment ? "bg-muted/50 cursor-default text-muted-foreground" : ""}
                  onChange={(e) => { if (!isInstallment) setForm({ ...form, endDate: e.target.value }); }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createRecurrence.isPending}>
              {createRecurrence.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Edição ── */}
      <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Recorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Valor */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição (opcional)</Label>
              <Input
                placeholder="Ex: Aluguel, Salário..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria</Label>
              <Select
                value={editForm.categoryId}
                onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequência */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frequência</Label>
              <Select
                value={editForm.frequency}
                onValueChange={(v) => setEditForm({ ...editForm, frequency: v as RecurrencePayload["frequency"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de início</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Término (opcional)</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateRecurrence.isPending}>
              {updateRecurrence.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

RecorrenciasPage.displayName = "RecorrenciasPage";

export default RecorrenciasPage;
