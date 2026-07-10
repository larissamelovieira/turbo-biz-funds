import { memo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  StatCard,
  ExpenseChart,
  CategoryChart,
  TransactionList,
  GoalsProgress,
  MonthComparisonChart,
  RecurrenceChart,
} from "@/features/dashboard/components";
import { useDashboardData } from "@/features/dashboard/hooks";
import { useGenerateRecurrences } from "@/features/recurrences/hooks/use-recurrences";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const RECURRENCES_SYNC_KEY = "recurrences-synced-month";

function useSyncRecurrencesOnce(refetchDashboard: () => void) {
  const generateRecurrences = useGenerateRecurrences();

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (sessionStorage.getItem(RECURRENCES_SYNC_KEY) === currentMonth) return;
    sessionStorage.setItem(RECURRENCES_SYNC_KEY, currentMonth);
    generateRecurrences.mutate(undefined, {
      onSuccess: () => {
        refetchDashboard();
      },
      onError: () => {
        sessionStorage.removeItem(RECURRENCES_SYNC_KEY);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const DashboardSkeleton = () => (
  <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-4 lg:space-y-5">
    <div className="space-y-1.5">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[110px] rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Skeleton className="h-64 md:col-span-1 lg:col-span-4 rounded-2xl" />
      <Skeleton className="h-64 md:col-span-1 lg:col-span-3 rounded-2xl" />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
);

const UserDashboard = memo(() => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardData();
  useSyncRecurrencesOnce(refetch);

  const firstName = user?.name?.split(" ")[0]?.trim() || "Usuário";

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !dashboardData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Falha ao carregar o dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-4 lg:space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-foreground tracking-tight">
          Olá, {firstName}! 👋
        </h2>
        <p className="text-sm lg:text-[15px] text-muted-foreground mt-0.5">
          Aqui está o resumo das suas finanças deste mês
        </p>
      </div>

      {/* Stat cards — 2 cols mobile, 3 cols sm+ */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {dashboardData.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Charts — stack on mobile, side by side on md+ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-1 lg:col-span-4">
          <ExpenseChart data={dashboardData.expensesByDay} />
        </div>
        <div className="md:col-span-1 lg:col-span-3">
          <CategoryChart data={dashboardData.categoryExpenses} />
        </div>
      </div>

      {/* Recurrences */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecurrenceChart />
        <MonthComparisonChart />
      </div>

      {/* Transactions + Goals */}
      <div className="grid gap-4 md:grid-cols-2">
        <TransactionList transactions={dashboardData.recentTransactions} />
        <GoalsProgress goals={dashboardData.goals} />
      </div>
    </div>
  );
});

UserDashboard.displayName = "UserDashboard";

export default UserDashboard;
