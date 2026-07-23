import { 
  HelpCircle, MessageCircle, Mail, Phone, FileText, 
  ChevronRight, ExternalLink, Copy, Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { storageKey as tutorialStorageKey } from "@/components/user/UserTutorial";

const SUPPORT_EMAIL = "contato@doutorcash.com";

const FAQ_ITEMS = [
  {
    question: "Como funciona o DoutorCash?",
    answer: "O DoutorCash é uma plataforma que organiza suas finanças pelo WhatsApp. Você envia mensagens, fotos ou áudios sobre seus gastos, e nossa IA categoriza automaticamente."
  },
  {
    question: "Preciso baixar algum aplicativo?",
    answer: "Não! O DoutorCash funciona diretamente pelo WhatsApp. Você só precisa de um navegador para acessar os relatórios e gráficos."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim! Utilizamos criptografia de ponta a ponta e seguimos rigorosamente a LGPD. Seus dados financeiros são protegidos."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. Basta acessar as configurações da sua conta."
  },
];

const SUPPORT_CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Resposta em até 2 horas (dias úteis)",
    value: "(35) 99953-7223",
    action: "https://wa.me/5535999537223",
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500"
  },
  {
    icon: Mail,
    title: "E-mail",
    description: "Resposta em até 24 horas",
    value: SUPPORT_EMAIL,
    action: `mailto:${SUPPORT_EMAIL}`,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500"
  },
  {
    icon: Phone,
    title: "Telefone (Emergencial)",
    description: "Disponível 24/7 para planos Business",
    value: "(11) 99999-9999",
    action: "tel:+5511999999999",
    color: "bg-violet-500/10",
    iconColor: "text-violet-500"
  },
];

export default function Support() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    const mailSubject = encodeURIComponent(subject || `Contato via painel — ${name}`);
    const mailBody = encodeURIComponent(
      `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`
    );
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`);
    toast.success("Seu app de e-mail foi aberto. Envie a mensagem para concluir o contato.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setIsSubmitting(false);
  };

  const openTutorial = () => {
    localStorage.removeItem(tutorialStorageKey(user?.id));
    navigate("/dashboard");
    window.location.reload();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  // Set page title
  if (typeof document !== "undefined") {
    document.title = "Suporte | DoutorCash";
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Central de Suporte
        </h1>
        <p className="text-muted-foreground mt-1">
          Estamos aqui para ajudar. Encontre respostas ou entre em contato conosco.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUPPORT_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <Card key={channel.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${channel.color}`}>
                      <Icon className={`h-5 w-5 ${channel.iconColor}`} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(channel.value, channel.title)}
                    >
                      {copied === channel.title ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="text-base">{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm mb-3">{channel.value}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(channel.action, "_blank", "noopener noreferrer")}
                  >
                    Contatar agora
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
          <CardDescription>
            Encontre respostas rápidas para as dúvidas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="border-b border-muted/30 pb-4 last:border-0 last:pb-0">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {item.question}
              </h3>
              <p className="text-sm text-muted-foreground pl-6">
                {item.answer}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Envie uma Mensagem</CardTitle>
          <CardDescription>
            Não encontrou o que procurava? Envie uma mensagem para nossa equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Resumo do seu problema"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  placeholder="Descreva detalhadamente sua dúvida ou problema..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Tutorial de Uso</p>
                  <p className="text-xs text-muted-foreground">
                    Reveja o passo a passo de como usar o DoutorCash
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={openTutorial}>
                Acessar
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-6 space-y-4">
          {[
            { title: "Termos de Uso", description: "Regras de uso da plataforma Doutor Cash", href: "/termos-de-uso" },
            { title: "Política de Privacidade", description: "Como tratamos seus dados pessoais", href: "/politica-de-privacidade" },
            { title: "LGPD", description: "Nossos direitos e compromissos com a proteção de dados", href: "/lgpd" },
          ].map((doc) => (
            <div key={doc.href} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => window.open(doc.href, "_blank")}>
                Acessar
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
