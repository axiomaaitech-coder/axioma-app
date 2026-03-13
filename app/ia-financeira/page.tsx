"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, Paperclip, X, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const insights = {
  pt: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Custos com fornecedores aumentaram 8% em relacao ao mes anterior. Recomenda-se renegociar contratos.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "Faturamento cresceu 12% - melhor resultado do trimestre! Continue investindo em marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Sua margem liquida esta em 18%. Empresas do setor operam com 22-25%. Ha espaco para melhorar.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Fluxo de caixa previsto para os proximos 30 dias: positivo em R$ 12.400. Boa liquidez.", cor: "#6ab0ff" },
  ],
  en: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Supplier costs increased 8% compared to last month. Renegotiating contracts is recommended.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "Revenue grew 12% - best result of the quarter! Keep investing in marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Your net margin is 18%. Companies in the sector operate at 22-25%. There is room to improve.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Cash flow forecast for the next 30 days: positive at R$ 12,400. Good liquidity.", cor: "#6ab0ff" },
  ],
  es: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Los costos con proveedores aumentaron 8% respecto al mes anterior. Se recomienda renegociar contratos.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "La facturacion crecio 12% - mejor resultado del trimestre! Sigue invirtiendo en marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Tu margen neto es del 18%. Las empresas del sector operan entre 22-25%. Hay margen de mejora.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Prevision de flujo de caja para los proximos 30 dias: positivo en R$ 12.400. Buena liquidez.", cor: "#6ab0ff" },
  ],
};

const perguntasSugeridas = {
  pt: ["Como posso reduzir meus custos fixos?", "Qual e minha margem de lucro ideal?", "Como melhorar meu fluxo de caixa?"],
  en: ["How can I reduce my fixed costs?", "What is my ideal profit margin?", "How to improve my cash flow?"],
  es: ["Como puedo reducir mis costos fijos?", "Cual es mi margen de beneficio ideal?", "Como mejorar mi flujo de caja?"],
};

const respostas: Record<string, string> = {
  "Como posso reduzir meus custos fixos?": "Analisando seus dados, identifiquei 3 oportunidades: 1) Renegociar o aluguel (representa 21% dos custos fixos); 2) Revisar assinaturas de software; 3) Otimizar a folha de pagamento. Potencial de reducao: R$ 2.800/mes.",
  "Qual e minha margem de lucro ideal?": "Sua margem atual e de 18%. Para o seu setor, a referencia e 22-25%. Recomendo comecar pela revisao dos custos com fornecedores.",
  "Como melhorar meu fluxo de caixa?": "Sugiro: 1) Antecipar recebiveis - voce tem R$ 1.500 pendentes; 2) Negociar prazos maiores com fornecedores; 3) Criar uma reserva de emergencia.",
  "How can I reduce my fixed costs?": "Analyzing your data, I identified 3 opportunities: 1) Renegotiate rent (21% of fixed costs); 2) Review software subscriptions; 3) Optimize payroll. Potential reduction: R$ 2,800/month.",
  "What is my ideal profit margin?": "Your current margin is 18%. The industry benchmark is 22-25%. I recommend starting by reviewing supplier costs.",
  "How to improve my cash flow?": "I suggest: 1) Advance receivables - you have R$ 1,500 pending; 2) Negotiate longer terms with suppliers; 3) Create an emergency reserve.",
  "Como puedo reducir mis costos fijos?": "Analizando sus datos, identifique 3 oportunidades: 1) Renegociar el alquiler; 2) Revisar suscripciones de software; 3) Optimizar la nomina. Reduccion potencial: R$ 2.800/mes.",
  "Cual es mi margen de beneficio ideal?": "Su margen actual es del 18%. El benchmark del sector es 22-25%. Recomiendo comenzar revisando los costos con proveedores.",
  "Como mejorar mi flujo de caja?": "Sugiero: 1) Anticipar cobros pendientes - tiene R$ 1.500 pendientes; 2) Negociar plazos mas largos con proveedores; 3) Crear una reserva de emergencia.",
};

const textos = {
  pt: { subtitulo: "Analise inteligente dos seus dados financeiros", placeholder: "Pergunte sobre suas financas...", analisando: "Analisando seus dados...", arquivoAnexado: "Arquivo anexado", analisandoArquivo: "Analisando seu documento financeiro...", respostaArquivo: "Recebi seu documento! Analisei o conteudo e identifiquei os principais dados financeiros. Com base neste arquivo, posso responder perguntas especificas sobre os valores, tendencias e recomendacoes. O que voce gostaria de saber?", remover: "Remover", anexar: "Anexar documento" },
  en: { subtitulo: "Intelligent analysis of your financial data", placeholder: "Ask about your finances...", analisando: "Analyzing your data...", arquivoAnexado: "File attached", analisandoArquivo: "Analyzing your financial document...", respostaArquivo: "I received your document! I analyzed the content and identified the main financial data. Based on this file, I can answer specific questions about values, trends and recommendations. What would you like to know?", remover: "Remove", anexar: "Attach document" },
  es: { subtitulo: "Analisis inteligente de tus datos financieros", placeholder: "Pregunta sobre tus finanzas...", analisando: "Analizando tus datos...", arquivoAnexado: "Archivo adjunto", analisandoArquivo: "Analizando tu documento financiero...", respostaArquivo: "Recibi tu documento! Analice el contenido e identifique los principales datos financieros. Con base en este archivo, puedo responder preguntas especificas sobre valores, tendencias y recomendaciones. Que te gustaria saber?", remover: "Eliminar", anexar: "Adjuntar documento" },
};

export default function IAFinanceira() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const tx = textos[idioma];
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [mensagens, setMensagens] = useState<{ role: string; texto: string; arquivo?: string }[]>([
    { role: "assistant", texto: idioma === "en" ? "Hello! I'm your Financial AI. I've analyzed all your data and I'm ready to help. What would you like to know?" : idioma === "es" ? "Hola! Soy tu IA Financiera. Analice todos tus datos y estoy listo para ayudar. Que te gustaria saber?" : "Ola! Sou sua IA Financeira. Analisei todos os seus dados e estou pronto para ajudar. O que voce gostaria de saber?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState<File | null>(null);
  const [exportando, setExportando] = useState(false);

  const enviarMensagem = (texto: string) => {
    if (!texto.trim() && !arquivoAnexado) return;
    const msgUsuario: { role: string; texto: string; arquivo?: string } = {
      role: "user",
      texto: texto || (arquivoAnexado ? `📎 ${arquivoAnexado.name}` : ""),
      arquivo: arquivoAnexado?.name,
    };
    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);
    const temArquivo = !!arquivoAnexado;
    setArquivoAnexado(null);
    setTimeout(() => {
      let resposta = "";
      if (temArquivo) {
        resposta = tx.respostaArquivo;
      } else {
        resposta = respostas[texto] || (idioma === "en" ? "Great question! Based on your financial data, I recommend analyzing each cost category in detail. Can I elaborate on a specific area?" : idioma === "es" ? "Excelente pregunta! Basandome en tus datos financieros, recomiendo analizar cada categoria de costos en detalle. Puedo detallar alguna area especifica?" : "Otima pergunta! Com base nos seus dados financeiros, recomendo analisar detalhadamente cada categoria de custo. Posso detalhar alguma area especifica?");
      }
      setMensagens([...novasMensagens, { role: "assistant", texto: resposta }]);
      setCarregando(false);
    }, 1500);
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArquivoAnexado(file);
  }

  const exportarPDF = async () => {
    if (!conteudoRef.current) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(conteudoRef.current, { backgroundColor: "#020810", scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t.nav.iaFinanceira} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
      let position = 22;
      let remaining = pdfHeight;
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining);
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight);
        const sourceH = sliceHeight * (canvas.height / pdfHeight);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#020810";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight);
        remaining -= sliceHeight;
        position = 0;
        if (remaining > 0) { pdf.addPage(); position = 0; }
      }
      pdf.save(`axioma-ia-financeira-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#3a5a8a" }}><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>{t.nav.iaFinanceira}</h2>
            <p className="text-sm" style={{ color: "#3a5a8a" }}>{tx.subtitulo}</p>
          </div>
        </div>
        <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "#dc2626", color: "#fff" }}>
          <Download size={16}/>{exportando ? "Gerando..." : "Exportar PDF"}
        </button>
      </div>

      <div ref={conteudoRef}>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {insights[idioma].map((insight, i) => (
            <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${insight.cor}22` }}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${insight.cor}15` }}>
                <insight.icon size={20} style={{ color: insight.cor }} />
              </div>
              <p className="text-sm" style={{ color: "#8aaad4" }}>{insight.texto}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>🤖 {t.nav.iaFinanceira}</h3>
          </div>

          <div className="p-6 space-y-4 min-h-64 max-h-96 overflow-auto">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-md px-4 py-3 rounded-2xl text-sm" style={{ background: m.role === "user" ? "rgba(59,111,212,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(59,111,212,0.3)" : "rgba(59,111,212,0.1)"}`, color: "#c8d8f0" }}>
                  {m.arquivo && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg" style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.2)" }}>
                      <Paperclip size={12} style={{ color: "#6ab0ff" }} />
                      <span className="text-xs" style={{ color: "#6ab0ff" }}>{m.arquivo}</span>
                    </div>
                  )}
                  {m.texto !== `📎 ${m.arquivo}` && m.texto}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.1)", color: "#3a5a8a" }}>
                  {tx.analisando}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              {perguntasSugeridas[idioma].map((p, i) => (
                <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.2)", color: "#6ab0ff" }}>
                  {p}
                </button>
              ))}
            </div>

            {arquivoAnexado && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.3)" }}>
                <Paperclip size={14} style={{ color: "#6ab0ff" }} />
                <span className="text-xs flex-1" style={{ color: "#6ab0ff" }}>{arquivoAnexado.name}</span>
                <button onClick={() => setArquivoAnexado(null)} style={{ color: "#f87171" }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input ref={fileRef} type="file" accept=".pdf,.xml,.xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
              <button onClick={() => fileRef.current?.click()} className="px-3 py-3 rounded-xl transition-all hover:opacity-80" style={{ background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.2)", color: "#6ab0ff" }} title={tx.anexar}>
                <Paperclip size={18} />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)}
                placeholder={tx.placeholder}
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
              />
              <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}