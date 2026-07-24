import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { User, AuthContextType, UserPlan } from "@/types/auth";
import { storage } from "@/lib/storage";
import { api, publicApi, apiEndpoints } from "@/lib/api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

interface LoginApiResponse {
  data: { token: string; accessToken?: string };
}

interface RegisterApiResponse {
  data: {
    accessToken?: string;
    token?: string;
    user?: { name?: string; email?: string; role?: string; plan?: string };
  };
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  plan: string;
  phone?: string;
  cpf?: string;
}

function userFromClaims(claims: Record<string, unknown>, fallbackEmail: string): User {
  const role = (claims.role as string) === "admin" ? "admin" : "user";
  const planClaim = claims.plan as string;
  const plan = (["free", "pro", "business"].includes(planClaim) ? planClaim : "free") as UserPlan;

  return {
    id: (claims.sub as string) || (claims.id as string) || "",
    email: (claims.email as string) || fallbackEmail,
    name: (claims.name as string) || fallbackEmail.split("@")[0],
    role,
    plan,
    phone: (claims.phone as string) || undefined,
  };
}

interface MeApiResponse {
  data: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    role?: string;
    plan?: string;
  };
}

async function fetchAndMergeMe(base: User): Promise<User> {
  try {
    const res = await api.get<MeApiResponse>("/v1/users/me");
    const raw = res as unknown as Record<string, unknown>;
    const d = ((raw.data ?? raw) as Record<string, unknown>);
    return {
      ...base,
      name: (d.name as string) || base.name,
      phone: (d.phone as string) || base.phone || undefined,
      cpf: (d.cpf as string) || base.cpf || undefined,
      // Don't downgrade plan: if base has paid plan but backend still says "free" (webhook delay), keep paid
      plan: (base.plan !== "free" && d.plan === "free" ? base.plan : (["free", "pro", "business"].includes(d.plan as string) ? d.plan : base.plan)) as UserPlan,
    };
  } catch {
    return base;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = storage.getToken();
    const savedUser = storage.getUser();
    if (token && savedUser) {
      const claims = decodeJwt(token);
      const refreshedUser: User = {
        ...savedUser,
        plan: savedUser.plan ?? ((["free", "pro", "business"].includes(claims.plan as string) ? claims.plan : "free") as UserPlan),
      };
      setUser(refreshedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await publicApi.post<LoginApiResponse>(apiEndpoints.auth.login, { email, password });
      const raw = response as unknown as Record<string, unknown>;
      const nested = (raw.data ?? {}) as Record<string, unknown>;
      const token = (raw.token ?? raw.accessToken ?? nested.token ?? nested.accessToken ?? "") as string;
      const claims = decodeJwt(token);
      const user = userFromClaims(claims, email);

      storage.setToken(token);
      // Preserve paid plan from localStorage — backend may not have updated it yet (webhook delay)
      const savedUser = storage.getUser();
      if (savedUser?.id === user.id && savedUser.plan !== "free") {
        user.plan = savedUser.plan;
      }
      const enriched = await fetchAndMergeMe(user);
      storage.setUser(enriched);
      setUser(enriched);
      return enriched;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    type ApiErr = { status?: number; errors?: Record<string, string[]> | string[]; message?: string };

    let response: RegisterApiResponse;
    try {
      // Tenta enviar com CPF — backend pode já aceitar o campo
      response = await publicApi.post<RegisterApiResponse>(apiEndpoints.auth.register, payload);
    } catch (err: unknown) {
      const apiErr = err as ApiErr;
      const cpfRejected =
        apiErr?.status === 422 &&
        payload.cpf &&
        (
          (!Array.isArray(apiErr.errors) && apiErr.errors && "cpf" in apiErr.errors) ||
          (apiErr.message ?? "").toLowerCase().includes("cpf")
        );
      if (!cpfRejected) throw err;
      // Backend ainda rejeita o campo cpf — repete sem ele pra não travar o cadastro
      const { cpf: _cpf, ...apiPayload } = payload;
      response = await publicApi.post<RegisterApiResponse>(apiEndpoints.auth.register, apiPayload);
    }
    // API pode retornar token no nível raiz ou aninhado em `data`
    const raw = response as unknown as Record<string, unknown>;
    const nested = (raw.data ?? {}) as Record<string, unknown>;
    const token = (raw.accessToken ?? raw.token ?? nested.accessToken ?? nested.token) as string | undefined;
    if (token) {
      const claims = decodeJwt(token);
      const user = userFromClaims(claims, payload.email);
      // JWT não tem name/phone — extrair do objeto user da resposta
      const userData = (nested.user ?? {}) as Record<string, unknown>;
      user.name = (userData.name as string) || payload.name;
      if (payload.phone) user.phone = payload.phone;
      if (payload.cpf) user.cpf = payload.cpf;
      storage.setToken(token);
      const enriched = await fetchAndMergeMe(user);
      storage.setUser(enriched);
      setUser(enriched);
    } else {
      // API não retornou token no cadastro — faz login automaticamente
      await login(payload.email, payload.password);
    }
  }, [login]);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string }): Promise<void> => {
    await api.patch("/v1/users/me", data);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      storage.setUser(updated);
      return updated;
    });
  }, []);

  const changePassword = useCallback(async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.patch("/v1/users/me/password", data);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = storage.getToken();
    if (!token) return;
    // Fetch updated user from API — JWT plan claim may be stale after payment
    setUser((prev) => {
      if (!prev) return prev;
      fetchAndMergeMe(prev).then((updated) => {
        storage.setUser(updated);
        setUser(updated);
      });
      return prev;
    });
  }, []);

  const activatePro = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = { ...prev, plan: "pro" };
      storage.setUser(updated);
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    storage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateProfile, changePassword, refreshUser, activatePro }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}

export function useAuthLoading() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuthLoading deve ser usado dentro de um AuthProvider");
  return context.isLoading;
}
