import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone, ArrowRight, Check, Loader2, Zap, Eye, EyeOff, MessageCircle, BarChart3, CreditCard, Repeat2, Brain, Wallet, Hash, Crown, BadgePercent, TrendingUp, BadgeCheck, QrCode, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
const logoWeb = "/logoweb.png";

function isOver18(dateStr: string): boolean {
  if (!dateStr) return false;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

const maxBirthDate = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(digits[10]);
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    phone: z
      .string()
      .min(10, "Telefone inválido")
      .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, "Formato: (11) 99999-9999"),
    cpf: z
      .string()
      .optional()
      .refine((v) => !v || validateCPF(v), "CPF inválido"),
    birthDate: z
      .string()
      .min(1, "Data de nascimento é obrigatória")
      .refine((v) => isOver18(v), "Você precisa ter pelo menos 18 anos para se cadastrar"),
    email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
interface FormErrors {
  name?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const CRITERIA = [
  { id: "len",     label: "Mínimo 8 caracteres",       badge: "8+", test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "Letra maiúscula (A-Z)",      badge: "A",  test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",   label: "Letra minúscula (a-z)",      badge: "a",  test: (p: string) => /[a-z]/.test(p) },
  { id: "number",  label: "Número (0-9)",               badge: "1",  test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "Caractere especial (!@#$%)", badge: "@",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_LABELS = ["", "Fraca", "Razoável", "Boa", "Forte", "Muito forte"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

function PasswordStrength({ password }: { password: string }) {
  const passed = CRITERIA.filter((c) => c.test(password));
  const score = passed.length;
  const label = STRENGTH_LABELS[score] ?? "";
  const color = STRENGTH_COLORS[score] ?? "#e5e7eb";

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progresso */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {CRITERIA.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i < score ? color : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>
        {label && (
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color }}>
            {label}
          </span>
        )}
      </div>

      {/* Critérios */}
      <div className="space-y-1">
        {CRITERIA.map((c) => {
          const ok = c.test(password);
          return (
            <div key={c.id} className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border transition-colors ${
                ok ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-white/5 border-white/20 text-white/30"
              }`}>
                {c.badge}
              </span>
              <span className={`text-xs transition-colors ${ok ? "text-green-400" : "text-white/40"}`}>
                {c.label}
              </span>
              {ok && <Check className="w-3 h-3 text-green-400 ml-auto" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRO_FEATURES = [
  "Assistente financeiro com IA 24h",
  "Registro por WhatsApp (áudio, foto, texto)",
  "Categorização automática inteligente",
  "Relatórios detalhados mensais",
  "Controle de recorrências",
  "Suporte prioritário",
];

const Cadastro = () => {
  const [step, setStep] = useState(1);
  const location = useLocation();
  const [formData, setFormData] = useState<RegisterFormData & { plan: string; cpf: string }>({
    name: "",
    phone: "",
    cpf: "",
    birthDate: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: "pro-annual",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const pendingPlan = sessionStorage.getItem("pendingPaymentPlan");
      if (pendingPlan) {
        navigate(`/pagamento?plan=${pendingPlan}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isPaid = formData.plan !== "free";

  const validateStep1 = (): boolean => {
    const result = registerSchema.safeParse({
      name: formData.name,
      phone: formData.phone,
      birthDate: formData.birthDate,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof FormErrors;
        formattedErrors[path] = issue.message;
        if (path === "birthDate" && issue.message.includes("18 anos")) {
          toast.error("Você precisa ter pelo menos 18 anos para se cadastrar.", { duration: 4000 });
        }
      });
      setErrors(formattedErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isPaid) {
        sessionStorage.setItem("postRegisterRedirect", `/pagamento?plan=${formData.plan}`);
        sessionStorage.setItem("pendingPaymentPlan", formData.plan);
      }

      const apiPlanId = formData.plan === "pro-annual" || formData.plan === "pro-monthly" ? "pro" : formData.plan;
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        plan: apiPlanId,
        phone: formData.phone,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, "") : undefined,
      });

      analytics.signup("email");

      if (isPaid) {
        toast.success("Conta criada! Redirecionando para pagamento...");
        navigate(`/pagamento?plan=${formData.plan}`, { replace: true });
      } else {
        // Plano grátis: limpa sessão e vai para login
        await logout();
        sessionStorage.removeItem("postRegisterRedirect");
        sessionStorage.removeItem("pendingPaymentPlan");
        toast.success("Conta criada com sucesso! Faça login para continuar.");
        navigate("/login", { replace: true });
      }
    } catch (err: unknown) {
      sessionStorage.removeItem("postRegisterRedirect");
      sessionStorage.removeItem("pendingPaymentPlan");

      type ApiErr = { message?: string; status?: number; code?: string; errors?: Record<string, string[]> };
      const apiError = err as ApiErr;
      const msg = apiError?.message ?? "";
      const status = apiError?.status ?? 0;

      if (status === 409) {
        const isPhone = /phone|telefone|celular/i.test(msg) || apiError?.code === "PHONE_ALREADY_EXISTS";
        const isEmail = /email/i.test(msg) || apiError?.code === "EMAIL_ALREADY_EXISTS";

        if (isPhone) {
          toast.error("Este telefone já está cadastrado. Use outro número ou faça login.", { duration: 4000 });
          setErrors((prev) => ({ ...prev, phone: "Telefone já cadastrado" }));
          setStep(1);
        } else if (isEmail) {
          toast.error("Este email já está cadastrado. Redirecionando para o login...", { duration: 3000 });
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        } else {
          // Conflito genérico — trata os dois campos
          toast.error(msg || "Dados já cadastrados. Verifique email e telefone ou faça login.", { duration: 4000 });
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        }
      } else if (status === 422 || status === 400) {
        // Erros de validação por campo vindos do backend
        const fieldErrors = apiError?.errors;
        if (fieldErrors) {
          const mapped: FormErrors = {};
          if (fieldErrors.email)    mapped.email    = fieldErrors.email[0];
          if (fieldErrors.phone)    mapped.phone    = fieldErrors.phone[0];
          if (fieldErrors.cpf)      mapped.cpf      = fieldErrors.cpf[0];
          if (fieldErrors.name)     mapped.name     = fieldErrors.name[0];
          if (fieldErrors.password) mapped.password = fieldErrors.password[0];
          if (Object.keys(mapped).length > 0) {
            setErrors(mapped);
            setStep(1);
            toast.error("Corrija os campos destacados e tente novamente.");
          } else {
            toast.error(msg || "Dados inválidos. Verifique o formulário.");
          }
        } else {
          toast.error(msg || "Dados inválidos. Verifique o formulário.");
        }
      } else if (status === 429) {
        toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.", { duration: 5000 });
      } else if (status === 0 || status >= 500) {
        toast.error("Serviço indisponível no momento. Tente novamente em alguns instantes.", { duration: 4000 });
      } else {
        toast.error(msg || "Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const BG = "radial-gradient(ellipse 120% 60% at 50% -10%, #1B4DBF 0%, #0B1F3A 50%, #060d1a 100%)";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative overflow-hidden" style={{ background: BG }}>

      {/* Animated orbs */}
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
      {/* Orb: WhatsApp — green */}
      <div className="absolute top-[10%] left-[8%] w-24 h-24 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(37,211,102,0.2) 0%, rgba(37,211,102,0.04) 70%)", border: "1px solid rgba(37,211,102,0.35)", animation: "orb-pulse 9s ease-in-out infinite", boxShadow: "0 0 30px rgba(37,211,102,0.18)" }}>
        <MessageCircle className="w-10 h-10" style={{ color: "#25D366" }} />
      </div>

      {/* Orb: Gráficos — cyan */}
      <div className="absolute bottom-[18%] right-[7%] w-28 h-28 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.04) 70%)", border: "1px solid rgba(56,189,248,0.35)", animation: "orb-pulse-b 12s ease-in-out infinite 1.5s", boxShadow: "0 0 30px rgba(56,189,248,0.18)" }}>
        <BarChart3 className="w-12 h-12" style={{ color: "#38BDF8" }} />
      </div>

      {/* Orb: IA — purple */}
      <div className="absolute top-[52%] left-[4%] w-20 h-20 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.04) 70%)", border: "1px solid rgba(167,139,250,0.35)", animation: "orb-pulse-c 7s ease-in-out infinite 3s", boxShadow: "0 0 24px rgba(167,139,250,0.18)" }}>
        <Brain className="w-8 h-8" style={{ color: "#A78BFA" }} />
      </div>

      {/* Orb: Cartão — yellow */}
      <div className="absolute top-[18%] right-[10%] w-20 h-20 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.04) 70%)", border: "1px solid rgba(251,191,36,0.35)", animation: "orb-pulse-b 10s ease-in-out infinite 0.8s", boxShadow: "0 0 24px rgba(251,191,36,0.18)" }}>
        <CreditCard className="w-8 h-8" style={{ color: "#FBBF24" }} />
      </div>

      {/* Orb: Recorrências — orange */}
      <div className="absolute bottom-[8%] left-[15%] w-16 h-16 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0.04) 70%)", border: "1px solid rgba(251,146,60,0.35)", animation: "orb-pulse-c 8s ease-in-out infinite 2s", boxShadow: "0 0 20px rgba(251,146,60,0.18)" }}>
        <Repeat2 className="w-7 h-7" style={{ color: "#FB923C" }} />
      </div>

      {/* Orb: Carteira — emerald */}
      <div className="absolute top-[38%] right-[4%] w-16 h-16 rounded-full pointer-events-none hidden md:flex items-center justify-center"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,0.2) 0%, rgba(74,222,128,0.04) 70%)", border: "1px solid rgba(74,222,128,0.35)", animation: "orb-pulse 11s ease-in-out infinite 4s", boxShadow: "0 0 20px rgba(74,222,128,0.18)" }}>
        <Wallet className="w-7 h-7" style={{ color: "#4ADE80" }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src={logoWeb} alt="doutorcash" className="h-12 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 1 ? "Crie sua conta" : "Escolha seu plano"}
          </h1>
          <p className="text-white/60">
            {step === 1 ? "Comece grátis e escale conforme cresce" : "Você pode mudar de plano a qualquer momento"}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${step >= 1 ? "bg-[#1B4DBF] text-white" : "bg-white/20 text-white/50"}`}>
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <div className={`w-16 h-0.5 rounded-full transition-colors ${step >= 2 ? "bg-[#1B4DBF]" : "bg-white/20"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${step >= 2 ? "bg-[#1B4DBF] text-white" : "bg-white/20 text-white/50"}`}>
              2
            </div>
          </div>
          <div className="flex justify-center gap-16 mt-2 text-xs text-white/50">
            <span>Dados pessoais</span>
            <span>Plano</span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(27,77,191,0.25),0_32px_64px_rgba(0,0,0,0.4)]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(27,77,191,0.35)", backdropFilter: "blur(20px)" }}>
          {/* Top accent bar */}
          <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, transparent, #1B4DBF, transparent)" }} />
          <div className="p-7">
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-white/80">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      className={`auth-input pl-11 h-11 ${
                        errors.name
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-white/80">
                    Telefone / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let masked = raw;
                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                        setFormData({ ...formData, phone: masked });
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                      className={`auth-input pl-11 h-11 ${
                        errors.phone
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium text-white/80">
                    CPF <span className="text-white/40 font-normal">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="cpf"
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let masked = raw;
                        if (raw.length > 3) masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
                        if (raw.length > 6) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
                        if (raw.length > 9) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
                        setFormData({ ...formData, cpf: masked });
                        if (errors.cpf) setErrors({ ...errors, cpf: undefined });
                      }}
                      className={`auth-input pl-11 h-11 ${
                        errors.cpf
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.cpf && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.cpf}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-white/80">
                    Data de nascimento
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55 pointer-events-none z-10" />
                    <Input
                      id="birthDate"
                      type="date"
                      max={maxBirthDate}
                      value={formData.birthDate}
                      onChange={(e) => {
                        setFormData({ ...formData, birthDate: e.target.value });
                        if (errors.birthDate) setErrors({ ...errors, birthDate: undefined });
                      }}
                      className={`auth-input pl-11 h-11 [color-scheme:dark] ${
                        errors.birthDate
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.birthDate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.birthDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`auth-input pl-11 h-11 ${
                        errors.email
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/80">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={`auth-input pl-11 pr-11 h-11 ${
                        errors.password
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.password}
                    </p>
                  )}
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/55" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (errors.confirmPassword)
                          setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      className={`auth-input pl-11 pr-11 h-11 ${
                        errors.confirmPassword
                          ? "border-destructive focus:border-destructive"
                          : "bg-[#0c1938] border-[#1B4DBF]/40 text-white placeholder:text-white/40 focus:border-[#1B4DBF] focus:bg-[#0e1d42] focus:ring-[#1B4DBF]/20"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="w-full h-11 mt-2 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, #1B4DBF, #0B1F3A)`, boxShadow: "0 0 20px rgba(27,77,191,0.4)" }}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Card do plano — igual landing page */}
                <div
                  className="relative rounded-3xl shadow-2xl p-6"
                  style={{ background: "#0B1F3A", border: "1px solid rgba(27,77,191,0.31)", boxShadow: "0 25px 60px rgba(11,31,58,0.5)" }}
                >
                  <>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2" style={{ borderColor: "rgba(27,77,191,0.6)", background: "rgba(27,77,191,0.2)" }}>
                          <Crown className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white uppercase tracking-wide">Plano Anual</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2" style={{ borderColor: "rgba(27,77,191,0.8)", background: "rgba(27,77,191,0.3)" }}>
                          <BadgePercent className="w-3.5 h-3.5 text-[#E5E7EB]" />
                          <span className="text-xs font-bold uppercase tracking-wide text-[#E5E7EB]">49% OFF</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 mb-3">
                        <p className="text-center text-[15px] font-bold text-white">
                          Acesso completo ao <span className="text-[#E5E7EB]">Doutor Cash</span>
                        </p>
                        <BadgeCheck className="w-5 h-5 shrink-0 text-[#E5E7EB]" />
                      </div>

                      <p className="text-center text-sm text-white/40 line-through mb-1">De R$197,00 por</p>

                      <div className="flex items-baseline justify-center gap-0.5 mb-3">
                        <span className="text-2xl font-bold text-white">R$</span>
                        <span className="text-6xl font-black text-white leading-none tracking-tighter">99</span>
                        <span className="text-3xl font-black text-white">,90</span>
                      </div>

                      <div className="flex justify-center mb-3">
                        <div className="flex items-center gap-2 px-6 py-2 rounded-full" style={{ background: "#1B4DBF", boxShadow: "0 0 20px rgba(27,77,191,0.6)" }}>
                          <QrCode className="w-4 h-4 text-white" />
                          <span className="text-sm font-bold text-white">à vista no PIX</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-px bg-white/15" />
                        <span className="text-xs font-semibold text-white/40 uppercase">ou</span>
                        <div className="flex-1 h-px bg-white/15" />
                      </div>

                      <div
                        className="rounded-2xl p-3 mb-3 text-center"
                        style={{ background: "rgba(27,77,191,0.2)", border: "1px solid rgba(27,77,191,0.5)" }}
                      >
                        <p className="text-2xl font-black text-white">
                          12x de <span className="text-[#E5E7EB]">R$ 12,90</span>
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">Valor total: R$ 154,80 no cartão</p>
                      </div>

                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 px-5 py-1.5 rounded-full border-2" style={{ borderColor: "rgba(27,77,191,0.5)", background: "rgba(27,77,191,0.15)" }}>
                          <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                          <span className="text-sm font-semibold text-white/80">Economia de 49%</span>
                        </div>
                      </div>
                  </>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1B4DBF, #0B1F3A)", boxShadow: "0 0 20px rgba(27,77,191,0.4)" }}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>
                  ) : (
                    <>Criar conta e ir para pagamento<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}
          </form>
          </div>
        </div>

        <p className="text-center text-white/60 mt-6">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-[#E5E7EB] font-medium hover:text-white transition-colors">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-white/40 mt-4">
          Ao criar uma conta, você concorda com nossos{" "}
          <a href="#" className="text-[#E5E7EB] hover:underline">Termos de Uso</a>
          {" "}e{" "}
          <a href="#" className="text-[#E5E7EB] hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
};

export default Cadastro;
