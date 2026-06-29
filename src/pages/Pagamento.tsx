/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Check,
  Copy,
  CheckCheck,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { usePlanInfo } from "@/features/payments/hooks/use-plan-info";
import { api, apiEndpoints } from "@/lib/api/client";
import { toast } from "sonner";
import { fmtBRL } from "@/lib/format";
import EfiPay from "payment-token-efi";
import { useAuth } from "@/contexts/AuthContext";

const logoWeb = "/logoweb.png";
const INSTALLMENTS_ANNUAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const INSTALLMENTS_MONTHLY = [1];

const BG = "linear-gradient(to bottom, #0B1F3A, #0B1F3A 50%, #0B1F3A)";

const CTA_BTN =
  "w-full h-12 inline-flex items-center justify-center gap-2 px-6 " +
  "bg-gradient-to-r from-[#1B4DBF] to-[#0B1F3A] " +
  "hover:from-[#1a5fff] hover:to-[#0d2a50] " +
  "active:scale-[0.98] " +
  "text-white font-bold text-sm rounded-xl " +
  "border border-blue-500/20 " +
  "shadow-[0_0_24px_rgba(27,77,191,0.35)] " +
  "hover:shadow-[0_0_38px_rgba(27,77,191,0.55)] " +
  "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const CARD =
  "rounded-2xl border border-white/[0.08] bg-[#0B1F3A]/80 backdrop-blur-sm p-6 shadow-xl";

const INPUT_CLS =
  "h-11 bg-[#0B1F3A] border-white/10 text-white placeholder:text-white/30 " +
  "focus:border-[#1B4DBF] focus:ring-[#1B4DBF]/20 focus:ring-2";

const LABEL_CLS = "text-sm font-medium text-white/70";

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

type CardBrand = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "discover" | null;

function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, "");
  if (!n) return null;
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720))/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650[0-9]|6516|6550)/.test(n)) return "elo";
  if (/^(606282|637095|637568|637599|637609|637612)/.test(n)) return "hipercard";
  if (/^(6011|622|64[4-9]|65)/.test(n)) return "discover";
  return null;
}

const BRAND_COLORS: Record<NonNullable<CardBrand>, string> = {
  visa:       "#1A1F71",
  mastercard: "#EB001B",
  amex:       "#007BC1",
  elo:        "#FFD700",
  hipercard:  "#C8102E",
  discover:   "#FF6600",
};

function CardBrandIcon({ brand }: { brand: CardBrand }) {
  if (!brand) return null;

  const icons: Record<NonNullable<CardBrand>, React.ReactNode> = {
    visa: (
      <svg viewBox="0 0 750 471" className="w-8 h-5" aria-label="Visa">
        <rect width="750" height="471" rx="40" fill="#1A1F71" />
        <text x="375" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="230" fill="white" letterSpacing="-10">VISA</text>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 38 24" className="w-8 h-5" aria-label="Mastercard">
        <rect width="38" height="24" rx="4" fill="#252525" />
        <circle cx="14" cy="12" r="7" fill="#EB001B" />
        <circle cx="24" cy="12" r="7" fill="#F79E1B" />
        <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 750 471" className="w-8 h-5" aria-label="American Express">
        <rect width="750" height="471" rx="40" fill="#007BC1" />
        <text x="375" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="200" fill="white">AMEX</text>
      </svg>
    ),
    elo: (
      <svg viewBox="0 0 750 471" className="w-8 h-5" aria-label="Elo">
        <rect width="750" height="471" rx="40" fill="#000" />
        <text x="375" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="260" fill="#FFD700">ELO</text>
      </svg>
    ),
    hipercard: (
      <svg viewBox="0 0 750 471" className="w-8 h-5" aria-label="Hipercard">
        <rect width="750" height="471" rx="40" fill="#C8102E" />
        <text x="375" y="310" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="160" fill="white">HIPER</text>
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 750 471" className="w-8 h-5" aria-label="Discover">
        <rect width="750" height="471" rx="40" fill="#fff" />
        <circle cx="480" cy="236" r="160" fill="#FF6600" />
        <text x="240" y="290" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="130" fill="#231F20">DISC</text>
      </svg>
    ),
  };

  return <>{icons[brand]}</>;
}

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function calcInstallment(price: string | number, n: number): string {
  const raw = typeof price === "number" ? price : parseFloat(String(price).replace(/[^\d.,]/g, "").replace(",", "."));
  if (isNaN(raw) || raw === 0) return "—";
  return fmtBRL(Math.round((raw / n) * 100) / 100);
}

function toDisplay(price: string | number): string {
  if (typeof price === "number") return fmtBRL(price);
  return String(price);
}

type PaymentMethod = "cartao" | "pix";

interface PlanDisplay {
  name: string;
  price: string | number;
  period: string;
  description: string;
  features: string[];
}

interface PaymentIntent {
  paymentId: string;
  method: PaymentMethod;
  status: string;
  expiresAt?: string;
  pix?: { qrCodeBase64: string; qrCodeText: string; expiresInSeconds: number };
  amount: number;
  currency: string;
}

const EFI_CLIENT_ID = import.meta.env.VITE_EFI_CLIENT_ID as string;
const EFI_PAYEE_CODE = import.meta.env.VITE_EFI_PAYEE_CODE as string;
const EFI_IS_SANDBOX = import.meta.env.VITE_EFI_ENV === "sandbox";

const EFI_BRAND_MAP: Record<NonNullable<CardBrand>, string | null> = {
  visa: "visa",
  mastercard: "mastercard",
  amex: "amex",
  elo: "elo",
  hipercard: "hipercard",
  discover: null,
};

// ---------- CardForm ----------
function CardForm({
  isLoading,
  onSubmit,
  planInfo,
  installmentOptions,
  holderDocument,
  onInstallmentsChange,
}: {
  isLoading: boolean;
  onSubmit: (data: { paymentToken: string; holderName: string; installments: number; cpf: string }) => void;
  planInfo: PlanDisplay;
  installmentOptions: number[];
  holderDocument?: string;
  onInstallmentsChange?: (n: number) => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState(holderDocument ?? "");
  const [installments, setInstallments] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brand, setBrand] = useState<CardBrand>(null);
  const [tokenizing, setTokenizing] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, "").length < 16) errs.cardNumber = "Número inválido";
    if (!brand) errs.cardNumber = "Bandeira não reconhecida";
    if (cardName.trim().length < 3) errs.cardName = "Nome inválido";
    if (expiry.length < 5) errs.expiry = "Data inválida";
    if (cvv.length < 3) errs.cvv = "CVV inválido";
    if (!validateCPF(cpf)) errs.cpf = "CPF inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const efiBrand = brand ? EFI_BRAND_MAP[brand] : null;
    if (!efiBrand) {
      setErrors((prev) => ({ ...prev, cardNumber: "Bandeira não suportada" }));
      return;
    }

    const [expiryMonth, rawYear] = expiry.split("/");
    const expiryYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const cpfDigits = cpf.replace(/\D/g, "");

    setTokenizing(true);
    try {
      const env = EFI_IS_SANDBOX ? "sandbox" : "production";
      const result = await EfiPay.CreditCard
        .setEnvironment(env)
        .setAccount(EFI_PAYEE_CODE)
        .setBrand(efiBrand)
        .setTotal(Math.round(planInfo.price * 100))
        .setCreditCardData({
          brand: efiBrand,
          number: cardNumber.replace(/\s/g, ""),
          cvv,
          expirationMonth: expiryMonth,
          expirationYear: expiryYear,
          holderName: cardName,
          holderDocument: cpfDigits,
          reuse: false,
        })
        .getPaymentToken();
      const tokenResult = result as { payment_token: string; card_mask: string };
      onSubmit({ paymentToken: tokenResult.payment_token, holderName: cardName, installments, cpf: cpfDigits });
      setCardNumber("");
      setCvv("");
    } catch (err) {
      const efiErr = err as { message?: string; error_description?: string; error?: string };
      const msg = efiErr?.error_description ?? efiErr?.message ?? "Erro ao tokenizar cartão. Verifique os dados.";
      const isDocError = efiErr?.error === "invalid_holder_document"
        || msg.toLowerCase().includes("documento")
        || msg.toLowerCase().includes("document");
      if (isDocError) {
        setErrors((prev) => ({ ...prev, cpf: "CPF do titular inválido. Verifique o número." }));
      } else {
        setErrors((prev) => ({ ...prev, cardNumber: msg }));
      }
    } finally {
      setTokenizing(false);
    }
  };

  const installmentLabel = (n: number) => {
    const val = calcInstallment(planInfo.price, n);
    if (n === 1) return `1x de ${val} (à vista)`;
    return `${n}x de ${val} sem juros`;
  };

  const btnLabel = installments === 1
    ? `Pagar ${calcInstallment(planInfo.price, 1)}`
    : `Pagar ${installments}x de ${calcInstallment(planInfo.price, installments)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {/* Segurança */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
        <p className="text-xs text-green-300/80">
          Dados transmitidos com criptografia SSL. Nenhum número de cartão é armazenado.
        </p>
      </div>

      {/* Número */}
      <div className="space-y-1.5">
        <Label htmlFor="cardNumber" className={LABEL_CLS}>Número do cartão</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {brand ? <CardBrandIcon brand={brand} /> : <CreditCard className="w-5 h-5 text-white/30" />}
          </div>
          <Input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              setCardNumber(formatted);
              setBrand(detectCardBrand(formatted));
              if (errors.cardNumber) setErrors({ ...errors, cardNumber: "" });
            }}
            className={`pl-11 font-mono tracking-widest ${INPUT_CLS} ${errors.cardNumber ? "border-red-500/60" : ""}`}
            disabled={isLoading}
          />
        </div>
        {errors.cardNumber && <p className="text-xs text-red-400">{errors.cardNumber}</p>}
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="cardName" className={LABEL_CLS}>Nome impresso no cartão</Label>
        <Input
          id="cardName"
          type="text"
          placeholder="Como aparece no cartão"
          value={cardName}
          onChange={(e) => { setCardName(e.target.value.toUpperCase()); if (errors.cardName) setErrors({ ...errors, cardName: "" }); }}
          className={`uppercase tracking-wide ${INPUT_CLS} ${errors.cardName ? "border-red-500/60" : ""}`}
          disabled={isLoading}
        />
        {errors.cardName && <p className="text-xs text-red-400">{errors.cardName}</p>}
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expiry" className={LABEL_CLS}>Validade</Label>
          <Input
            id="expiry"
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => { setExpiry(formatExpiry(e.target.value)); if (errors.expiry) setErrors({ ...errors, expiry: "" }); }}
            className={`font-mono ${INPUT_CLS} ${errors.expiry ? "border-red-500/60" : ""}`}
            disabled={isLoading}
          />
          {errors.expiry && <p className="text-xs text-red-400">{errors.expiry}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cvv" className={LABEL_CLS}>CVV</Label>
          <Input
            id="cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            value={cvv}
            onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); if (errors.cvv) setErrors({ ...errors, cvv: "" }); }}
            className={`font-mono ${INPUT_CLS} ${errors.cvv ? "border-red-500/60" : ""}`}
            disabled={isLoading}
          />
          {errors.cvv && <p className="text-xs text-red-400">{errors.cvv}</p>}
        </div>
      </div>

      {/* CPF do titular */}
      <div className="space-y-1.5">
        <Label htmlFor="cpf" className={LABEL_CLS}>CPF do titular</Label>
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
            let masked = raw;
            if (raw.length > 3) masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
            if (raw.length > 6) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
            if (raw.length > 9) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
            setCpf(masked);
            if (errors.cpf) setErrors({ ...errors, cpf: "" });
          }}
          className={`font-mono ${INPUT_CLS} ${errors.cpf ? "border-red-500/60" : ""}`}
          disabled={isLoading}
        />
        {errors.cpf && <p className="text-xs text-red-400">{errors.cpf}</p>}
      </div>

      {/* Parcelamento — só exibe para planos anuais */}
      {installmentOptions.length > 1 && (
        <div className="space-y-1.5">
          <Label className={LABEL_CLS}>Parcelamento</Label>
          <div className="relative">
            <select
              value={installments}
              onChange={(e) => { const n = Number(e.target.value); setInstallments(n); onInstallmentsChange?.(n); }}
              disabled={isLoading}
              className="w-full h-11 appearance-none rounded-xl border border-white/10 bg-[#0B1F3A] px-3 pr-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1B4DBF]/40 focus:border-[#1B4DBF] disabled:opacity-50 transition-colors"
            >
              {installmentOptions.map((n) => (
                <option key={n} value={n} className="bg-[#0B1F3A]">{installmentLabel(n)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
          <p className="text-xs text-[#94A3B8]">
            {installments === 1
              ? `Total: ${toDisplay(planInfo.price)} (à vista)`
              : `Total: ${toDisplay(planInfo.price)} — ${installments}x de ${calcInstallment(planInfo.price, installments)} sem juros`}
          </p>
        </div>
      )}

      <button type="submit" className={CTA_BTN} disabled={isLoading || tokenizing}>
        {tokenizing ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Validando cartão...</>
        ) : isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Processando pagamento...</>
        ) : (
          <>{btnLabel}<ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
}

// ---------- PixForm ----------
function PixForm({
  intent,
  isCheckingStatus,
  intentFailed,
  onCheckStatus,
  onRefresh,
}: {
  intent: PaymentIntent | null;
  isCheckingStatus: boolean;
  intentFailed: boolean;
  onCheckStatus: () => void;
  onRefresh: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [seconds, setSeconds] = useState(intent?.pix?.expiresInSeconds ?? 15 * 60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const expired = seconds <= 0;
  const pixCode = intent?.pix?.qrCodeText ?? null;
  const qrBase64 = intent?.pix?.qrCodeBase64 ?? null;

  const handleCopy = () => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // PIX intent failed to load
  if (intentFailed) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-red-300">Falha ao gerar QR Code Pix</p>
            <p className="text-xs text-red-400/70 mt-1">Verifique sua conexão e tente novamente.</p>
          </div>
          <button type="button" className={CTA_BTN} onClick={onRefresh}>
            Tentar novamente <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`flex items-center justify-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5 ${expired ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#1B4DBF]/10 text-blue-300 border border-[#1B4DBF]/20"}`}>
        <Clock className="w-4 h-4 shrink-0" />
        {expired ? "QR Code expirado" : `QR Code válido por ${mm}:${ss}`}
      </div>

      <div className="flex flex-col items-center gap-3">
        {qrBase64 ? (
          <div className={`p-3 bg-white rounded-2xl ${expired ? "opacity-40" : ""}`}>
            <img
              src={`data:image/png;base64,${qrBase64}`}
              alt="QR Code Pix"
              className="w-40 h-40 object-contain"
            />
          </div>
        ) : (
          <div className="w-48 h-48 rounded-2xl border border-white/10 flex items-center justify-center bg-white/5">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        )}
        <p className="text-xs text-[#94A3B8] text-center">Abra o app do seu banco e escaneie o QR Code</p>
      </div>

      {expired ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm text-red-400 text-center">QR Code expirado. Gere um novo para continuar.</p>
          <button type="button" className={CTA_BTN} onClick={onRefresh}>
            Gerar novo QR Code <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">ou copie o código</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-2">
            <Label className={LABEL_CLS}>Pix Copia e Cola</Label>
            {!intent ? (
              <div className="flex items-center gap-2 h-11 text-white/40 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />Gerando código Pix...
              </div>
            ) : pixCode ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={pixCode}
                  className={`font-mono text-xs truncate ${INPUT_CLS}`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-[#0B1F3A] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
                >
                  {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 h-11 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />Falha ao gerar código. Tente novamente.
              </div>
            )}
            {copied && <p className="text-xs text-green-400 font-medium">Código copiado!</p>}
          </div>

          <button
            type="button"
            className={CTA_BTN}
            disabled={isCheckingStatus || !intent}
            onClick={onCheckStatus}
          >
            {isCheckingStatus ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Verificando pagamento...</>
            ) : (
              <>Já fiz o pagamento<ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-xs text-[#94A3B8] text-center">
            Pagamento via Pix confirmado em até 1 minuto após o envio.
          </p>
        </>
      )}
    </div>
  );
}

// ---------- Página principal ----------
const Pagamento = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshUser, activatePro } = useAuth();
  const plan = (location.state as { plan?: string })?.plan ?? new URLSearchParams(location.search).get("plan") ?? "pro";

  // Mapeia IDs de UI para IDs que a API reconhece
  const apiPlanId = plan === "pro-annual" || plan === "pro-monthly" ? "pro" : plan;

  const { planInfo: apiPlanInfo, isLoading: isPlanLoading } = usePlanInfo(plan);

  const planInfo: PlanDisplay = apiPlanInfo ?? {
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    price: "—",
    period: "/mês",
    description: "",
    features: [],
  };

  const isAnnualPlan = plan.includes("annual") || plan.includes("anual") || planInfo.period === "/ano";
  const installmentOptions = isAnnualPlan ? INSTALLMENTS_ANNUAL : INSTALLMENTS_MONTHLY;

  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [selectedInstallments, setSelectedInstallments] = useState(1);

  // Preços hardcoded — ignora valor retornado pela API (pode estar desatualizado)
  const effectivePrice = isAnnualPlan
    ? method === "pix" ? 99.9 : 154.8
    : 99.9;
  const effectivePeriod = isAnnualPlan ? "/ano" : "/mês";
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [pixIntentFailed, setPixIntentFailed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pixApproved, setPixApproved] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const createPixIntent = () => {
    setIntent(null);
    setPixApproved(false);
    setPixIntentFailed(false);
    setIsCreatingIntent(true);
    api
      .post<{ data: PaymentIntent }>(apiEndpoints.payments.intent, { plan: apiPlanId, method: "pix" })
      .then((res) => {
        const raw = (res as any).data ?? res as any;
        const normalized: PaymentIntent = {
          paymentId: raw.paymentId ?? raw.id ?? "",
          method: "pix",
          status: raw.status ?? "pending",
          amount: raw.amount ?? 0,
          currency: raw.currency ?? "BRL",
          expiresAt: raw.expiresAt ?? raw.expiration,
          pix: raw.pix ?? {
            qrCodeBase64: raw.qrCodeBase64 ?? raw.imageBase64 ?? raw.qrCode ?? raw.encodedImage ?? null,
            qrCodeText:   raw.qrCodeText   ?? raw.pixCode     ?? raw.payload  ?? raw.qrcode        ?? null,
            expiresInSeconds: raw.expiresInSeconds ?? raw.pix?.expiresInSeconds ??
              (raw.expiresAt ? Math.max(0, Math.floor((new Date(raw.expiresAt).getTime() - Date.now()) / 1000)) : 15 * 60),
          },
        };
        setIntent(normalized);
      })
      .catch(() => {
        setPixIntentFailed(true);
      })
      .finally(() => setIsCreatingIntent(false));
  };

  useEffect(() => {
    if (method !== "pix") return;
    createPixIntent();
  }, [method, plan]);

  // Auto-polling PIX a cada 5s enquanto pendente
  useEffect(() => {
    if (method !== "pix" || !intent || pixApproved) return;
    const APPROVED_STATUSES = ["approved", "paid", "confirmed", "completed", "active", "APPROVED", "PAID", "CONFIRMED"];
    const TERMINAL_STATUSES = ["expired", "cancelled", "declined", "failed", "EXPIRED", "CANCELLED", "DECLINED", "FAILED"];

    const handleApproved = async () => {
      setPixApproved(true);
      sessionStorage.removeItem("pendingPaymentPlan");
      sessionStorage.removeItem("postRegisterRedirect");
      sessionStorage.setItem("paymentCompleted", "true");
      activatePro();
      try {
        await refreshUser();
      } catch {
        // ignore refresh failure
      }
      navigate("/pagamento-sucesso", { state: { plan, method } });
    };

    let pollCount = 0;
    const timer = setInterval(async () => {
      pollCount++;
      try {
        // 1. Verifica status do pagamento
        const res = await api.get<{ data: { status: string } }>(apiEndpoints.payments.status(intent.paymentId));
        const raw = (res as any);
        const status = (raw.data?.status ?? raw.status ?? raw.data?.payment_status ?? raw.payment_status ?? "") as string;

        if (APPROVED_STATUSES.includes(status)) {
          clearInterval(timer);
          handleApproved();
          return;
        }
        if (TERMINAL_STATUSES.includes(status)) {
          clearInterval(timer);
          return;
        }

        // 2. Fallback: se status não reconhecido, verifica se plano já mudou para pro
        try {
          const meRes = await api.get<{ data: { plan?: string } }>("/v1/users/me");
          const meRaw = (meRes as any);
          const userPlan = meRaw.data?.plan ?? meRaw.plan ?? "";
          if (userPlan && userPlan !== "free") {
            clearInterval(timer);
            handleApproved();
          }
        } catch {
          // ignore fallback failure
        }
      } catch {
        // ignore polling error
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [method, intent, pixApproved, navigate, plan]);

  const handleCardSubmit = async (data: { paymentToken: string; holderName: string; installments: number; cpf: string }) => {
    setIsConfirming(true);
    setCardError(null);
    try {
      const intentRes = await api.post<{ data: PaymentIntent }>(apiEndpoints.payments.intent, { plan: apiPlanId, method: "cartao" });
      const paymentId = ((intentRes as any).data ?? intentRes as any).paymentId as string | undefined;

      if (!paymentId) {
        setCardError("Erro ao iniciar pagamento. Tente novamente.");
        return;
      }

      const confirmRes = await api.post(apiEndpoints.payments.confirm(paymentId), {
        paymentToken: data.paymentToken,
        holderName: data.holderName,
        cpf: data.cpf,
        installments: data.installments,
      });

      // Rejeita status não-aprovado mesmo que backend retorne 2xx
      const confirmData = (confirmRes as any)?.data ?? confirmRes as any;
      const confirmStatus = confirmData?.status as string | undefined;
      // Backend envia o motivo do erro no campo failureReason
      const failureReason = (confirmData?.failureReason ?? confirmData?.message ?? "") as string;
      if (confirmStatus && confirmStatus !== "approved" && confirmStatus !== "authorized") {
        const statusMsgMap: Record<string, string> = {
          declined:    "Cartão recusado pela operadora. Verifique os dados ou use outro cartão.",
          refused:     "Cartão recusado pela operadora. Verifique os dados ou use outro cartão.",
          pending:     "Pagamento em análise. Aguarde a confirmação por e-mail.",
          failed:      "Falha no processamento. Tente novamente ou use o Pix.",
          cancelled:   "Pagamento cancelado. Tente novamente.",
        };
        const friendlyMsg = statusMsgMap[confirmStatus] ?? `Pagamento não confirmado (status: ${confirmStatus}). Tente novamente.`;
        const detail = failureReason && failureReason !== friendlyMsg ? ` (${failureReason})` : "";
        const msg = friendlyMsg + detail;
        setCardError(msg);
        toast.error(msg, { duration: 8000 });
        return;
      }

      sessionStorage.removeItem("pendingPaymentPlan");
      sessionStorage.removeItem("postRegisterRedirect");
      sessionStorage.setItem("paymentCompleted", "true");
      activatePro();
      try { await refreshUser(); } catch { /* ignora */ }
      navigate("/pagamento-sucesso", { state: { plan, method } });
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number; code?: string; failureReason?: string; details?: Record<string, unknown> };
      let msg: string;
      let toastIcon: string | undefined;

      // Backend pode enviar failureReason no body (via details) ou diretamente no erro
      const rawMsg = e?.failureReason || (e?.details?.failureReason as string) || e?.message || "";
      const rawCode = e?.code ?? "";

      // Checar código explícito do backend
      if (rawCode === "CARD_DECLINED" || rawMsg.toLowerCase().includes("declin")) {
        msg = "Cartão recusado pela operadora. Verifique os dados ou use outro cartão."; toastIcon = "💳";
      } else if (rawCode === "INSUFFICIENT_FUNDS" || rawMsg.toLowerCase().includes("insufficient") || rawMsg.toLowerCase().includes("saldo")) {
        msg = "Saldo insuficiente. Use outro cartão ou pague via Pix."; toastIcon = "💸";
      } else if (rawCode === "INVALID_CARD" || rawMsg.toLowerCase().includes("invalid card") || rawMsg.toLowerCase().includes("cartão inválido")) {
        msg = "Dados do cartão inválidos. Verifique número, validade e CVV."; toastIcon = "❌";
      } else if (rawCode === "EXPIRED_CARD" || rawMsg.toLowerCase().includes("expired") || rawMsg.toLowerCase().includes("vencid")) {
        msg = "Cartão vencido. Use outro cartão."; toastIcon = "⏱️";
      } else if (rawCode === "ServiceUnavailableException" || e?.status === 503) {
        msg = "Serviço indisponível. Tente em alguns minutos ou use o Pix."; toastIcon = "⚠️";
      } else if (e?.status === 402) {
        msg = rawMsg || "Pagamento recusado pela operadora."; toastIcon = "💳";
      } else if (e?.status === 422) {
        msg = rawMsg || "Dados de pagamento inválidos. Verifique as informações."; toastIcon = "❌";
      } else if (e?.status === 404 || rawMsg.includes("user_not_found")) {
        msg = "Erro interno: usuário não encontrado. Contate o suporte."; toastIcon = "❌";
      } else {
        // Mostrar mensagem real do backend se houver, senão fallback
        msg = rawMsg || "Erro ao processar pagamento. Tente novamente."; toastIcon = "⚠️";
      }

      setCardError(msg);
      toast.error(`${toastIcon} ${msg}`, { duration: 8000 });
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePixStatusCheck = async () => {
    if (!intent) return;
    setIsCheckingStatus(true);
    const APPROVED_STATUSES = ["approved", "paid", "confirmed", "completed", "active", "APPROVED", "PAID", "CONFIRMED"];
    const TERMINAL_STATUSES = ["expired", "cancelled", "declined", "failed"];
    try {
      const res = await api.get<{ data: { status: string } }>(apiEndpoints.payments.status(intent.paymentId));
      const raw = res as any;
      const status = (raw.data?.status ?? raw.status ?? raw.data?.payment_status ?? raw.payment_status ?? "") as string;

      if (APPROVED_STATUSES.includes(status)) {
        setPixApproved(true);
        sessionStorage.removeItem("pendingPaymentPlan");
        sessionStorage.removeItem("postRegisterRedirect");
        sessionStorage.setItem("paymentCompleted", "true");
        activatePro();
        try { await refreshUser(); } catch { /* ignora */ }
        navigate("/pagamento-sucesso", { state: { plan, method } });
        return;
      }

      if (TERMINAL_STATUSES.includes(status.toLowerCase())) {
        if (status.toLowerCase() === "expired") toast.error("QR Code expirado. Volte e tente novamente.");
        else if (status.toLowerCase() === "declined") toast.error("Pagamento recusado. Tente com outro método.");
        else if (status.toLowerCase() === "cancelled") toast.error("Pagamento cancelado.");
        else toast.error("Pagamento não processado. Tente novamente.");
        return;
      }

      // Fallback: status desconhecido — verifica se plano já foi atualizado no backend
      try {
        const meRes = await api.get<{ data: { plan?: string } }>("/v1/users/me");
        const meRaw = (meRes as any);
        const userPlan = meRaw.data?.plan ?? meRaw.plan ?? "";
        if (userPlan && userPlan !== "free") {
          setPixApproved(true);
          sessionStorage.removeItem("pendingPaymentPlan");
          sessionStorage.removeItem("postRegisterRedirect");
          sessionStorage.setItem("paymentCompleted", "true");
          activatePro();
          navigate("/pagamento-sucesso", { state: { plan, method } });
          return;
        }
      } catch { /* ignora */ }

      toast.info("Pagamento ainda não identificado. Aguarde e tente novamente.");
    } catch {
      toast.error("Erro ao verificar pagamento. Tente novamente.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const METHOD_BTN = (active: boolean) =>
    `flex items-center justify-center gap-2 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all duration-200 ${
      active
        ? "border-[#1B4DBF] bg-[#1B4DBF]/10 text-blue-300 shadow-[0_0_16px_rgba(27,77,191,0.2)]"
        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 py-6 sm:py-10" style={{ background: BG }}>
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => {
                const pendingPlan = sessionStorage.getItem("pendingPaymentPlan");
                const fromFreshRegister = !!sessionStorage.getItem("postRegisterRedirect");
                sessionStorage.removeItem("pendingPaymentPlan");
                sessionStorage.removeItem("postRegisterRedirect");
                if (pendingPlan && fromFreshRegister) {
                  // Veio do fluxo de cadastro novo — faz logout e vai para login
                  logout();
                  navigate("/login", { replace: true });
                } else if (pendingPlan) {
                  // Veio do login como free — vai para login
                  navigate("/login", { replace: true });
                } else {
                  navigate("/");
                }
              }}
              className="flex items-center gap-1.5 text-[#94A3B8] hover:text-white text-sm transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img src={logoWeb} alt="doutorcash" className="h-8 sm:h-10 w-auto transition-transform group-hover:scale-105" />
            </Link>
            <div className="w-8 sm:w-16 shrink-0" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Finalizar assinatura</h1>
          <div className="flex items-center justify-center gap-1.5 text-[#94A3B8] text-sm">
            <Lock className="w-3.5 h-3.5" />
            Seus dados estão protegidos com criptografia SSL
          </div>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                  s < 3
                    ? "bg-[#1B4DBF] text-white shadow-[0_0_12px_rgba(27,77,191,0.5)]"
                    : "bg-white text-[#1B4DBF]"
                }`}>
                  {s < 3 ? <Check className="w-4 h-4" /> : "3"}
                </div>
                {s < 3 && <div className="w-16 h-0.5 rounded-full bg-[#1B4DBF]/60" />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 sm:gap-10 mt-2 text-xs text-[#94A3B8]">
            <span className="text-center">Dados</span>
            <span className="text-center">Plano</span>
            <span className="text-center">Pagamento</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-5 gap-5">

          {/* Resumo */}
          <div className="md:col-span-2">
            <div className={`${CARD} sticky top-6`}>
              <h2 className="font-bold text-white mb-4 text-base">Resumo do pedido</h2>
              {isPlanLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                </div>
              ) : (
                <div className="bg-[#1B4DBF]/10 border border-[#1B4DBF]/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">Plano {planInfo.name}</span>
                    <span className="px-2 py-0.5 bg-[#1B4DBF] text-white text-xs font-medium rounded-full">
                      Selecionado
                    </span>
                  </div>
                  {isAnnualPlan && method === "cartao" ? (
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-3xl font-bold text-green-400">12x de R$12,90</span>
                      </div>
                      <p className="text-xs text-green-400/70 font-medium mt-0.5">sem juros no cartão</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Total: R$154,80</p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl sm:text-3xl font-bold text-green-400">{toDisplay(effectivePrice)}</span>
                      {!(isAnnualPlan && method === "pix") && (
                        <span className="text-sm text-[#94A3B8]">{effectivePeriod}</span>
                      )}
                    </div>
                  )}
                  {isAnnualPlan && method === "pix" && (
                    <p className="text-xs text-[#E5E7EB]/80 mb-1">À vista no PIX</p>
                  )}
                  <p className="text-xs text-[#94A3B8] mb-3">{planInfo.description}</p>
                  <ul className="space-y-1.5">
                    {planInfo.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border-t border-white/[0.07] pt-4 space-y-2">
                {method === "cartao" && selectedInstallments > 1 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Parcelas</span>
                      <span className="text-white">{selectedInstallments}x de {calcInstallment(effectivePrice, selectedInstallments)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-white">Total hoje</span>
                      <span className="text-green-400 text-base">{toDisplay(effectivePrice)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Subtotal</span>
                      <span className="text-white">{toDisplay(effectivePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-white">Total hoje</span>
                      <span className="text-green-400 text-base">{toDisplay(effectivePrice)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-xs text-green-400/80">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Cancele a qualquer momento. Sem fidelidade.
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="md:col-span-3">
            <div className={CARD}>
              <h2 className="font-bold text-white mb-5 text-base">Forma de pagamento</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => { setMethod("pix"); setSelectedInstallments(1); setCardError(null); }} className={METHOD_BTN(method === "pix")}>
                  <svg className="w-4 h-4" viewBox="-10 -50 540 562" fill="currentColor">
                    <path d="M242.4 292.5C247.8 287.1 254.4 284.1 260 284.1C265.7 284.1 272.3 287.1 277.7 292.5L416 430.8C436.8 451.5 469.2 451.5 490 430.8C510.8 410.1 510.8 377.7 490 356.9L351.6 218.5C346.2 213.1 343.2 206.5 343.2 200.9C343.2 195.3 346.2 188.7 351.6 183.2L490 44.9C510.8 24.1 510.8-8.3 490-29.1C469.2-49.9 436.8-49.9 416-29.1L277.7 109.2C272.3 114.6 265.7 117.6 260 117.6C254.4 117.6 247.8 114.6 242.4 109.2L104 -29.1C83.2-49.9 50.8-49.9 30-29.1C9.2-8.3 9.2 24.1 30 44.9L168.4 183.2C173.8 188.6 176.8 195.2 176.8 200.9C176.8 206.5 173.8 213.1 168.4 218.5L30 356.9C9.2 377.7 9.2 410.1 30 430.8C50.8 451.5 83.2 451.5 104 430.8L242.4 292.5z" />
                  </svg>
                  Pix
                </button>
                <button type="button" onClick={() => setMethod("cartao")} className={METHOD_BTN(method === "cartao")}>
                  <CreditCard className="w-4 h-4" />
                  Cartão de Crédito
                </button>
              </div>

              {method === "cartao" ? (
                <>
                  <CardForm isLoading={isConfirming} onSubmit={handleCardSubmit} planInfo={{ ...planInfo, price: effectivePrice }} installmentOptions={installmentOptions} holderDocument={user?.cpf} onInstallmentsChange={setSelectedInstallments} />
                  {cardError && (
                    <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-300">Pagamento não processado</p>
                        <p className="text-xs text-red-400/80 mt-0.5">{cardError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCardError(null)}
                        className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
                        aria-label="Fechar"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <PixForm
                  intent={isCreatingIntent ? null : intent}
                  isCheckingStatus={isCheckingStatus}
                  intentFailed={pixIntentFailed}
                  onCheckStatus={handlePixStatusCheck}
                  onRefresh={createPixIntent}
                />
              )}
            </div>

            <p className="text-center text-xs text-[#94A3B8]/60 mt-4">
              Ao confirmar, você concorda com nossos{" "}
              <a href="#" className="text-[#94A3B8] hover:text-white underline transition-colors">Termos de Uso</a>{" "}
              e autoriza a cobrança recorrente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagamento;
