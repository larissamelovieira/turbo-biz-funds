import { memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n-provider";

const FAQ = memo(() => {
  const { t, locale } = useI18n();

  const FAQS = locale === "pt" ? [
    {
      question: "O que é o Doutor Cash?",
      answer: "O Doutor Cash é um assistente financeiro com inteligência artificial que ajuda você a organizar sua vida financeira pelo WhatsApp, sem precisar preencher planilhas.\n\nExemplo:\n• \"Recebi R$ 2.000 de um cliente.\"\n• \"Abasteci o carro e gastei R$ 180.\"\n\nO sistema registra automaticamente suas movimentações.",
    },
    {
      question: "Preciso baixar algum aplicativo?",
      answer: "Não! Tudo funciona pelo WhatsApp que você já usa no dia a dia. O dashboard fica no navegador do celular ou computador — sem nada para instalar. É só conectar e começar a usar.",
    },
    {
      question: "Como funciona na prática?",
      answer: "Super simples: você manda uma mensagem no WhatsApp dizendo 'gastei 50 no mercado', ou até um áudio. O Assistente Financeiro entende, categoriza e salva pra você. Depois é só acessar o dashboard ou perguntar 'quanto gastei esse mês?' no próprio WhatsApp.",
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim! Usamos criptografia de ponta a ponta e servidores seguros. Seus dados financeiros nunca são compartilhados com terceiros. Você pode exportar ou deletar tudo a qualquer momento.",
    },
  ] : locale === "en" ? [
    {
      question: "Do I need to download any app?",
      answer: "No! Everything works through WhatsApp that you already use daily. The dashboard is in your phone or computer browser — nothing to install. Just connect and start using.",
    },
    {
      question: "How does it work in practice?",
      answer: "Super simple: you send a WhatsApp message saying 'spent 50 at the market', or even a voice note. The Financial Assistant understands, categorizes and saves it for you. Then just access the dashboard or ask 'how much did I spend this month?' on WhatsApp.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use end-to-end encryption and secure servers. Your financial data is never shared with third parties. You can export or delete everything at any time.",
    },
  ] : [
    {
      question: "¿Necesito descargar alguna aplicación?",
      answer: "¡No! Todo funciona a través de WhatsApp que ya usas a diario. El dashboard está en el navegador de tu celular o computadora — nada que instalar. Solo conecta y comienza a usar.",
    },
    {
      question: "¿Cómo funciona en la práctica?",
      answer: "Súper simple: mandas un mensaje por WhatsApp diciendo 'gasté 50 en el mercado', o incluso un audio. La IA entiende, categoriza y guarda para ti. Luego solo accede al dashboard o pregunta 'cuánto gasté este mes?' en WhatsApp.",
    },
    {
      question: "¿Mis datos están seguros?",
      answer: "¡Sí! Usamos encriptación de extremo a extremo y servidores seguros. Tus datos financieros nunca se comparten con terceros. Puedes exportar o eliminar todo en cualquier momento.",
    },
  ] as const;

  return (
    <section id="faq" className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[#E5E7EB] text-sm font-medium mb-4">
            {t("landing", "faqBadge")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
            {t("landing", "faqTitle")}
          </h2>
          <p className="text-lg text-white/60">
            {t("landing", "faqSubtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-6"
              >
                <AccordionTrigger className="hover:text-[#E5E7EB] text-white py-5">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-white/60 pb-5 whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/60">
            {t("landing", "faqStillQuestions")}{" "}
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E5E7EB] font-medium hover:text-white transition-colors"
            >
              {t("landing", "faqContactWhatsApp")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
});

FAQ.displayName = "FAQ";

export default FAQ;
