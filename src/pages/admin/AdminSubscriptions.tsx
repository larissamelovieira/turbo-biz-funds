import { useState } from "react";

// Função para formatar data em formato brasileiro
function formatDateToBR(dateString: string): string {
  if (!dateString) return "-";
  
  try {
    // Se já estiver no formato brasileiro (dd/mm/aaaa), retorna direto
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Se for ISO string (2026-06-03T16:57:46.134Z)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Doutor Cash não tem cobrança mensal recorrente: PIX é pago à vista (1x/ano)
// e cartão é parcelado em até 12x — nenhum dos dois é "/mês" de assinatura.
function billingUnitLabel(paymentMethod: string): string {
  const m = paymentMethod?.toLowerCase() ?? "";
  if (m.includes("pix")) return "/ano";
  if (m.includes("card") || m.includes("credit") || m.includes("cart")) return "/parcela";
  return "";
}

import {
  Search,
  Filter,
  MoreHorizontal,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  ArrowUpDown,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAdminSubscriptions } from "@/features/admin/hooks/use-admin-subscriptions";

const statusConfig = {
  Ativo: { label: "Ativo", color: "emerald", bg: "emerald-500/10", border: "emerald-200", icon: CheckCircle },
  Cancelado: { label: "Cancelado", color: "slate", bg: "slate-500/10", border: "slate-200", icon: XCircle },
  Trial: { label: "Trial", color: "blue", bg: "blue-500/10", border: "blue-200", icon: RefreshCw },
  Inativo: { label: "Inativo", color: "slate", bg: "slate-500/10", border: "slate-200", icon: Pause },
  Inadimplente: { label: "Inadimplente", color: "red", bg: "red-500/10", border: "red-200", icon: AlertCircle },
};

// Normalizar status para fallback
function getStatusConfig(status: string) {
  return statusConfig[status as keyof typeof statusConfig] ?? {
    label: status,
    color: "slate",
    bg: "slate-500/10",
    border: "slate-200",
    icon: AlertCircle,
  };
}

export default function AdminSubscriptions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { subscriptions, stats, isLoading, isError, error } = useAdminSubscriptions();

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = (sub.user?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.user?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || sub.plan === selectedPlan;
    const matchesStatus = selectedStatus === "all" || sub.status === selectedStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando assinaturas...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Falha ao carregar assinaturas</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total (Assinaturas)</p>
                  <p className="text-xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Trial</p>
                  <p className="text-xl font-bold">{stats.trial}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atrasadas</p>
                  <p className="text-xl font-bold text-red-500">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
               <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Plano" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos os planos</SelectItem>
                   {/* Plantas dinâmicas baseadas nos dados da API */}
                   {Array.from(new Set(subscriptions.map(s => s.plan))).map(plan => (
                     <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos</SelectItem>
                   {/* Status dinâmicos baseados no statusConfig */}
                   {Object.keys(statusConfig).map(status => (
                     <SelectItem key={status} value={status}>{statusConfig[status as keyof typeof statusConfig].label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {(searchTerm || selectedPlan !== "all" || selectedStatus !== "all") && (
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => {
                     setSearchTerm("");
                     setSelectedPlan("all");
                     setSelectedStatus("all");
                   }}
                 >
                   Limpar filtros
                 </Button>
               )}
             </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-muted/50 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Cliente</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Plano</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Valor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pagamento</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Próxima cobrança</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => {
                const status = getStatusConfig(sub.status);
                const StatusIcon = status.icon;
                return (
                  <TableRow key={sub.id} className="border-muted/50 hover:bg-muted/30">
                     <TableCell>
                       <div className="flex items-center gap-3">
                         <Avatar className="h-9 w-9">
                           <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                             {sub.user?.avatar ?? "?"}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-medium text-sm">{sub.user?.name ?? "N/A"}</p>
                           <p className="text-xs text-muted-foreground">{sub.user?.email ?? "N/A"}</p>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                         {sub.plan}
                       </Badge>
                     </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {sub.amount > 0 ? `R$ ${sub.amount.toFixed(2)}` : "Gratuito"}
                      </span>
                      {sub.amount > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">{billingUnitLabel(sub.paymentMethod)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.paymentMethod ? (
                        <div className="flex items-center gap-1.5">
                          {sub.paymentMethod.toLowerCase().includes("pix") ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold border border-green-200">
                              <CreditCard className="h-3 w-3" />
                              PIX
                            </span>
                          ) : sub.paymentMethod.toLowerCase().includes("card") || sub.paymentMethod.toLowerCase().includes("credit") || sub.paymentMethod.toLowerCase().includes("cart") ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-200">
                              <CreditCard className="h-3 w-3" />
                              Cartão
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{sub.paymentMethodLabel}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`bg-${status.bg} text-${status.color} border-${status.border}`}
                      >
                        <StatusIcon className={`h-3 w-3 mr-1.5`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDateToBR(sub.nextBilling)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Alterar plano
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renovar manualmente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {sub.status === "Ativo" && (
                            <DropdownMenuItem className="text-amber-500">
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {sub.status === "Inativo" && (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-border">
            {filteredSubscriptions.map((sub) => {
              const status = getStatusConfig(sub.status);
              const StatusIcon = status.icon;
              return (
                <div key={sub.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                          {sub.user?.avatar ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{sub.user?.name ?? "N/A"}</p>
                        <p className="text-xs text-muted-foreground truncate">{sub.user?.email ?? "N/A"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Alterar plano
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renovar manualmente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {sub.status === "Ativo" && (
                          <DropdownMenuItem className="text-amber-500">
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </DropdownMenuItem>
                        )}
                        {sub.status === "Inativo" && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {sub.plan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`bg-${status.bg} text-${status.color} border-${status.border}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1.5" />
                      {status.label}
                    </Badge>
                    {sub.paymentMethod && (
                      sub.paymentMethod.toLowerCase().includes("pix") ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold border border-green-200">
                          <CreditCard className="h-3 w-3" />
                          PIX
                        </span>
                      ) : sub.paymentMethod.toLowerCase().includes("card") || sub.paymentMethod.toLowerCase().includes("credit") || sub.paymentMethod.toLowerCase().includes("cart") ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-200">
                          <CreditCard className="h-3 w-3" />
                          Cartão
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{sub.paymentMethodLabel}</span>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground text-sm">
                      {sub.amount > 0 ? `R$ ${sub.amount.toFixed(2)}${billingUnitLabel(sub.paymentMethod)}` : "Gratuito"}
                    </span>
                    <span>Próxima cobrança: {formatDateToBR(sub.nextBilling)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-4 border-t border-muted/50">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredSubscriptions.length} de {subscriptions.length} assinaturas
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
    </div>
  );
}
