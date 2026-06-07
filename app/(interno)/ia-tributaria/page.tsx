"use client";
import { useState, useRef, useEffect } from "react";
import { Send, FileText, AlertTriangle, CheckCircle, Lightbulb, Shield } from "lucide-react";
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
    const chars = "AXIOMA IR TRIBUTO SIMPLES MEI CNPJ CPF IRPF CSLL PIS COFINS ISS ICMS 0 1 2 3 4 5 6 7 8 9 R$ %".split(" ").map((char) => ({
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
    { icon: AlertTriangle, texto: "Sua empresa pode se enquadrar no Simples Nacional. Isso reduziria a carga tributária em até 30%.", cor: "#fbbf24" },
    { icon: CheckCircle, texto: "Todos os impostos do mês estão em dia. Próximo vencimento: DAS em 20/07/2026.", cor: "#34d399" },
    { icon: Lightbulb, texto: "Identificamos R$ 3.200 em deduções fiscais não aproveitadas no último trimestre.", cor: "#6ab0ff" },
    { icon: Shield, texto: "Risco fiscal baixo. Sua empresa está dentro dos parâmetros exigidos pela Receita Federal.", cor: "#a78bfa" },
  ],
  en: [
    { icon: AlertTriangle, texto: "Your company may qualify for the Simples Nacional regime, reducing tax burden by up to 30%.", cor: "#fbbf24" },
    { icon: CheckCircle, texto: "All monthly taxes are up to date. Next due date: DAS on 07/20/2026.", cor: "#34d399" },
    { icon: Lightbulb, texto: "We identified R$ 3,200 in unused tax deductions in the last quarter.", cor: "#6ab0ff" },
    { icon: Shield, texto: "Low tax risk. Your company is within parameters required by the Federal Revenue.", cor: "#a78bfa" },
  ],
  es: [
    { icon: AlertTriangle, texto: "Su empresa puede calificar para el régimen Simples Nacional, reduciendo la carga fiscal hasta 30%.", cor: "#fbbf24" },
    { icon: CheckCircle, texto: "Todos los impuestos del mes están al día. Próximo vencimiento: DAS el 20/07/2026.", cor: "#34d399" },
    { icon: Lightbulb, texto: "Identificamos R$ 3.200 en deducciones fiscales no aprovechadas en el último trimestre.", cor: "#6ab0ff" },
    { icon: Shield, texto: "Riesgo fiscal bajo. Su empresa está dentro de los parámetros exigidos por la Receita Federal.", cor: "#a78bfa" },
  ],
};

const regimes = {
  pt: [
    { nome: "Simples Nacional", aliquota: "4-19%", desc: "Faturamento até R$ 4,8M/ano", cor: "#34d399", recomendado: true },
    { nome: "Lucro Presumido", aliquota: "13,33-16%", desc: "Faturamento até R$ 78M/ano", cor: "#6ab0ff", recomendado: false },
    { nome: "Lucro Real", aliquota: "Variável", desc: "Grandes empresas ou bancos", cor: "#a78bfa", recomendado: false },
    { nome: "MEI", aliquota: "R$ 76/mês", desc: "Faturamento até R$ 144K/ano", cor: "#fbbf24", recomendado: false },
  ],
  en: [
    { nome: "Simples Nacional", aliquota: "4-19%", desc: "Revenue up to R$ 4.8M/year", cor: "#34d399", recomendado: true },
    { nome: "Lucro Presumido", aliquota: "13.33-16%", desc: "Revenue up to R$ 78M/year", cor: "#6ab0ff", recomendado: false },
    { nome: "Lucro Real", aliquota: "Variable", desc: "Large companies or banks", cor: "#a78bfa", recomendado: false },
    { nome: "MEI", aliquota: "R$ 76/month", desc: "Revenue up to R$ 144K/year", cor: "#fbbf24", recomendado: false },
  ],
  es: [
    { nome: "Simples Nacional", aliquota: "4-19%", desc: "Facturación hasta R$ 4,8M/año", cor: "#34d399", recomendado: true },
    { nome: "Lucro Presumido", aliquota: "13,33-16%", desc: "Facturación hasta R$ 78M/año", cor: "#6ab0ff", recomendado: false },
    { nome: "Lucro Real", aliquota: "Variable", desc: "Grandes empresas o bancos", cor: "#a78bfa", recomendado: false },
    { nome: "MEI", aliquota: "R$ 76/mes", desc: "Facturación hasta R$ 144K/año", cor: "#fbbf24", recomendado: false },
  ],
};

const perguntasSugeridas = {
  pt: ["Qual o melhor regime tributário para mim?", "Como calcular o DAS do Simples Nacional?", "Quais despesas posso deduzir no IR?", "Como reduzir minha carga tributária?"],
  en: ["What is the best tax regime for me?", "How to calculate Simples Nacional DAS?", "What expenses can I deduct from income tax?", "How to reduce my tax burden?"],
  es: ["¿Cuál es el mejor régimen fiscal para mí?", "¿Cómo calcular el DAS del Simples Nacional?", "¿Qué gastos puedo deducir en el IR?", "¿Cómo reducir mi carga tributaria?"],
};

const respostas: Record<string, string> = {
  "Qual o melhor regime tributário para mim?": "Com base no seu faturamento atual, o Simples Nacional é o regime mais vantajoso. Você pagaria uma alíquota efetiva de aproximadamente 6,5%, economizando cerca de R$ 1.800/mês em comparação ao Lucro Presumido. Recomendo fortemente a migração se ainda não estiver nesse regime.",
  "Como calcular o DAS do Simples Nacional?": "O DAS é calculado sobre o faturamento bruto do mês anterior. Com base nos seus dados: Faturamento R$ 62.000 × alíquota 6,5% = R$ 4.030 de DAS. O vencimento é sempre no dia 20 do mês subsequente. Posso gerar o boleto automaticamente.",
  "Quais despesas posso deduzir no IR?": "Para sua empresa, as principais deduções são: 1) Salários e encargos trabalhistas; 2) Aluguel do escritório; 3) Material de escritório; 4) Equipamentos (depreciação); 5) Despesas com marketing. Identificamos R$ 3.200 não aproveitados no último trimestre!",
  "Como reduzir minha carga tributária?": "Estratégias recomendadas: 1) Revisar o regime tributário (potencial de -30%); 2) Aproveitar todas as deduções permitidas; 3) Planejar o timing de receitas e despesas; 4) Utilizar benefícios fiscais do setor. Implementando tudo, estimo uma economia de R$ 8.400/ano.",
  "What is the best tax regime for me?": "Based on your current revenue, Simples Nacional is the most advantageous regime. You'd pay an effective rate of approximately 6.5%, saving about R$ 1,800/month compared to Lucro Presumido. I strongly recommend migrating if you're not already in this regime.",
  "How to calculate Simples Nacional DAS?": "DAS is calculated on the previous month's gross revenue. Based on your data: Revenue R$ 62,000 × rate 6.5% = R$ 4,030 DAS. It's always due on the 20th of the following month.",
  "What expenses can I deduct from income tax?": "For your company, main deductions are: 1) Salaries and labor charges; 2) Office rent; 3) Office supplies; 4) Equipment (depreciation); 5) Marketing expenses. We identified R$ 3,200 unused in the last quarter!",
  "How to reduce my tax burden?": "Recommended strategies: 1) Review tax regime (potential -30%); 2) Use all allowed deductions; 3) Plan timing of revenue and expenses; 4) Use sector tax benefits. Implementing everything, I estimate savings of R$ 8,400/year.",
  "¿Cuál es el mejor régimen fiscal para mí?": "Basándonos en su facturación actual, el Simples Nacional es el régimen más ventajoso. Pagaría una alícuota efectiva de aproximadamente 6,5%, ahorrando unos R$ 1.800/mes en comparación al Lucro Presumido.",
  "¿Cómo calcular el DAS del Simples Nacional?": "El DAS se calcula sobre la facturación bruta del mes anterior. Con sus datos: Facturación R$ 62.000 × alícuota 6,5% = R$ 4.030 de DAS. El vencimiento es siempre el día 20 del mes siguiente.",
  "¿Qué gastos puedo deducir en el IR?": "Para su empresa, las principales deducciones son: 1) Salarios y cargas laborales; 2) Alquiler de oficina; 3) Material de oficina; 4) Equipos (depreciación); 5) Gastos de marketing. ¡Identificamos R$ 3.200 no aprovechados en el último trimestre!",
  "¿Cómo reducir mi carga tributaria?": "Estrategias recomendadas: 1) Revisar el régimen fiscal (-30% potencial); 2) Aprovechar todas las deducciones; 3) Planificar el timing de ingresos y gastos; 4) Utilizar beneficios fiscales del sector. Estimo un ahorro de R$ 8.400/año.",
};

const textos = {
  pt: {
    titulo: "IA Tributária",
    subtitulo: "Inteligência fiscal para sua empresa — impostos, regimes e otimizações",
    placeholder: "Pergunte sobre impostos, regimes tributários...",
    analisando: "Consultando base tributária...",
    regimesTitle: "Regimes Tributários",
    recomendado: "✨ Recomendado",
    aliquota: "Alíquota",
  },
  en: {
    titulo: "Tax AI",
    subtitulo: "Tax intelligence for your company — taxes, regimes and optimizations",
    placeholder: "Ask about taxes, tax regimes...",
    analisando: "Consulting tax database...",
    regimesTitle: "Tax Regimes",
    recomendado: "✨ Recommended",
    aliquota: "Rate",
  },
  es: {
    titulo: "IA Tributaria",
    subtitulo: "Inteligencia fiscal para su empresa — impuestos, regímenes y optimizaciones",
    placeholder: "Pregunta sobre impuestos, regímenes fiscales...",
    analisando: "Consultando base tributaria...",
    regimesTitle: "Regímenes Fiscales",
    recomendado: "✨ Recomendado",
    aliquota: "Alícuota",
  },
};

export default function IATributaria() {
  const { idioma } = useLanguage();
  const tx = textos[idioma];
  const inputRef = useRef<HTMLInputElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const msgInicial = idioma === "en"
    ? "Hello! I'm your Tax AI. I've analyzed your tax situation and I'm ready to help you save on taxes legally. What would you like to know?"
    : idioma === "es"
    ? "¡Hola! Soy tu IA Tributaria. Analicé tu situación fiscal y estoy listo para ayudarte a ahorrar impuestos legalmente. ¿Qué te gustaría saber?"
    : "Olá! Sou sua IA Tributária. Analisei sua situação fiscal e estou pronto para ajudar você a economizar impostos legalmente. O que gostaria de saber?";

  const [mensagens, setMensagens] = useState<{ role: string; texto: string }[]>([{ role: "assistant", texto: msgInicial }]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"chat" | "regimes">("chat");

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
        idioma === "en" ? "Great question about taxation! Based on your financial data, I recommend consulting a tax specialist for this specific case. However, based on your current situation, there may be tax optimization opportunities. Would you like me to analyze a specific area?"
        : idioma === "es" ? "¡Excelente pregunta sobre tributación! Basándome en sus datos financieros, recomiendo consultar a un especialista fiscal para este caso específico. Sin embargo, hay oportunidades de optimización fiscal. ¿Le gustaría que analice un área específica?"
        : "Ótima pergunta sobre tributação! Com base nos seus dados financeiros, recomendo consultar um especialista tributário para este caso específico. No entanto, existem oportunidades de otimização fiscal. Gostaria que eu analise alguma área específica?"
      );
      setMensagens([...novasMensagens, { role: "assistant", texto: resposta }]);
      setCarregando(false);
    }, 1800);
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
      pdf.text(`${tx.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-ia-tributaria-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <ModuloLayout titulo={`🏛️ ${tx.titulo}`} subtitulo={tx.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Insights tributários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights[idioma].map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={insight.cor} corB="#6ab0ff" corC="#a78bfa" corD="#34d399">
                <div className="flex items-start gap-4">
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    className="p-2 rounded-xl flex-shrink-0" style={{ background: `${insight.cor}15` }}>
                    <insight.icon size={18} style={{ color: insight.cor }} />
                  </motion.div>
                  <p className="text-sm leading-relaxed" style={{ color: "#8aaad4" }}>{insight.texto}</p>
                </div>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Abas Chat / Regimes */}
        <div className="flex gap-2">
          {[
            { key: "chat", label: "🤖 " + (idioma === "pt" ? "Chat Tributário" : idioma === "en" ? "Tax Chat" : "Chat Fiscal") },
            { key: "regimes", label: "📋 " + tx.regimesTitle },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAbaAtiva(a.key as typeof abaAtiva)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: abaAtiva === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,22,40,0.8)", color: abaAtiva === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${abaAtiva === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}`, boxShadow: abaAtiva === a.key ? "0 0 12px rgba(106,176,255,0.2)" : "none" }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* Chat */}
        {abaAtiva === "chat" && (
          <CanvasBox cor="#6ab0ff" corB="#a78bfa" corC="#34d399" corD="#fbbf24">
            <div className="mb-4">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>AXIOMA AI.TECH</motion.p>
              <h3 className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>🏛️ {tx.titulo}</h3>
            </div>

            <div ref={chatRef} className="space-y-4 min-h-48 max-h-80 overflow-auto mb-4 pr-1">
              <AnimatePresence>
                {mensagens.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed"
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

            <div className="flex gap-3">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)}
                placeholder={tx.placeholder}
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(106,176,255,0.4)" }} whileTap={{ scale: 0.95 }}
                onClick={() => enviarMensagem(input)}
                className="px-4 py-3 rounded-xl"
                style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                <Send size={18} />
              </motion.button>
            </div>
          </CanvasBox>
        )}

        {/* Regimes Tributários */}
        {abaAtiva === "regimes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {regimes[idioma].map((regime, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <CanvasBox cor={regime.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{regime.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{regime.desc}</p>
                    </div>
                    {regime.recomendado && (
                      <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                        className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: `${regime.cor}20`, color: regime.cor, border: `1px solid ${regime.cor}40` }}>
                        {tx.recomendado}
                      </motion.span>
                    )}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${regime.cor}20` }}>
                    <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{tx.aliquota}</p>
                    <p className="text-xl font-black" style={{ color: regime.cor, textShadow: `0 0 20px ${regime.cor}60` }}>{regime.aliquota}</p>
                  </div>
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ModuloLayout>
  );
}