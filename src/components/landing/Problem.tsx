import { memo, useState, useEffect } from "react";
import { Table2, Brain, CreditCard, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n-provider";

// ── Animated WhatsApp Chat ──────────────────────────────────────────────────
const CHAT_MESSAGES = [
  { id: 1, from: "user", text: "Gastei R$ 89,90 no supermercado 🛒", time: "09:14" },
  { id: 2, from: "bot",  text: "✅ Registrado!\nSupermercado — R$ 89,90\nCategoria: Alimentação", time: "09:14" },
  { id: 3, from: "user", text: "Qual meu saldo esse mês?", time: "09:15" },
  { id: 4, from: "bot",  text: "💰 Saldo atual: R$ 1.840,00\n📉 Gastos: R$ 1.260,00\n🎯 Meta: R$ 3.000,00", time: "09:15" },
  { id: 5, from: "user", text: "Recebi meu salário R$ 4.500,00 🎉", time: "09:16" },
  { id: 6, from: "bot",  text: "🎉 Receita registrada!\nR$ 4.500,00 — Salário\nNovo saldo: R$ 6.340,00 💚", time: "09:16" },
];

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatAnimation() {
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    async function run() {
      while (!cancelled) {
        setVisible([]); setTyping(false);
        await wait(500);
        for (const msg of CHAT_MESSAGES) {
          if (cancelled) return;
          if (msg.from === "bot") { setTyping(true); await wait(900); if (cancelled) return; setTyping(false); }
          setVisible(p => [...p, msg.id]);
          await wait(1500);
        }
        await wait(3000);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-2.5 justify-end min-h-full">
      {CHAT_MESSAGES.filter(m => visible.includes(m.id)).map(msg => (
        <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
          <div className={`px-3 py-2 rounded-2xl shadow-sm max-w-[80%] text-[13px] leading-snug text-gray-800
            ${msg.from === "user" ? "bg-[#DCF8C6] rounded-tr-none" : "bg-white rounded-tl-none"}`}>
            <p className="whitespace-pre-line">{msg.text}</p>
            <span className="text-[10px] text-gray-400 block text-right mt-0.5">
              {msg.time}{msg.from === "user" ? " ✓✓" : ""}
            </span>
          </div>
        </div>
      ))}
      {typing && <TypingDots />}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[240px] sm:w-[270px] md:w-[290px] lg:w-[300px]">
      {/* Glow */}
      <div className="absolute -inset-4 bg-[#25D366]/20 rounded-[3rem] blur-2xl" />
      {/* Phone frame */}
      <div className="relative z-10 bg-[#111827] rounded-[2.5rem] p-2 shadow-2xl ring-1 ring-white/10">
        <div className="rounded-[2rem] overflow-hidden bg-[#ECE5DD]" style={{ height: 520 }}>
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logoweb.png" alt="DoutorCash" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">DoutorCash IA</p>
              <p className="text-white/70 text-xs mt-0.5">online agora</p>
            </div>
          </div>
          {/* Messages */}
          <div className="flex flex-col justify-end p-3 overflow-hidden" style={{ height: 432 }}>
            <ChatAnimation />
          </div>
        </div>
      </div>
      {/* Floating badge */}
      <div className="absolute -bottom-3 -right-3 bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Ao vivo
      </div>
    </div>
  );
}

const Problem = memo(() => {
  const { t, locale } = useI18n();

  const PROBLEMS = locale === "pt" ? [
    {
      icon: Table2,
      title: "Cansaço de planilhas",
      quote: '"Não aguento mais abrir o Excel"',
      description: "Você quer apenas saber quanto pode gastar, não virar contador.",
    },
    {
      icon: Brain,
      title: "Falta de constância",
      quote: '"Sempre esqueço de anotar os gastos"',
      description: "Até tenta, mas no fim do mês não lembra de metade das compras.",
    },
    {
      icon: CreditCard,
      title: "Medo da fatura",
      quote: '"Fatura do cartão sempre uma surpresa"',
      description: "Chega a fatura e você pensa: gastei tudo isso?",
    },
    {
      icon: HelpCircle,
      title: "Viver no escuro",
      quote: '"Nunca sei se vai sobrar dinheiro"',
      description: "Vive sem saber pra onde seu dinheiro está indo.",
    },
  ] : locale === "en" ? [
    {
      icon: Table2,
      title: "Spreadsheet fatigue",
      quote: '"I can\'t stand opening Excel anymore"',
      description: "You just want to know how much you can spend, not become an accountant.",
    },
    {
      icon: Brain,
      title: "Lack of consistency",
      quote: '"I always forget to log expenses"',
      description: "You try, but by month's end you don't remember half your purchases.",
    },
    {
      icon: CreditCard,
      title: "Credit card fear",
      quote: '"Credit card bill is always a surprise"',
      description: "The bill arrives and you think: did I spend all that?",
    },
    {
      icon: HelpCircle,
      title: "Living in the dark",
      quote: '"I never know if money will be left"',
      description: "You live without knowing where your money is going.",
    },
  ] : [
    {
      icon: Table2,
      title: "Fatiga de hojas de cálculo",
      quote: '"No puedo más con Excel"',
      description: "Solo quieres saber cuánto puedes gastar, no volverte contador.",
    },
    {
      icon: Brain,
      title: "Falta de constancia",
      quote: '"Siempre olvido registrar gastos"',
      description: "Intentas, pero a fin de mes no recuerdas la mitad de las compras.",
    },
    {
      icon: CreditCard,
      title: "Miedo a la factura",
      quote: '"La factura de tarjeta siempre es sorpresa"',
      description: "Llega la factura y piensas: ¿gasté todo eso?",
    },
    {
      icon: HelpCircle,
      title: "Vivir a oscuras",
      quote: '"Nunca sé si sobrará dinero"',
      description: "Vives sin saber a dónde va tu dinero.",
    },
  ] as const;

  const ProblemCard = memo(({ problem }: { problem: typeof PROBLEMS[number] }) => {
    return (
      <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:bg-white/15 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-4 md:gap-5">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
            <problem.icon className="w-6 h-6 md:w-7 md:h-7 text-[#E5E7EB]" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-[#E5E7EB] transition-colors">
              {problem.title}
            </h3>
            <p className="text-base italic text-white/80 mb-2">
              {problem.quote}
            </p>
            <p className="text-sm md:text-base text-white/60 leading-relaxed">
              {problem.description}
            </p>
          </div>
        </div>
      </div>
    );
  });

  ProblemCard.displayName = "ProblemCard";

  return (
    <section className="py-16 md:py-24 bg-transparent">
      {/* Nova faixa intermediária - Sua vida organizada sem esforço */}
      <div className="mb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-3xl p-8 sm:p-12 lg:p-16 border border-white/10 shadow-2xl shadow-black/30">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                WhatsApp integrado
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
                {t("landing", "organizedLifeTitle")}
              </h2>
              <p className="text-lg md:text-xl font-semibold text-white/85">
                {t("landing", "organizedLifeClosing")}
              </p>
              <div className="mt-8 flex flex-col gap-3 lg:items-start items-center">
                {["Registre gastos por texto ou áudio", "Consulte saldo e metas na hora", "Receba relatórios automáticos todo mês"].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-5 h-5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] text-xs font-bold shrink-0">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Phone */}
            <div className="shrink-0 mt-4 lg:mt-0">
              <PhoneMockup />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[#E5E7EB] text-sm font-semibold mb-5 uppercase tracking-widest">
            {t("landing", "problemSubtitle")}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 md:mb-6 tracking-tight">
            {t("landing", "problemTitle")}
          </h2>
          <p className="text-base md:text-lg text-white/50">
            {t("landing", "problemDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {PROBLEMS.map((problem, index) => (
            <ProblemCard key={index} problem={problem} />
          ))}
        </div>
      </div>
    </section>
  );
});

Problem.displayName = "Problem";

export default Problem;
