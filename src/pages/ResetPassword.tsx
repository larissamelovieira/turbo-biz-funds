import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, MessageCircle, BarChart3, Brain, CreditCard, Repeat2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, apiEndpoints } from "@/lib/api/client";
import { z } from "zod";
import { AUTH_BG, AUTH_LOGO } from "@/features/auth/constants";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "Deve conter ao menos 1 letra maiúscula").regex(/[0-9]/, "Deve conter ao menos 1 número"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

type FieldErrors = { password?: string; confirmPassword?: string };

const OrbStyles = () => (
  <style>{`
    @keyframes orb-pulse {
      0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.18; }
      33%       { transform: scale(1.18) translate(20px, -30px); opacity: 0.28; }
      66%       { transform: scale(0.88) translate(-15px, 20px); opacity: 0.14; }
    }
    @keyframes orb-pulse-b {
      0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.14; }
      40%       { transform: scale(1.22) translate(-25px, 15px); opacity: 0.24; }
      70%       { transform: scale(0.85) translate(20px, -20px); opacity: 0.10; }
    }
    @keyframes orb-pulse-c {
      0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.10; }
      50%       { transform: scale(1.3) translate(10px, 25px); opacity: 0.20; }
    }
  `}</style>
);

const Orbs = () => (
  <>
    <div className="absolute top-[10%] left-[8%] w-24 h-24 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(37,211,102,0.2) 0%, rgba(37,211,102,0.04) 70%)", border: "1px solid rgba(37,211,102,0.35)", animation: "orb-pulse 9s ease-in-out infinite", boxShadow: "0 0 30px rgba(37,211,102,0.18)" }}>
      <MessageCircle className="w-10 h-10" style={{ color: "#25D366" }} />
    </div>
    <div className="absolute bottom-[18%] right-[7%] w-28 h-28 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.04) 70%)", border: "1px solid rgba(56,189,248,0.35)", animation: "orb-pulse-b 12s ease-in-out infinite 1.5s", boxShadow: "0 0 30px rgba(56,189,248,0.18)" }}>
      <BarChart3 className="w-12 h-12" style={{ color: "#38BDF8" }} />
    </div>
    <div className="absolute top-[52%] left-[4%] w-20 h-20 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.04) 70%)", border: "1px solid rgba(167,139,250,0.35)", animation: "orb-pulse-c 7s ease-in-out infinite 3s", boxShadow: "0 0 24px rgba(167,139,250,0.18)" }}>
      <Brain className="w-8 h-8" style={{ color: "#A78BFA" }} />
    </div>
    <div className="absolute top-[18%] right-[10%] w-20 h-20 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.04) 70%)", border: "1px solid rgba(251,191,36,0.35)", animation: "orb-pulse-b 10s ease-in-out infinite 0.8s", boxShadow: "0 0 24px rgba(251,191,36,0.18)" }}>
      <CreditCard className="w-8 h-8" style={{ color: "#FBBF24" }} />
    </div>
    <div className="absolute bottom-[8%] left-[15%] w-16 h-16 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0.04) 70%)", border: "1px solid rgba(251,146,60,0.35)", animation: "orb-pulse-c 8s ease-in-out infinite 2s", boxShadow: "0 0 20px rgba(251,146,60,0.18)" }}>
      <Repeat2 className="w-7 h-7" style={{ color: "#FB923C" }} />
    </div>
    <div className="absolute top-[38%] right-[4%] w-16 h-16 rounded-full pointer-events-none hidden md:flex items-center justify-center"
      style={{ background: "radial-gradient(circle, rgba(74,222,128,0.2) 0%, rgba(74,222,128,0.04) 70%)", border: "1px solid rgba(74,222,128,0.35)", animation: "orb-pulse 11s ease-in-out infinite 4s", boxShadow: "0 0 20px rgba(74,222,128,0.18)" }}>
      <Wallet className="w-7 h-7" style={{ color: "#4ADE80" }} />
    </div>
  </>
);

const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(27,77,191,0.25),0_32px_64px_rgba(0,0,0,0.4)]"
    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(27,77,191,0.35)", backdropFilter: "blur(20px)" }}>
    <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, transparent, #1B4DBF, transparent)" }} />
    <div className="p-7">{children}</div>
  </div>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: AUTH_BG }}>
        <OrbStyles />
        <Orbs />
        <div className="w-full max-w-md text-center relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <img src={AUTH_LOGO} alt="doutorcash" className="h-12 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <GlassCard>
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-white">Sessão inválida</p>
                <p className="text-sm text-white/50 mt-1">
                  Informe seu email novamente pra redefinir a senha.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/recuperar-senha")}
                className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1B4DBF, #0B1F3A)", boxShadow: "0 0 20px rgba(27,77,191,0.4)" }}
              >
                Voltar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post(apiEndpoints.auth.resetPasswordDirect, { email, password });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 404) {
        toast.error("Email não encontrado. Solicite novamente.");
        navigate("/recuperar-senha");
        return;
      }
      toast.error(apiErr?.message ?? "Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: AUTH_BG }}>
        <OrbStyles />
        <Orbs />
        <div className="w-full max-w-md text-center relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <img src={AUTH_LOGO} alt="doutorcash" className="h-12 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <GlassCard>
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-white">Senha redefinida!</p>
                <p className="text-sm text-white/50 mt-1">Sua senha foi atualizada com sucesso.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1B4DBF, #0B1F3A)", boxShadow: "0 0 20px rgba(27,77,191,0.4)" }}
              >
                Ir para o login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: AUTH_BG }}>
      <OrbStyles />
      <Orbs />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src={AUTH_LOGO} alt="doutorcash" className="h-12 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Nova senha</h1>
          <p className="text-white/60">Escolha uma senha forte para sua conta</p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/80">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`auth-input pl-11 pr-11 h-11 ${
                    errors.password
                      ? "border-destructive focus:border-destructive"
                      : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-describedby={errors.password ? "password-error" : "password-hint"}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password
                ? <p id="password-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-destructive inline-block" />{errors.password}
                  </p>
                : <p id="password-hint" className="text-xs text-white/40">Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
              }
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium text-white/80">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" aria-hidden="true" />
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  className={`auth-input pl-11 h-11 ${
                    errors.confirmPassword
                      ? "border-destructive focus:border-destructive"
                      : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive inline-block" />{errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1B4DBF, #0B1F3A)", boxShadow: "0 0 20px rgba(27,77,191,0.4)" }}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                : <>Salvar nova senha<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </GlassCard>

        <p className="text-center text-white/60 mt-6">
          <Link to="/recuperar-senha" className="inline-flex items-center gap-1 text-[#E5E7EB] font-medium hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Usar outro email
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
