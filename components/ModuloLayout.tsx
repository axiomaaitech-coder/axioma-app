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
        background: "rgba(10,20,36,0.7)",
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
  titulo, subtitulo, onExportarPDF, exportando, labelBotao, onNovo, children, botaoExtra
}: ModuloLayoutProps) {
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#020810" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-6 md:mb-8"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: "#e2ecf7" }}>{titulo}</h2>
        <p className="text-sm" style={{ color: "#5a7a9a" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ background: "#dc2626", color: "#fff" }}
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
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}
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
          background: "rgba(6,15,30,0.75)",
          border: "1px solid rgba(106,176,255,0.14)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {/* Acento de canto sutil — só uma linha fina no topo, estática */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(106,176,255,0.5), rgba(52,211,153,0.3) 50%, transparent)" }}
        />

        {/* Fundo interno suave (estático) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 12% 0%, rgba(106,176,255,0.05) 0%, transparent 45%)",
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 p-4 md:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}