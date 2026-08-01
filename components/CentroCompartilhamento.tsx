"use client";
import { X, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CanvasBox } from "./CanvasBox";
import { canaisCompartilhamento, cfoT } from "../lib/cfoTextos";

// Centro de Compartilhamento padrão do projeto (extraído do Receitas, o
// original) — WhatsApp/Telegram/Gmail/Outlook + Copiar (resumo/detalhado) +
// PDF. Reutilizado por todo módulo que precisa compartilhar; nunca usar
// navigator.share nativo (abre o seletor do SO, fora do padrão visual).

type Props = {
  aberto: boolean;
  onFechar: () => void;
  lang: string;
  textoResumo: string;
  assunto: string;
  textoDetalhado?: string;
  onExportarPDF?: () => void;
  cor?: string;
};

export function CentroCompartilhamento({
  aberto, onFechar, lang, textoResumo, assunto, textoDetalhado, onExportarPDF, cor = "#8b5cf6",
}: Props) {
  const cx = cfoT(lang);
  const [copiado, setCopiado] = useState(false);
  const [copiadoDetalhado, setCopiadoDetalhado] = useState(false);
  const canais = canaisCompartilhamento(textoResumo, assunto);

  const copiar = async () => {
    try { await navigator.clipboard.writeText(textoResumo); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {}
  };
  const copiarDetalhado = async () => {
    if (!textoDetalhado) return;
    try { await navigator.clipboard.writeText(textoDetalhado); setCopiadoDetalhado(true); setTimeout(() => setCopiadoDetalhado(false), 1800); } catch {}
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onFechar}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }}
            className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CanvasBox cor={cor}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#c4b5fd" }}>AXIOMA AI.TECH</p>
                  <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#5a7a9a" }}>
                  <X size={20} />
                </motion.button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {canais.map((c) => (
                  <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>
                    {c.nome}
                  </a>
                ))}
                <button onClick={copiar}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>
                  {copiado ? cx.copiado : `${cx.copiar} (resumo)`}
                </button>
                {textoDetalhado && (
                  <button onClick={copiarDetalhado}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>
                    {copiadoDetalhado ? cx.copiado : `${cx.copiar} (detalhado)`}
                  </button>
                )}
                {onExportarPDF && (
                  <button onClick={() => { onFechar(); onExportarPDF(); }}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
                    PDF
                  </button>
                )}
              </div>
            </CanvasBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Botão padrão que abre o Centro — mesmo visual usado no Receitas.
export function BotaoCompartilhar({ onClick, texto, cor = "#8b5cf6", corTexto = "#c4b5fd" }: { onClick: () => void; texto: string; cor?: string; corTexto?: string }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
      style={{ background: `${cor}26`, border: `1px solid ${cor}66`, color: corTexto }}>
      <Share2 size={16} /> {texto}
    </motion.button>
  );
}
