"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Lightbulb, Shield, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const alertas = [
  { icon: AlertTriangle, texto: "Reforma Tributaria 2026: IBS e CBS substituem PIS/COFINS. Sua empresa pode ser impactada.", cor: "#f87171" },
  { icon: Lightbulb, texto: "Simples Nacional: verifique se seu faturamento ainda permite enquadramento (ate R$ 4,8M/ano).", cor: "#fbbf24" },
  { icon: CheckCircle, texto: "JCP (Juros sobre Capital Proprio): sua empresa pode deduzir ate R$ 18.000/mes.", cor: "#34d399" },
  { icon: Shield, texto: "Incentivos fiscais disponiveis para seu setor: Lei do Bem, Rota 2030, Pro-Inovacao.", cor: "#a78bfa" },
];

const economias = [
  { titulo: "Troca de Regime", descricao: "Lucro Real para Lucro Presumido", economia: "ate 30%", cor: "#34d399" },
  { titulo: "JCP", descricao: "Juros sobre Capital Proprio", economia: "ate 15%", cor: "#6ab0ff" },
  { titulo: "Reforma Tributaria", descricao: "Planejamento antecipado", economia: "ate 34%", cor: "#a78bfa" },
  { titulo: "Incentivos Fiscais", descricao: "Lei do Bem e similares", economia: "ate 75%", cor: "#fbbf24" },
];

const respostas: Record<string, string> = {
  "Qual regime tributario e melhor para mim?": "Analisando seu faturamento de R$ 62.000/mes (R$ 744.000/ano), o Simples Nacional pode ser vantajoso se sua margem for alta. Porem, se voce tem muitos funcionarios CLT, o Lucro Presumido pode reduzir a carga em ate 22%. Recomendo uma simulacao com seu contador usando esses dados.",
  "Como funciona o JCP?": "JCP (Juros sobre Capital Proprio) permite remunerar socios com tributacao menor (15% IR na fonte vs 27,5% no pro-labore). Com patrimonio liquido de R$ 200.000, voce pode distribuir ate R$ 18.000/mes via JCP, economizando aproximadamente R$ 2.700/mes em impostos.",
  "O que muda com a Reforma Tributaria?": "A Reforma unifica PIS, COFINS e IPI no CBS, e ICMS e ISS no IBS. Transicao: 2026-2032. Para PMEs: o Simples Nacional permanece, mas havera ajustes nas aliquotas. Recomendo mapear agora seus principais insumos e clientes para simular o impacto antes de 2027.",
  "Quais deducoes posso usar?": "Para sua empresa, identifiquei: 1) Depreciacao acelerada de equipamentos; 2) Deducao de despesas com P&D (Lei do Bem); 3) PAT - Programa de Alimentacao do Trabalhador; 4) Vale-transporte e beneficios dedutiveis. Potencial de reducao na base de calculo: R$ 8.400/mes.",
};

const perguntasSugeridas = [
  "Qual regime tributario e melhor para mim?",
  "Como funciona o JCP?",
  "O que muda com a Reforma Tributaria?",
  "Quais deducoes posso usar?",
];

const paises = ["🇧🇷 Brasil", "🇺🇸 EUA", "🇵🇹 Portugal", "🇩🇪 Alemanha", "🇬🇧 Reino Unido", "🇨🇦 Canada", "🇦🇺 Australia"];

export default function IATributaria() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [mensagens, setMensagens] = useState<{ role: string; texto: string }[]>([
    { role: "assistant", texto: "Ola! Sou sua IA Tributaria Premium. Analisei seu perfil fiscal e estou pronto para ajudar com planejamento tributario legal e estrategico. Como posso reduzir sua carga tributaria?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [paisSelecionado, setPaisSelecionado] = useState("🇧🇷 Brasil");
  const [exportando, setExportando] = useState(false);

  const enviarMensagem = (texto: string) => {
    if (!texto.trim()) return;
    const msgUsuario = { role: "user", texto };
    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);
    setTimeout(() => {
      const resposta = respostas[texto] || "Otima questao tributaria! Para uma analise precisa, recomendo combinar este planejamento com seu contador. Posso detalhar alguma estrategia especifica de reducao de impostos dentro da legalidade?";
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
      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t.nav.iaTributaria} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-ia-tributaria-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#3a5a8a" }}><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>{t.nav.iaTributaria}</h2>
              <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>PREMIUM</span>
            </div>
            <p className="text-sm" style={{ color: "#3a5a8a" }}>Planejamento tributario legal e estrategico</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={paisSelecionado} onChange={(e) => setPaisSelecionado(e.target.value)} className="px-4 py-2 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(167,139,250,0.3)", color: "#c8d8f0" }}>
            {paises.map(p => <option key={p}>{p}</option>)}
          </select>
          <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "#dc2626", color: "#fff" }}>
            <Download size={18}/>{exportando ? "Gerando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      <div ref={conteudoRef}>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {economias.map((e, i) => (
            <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${e.cor}22` }}>
              <p className="text-3xl font-black mb-1" style={{ color: e.cor }}>{e.economia}</p>
              <p className="text-sm font-bold mb-1" style={{ color: "#c8d8f0" }}>{e.titulo}</p>
              <p className="text-xs" style={{ color: "#3a5a8a" }}>{e.descricao}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {alertas.map((a, i) => (
            <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${a.cor}22` }}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${a.cor}15` }}>
                <a.icon size={20} style={{ color: a.cor }} />
              </div>
              <p className="text-sm" style={{ color: "#8aaad4" }}>{a.texto}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(167,139,250,0.2)" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(167,139,250,0.15)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#a78bfa" }}>⚡ {t.nav.iaTributariaPremium}</h3>
          </div>

          <div className="p-6 space-y-4 min-h-64 max-h-96 overflow-auto">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-md px-4 py-3 rounded-2xl text-sm" style={{ background: m.role === "user" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(167,139,250,0.3)" : "rgba(167,139,250,0.1)"}`, color: "#c8d8f0" }}>
                  {m.texto}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.1)", color: "#3a5a8a" }}>
                  Consultando legislacao tributaria...
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              {perguntasSugeridas.map((p, i) => (
                <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)}
                placeholder="Pergunte sobre impostos e planejamento tributario..."
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", color: "#c8d8f0" }}
              />
              <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "#1a3a5a" }}>As informacoes sao educativas. Consulte sempre um contador para decisoes fiscais.</p>
          </div>
        </div>
      </div>
    </div>
  );
}