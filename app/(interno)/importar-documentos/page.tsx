"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TipoDocumento = { tipo: string; destino: string; icon: string; cor: string; };
type Importacao = { id: string; nome_arquivo: string; tipo_documento: string; destino: string; status: string; created_at: string; user_id: string; empresa_id: string; };

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
    // Letras E números flutuando
    const chars = "AXIOMA IMPORTAR AI TECH 0123456789 XML PDF CSV NF R$".split("").map((char) => ({
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

export default function ImportarPage() {
  const { t, idioma } = useLanguage();
  const imp = t.importar;
  const conteudoRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tiposDocumento: TipoDocumento[] = [
    { tipo: idioma === "pt" ? "Extrato Bancário" : idioma === "en" ? "Bank Statement" : "Extracto Bancario", destino: idioma === "pt" ? "Fluxo de Caixa + Receitas" : idioma === "en" ? "Cash Flow + Revenue" : "Flujo de Caja", icon: "🏦", cor: "#6ab0ff" },
    { tipo: idioma === "pt" ? "Nota Fiscal (XML/PDF)" : idioma === "en" ? "Invoice (XML/PDF)" : "Factura (XML/PDF)", destino: idioma === "pt" ? "Fornecedores + Custos" : idioma === "en" ? "Suppliers + Costs" : "Proveedores", icon: "🧾", cor: "#34d399" },
    { tipo: idioma === "pt" ? "Planilha de Vendas" : idioma === "en" ? "Sales Spreadsheet" : "Hoja de Ventas", destino: idioma === "pt" ? "Receitas" : idioma === "en" ? "Revenue" : "Ingresos", icon: "📊", cor: "#fbbf24" },
    { tipo: idioma === "pt" ? "Contrato de Dívida" : idioma === "en" ? "Debt Contract" : "Contrato de Deuda", destino: idioma === "pt" ? "Endividamento" : idioma === "en" ? "Debt" : "Endeudamiento", icon: "📋", cor: "#f87171" },
    { tipo: idioma === "pt" ? "Folha de Pagamento" : idioma === "en" ? "Payroll" : "Nómina", destino: idioma === "pt" ? "Custos Fixos" : idioma === "en" ? "Fixed Costs" : "Costos Fijos", icon: "👥", cor: "#a78bfa" },
    { tipo: idioma === "pt" ? "Documento Fiscal" : idioma === "en" ? "Tax Document" : "Documento Fiscal", destino: idioma === "pt" ? "IA Tributária" : idioma === "en" ? "Tax AI" : "IA Tributaria", icon: "🏛️", cor: "#fb923c" },
  ];

  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [tipoDetectado, setTipoDetectado] = useState<TipoDocumento | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const { data } = await supabase.from("importacoes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setImportacoes(data || []);
    setLoading(false);
  }

  function detectarTipo(nomeArquivo: string): TipoDocumento {
    const nome = nomeArquivo.toLowerCase();
    if (nome.includes("extrato") || nome.includes("bancario") || nome.includes("banco") || nome.includes("statement")) return tiposDocumento[0];
    if (nome.includes("nf") || nome.includes("nota") || nome.includes(".xml") || nome.includes("invoice")) return tiposDocumento[1];
    if (nome.includes("venda") || nome.includes("fatura") || nome.includes("receita") || nome.includes("sales")) return tiposDocumento[2];
    if (nome.includes("divida") || nome.includes("contrato") || nome.includes("emprestimo") || nome.includes("debt")) return tiposDocumento[3];
    if (nome.includes("folha") || nome.includes("pagamento") || nome.includes("salario") || nome.includes("payroll")) return tiposDocumento[4];
    return tiposDocumento[5];
  }

  function processarArquivo(file: File) {
    setArquivoSelecionado(file); setAnalisando(true); setTipoDetectado(null); setSucesso(false);
    setTimeout(() => { setTipoDetectado(detectarTipo(file.name)); setAnalisando(false); }, 2000);
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setArrastandoArquivo(true); }
  function onDragLeave() { setArrastandoArquivo(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setArrastandoArquivo(false);
    const file = e.dataTransfer.files[0]; if (file) processarArquivo(file);
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (file) processarArquivo(file);
  }

  async function confirmarLancamento() {
    if (!arquivoSelecionado || !tipoDetectado) return;
    setConfirmando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("importacoes").insert({
      nome_arquivo: arquivoSelecionado.name, tipo_documento: tipoDetectado.tipo,
      destino: tipoDetectado.destino, status: "processado",
      user_id: user.id, empresa_id: empresaId,
    });
    setConfirmando(false); setSucesso(true);
    setArquivoSelecionado(null); setTipoDetectado(null);
    carregarDados();
    setTimeout(() => setSucesso(false), 3000);
  }

  function novaImportacao() {
    setArquivoSelecionado(null); setTipoDetectado(null); setSucesso(false); setAnalisando(false);
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
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
      pdf.text(`${imp.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-importar-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <ModuloLayout titulo={`📄 ${imp.titulo}`} subtitulo={imp.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Coluna esquerda */}
        <div className="space-y-4">

          {/* Drop Zone */}
          {!arquivoSelecionado && !sucesso && (
            <CanvasBox cor={arrastandoArquivo ? "#6ab0ff" : "#3b6fd4"} corB="#34d399" corC="#a78bfa" corD="#f472b6">
              <div
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="text-center cursor-pointer py-6"
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl mb-4">📂</motion.div>
                <p className="text-lg font-semibold mb-1" style={{ color: "#c8d8f0" }}>{imp.arrasteAqui}</p>
                <p className="text-sm mb-3" style={{ color: "#3a5a8a" }}>{imp.ouClique}</p>
                <span className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(59,111,212,0.15)", color: "#6ab0ff" }}>{imp.formatosAceitos}</span>
                <input ref={inputRef} type="file" accept=".pdf,.xml,.xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
              </div>
            </CanvasBox>
          )}

          {/* Analisando */}
          <AnimatePresence>
            {analisando && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CanvasBox cor="#6ab0ff" corB="#a78bfa" corC="#34d399" corD="#fbbf24">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="font-semibold" style={{ color: "#6ab0ff" }}>{imp.analisando}</motion.p>
                    <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{arquivoSelecionado?.name}</p>
                  </div>
                </CanvasBox>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tipo detectado */}
          <AnimatePresence>
            {tipoDetectado && !sucesso && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CanvasBox cor={tipoDetectado.cor} corB="#6ab0ff" corC="#a78bfa" corD="#34d399">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="text-3xl">{tipoDetectado.icon}</motion.span>
                      <div>
                        <p className="text-xs" style={{ color: "#3a5a8a" }}>{imp.tipoIdentificado}</p>
                        <p className="font-bold" style={{ color: "#c8d8f0" }}>{tipoDetectado.tipo}</p>
                      </div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${tipoDetectado.cor}20` }}>
                      <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{imp.destinoSugerido}</p>
                      <p className="text-sm font-semibold" style={{ color: tipoDetectado.cor }}>→ {tipoDetectado.destino}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(59,111,212,0.1)" }}>
                      <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{imp.arquivo}</p>
                      <p className="text-sm" style={{ color: "#c8d8f0" }}>📄 {arquivoSelecionado?.name}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={novaImportacao} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{imp.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${tipoDetectado.cor}40` }} whileTap={{ scale: 0.98 }}
                        onClick={confirmarLancamento} disabled={confirmando}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                        {confirmando ? "..." : imp.confirmarLancamento}
                      </motion.button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sucesso */}
          <AnimatePresence>
            {sucesso && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                  <div className="text-center py-6">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-5xl mb-3">✅</motion.div>
                    <p className="text-lg font-bold" style={{ color: "#34d399" }}>{imp.sucesso}</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      onClick={novaImportacao}
                      className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {imp.novoImporte}
                    </motion.button>
                  </div>
                </CanvasBox>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tipos de documento */}
          <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#f472b6">
            <p className="text-xs font-semibold mb-4 tracking-wider uppercase" style={{ color: "#3a5a8a" }}>
              {idioma === "pt" ? "Tipos de Documento" : idioma === "en" ? "Document Types" : "Tipos de Documento"}
            </p>
            <div className="space-y-3">
              {tiposDocumento.map((tipo, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-1.5">
                  <span className="text-xl">{tipo.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#c8d8f0" }}>{tipo.tipo}</p>
                    <p className="text-xs" style={{ color: tipo.cor }}>→ {tipo.destino}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CanvasBox>
        </div>

        {/* Coluna direita — histórico */}
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: "#6ab0ff" }}>🕓 {imp.historico}</p>
          {loading ? (
            <CanvasBox cor="#6ab0ff">
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </CanvasBox>
          ) : importacoes.length === 0 ? (
            <CanvasBox cor="#6ab0ff">
              <div className="py-8 text-center"><p style={{ color: "#3a5a8a" }}>{imp.semImportacoes}</p></div>
            </CanvasBox>
          ) : (
            <div className="space-y-3">
              {importacoes.map((item, i) => {
                const tipo = tiposDocumento.find(tp => tp.tipo === item.tipo_documento) || tiposDocumento[0];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CanvasBox cor={tipo.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl flex-shrink-0">{tipo.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{item.nome_arquivo}</p>
                            <p className="text-xs mt-0.5" style={{ color: tipo.cor }}>→ {item.destino}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                          style={{ background: item.status === "processado" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: item.status === "processado" ? "#34d399" : "#f87171" }}>
                          {item.status === "processado" ? imp.processado : imp.falhou}
                        </span>
                      </div>
                    </CanvasBox>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModuloLayout>
  );
}