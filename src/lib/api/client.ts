import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage } from "../storage";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]> | string[];
  details?: unknown;
}

// Extrai erro de qualquer shape de resposta do backend:
// { message, code }
// { error: "string" }
// { error: { message, code } }
// { errors: { field: [msgs] } }
// { errors: ["msg1", "msg2"] }
function extractApiError(error: AxiosError): ApiError {
  // Sem resposta = rede / timeout / offline
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
      return { message: "Tempo de conexão esgotado. Verifique sua internet.", status: 0, code: "TIMEOUT" };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { message: "Sem conexão com a internet.", status: 0, code: "OFFLINE" };
    }
    return { message: "Sem resposta do servidor. Tente novamente.", status: 0, code: "NETWORK_ERROR" };
  }

  const status = error.response.status;
  const data = error.response.data as Record<string, unknown> | null | undefined;

  if (!data) {
    return { message: `Erro ${status}`, status };
  }

  // ── Extrai message ────────────────────────────────────────────────────────
  const message: string =
    (typeof data.failureReason === "string" && data.failureReason) ||
    (typeof data.message === "string" && data.message) ||
    (typeof data.msg === "string" && data.msg) ||
    (typeof data.error === "string" && data.error) ||
    (typeof (data.error as Record<string, unknown>)?.message === "string"
      ? ((data.error as Record<string, unknown>).message as string)
      : "") ||
    (Array.isArray(data.errors) && typeof data.errors[0] === "string"
      ? (data.errors as string[]).join(". ")
      : "") ||
    error.message ||
    "Erro desconhecido";

  // ── Extrai code ───────────────────────────────────────────────────────────
  const code: string | undefined =
    (typeof data.code === "string" ? data.code : undefined) ||
    (typeof data.errorCode === "string" ? data.errorCode : undefined) ||
    (typeof (data.error as Record<string, unknown>)?.code === "string"
      ? ((data.error as Record<string, unknown>).code as string)
      : undefined);

  // ── Extrai field-level errors (validação) ─────────────────────────────────
  const errors: Record<string, string[]> | string[] | undefined =
    !Array.isArray(data.errors) && typeof data.errors === "object" && data.errors !== null
      ? (data.errors as Record<string, string[]>)
      : Array.isArray(data.errors)
      ? (data.errors as string[])
      : undefined;

  return { message, status, code, errors, details: data };
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = storage.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const apiError = extractApiError(error);

      const isAuthEndpoint = error.config?.url?.startsWith("/v1/auth/");
      const isPaymentFlow = typeof window !== "undefined" && window.location.pathname.startsWith("/pagamento");

      if (apiError.status === 401 && !isAuthEndpoint && !isPaymentFlow) {
        storage.clear();
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
}

function createPublicApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(extractApiError(error))
  );

  return instance;
}

export const http = createApiClient();
export const publicHttp = createPublicApiClient();

export const api = {
  get<T>(endpoint: string) {
    return http.get<T>(endpoint).then((r) => r.data);
  },
  post<T>(endpoint: string, data?: unknown) {
    return http.post<T>(endpoint, data).then((r) => r.data);
  },
  put<T>(endpoint: string, data: unknown) {
    return http.put<T>(endpoint, data).then((r) => r.data);
  },
  patch<T>(endpoint: string, data: unknown) {
    return http.patch<T>(endpoint, data).then((r) => r.data);
  },
  delete<T>(endpoint: string) {
    return http.delete<T>(endpoint).then((r) => r.data);
  },
};

export const publicApi = {
  get<T>(endpoint: string) {
    return publicHttp.get<T>(endpoint).then((r) => r.data);
  },
  post<T>(endpoint: string, data?: unknown) {
    return publicHttp.post<T>(endpoint, data).then((r) => r.data);
  },
  put<T>(endpoint: string, data: unknown) {
    return publicHttp.put<T>(endpoint, data).then((r) => r.data);
  },
  patch<T>(endpoint: string, data: unknown) {
    return publicHttp.patch<T>(endpoint, data).then((r) => r.data);
  },
  delete<T>(endpoint: string) {
    return publicHttp.delete<T>(endpoint).then((r) => r.data);
  },
};

export const apiEndpoints = {
  auth: {
    login: "/v1/auth/login",
    register: "/v1/auth/register",
    logout: "/v1/auth/logout",
    forgotPassword: "/v1/auth/forgot-password",
    resetPassword: "/v1/auth/reset-password",
    checkEmail: "/v1/auth/check-email",
    resetPasswordDirect: "/v1/auth/reset-password-direct",
  },
  categories: {
    list: "/v1/categories",
    create: "/v1/categories",
    update: (id: string) => `/v1/categories/${id}`,
    delete: (id: string) => `/v1/categories/${id}`,
  },
  transactions: {
    list: "/v1/transactions",
    create: "/v1/transactions",
    update: (id: string) => `/v1/transactions/${id}`,
    delete: (id: string) => `/v1/transactions/${id}`,
  },
  summary: {
    balance: "/v1/summary/balance",
    categories: "/v1/summary/categories",
  },
  recurrences: {
    create: "/v1/recurrences",
    update: (id: string) => `/v1/recurrences/${id}`,
    delete: (id: string) => `/v1/recurrences/${id}`,
    active: "/v1/recurrences/active",
    generate: "/v1/recurrences/generate",
  },
  lgpd: {
    export: "/v1/lgpd/export",
    delete: "/v1/lgpd",
  },
  goals: {
    list: "/v1/goals",
    create: "/v1/goals",
    update: (id: string) => `/v1/goals/${id}`,
    delete: (id: string) => `/v1/goals/${id}`,
    history: (id: string) => `/v1/goals/${id}/history`,
    addHistory: (id: string) => `/v1/goals/${id}/history`,
  },
  cards: {
    list: "/v1/cards",
    create: "/v1/cards",
    update: (id: string) => `/v1/cards/${id}`,
    delete: (id: string) => `/v1/cards/${id}`,
    history: (id: string) => `/v1/cards/${id}/history`,
    addHistory: (id: string) => `/v1/cards/${id}/history`,
  },
  notifications: {
    list: "/v1/notifications",
    markRead: (id: string) => `/v1/notifications/${id}/read`,
    markAllRead: "/v1/notifications/read-all",
  },
  plans: {
    list: "/v1/plans",
    get: (id: string) => `/v1/plans/${id}`,
  },
  payments: {
    intent: "/v1/payments/intent",
    confirm: (paymentId: string) => `/v1/payments/${paymentId}/confirm`,
    status: (paymentId: string) => `/v1/payments/${paymentId}/status`,
  },
  admin: {
    stats: "/v1/admin/stats",
    revenue: "/v1/admin/revenue",
    revenueChart: "/v1/admin/revenue/chart",
    cashflow: "/v1/admin/cashflow",
    users: "/v1/admin/users",
    user: (id: string) => `/v1/admin/users/${id}`,
    userGrowth: "/v1/admin/users/growth",
    clients: "/v1/admin/clients",
    subscriptions: "/v1/admin/subscriptions",
    plans: "/v1/admin/plans",
    plan: (id: string) => `/v1/admin/plans/${id}`,
    planDistribution: "/v1/admin/plans/distribution",
    activity: "/v1/admin/activity",
    churn: "/v1/admin/churn",
    reportsExport: "/v1/admin/reports/export",
  },
} as const;
