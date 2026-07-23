import { useQueries } from "@tanstack/react-query";
import { useCards } from "./use-cards";
import { fetchHistory } from "./use-card-history";

export interface CardExpenseEntry {
  id: string;
  cardId: string;
  cardName: string;
  amount: number;
  description: string;
  occurredAt: string;
}

// Cartão e transação são tabelas separadas no backend (confirmado por Jonatan
// em 22/07/2026): o histórico de uso de cada cartão vive só em
// /v1/cards/:id/history e nunca é escrito em /v1/transactions. Pra "Despesas"
// mostrar os dois juntos, buscamos o histórico de cada cartão e mesclamos na
// exibição em vez de duplicar dados entre as tabelas.
export function useCardExpenses() {
  const { cards, isLoading: isLoadingCards } = useCards();

  const results = useQueries({
    queries: cards.map((card) => {
      const cardId = String(card.id);
      return {
        queryKey: ["card-history", cardId],
        queryFn: () => fetchHistory(cardId),
        staleTime: 30 * 1000,
      };
    }),
  });

  const isLoading = isLoadingCards || results.some((r) => r.isLoading);

  const entries: CardExpenseEntry[] = cards.flatMap((card, i) => {
    const cardId = String(card.id);
    const history = results[i]?.data ?? [];
    return history
      .filter((h) => h.type === "expense")
      .map((h) => ({
        id: `card-history-${h.id}`,
        cardId,
        cardName: card.name,
        amount: h.amount,
        description: `${h.description} (${card.name})`,
        occurredAt: h.createdAt,
      }));
  });

  return { entries, isLoading };
}
