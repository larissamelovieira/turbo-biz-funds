import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiEndpoints } from "@/lib/api/client";
import type { Recurrence } from "@/shared/types";
import { fmtBRL } from "@/lib/format";

const READ_STORAGE_KEY = "user:notifications:read";
const ACTIVITY_STORAGE_KEY = "user:notifications:activity";

export type NotificationSeverity = "info" | "warning" | "error" | "success";

export interface UserNotification {
  id: string;
  type?: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  action?: { label: string; href: string };
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: UserNotification[];
  unreadCount: number;
}

// ─── Activity log (localStorage — used in client-side fallback) ───────────────

export interface ActivityEntry {
  id: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  action?: { label: string; href: string };
  createdAt: string;
}

function getActivityLog(): ActivityEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function logActivity(entry: Omit<ActivityEntry, "id" | "createdAt">) {
  const log = getActivityLog();
  const newEntry: ActivityEntry = {
    ...entry,
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify([newEntry, ...log].slice(0, 20)));
}

// ─── localStorage read state (client-side fallback) ──────────────────────────

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveReadIds(ids: string[]) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
}

// ─── Subscription notifications (client-side fallback) ───────────────────────

interface SubscriptionResponse {
  status?: string;
  plan?: string;
  nextBilling?: string;
  next_billing?: string;
  trialEnd?: string;
  trial_end?: string;
  amount?: number;
}

async function fetchSubscription(): Promise<SubscriptionResponse | null> {
  try {
    const res = await api.get<SubscriptionResponse>("/v1/subscriptions/me");
    return res as unknown as SubscriptionResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.status === 404 || error?.status === 500) return null;
    throw error;
  }
}

function buildSubscriptionNotifications(
  plan: string,
  subscription: SubscriptionResponse | null
): UserNotification[] {
  const notifications: UserNotification[] = [];
  const now = new Date().toISOString();
  const status = subscription?.status?.toLowerCase();
  const nextBillingRaw = subscription?.nextBilling ?? subscription?.next_billing ?? null;

  if (status && ["atrasada", "overdue", "past_due", "defaulting"].includes(status)) {
    notifications.push({
      id: "payment_overdue", severity: "error",
      title: "Mensalidade em atraso",
      body: "Regularize seu pagamento para continuar com acesso total ao DoutorCash.",
      action: { label: "Regularizar agora", href: "/pagamento" },
      createdAt: now,
    });
  }

  if (status && ["pending", "pendente", "inactive", "inativo"].includes(status)) {
    notifications.push({
      id: "payment_pending", severity: "warning",
      title: "Pagamento pendente de mensalidade",
      body: "Seu pagamento está aguardando confirmação.",
      action: { label: "Verificar pagamento", href: "/pagamento" },
      createdAt: now,
    });
  }

  if (status === "trial" || status === "trial_period") {
    const trialEndRaw = subscription?.trialEnd ?? subscription?.trial_end;
    const daysLeft = trialEndRaw
      ? Math.ceil((new Date(trialEndRaw).getTime() - Date.now()) / 86_400_000)
      : null;
    if (daysLeft !== null && daysLeft <= 7 && daysLeft >= 0) {
      notifications.push({
        id: "trial_ending", severity: "warning",
        title: `Trial termina em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`,
        body: "Faça upgrade agora para não perder acesso ao DoutorCash.",
        action: { label: "Fazer upgrade", href: "/pagamento" },
        createdAt: now,
      });
    } else {
      notifications.push({
        id: "trial_active", severity: "info",
        title: "Você está no período de avaliação",
        body: "Aproveite todos os recursos Premium gratuitamente. Assine para continuar.",
        action: { label: "Ver planos", href: "/pagamento" },
        createdAt: now,
      });
    }
  }

  if (nextBillingRaw && !["atrasada", "overdue", "past_due", "pending", "pendente"].includes(status ?? "")) {
    const daysUntilBilling = Math.ceil((new Date(nextBillingRaw).getTime() - Date.now()) / 86_400_000);
    if (daysUntilBilling >= 0 && daysUntilBilling <= 3) {
      notifications.push({
        id: "billing_soon", severity: "info",
        title: `Cobrança em ${daysUntilBilling} dia${daysUntilBilling !== 1 ? "s" : ""}`,
        body: `Sua mensalidade será cobrada ${daysUntilBilling === 0 ? "hoje" : `em ${daysUntilBilling} dia(s)`}.`,
        createdAt: now,
      });
    }
  }

  const hasUrgent = notifications.some((n) => n.severity === "error" || n.severity === "warning");
  if (plan === "free" && !hasUrgent && subscription === null) {
    notifications.push({
      id: "free_plan_upgrade", severity: "info",
      title: "Você está no plano Gratuito",
      body: "Faça upgrade para Pro e desbloqueie transações ilimitadas, metas avançadas e muito mais.",
      action: { label: "Ver planos", href: "/pagamento" },
      createdAt: now,
    });
  }

  return notifications;
}

// ─── Recurrence notifications (client-side fallback) ─────────────────────────

function computeNextDue(rec: Recurrence): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = rec.startDate.split("T")[0].split("-").map(Number);
  let cursor = new Date(y, m - 1, d);

  const endDate = rec.endDate
    ? (() => {
        const [ey, em, ed] = rec.endDate.split("T")[0].split("-").map(Number);
        return new Date(ey, em - 1, ed);
      })()
    : null;

  if (cursor >= today) {
    if (endDate && cursor > endDate) return null;
    return cursor;
  }

  let iters = 0;
  while (cursor < today && iters < 2000) {
    switch (rec.frequency?.toLowerCase()) {
      case "daily":   cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1); break;
      case "weekly":  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7); break;
      case "monthly": cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()); break;
      case "yearly":  cursor = new Date(cursor.getFullYear() + 1, cursor.getMonth(), cursor.getDate()); break;
    }
    iters++;
  }

  if (endDate && cursor > endDate) return null;
  return cursor;
}

function buildRecurrenceNotifications(recurrences: Recurrence[]): UserNotification[] {
  const notifications: UserNotification[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date().toISOString();

  recurrences
    .filter((r) => r.active && r.type === "EXPENSE")
    .forEach((rec) => {
      const nextDue = computeNextDue(rec);
      if (!nextDue) return;

      const daysUntil = Math.round((nextDue.getTime() - today.getTime()) / 86_400_000);
      const name = rec.description?.trim() || "Recorrência";
      const dateStr = nextDue.toLocaleDateString("pt-BR");
      const valor = fmtBRL(rec.amount);
      const href = `/dashboard/recorrencias/${rec.id}`;

      if (daysUntil < 0) {
        const daysLate = -daysUntil;
        notifications.push({
          id: `rec-overdue-${rec.id}`, severity: "error",
          title: `Pagamento atrasado: ${name}`,
          body: `Venceu há ${daysLate} dia${daysLate !== 1 ? "s" : ""} (${dateStr}). Valor: ${valor}`,
          action: { label: "Ver recorrência", href },
          createdAt: now,
        });
      } else if (daysUntil === 0) {
        notifications.push({
          id: `rec-today-${rec.id}`, severity: "warning",
          title: `Último dia para pagar: ${name}`,
          body: `${name} vence hoje (${dateStr}). Valor: ${valor}`,
          action: { label: "Ver recorrência", href },
          createdAt: now,
        });
      } else if (daysUntil <= 3) {
        notifications.push({
          id: `rec-soon-${rec.id}-${daysUntil}`, severity: "info",
          title: `Vence em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""}: ${name}`,
          body: `${name} vence em ${dateStr}. Valor: ${valor}`,
          action: { label: "Ver recorrência", href },
          createdAt: now,
        });
      }
    });

  return notifications;
}

// ─── Goal notifications ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGoalsRaw(): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await api.get<any>(apiEndpoints.goals.list);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.goals)) return res.goals;
    return [];
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGoalNotifications(goals: any[]): UserNotification[] {
  const notifications: UserNotification[] = [];
  const now = new Date().toISOString();

  goals.forEach((g) => {
    const current = g.current ?? g.current_value ?? 0;
    const target = g.target ?? g.target_value ?? 0;
    const name = g.name ?? g.title ?? "Meta";
    if (target <= 0) return;
    const pct = current / target;

    if (pct >= 1) {
      notifications.push({
        id: `goal-done-${g.id}`, severity: "success",
        title: `🎉 Meta concluída: ${name}`,
        body: `Você atingiu ${fmtBRL(current)} de ${fmtBRL(target)}. Parabéns!`,
        action: { label: "Ver metas", href: "/dashboard/metas" },
        createdAt: now,
      });
    } else if (pct >= 0.8) {
      notifications.push({
        id: `goal-near-${g.id}`, severity: "info",
        title: `Quase lá: ${name}`,
        body: `${Math.round(pct * 100)}% concluída — faltam ${fmtBRL(target - current)}.`,
        action: { label: "Ver metas", href: "/dashboard/metas" },
        createdAt: now,
      });
    } else if (pct >= 0.5) {
      notifications.push({
        id: `goal-half-${g.id}`, severity: "info",
        title: `Metade do caminho: ${name}`,
        body: `${Math.round(pct * 100)}% concluída — faltam ${fmtBRL(target - current)}.`,
        action: { label: "Ver metas", href: "/dashboard/metas" },
        createdAt: now,
      });
    } else if (current > 0) {
      notifications.push({
        id: `goal-progress-${g.id}`, severity: "info",
        title: `Em andamento: ${name}`,
        body: `${fmtBRL(current)} de ${fmtBRL(target)} (${Math.round(pct * 100)}%)`,
        action: { label: "Ver metas", href: "/dashboard/metas" },
        createdAt: now,
      });
    }
  });

  return notifications;
}

// ─── Card limit notifications ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCardsRaw(): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await api.get<any>(apiEndpoints.cards.list);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.cards)) return res.cards;
    return [];
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCardNotifications(cards: any[]): UserNotification[] {
  const notifications: UserNotification[] = [];
  const now = new Date().toISOString();

  cards.forEach((c) => {
    const limit = c.limit ?? 0;
    const used = c.used ?? 0;
    const name = c.name ?? "Cartão";
    if (limit <= 0) return;
    const pct = used / limit;

    if (pct >= 1) {
      notifications.push({
        id: `card-over-${c.id}`, severity: "error",
        title: `Limite esgotado: ${name}`,
        body: `Usado ${fmtBRL(used)} de ${fmtBRL(limit)} (${Math.round(pct * 100)}%).`,
        action: { label: "Ver cartões", href: "/dashboard/cartoes" },
        createdAt: now,
      });
    } else if (pct >= 0.8) {
      notifications.push({
        id: `card-warn-${c.id}`, severity: "warning",
        title: `Limite alto: ${name}`,
        body: `${Math.round(pct * 100)}% do limite usado — disponível ${fmtBRL(limit - used)}.`,
        action: { label: "Ver cartões", href: "/dashboard/cartoes" },
        createdAt: now,
      });
    }
  });

  return notifications;
}

// ─── Client-side fallback fetch ───────────────────────────────────────────────

async function fetchClientSideNotifications(plan: string): Promise<UserNotification[]> {
  const [sub, recRes, goals, cards] = await Promise.all([
    fetchSubscription(),
    api
      .get<{ data: Recurrence[] }>(apiEndpoints.recurrences.active)
      .catch(() => ({ data: [] as Recurrence[] })),
    fetchGoalsRaw(),
    fetchCardsRaw(),
  ]);

  const recurrences: Recurrence[] = Array.isArray(recRes)
    ? (recRes as unknown as Recurrence[])
    : Array.isArray(recRes?.data)
      ? recRes.data
      : [];

  const subNotifs = buildSubscriptionNotifications(plan, sub);
  const recNotifs = buildRecurrenceNotifications(recurrences);
  const goalNotifs = buildGoalNotifications(goals);
  const cardNotifs = buildCardNotifications(cards);
  const activityNotifs: UserNotification[] = getActivityLog().map((a) => ({ ...a }));

  return [
    ...cardNotifs.filter((n) => n.severity === "error"),
    ...recNotifs.filter((n) => n.severity === "error"),
    ...subNotifs.filter((n) => n.severity === "error"),
    ...cardNotifs.filter((n) => n.severity === "warning"),
    ...recNotifs.filter((n) => n.severity === "warning"),
    ...subNotifs.filter((n) => n.severity === "warning"),
    ...goalNotifs.filter((n) => n.severity === "success"),
    ...activityNotifs,
    ...goalNotifs.filter((n) => n.severity === "info"),
    ...subNotifs.filter((n) => n.severity === "info" || n.severity === "success"),
    ...recNotifs.filter((n) => n.severity === "info" || n.severity === "success"),
  ];
}

// ─── Transaction fetch (for watcher) ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTransactionsRaw(): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await api.get<any>(`${apiEndpoints.transactions.list}?period=15d`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.transactions)) return res.transactions;
    return [];
  } catch {
    return [];
  }
}

// ─── Global goal change watcher (fires toasts for external updates) ───────────

export function useGoalChangeWatcher() {
  const { user } = useAuth();
  const prevRef = useRef<{ id: string; current: number; target: number }[]>([]);
  const prevTxIdsRef = useRef<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalsQuery = useQuery<any[]>({
    queryKey: ["notifications-goals"],
    queryFn: fetchGoalsRaw,
    enabled: !!user,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txQuery = useQuery<any[]>({
    queryKey: ["notifications-transactions"],
    queryFn: fetchTransactionsRaw,
    enabled: !!user,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const txs = txQuery.data;
    if (!txs?.length) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentIds = new Set(txs.map((t: any) => t.id as string));

    if (prevTxIdsRef.current.size === 0) {
      prevTxIdsRef.current = currentIds;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    txs.forEach((t: any) => {
      if (prevTxIdsRef.current.has(t.id)) return;
      const amount = t.amount ?? 0;
      const type = t.type === "INCOME" ? "Receita" : "Despesa";
      const desc = t.description ? ` — ${t.description}` : "";
      if (t.type === "INCOME") {
        toast.success(`💰 ${type} adicionada: ${fmtBRL(amount)}${desc}`);
      } else {
        toast.info(`💸 ${type} adicionada: ${fmtBRL(amount)}${desc}`);
      }
    });

    prevTxIdsRef.current = currentIds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txQuery.data]);

  useEffect(() => {
    const goals = goalsQuery.data;
    if (!goals?.length) return;

    goals.forEach((g) => {
      const current = g.current ?? g.current_value ?? 0;
      const target = g.target ?? g.target_value ?? 0;
      const name = g.name ?? g.title ?? "Meta";
      const prev = prevRef.current.find((p) => p.id === g.id);

      if (!prev || current <= prev.current) return;

      const added = current - prev.current;
      if (current >= target && prev.current < target) {
        toast.success(`🎉 Meta "${name}" concluída!`);
      } else if (current >= target * 0.8 && prev.current < target * 0.8) {
        toast.info(`📈 Meta "${name}" chegou a ${Math.round((current / target) * 100)}%!`);
      } else {
        toast.info(`📊 "${name}": +${fmtBRL(added)} adicionado (${Math.round((current / target) * 100)}%)`);
      }
    });

    prevRef.current = goals.map((g) => ({
      id: g.id,
      current: g.current ?? g.current_value ?? 0,
      target: g.target ?? g.target_value ?? 0,
    }));
  }, [goalsQuery.data]);
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useUserNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Always-on goals + cards queries (feed bell regardless of server mode) ─
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalsQuery = useQuery<any[]>({
    queryKey: ["notifications-goals"],
    queryFn: fetchGoalsRaw,
    enabled: !!user,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardsQuery = useQuery<any[]>({
    queryKey: ["notifications-cards"],
    queryFn: fetchCardsRaw,
    enabled: !!user,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  const goalNotifs = buildGoalNotifications(goalsQuery.data ?? []);
  const cardNotifs = buildCardNotifications(cardsQuery.data ?? []);

  // ── Server-side path ──────────────────────────────────────────────────────
  const serverQuery = useQuery<NotificationsResponse>({
    queryKey: ["notifications", "server"],
    queryFn: () => api.get<NotificationsResponse>(apiEndpoints.notifications.list),
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: false,
  });

  const isServerMode = serverQuery.isSuccess;
  const isServerError = serverQuery.isError;

  // ── Client-side fallback path ─────────────────────────────────────────────
  const [clientNotifications, setClientNotifications] = useState<UserNotification[]>([]);
  const [clientReadIds, setClientReadIds] = useState<string[]>(getReadIds);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (!isServerError || !user) return;

    let cancelled = false;

    const run = () => {
      setIsClientLoading(true);
      fetchClientSideNotifications(user.plan ?? "free")
        .then((notifs) => { if (!cancelled) { setClientNotifications(notifs); setIsClientLoading(false); } })
        .catch(() => { if (!cancelled) setIsClientLoading(false); });
    };

    run();
    const timer = setInterval(run, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [isServerError, user]);

  // ── Derived state ─────────────────────────────────────────────────────────
  // Merge goals+cards into whichever mode is active (dedup by id)
  const mergeLocal = (base: UserNotification[]): UserNotification[] => {
    const ids = new Set(base.map((n) => n.id));
    const extra = [
      ...cardNotifs.filter((n) => n.severity === "error"),
      ...cardNotifs.filter((n) => n.severity === "warning"),
      ...goalNotifs.filter((n) => n.severity === "success"),
      ...goalNotifs.filter((n) => n.severity === "info"),
    ].filter((n) => !ids.has(n.id));
    return [...extra, ...base];
  };

  const notifications: UserNotification[] = isServerMode
    ? mergeLocal(serverQuery.data?.data ?? [])
    : clientNotifications;

  const readIds: string[] = isServerMode
    ? notifications.filter((n) => n.readAt != null).map((n) => n.id)
    : clientReadIds;

  const extraUnread = isServerMode
    ? [...cardNotifs, ...goalNotifs].filter(
        (n) => !notifications.some((s) => s.id === n.id && s.readAt != null)
      ).length
    : 0;

  const unreadCount = isServerMode
    ? (serverQuery.data?.unreadCount ?? 0) + extraUnread
    : notifications.filter((n) => !clientReadIds.includes(n.id)).length;

  const isLoading = serverQuery.isPending || isClientLoading;

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    if (isServerMode) {
      // Optimistic update
      queryClient.setQueryData<NotificationsResponse>(["notifications", "server"], (prev) => {
        if (!prev) return prev;
        const readAt = new Date().toISOString();
        const data = prev.data.map((n) => n.id === id ? { ...n, readAt } : n);
        return { data, unreadCount: Math.max(0, prev.unreadCount - 1) };
      });
      try {
        await api.patch(apiEndpoints.notifications.markRead(id), {});
      } catch {
        queryClient.invalidateQueries({ queryKey: ["notifications", "server"] });
      }
    } else {
      setClientReadIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id];
        saveReadIds(next);
        return next;
      });
    }
  }, [isServerMode, queryClient]);

  const markAllRead = useCallback(async () => {
    if (isServerMode) {
      // Optimistic update
      queryClient.setQueryData<NotificationsResponse>(["notifications", "server"], (prev) => {
        if (!prev) return prev;
        const readAt = new Date().toISOString();
        return { data: prev.data.map((n) => ({ ...n, readAt })), unreadCount: 0 };
      });
      try {
        await api.post(apiEndpoints.notifications.markAllRead);
      } catch {
        queryClient.invalidateQueries({ queryKey: ["notifications", "server"] });
      }
    } else {
      const ids = clientNotifications.map((n) => n.id);
      setClientReadIds(ids);
      saveReadIds(ids);
    }
  }, [isServerMode, clientNotifications, queryClient]);

  return { notifications, readIds, unreadCount, isLoading, markRead, markAllRead };
}
