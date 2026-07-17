import { memo, useState, useCallback } from "react";
import { CreditCard, Plus, Loader2, Trash2, Pencil, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from "@/features/cards/hooks/use-cards";
import type { CreditCard as CreditCardType } from "@/features/cards/hooks/use-cards";
import { useCardHistory, useAddCardHistory } from "@/features/cards/hooks/use-card-history";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { api, apiEndpoints } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { fmtBRL } from "@/lib/format";

const CARD_COLORS = [
  "from-blue-500 to-blue-700",
  "from-slate-700 to-slate-900",
  "from-emerald-500 to-emerald-700",
  "from-purple-500 to-purple-700",
  "from-rose-500 to-rose-700",
];

const EMPTY_FORM = { name: "", number: "", limit: "", dueDate: "", flag: "Visa", color: CARD_COLORS[0] };

// Cartões criados pela IA (WhatsApp) vêm sem cor — atribui uma cor
// determinística por id, pra não ficar trocando a cada re-render.
function colorForCard(card: CreditCardType): string {
  if (card.color) return card.color;
  let hash = 0;
  for (const ch of String(card.id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CARD_COLORS[hash % CARD_COLORS.length];
}

const CardFormFields = ({
  values,
  onChange,
  hideNumber,
}: {
  values: typeof EMPTY_FORM;
  onChange: (v: typeof EMPTY_FORM) => void;
  hideNumber?: boolean;
}) => (
  <div className="space-y-4 py-2">
    <div className="space-y-2">
      <Label>Nome do cartão</Label>
      <Input
        placeholder="Ex: Nubank Platinum"
        value={values.name}
        onChange={(e) => onChange({ ...values, name: e.target.value })}
      />
    </div>
    {!hideNumber && (
      <div className="space-y-2">
        <Label>Número do cartão</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          value={values.number.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim()}
          onChange={(e) => onChange({ ...values, number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
        />
      </div>
    )}
    {hideNumber && (
      <div className="space-y-2">
        <Label>Novo número (opcional)</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Deixe vazio para manter o atual"
          maxLength={19}
          value={values.number.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim()}
          onChange={(e) => onChange({ ...values, number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
        />
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Limite (R$)</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={values.limit}
          onChange={(e) => onChange({ ...values, limit: e.target.value })}
          min="0"
          step="0.01"
        />
      </div>
      <div className="space-y-2">
        <Label>Vencimento</Label>
        <Input
          type="date"
          value={values.dueDate}
          onChange={(e) => onChange({ ...values, dueDate: e.target.value })}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Bandeira</Label>
      <div className="flex flex-wrap gap-2">
        {["Visa", "Mastercard", "Elo", "Amex"].map((flag) => (
          <button
            key={flag}
            type="button"
            onClick={() => onChange({ ...values, flag })}
            className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
              values.flag === flag
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {flag}
          </button>
        ))}
      </div>
    </div>
    <div className="space-y-2">
      <Label>Cor</Label>
      <div className="flex gap-2">
        {CARD_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ ...values, color })}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} border-2 transition-all ${
              values.color === color ? "border-foreground scale-110" : "border-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);

const CardsPage = memo(() => {
  const { cards, isLoading, isError } = useCards();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { categories } = useCategories();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [usageCard, setUsageCard] = useState<CreditCardType | null>(null);
  const [historyCard, setHistoryCard] = useState<CreditCardType | null>(null);
  const [usageAmount, setUsageAmount] = useState("");
  const [usageDescription, setUsageDescription] = useState("");
  const [usageType, setUsageType] = useState<"gasto" | "pagamento">("gasto");
  const [usageCategoryId, setUsageCategoryId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const historyCardId = historyCard ? String(historyCard.id) : null;
  const { data: historyEntries = [], isLoading: isHistoryLoading } = useCardHistory(historyCardId);
  const addHistory = useAddCardHistory(usageCard ? String(usageCard.id) : null);

  const handleCreate = () => {
    if (!form.name.trim() || !form.number || !form.limit || !form.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createCard.mutate(
      {
        name: form.name.trim(),
        number: form.number.replace(/\s/g, ""),
        limit: parseFloat(form.limit),
        dueDate: form.dueDate,
        flag: form.flag,
        color: form.color,
      },
      {
        onSuccess: () => {
          toast.success("Cartão adicionado!");
          setIsCreateOpen(false);
          setForm(EMPTY_FORM);
        },
        onError: () => toast.error("Erro ao adicionar cartão"),
      }
    );
  };

  const openUsage = (card: CreditCardType) => {
    setUsageCard(card);
    setUsageAmount("");
    setUsageDescription("");
    setUsageType("gasto");
    setUsageCategoryId("");
  };

  const handleUsage = () => {
    if (!usageCard) return;
    const amount = parseFloat(usageAmount);
    if (!amount || amount <= 0) { toast.error("Informe um valor válido"); return; }
    if (usageType === "gasto" && !usageCategoryId) { toast.error("Selecione uma categoria"); return; }
    const usedBefore = usageCard.used;
    const newUsed = usageType === "gasto"
      ? Math.min(usedBefore + amount, usageCard.limit)
      : Math.max(0, usedBefore - amount);
    updateCard.mutate(
      { id: String(usageCard.id), used: newUsed },
      {
        onSuccess: () => {
          addHistory.mutate({
            type: usageType === "gasto" ? "expense" : "payment",
            amount,
            description: usageDescription.trim() || (usageType === "gasto" ? "Gasto" : "Pagamento"),
            usedBefore,
            usedAfter: newUsed,
          });
          if (usageType === "gasto") {
            api.post(apiEndpoints.transactions.create, {
              categoryId: usageCategoryId,
              type: "EXPENSE",
              amount,
              description: `${usageDescription.trim() || "Gasto"} (${usageCard.name})`,
              occurredAt: new Date().toISOString(),
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["transactions"] });
            }).catch(() => toast.error("Gasto no cartão salvo, mas falhou ao somar nas despesas"));
          }
          toast.success(usageType === "gasto" ? "Gasto registrado!" : "Pagamento registrado!");
          setUsageCard(null);
        },
        onError: () => toast.error("Erro ao atualizar limite"),
      }
    );
  };

  const openHistory = useCallback((card: CreditCardType) => {
    setHistoryCard(card);
  }, []);

  const openEdit = (card: CreditCardType) => {
    setEditingCard(card);
    setEditForm({
      name: card.name,
      number: "",
      limit: String(card.limit),
      dueDate: card.dueDate,
      flag: card.flag,
      color: colorForCard(card),
    });
  };

  const handleUpdate = () => {
    if (!editingCard) return;
    if (!editForm.name.trim() || !editForm.limit || !editForm.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const payload: Record<string, unknown> = {
      name: editForm.name.trim(),
      limit: parseFloat(editForm.limit),
      dueDate: editForm.dueDate,
      flag: editForm.flag,
      color: editForm.color,
    };
    if (editForm.number) payload.number = editForm.number.replace(/\s/g, "");

    updateCard.mutate(
      { id: String(editingCard.id), ...payload },
      {
        onSuccess: () => {
          toast.success("Cartão atualizado!");
          setEditingCard(null);
        },
        onError: () => toast.error("Erro ao atualizar cartão"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando cartões...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    // Endpoint ainda não implementado no backend — exibe tela funcional com lista vazia
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Cartões de Crédito"
        subtitle="Gerencie seus cartões e limites"
        action={{
          label: "Adicionar Cartão",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground mb-4">Adicione seu primeiro cartão de crédito</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cartão
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.id} className="border-border shadow-sm overflow-hidden group">
              <div className={`h-36 bg-gradient-to-br ${colorForCard(card)} p-6 flex flex-col justify-between relative`}>
                <div className="flex justify-between items-start">
                  <span className="text-white font-semibold">{card.name || "Cartão sem nome"}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white/80 text-sm mr-1">{card.flag}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar cartão ${card.name}`}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/20"
                      onClick={() => openEdit(card)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover cartão ${card.name}`}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/20"
                      onClick={() => {
                        deleteCard.mutate(String(card.id), {
                          onSuccess: () => toast.success("Cartão removido"),
                          onError: () => toast.error("Erro ao remover cartão"),
                        });
                      }}
                      disabled={deleteCard.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-white text-base sm:text-xl tracking-widest font-mono truncate">{card.number}</p>
              </div>

              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Limite Utilizado</p>
                    <p className="text-lg font-semibold text-red-500">{fmtBRL(card.used)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Limite Disponível</p>
                    <p className="text-lg font-semibold text-green-600">{fmtBRL(Math.max(0, card.limit - card.used))}</p>
                  </div>
                </div>
                <div className="flex justify-end mb-1">
                  <p className="text-xs text-muted-foreground">Total: {fmtBRL(card.limit)}</p>
                </div>

                <div className="mb-4">
                  <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (card.used / card.limit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.min(100, Math.round((card.used / card.limit) * 100))}% utilizado
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border">
                  <Badge variant="outline" className="shrink-0">Vencimento: {card.dueDate ? card.dueDate.split("-").reverse().join("/") : "—"}</Badge>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => openHistory(card)}>
                      <History className="w-4 h-4 mr-1" />
                      Histórico
                    </Button>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => openUsage(card)}>
                      <ArrowUpCircle className="w-4 h-4 mr-1" />
                      Atualizar uso
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog — Adicionar */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Cartão</DialogTitle>
          </DialogHeader>
          <CardFormFields values={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createCard.isPending}>
              {createCard.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Adicionar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet — Histórico */}
      <Sheet open={!!historyCard} onOpenChange={(open) => { if (!open) setHistoryCard(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico — {historyCard?.name}
            </SheetTitle>
          </SheetHeader>

          {historyCard && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Utilizado</p>
                <p className="text-sm font-semibold text-red-500">{fmtBRL(historyCard.used)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Disponível</p>
                <p className="text-sm font-semibold text-green-600">{fmtBRL(Math.max(0, historyCard.limit - historyCard.used))}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-semibold">{fmtBRL(historyCard.limit)}</p>
              </div>
            </div>
          )}

          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando histórico...</span>
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <History className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum lançamento registrado ainda.</p>
              <p className="text-xs text-muted-foreground/60">Use "Atualizar uso" para registrar gastos e pagamentos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyEntries.map((entry) => {
                const isExpense = entry.type === "expense";
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <div className={`mt-0.5 shrink-0 ${isExpense ? "text-red-500" : "text-green-600"}`}>
                      {isExpense ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                        <p className={`text-sm font-semibold shrink-0 ${isExpense ? "text-red-500" : "text-green-600"}`}>
                          {isExpense ? "+" : "-"}{fmtBRL(entry.amount)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtBRL(entry.usedBefore)} → {fmtBRL(entry.usedAfter)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog — Atualizar uso */}
      <Dialog open={!!usageCard} onOpenChange={(open) => { if (!open) setUsageCard(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atualizar limite utilizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {usageCard && (
              <div className="flex justify-between text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
                <span>Atual: <strong>{fmtBRL(usageCard.used)}</strong></span>
                <span>Limite: <strong>{fmtBRL(usageCard.limit)}</strong></span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUsageType("gasto")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                  usageType === "gasto" ? "border-red-500 bg-red-500/10 text-red-500" : "border-border text-muted-foreground hover:border-red-400/40"
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Gasto
              </button>
              <button
                type="button"
                onClick={() => setUsageType("pagamento")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                  usageType === "pagamento" ? "border-green-500 bg-green-500/10 text-green-500" : "border-border text-muted-foreground hover:border-green-400/40"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Pagamento
              </button>
            </div>
            {usageType === "gasto" && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={usageCategoryId}
                  onChange={(e) => setUsageCategoryId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder={usageType === "gasto" ? "Ex: Supermercado, Restaurante..." : "Ex: Pagamento fatura..."}
                value={usageDescription}
                onChange={(e) => setUsageDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={usageAmount}
                onChange={(e) => setUsageAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            {usageCard && usageAmount && parseFloat(usageAmount) > 0 && (
              <p className="text-xs text-muted-foreground">
                Novo limite utilizado:{" "}
                <strong>
                  {fmtBRL(
                    usageType === "gasto"
                      ? Math.min(usageCard.used + parseFloat(usageAmount), usageCard.limit)
                      : Math.max(0, usageCard.used - parseFloat(usageAmount))
                  )}
                </strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageCard(null)}>Cancelar</Button>
            <Button
              onClick={handleUsage}
              disabled={updateCard.isPending}
              className={usageType === "gasto" ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}
            >
              {updateCard.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : usageType === "gasto" ? "Registrar gasto" : "Registrar pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Editar */}
      <Dialog open={!!editingCard} onOpenChange={(open) => { if (!open) setEditingCard(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cartão</DialogTitle>
          </DialogHeader>
          <CardFormFields values={editForm} onChange={setEditForm} hideNumber />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateCard.isPending}>
              {updateCard.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

CardsPage.displayName = "CardsPage";

export default CardsPage;
