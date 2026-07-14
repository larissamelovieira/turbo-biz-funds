import { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { analytics } from "./lib/analytics";
import { I18nProvider } from "./lib/i18n-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { lazyWithRetry } from "./lib/lazyWithRetry";

const AppShell = lazyWithRetry(() => import("./AppShell"));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

const AppLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const PageLoading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    analytics.init();
  }, []);

  useEffect(() => {
    analytics.viewPage(location.pathname);
  }, [location]);

  return null;
}

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Remonta o boundary a cada troca de rota — sem isso, um erro capturado
  // numa tela fica preso mostrando "Ops!" até o usuário dar F5, mesmo
  // clicando em outro item do menu.
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}

const App = () => {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <ErrorBoundary>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
            <AuthProvider>
              <AnalyticsTracker />
              <RouteErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/*" element={<Suspense fallback={<AppLoading />}><AppShell /></Suspense>} />
                </Routes>
              </RouteErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;

export { PageLoading };
