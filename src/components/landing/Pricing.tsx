import { memo } from "react";
import { Link } from "react-router-dom";
import { Check, MessageCircle, Shield, Crown, BadgePercent, TrendingUp, BadgeCheck, QrCode } from "lucide-react";
import { analytics } from "@/lib/analytics";

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

const Pricing = memo(() => {
  return (
    <section id="planos" className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simples assim. Um plano, tudo incluído.
          </h2>
          <p className="text-lg text-white/60">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>

        {/* Card */}
        <div className="max-w-sm sm:max-w-md mx-auto">
          <div
            className="relative rounded-3xl shadow-2xl p-8"
            style={{
              background: BRAND.dark,
              border: `1px solid ${BRAND.primary}50`,
              boxShadow: `0 25px 60px ${BRAND.dark}80`,
            }}
          >
            <>
                {/* Badges — Anual */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2"
                    style={{ borderColor: `${BRAND.primary}60`, background: `${BRAND.primary}20` }}
                  >
                    <Crown className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Plano Anual</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2"
                    style={{ borderColor: `${BRAND.primary}80`, background: `${BRAND.primary}30` }}
                  >
                    <BadgePercent className="w-3.5 h-3.5" style={{ color: BRAND.light }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.light }}>49% OFF</span>
                  </div>
                </div>

                {/* Título */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <p className="text-center text-[15px] font-bold text-white">
                    Acesso completo ao{" "}
                    <span style={{ color: BRAND.light }}>Doutor Cash</span>
                  </p>
                  <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: BRAND.light }} />
                </div>

                {/* Preço tachado */}
                <p className="text-center text-sm text-white/40 line-through mb-1">
                  De R$197,00 por
                </p>

                {/* Preço PIX principal */}
                <div className="flex items-baseline justify-center gap-0.5 mb-4">
                  <span className="text-3xl font-bold text-white">R$</span>
                  <span className="text-8xl font-black text-white leading-none tracking-tighter">99</span>
                  <span className="text-4xl font-black text-white">,90</span>
                </div>

                {/* PIX pill */}
                <div className="flex justify-center mb-4">
                  <div
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full"
                    style={{
                      background: BRAND.primary,
                      boxShadow: `0 0 20px ${BRAND.primary}60`,
                    }}
                  >
                    <QrCode className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">à vista no PIX</span>
                  </div>
                </div>

                {/* Divider OU */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-xs font-semibold text-white/40 uppercase">ou</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>

                {/* Cartão parcelado — destaque */}
                <div
                  className="rounded-2xl p-3 mb-3 text-center"
                  style={{ background: `${BRAND.primary}20`, border: `1px solid ${BRAND.primary}50` }}
                >
                  <p className="text-2xl font-black text-white">
                    12x de <span style={{ color: BRAND.light }}>R$ 12,90</span>
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">Valor total: R$ 154,80 no cartão</p>
                </div>

                {/* Economia badge */}
                <div className="flex justify-center mb-6">
                  <div
                    className="flex items-center gap-2 px-5 py-1.5 rounded-full border-2"
                    style={{ borderColor: `${BRAND.primary}50`, background: `${BRAND.primary}15` }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-sm font-semibold text-white/80">Economia de 49%</span>
                  </div>
                </div>
            </>

            {/* CTA */}
            <Link
              to="/cadastro"
              state={{ billing: "annual" }}
              onClick={() => analytics.click("pricing_pro_annual", "pricing")}
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

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
              {TRUST.map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-white/40">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Pricing.displayName = "Pricing";
export default Pricing;
