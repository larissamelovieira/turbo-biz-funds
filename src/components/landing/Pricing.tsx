import { memo } from "react";
import { Link } from "react-router-dom";
import { Check, MessageCircle, Shield, Crown, BadgeCheck, QrCode, Loader2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { usePublicPlans, type PublicPlan } from "@/features/plans/hooks/use-public-plans";

// Brand colors: #1B4DBF (primary blue), #0B1F3A (dark navy), #E5E7EB (light gray)
const BRAND = {
  primary: "#1B4DBF",
  dark: "#0B1F3A",
  light: "#E5E7EB",
};

const TRUST = [
  { icon: Shield, label: "Compra segura" },
  { icon: Check, label: "7 dias de garantia" },
  { icon: MessageCircle, label: "Suporte humano" },
] as const;

function formatPrice(value: number): { intPart: string; decPart: string } {
  const [intPart, decPart = "00"] = value.toFixed(2).split(".");
  return { intPart, decPart };
}

function periodLabel(billingPeriod: string): string {
  if (billingPeriod === "ano") return "/ano";
  if (billingPeriod === "semestre") return "/semestre";
  return "/mês";
}

const CARD_INSTALLMENTS = 12;

const PLAN_LABEL_MAP: Record<string, { name: string; description?: string }> = {
  "Para pequenas empresas": { name: "Acesso total ao Doutor Cash", description: undefined },
};

function PlanCard({ plan }: { plan: PublicPlan }) {
  const label = PLAN_LABEL_MAP[plan.name] ?? PLAN_LABEL_MAP[plan.description] ?? {};
  const displayName = label.name ?? plan.name;
  const displayDescription = "description" in label ? label.description : plan.description;
  const hasCardOption = plan.priceCard > plan.pricePix;
  const { intPart, decPart } = formatPrice(
    hasCardOption ? plan.priceCard / CARD_INSTALLMENTS : plan.pricePix
  );

  return (
    <div
      className="relative rounded-3xl shadow-2xl p-8"
      style={{
        background: BRAND.dark,
        border: plan.popular ? `1px solid ${BRAND.primary}80` : `1px solid ${BRAND.primary}30`,
        boxShadow: `0 25px 60px ${BRAND.dark}80`,
      }}
    >
      {plan.popular && (
        <div className="flex items-center justify-center mb-6">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2"
            style={{ borderColor: `${BRAND.primary}60`, background: `${BRAND.primary}20` }}
          >
            <Crown className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">Mais popular</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-1">
        <p className="text-center text-lg font-bold text-white">{displayName}</p>
        <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: BRAND.light }} />
      </div>
      {displayDescription && (
        <p className="text-center text-sm text-white/50 mb-4">{displayDescription}</p>
      )}

      {/* Preço principal — parcelado no cartão sem juros */}
      <div className="flex items-baseline justify-center gap-0.5">
        {hasCardOption && <span className="text-2xl font-bold text-white/70 mr-1">{CARD_INSTALLMENTS}x</span>}
        <span className="text-3xl font-bold text-white">R$</span>
        <span className="text-6xl font-black text-white leading-none tracking-tighter">{intPart}</span>
        <span className="text-3xl font-black text-white">,{decPart}</span>
        {!hasCardOption && <span className="text-sm text-white/40 ml-1">{periodLabel(plan.billingPeriod)}</span>}
      </div>
      {hasCardOption && (
        <>
          <p className="text-center text-sm text-white/50 mb-4">
            sem juros no cartão · Valor total: R$ {plan.priceCard.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-center text-sm text-white/60 mb-4">
            Acesso por 12 meses (1 ano)
          </p>
        </>
      )}
      {!hasCardOption && <div className="mb-4" />}
      {hasCardOption && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-xs font-semibold text-white/40 uppercase">ou</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>
      )}
      <div className="flex justify-center mb-6">
        <div
          className="flex items-center gap-2 px-6 py-2.5 rounded-full"
          style={{ background: BRAND.primary, boxShadow: `0 0 20px ${BRAND.primary}60` }}
        >
          <QrCode className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">
            {hasCardOption ? `R$ ${plan.pricePix.toFixed(2).replace(".", ",")} à vista no PIX` : "à vista no PIX"}
          </span>
        </div>
      </div>

      {plan.features.length > 0 && (
        <div className="space-y-2.5 mb-6">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check className="h-4 w-4 text-success shrink-0" style={{ color: BRAND.light }} />
              <span className="text-sm text-white/80">{feature}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/cadastro"
        state={{ plan: plan.id }}
        onClick={() => analytics.click(`pricing_${plan.id}`, "pricing")}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${BRAND.primary}, #0f3a9e)`,
          boxShadow: `0 0 28px ${BRAND.primary}60`,
          border: `1px solid ${BRAND.primary}60`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${BRAND.primary}90`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${BRAND.primary}60`;
        }}
      >
        Começar agora →
      </Link>
    </div>
  );
}

const FALLBACK_PLAN: PublicPlan = {
  id: "pro",
  name: "Plano Pro",
  description: "Acesso completo ao Doutor Cash",
  pricePix: 99.9,
  priceCard: 118.8,
  billingPeriod: "ano",
  features: [],
  popular: true,
};

const Pricing = memo(() => {
  const { data: plans, isLoading, isError } = usePublicPlans();
  const list = plans && plans.length > 0 ? plans : isError ? [FALLBACK_PLAN] : [];

  return (
    <section id="planos" className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simples assim. Escolha seu plano.
          </h2>
          <p className="text-lg text-white/60">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6">
            {list.map((plan) => (
              <div key={plan.id} className="w-full sm:w-[380px]">
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        )}

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          {TRUST.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-white/40">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

Pricing.displayName = "Pricing";
export default Pricing;
