import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebarContent, MobileSidebarTrigger } from "@/components/user/UserSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsSheet } from "@/components/user/NotificationsSheet";
import { UserTutorial, useUserTutorial } from "@/components/user/UserTutorial";
import { useGoalChangeWatcher } from "@/features/dashboard/hooks/use-user-notifications";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral das suas finanças" },
  "/dashboard/transacoes": { title: "Transações", subtitle: "Suas movimentações" },
  "/dashboard/categorias": { title: "Categorias", subtitle: "Organize seus gastos" },
  "/dashboard/metas": { title: "Metas", subtitle: "Acompanhe seus objetivos" },
  "/dashboard/recorrencias": { title: "Recorrências", subtitle: "Receitas e despesas fixas" },
  "/dashboard/cartoes": { title: "Cartões", subtitle: "Seus cartões de crédito" },
  "/dashboard/whatsapp": { title: "WhatsApp", subtitle: "Integração via mensagem" },
  "/dashboard/configuracoes": { title: "Configurações", subtitle: "Sua conta" },
  "/dashboard/notificacoes": { title: "Notificações", subtitle: "Central de avisos" },
  "/dashboard/suporte": { title: "Suporte", subtitle: "Ajuda e contato" },
  "/dashboard/relatorio": { title: "Relatório", subtitle: "Seu desempenho financeiro" },
};

function Header() {
  const { user } = useAuth();
  const location = useLocation();
  useGoalChangeWatcher();

  const page =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith("/dashboard/recorrencias/")
      ? { title: "Detalhes", subtitle: "Informações da recorrência" }
      : { title: "doutorcash", subtitle: "" });

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="rounded-2xl bg-white border border-[#e2e8f5] flex items-center justify-between px-4 py-3 gap-4 shadow-sm shrink-0">
      {/* Left: mobile trigger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <MobileSidebarTrigger />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] lg:text-base xl:text-lg font-bold text-gray-900 truncate leading-tight">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5 hidden sm:block">
              {page.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: notifications + user info */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationsSheet />

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-[#1a3799] text-white text-sm font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight max-w-32">
              {user?.name || "Usuário"}
            </p>
            <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5 max-w-32">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function UserLayout() {
  const { user } = useAuth();
  const { show, complete, skip } = useUserTutorial(user?.id);

  return (
    <SidebarProvider className="block">
      {show && <UserTutorial onComplete={complete} onSkip={skip} />}

      <div
        className="h-screen flex p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden"
        style={{ background: "radial-gradient(ellipse 80% 80% at 90% 70%, #2b00ff 0%, #08086e 30%, #06091c 62%)" }}
      >
        {/* Desktop sidebar flutuante */}
        <aside className="hidden lg:flex w-[260px] xl:w-[280px] shrink-0">
          <UserSidebarContent />
        </aside>

        {/* Coluna direita */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <Header />

          {/* Card principal com scroll */}
          <div className="flex-1 min-h-0 overflow-auto rounded-2xl bg-[#f4f6fb]">
            {/* Suspense próprio: evita que o lazy-load de uma página filha
                (ex: primeira visita a Transações) suba até o Suspense global
                em AppShell e remonte este layout inteiro — o que reseta o
                tutorial pro passo 0 no meio da navegação entre passos. */}
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
