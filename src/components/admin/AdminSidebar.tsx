import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Receipt,
  Building,
  BarChart2,
  Tag,
  LucideIcon,
  Menu,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Assinaturas", url: "/admin/assinaturas", icon: Receipt },
  { title: "Planos", url: "/admin/planos", icon: CreditCard },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart2 },
  { title: "Categorias", url: "/admin/categorias", icon: Tag },
];

const systemMenuItems: MenuItem[] = [
  { title: "Notificações", url: "/admin/notificacoes", icon: Bell },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

function NavItem({ item, end = false, onClick }: { item: MenuItem; end?: boolean; onClick?: () => void }) {
  const location = useLocation();
  const isActive = end
    ? location.pathname === item.url
    : location.pathname.startsWith(item.url);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.url}
      end={end}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
        isActive
          ? "bg-white/15 text-white"
          : "bg-white/8 text-white/70 hover:bg-white/12 hover:text-white"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
          isActive ? "bg-white/15" : "bg-white/10"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <span className="flex-1 truncate">{item.title}</span>
      {isActive && (
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
      )}
    </NavLink>
  );
}

function SidebarLogo({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 mx-auto">
        <span className="text-white font-black text-sm">DC</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 shrink-0">
        <span className="text-white font-black text-base tracking-tight">DC</span>
      </div>
      <div className="leading-tight">
        <p className="text-white font-bold text-base leading-none">Doutor</p>
        <p className="text-white font-bold text-base leading-none">Cash</p>
        <p className="text-white/50 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Admin</p>
      </div>
    </div>
  );
}

function AdminFooter({ onLogout, user }: { onLogout: () => void; user: { name?: string; email?: string } | null }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0] || "").join("").substring(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="flex items-center gap-3 px-1">
      <Avatar className="h-9 w-9 shrink-0 border-2 border-white/20">
        <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 max-w-[120px]">
        <p className="text-white text-sm font-semibold truncate leading-tight">
          {user?.name || "Admin"}
        </p>
        <p className="text-white/50 text-xs truncate leading-tight mt-0.5">
          {user?.email || ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-white/50 hover:text-white hover:bg-white/10"
        onClick={onLogout}
        aria-label="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login", { replace: true });
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#1a3799] px-4 py-5 gap-0 rounded-3xl">
      <div className="mb-5">
        <SidebarLogo />
      </div>

      <div className="h-px bg-white/15 mb-5" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-none">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-1 mb-2">
          Principal
        </p>
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <NavItem
              key={item.url}
              item={item}
              end={item.url === "/admin"}
              onClick={onClose}
            />
          ))}
        </div>

        <div className="pt-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-1 mb-2">
            Sistema
          </p>
          <div className="space-y-1">
            {systemMenuItems.map((item) => (
              <NavItem key={item.url} item={item} onClick={onClose} />
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/15 mt-5 mb-4" />

      <AdminFooter onLogout={handleLogout} user={user} />
    </div>
  );
}

export function AdminMobileTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Abrir menu admin"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 border-r-0">
        <SidebarInner onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

/* Static desktop sidebar content — used directly in AdminLayout */
export function AdminSidebarContent() {
  return <SidebarInner />;
}

/** @deprecated Use AdminSidebarContent in the layout's aside instead */
export function AdminSidebar() {
  return null;
}
