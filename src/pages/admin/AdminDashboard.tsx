import { memo, useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  CreditCard,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAdminDashboard, AdminStat, type AdminActivityItem } from "@/features/admin/hooks/use-admin-dashboard";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { api, apiEndpoints } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free:       { label: "Free",       className: "bg-gray-100 text-gray-600 border-gray-200" },
  pro:        { label: "Pro",        className: "bg-blue-50 text-blue-600 border-blue-200" },
  business:   { label: "Business",   className: "bg-violet-50 text-violet-600 border-violet-200" },
  enterprise: { label: "Enterprise", className: "bg-amber-50 text-amber-600 border-amber-200" },
};

function getPlanBadge(plan: string) {
  return PLAN_BADGE[plan?.toLowerCase()] ?? { label: plan, className: "bg-gray-100 text-gray-600" };
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0] || "").join("").substring(0, 2).toUpperCase();
}

function UsersByPlanCard() {
  const { users } = useAdminUsers();
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);

  const plans = useMemo(() => {
    const set = new Set(users.map((u) => u.plan?.toLowerCase()).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [users]);

  const filtered = useMemo(() => {
    if (planFilter === "all") return users;
    return users.filter((u) => u.plan?.toLowerCase() === planFilter);
  }, [users, planFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (value: string) => {
    setPlanFilter(value);
    setPage(1);
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#1a3799]" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Usuários por Plano</span>
          </div>
          <p className="text-xs text-gray-400 ml-9">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={planFilter} onValueChange={handleFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {plans.filter((p) => p !== "all").map((p) => (
              <SelectItem key={p} value={p}>{getPlanBadge(p).label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-border">
        {paginated.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Nenhum usuário encontrado
          </div>
        ) : (
          paginated.map((user) => {
            const badge = getPlanBadge(user.plan);
            return (
              <div key={user.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-[#1a3799]/10 text-[#1a3799] text-xs font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <Badge variant="outline" className={cn("text-xs shrink-0", badge.className)}>
                  {badge.label}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t bg-gray-50/50">
          <span className="text-xs text-gray-400">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueChartCard({ revenueData }: { revenueData: { month: string; receita: number; clientes: number }[] }) {
  const [showReceita, setShowReceita] = useState(true);
  const [showClientes, setShowClientes] = useState(true);

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Evolução da Receita e Usuários</span>
          </div>
          <p className="text-xs text-gray-400 ml-9">Receita e usuários ativos por mês</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowReceita((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              showReceita
                ? "bg-[#1a3799] text-white border-[#1a3799]"
                : "bg-white text-gray-400 border-gray-200 hover:border-[#1a3799]/40"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            Receita
          </button>
          <button
            onClick={() => setShowClientes((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              showClientes
                ? "bg-[#25D366] text-white border-[#25D366]"
                : "bg-white text-gray-400 border-gray-200 hover:border-[#25D366]/40"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            Usuários
          </button>
        </div>
      </div>
      <div className="px-2 pb-4">
        {revenueData.length === 0 ? (
          <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-gray-400">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sem histórico de receita disponível ainda</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={revenueData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            {showReceita && (
              <YAxis
                yAxisId="receita"
                orientation="left"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
            )}
            {showClientes && (
              <YAxis
                yAxisId="clientes"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={28}
              />
            )}
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: 12, padding: "8px 12px" }}
              formatter={(value: number, name: string) => {
                if (name === "receita") return [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"];
                return [`${value}`, "Usuários ativos"];
              }}
            />
            {showReceita && (
              <Line
                yAxisId="receita"
                type="monotone"
                dataKey="receita"
                stroke="#1a3799"
                strokeWidth={2.5}
                dot={{ fill: "#1a3799", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#1a3799", strokeWidth: 0 }}
              />
            )}
            {showClientes && (
              <Line
                yAxisId="clientes"
                type="monotone"
                dataKey="clientes"
                stroke="#25D366"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={{ fill: "#25D366", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#25D366", strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const ACTIVITY_CFG: Record<string, { bg: string; icon: typeof UserPlus; color: string; label: string }> = {
  signup:  { bg: "bg-blue-50",   icon: UserPlus,    color: "text-[#1a3799]",  label: "Cadastro" },
  payment: { bg: "bg-green-50",  icon: CreditCard,  color: "text-green-600",  label: "Pagamento" },
  upgrade: { bg: "bg-purple-50", icon: TrendingUp,  color: "text-purple-600", label: "Upgrade" },
  support: { bg: "bg-amber-50",  icon: AlertCircle, color: "text-amber-600",  label: "Suporte" },
};

function RecentActivityCard({ activities }: { activities: AdminActivityItem[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return activities;
    return activities.filter((a) => a.type === typeFilter);
  }, [activities, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (value: string) => { setTypeFilter(value); setPage(1); };

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)] flex flex-col">
      {/* Header */}
      <div className="bg-[#25D366] px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg leading-tight">Atividade Recente</p>
          <p className="text-white/75 text-xs leading-tight mt-0.5">Últimas ações na plataforma</p>
        </div>
        <Select value={typeFilter} onValueChange={handleFilter}>
          <SelectTrigger className="h-7 w-28 text-xs bg-white/20 border-white/30 text-white [&>svg]:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ACTIVITY_CFG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-white flex-1 divide-y divide-border/60">
        {paginated.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Nenhuma atividade encontrada
          </div>
        ) : (
          paginated.map((activity, i) => {
            const cfg = ACTIVITY_CFG[activity.type] ?? ACTIVITY_CFG.signup;
            const Icon = cfg.icon;
            return (
              <div key={`${activity.type}-${activity.message}-${i}`} className="flex items-start gap-3 px-5 py-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-tight">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t bg-gray-50/50">
        <span className="text-xs text-gray-400">
          {filtered.length} atividade{filtered.length !== 1 ? "s" : ""} · página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const AdminStatCard = memo(function AdminStatCard({ stat }: { stat: AdminStat }) {
  const Icon = stat.icon;
  return (
    <div className="rounded-2xl bg-[#1a3799] p-4 flex flex-col gap-3 min-h-[110px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-white/70 leading-tight">{stat.title}</p>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", stat.bgColor)}>
          <Icon className={cn("h-4 w-4", stat.color)} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-2xl font-bold text-white leading-none tracking-tight">{stat.value}</p>
        {stat.warning && (
          <AlertTriangle
            className="h-4 w-4 text-amber-400 shrink-0"
            aria-label={stat.warning}
          >
            <title>{stat.warning}</title>
          </AlertTriangle>
        )}
      </div>
      {stat.warning && (
        <p className="text-[11px] text-amber-300 leading-tight -mt-2">{stat.warning}</p>
      )}
      <div className="flex items-center gap-1">
        {stat.trend === "up" ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-green-400 shrink-0" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
        )}
        <p className={cn("text-xs font-medium", stat.trend === "up" ? "text-green-400" : "text-red-400")}>
          {stat.change}
        </p>
        <span className="text-xs text-white/40">vs mês anterior</span>
      </div>
    </div>
  );
});

function AdminDashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-5 flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando dados...</span>
      </div>
    </div>
  );
}

function AdminDashboardError({ message }: { message: string }) {
  return (
    <div className="flex-1 overflow-auto p-5 flex items-center justify-center">
      <div className="text-center space-y-2">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Falha ao carregar dados</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 4;

  const { data, isLoading, isError, error } = useAdminDashboard();

  if (isLoading) return <AdminDashboardSkeleton />;
  if (isError || !data) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return <AdminDashboardError message={msg} />;
  }

  const { stats, revenueData, planDistribution, recentClients, recentActivity, partialErrors } = data;
  const totalPages = Math.ceil(recentClients.length / clientsPerPage);
  const start = (currentPage - 1) * clientsPerPage;
  const paginatedClients = recentClients.slice(start, start + clientsPerPage);
  const failedCount = Object.keys(partialErrors ?? {}).length;

  return (
    <div className="p-5 lg:p-7 space-y-5">
        {/* Partial error banner */}
        {failedCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-medium">{failedCount} endpoint{failedCount > 1 ? "s" : ""} com falha:</span>{" "}
              {Object.entries(partialErrors).map(([ep, msg]) => (
                <span key={ep} className="mr-3"><span className="font-semibold">{ep}</span> — {msg}</span>
              ))}
            </div>
          </div>
        )}

        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Painel Admin 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aqui está o resumo da plataforma DoutorCash
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <AdminStatCard key={stat.title} stat={stat} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <RevenueChartCard revenueData={revenueData} />

          {/* Users by Plan */}
          <UsersByPlanCard />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Clients */}
          <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
            <div className="bg-[#1a3799] px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg leading-tight">Clientes Recentes</p>
                <p className="text-white/75 text-xs leading-tight mt-0.5">Últimos cadastros na plataforma</p>
              </div>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 shrink-0 text-xs">
                Ver todos
              </Button>
            </div>
            <div className="bg-white">
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Plano</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.email}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#1a3799]/10 text-[#1a3799] text-xs font-bold">
                              {client.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-400">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.plan === "Business" ? "default" : client.plan === "Pro" ? "secondary" : "outline"} className="text-xs">
                          {client.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            client.status === "Bloqueado" && "bg-red-50 text-red-700 border-red-200 font-semibold",
                            client.status === "Ativo" && "bg-green-50 text-green-700 border-green-200"
                          )}
                        >
                          {client.status === "Bloqueado" && "⚠️ "}{client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.role === "admin" && (
                          <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">
                            👑 Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-400">{client.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {paginatedClients.map((client) => (
                  <div key={client.email} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-[#1a3799]/10 text-[#1a3799] text-xs font-bold">
                          {client.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-400 truncate">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={client.plan === "Business" ? "default" : client.plan === "Pro" ? "secondary" : "outline"} className="text-xs">
                        {client.plan}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          client.status === "Bloqueado" && "bg-red-50 text-red-700 border-red-200 font-semibold",
                          client.status === "Ativo" && "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        {client.status === "Bloqueado" && "⚠️ "}{client.status}
                      </Badge>
                      {client.role === "admin" && (
                        <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">
                          👑 Admin
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{client.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {((currentPage - 1) * clientsPerPage) + 1} - {Math.min(currentPage * clientsPerPage, recentClients.length)} de {recentClients.length} clientes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivityCard activities={recentActivity} />
        </div>
      </div>
  );
}

export default memo(AdminDashboard);
