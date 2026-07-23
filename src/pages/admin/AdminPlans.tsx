/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Users,
  DollarSign,
  Zap,
  Crown,
  Sparkles,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminPlans,
  getAdminPlanIcon,
  getAdminPlanColor,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  type CreatePlanPayload,
} from "@/features/admin/hooks/use-admin-plans";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  Ativo: "bg-success/10 text-success",
  Trial: "bg-warning/10 text-warning",
  Inadimplente: "bg-destructive/10 text-destructive",
  Cancelado: "bg-muted text-muted-foreground",
};

// ── Pricing config (stored locally until backend supports these fields) ────────

interface PlanPricingConfig {
  originalPrice?: number;
  pixPrice?: number;
  installments?: number;
  installmentValue?: number;
  totalInstallmentValue?: number;
}

const PRICING_STORAGE_KEY = "adminPlanPricingConfig";

function loadPricingConfig(): Record<string, PlanPricingConfig> {
  try {
    return JSON.parse(localStorage.getItem(PRICING_STORAGE_KEY) ?? "{}");
  } catch { return {}; }
}

function savePricingConfig(planId: string, config: PlanPricingConfig) {
  const all = loadPricingConfig();
  all[planId] = config;
  localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(all));
}

function getPlanPricing(planId: string): PlanPricingConfig {
  return loadPricingConfig()[planId] ?? {};
}

const EMPTY_PRICING: PlanPricingConfig = {
  originalPrice: undefined,
  pixPrice: undefined,
  installments: undefined,
  installmentValue: undefined,
  totalInstallmentValue: undefined,
};

export default function AdminPlans() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { plans, subscriptions, isLoading, isError, error } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [newPlan, setNewPlan] = useState<Partial<CreatePlanPayload>>({
    name: "",
    description: "",
    price: 0,
    billingPeriod: "mês",
    features: [],
    popular: false,
  });
  const [newPricing, setNewPricing] = useState<PlanPricingConfig>({ ...EMPTY_PRICING });
  const [newFeatureInput, setNewFeatureInput] = useState("");

  const [editPlanData, setEditPlanData] = useState<Partial<CreatePlanPayload>>({});
  const [editPricing, setEditPricing] = useState<PlanPricingConfig>({ ...EMPTY_PRICING });
  const [editFeatureInput, setEditFeatureInput] = useState("");

  const selectedPlan = plans.find((p) => p.id === editingPlanId) ?? null;
  const totalMRR = plans.reduce((sum, plan) => sum + (plan.mrr ?? 0), 0);
  const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscribers ?? 0), 0);

  const openEditDialog = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setEditPlanData({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
        features: plan.features,
        popular: plan.popular,
      });
      setEditPricing(getPlanPricing(planId));
      setEditFeatureInput("");
    }
    setEditingPlanId(planId);
    setIsEditDialogOpen(true);
  };

  const handleEditAddFeature = () => {
    if (!editFeatureInput.trim()) return;
    const currentFeatures = editPlanData.features ?? [];
    const newFeatures = typeof currentFeatures[0] === 'string' 
      ? [...currentFeatures, editFeatureInput.trim()]
      : [...currentFeatures.map((f: any) => f.name), editFeatureInput.trim()];
    setEditPlanData({ ...editPlanData, features: newFeatures as any });
    setEditFeatureInput("");
  };

  const handleEditRemoveFeature = (index: number) => {
    const currentFeatures = editPlanData.features ?? [];
    const newFeatures = currentFeatures.filter((_: any, i: number) => i !== index);
    setEditPlanData({ ...editPlanData, features: newFeatures as any });
  };

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === "object") {
      // Erro do axios com response
      if ("response" in error) {
        const response = (error as { response?: { data?: unknown } }).response;
        if (response?.data) {
          const data = response.data;
          // Se for um objeto com message
          if (typeof data === "object" && "message" in data) {
            return String((data as { message: string }).message);
          }
          // Se for string
          if (typeof data === "string") {
            return data;
          }
          // Se for array de erros (common em 422)
          if (Array.isArray(data)) {
            return data.map((e: any) => e.message || e).join(", ");
          }
        }
      }
      // Erro direto com message
      if ("message" in error) {
        return String((error as { message: string }).message);
      }
    }
    return fallback;
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.description) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
// Converter features para formato que o Swagger espera: { name, included }[]
    const featuresList = (newPlan.features ?? []).map((f: any) => {
      if (typeof f === 'object' && f !== null && 'name' in f) {
        return f;
      }
      return { name: String(f), included: true };
    });

    // Se não tiver features, adicionar uma padrão
    if (featuresList.length === 0) {
      featuresList.push({ name: "Funcionalidade básica", included: true });
    }

    // Payload direto conforme documentação do backend (sem wrapper "data")
    const payload = {
      name: newPlan.name,
      description: newPlan.description,
      price: newPlan.price,
      billingPeriod: newPlan.billingPeriod === "MONTHLY" ? "mês" : newPlan.billingPeriod === "YEARLY" ? "ano" : newPlan.billingPeriod,
      features: featuresList,
      popular: newPlan.popular ?? false,
    };
    
    createPlan.mutate(payload as CreatePlanPayload, {
      onSuccess: (res: any) => {
        const newId = res?.data?.id ?? res?.id ?? Date.now().toString();
        savePricingConfig(newId, newPricing);
        toast({ title: "Plano criado com sucesso" });
        setIsCreateDialogOpen(false);
        setNewPlan({ name: "", description: "", price: 0, billingPeriod: "mês", features: [], popular: false });
        setNewPricing({ ...EMPTY_PRICING });
        setNewFeatureInput("");
      },
      onError: (err: unknown) => {
        // Tentar extrair detalhes do erro
        let errorDetails = "Verifique os dados e tente novamente";
        if (err && typeof err === "object") {
          const axiosErr = err as { 
            response?: { 
              data?: unknown; 
              status?: number;
              statusText?: string;
              headers?: unknown;
            }; 
          };
          if (axiosErr.response) {
            // Tentar obter detalhes específicos
            const data = axiosErr.response.data as any;
            if (data && typeof data === 'object') {
              if (data.errors) {
                errorDetails = `Erros: ${JSON.stringify(data.errors)}`;
              } else if (data.message) {
                errorDetails = data.message;
              } else if (Array.isArray(data)) {
                errorDetails = data.join(', ');
              }
            } else {
              errorDetails = `Status: ${axiosErr.response.status} - ${axiosErr.response.statusText}`;
            }
          }
        }
        toast({
          title: "Erro ao criar plano",
          description: errorDetails,
          variant: "destructive",
        });
      },
    });
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    const currentFeatures = newPlan.features ?? [];
    const newFeatures = typeof currentFeatures[0] === 'string' 
      ? [...currentFeatures, newFeatureInput.trim()]
      : [...currentFeatures.map((f: any) => f.name), newFeatureInput.trim()];
    setNewPlan({ ...newPlan, features: newFeatures as any });
    setNewFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    const currentFeatures = newPlan.features ?? [];
    const newFeatures = currentFeatures.filter((_: any, i: number) => i !== index);
    setNewPlan({ ...newPlan, features: newFeatures as any });
  };

  const handleUpdatePlan = () => {
    if (!editingPlanId) return;
    
    // Converter features para formato que o Swagger espera: { name, included }[]
    const featuresList = (editPlanData.features ?? []).map((f: any) => {
      if (typeof f === 'object' && f !== null && 'name' in f) {
        return f;
      }
      return { name: String(f), included: true };
    });

    // Se não tiver features, manter vazio ou padrão
    const features = featuresList.length > 0 ? featuresList : [];

    const payload = {
      ...editPlanData,
      features,
      // billingPeriod em formato texto
      billingPeriod: editPlanData.billingPeriod === "MONTHLY" ? "mês" : editPlanData.billingPeriod === "YEARLY" ? "ano" : editPlanData.billingPeriod,
    };

    updatePlan.mutate(
      { id: editingPlanId, ...payload },
      {
        onSuccess: () => {
          savePricingConfig(editingPlanId, editPricing);
          toast({ title: "Plano atualizado com sucesso" });
          setIsEditDialogOpen(false);
        },
        onError: (err: unknown) => {
          let errorDetails = "Tente novamente";
          if (err && typeof err === "object") {
            const axiosErr = err as { 
              response?: { 
                data?: unknown; 
                status?: number;
                statusText?: string;
              }; 
            };
            if (axiosErr.response) {
              errorDetails = `Status: ${axiosErr.response.status} - ${JSON.stringify(axiosErr.response.data)}`;
            }
          }
          
          toast({
            title: "Erro ao atualizar plano",
            description: errorDetails,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeletePlan = (planId: string) => {
    if (!planId) {
      toast({ title: "ID do plano inválido", variant: "destructive" });
      return;
    }
    deletePlan.mutate(planId, {
      onSuccess: () => {
        toast({ title: "Plano desativado com sucesso" });
      },
      onError: (err: unknown) => {
        // Tentar extrair detalhes do erro
        let errorDetails = "O plano não pôde ser removido";
        if (err && typeof err === "object") {
          const axiosErr = err as { 
            response?: { 
              data?: unknown; 
              status?: number;
              statusText?: string;
            }; 
          };
          if (axiosErr.response) {
            errorDetails = `Status: ${axiosErr.response.status} - ${JSON.stringify(axiosErr.response.data)}`;
          }
        }
        
        toast({
          title: "Erro ao desativar plano",
          description: errorDetails,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando planos...</span>
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
          <p className="text-destructive font-medium">Falha ao carregar planos</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">R$ {totalMRR.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalSubscribers}</div>
                  <p className="text-sm text-muted-foreground">Total de assinantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">R$ {totalSubscribers > 0 ? (totalMRR / totalSubscribers).toFixed(0) : "0"}</div>
                  <p className="text-sm text-muted-foreground">Ticket médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const PlanIcon = getAdminPlanIcon(plan.name.toLowerCase());
                const planColor = getAdminPlanColor(plan.name.toLowerCase());
                return (
                <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Mais Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${planColor}`}>
                        <PlanIcon className="h-6 w-6" />
                      </div>
                      <DropdownMenu open={openDropdownId === plan.id} onOpenChange={(open) => {
                          if (open) {
                            setOpenDropdownId(plan.id);
                          } else {
                            setOpenDropdownId(null);
                          }
                        }}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setOpenDropdownId(openDropdownId === plan.id ? null : plan.id)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                          <DropdownMenuItem onClick={() => { openEditDialog(plan.id); setOpenDropdownId(null); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar plano
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { handleDeletePlan(plan.id); setOpenDropdownId(null); }}
                            disabled={deletePlan.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletePlan.isPending ? "Desativando..." : "Desativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      {(() => {
                        const pricing = getPlanPricing(plan.id);
                        if (pricing.originalPrice || pricing.pixPrice) {
                          return (
                            <div className="space-y-1">
                              {pricing.originalPrice && (
                                <p className="text-xs text-muted-foreground line-through">De R$ {pricing.originalPrice.toFixed(2).replace(".", ",")}</p>
                              )}
                              {pricing.pixPrice && (
                                <p className="text-2xl font-bold">R$ {pricing.pixPrice.toFixed(2).replace(".", ",")} <span className="text-sm font-normal text-muted-foreground">no PIX</span></p>
                              )}
                              {pricing.installments && pricing.installmentValue && (
                                <p className="text-sm text-muted-foreground">
                                  ou {pricing.installments}x de R$ {pricing.installmentValue.toFixed(2).replace(".", ",")}
                                  {pricing.totalInstallmentValue && ` (R$ ${pricing.totalInstallmentValue.toFixed(2).replace(".", ",")} total)`}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return (
                          <>
                            <span className="text-4xl font-bold">
                              {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                            </span>
                            {plan.price > 0 && (
                              <span className="text-muted-foreground">
                                /{plan.billingPeriod === "YEARLY" ? "ano" : "mês"}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{plan.subscribers}</div>
                        <p className="text-xs text-muted-foreground">Assinantes</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">R$ {plan.mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Receita</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {plan.features.map((feature, index) => {
                        const featureName = typeof feature === 'string' ? feature : feature.name;
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-success shrink-0" />
                            <span className="text-sm">{featureName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Plano</DialogTitle>
                    <DialogDescription>
                      Configure os detalhes do novo plano
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="plan-name">Nome do plano</Label>
                      <Input
                        id="plan-name"
                        placeholder="Ex: Enterprise"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="plan-description">Descrição</Label>
                      <Textarea
                        id="plan-description"
                        placeholder="Descreva o plano..."
                        value={newPlan.description}
                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="plan-price">Preço base (R$)</Label>
                        <Input
                          id="plan-price"
                          type="number"
                          placeholder="0"
                          value={newPlan.price}
                          onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="plan-period">Período</Label>
                        <Select
                          value={newPlan.billingPeriod}
                          onValueChange={(value) => setNewPlan({ ...newPlan, billingPeriod: value })}
                        >
                          <SelectTrigger id="plan-period">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mês">Mensal</SelectItem>
                            <SelectItem value="semestre">Semestral</SelectItem>
                            <SelectItem value="ano">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Pricing display fields */}
                    <div className="rounded-lg border border-dashed border-border p-4 space-y-3 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exibição de Preços no Site</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Preço De (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 197.00"
                            value={newPricing.originalPrice ?? ""}
                            onChange={(e) => setNewPricing({ ...newPricing, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Preço PIX (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 99.90"
                            value={newPricing.pixPrice ?? ""}
                            onChange={(e) => setNewPricing({ ...newPricing, pixPrice: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Nº de Parcelas</Label>
                          <Input
                            type="number"
                            placeholder="Ex: 12"
                            value={newPricing.installments ?? ""}
                            onChange={(e) => setNewPricing({ ...newPricing, installments: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Valor da Parcela (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 12.90"
                            value={newPricing.installmentValue ?? ""}
                            onChange={(e) => setNewPricing({ ...newPricing, installmentValue: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Valor Total Parcelado (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 154.80"
                          value={newPricing.totalInstallmentValue ?? ""}
                          onChange={(e) => setNewPricing({ ...newPricing, totalInstallmentValue: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Funcionalidades do Plano</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Relatórios avançados"
                          value={newFeatureInput}
                          onChange={(e) => setNewFeatureInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                        />
                        <Button type="button" variant="outline" onClick={handleAddFeature}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newPlan.features && newPlan.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newPlan.features.map((feature: any, index: number) => (
                            <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                              {typeof feature === 'string' ? feature : feature.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                onClick={() => handleRemoveFeature(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="plan-popular">Plano popular</Label>
                      <Switch
                        id="plan-popular"
                        checked={newPlan.popular}
                        onCheckedChange={(checked) => setNewPlan({ ...newPlan, popular: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreatePlan} disabled={createPlan.isPending}>
                      {createPlan.isPending ? "Criando..." : "Criar Plano"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas Ativas</CardTitle>
                <CardDescription>Todas as assinaturas da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Próxima cobrança</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.client}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{sub.startDate}</TableCell>
                        <TableCell className="text-muted-foreground">{sub.nextBilling}</TableCell>
                        <TableCell className="text-right font-medium">
                          {sub.amount > 0 ? `R$ ${sub.amount}` : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                              <DropdownMenuItem>Alterar plano</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Cancelar</DropdownMenuItem>
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
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="py-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm min-w-0 truncate">{sub.client}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Alterar plano</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{sub.plan}</Badge>
                        <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Início {sub.startDate} · Próxima {sub.nextBilling}</span>
                        <span className="font-medium text-foreground text-sm">
                          {sub.amount > 0 ? `R$ ${sub.amount}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Plano: {selectedPlan?.name}</DialogTitle>
              <DialogDescription>
                Modifique os detalhes do plano
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome do plano</Label>
                  <Input
                    id="edit-name"
                    value={editPlanData.name ?? selectedPlan.name}
                    onChange={(e) => setEditPlanData({ ...editPlanData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    value={editPlanData.description ?? selectedPlan.description}
                    onChange={(e) => setEditPlanData({ ...editPlanData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Preço base (R$)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editPlanData.price ?? selectedPlan.price}
                      onChange={(e) => setEditPlanData({ ...editPlanData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-period">Período</Label>
                    <Select
                      value={editPlanData.billingPeriod ?? selectedPlan.billingPeriod}
                      onValueChange={(value) => setEditPlanData({ ...editPlanData, billingPeriod: value })}
                    >
                      <SelectTrigger id="edit-period">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mês">Mensal</SelectItem>
                        <SelectItem value="semestre">Semestral</SelectItem>
                        <SelectItem value="ano">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing display fields */}
                <div className="rounded-lg border border-dashed border-border p-4 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exibição de Preços no Site</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Preço De (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 197.00"
                        value={editPricing.originalPrice ?? ""}
                        onChange={(e) => setEditPricing({ ...editPricing, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Preço PIX (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 99.90"
                        value={editPricing.pixPrice ?? ""}
                        onChange={(e) => setEditPricing({ ...editPricing, pixPrice: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Nº de Parcelas</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 12"
                        value={editPricing.installments ?? ""}
                        onChange={(e) => setEditPricing({ ...editPricing, installments: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Valor da Parcela (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 12.90"
                        value={editPricing.installmentValue ?? ""}
                        onChange={(e) => setEditPricing({ ...editPricing, installmentValue: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Valor Total Parcelado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 154.80"
                      value={editPricing.totalInstallmentValue ?? ""}
                      onChange={(e) => setEditPricing({ ...editPricing, totalInstallmentValue: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Funcionalidades do Plano</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Relatórios avançados"
                      value={editFeatureInput}
                      onChange={(e) => setEditFeatureInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleEditAddFeature())}
                    />
                    <Button type="button" variant="outline" onClick={handleEditAddFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {editPlanData.features && editPlanData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editPlanData.features.map((feature: any, index: number) => (
                        <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                          {typeof feature === 'string' ? feature : feature.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                            onClick={() => handleEditRemoveFeature(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-popular">Plano popular</Label>
                  <Switch
                    id="edit-popular"
                    checked={editPlanData.popular ?? selectedPlan.popular}
                    onCheckedChange={(checked) => setEditPlanData({ ...editPlanData, popular: checked })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdatePlan} disabled={updatePlan.isPending}>
                {updatePlan.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
