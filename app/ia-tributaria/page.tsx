"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Bot, User, Shield, TrendingDown, AlertTriangle, CheckCircle, Globe } from "lucide-react";

const alertasReforma = [
  { icone: "⚡", titulo: "Reforma Tributária 2026", texto: "PIS e COFINS serão extintos em 2027. Prepare sua empresa agora para o novo sistema CBS/IBS.", urgencia: "alta" },
  { icone: "💰", titulo: "JCP — Poucos usam", texto: "Juros sobre Capital Próprio pode reduzir seu IRPJ em até 34%. A maioria dos empresários desconhece.", urgencia: "media" },
  { icone: "📋", titulo: "Simples Nacional 2026", texto: "Novos limites de faturamento entraram em vigor. Verifique se seu regime atual ainda é o mais vantajoso.", urgencia: "media" },
  { icone: "🌎", titulo: "Incentivos Regionais", texto: "Empresas na Zona Franca de Manaus e Nordeste têm isenções de até 75% do IPI. Consulte a IA.", urgencia: "baixa" },
];

const economiasPotenciais = [
  { label: "Troca de Regime Tributário", economia: "até 30%", descricao: "Simples → Lucro Presumido", cor: "#34d399" },
  { label: "Dedução de Despesas Operacionais", economia: "até 15%", descricao: "Despesas legalmente dedutíveis", cor: "#6ab0ff" },
  { label: "Juros sobre Capital Próprio", economia: "até 34%", descricao: "Redução direta no IRPJ", cor: "#fbbf24" },
  { label: "Incentivos Fiscais Setoriais", economia: "até 75%", descricao: "IPI, ICMS por região/setor", cor: "#a78bfa" },
];

const perguntasSugeridas = [
  "Qual regime tributário é melhor para mim?",
  "Como funciona o Juros sobre Capital Próprio?",
  "O que muda com a Reforma Tributária?",
  "Quais despesas posso deduzir legalmente?",
  "Como reduzir meu IRPJ este ano?",
  "Existe incentivo fiscal para meu setor?",
];

const respostasIA: Record<string, string> = {
  "Qual regime tributário é melhor para mim?": "🔍 **Análise de Regime Tributário:**\n\nCom base no seu faturamento atual (R$ 62.000/mês = R$ 744.000/ano), aqui está a comparação:\n\n📊 **Simples Nacional**\n• Alíquota efetiva: ~11,5%\n• Imposto mensal estimado: R$ 7.130\n• Ideal para: até R$ 4,8M/ano\n\n📊 **Lucro Presumido**\n• Alíquota efetiva: ~8,2% (serviços)\n• Imposto mensal estimado: R$ 5.084\n• Economia vs Simples: R$ 2.046/mês\n\n💡 **Recomendação da IA:**\nAnalisando sua margem de 18%, o **Lucro Presumido** pode economizar até R$ 24.552/ano no seu caso.\n\n⚠️ **Importante:** Consulte um contador para formalizar a migração.",
  "Como funciona o Juros sobre Capital Próprio?": "💰 **Juros sobre Capital Próprio (JCP):**\n\nO JCP é uma ferramenta legal e pouco conhecida que permite às empresas deduzir do IRPJ uma remuneração calculada sobre o patrimônio líquido.\n\n✅ **Como funciona:**\n• A empresa paga JCP aos sócios\n• O valor é dedutível do Lucro Real\n• Redução de até 34% no IRPJ\n\n📌 **Exemplo prático:**\nPatrimônio Líquido: R$ 500.000\nTJLP atual: 6,5% a.a.\nJCP dedutível: R$ 32.500/ano\nEconomia de IRPJ: até R$ 11.050/ano\n\n⚠️ Válido apenas para empresas no Lucro Real. Consulte seu contador.",
  "O que muda com a Reforma Tributária?": "⚡ **Reforma Tributária — O que muda para sua empresa:**\n\n📅 **Cronograma:**\n• 2026: Início da transição\n• 2027: PIS e COFINS extintos → substituídos por CBS\n• 2027: ICMS e ISS extintos → substituídos por IBS\n• 2033: Transição completa\n\n🔴 **Impactos negativos possíveis:**\n• Setores de serviços podem pagar mais\n• Fim de alguns regimes especiais\n• Mudanças no Simples Nacional\n\n🟢 **Oportunidades:**\n• Crédito ampliado sobre insumos\n• Não cumulatividade total\n• Cashback para pequenas empresas\n\n💡 **Ação recomendada:** Faça um planejamento tributário agora antes de 2027.",
  "Quais despesas posso deduzir legalmente?": "📋 **Despesas Legalmente Dedutíveis:**\n\nNo Lucro Real, você pode deduzir do IRPJ:\n\n✅ **Operacionais:**\n• Aluguel do escritório/loja\n• Salários e encargos\n• Energia, água, telefone\n• Material de escritório\n• Marketing e publicidade\n\n✅ **Investimentos:**\n• Equipamentos e máquinas\n• Software e tecnologia\n• Treinamento de funcionários\n• P&D (dedução em dobro)\n\n✅ **Financeiras:**\n• Juros de empréstimos empresariais\n• Tarifas bancárias\n• Seguros empresariais\n\n💰 **Impacto estimado no seu caso:**\nSuas despesas atuais de R$ 38.000/mês bem documentadas podem gerar economia de R$ 4.500 a R$ 8.000/mês no imposto.",
};

export default function IATributaria() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState([
    { role: "assistant", texto: "Olá! 👋 Sou a IA Tributária do Axioma.\n\nEspecialista em planejamento tributário legal para empresas brasileiras. Posso ajudar você a pagar **menos impostos de forma 100% legal**, identificar incentivos fiscais e preparar sua empresa para a Reforma Tributária 2026.\n\nComo posso te ajudar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [paisSelecionado, setPaisSelecionado] = useState("Brasil");
  const fimChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = async (texto: string) => {
    if (!texto.trim()) return;
    setMensagens(prev => [...prev, { role: "user", texto }]);
    setInput("");
    setCarregando(true);
    await new Promise(r => setTimeout(r, 1800));
    const resposta = respostasIA[texto] || `🔍 **Analisando: "${texto}"**\n\nCom base na legislação tributária brasileira atual:\n\n📌 Esta é uma área que requer análise específica do seu caso.\n\nO que posso afirmar com base nos dados do Axioma:\n• Faturamento anual: R$ 744.000\n• Regime atual: Simples Nacional\n• Margem líquida: 18%\n\n💡 Para uma resposta precisa sobre este tema, recomendo combinar as informações desta IA com um contador especializado em planejamento tributário.\n\nPosteriormente conectarei aos dados reais da Receita Federal para análises ainda mais precisas.`;
    setMensagens(prev => [...prev, { role: "assistant", texto: resposta }]);
    setCarregando(false);
  };

  const paises = ["Brasil", "EUA", "Portugal", "Alemanha", "Reino Unido", "Canadá", "Austrália"];

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>
      {/* Sidebar */}
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
            { label: "IA Financeira", path: "/ia-financeira" },
            { label: "IA Tributária", path: "/ia-tributaria", active: true },
            { label: "Empresa", path: "/empresa" },
            { label: "Relatórios", path: "/relatorios" },
          ].map((item) => (
            <div key={item.label} onClick={() => router.push(item.path)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
        {/* Badge Premium */}
        <div className="p-4">
          <div className="rounded-xl p-3 text-center" style={{background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(59,111,212,0.15))", border: "1px solid rgba(167,139,250,0.3)"}}>
            <p className="text-xs font-bold mb-1" style={{color: "#a78bfa"}}>⚡ MÓDULO EXCLUSIVO</p>
            <p className="text-xs" style={{color: "#3a5a8a"}}>Add-on Premium</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>IA Tributária</h2>
                <span className="text-xs px-2 py-1 rounded-full font-bold" style={{background: "rgba(167,139,250,0.15)", color: "#a78bfa"}}>PREMIUM</span>
              </div>
              <p className="text-sm" style={{color: "#3a5a8a"}}>Planejamento tributário legal — pague menos impostos</p>
            </div>
          </div>
          {/* Seletor de país */}
          <div className="flex items-center gap-2">
            <Globe size={16} style={{color: "#6ab0ff"}}/>
            <select value={paisSelecionado} onChange={(e) => setPaisSelecionado(e.target.value)} className="px-3 py-2 rounded-xl text-sm focus:outline-none" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.2)", color: "#6ab0ff"}}>
              {paises.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Alertas da Reforma */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {alertasReforma.map((alerta, i) => (
            <div key={i} className="rounded-xl p-4" style={{background: alerta.urgencia === "alta" ? "rgba(248,113,113,0.05)" : alerta.urgencia === "media" ? "rgba(251,191,36,0.05)" : "rgba(59,111,212,0.05)", border: `1px solid ${alerta.urgencia === "alta" ? "rgba(248,113,113,0.2)" : alerta.urgencia === "media" ? "rgba(251,191,36,0.2)" : "rgba(59,111,212,0.2)"}`}}>
              <div className="text-lg mb-2">{alerta.icone}</div>
              <p className="text-xs font-bold mb-1" style={{color: alerta.urgencia === "alta" ? "#f87171" : alerta.urgencia === "media" ? "#fbbf24" : "#6ab0ff"}}>{alerta.titulo}</p>
              <p className="text-xs" style={{color: "#3a5a8a"}}>{alerta.texto}</p>
            </div>
          ))}
        </div>

        {/* Economias Potenciais */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {economiasPotenciais.map((item, i) => (
            <div key={i} className="rounded-xl p-4" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <p className="text-xs mb-1" style={{color: "#3a5a8a"}}>{item.label}</p>
              <p className="text-xl font-bold" style={{color: item.cor}}>{item.economia}</p>
              <p className="text-xs mt-1" style={{color: "#3a5a8a"}}>{item.descricao}</p>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 rounded-2xl flex flex-col overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", minHeight: 0}}>
          <div className="flex-1 p-6 overflow-auto space-y-4">
            {mensagens.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: msg.role === "assistant" ? "rgba(167,139,250,0.2)" : "rgba(52,211,153,0.2)"}}>
                  {msg.role === "assistant" ? <Shield size={16} style={{color: "#a78bfa"}}/> : <User size={16} style={{color: "#34d399"}}/>}
                </div>
                <div className="max-w-lg rounded-2xl px-4 py-3" style={{background: msg.role === "assistant" ? "rgba(167,139,250,0.08)" : "rgba(52,211,153,0.08)", border: `1px solid ${msg.role === "assistant" ? "rgba(167,139,250,0.2)" : "rgba(52,211,153,0.2)"}`}}>
                  <p className="text-sm whitespace-pre-line" style={{color: "#c8d8f0"}}>{msg.texto}</p>
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: "rgba(167,139,250,0.2)"}}>
                  <Shield size={16} style={{color: "#a78bfa"}}/>
                </div>
                <div className="rounded-2xl px-4 py-3" style={{background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)"}}>
                  <p className="text-sm" style={{color: "#a78bfa"}}>Consultando legislação tributária... ⏳</p>
                </div>
              </div>
            )}
            <div ref={fimChat}/>
          </div>

          {/* Perguntas sugeridas */}
          <div className="px-6 py-3 border-t" style={{borderColor: "rgba(59,111,212,0.15)"}}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {perguntasSugeridas.map((p, i) => (
                <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0 transition-all hover:scale-105" style={{background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa"}}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{borderColor: "rgba(59,111,212,0.15)"}}>
            <div className="flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)} placeholder="Pergunte sobre impostos, regimes tributários, incentivos fiscais..." className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", color: "#c8d8f0"}}/>
              <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #5b21b6, #7c3aed)", color: "#fff"}}>
                <Send size={18}/>
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{color: "#3a5a8a"}}>⚖️ Todas as orientações são baseadas na legislação brasileira vigente. Consulte sempre um contador.</p>
          </div>
        </div>
      </div>
    </div>
  );
}