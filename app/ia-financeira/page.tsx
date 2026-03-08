"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, Target } from "lucide-react";

const insightsAutomaticos = [
  { tipo: "alerta", icone: "⚠️", titulo: "Risco de caixa", texto: "Seu caixa pode ficar negativo em 47 dias se os custos continuarem no ritmo atual." },
  { tipo: "positivo", icone: "📈", titulo: "Crescimento", texto: "Faturamento cresceu 12% este mês — melhor resultado do trimestre." },
  { tipo: "sugestao", icone: "💡", titulo: "Oportunidade", texto: "Reduzindo custos variáveis em 8% você aumentaria a margem líquida em R$ 4.200/mês." },
  { tipo: "alerta", icone: "🔴", titulo: "Margem baixa", texto: "Sua margem líquida está em 18% — abaixo dos 25% recomendados para seu setor." },
];

const perguntasSugeridas = [
  "Como está minha saúde financeira?",
  "Quando meu caixa pode zerar?",
  "Qual meu produto mais lucrativo?",
  "Como reduzir meus custos fixos?",
  "Qual minha previsão para os próximos 3 meses?",
];

const respostasIA: Record<string, string> = {
  "Como está minha saúde financeira?": "📊 **Análise da sua saúde financeira:**\n\n✅ **Pontos positivos:**\n• Faturamento crescendo 12% ao mês\n• Score financeiro em 87/100\n• Receitas superando custos\n\n⚠️ **Pontos de atenção:**\n• Margem líquida em 18% (ideal: 25%+)\n• Endividamento de R$ 88.500\n• Custos fixos representam 42% da receita\n\n💡 **Recomendação:** Foque em reduzir custos variáveis e negociar condições melhores com fornecedores.",
  "Quando meu caixa pode zerar?": "🔮 **Previsão de caixa:**\n\nCom base nos dados atuais:\n\n• **Cenário otimista:** Caixa positivo por 90+ dias\n• **Cenário previsto:** Atenção em 47 dias\n• **Cenário pessimista:** Risco em 28 dias\n\n⚡ **Ação urgente recomendada:**\n1. Antecipar recebimentos pendentes (R$ 1.500)\n2. Negociar prazo com fornecedores\n3. Reduzir custos variáveis em pelo menos 10%",
  "Qual minha previsão para os próximos 3 meses?": "📅 **Previsão Julho — Setembro 2026:**\n\n**Julho:** Receita prevista R$ 65.000 | Custos R$ 42.000 | Lucro R$ 23.000\n**Agosto:** Receita prevista R$ 68.000 | Custos R$ 43.500 | Lucro R$ 24.500\n**Setembro:** Receita prevista R$ 71.000 | Custos R$ 45.000 | Lucro R$ 26.000\n\n📈 **Tendência:** Crescimento de 4.5% ao mês se mantiver o ritmo atual.",
};

export default function IAFinanceira() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState([
    { role: "assistant", texto: "Olá Elias! 👋 Sou seu CFO virtual com IA. Posso analisar suas finanças, prever riscos e sugerir ações estratégicas. Como posso te ajudar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = async (texto: string) => {
    if (!texto.trim()) return;
    const novaMensagem = { role: "user", texto };
    setMensagens(prev => [...prev, novaMensagem]);
    setInput("");
    setCarregando(true);

    await new Promise(r => setTimeout(r, 1500));

    const resposta = respostasIA[texto] || `Analisando seus dados financeiros sobre "${texto}"...\n\n📊 Com base nos seus dados atuais:\n• Faturamento: R$ 62.000/mês\n• Custos totais: R$ 38.000/mês\n• Margem líquida: 18%\n• Score: 87/100\n\n💡 Recomendo consultar cada módulo específico para mais detalhes. Posso fazer uma análise mais precisa quando seus dados reais estiverem conectados ao sistema.`;

    setMensagens(prev => [...prev, { role: "assistant", texto: resposta }]);
    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="p-6 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <Image src="/logo.png" alt="Axioma" width={140} height={50} className="object-contain"/>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "Receitas", path: "/receitas" },
            { label: "Custos Fixos", path: "/custos-fixos" },
            { label: "Custos Variáveis", path: "/custos-variaveis" },
            { label: "Fornecedores", path: "/fornecedores" },
            { label: "Endividamento", path: "/endividamento" },
            { label: "Fluxo de Caixa", path: "/fluxo-caixa" },
            { label: "IA Financeira", path: "/ia-financeira", active: true },
            { label: "Empresa", path: "/empresa" },
            { label: "Relatórios", path: "/relatorios" },
          ].map((item) => (
            <div key={item.label} onClick={() => router.push(item.path)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>IA Financeira</h2>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Seu CFO virtual inteligente</p>
          </div>
        </div>

        {/* Insights automáticos */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {insightsAutomaticos.map((insight, i) => (
            <div key={i} className="rounded-xl p-4" style={{background: insight.tipo === "alerta" ? "rgba(248,113,113,0.05)" : insight.tipo === "positivo" ? "rgba(52,211,153,0.05)" : "rgba(59,111,212,0.05)", border: `1px solid ${insight.tipo === "alerta" ? "rgba(248,113,113,0.2)" : insight.tipo === "positivo" ? "rgba(52,211,153,0.2)" : "rgba(59,111,212,0.2)"}`}}>
              <div className="text-lg mb-2">{insight.icone}</div>
              <p className="text-xs font-bold mb-1" style={{color: insight.tipo === "alerta" ? "#f87171" : insight.tipo === "positivo" ? "#34d399" : "#6ab0ff"}}>{insight.titulo}</p>
              <p className="text-xs" style={{color: "#3a5a8a"}}>{insight.texto}</p>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 rounded-2xl flex flex-col overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          
          {/* Mensagens */}
          <div className="flex-1 p-6 overflow-auto space-y-4">
            {mensagens.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: msg.role === "assistant" ? "rgba(59,111,212,0.2)" : "rgba(52,211,153,0.2)"}}>
                  {msg.role === "assistant" ? <Bot size={16} style={{color: "#6ab0ff"}}/> : <User size={16} style={{color: "#34d399"}}/>}
                </div>
                <div className="max-w-lg rounded-2xl px-4 py-3" style={{background: msg.role === "assistant" ? "rgba(59,111,212,0.1)" : "rgba(52,211,153,0.1)", border: `1px solid ${msg.role === "assistant" ? "rgba(59,111,212,0.2)" : "rgba(52,211,153,0.2)"}`}}>
                  <p className="text-sm whitespace-pre-line" style={{color: "#c8d8f0"}}>{msg.texto}</p>
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: "rgba(59,111,212,0.2)"}}>
                  <Bot size={16} style={{color: "#6ab0ff"}}/>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.2)"}}>
                  <p className="text-sm" style={{color: "#6ab0ff"}}>Analisando seus dados... ⏳</p>
                </div>
              </div>
            )}
            <div ref={fimChat}/>
          </div>

          {/* Perguntas sugeridas */}
          <div className="px-6 py-3 border-t" style={{borderColor: "rgba(59,111,212,0.15)"}}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {perguntasSugeridas.map((p, i) => (
                <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0 transition-all hover:scale-105" style={{background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.2)", color: "#6ab0ff"}}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{borderColor: "rgba(59,111,212,0.15)"}}>
            <div className="flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)} placeholder="Pergunte sobre suas finanças..." className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                <Send size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}