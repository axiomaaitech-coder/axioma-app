"use client";
import { X, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CanvasBox } from "./CanvasBox";
import Modal from "./Modal";
import { canaisCompartilhamento, cfoT } from "../lib/cfoTextos";
import { useThemeAxioma } from "../lib/ThemeContext";

// Centro de Compartilhamento padrão do projeto (extraído do Receitas, o
// original) — WhatsApp/Telegram/Gmail/Outlook + Copiar (resumo/detalhado) +
// PDF. Reutilizado por todo módulo que precisa compartilhar; nunca usar
// navigator.share nativo (abre o seletor do SO, fora do padrão visual).
// Via Modal (portal) — antes era um `position: fixed` direto, preso atrás
// do Header em qualquer módulo cujo ModuloLayout anima com transform
// (mesmo bug da seção 3-I do STATUS-AXIOMA, ver components/Modal.tsx).

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
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
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
    <Modal open={aberto} onClose={onFechar}>
      <CanvasBox cor={cor} fundo={temaClaro ? "#f6f7c4" : undefined} premium3d={temaClaro}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: temaClaro ? "#101b3d" : "#c4b5fd" }}>AXIOMA AI.TECH</p>
            <h3 className="text-lg font-bold" style={{ color: temaClaro ? "#101b3d" : "#c8d8f0" }}>{cx.centroCompart}</h3>
          </div>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: temaClaro ? "#374151" : "#5a7a9a" }}>
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
            style={{ background: temaClaro ? "rgba(16,27,61,0.06)" : "rgba(148,163,184,0.12)", border: `1px solid ${temaClaro ? "rgba(16,27,61,0.18)" : "rgba(148,163,184,0.4)"}`, color: temaClaro ? "#374151" : "#cbd5e1" }}>
            {copiado ? cx.copiado : `${cx.copiar} (resumo)`}
          </button>
          {textoDetalhado && (
            <button onClick={copiarDetalhado}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: temaClaro ? "rgba(16,27,61,0.06)" : "rgba(148,163,184,0.12)", border: `1px solid ${temaClaro ? "rgba(16,27,61,0.18)" : "rgba(148,163,184,0.4)"}`, color: temaClaro ? "#374151" : "#cbd5e1" }}>
              {copiadoDetalhado ? cx.copiado : `${cx.copiar} (detalhado)`}
            </button>
          )}
          {onExportarPDF && (
            <button onClick={() => { onFechar(); onExportarPDF(); }}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: temaClaro ? "rgba(255,90,107,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${temaClaro ? "rgba(255,90,107,0.4)" : "rgba(239,68,68,0.4)"}`, color: temaClaro ? "#ff5a6b" : "#fca5a5" }}>
              PDF
            </button>
          )}
        </div>
      </CanvasBox>
    </Modal>
  );
}

// Botão padrão que abre o Centro — mesmo visual usado no Receitas.
export function BotaoCompartilhar({ onClick, texto, cor = "#8b5cf6", corTexto = "#c4b5fd", solido }: {
  onClick: () => void; texto: string; cor?: string; corTexto?: string;
  /** Opt-in — fundo SÓLIDO em degradê verde (igual ao botão Exportar PDF do
   * ModuloLayout), no lugar do pill translúcido de sempre. undefined =
   * comportamento idêntico ao de sempre (nenhum módulo muda sem passar isso). */
  solido?: boolean;
}) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
      style={solido
        ? { background: "linear-gradient(135deg, #16a97d, #2ecc9b)", border: "none", color: "#fff" }
        : { background: `${cor}26`, border: `1px solid ${cor}66`, color: corTexto }}>
      <Share2 size={16} /> {texto}
    </motion.button>
  );
}
