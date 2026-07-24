import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminTutorial, useAdminTutorial } from "@/components/admin/AdminTutorial";
import { AdminSidebarContent, AdminMobileTrigger } from "@/components/admin/AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, UserPlus, CreditCard, TrendingUp, Headphones, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminNotifications, type AdminNotification } from "@/features/admin/hooks/use-admin-notifications";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ADMIN_PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Visão geral da plataforma" },
  "/admin/clientes": { title: "Clientes", subtitle: "Gerencie os clientes" },
  "/admin/assinaturas": { title: "Assinaturas", subtitle: "Gerencie as assinaturas" },
  "/admin/planos": { title: "Planos", subtitle: "Configure os planos" },
  "/admin/notificacoes": { title: "Notificações", subtitle: "Central de avisos" },
  "/admin/configuracoes": { title: "Configurações", subtitle: "" },
};

const TYPE_CONFIG: Record<string, { icon: typeof UserPlus; color: string; bg: string }> = {
  signup:  { icon: UserPlus,   color: "text-blue-600",   bg: "bg-blue-50" },
  payment: { icon: CreditCard, color: "text-green-600",  bg: "bg-green-50" },
  upgrade: { icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  support: { icon: Headphones, color: "text-amber-600",  bg: "bg-amber-50" },
};

function NotificationItem({ notification }: { notification: AdminNotification }) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.signup;
  const Icon = cfg.icon;
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 border-b last:border-0",
      !notification.read && "bg-blue-50/40"
    )}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("w-4 h-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
      )}
    </div>
  );
}

function AdminNotificationsSheet() {
  const { notifications, unreadCount, markAllRead, clearAll } = useAdminNotifications();

  return (
    <Sheet onOpenChange={(open) => open && unreadCount > 0 && markAllRead()}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full bg-[#1a3799]/8 hover:bg-[#1a3799]/12 text-[#1a3799]"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5 fill-[#1a3799] text-[#1a3799]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white leading-none px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[85vw] max-w-sm flex flex-col p-0 bg-background border-l overflow-x-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {unreadCount} novas
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground gap-1"
                  onClick={markAllRead}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Lidas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                onClick={clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Você está em dia com tudo!</p>
            </div>
          ) : (
            notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminHeaderLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const page = ADMIN_PAGE_TITLES[location.pathname] ?? { title: "Admin", subtitle: "" };

  const getInitials = () => {
    if (!user?.name) return "AD";
    return user.name
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="rounded-2xl bg-white flex items-center justify-between px-4 py-3 gap-4 shadow-sm shrink-0">
      {/* Left: mobile trigger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <AdminMobileTrigger />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 truncate leading-tight">
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
        <AdminNotificationsSheet />

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-[#1a3799] text-white text-sm font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight max-w-32">
              {user?.name || "Admin"}
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

export default function AdminLayout() {
  const { show, complete, skip } = useAdminTutorial();

  return (
    <>
      <div
        className="h-screen flex p-3 gap-3 overflow-hidden"
        style={{ background: "radial-gradient(ellipse 80% 80% at 90% 70%, #2b00ff 0%, #08086e 30%, #06091c 62%)" }}
      >
        {/* Desktop sidebar flutuante */}
        <aside className="hidden lg:flex w-[260px] shrink-0">
          <AdminSidebarContent />
        </aside>

        {/* Coluna direita */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          <AdminHeaderLayout />

          {/* Card branco principal com scroll */}
          <div className="flex-1 min-h-0 overflow-auto rounded-2xl bg-white">
            {/* Suspense próprio: evita que o lazy-load de uma página filha
                suba até o Suspense global em AppShell e remonte este layout
                inteiro — o que resetaria o tutorial de admin pro passo 0. */}
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

      {show && <AdminTutorial onComplete={complete} onSkip={skip} />}
    </>
  );
}
