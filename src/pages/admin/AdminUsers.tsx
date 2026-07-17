import { useState, useMemo } from "react";
import {
  Search, MoreHorizontal, Mail, Shield, Ban, Trash2,
  ChevronLeft, ChevronRight, Users, X, AlertCircle,
  CheckCircle, UserCheck, Phone, Calendar, Activity,
  CreditCard, Crown, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminUsersSkeleton } from "@/components/ui/admin-skeletons";
import {
  useAdminUsers, useUpdateAdminUser, useDeleteAdminUser,
  type AdminUser,
} from "@/features/admin/hooks/use-admin-users";
import { useAdminWriteCapability } from "@/features/admin/hooks/use-admin-write-capability";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const PLAN_CONFIG: Record<string, { label: string; className: string; icon: typeof Users }> = {
  free:       { label: "Free",       className: "bg-muted text-muted-foreground border-muted-foreground/20", icon: Users },
  pro:        { label: "Pro",        className: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800", icon: Zap },
  business:   { label: "Business",   className: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800", icon: Crown },
  enterprise: { label: "Enterprise", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800", icon: Crown },
};

function getPlanConfig(plan: string) {
  return PLAN_CONFIG[plan?.toLowerCase()] ?? PLAN_CONFIG["free"];
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_CONFIG = {
  Ativo:     { className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  Pendente:  { className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  Bloqueado: { className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
  active:    { className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  suspended: { className: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
} as Record<string, { className: string }>;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0] || "").join("").substring(0, 2).toUpperCase();
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg = getPlanConfig(plan);
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pendente"];
  const label = status === "active" ? "Ativo" : status === "suspended" ? "Bloqueado" : status;
  return (
    <Badge variant="outline" className={cfg.className}>
      {label}
    </Badge>
  );
}

// ── User Detail Sheet ────────────────────────────────────────────────────────

const PENDING_BACKEND_TOOLTIP = "Aguardando implementação no backend";

function WriteActionButton({
  canWrite,
  isChecking,
  children,
  onClick,
  className,
  variant = "outline",
  destructive = false,
}: {
  canWrite: boolean;
  isChecking: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "outline" | "ghost";
  destructive?: boolean;
}) {
  const disabled = isChecking || !canWrite;
  const btn = (
    <Button
      variant={variant}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
  if (!disabled) return btn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="w-full">{btn}</span>
      </TooltipTrigger>
      <TooltipContent side="left">
        {isChecking ? "Verificando disponibilidade..." : PENDING_BACKEND_TOOLTIP}
      </TooltipContent>
    </Tooltip>
  );
}

function UserDetailSheet({
  user,
  open,
  onClose,
  onChangePlan,
  onChangeStatus,
  onChangeRole,
  onDelete,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onChangePlan: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  const { canWrite, isChecking } = useAdminWriteCapability();
  if (!user) return null;
  const isBlocked = user.status === "Bloqueado" || user.status === "suspended";
  const isAdmin = user.role === "admin";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Detalhes do Usuário</SheetTitle>
          <SheetDescription>Informações e ações para este cliente</SheetDescription>
        </SheetHeader>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <PlanBadge plan={user.plan} />
              <StatusBadge status={user.status} />
              {isAdmin && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Info rows */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone / WhatsApp</p>
                <p className="text-sm font-medium">{user.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPF</p>
              <p className="text-sm font-medium font-mono">{user.cpf ?? "Não informado"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Perfil</p>
              <p className="text-sm font-medium">{isAdmin ? "Administrador" : "Usuário"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Membro desde</p>
              <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último acesso</p>
              <p className="text-sm font-medium text-muted-foreground">
                {user.lastLogin ? formatDate(user.lastLogin) : "Não disponível"}
              </p>
            </div>
          </div>

          {user.totalTransactions !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de transações</p>
                <p className="text-sm font-medium">{user.totalTransactions.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          )}

          {user.planExpiresAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano expira em</p>
                <p className="text-sm font-medium">{formatDate(user.planExpiresAt)}</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Ações</p>

          <WriteActionButton
            canWrite={canWrite}
            isChecking={isChecking}
            className="w-full justify-start"
            onClick={() => { onClose(); onChangePlan(user); }}
          >
            <Crown className="w-4 h-4 mr-2 text-violet-500" />
            Alterar Plano
          </WriteActionButton>

          <WriteActionButton
            canWrite={canWrite}
            isChecking={isChecking}
            className="w-full justify-start"
            onClick={() => { onClose(); onChangeStatus(user); }}
          >
            {isBlocked ? (
              <><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />Desbloquear usuário</>
            ) : (
              <><Ban className="w-4 h-4 mr-2 text-amber-500" />Bloquear usuário</>
            )}
          </WriteActionButton>

          <WriteActionButton
            canWrite={canWrite}
            isChecking={isChecking}
            className="w-full justify-start"
            onClick={() => { onClose(); onChangeRole(user); }}
          >
            <Shield className="w-4 h-4 mr-2 text-blue-500" />
            {isAdmin ? "Remover acesso admin" : "Promover a admin"}
          </WriteActionButton>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open(`mailto:${user.email}`)}
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar email
          </Button>

          <Separator className="my-2" />

          <WriteActionButton
            canWrite={canWrite}
            isChecking={isChecking}
            className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { onClose(); onDelete(user); }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir usuário
          </WriteActionButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Edit Plan Dialog ─────────────────────────────────────────────────────────

function ChangePlanDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState(user?.plan ?? "pro");
  const updateUser = useUpdateAdminUser();
  if (!user) return null;

  const handleSave = () => {
    updateUser.mutate(
      { id: user.id, plan },
      {
        onSuccess: () => { toast.success(`Plano alterado para ${plan}`); onClose(); },
        onError: () => toast.error("Erro ao alterar plano"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose} onCloseAutoFocus={(e) => e.preventDefault()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
          <DialogDescription>
            Alterando plano de <strong>{user.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Novo plano</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pro">Doutor Cash Anual — R$ 99,90 no PIX ou 12x de R$ 12,90</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Plano anual · R$ 99,90 à vista no PIX ou 12x de R$ 12,90 no cartão
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateUser.isPending}>
            {updateUser.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Role Dialog ───────────────────────────────────────────────────────

function ChangeRoleDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateUser = useUpdateAdminUser();
  if (!user) return null;
  const isAdmin = user.role === "admin";
  const newRole = isAdmin ? "user" : "admin";
  const isPromoting = !isAdmin;

  const handleConfirm = () => {
    // Payload sem adminPassword - o backend não precisa
    const payload = { 
      id: user.id, 
      role: newRole
    };
    
    updateUser.mutate(payload, {
        onSuccess: () => {
          toast.success(isAdmin ? "Acesso admin removido" : "Usuário promovido a admin");
          onClose();
        },
        onError: (error: unknown) => {
          // Extrair mensagem de erro
          const axiosError = error as { 
            response?: { 
              data?: unknown; 
              status?: number;
            }; 
          };
          const status = axiosError.response?.status;
          const data = axiosError.response?.data;
          const msg = typeof data === 'object' && data !== null && 'message' in data 
            ? String((data as { message: string }).message) 
            : "";
          
          // Se for 422 ou 404, provavelmente o endpoint não está implementado no backend
          if (status === 422 || status === 404) {
            toast.error("Funcionalidade em desenvolvimento. O endpoint de atualização de usuários ainda não está disponível no backend.");
          } else {
            toast.error(msg || "Erro ao alterar papel");
          }
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose} onCloseAutoFocus={(e) => e.preventDefault()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdmin ? "Remover acesso admin?" : "Promover a admin?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? `${user.name} perderá acesso ao painel administrativo.`
              : `${user.name} terá acesso total ao painel administrativo. Certifique-se de que isso é intencional.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateUser.isPending}
            className={!isAdmin ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {updateUser.isPending ? "Aplicando..." : isAdmin ? "Remover admin" : "Confirmar promoção"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Block/Unblock Dialog ─────────────────────────────────────────────────────

function ChangeStatusDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateUser = useUpdateAdminUser();
  if (!user) return null;
  const isBlocked = user.status === "Bloqueado" || user.status === "suspended" || user.status === "blocked";
  // O backend pode aceitar tanto "blocked" quanto "Bloqueado", vamos usar "active" e "blocked"
  const newStatus = isBlocked ? "active" : "blocked";

  const handleConfirm = () => {
    updateUser.mutate(
      { id: user.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(isBlocked ? "Usuário desbloqueado" : "Usuário bloqueado");
          onClose();
        },
        onError: () => toast.error("Erro ao alterar status"),
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose} onCloseAutoFocus={(e) => e.preventDefault()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? "Desbloquear usuário?" : "Bloquear usuário?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked
              ? `${user.name} poderá acessar a plataforma novamente.`
              : `${user.name} ficará sem acesso à plataforma até ser desbloqueado.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateUser.isPending}
            className={!isBlocked ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
          >
            {updateUser.isPending ? "Aplicando..." : isBlocked ? "Desbloquear" : "Bloquear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteUserDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const deleteUser = useDeleteAdminUser();
  if (!user) return null;

  const handleConfirm = () => {
    deleteUser.mutate(user.id, {
      onSuccess: () => { toast.success("Usuário excluído"); onClose(); },
      onError: () => toast.error("Erro ao excluir usuário"),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose} onCloseAutoFocus={(e) => e.preventDefault()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os dados de <strong>{user.name}</strong> ({user.email}) serão removidos. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? "Excluindo..." : "Excluir permanentemente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);

  const { users, stats, isLoading, isError, error } = useAdminUsers();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesPlan =
        selectedPlan === "all" ||
        user.plan?.toLowerCase() === selectedPlan.toLowerCase();
      const matchesStatus =
        selectedStatus === "all" ||
        user.status?.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchTerm, selectedPlan, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPlan("all");
    setSelectedStatus("all");
    setPage(1);
  };

  const hasActiveFilters = searchTerm || selectedPlan !== "all" || selectedStatus !== "all";

  const openDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const openAction = (
    user: AdminUser,
    action: "plan" | "status" | "role" | "delete"
  ) => {
    // Fechar todos os diálogos primeiro para evitar conflito de estados
    setPlanDialogOpen(false);
    setStatusDialogOpen(false);
    setRoleDialogOpen(false);
    setDeleteDialogOpen(false);
    setActionUser(user);
    // Pequeno delay para garantir que os diálogos fecham antes de abrir novo
    setTimeout(() => {
      if (action === "plan") setPlanDialogOpen(true);
      if (action === "status") setStatusDialogOpen(true);
      if (action === "role") setRoleDialogOpen(true);
      if (action === "delete") setDeleteDialogOpen(true);
    }, 10);
  };

  if (isError) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Falha ao carregar clientes</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-5">
        {isLoading ? (
          <AdminUsersSkeleton />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold mt-1">{stats.total.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-500">{stats.active.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendentes</p>
                  <p className="text-2xl font-bold mt-1 text-amber-500">{stats.pending.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Bloqueados</p>
                  <p className="text-2xl font-bold mt-1 text-red-500">{stats.blocked.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedPlan} onValueChange={(v) => { setSelectedPlan(v); setPage(1); }}>
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="pro">Doutor Cash Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Limpar filtros">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {paginatedUsers.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters ? "Tente ajustar os filtros" : "Ainda não há clientes"}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50 hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Cliente</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">CPF</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Plano</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Papel</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Último acesso</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Criado em</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-muted/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => openDetail(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell font-mono">
                          {user.cpf ?? "—"}
                        </TableCell>
                        <TableCell><PlanBadge plan={user.plan} /></TableCell>
                        <TableCell><StatusBadge status={user.status} /></TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-orange-500/10 text-orange-600 border-orange-200"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {user.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                          {user.lastLogin ? formatDate(user.lastLogin) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDetail(user)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction(user, "plan")}>
                                <Crown className="h-4 w-4 mr-2" />
                                Alterar plano
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction(user, "role")}>
                                <Shield className="h-4 w-4 mr-2" />
                                {user.role === "admin" ? "Remover admin" : "Promover a admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-amber-600"
                                onClick={() => openAction(user, "status")}
                              >
                                {user.status === "Bloqueado" || user.status === "suspended" ? (
                                  <><CheckCircle className="h-4 w-4 mr-2" />Desbloquear</>
                                ) : (
                                  <><Ban className="h-4 w-4 mr-2" />Bloquear</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openAction(user, "delete")}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-border">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-muted/30"
                      onClick={() => openDetail(user)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDetail(user)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction(user, "plan")}>
                                <Crown className="h-4 w-4 mr-2" />
                                Alterar plano
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction(user, "role")}>
                                <Shield className="h-4 w-4 mr-2" />
                                {user.role === "admin" ? "Remover admin" : "Promover a admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-amber-600"
                                onClick={() => openAction(user, "status")}
                              >
                                {user.status === "Bloqueado" || user.status === "suspended" ? (
                                  <><CheckCircle className="h-4 w-4 mr-2" />Desbloquear</>
                                ) : (
                                  <><Ban className="h-4 w-4 mr-2" />Bloquear</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openAction(user, "delete")}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PlanBadge plan={user.plan} />
                        <StatusBadge status={user.status} />
                        <Badge
                          variant="outline"
                          className={
                            user.role === "admin"
                              ? "bg-orange-500/10 text-orange-600 border-orange-200"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Criado em {formatDate(user.createdAt)}</span>
                        <span>Último acesso: {user.lastLogin ? formatDate(user.lastLogin) : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length === 0
                      ? "Nenhum resultado"
                      : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredUsers.length)} de ${filteredUsers.length} clientes`}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
    </div>

      {/* Dialogs & Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onChangePlan={(u) => openAction(u, "plan")}
        onChangeStatus={(u) => openAction(u, "status")}
        onChangeRole={(u) => openAction(u, "role")}
        onDelete={(u) => openAction(u, "delete")}
      />

      <ChangePlanDialog
        user={actionUser}
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
      />

      <ChangeStatusDialog
        user={actionUser}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      />

      <ChangeRoleDialog
        user={actionUser}
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
      />

      <DeleteUserDialog
        user={actionUser}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
