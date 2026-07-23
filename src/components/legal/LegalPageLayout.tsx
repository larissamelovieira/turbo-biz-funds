import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const homeLink = isAuthenticated ? "/dashboard" : "/";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to={homeLink} className="font-bold text-lg text-primary shrink-0">
            Doutor Cash
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {lastUpdated}</p>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-3">
          {children}
        </div>

        <p className="text-xs text-muted-foreground mt-10 pt-6 border-t border-border">
          Dúvidas? Fale com a gente em{" "}
          <a href="mailto:contato@doutorcash.com" className="text-primary hover:underline">
            contato@doutorcash.com
          </a>
        </p>
      </main>
    </div>
  );
}
