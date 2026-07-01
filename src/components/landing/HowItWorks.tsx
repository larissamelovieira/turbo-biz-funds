import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Card1 = memo(() => (
  <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 h-full">
    <div className="flex items-center gap-2 mb-1">
      <span className="w-7 h-7 bg-[#1B4DBF] rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">1</span>
      <span className="text-sm font-bold text-gray-800">Envie suas despesas e receitas</span>
    </div>
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex-1">
      <div className="text-xs text-gray-400 mb-2 font-medium">WhatsApp</div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-gray-800 max-w-[90%]">
            "Comprei um lanche por R$ 25"
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-gray-800 max-w-[90%]">
            "Recebi R$ 1.500 de um cliente"
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[90%] border border-gray-100 shadow-sm">
            ✅ Movimentações registradas automaticamente!
          </div>
        </div>
      </div>
    </div>
    <div className="text-center">
      <span className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-3 py-1 rounded-full">
        Registro rápido pelo WhatsApp
      </span>
    </div>
  </div>
));
Card1.displayName = "Card1";

const Card2 = memo(() => (
  <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 h-full">
    <div className="flex items-center gap-2 mb-1">
      <span className="w-7 h-7 bg-[#1B4DBF] rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">2</span>
      <span className="text-sm font-bold text-gray-800">Consulte suas finanças a qualquer momento</span>
    </div>
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex-1">
      <div className="text-xs text-gray-400 mb-2 font-medium">Pergunte no WhatsApp</div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-gray-800 max-w-[90%]">
            "Quanto gastei este mês?"
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-gray-800 max-w-[90%]">
            "Qual meu saldo atual?"
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[90%] border border-gray-100 shadow-sm">
            💬 Resposta instantânea direto no WhatsApp!
          </div>
        </div>
      </div>
    </div>
    <div className="text-center">
      <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
        Respostas instantâneas
      </span>
    </div>
  </div>
));
Card2.displayName = "Card2";

const Card3 = memo(() => (
  <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 h-full">
    <div className="flex items-center gap-2 mb-1">
      <span className="w-7 h-7 bg-[#1B4DBF] rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">3</span>
      <span className="text-sm font-bold text-gray-800">Acesse análises completas no Dashboard</span>
    </div>
    <div className="space-y-2 flex-1">
      <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-500">📊 Gráficos e relatórios</span>
        <span className="text-xs font-bold text-[#1B4DBF]">Detalhados</span>
      </div>
      <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-500">📁 Exportar planilhas</span>
        <span className="text-xs font-bold text-green-600">Excel / PDF</span>
      </div>
      <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-500">🏷️ Categorias</span>
        <span className="text-xs font-bold text-purple-600">Personalizadas</span>
      </div>
      <p className="text-xs text-gray-400 text-center pt-1">
        Solicite o acesso pelo WhatsApp
      </p>
    </div>
    <div className="text-center">
      <span className="inline-block bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1 rounded-full">
        Controle financeiro avançado
      </span>
    </div>
  </div>
));
Card3.displayName = "Card3";

const HowItWorks = memo(() => {
  return (
    <section id="como-funciona" className="py-16 md:py-24" style={{ background: "linear-gradient(to bottom, #030712, #0B1F3A 30%, #0B1F3A 70%, #030712)" }}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-blue-300 text-sm font-semibold mb-5 uppercase tracking-widest">
            Como funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Como o Doutor Cash organiza sua vida financeira
          </h2>
          <p className="text-lg text-white/50">
            Converse pelo WhatsApp, registre suas movimentações e acompanhe sua situação financeira de forma simples e prática.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card1 />
              <Card2 />
              <Card3 />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Button
            className="bg-[#1B4DBF] hover:bg-[#2a5dd4] hover:scale-105 text-white font-bold text-base px-10 py-4 rounded-full h-auto shadow-xl shadow-[#1B4DBF]/40 transition-all duration-200 active:scale-[0.98]"
            asChild
          >
            <Link to="/cadastro">
              ADQUIRIR O DOUTOR CASH
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
});

HowItWorks.displayName = "HowItWorks";

export default HowItWorks;
