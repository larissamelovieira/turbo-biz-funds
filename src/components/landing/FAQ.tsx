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
      question: "Como registrar despesas?",
      answer: "Basta enviar uma mensagem de texto ou áudio informando o gasto realizado.\n\nExemplo:\n• \"Comprei um lanche por R$ 25.\"\n• \"Paguei R$ 350 de energia.\"\n\nO Doutor Cash identifica o valor e registra a despesa automaticamente.",
    },
    {
      question: "Como registrar receitas?",
      answer: "Envie uma mensagem informando o valor recebido.\n\nExemplo:\n• \"Recebi R$ 1.500 de um cliente.\"\n• \"Recebi meu salário de R$ 3.200.\"\n\nA receita será registrada automaticamente.",
    },
    {
      question: "Posso enviar áudio?",
      answer: "Sim. Você pode registrar receitas e despesas por áudio de até 15 segundos.\n\nExemplo:\n• \"Acabei de abastecer o carro e gastei R$ 200.\"\n\nO sistema interpreta a informação e realiza o lançamento automaticamente.",
    },
    {
      question: "Como consultar meus gastos?",
      answer: "Você pode fazer perguntas diretamente pelo WhatsApp.\n\nExemplo:\n• \"Quanto gastei este mês?\"\n• \"Quanto gastei com alimentação?\"\n\nO Doutor Cash responde em segundos.",
    },
    {
      question: "Como funciona o Dashboard?",
      answer: "O Dashboard reúne todas as suas informações financeiras em gráficos e relatórios.\n\nExemplo:\nVisualizar quanto foi gasto com alimentação, transporte, moradia e lazer durante o mês.",
    },
    {
      question: "Posso criar metas financeiras?",
      answer: "Sim. Você pode definir metas e acompanhar sua evolução.\n\nExemplo:\n• \"Quero guardar R$ 500 por mês.\"\n\nO sistema acompanha seu progresso e mostra sua evolução.",
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim. Seus dados são armazenados de forma segura e tratados conforme a LGPD.\n\nSomente você terá acesso às suas movimentações financeiras, relatórios e informações pessoais.",
    },
    {
      question: "O Doutor Cash acessa minha conta bancária?",
      answer: "Não. Nesta primeira fase, todas as informações são registradas através dos lançamentos enviados pelo usuário.\n\nExemplo:\nVocê informa: \"Paguei R$ 80 de internet.\"\n\nO sistema registra a despesa sem acessar sua conta bancária.",
    },
    {
      question: "Como funciona o suporte?",
      answer: "O suporte é realizado pelos canais oficiais de atendimento da plataforma.\n\nCaso tenha dúvidas sobre relatórios, acesso ou utilização da plataforma, poderá entrar em contato para receber ajuda.",
    },
    {
      question: "Posso cancelar quando quiser?",
      answer: "Sim. Você pode solicitar o cancelamento da sua conta a qualquer momento.\n\nO reembolso é garantido em até 7 dias após a compra, conforme previsto pelo Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), que garante o direito de arrependimento para compras realizadas pela internet.\n\nApós esse prazo, o cancelamento poderá ser solicitado normalmente, mas não haverá devolução dos valores já pagos.",
    },
    {
      question: "Qual a diferença entre o Doutor Cash e uma planilha?",
      answer: "Com o Doutor Cash você não precisa preencher planilhas manualmente.\n\nExemplo:\nEm vez de abrir uma planilha e digitar cada gasto, basta enviar:\n\n\"Comprei remédios por R$ 42.\"\n\nO sistema registra e organiza tudo automaticamente.",
    },
    {
      question: "O Doutor Cash serve para autônomos?",
      answer: "Sim. O Doutor Cash foi desenvolvido para pessoas físicas e profissionais autônomos que desejam organizar suas finanças de forma simples.\n\nImportante: nesta primeira fase, o Doutor Cash não realiza cadastro de CNPJ e não possui funcionalidades voltadas para gestão financeira empresarial.\n\nExemplo:\nUm motorista de aplicativo, corretor de imóveis, vendedor autônomo ou prestador de serviços pode registrar normalmente suas receitas e despesas pessoais.",
    },
    {
      question: "Posso exportar meus dados?",
      answer: "Sim. Você poderá exportar suas informações para análises e controles adicionais.\n\nExemplo:\nExportar um relatório com todas as movimentações do mês para compartilhar com um contador.",
    },
    {
      question: "Como acompanho meu saldo mensal?",
      answer: "Você pode consultar seu saldo sempre que desejar pelo WhatsApp ou Dashboard.\n\nExemplo:\n• \"Qual meu saldo atual?\"\n• \"Quanto sobrou este mês?\"\n\nO sistema calcula automaticamente com base nas receitas e despesas registradas.",
    },
    {
      question: "O Doutor Cash categoriza meus gastos automaticamente?",
      answer: "Sim. A inteligência artificial identifica a categoria mais adequada para cada movimentação.\n\nExemplo:\n\"Abasteci o carro por R$ 150.\"\n\nO sistema pode classificar automaticamente como Transporte.",
    },
    {
      question: "Posso corrigir um lançamento errado?",
      answer: "Sim. Após o lançamento ser registrado, a alteração pode ser realizada pelo usuário dentro do Dashboard.\n\nExemplo:\nVocê lançou \"Abasteci o carro por R$ 200\", mas o valor correto era R$ 150. Basta acessar o Dashboard, localizar a movimentação e editar o valor manualmente.",
    },
    {
      question: "Posso registrar gastos parcelados?",
      answer: "Sim. Você pode informar compras parceladas para manter seu controle financeiro atualizado.\n\nExemplo:\n\"Comprei um celular em 10 parcelas de R$ 120.\"\n\nO sistema registrará a compra e permitirá acompanhar o compromisso financeiro.",
    },
    {
      question: "O Doutor Cash funciona 24 horas por dia?",
      answer: "Sim. Você pode registrar movimentações e consultar informações a qualquer momento.\n\nExemplo:\nÀs 23h você envia: \"Comprei um lanche por R$ 30.\" O lançamento será registrado normalmente.",
    },
    {
      question: "Posso usar o Doutor Cash para organizar minhas dívidas?",
      answer: "Sim. A plataforma ajuda a visualizar sua situação financeira e acompanhar compromissos financeiros.\n\nExemplo:\n\"Tenho uma parcela do cartão de R$ 450 todo dia 10.\"\n\nVocê terá mais clareza sobre suas obrigações e planejamento financeiro.",
    },
    {
      question: "O Doutor Cash me ajuda a economizar?",
      answer: "Sim. Ao visualizar para onde seu dinheiro está indo, fica mais fácil identificar desperdícios e oportunidades de economia.\n\nExemplo:\nAo perceber que gastou R$ 900 em delivery no mês, você poderá criar uma meta para reduzir esse valor nos próximos meses.",
    },
    {
      question: "Posso definir categorias personalizadas?",
      answer: "Sim. Você pode criar categorias específicas para organizar suas movimentações da forma que fizer mais sentido para sua realidade.\n\nExemplo:\n• Filhos\n• Academia\n• Investimentos\n• Trabalho\n• Animais de Estimação\n\nE acompanhar os gastos separadamente.",
    },
    {
      question: "O Doutor Cash mostra onde estou gastando mais dinheiro?",
      answer: "Sim. O Dashboard apresenta gráficos e relatórios que mostram exatamente para onde seu dinheiro está indo.\n\nExemplo:\nVocê descobre que no último mês gastou:\n• R$ 1.200 com alimentação\n• R$ 850 com transporte\n• R$ 600 com lazer\n\nFacilitando a tomada de decisões financeiras.",
    },
    {
      question: "Posso usar o Doutor Cash mesmo tendo pouca movimentação financeira?",
      answer: "Sim. O sistema funciona tanto para quem possui poucas movimentações quanto para quem realiza dezenas de transações por mês.\n\nExemplo:\nMesmo registrando apenas salário, aluguel, energia e mercado, você já terá uma visão muito mais clara das suas finanças.",
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
