import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { storage } from "@/lib/storage";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Login = lazyWithRetry(() => import("./pages/Login"));
const Cadastro = lazyWithRetry(() => import("./pages/Cadastro"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Pagamento = lazyWithRetry(() => import("./pages/Pagamento"));
const PagamentoSucesso = lazyWithRetry(() => import("./pages/PagamentoSucesso"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const TermosDeUso = lazyWithRetry(() => import("./pages/legal/TermosDeUso"));
const PoliticaDePrivacidade = lazyWithRetry(() => import("./pages/legal/PoliticaDePrivacidade"));
const Lgpd = lazyWithRetry(() => import("./pages/legal/Lgpd"));
const UserDashboard = lazyWithRetry(() => import("./pages/UserDashboard"));
const NotificationsPage = lazyWithRetry(() => import("./pages/Notifications"));
const SupportPage = lazyWithRetry(() => import("./pages/Support"));
const AdminNotificationsPage = lazyWithRetry(() => import("./pages/admin/AdminNotifications"));
const AdminSettingsPage = lazyWithRetry(() => import("./pages/admin/AdminSettings"));
const AdminReportsPage = lazyWithRetry(() => import("./pages/admin/AdminReports"));
const AdminSupportPage = lazyWithRetry(() => import("./pages/admin/AdminSupport"));

const UserLayout = lazyWithRetry(() => import("./layouts/UserLayout"));
const AdminLayout = lazyWithRetry(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const AdminClients = lazyWithRetry(() => import("./pages/admin/AdminUsers"));
const AdminPlans = lazyWithRetry(() => import("./pages/admin/AdminPlans"));
const AdminSubscriptions = lazyWithRetry(() => import("./pages/admin/AdminSubscriptions"));
const AdminCategoriesPage = lazyWithRetry(() => import("./pages/admin/AdminCategories"));

const TransactionsPage = lazyWithRetry(() => import("./pages/Transactions"));
const GoalsPage = lazyWithRetry(() => import("./pages/Goals"));
const CardsPage = lazyWithRetry(() => import("./pages/Cards"));
const WhatsAppPage = lazyWithRetry(() => import("./pages/WhatsApp"));
const SettingsPage = lazyWithRetry(() => import("./pages/Settings"));
const RecorrenciasPage = lazyWithRetry(() => import("./pages/Recorrencias"));
const RecorrenciaDetalhePage = lazyWithRetry(() => import("./pages/RecorrenciaDetalhe"));
const RelatorioPage = lazyWithRetry(() => import("./pages/Relatorio"));

const PageLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AuthLoadingPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AuthLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <AuthLoadingPage />
  </div>
);

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingFallback />;

  // Token exists but state not yet committed (race condition after register/login)
  if (!isAuthenticated && storage.getToken()) return <AuthLoadingFallback />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingFallback />;

  // Token exists but state not yet committed (race condition after register/login)
  if (!isAuthenticated && storage.getToken()) return <AuthLoadingFallback />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AuthLoadingFallback />;
  if (!isAuthenticated && storage.getToken()) return <AuthLoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Bloqueia acesso ao dashboard enquanto pagamento pendente
  const pendingPlan = sessionStorage.getItem("pendingPaymentPlan");
  if (pendingPlan) {
    return <Navigate to={`/pagamento?plan=${pendingPlan}`} replace />;
  }

  // Somente planos pagos acessam o dashboard
  const justPaid = sessionStorage.getItem("paymentCompleted");
  if (user?.plan !== "free") {
    if (justPaid) sessionStorage.removeItem("paymentCompleted");
  } else if (justPaid) {
    // plan still free but payment completed — allow access while waiting for update
  } else {
    return <Navigate to="/pagamento?plan=pro-annual" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  if (isAuthenticated) {
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    const pending = sessionStorage.getItem("postRegisterRedirect");
    if (pending) {
      sessionStorage.removeItem("postRegisterRedirect");
      return <Navigate to={pending} replace />;
    }
    // Free user logging in → go directly to payment (same flow as registration)
    if (user?.plan === "free") {
      sessionStorage.setItem("pendingPaymentPlan", "pro-annual");
      return <Navigate to="/pagamento?plan=pro-annual" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => navigate("/login", { replace: true });
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [navigate]);

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/termos-de-uso" element={<TermosDeUso />} />
        <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
        <Route path="/lgpd" element={<Lgpd />} />
        <Route path="/recuperar-senha" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/redefinir-senha" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
        <Route path="/pagamento" element={
          <PrivateRoute><Pagamento /></PrivateRoute>
        } />
        <Route path="/pagamento-sucesso" element={
          <PrivateRoute><PagamentoSucesso /></PrivateRoute>
        } />

        <Route
          path="/dashboard"
          element={
            <DashboardRoute>
              <UserLayout />
            </DashboardRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="transacoes" element={<TransactionsPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="cartoes" element={<CardsPage />} />
          <Route path="recorrencias" element={<RecorrenciasPage />} />
          <Route path="recorrencias/:id" element={<RecorrenciaDetalhePage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="suporte" element={<SupportPage />} />
          <Route path="relatorio" element={<RelatorioPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clientes" element={<AdminClients />} />
          <Route path="assinaturas" element={<AdminSubscriptions />} />
          <Route path="planos" element={<AdminPlans />} />
          <Route path="configuracoes" element={<AdminSettingsPage />} />
          <Route path="relatorios" element={<AdminReportsPage />} />
          <Route path="notificacoes" element={<AdminNotificationsPage />} />
          <Route path="suporte" element={<AdminSupportPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const AppShell = () => (
  <ThemeProvider storageKey="doutorcash-theme">
    <TooltipProvider>
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </ThemeProvider>
);

export default AppShell;
