import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";

export interface CardHistoryEntry {
  id: string;
  cardId?: string;
  type: "expense" | "payment";
  amount: number;
  description: string;
  usedBefore: number;
  usedAfter: number;
  createdAt: string;
  // Compra parcelada debita o limite todo de uma vez aqui, mas o gasto de
  // caixa real fica coberto pela recorrência (recurringId aponta pra ela).
  // Sem isso não dava pra saber, na exibição de Despesas, que esse valor já
  // está contado na parcela mensal — contava os dois juntos.
  isInstallment?: boolean;
  recurringId?: string | null;
}

export interface AddHistoryPayload {
  type: "expense" | "payment";
  amount: number;
  description: string;
  usedBefore: number;
  usedAfter: number;
}

// ---------- localStorage fallback ----------

const LS_KEY = (cardId: string) => `card_history_${cardId}`;

function lsLoad(cardId: string): CardHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY(cardId)) ?? "[]"); } catch { return []; }
}

function lsSave(cardId: string, entries: CardHistoryEntry[]) {
  localStorage.setItem(LS_KEY(cardId), JSON.stringify(entries.slice(0, 100)));
}

function lsAdd(cardId: string, entry: CardHistoryEntry) {
  lsSave(cardId, [entry, ...lsLoad(cardId)]);
}

// ---------- fetch with API-first, localStorage fallback ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEntry(raw: any): CardHistoryEntry {
  return {
    ...raw,
    isInstallment: raw.isInstallment ?? raw.is_installment ?? false,
    recurringId: raw.recurringId ?? raw.recurring_id ?? null,
  };
}

export async function fetchHistory(cardId: string): Promise<CardHistoryEntry[]> {
  try {
    const res = await api.get<{ data: CardHistoryEntry[] } | CardHistoryEntry[]>(apiEndpoints.cards.history(cardId));
    const raw = Array.isArray(res) ? res : ((res as { data: CardHistoryEntry[] }).data ?? []);
    const remote = raw.map(normalizeEntry);
    if (remote.length > 0) {
      lsSave(cardId, remote);
      return remote;
    }
    return lsLoad(cardId);
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 404 || e?.status === 501) {
      return lsLoad(cardId);
    }
    throw err;
  }
}

async function postHistory(cardId: string, payload: AddHistoryPayload): Promise<CardHistoryEntry> {
  try {
    const res = await api.post<{ data: CardHistoryEntry } | CardHistoryEntry>(
      apiEndpoints.cards.addHistory(cardId),
      payload,
    );
    return (res as { data: CardHistoryEntry }).data ?? (res as CardHistoryEntry);
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 404 || e?.status === 501) {
      const entry: CardHistoryEntry = {
        id: crypto.randomUUID(),
        cardId,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      lsAdd(cardId, entry);
      return entry;
    }
    throw err;
  }
}

// ---------- hooks ----------

export function useCardHistory(cardId: string | null) {
  return useQuery({
    queryKey: ["card-history", cardId],
    queryFn: () => fetchHistory(cardId!),
    enabled: !!cardId,
    staleTime: 30 * 1000,
  });
}

export function useAddCardHistory(cardId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddHistoryPayload) => postHistory(cardId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-history", cardId] });
    },
  });
}
