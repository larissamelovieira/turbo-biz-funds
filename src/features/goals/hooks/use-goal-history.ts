import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiEndpoints } from "@/lib/api/client";

export interface GoalHistoryEntry {
  id: string;
  goalId?: string;
  amount: number;
  description: string;
  currentBefore: number;
  currentAfter: number;
  createdAt: string;
}

export interface AddGoalHistoryPayload {
  amount: number;
  description: string;
  currentBefore: number;
  currentAfter: number;
}

// Mesmo padrão de src/features/cards/hooks/use-card-history.ts: tenta a API,
// se o endpoint ainda não existir no backend (404/501) cai pra localStorage.

const LS_KEY = (goalId: string) => `goal_history_${goalId}`;

function lsLoad(goalId: string): GoalHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY(goalId)) ?? "[]"); } catch { return []; }
}

function lsSave(goalId: string, entries: GoalHistoryEntry[]) {
  localStorage.setItem(LS_KEY(goalId), JSON.stringify(entries.slice(0, 100)));
}

function lsAdd(goalId: string, entry: GoalHistoryEntry) {
  lsSave(goalId, [entry, ...lsLoad(goalId)]);
}

export async function fetchGoalHistory(goalId: string): Promise<GoalHistoryEntry[]> {
  try {
    const res = await api.get<{ data: GoalHistoryEntry[] } | GoalHistoryEntry[]>(apiEndpoints.goals.history(goalId));
    const remote = Array.isArray(res) ? res : ((res as { data: GoalHistoryEntry[] }).data ?? []);
    if (Array.isArray(remote) && remote.length > 0) {
      lsSave(goalId, remote);
      return remote;
    }
    return lsLoad(goalId);
  } catch {
    // Endpoint ainda não existe no backend (ao contrário de /v1/cards/:id/history,
    // que já funciona) — o status de erro exato não está confirmado, então cai
    // pro localStorage em qualquer falha, não só 404/501.
    return lsLoad(goalId);
  }
}

async function postGoalHistory(goalId: string, payload: AddGoalHistoryPayload): Promise<GoalHistoryEntry> {
  try {
    const res = await api.post<{ data: GoalHistoryEntry } | GoalHistoryEntry>(
      apiEndpoints.goals.addHistory(goalId),
      payload,
    );
    return (res as { data: GoalHistoryEntry }).data ?? (res as GoalHistoryEntry);
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 404 || e?.status === 501) {
      const entry: GoalHistoryEntry = {
        id: crypto.randomUUID(),
        goalId,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      lsAdd(goalId, entry);
      return entry;
    }
    throw err;
  }
}

export function useGoalHistory(goalId: string | null) {
  return useQuery({
    queryKey: ["goal-history", goalId],
    queryFn: () => fetchGoalHistory(goalId!),
    enabled: !!goalId,
    staleTime: 30 * 1000,
  });
}

export function useAddGoalHistory(goalId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddGoalHistoryPayload) => postGoalHistory(goalId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-history", goalId] });
    },
  });
}
