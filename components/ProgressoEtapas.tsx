"use client";
// Andamento de uma tarefa demorada em etapas (ex.: ler/importar um documento).
// Microinterações: documento com linha de leitura passando, etapas que acendem
// (feita ✓ / em andamento pulsando / pendente), barra de progresso com brilho
// correndo e tempo decorrido — a pessoa sempre sabe o que está acontecendo.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";

export type EtapaProgresso = { id: string; rotulo: string };

export default function ProgressoEtapas({ etapas, atual, titulo, detalhe, dica, claro, rotuloTempo }: {
  etapas: EtapaProgresso[];
  atual: string;
  titulo: string;
  /** ex.: nome do arquivo */
  detalhe?: string;
  /** ex.: "Não feche esta página." */
  dica?: string;
  claro?: boolean;
  /** ex.: (s) => `${s}s` */
  rotuloTempo?: (segundos: number) => string;
}) {
  const indice = Math.max(0, etapas.findIndex((e) => e.id === atual));
  const pct = Math.round(((indice + 0.5) / etapas.length) * 100);
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const ini = Date.now();
    const id = setInterval(() => setSegundos(Math.floor((Date.now() - ini) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const NAVY = "#101b3d", MENTA = "#2ecc9b", MENTA_ESC = "#0f7d5c";
  const texto = claro ? NAVY : "#e6edf5";
  const sec = claro ? "#374151" : "#a3b1c2";
  const trilho = claro ? "rgba(16,27,61,0.10)" : "rgba(255,255,255,0.10)";

  return (
    <div className="py-4" role="status" aria-live="polite">
      <div className="flex items-center gap-4 mb-5">
        {/* Documento sendo lido */}
        <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: claro ? "#ffffff" : "rgba(255,255,255,0.06)", border: `1px solid ${MENTA}66` }}>
          <FileText size={22} style={{ color: claro ? MENTA_ESC : MENTA }} />
          <motion.div className="absolute left-0 right-0 h-[2px]" style={{ background: MENTA, boxShadow: `0 0 8px ${MENTA}` }}
            animate={{ top: ["8%", "88%", "8%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm" style={{ color: texto }}>{titulo}</p>
          {detalhe && <p className="text-xs truncate mt-0.5" style={{ color: sec }}>{detalhe}</p>}
          <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: sec }}>
            {rotuloTempo ? rotuloTempo(segundos) : `${segundos}s`}{dica ? ` · ${dica}` : ""}
          </p>
        </div>
      </div>

      {/* Barra de progresso com brilho correndo */}
      <div className="relative h-2 rounded-full overflow-hidden mb-4" style={{ background: trilho }}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: `linear-gradient(90deg, ${MENTA_ESC}, ${MENTA})` }}
          initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
        <motion.div className="absolute inset-y-0 w-16" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
          animate={{ left: ["-20%", "110%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} />
      </div>

      {/* Etapas */}
      <ol className="space-y-2">
        {etapas.map((e, i) => {
          const feita = i < indice, agora = i === indice;
          return (
            <li key={e.id} className="flex items-center gap-2.5 text-sm">
              <span className="relative w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: feita ? MENTA_ESC : agora ? `${MENTA}33` : trilho, border: `1px solid ${feita || agora ? MENTA : "transparent"}` }}>
                {feita && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check size={12} color="#fff" /></motion.span>}
                {agora && <motion.span className="w-2 h-2 rounded-full" style={{ background: MENTA }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
              </span>
              <span style={{ color: feita ? sec : agora ? texto : sec, fontWeight: agora ? 700 : 500, opacity: feita || agora ? 1 : 0.6 }}>{e.rotulo}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
