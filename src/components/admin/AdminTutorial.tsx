import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Receipt, CreditCard,
  Bell, ChevronRight, ChevronLeft, X, CheckCircle,
  Sparkles, TrendingUp, Activity, Shield, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "admin:tutorial:completed";

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

function DashboardVisual() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="grid grid-cols-2 gap-2">
        {["R$ 0", "21", "0", "0%"].map((v, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="w-8 h-1.5 bg-white/30 rounded mb-2" />
            <div className="text-white font-bold text-xl">{v}</div>
            <div className="w-12 h-1 bg-white/20 rounded mt-1.5" />
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl p-3 flex-1 backdrop-blur-sm">
        <div className="w-24 h-1.5 bg-white/30 rounded mb-3" />
        <div className="flex items-end gap-1 h-16">
          {[20, 35, 25, 50, 40, 70].map((h, i) => (
            <div key={i} className="flex-1 bg-white/30 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersVisual() {
  const rows = ["Administrador", "thiago morgado", "Larissa Melo", "João Silva"];
  return (
    <div className="w-full h-full flex flex-col gap-1.5 p-1">
      <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm flex items-center gap-2">
        <div className="w-32 h-6 bg-white/20 rounded-lg" />
        <div className="ml-auto flex gap-1.5">
          <div className="w-16 h-6 bg-white/20 rounded-lg" />
          <div className="w-16 h-6 bg-white/20 rounded-lg" />
        </div>
      </div>
      {rows.map((name, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{name}</div>
            <div className="w-24 h-1 bg-white/20 rounded mt-1" />
          </div>
          <div className="w-10 h-5 bg-white/20 rounded-full" />
          <div className="w-12 h-5 bg-amber-400/60 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function NotifVisual() {
  const items = [
    { color: "bg-blue-400/60", text: "thiago morgado se cadastrou" },
    { color: "bg-green-400/60", text: "Pagamento confirmado" },
    { color: "bg-violet-400/60", text: "Upgrade para Pro" },
    { color: "bg-amber-400/60", text: "Solicitação de suporte" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-1">
      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
        <div className="text-white text-sm font-bold">Notificações</div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-white text-[10px] font-bold">4</div>
        </div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm flex items-center gap-3">
          <div className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
          <div className="text-white text-xs truncate flex-1">{item.text}</div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function GenericVisual({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <div className="text-white/80 text-sm text-center">{label}</div>
      <div className="w-full bg-white/10 rounded-xl p-3 backdrop-blur-sm space-y-2">
        {[80, 60, 90, 50].map((w, i) => (
          <div key={i} className="h-2 bg-white/30 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    label: "Início",
    title: "Bem-vindo ao Painel Admin",
    subtitle: "doutorcash · Controle total da plataforma",
    description: "Este tour interativo vai te guiar pelas principais funcionalidades. Você pode navegar livremente entre os passos ou pular a qualquer momento.",
    features: ["Dashboard com métricas em tempo real", "Gestão completa de usuários", "Monitoramento de atividade"],
    accentColor: "#1a3799",
    bgGradient: "from-[#06091c] via-[#08086e] to-[#1a3799]",
    visual: <DashboardVisual />,
    route: "/admin",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    title: "Visão geral da plataforma",
    subtitle: "Métricas · Receita · Usuários ativos",
    description: "O Dashboard centraliza os principais números do negócio: receita, total de clientes, taxa de conversão e a evolução dos últimos 6 meses.",
    features: ["Receita mensal e sua variação", "Gráfico comparando Receita e Usuários", "Veja cada número separadamente"],
    accentColor: "#1a3799",
    bgGradient: "from-[#06091c] via-[#08086e] to-[#1a3799]",
    visual: <DashboardVisual />,
    route: "/admin",
  },
  {
    id: "clients",
    icon: Users,
    label: "Clientes",
    title: "Gestão de usuários",
    subtitle: "Lista · Filtros · Detalhes · Ações",
    description: "Visualize todos os usuários cadastrados com busca, filtro por plano e status. Clique em qualquer linha para abrir o painel de detalhes.",
    features: ["Busca por nome ou email", "Filtro por plano e status", "Paginação de 10 por página"],
    accentColor: "#4f46e5",
    bgGradient: "from-[#1e1b4b] via-[#312e81] to-[#4f46e5]",
    visual: <UsersVisual />,
    route: "/admin/clientes",
  },
  {
    id: "plans",
    icon: CreditCard,
    label: "Planos",
    title: "Configuração de planos",
    subtitle: "Preços e formas de pagamento",
    description: "Configure o valor e as condições de pagamento oferecidas aos clientes, sem precisar pedir ajuda pra equipe técnica.",
    features: ["Valor à vista e parcelado", "Quantidade de clientes por plano", "Receita gerada por plano"],
    accentColor: "#059669",
    bgGradient: "from-[#064e3b] via-[#065f46] to-[#059669]",
    visual: <GenericVisual label="Planos" />,
    route: "/admin/planos",
  },
  {
    id: "subscriptions",
    icon: Receipt,
    label: "Assinaturas",
    title: "Gestão de assinaturas",
    subtitle: "Ativas · Trial · Inadimplentes",
    description: "Acompanhe o ciclo de vida de cada assinatura: datas de início, próxima cobrança, método de pagamento e renovação automática.",
    features: ["Status de cada assinatura", "Receita total consolidada", "Alerta de inadimplência"],
    accentColor: "#7c3aed",
    bgGradient: "from-[#2e1065] via-[#4c1d95] to-[#7c3aed]",
    visual: <GenericVisual label="Assinaturas em breve" />,
    route: "/admin/assinaturas",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notificações",
    title: "Monitoramento em tempo real",
    subtitle: "Cadastros · Pagamentos · Upgrades · Suporte",
    description: "O sino no topo avisa sobre tudo que acontece na plataforma. Assim que surge algo novo, você recebe um aviso na tela e o número de pendências é atualizado.",
    features: ["Avisos automáticos de novos eventos", "Alerta visual quando chega algo novo", "Marcar como lidas / Limpar tudo"],
    accentColor: "#d97706",
    bgGradient: "from-[#451a03] via-[#78350f] to-[#d97706]",
    visual: <NotifVisual />,
    route: "/admin",
  },
  {
    id: "activity",
    icon: Activity,
    label: "Atividade",
    title: "Histórico de atividades",
    subtitle: "50 eventos · Filtros · Paginação",
    description: "A seção Atividade Recente no Dashboard mostra os últimos 50 eventos com filtro por tipo e navegação entre páginas.",
    features: ["Filtro: Cadastro / Pagamento / Upgrade / Suporte", "5 eventos por página", "Ícone por tipo de ação"],
    accentColor: "#16a34a",
    bgGradient: "from-[#052e16] via-[#14532d] to-[#16a34a]",
    visual: <NotifVisual />,
    route: "/admin",
  },
  {
    id: "security",
    icon: Shield,
    label: "Segurança",
    title: "Permissões e ações",
    subtitle: "Bloquear · Promover · Excluir",
    description: "As ações de gestão (bloquear usuário, trocar plano, promover a administrador) já estão prontas e se habilitam automaticamente assim que a plataforma disponibilizar essa função.",
    features: ["Bloquear, promover e excluir usuários", "Aviso explicativo enquanto a ação não está disponível", "Liberação automática, sem precisar atualizar o app"],
    accentColor: "#dc2626",
    bgGradient: "from-[#450a0a] via-[#7f1d1d] to-[#dc2626]",
    visual: <UsersVisual />,
    route: "/admin/clientes",
  },
  {
    id: "done",
    icon: CheckCircle,
    label: "Concluído",
    title: "Você está pronto!",
    subtitle: "Explore o painel com confiança",
    description: "Todas as funcionalidades foram apresentadas. O painel se atualiza automaticamente com novos dados conforme você usa a plataforma.",
    features: ["Tutorial salvo — não aparece novamente", "Dados atualizados em tempo real", "Painel em constante evolução"],
    accentColor: "#25D366",
    bgGradient: "from-[#052e16] via-[#065f46] to-[#25D366]",
    visual: <DashboardVisual />,
    route: "/admin",
  },
];

export function useAdminTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  const complete = () => { localStorage.setItem(STORAGE_KEY, "true"); setShow(false); };
  const skip = () => { localStorage.setItem(STORAGE_KEY, "true"); setShow(false); };
  const reset = () => { localStorage.removeItem(STORAGE_KEY); setShow(true); };

  return { show, complete, skip, reset };
}

interface AdminTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function AdminTutorial({ onComplete, onSkip }: AdminTutorialProps) {
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
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-y-auto sm:overflow-hidden flex flex-col sm:flex-row"
        style={{ maxHeight: "90vh" }}
      >
        {/* Left panel — visual/gradient, só decorativo. Some em telas
            pequenas pra sobrar espaço pro conteúdo real e o rodapé com os
            botões, que senão ficavam espremidos/inacessíveis (ex: iPhone SE). */}
        <div className={cn(
          "relative sm:w-[42%] shrink-0 bg-gradient-to-br p-6 hidden sm:flex sm:flex-col justify-between sm:min-h-0",
          current.bgGradient
        )}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/80 text-xs font-medium">doutorcash admin</span>
          </div>

          {/* Visual mockup */}
          <div className={cn(
            "flex-1 flex items-center my-4 transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}>
            <div className="w-full">{current.visual}</div>
          </div>

          {/* Step label */}
          <div className="text-white/60 text-xs font-medium">{current.label}</div>
        </div>

        {/* Right panel — content */}
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
            <button onClick={onSkip} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 px-6 py-5 overflow-y-auto transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}>
            {/* Step counter */}
            <span className="inline-block text-xs font-semibold text-gray-400 mb-3 tracking-wide uppercase">
              {step + 1} / {STEPS.length}
            </span>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
              {current.title}
            </h2>
            <p className="text-sm font-medium mb-4" style={{ color: current.accentColor }}>
              {current.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {current.description}
            </p>

            {/* Features */}
            <div className="space-y-2.5">
              {current.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${current.accentColor}15` }}
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
                    Concluir
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
