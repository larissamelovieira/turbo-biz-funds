import { memo, useState } from "react";
import {
  User, Bell, Shield, Moon, Sun, CreditCard, Smartphone,
  ChevronRight, Download, Loader2, LogOut, Pencil, Check, X,
  Crown, Zap, Phone, Hash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useNavigate } from "react-router-dom";

const SUPPORT_EMAIL = "contato@doutorcash.com";

const PLAN_CONFIG = {
  free: { label: "Gratuito", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: null },
  pro: { label: "Pro", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: <Zap className="w-3 h-3" /> },
  business: { label: "Business", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: <Crown className="w-3 h-3" /> },
};

const SettingsPage = memo(() => {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", cpf: user?.cpf ?? "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // modals
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelPlanDialog, setShowCancelPlanDialog] = useState(false);
  const [isSendingCancelEmail, setIsSendingCancelEmail] = useState(false);
  const plan = user?.plan ?? "free";
  const planConfig = PLAN_CONFIG[plan];

  // ── Profile ────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }
    setIsSavingProfile(true);
    try {
      const cpfDigits = profileForm.cpf.replace(/\D/g, "");
      await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
        cpf: cpfDigits ? cpfDigits : null,
      });
      toast.success("Perfil atualizado!");
      setEditingProfile(false);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 422) {
        toast.error("CPF inválido. Verifique e tente novamente.");
      } else if (apiErr?.status === 409) {
        toast.error("Este CPF já está cadastrado em outra conta.");
      } else {
        toast.error("Não foi possível salvar. Tente novamente.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({ name: user?.name ?? "", phone: user?.phone ?? "", cpf: user?.cpf ?? "" });
    setEditingProfile(false);
  };

  // ── Password ───────────────────────────────────────────────
  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Informe a senha atual";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "Mínimo 8 caracteres";
    if (!/[A-Z]/.test(passwordForm.newPassword)) errors.newPassword = "Deve conter letra maiúscula";
    if (!/[0-9]/.test(passwordForm.newPassword)) errors.newPassword = "Deve conter um número";
    if (passwordForm.newPassword !== passwordForm.confirm) errors.confirm = "Senhas não coincidem";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});
    setIsSavingPassword(true);
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success("Senha alterada com sucesso!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirm: "" });
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 401) toast.error("Senha atual incorreta");
      else toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* ── Perfil ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Perfil</h3>
                <p className="text-xs text-muted-foreground">Suas informações pessoais</p>
              </div>
            </div>
            {!editingProfile && (
              <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
          </div>

          {/* Plan badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 border border-border">
            <span className="text-sm text-muted-foreground">Plano atual:</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${planConfig.color}`}>
              {planConfig.icon}
              {planConfig.label}
            </span>
          </div>

          {editingProfile ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome</Label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                      let masked = raw;
                      if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                      if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                      setProfileForm((p) => ({ ...p, phone: masked }));
                    }}
                    placeholder="(11) 99999-9999"
                    className="h-10 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">CPF <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={profileForm.cpf}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                      let masked = raw;
                      if (raw.length > 3) masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
                      if (raw.length > 6) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
                      if (raw.length > 9) masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
                      setProfileForm((p) => ({ ...p, cpf: masked }));
                    }}
                    placeholder="000.000.000-00"
                    className="h-10 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Email</Label>
                <Input value={user?.email ?? ""} disabled className="h-10 opacity-60" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-1.5">
                  {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSavingProfile} className="gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Nome" value={user?.name ?? "—"} />
              <InfoField label="Email" value={user?.email ?? "—"} />
              <InfoField label="Telefone" value={user?.phone ?? "Não informado"} />
              <InfoField label="CPF" value={user?.cpf ?? "Não informado"} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Segurança ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Segurança</h3>
              <p className="text-xs text-muted-foreground">Proteja sua conta</p>
            </div>
          </div>

          {!showPasswordForm ? (
            <Button variant="outline" className="w-full justify-between" onClick={() => setShowPasswordForm(true)}>
              <span>Alterar Senha</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-accent/30">
              <p className="text-sm font-medium text-foreground">Alterar senha</p>
              <PasswordInput
                label="Senha atual"
                value={passwordForm.currentPassword}
                onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
                error={passwordErrors.currentPassword}
              />
              <PasswordInput
                label="Nova senha"
                value={passwordForm.newPassword}
                onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
                error={passwordErrors.newPassword}
                hint="Mínimo 8 caracteres, 1 maiúscula e 1 número"
              />
              <PasswordInput
                label="Confirmar nova senha"
                value={passwordForm.confirm}
                onChange={(v) => setPasswordForm((p) => ({ ...p, confirm: v }))}
                error={passwordErrors.confirm}
              />
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleChangePassword} disabled={isSavingPassword} className="gap-1.5">
                  {isSavingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar senha
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowPasswordForm(false); setPasswordErrors({}); setPasswordForm({ currentPassword: "", newPassword: "", confirm: "" }); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Notificações ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notificações</h3>
              <p className="text-xs text-muted-foreground">Configure como deseja receber alertas</p>
            </div>
          </div>
          <div className="space-y-1">
            <NotifRow icon={<Smartphone className="w-4 h-4 text-primary" />} label="WhatsApp" desc="Resumos e alertas via WhatsApp" />
            <Separator />
            <NotifRow icon={<CreditCard className="w-4 h-4 text-primary" />} label="Vencimentos" desc="Alertas de contas a pagar" />
          </div>
        </CardContent>
      </Card>

      {/* ── Preferências ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Preferências</h3>
              <p className="text-xs text-muted-foreground">Personalize sua experiência</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Modo {isDark ? "Escuro" : "Claro"}</p>
              <p className="text-xs text-muted-foreground">Alterna entre tema claro e escuro</p>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-primary" />
          </div>
        </CardContent>
      </Card>

      {/* ── Dados e Conta ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Dados e Conta</h3>
              <p className="text-xs text-muted-foreground">Gerencie seus dados pessoais (LGPD)</p>
            </div>
          </div>

          <Button variant="outline" className="w-full justify-between" onClick={() => toast.info("Exportação de dados disponível em breve")}>
            <span>Exportar Meus Dados</span>
            <Download className="w-4 h-4 text-muted-foreground" />
          </Button>

          {plan === "pro" && (
            <Button
              variant="outline"
              className="w-full justify-between border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:text-orange-400"
              onClick={() => setShowCancelPlanDialog(true)}
            >
              <span>Cancelar Assinatura</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-between border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400"
            onClick={() => setShowDeleteDialog(true)}
          >
            <span>Excluir Conta</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* ── Sair ── */}
      <Button
        variant="ghost"
        className="w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>

      {/* ── Cancel Plan Dialog ── */}
      <AlertDialog open={showCancelPlanDialog} onOpenChange={setShowCancelPlanDialog}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura Pro?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, um email de solicitação de cancelamento e estorno será enviado para nossa equipe. Você continuará com acesso até a análise da solicitação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingCancelEmail}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isSendingCancelEmail}
              onClick={(e) => {
                e.preventDefault();
                setIsSendingCancelEmail(true);
                const recipient = (import.meta.env.VITE_CANCELLATION_EMAIL as string) || SUPPORT_EMAIL;
                const subject = encodeURIComponent(`Cancelamento de Assinatura Pro - ${user?.name}`);
                const body = encodeURIComponent(
                  `Olá,\n\nSolicito o cancelamento da minha assinatura Pro e o estorno do valor pago.\n\n` +
                  `Nome: ${user?.name ?? "—"}\n` +
                  `Email: ${user?.email ?? "—"}\n` +
                  `Telefone: ${user?.phone ?? "—"}\n` +
                  `ID da conta: ${user?.id ?? "—"}\n\n` +
                  `Data da solicitação: ${new Date().toLocaleString("pt-BR")}\n\n` +
                  `Por favor, realize o estorno do valor e confirme o cancelamento.\n\nAtenciosamente,\n${user?.name}`
                );
                window.open(`mailto:${recipient}?subject=${subject}&body=${body}`);
                toast.success("Email de cancelamento aberto. Envie para concluir a solicitação.");
                setIsSendingCancelEmail(false);
                setShowCancelPlanDialog(false);
              }}
            >
              Solicitar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados (transações, metas, cartões) serão apagados de forma irreversível em até 30 dias conforme a LGPD.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                const subject = encodeURIComponent(`Exclusão de Conta - ${user?.name}`);
                const body = encodeURIComponent(
                  `Olá,\n\nSolicito a exclusão permanente da minha conta e de todos os meus dados, conforme a LGPD.\n\n` +
                  `Nome: ${user?.name ?? "—"}\n` +
                  `Email: ${user?.email ?? "—"}\n` +
                  `Telefone: ${user?.phone ?? "—"}\n` +
                  `ID da conta: ${user?.id ?? "—"}\n\n` +
                  `Data da solicitação: ${new Date().toLocaleString("pt-BR")}\n\nAtenciosamente,\n${user?.name}`
                );
                window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
                toast.success("Email de solicitação de exclusão aberto. Envie para concluir o pedido.");
                setShowDeleteDialog(false);
              }}
            >
              Sim, excluir minha conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

SettingsPage.displayName = "SettingsPage";
export default SettingsPage;

// ── Sub-components ─────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

function PasswordInput({ label, value, onChange, error, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-9 pr-16 text-sm ${error ? "border-destructive" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-1"
        >
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NotifRow({ icon, label, desc }: {
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
    </div>
  );
}
