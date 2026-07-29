export type UserRole = "admin" | "user";
export type UserPlan = "free" | "pro" | "business";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  phone?: string;
  cpf?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  plan: string;
  cpf?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; cpf?: string | null }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  refreshUser: () => void;
  activatePro: () => void;
}
