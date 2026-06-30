import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Download, TrendingUp, Users, PieChart, Activity, ArrowUpRight, ArrowDownRight, Loader2, FileText, Table, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAdminReports, type PeriodType } from "@/features/admin/hooks/use-admin-reports";
import { cn } from "@/lib/utils";

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const StatCard = ({ title, value, change, trend, icon: Icon, colorClass }: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: typeof TrendingUp;
  colorClass: string;
}) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-1">Total no período</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {trend === "up" ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className={cn("text-xs font-medium", trend === "up" ? "text-emerald-500" : "text-red-500")}>
          {change}
        </span>
        <span className="text-xs text-muted-foreground">vs período anterior</span>
      </div>
    </CardContent>
  </Card>
);

const ChartContainer = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card className="border-0 shadow-sm">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// ============================================
// COMPONENTES DE GRÁFICOS
// ============================================

const RevenueChart = ({ data }: { data: { labels: string[]; datasets: { revenue: number[]; expenses: number[]; netRevenue: number[] } } }) => {
  const chartData = data.labels.map((label, i) => ({
    name: label,
    receita: data.datasets.revenue[i],
    despesas: data.datasets.expenses[i],
    lucro: data.datasets.netRevenue[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis 
          tick={{ fontSize: 12, fill: "#6b7280" }} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(v) => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
        />
        <Legend />
        <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="lucro" name="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const SubscriptionsEvolutionChart = ({ data }: { data: { month: string; newSubscriptions: number; cancellations: number; mrr: number }[] }) => {
  const chartData = data.map(d => ({
    name: d.month,
    assinantes: d.newSubscriptions,
    cancelamentos: d.cancellations,
    mrr: d.mrr,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name === "mrr" ? `MRR R$${value}` : value]}
        />
        <Legend />
        <Bar dataKey="assinantes" name="Novos Assinantes" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelamentos" name="Cancelamentos" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const UsersGrowthChart = ({ data }: { data: { period: string; totalUsers: number; newUsers: number; activeUsers: number }[] }) => {
  const chartData = data.map(d => ({
    name: d.period.slice(-2),
    total: d.totalUsers,
    novos: d.newUsers,
    ativos: d.activeUsers,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
        />
        <Legend />
        <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="novos" name="Novos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="ativos" name="Ativos" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const PlansDistributionChart = ({ data }: { data: { planName: string; subscribers: number; revenue: number; percentage: number }[] }) => {
  const chartData = data.map(d => ({
    name: d.planName,
    value: d.subscribers,
    revenue: d.revenue,
    percentage: d.percentage,
  }));

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width="50%" height={250}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="space-y-3 flex-1">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{item.value}</span>
              <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChurnChart = ({ data }: { data: { period: string; cancelledCount: number; churnRate: number }[] }) => {
  const chartData = data.map(d => ({
    name: d.period.slice(-2),
    cancelamentos: d.cancelledCount,
    taxa: d.churnRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip 
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="cancelamentos" name="Cancelamentos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa de Churn (%)" stroke="#f59e0b" strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================
// COMPONENTES DE LISTA
// ============================================

const ChurnTable = ({ data }: { data: { period: string; cancelledCount: number; cancelledRevenue: number; churnRate: number; reason: string }[] }) => (
  <div className="overflow-x-auto">
    <div className="min-w-[480px] space-y-4">
    <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
      <div>Período</div>
      <div>Cancelamentos</div>
      <div>Receita Perdida</div>
      <div>Taxa de Churn</div>
      <div>Motivo Principal</div>
    </div>
    {data.map((item, i) => (
      <div key={i} className="grid grid-cols-5 gap-4 text-sm items-center">
        <div className="font-medium">{item.period}</div>
        <div>
          <Badge variant="destructive" className="font-normal">{item.cancelledCount}</Badge>
        </div>
        <div className="text-red-500">R$ {item.cancelledRevenue.toLocaleString("pt-BR")}</div>
        <div>
          <Badge variant={item.churnRate > 2 ? "destructive" : "outline"} className="font-normal">
            {item.churnRate.toFixed(1)}%
          </Badge>
        </div>
        <div className="text-muted-foreground text-xs">{item.reason}</div>
      </div>
    ))}
  </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminReports() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const { data, isLoading, isError, error } = useAdminReports(selectedPeriod);

  // Formatação de valores
  const formattedStats = useMemo(() => {
    if (!data?.stats) return null;
    const { stats } = data;
    return {
      revenue: `R$ ${stats.totalRevenue.toLocaleString("pt-BR")}`,
      users: stats.newUsers.toLocaleString("pt-BR"),
      conversion: `${stats.conversionRate.toFixed(1)}%`,
    };
  }, [data]);

  if (!user) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Faça login como admin</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Activity className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar relatórios</h3>
            <p className="text-muted-foreground">{error?.message || "Tente novamente mais tarde"}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Mock data warning banner */}
      {data?.failedEndpoints && data.failedEndpoints.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {data.failedEndpoints.length} endpoint{data.failedEndpoints.length > 1 ? "s" : ""} indisponível{data.failedEndpoints.length > 1 ? "is" : ""} — exibindo dados de demonstração
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Falhou: {data.failedEndpoints.join(", ")}
              </p>
              {Object.keys(data.apiErrors).length > 0 && (
                <button
                  onClick={() => setShowErrorDetails(v => !v)}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-1 hover:underline"
                >
                  {showErrorDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showErrorDetails ? "Ocultar detalhes" : "Ver detalhes do erro"}
                </button>
              )}
              {showErrorDetails && (
                <div className="mt-2 space-y-1">
                  {Object.entries(data.apiErrors).map(([endpoint, msg]) => (
                    <p key={endpoint} className="text-xs font-mono text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">{endpoint}:</span> {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Relatórios Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise completa da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {formattedStats && data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Receita Mensal"
            value={formattedStats.revenue}
            change={data.stats.revenueChange}
            trend={data.stats.revenueTrend}
            icon={TrendingUp}
            colorClass="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            title="Novos Cadastros"
            value={formattedStats.users}
            change={data.stats.usersChange}
            trend={data.stats.usersTrend}
            icon={Users}
            colorClass="bg-emerald-500/10 text-emerald-500"
          />
          <StatCard
            title="Taxa de Conversão"
            value={formattedStats.conversion}
            change={data.stats.conversionChange}
            trend={data.stats.conversionTrend}
            icon={Activity}
            colorClass="bg-violet-500/10 text-violet-500"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <PieChart className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="churn" className="gap-2">
            <Activity className="h-4 w-4" />
            Churn
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <ChartContainer
            title="Receita Mensal"
            description="Evolução da receita bruta (MRR), despesas e lucro líquido"
          >
            {data?.revenueChart ? (
              <RevenueChart data={data.revenueChart} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </ChartContainer>

          <ChartContainer
            title="Evolução de Assinaturas"
            description="Novos assinantes vs cancelamentos por período"
          >
            {data?.revenueData && data.revenueData.length > 0 ? (
              <SubscriptionsEvolutionChart data={data.revenueData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </ChartContainer>

          {/* Revenue Table */}
          {data?.revenueData && data.revenueData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Dados Detalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <div className="min-w-[640px] space-y-4">
                  <div className="grid grid-cols-8 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-1">Mês</div>
                    <div className="col-span-1">Receita</div>
                    <div className="col-span-1">Despesas</div>
                    <div className="col-span-1">Lucro</div>
                    <div className="col-span-1">MRR</div>
                    <div className="col-span-1">Novas Assin.</div>
                    <div className="col-span-1">Cancel.</div>
                    <div className="col-span-1">Churn</div>
                  </div>
                  {data.revenueData.map((item, i) => (
                    <div key={i} className="grid grid-cols-8 gap-4 text-sm items-center">
                      <div className="col-span-1 font-medium">{item.month}</div>
                      <div className="col-span-1 text-blue-600">R$ {item.revenue.toLocaleString("pt-BR")}</div>
                      <div className="col-span-1 text-red-500">R$ {item.expenses.toLocaleString("pt-BR")}</div>
                      <div className="col-span-1 text-emerald-600">R$ {item.netRevenue.toLocaleString("pt-BR")}</div>
                      <div className="col-span-1">R$ {item.mrr.toLocaleString("pt-BR")}</div>
                      <div className="col-span-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          +{item.newSubscriptions}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <Badge variant="destructive" className="bg-red-50">
                          -{item.cancellations}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <Badge variant="outline">{item.churnRate.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <ChartContainer
            title="Crescimento de Usuários"
            description="Novos cadastros, usuários ativos e total por período"
          >
            {data?.userGrowth && data.userGrowth.length > 0 ? (
              <UsersGrowthChart data={data.userGrowth} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </ChartContainer>

          {/* Users Summary */}
          {data?.userGrowth && data.userGrowth.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.userGrowth[data.userGrowth.length - 1]?.totalUsers ?? 0}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">{data.userGrowth[data.userGrowth.length - 1]?.activeUsers ?? 0}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">+{data.userGrowth[data.userGrowth.length - 1]?.newUsers ?? 0}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <ChartContainer
            title="Distribuição de Planos"
            description="Assinaturas por plano (Free, Pro, Business)"
          >
            {data?.planDistribution && data.planDistribution.length > 0 ? (
              <PlansDistributionChart data={data.planDistribution} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </ChartContainer>

          {/* Plans Summary */}
          {data?.planDistribution && data.planDistribution.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Resumo por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.planDistribution.map((plan, i) => (
                    <div key={plan.planId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <div>
                          <p className="font-medium">{plan.planName}</p>
                          <p className="text-xs text-muted-foreground">{plan.subscribers} assinantes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{plan.percentage}%</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.revenue > 0 ? `R$ ${plan.revenue.toLocaleString("pt-BR")}/mês` : "Grátis"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Churn Tab */}
        <TabsContent value="churn" className="space-y-4">
          <ChartContainer
            title="Análise de Churn"
            description="Cancelamentos e taxa de churn por período"
          >
            {data?.churnData && data.churnData.length > 0 ? (
              <ChurnChart data={data.churnData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </ChartContainer>

          {/* Churn Table */}
          {data?.churnData && data.churnData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Detalhes de Cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ChurnTable data={data.churnData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Reports */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Relatórios Rápidos</CardTitle>
          <CardDescription>
            Baixe relatórios detalhados em PDF ou Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Relatório de Receita (PDF)
            </Button>
            <Button variant="outline" className="w-full">
              <Table className="h-4 w-4 mr-2" />
              Relatório de Usuários (Excel)
            </Button>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Relatório de Assinaturas (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}