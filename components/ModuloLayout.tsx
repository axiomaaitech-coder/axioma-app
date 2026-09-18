"use client";
import { Download, Plus } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ModuloLayoutProps {
  titulo: string;
  subtitulo: string;
  onExportarPDF?: () => void;
  exportando?: boolean;
  labelBotao?: string;
  onNovo?: () => void;
  children: ReactNode;
  botaoExtra?: ReactNode;
  /** Opt-in — só quem passa true ganha o fundo "aurora" (nenhum módulo herda por padrão). */
  aurora?: ReactNode;
  /** Opt-in — degradê de fundo (CSS `background`) por trás do título/subtítulo/
   * botões, pra telas "executivas" (ex.: MEI no tema Claro). Sem isso o
   * cabeçalho fica exatamente como sempre, sem fundo. Quando presente, título
   * e subtítulo trocam pra branco automaticamente (senão ficariam ilegíveis). */
  headerFundo?: string;
  /** Opt-in — sobrescreve o fundo do botão "Exportar PDF" (padrão: vermelho de sempre). */
  corExportar?: string;
  /** Opt-in — sobrescreve o fundo do botão onNovo/labelBotao (padrão: degradê azul de sempre). */
  corNovo?: string;
}

// Card interno reutilizável — borda sutil, sem animação piscante.
export function NeonCard({ children, cor = "#6ab0ff", className = "" }: { children: ReactNode; cor?: string; className?: string }) {
  const corRgb = cor === "#6ab0ff" ? "106,176,255" : cor === "#34d399" ? "52,211,153" : cor === "#f87171" ? "248,113,113" : cor === "#fbbf24" ? "251,191,36" : cor === "#a78bfa" ? "167,139,250" : "106,176,255";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "var(--axi-surface)",
        border: `1px solid rgba(${corRgb},0.16)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {/* Acento sutil no topo (estático, sem piscar) */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${corRgb},0.5), transparent)` }}
      />
      <div className="relative z-10 p-4 md:p-5">
        {children}
      </div>
    </motion.div>
  );
}

export default function ModuloLayout({
  titulo, subtitulo, onExportarPDF, exportando, labelBotao, onNovo, children, botaoExtra, aurora,
  headerFundo, corExportar, corNovo
}: ModuloLayoutProps) {
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--axi-bg)" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`mb-6 md:mb-8${headerFundo ? " rounded-2xl p-5 md:p-7" : ""}`}
        style={headerFundo ? { background: headerFundo } : undefined}
      >
        <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: headerFundo ? "#fff" : "var(--axi-text-heading)" }}>{titulo}</h2>
        <p className="text-sm" style={{ color: headerFundo ? "rgba(255,255,255,0.75)" : "var(--axi-text-secondary)" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ background: corExportar || "#ff5a6b", color: "#fff" }}
            >
              <Download size={16} />
              {exportando ? "Gerando..." : "Exportar PDF"}
            </motion.button>
          )}
          {onNovo && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNovo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: corNovo || "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}
            >
              <Plus size={16} />
              {labelBotao}
            </motion.button>
          )}
          {botaoExtra}
        </div>
      </motion.div>

      {/* Container principal — calmo, estável, sem oscilação */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "var(--axi-surface)",
          border: "1px solid var(--axi-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {/* Acento de canto sutil — só uma linha fina no topo, estática */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--axi-accent) 50%, transparent), color-mix(in srgb, var(--axi-success) 30%, transparent) 50%, transparent)" }}
        />

        {/* Fundo interno suave (estático) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 12% 0%, color-mix(in srgb, var(--axi-accent) 5%, transparent) 0%, transparent 45%)",
          }}
        />

        {/* Aurora opcional — opt-in, ver prop `aurora` */}
        {aurora}

        {/* Conteúdo */}
        <div className="relative z-10 p-4 md:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}