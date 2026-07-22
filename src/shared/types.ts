export interface Transaction {
  id: string | number;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  icon?: string;
}

export interface ApiTransaction {
  id: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  occurredAt: string;
  /**
   * TODO(backend): vínculo real transação↔cartão. Ainda não existe no
   * CreateTransactionDto/response da API (ver CARTAO_TRANSACAO_TODO.md).
   * Já é enviado no create e lido aqui para não exigir outro deploy
   * do frontend quando o backend passar a suportar.
   */
  cardId?: string | null;
}

export interface ApiCategory {
  id: string;
  name: string;
}

export interface BalanceSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySummaryItem {
  categoryId: string;
  income: number;
  expense: number;
}

export interface Goal {
  id: string | number;
  name: string;
  current: number;
  target: number;
  deadline: string;
  color: string;
  icon: string;
  category: string;
}

export interface CreateGoalPayload {
  name: string;
  target: number;
  current?: number;
  deadline: string;
  color?: string;
  icon?: string;
  category?: string;
}

export interface CreditCard {
  id: string | number;
  name: string;
  number: string;
  limit: number;
  used: number;
  dueDate: string;
  color: string;
  flag: string;
}

export interface PlanInfo {
  id: string;
  name: string;
  price: string | number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Recurrence {
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

export interface RecurrencePayload {
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
}

export interface PixPaymentResponse {
  code: string;
  qrCodeUrl?: string;
  expiresAt?: string;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}
