import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Tag, Target, RefreshCw,
  CreditCard, MessageCircle, Settings, ChevronRight, ChevronLeft,
  X, CheckCircle, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const storageKey = (userId?: string) =>
  userId ? `user:tutorial:completed:${userId}` : "user:tutorial:completed";

interface TutorialStep {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  accentColor: string;
  bgGradient: string;
  visual: React.ReactNode;
  route: string;
}

/* ── Visuals ──────────────────────────────────────────────── */

function DashboardVisual() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="grid grid-cols-2 gap-2">
        {["R$ 3.200", "R$ 1.800", "R$ 1.400", "+12%"].map((v, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="w-8 h-1.5 bg-white/30 rounded mb-2" />
            <div className="text-white font-bold text-base">{v}</div>
            <div className="w-12 h-1 bg-white/20 rounded mt-1.5" />
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl p-3 flex-1 backdrop-blur-sm">
        <div className="w-24 h-1.5 bg-white/30 rounded mb-3" />
        <div className="flex items-end gap-1 h-16">
          {[30, 55, 40, 70, 50, 85].map((h, i) => (
            <div key={i} className="flex-1 bg-white/30 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransacoesVisual() {
  const rows = [
    { label: "Supermercado", val: "- R$ 320", color: "bg-red-400/60" },
    { label: "Salário", val: "+ R$ 3.200", color: "bg-green-400/60" },
    { label: "Aluguel", val: "- R$ 900", color: "bg-red-400/60" },
    { label: "Freelance", val: "+ R$ 500", color: "bg-green-400/60" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-1.5 p-1">
      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm flex items-center gap-2">
        <div className="w-32 h-6 bg-white/20 rounded-lg" />
        <div className="ml-auto w-16 h-6 bg-white/20 rounded-lg" />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm flex items-center gap-3">
          <div className={cn("w-2 h-2 rounded-full shrink-0", row.color)} />
          <div className="text-white text-xs flex-1 truncate">{row.label}</div>
          <div className="text-white text-xs font-bold">{row.val}</div>
        </div>
      ))}
    </div>
  );
}

function CategoriasVisual() {
  const cats = [
    { label: "Alimentação", pct: 35, color: "bg-orange-400/70" },
    { label: "Moradia", pct: 28, color: "bg-blue-400/70" },
    { label: "Lazer", pct: 15, color: "bg-violet-400/70" },
    { label: "Outros", pct: 22, color: "bg-gray-400/70" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
        <div className="w-20 h-1.5 bg-white/30 rounded mb-3" />
        <div className="flex gap-1 h-20 items-end">
          {cats.map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn("w-full rounded-t", c.color)} style={{ height: `${c.pct * 2}px` }} />
              <div className="w-8 h-1 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
      {cats.slice(0, 2).map((c, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-sm shrink-0", c.color)} />
          <div className="text-white text-xs flex-1">{c.label}</div>
          <div className="text-white/60 text-xs">{c.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function MetasVisual() {
  const metas = [
    { label: "Viagem Europa", pct: 68 },
    { label: "Reserva Emergência", pct: 45 },
    { label: "Novo Notebook", pct: 90 },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      {metas.map((m, i) => (
        <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white text-xs font-medium">{m.label}</div>
            <div className="text-white/60 text-xs">{m.pct}%</div>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: `${m.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecorrenciasVisual() {
  const items = [
    { label: "Netflix", val: "R$ 39/mês", color: "bg-red-400/60" },
    { label: "Academia", val: "R$ 80/mês", color: "bg-red-400/60" },
    { label: "Salário", val: "R$ 3.200/mês", color: "bg-green-400/60" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm grid grid-cols-2 gap-2">
        <div>
          <div className="text-white/60 text-[10px] mb-1">Entradas fixas</div>
          <div className="text-white font-bold text-sm">R$ 3.200</div>
        </div>
        <div>
          <div className="text-white/60 text-[10px] mb-1">Saídas fixas</div>
          <div className="text-white font-bold text-sm">R$ 119</div>
        </div>
      </div>
      {items.map((it, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm flex items-center gap-3">
          <div className={cn("w-2 h-2 rounded-full shrink-0", it.color)} />
          <div className="text-white text-xs flex-1">{it.label}</div>
          <div className="text-white/70 text-xs">{it.val}</div>
        </div>
      ))}
    </div>
  );
}

function CartoesVisual() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="bg-gradient-to-br from-white/20 to-white/10 rounded-xl p-4 backdrop-blur-sm">
        <div className="w-8 h-5 bg-white/40 rounded-sm mb-3" />
        <div className="text-white font-mono text-sm tracking-widest">•••• 4321</div>
        <div className="flex justify-between mt-2">
          <div className="text-white/60 text-[10px]">Limite usado</div>
          <div className="text-white text-xs font-bold">R$ 1.200 / R$ 5.000</div>
        </div>
        <div className="w-full h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-white/60 rounded-full" style={{ width: "24%" }} />
        </div>
      </div>
      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex-1">
        <div className="w-20 h-1.5 bg-white/30 rounded mb-2" />
        {[60, 40, 75].map((w, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
            <div className="h-1.5 bg-white/30 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatsAppVisual() {
  const msgs = [
    { from: "bot", text: "Olá! Registrei R$ 50 no mercado 🛒" },
    { from: "user", text: "Obrigado!" },
    { from: "bot", text: "Saldo disponível: R$ 1.400 ✅" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-400/60 flex items-center justify-center">
          <MessageCircle className="w-3 h-3 text-white" />
        </div>
        <div className="text-white text-xs font-medium">DoutorCash Bot</div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
      </div>
      {msgs.map((m, i) => (
        <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
          <div className={cn(
            "max-w-[80%] rounded-xl px-3 py-1.5 text-white text-xs",
            m.from === "bot" ? "bg-white/15 backdrop-blur-sm" : "bg-green-400/30 backdrop-blur-sm"
          )}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigVisual() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/30" />
        <div>
          <div className="text-white text-xs font-medium">Seu Nome</div>
          <div className="w-20 h-1 bg-white/20 rounded mt-1" />
        </div>
      </div>
      {["Alterar senha", "Plano atual: Free", "Tema", "Notificações"].map((item, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
          <div className="text-white text-xs flex-1">{item}</div>
          <ChevronRight className="w-3 h-3 text-white/40" />
        </div>
      ))}
    </div>
  );
}

/* ── Steps ────────────────────────────────────────────────── */

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    label: "Início",
    title: "Bem-vindo ao DoutorCash!",
    subtitle: "Controle financeiro inteligente",
    description: "Este tour rápido vai mostrar tudo que você pode fazer aqui. Navegue pelos passos ou pule a qualquer momento.",
    features: [
      "Visão completa das suas finanças",
      "Metas, categorias e recorrências",
      "Integração com WhatsApp",
    ],
    accentColor: "#1a3799",
    bgGradient: "from-[#06091c] via-[#08086e] to-[#1a3799]",
    visual: <DashboardVisual />,
    route: "/dashboard",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    title: "Visão geral das finanças",
    subtitle: "Saldo · Receitas · Despesas · Gráfico",
    description: "O Dashboard centraliza todas as suas informações financeiras em um único lugar. Acompanhe seu saldo atual, receitas, despesas, gráficos de desempenho e identifique para onde seu dinheiro está indo, facilitando decisões financeiras mais inteligentes.",
    features: [
      "Cards de saldo, receitas e despesas",
      "Gráfico mensal interativo",
      "Últimas transações em destaque",
    ],
    accentColor: "#1a3799",
    bgGradient: "from-[#06091c] via-[#08086e] to-[#1a3799]",
    visual: <DashboardVisual />,
    route: "/dashboard",
  },
  {
    id: "transacoes",
    icon: ArrowLeftRight,
    label: "Transações",
    title: "Registre suas movimentações",
    subtitle: "Entradas · Saídas · Filtros · Busca",
    description: "Adicione receitas e despesas manualmente. Use os filtros por data, categoria ou tipo para encontrar qualquer transação rapidamente.",
    features: [
      "Adicionar entrada ou saída",
      "Filtrar por mês, categoria e tipo",
      "Busca por descrição",
    ],
    accentColor: "#16a34a",
    bgGradient: "from-[#052e16] via-[#14532d] to-[#16a34a]",
    visual: <TransacoesVisual />,
    route: "/dashboard/transacoes",
  },
  {
    id: "categorias",
    icon: Tag,
    label: "Categorias",
    title: "Organize seus gastos",
    subtitle: "Criar · Editar · Colorir · Analisar",
    description: "Crie categorias personalizadas (Alimentação, Moradia, Lazer…) e associe-as às suas transações para ver exatamente para onde vai cada real.",
    features: [
      "Categorias com ícone e cor",
      "Gráfico de distribuição por categoria",
      "Limite de gasto por categoria",
    ],
    accentColor: "#7c3aed",
    bgGradient: "from-[#2e1065] via-[#4c1d95] to-[#7c3aed]",
    visual: <CategoriasVisual />,
    route: "/dashboard/transacoes",
  },
  {
    id: "metas",
    icon: Target,
    label: "Metas",
    title: "Alcance seus objetivos",
    subtitle: "Criar meta · Aporte · Progresso",
    description: "Defina metas financeiras (viagem, reserva de emergência, compra) e acompanhe o progresso em tempo real com barra de evolução.",
    features: [
      "Criar meta com valor alvo",
      "Registrar aportes parciais",
      "Barra de progresso visual",
    ],
    accentColor: "#d97706",
    bgGradient: "from-[#451a03] via-[#78350f] to-[#d97706]",
    visual: <MetasVisual />,
    route: "/dashboard/metas",
  },
  {
    id: "recorrencias",
    icon: RefreshCw,
    label: "Recorrências",
    title: "Gastos e receitas fixos",
    subtitle: "Mensal · Semanal · Anual",
    description: "Cadastre contas fixas (aluguel, assinaturas, salário) e o sistema lança automaticamente na data correta sem você precisar lembrar.",
    features: [
      "Lançamento automático na data",
      "Filtro por tipo e frequência",
      "Resumo de saídas fixas mensais",
    ],
    accentColor: "#0891b2",
    bgGradient: "from-[#0c4a6e] via-[#0369a1] to-[#0891b2]",
    visual: <RecorrenciasVisual />,
    route: "/dashboard/recorrencias",
  },
  {
    id: "cartoes",
    icon: CreditCard,
    label: "Cartões",
    title: "Controle seus cartões",
    subtitle: "Limite · Fatura · Gastos",
    description: "Cadastre seus cartões de crédito, acompanhe o limite disponível e veja os lançamentos separados por fatura para nunca ser pego de surpresa.",
    features: [
      "Cadastrar múltiplos cartões",
      "Limite usado vs disponível",
      "Gastos detalhados por cartão",
    ],
    accentColor: "#e11d48",
    bgGradient: "from-[#4c0519] via-[#881337] to-[#e11d48]",
    visual: <CartoesVisual />,
    route: "/dashboard/cartoes",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    title: "Registre pelo WhatsApp",
    subtitle: "Envie uma mensagem · Pronto!",
    description: "Conecte seu número e registre transações enviando uma mensagem de texto. O bot interpreta a descrição e lança automaticamente na sua conta.",
    features: [
      "Cadastro via mensagem de texto",
      "Confirmação automática do lançamento",
      "Consultar saldo e resumo pelo chat",
    ],
    accentColor: "#25D366",
    bgGradient: "from-[#052e16] via-[#065f46] to-[#25D366]",
    visual: <WhatsAppVisual />,
    route: "/dashboard/whatsapp",
  },
  {
    id: "configuracoes",
    icon: Settings,
    label: "Configurações",
    title: "Personalize sua conta",
    subtitle: "Perfil · Senha · Plano · Tema",
    description: "Atualize seus dados pessoais, altere a senha, escolha entre tema claro e escuro e veja os detalhes do seu plano atual.",
    features: [
      "Editar nome e e-mail",
      "Alterar senha com segurança",
      "Alternar tema claro / escuro",
    ],
    accentColor: "#475569",
    bgGradient: "from-[#0f172a] via-[#1e293b] to-[#475569]",
    visual: <ConfigVisual />,
    route: "/dashboard/configuracoes",
  },
  {
    id: "done",
    icon: CheckCircle,
    label: "Pronto!",
    title: "Você está pronto para começar!",
    subtitle: "Boas finanças começam aqui",
    description: "Todas as funcionalidades foram apresentadas. Comece adicionando sua primeira transação ou configurando uma meta. Boas finanças começam agora!",
    features: [
      "Tutorial salvo — não aparece novamente",
      "Acesse o menu lateral para navegar",
      "Dúvidas? Fale conosco pelo WhatsApp",
    ],
    accentColor: "#25D366",
    bgGradient: "from-[#052e16] via-[#065f46] to-[#25D366]",
    visual: <DashboardVisual />,
    route: "/dashboard",
  },
];

/* ── Hook ─────────────────────────────────────────────────── */

export function useUserTutorial(userId?: string) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const done = localStorage.getItem(storageKey(userId));
    if (!done) setShow(true);
  }, [userId]);

  const complete = () => { localStorage.setItem(storageKey(userId), "true"); setShow(false); };
  const skip = () => { localStorage.setItem(storageKey(userId), "true"); setShow(false); };
  const reset = () => { localStorage.removeItem(storageKey(userId)); setShow(true); };

  return { show, complete, skip, reset };
}

/* ── Component ────────────────────────────────────────────── */

interface UserTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function UserTutorial({ onComplete, onSkip }: UserTutorialProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const goTo = (index: number) => {
    if (animating || index === step) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(index);
      navigate(STEPS[index].route);
      setAnimating(false);
    }, 150);
  };

  const goNext = () => isLast ? onComplete() : goTo(step + 1);
  const goPrev = () => step > 0 && goTo(step - 1);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row"
        style={{ maxHeight: "90vh" }}
      >
        {/* Left panel */}
        <div className={cn(
          "relative sm:w-[42%] shrink-0 bg-gradient-to-br p-6 flex flex-col justify-between min-h-[200px] sm:min-h-0",
          current.bgGradient
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/80 text-xs font-medium">doutorcash</span>
          </div>

          <div className={cn(
            "flex-1 flex items-center my-4 transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}>
            <div className="w-full">{current.visual}</div>
          </div>

          <div className="text-white/60 text-xs font-medium">{current.label}</div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? "w-6 h-2 bg-[#1a3799]"
                      : i < step
                      ? "w-2 h-2 bg-[#1a3799]/40"
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  )}
                />
              ))}
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 px-6 py-5 overflow-y-auto transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}>
            <span className="inline-block text-xs font-semibold text-gray-400 mb-3 tracking-wide uppercase">
              {step + 1} / {STEPS.length}
            </span>

            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
              {current.title}
            </h2>
            <p className="text-sm font-medium mb-4" style={{ color: current.accentColor }}>
              {current.subtitle}
            </p>

            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {current.description}
            </p>

            <div className="space-y-2.5">
              {current.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${current.accentColor}20` }}
                  >
                    <CheckCircle className="w-3 h-3" style={{ color: current.accentColor }} />
                  </div>
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Pular tutorial
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={animating}
                  className="h-9 gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
              )}
              <Button
                size="sm"
                onClick={goNext}
                disabled={animating}
                className="h-9 gap-1.5 text-white"
                style={{ backgroundColor: current.accentColor }}
              >
                {isLast ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Começar!
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
