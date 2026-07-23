import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  // Valor observado (ex: pathname) pra limpar o erro sozinho ao trocar de
  // tela. Ao contrário de usar `key`, isso só reseta quando há erro —
  // não remonta a árvore inteira (e o estado dela, ex: tutorial) em toda
  // navegação normal, sem erro nenhum.
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.handleReset();
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-destructive">Ops!</h1>
              <p className="text-muted-foreground">
                Algo deu errado. Tente novamente ou volte para a página inicial.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Tentar novamente
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
