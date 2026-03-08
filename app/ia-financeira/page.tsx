"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const insightsIniciais = [
  { tipo: "alerta", icon: AlertTriangle, texto: "Custos com fornecedores aumentaram 8% em relação ao mês anterior. Recomenda-se renegociar contratos.", cor: "#f87171" },
  { tipo: "positivo", icon: CheckCircle, texto: "Faturamento cresceu 12% — melhor resultado do trimestre! Continue investindo em marketing.", cor: "#34d399" },
  { tipo: "sugestao", icon: Lightbulb, texto: "Sua margem líquida está em 18%. Empresas do setor operam com 22-25%. Há espaço para melhorar.", cor: "#fbbf24" },
  { tipo: "info", icon: TrendingUp, texto: "Fluxo de caixa previsto para os próximos 30 dias: positivo em R$ 12.400. Boa liquidez.", cor: "#6ab0ff" },
];

const perguntasSugeridas = [
  "Como posso reduzir meus custos fixos?",
  "Qual é minha margem de lucro ideal?",
  "Como melhorar meu fluxo de caixa?",
];

const respostas: Record<string, string> = {
  "Como posso reduzir meus custos fixos?": "Analisando seus dados, identifiquei 3 oportunidades: 1) Renegociar o aluguel (representa 21% dos custos fixos); 2) Revisar assinaturas de software — há sobreposição de ferramentas; 3) Otimizar a folha de pagamento com home office parcial. Potencial de redução: R$ 2.800/mês.",
  "Qual é minha margem de lucro ideal?": "Sua margem atual é de 18%. Para o seu setor, a referência é 22-25%. Para chegar lá, você precisa aumentar o ticket médio em 8% ou reduzir custos variáveis em R$ 1.200/mês. Recomendo começar pela revisão dos custos com fornecedores.",
  "Como melhorar meu fluxo de caixa?": "Seu fluxo está positivo, mas instável. Sugiro: 1) Antecipar recebíveis — você tem R$ 1.500 pendentes; 2) Negociar prazos maiores com fornecedores (atual: 30 dias, ideal: 45-60); 3) Criar uma reserva de emergência de 3 meses de custos fixos (R$ 48.747).",
};

export default function IAFinanceira() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mensagens, setMensagens] = useState<{role: string, texto: string}[]>([
    { role: "assistant", texto: "Olá! Sou sua IA Financeira. Analisei todos os seus dados e estou pronto para ajudar. O que você gostaria de saber?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviarMensagem = (texto: string) => {
    if (!texto.trim()) return;
    const novasMensagens = [...mensagens, { role: "user", texto }];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);
    setTimeout(() => {
      const resposta = respostas[texto] || "Ótima pergunta! Com base nos seus dados financeiros, recomendo analisar detalhadamente cada categoria de custo e comparar com o mês anterior. Posso detalhar alguma área específica?";
      setMensagens([...novasMensagens, { role: "assistant", texto: resposta }]);
      setCarregando(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.nav.iaFinanceira}</h2>
          <p className="text-sm" style={{color: "#3a5a8a"}}>
            {t.idioma === "pt" ? "Análise inteligente dos seus dados financeiros" :
             t.idioma === "en" ? "Intelligent analysis of your financial data" :
             "Análisis inteligente de tus datos financieros"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {insightsIniciais.map((insight, i) => (
          <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={{background: "rgba(10,22,40,0.8)", border: `1px solid ${insight.cor}22`}}>
            <div className="p-2 rounded-xl flex-shrink-0" style={{background: `${insight.cor}15`}}>
              <insight.icon size={20} style={{color: insight.cor}}/>
            </div>
            <p className="text-sm" style={{color: "#8aaad4"}}>{insight.texto}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="px-6 py-4 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <h3 className="text-sm font-semibold" style={{color: "#c8d8f0"}}>🤖 {t.nav.iaFinanceira}</h3>
        </div>

        <div className="p-6 space-y-4 min-h-64 max-h-96 overflow-auto">
          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-md px-4 py-3 rounded-2xl text-sm" style={{
                background: m.role === "user" ? "rgba(59,111,212,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${m.role === "user" ? "rgba(59,111,212,0.3)" : "rgba(59,111,212,0.1)"}`,
                color: "#c8d8f0"
              }}>
                {m.texto}
              </div>
            </div>
          ))}
          {carregando && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.1)", color: "#3a5a8a"}}>
                Analisando seus dados...
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {perguntasSugeridas.map((p, i) => (
              <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl transition-all hover:scale-105" style={{background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.2)", color: "#6ab0ff"}}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)} placeholder="Pergunte sobre suas finanças..." className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
            <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
              <Send size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}