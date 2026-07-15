import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, Loader2, ArrowLeft, MessageCircle, BarChart3, Brain, CreditCard, Repeat2, Wallet } from "lucide-react";
import { api, apiEndpoints } from "@/lib/api/client";
import { forgotPasswordSchema } from "@/features/auth/schemas/auth.schema";
import { AUTH_BG, AUTH_LOGO } from "@/features/auth/constants";

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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message);
      return;
    }
    setEmailError(undefined);
    setIsLoading(true);
    try {
      const res = await api.post<{ data: { exists: boolean } }>(apiEndpoints.auth.checkEmail, { email });
      if (res?.data?.exists) {
        navigate(`/redefinir-senha?email=${encodeURIComponent(email)}`);
        return;
      }
      setEmailError("Email não cadastrado");
    } catch {
      setEmailError("Erro ao verificar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: AUTH_BG }}>
      <OrbStyles />
      <Orbs />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src={AUTH_LOGO} alt="doutorcash" className="h-12 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Recuperar senha</h1>
          <p className="text-white/60">Insira seu email cadastrado para redefinir sua senha</p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(undefined); }}
                  className={`auth-input pl-11 h-11 ${
                    emailError
                      ? "border-destructive focus:border-destructive"
                      : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                  }`}
                  disabled={isLoading}
                  autoComplete="email"
                  aria-describedby={emailError ? "email-error" : undefined}
                  aria-invalid={!!emailError}
                />
              </div>
              {emailError && (
                <p id="email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive inline-block" aria-hidden="true" />{emailError}
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
                ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</>
                : <>Continuar<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </GlassCard>

        <p className="text-center text-white/60 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-[#E5E7EB] font-medium hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
