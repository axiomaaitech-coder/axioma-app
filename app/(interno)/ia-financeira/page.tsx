"use client";
import { useState, useRef, useEffect } from "react";
import { Send, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }));
    const chars = "AXIOMA IA FINANCE AI 0 1 2 3 4 5 6 7 8 9 R$ % ROI DRE".split(" ").map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#6ab0ff", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"][Math.floor(Math.random() * 5)],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      chars.forEach(f => {
        ctx.save(); ctx.font = `900 ${f.size}px Arial`;
        ctx.fillStyle = f.color; ctx.globalAlpha = f.opacity;
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height);
        ctx.restore(); f.y -= f.speed; if (f.y < -5) f.y = 105;
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
          }
        });
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
}

function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(4,10,22,0.97)", border: `1px solid ${cor}30`, boxShadow: `0 0 60px ${cor}10`,
    }}>
      <CanvasNeural />
      {[
        { pos: "top-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: "999px", position: "absolute" }} />
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  );
}

const insights = {
  pt: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Custos com fornecedores aumentaram 8% em relação ao mês anterior. Recomenda-se renegociar contratos.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "Faturamento cresceu 12% — melhor resultado do trimestre! Continue investindo em marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Sua margem líquida está em 18%. Empresas do setor operam com 22-25%. Há espaço para melhorar.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Fluxo de caixa previsto para os próximos 30 dias: positivo em R$ 12.400. Boa liquidez.", cor: "#6ab0ff" },
  ],
  en: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Supplier costs increased 8% compared to last month. Renegotiating contracts is recommended.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "Revenue grew 12% — best result of the quarter! Keep investing in marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Your net margin is 18%. Companies in the sector operate at 22-25%. There is room to improve.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Cash flow forecast for the next 30 days: positive at R$ 12,400. Good liquidity.", cor: "#6ab0ff" },
  ],
  es: [
    { tipo: "alerta", icon: AlertTriangle, texto: "Los costos con proveedores aumentaron 8% respecto al mes anterior. Se recomienda renegociar contratos.", cor: "#f87171" },
    { tipo: "positivo", icon: CheckCircle, texto: "La facturación creció 12% — mejor resultado del trimestre! Sigue invirtiendo en marketing.", cor: "#34d399" },
    { tipo: "sugestao", icon: Lightbulb, texto: "Tu margen neto es del 18%. Las empresas del sector operan entre 22-25%. Hay margen de mejora.", cor: "#fbbf24" },
    { tipo: "info", icon: TrendingUp, texto: "Previsión de flujo de caja para los próximos 30 días: positivo en R$ 12.400. Buena liquidez.", cor: "#6ab0ff" },
  ],
};

const perguntasSugeridas = {
  pt: ["Como posso reduzir meus custos fixos?", "Qual é minha margem de lucro ideal?", "Como melhorar meu fluxo de caixa?"],
  en: ["How can I reduce my fixed costs?", "What is my ideal profit margin?", "How to improve my cash flow?"],
  es: ["¿Cómo puedo reducir mis costos fijos?", "¿Cuál es mi margen de beneficio ideal?", "¿Cómo mejorar mi flujo de caja?"],
};

const respostas: Record<string, string> = {
  "Como posso reduzir meus custos fixos?": "Analisando seus dados, identifiquei 3 oportunidades: 1) Renegociar o aluguel (representa 21% dos custos fixos); 2) Revisar assinaturas de software; 3) Otimizar a folha de pagamento. Potencial de redução: R$ 2.800/mês.",
  "Qual é minha margem de lucro ideal?": "Sua margem atual é de 18%. Para o seu setor, a referência é 22-25%. Recomendo começar pela revisão dos custos com fornecedores.",
  "Como melhorar meu fluxo de caixa?": "Sugiro: 1) Antecipar recebíveis — você tem R$ 1.500 pendentes; 2) Negociar prazos maiores com fornecedores; 3) Criar uma reserva de emergência.",
  "How can I reduce my fixed costs?": "Analyzing your data, I identified 3 opportunities: 1) Renegotiate rent (21% of fixed costs); 2) Review software subscriptions; 3) Optimize payroll. Potential reduction: R$ 2,800/month.",
  "What is my ideal profit margin?": "Your current margin is 18%. The industry benchmark is 22-25%. I recommend starting by reviewing supplier costs.",
  "How to improve my cash flow?": "I suggest: 1) Advance receivables — you have R$ 1,500 pending; 2) Negotiate longer terms with suppliers; 3) Create an emergency reserve.",
  "¿Cómo puedo reducir mis costos fijos?": "Analizando sus datos, identifiqué 3 oportunidades: 1) Renegociar el alquiler; 2) Revisar suscripciones de software; 3) Optimizar la nómina. Reducción potencial: R$ 2.800/mes.",
  "¿Cuál es mi margen de beneficio ideal?": "Su margen actual es del 18%. El benchmark del sector es 22-25%. Recomiendo comenzar revisando los costos con proveedores.",
  "¿Cómo mejorar mi flujo de caja?": "Sugiero: 1) Anticipar cobros pendientes; 2) Negociar plazos más largos con proveedores; 3) Crear una reserva de emergencia.",
};

const textos = {
  pt: { subtitulo: "Análise inteligente dos seus dados financeiros", placeholder: "Pergunte sobre suas finanças...", analisando: "Analisando seus dados..." },
  en: { subtitulo: "Intelligent analysis of your financial data", placeholder: "Ask about your finances...", analisando: "Analyzing your data..." },
  es: { subtitulo: "Análisis inteligente de tus datos financieros", placeholder: "Pregunta sobre tus finanzas...", analisando: "Analizando tus datos..." },
};

export default function IAFinanceira() {
  const { t, idioma } = useLanguage();
  const tx = textos[idioma];
  const inputRef = useRef<HTMLInputElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const msgInicial = idioma === "en"
    ? "Hello! I'm your Financial AI. I've analyzed all your data and I'm ready to help. What would you like to know?"
    : idioma === "es"
    ? "¡Hola! Soy tu IA Financiera. Analicé todos tus datos y estoy listo para ayudar. ¿Qué te gustaría saber?"
    : "Olá! Sou sua IA Financeira. Analisei todos os seus dados e estou pronto para ajudar. O que você gostaria de saber?";

  const [mensagens, setMensagens] = useState<{ role: string; texto: string }[]>([{ role: "assistant", texto: msgInicial }]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensagens, carregando]);

  const enviarMensagem = (texto: string) => {
    if (!texto.trim() || carregando) return;
    const msgUsuario = { role: "user", texto };
    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);
    setTimeout(() => {
      const resposta = respostas[texto] || (
        idioma === "en" ? "Great question! Based on your financial data, I recommend analyzing each cost category in detail. Can I elaborate on a specific area?"
        : idioma === "es" ? "¡Excelente pregunta! Basándome en tus datos financieros, recomiendo analizar cada categoría de costos en detalle. ¿Puedo detallar algún área específica?"
        : "Ótima pergunta! Com base nos seus dados financeiros, recomendo analisar detalhadamente cada categoria de custo. Posso detalhar alguma área específica?"
      );
      setMensagens([...novasMensagens, { role: "assistant", texto: resposta }]);
      setCarregando(false);
    }, 1500);
  };

  const exportarPDF = async () => {
    if (!conteudoRef.current) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(conteudoRef.current, { backgroundColor: "#020810", scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
      pdf.text(`${t.nav.iaFinanceira} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
      let position = 22; let remaining = pdfHeight;
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining);
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight);
        const sourceH = sliceHeight * (canvas.height / pdfHeight);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#020810"; ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight);
        remaining -= sliceHeight; position = 0;
        if (remaining > 0) { pdf.addPage(); position = 0; }
      }
      pdf.save(`axioma-ia-financeira-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <ModuloLayout titulo={t.nav.iaFinanceira} subtitulo={tx.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights[idioma].map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={insight.cor} corB="#6ab0ff" corC="#a78bfa" corD="#34d399">
                <div className="flex items-start gap-4">
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    className="p-2 rounded-xl flex-shrink-0" style={{ background: `${insight.cor}15` }}>
                    <insight.icon size={18} style={{ color: insight.cor }} />
                  </motion.div>
                  <p className="text-sm" style={{ color: "#8aaad4" }}>{insight.texto}</p>
                </div>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Chat */}
        <CanvasBox cor="#6ab0ff" corB="#a78bfa" corC="#34d399" corD="#fbbf24">
          <div className="mb-4">
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-1"
              style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>AXIOMA AI.TECH</motion.p>
            <h3 className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>🤖 {t.nav.iaFinanceira}</h3>
          </div>

          {/* Mensagens */}
          <div ref={chatRef} className="space-y-4 min-h-48 max-h-80 overflow-auto mb-4 pr-1">
            <AnimatePresence>
              {mensagens.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm"
                    style={{ background: m.role === "user" ? "rgba(106,176,255,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(106,176,255,0.3)" : "rgba(59,111,212,0.1)"}`, color: "#c8d8f0" }}>
                    {m.texto}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {carregando && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.1)", color: "#3a5a8a" }}>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>●</motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>●</motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>●</motion.span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sugestões */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {perguntasSugeridas[idioma].map((p, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => enviarMensagem(p)}
                className="text-xs px-3 py-2 rounded-xl"
                style={{ background: "rgba(106,176,255,0.08)", border: "1px solid rgba(106,176,255,0.2)", color: "#6ab0ff" }}>
                {p}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)}
              placeholder={tx.placeholder}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
            />
            <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(106,176,255,0.4)" }} whileTap={{ scale: 0.95 }}
              onClick={() => enviarMensagem(input)}
              className="px-4 py-3 rounded-xl"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              <Send size={18} />
            </motion.button>
          </div>
        </CanvasBox>
      </div>
    </ModuloLayout>
  );
}