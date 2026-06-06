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

// Componente reutilizável para cards internos com borda neon
export function NeonCard({ children, cor = "#6ab0ff", className = "" }: { children: ReactNode; cor?: string; className?: string }) {
  const corRgb = cor === "#6ab0ff" ? "106,176,255" : cor === "#34d399" ? "52,211,153" : cor === "#f87171" ? "248,113,113" : cor === "#fbbf24" ? "251,191,36" : cor === "#a78bfa" ? "167,139,250" : "106,176,255";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: `0 0 25px rgba(${corRgb},0.2)` }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "rgba(10,22,40,0.85)",
        border: `1px solid rgba(${corRgb},0.2)`,
        boxShadow: `0 0 15px rgba(${corRgb},0.08), inset 0 1px 0 rgba(${corRgb},0.1)`,
      }}
    >
      {/* Linha neon correndo no topo */}
      <motion.div
        animate={{ left: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        className="absolute top-0 h-[1.5px] w-20 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${cor}, transparent)`,
          boxShadow: `0 0 10px ${cor}, 0 0 20px rgba(${corRgb},0.6)`,
          borderRadius: "999px",
        }}
      />
      {/* Glow canto superior esquerdo */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{
        background: `radial-gradient(circle at top left, rgba(${corRgb},0.12) 0%, transparent 70%)`,
      }} />
      {/* Conteúdo */}
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
    <div className="min-h-screen p-4 md:p-8 overflow-auto" style={{ background: "#020810" }}>

      {/* Header animado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-6 md:mb-8"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: "#c8d8f0" }}>{titulo}</h2>
        <p className="text-sm" style={{ color: "#3a5a8a" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(220,38,38,0.5)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ background: "#dc2626", color: "#fff", boxShadow: "0 0 12px rgba(220,38,38,0.3)" }}
            >
              <Download size={16} />
              {exportando ? "Gerando..." : "Exportar PDF"}
            </motion.button>
          )}
          {onNovo && (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(106,176,255,0.5)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onNovo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 12px rgba(42,95,212,0.3)" }}
            >
              <Plus size={16} />
              {labelBotao}
            </motion.button>
          )}
          {botaoExtra}
        </div>
      </motion.div>

      {/* Container principal com bordas neon nos 4 cantos */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative rounded-2xl"
      >
        {/* Glow externo pulsante */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 40px rgba(106,176,255,0.08), 0 0 80px rgba(106,176,255,0.04)",
              "0 0 50px rgba(52,211,153,0.10), 0 0 100px rgba(52,211,153,0.05)",
              "0 0 45px rgba(167,139,250,0.09), 0 0 90px rgba(167,139,250,0.04)",
              "0 0 40px rgba(106,176,255,0.08), 0 0 80px rgba(106,176,255,0.04)",
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
        />

        {/* Borda fina gradiente completa */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: "1px",
            background: "linear-gradient(135deg, rgba(106,176,255,0.4), rgba(52,211,153,0.2), rgba(167,139,250,0.4), rgba(244,114,182,0.2))",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Canto superior esquerdo — azul neon */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-0 left-0 h-[2.5px] z-10"
          style={{
            background: "linear-gradient(90deg, #6ab0ff, transparent)",
            boxShadow: "0 0 14px #6ab0ff, 0 0 28px rgba(106,176,255,0.6)",
            borderRadius: "999px",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-0 left-0 w-[2.5px] z-10"
          style={{
            background: "linear-gradient(180deg, #6ab0ff, transparent)",
            boxShadow: "0 0 14px #6ab0ff, 0 0 28px rgba(106,176,255,0.6)",
            borderRadius: "999px",
          }}
        />

        {/* Canto superior direito — verde neon */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="absolute top-0 right-0 h-[2.5px] z-10"
          style={{
            background: "linear-gradient(270deg, #34d399, transparent)",
            boxShadow: "0 0 14px #34d399, 0 0 28px rgba(52,211,153,0.6)",
            borderRadius: "999px",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="absolute top-0 right-0 w-[2.5px] z-10"
          style={{
            background: "linear-gradient(180deg, #34d399, transparent)",
            boxShadow: "0 0 14px #34d399, 0 0 28px rgba(52,211,153,0.6)",
            borderRadius: "999px",
          }}
        />

        {/* Canto inferior esquerdo — roxo neon */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-0 left-0 h-[2.5px] z-10"
          style={{
            background: "linear-gradient(90deg, #a78bfa, transparent)",
            boxShadow: "0 0 14px #a78bfa, 0 0 28px rgba(167,139,250,0.6)",
            borderRadius: "999px",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-0 left-0 w-[2.5px] z-10"
          style={{
            background: "linear-gradient(0deg, #a78bfa, transparent)",
            boxShadow: "0 0 14px #a78bfa, 0 0 28px rgba(167,139,250,0.6)",
            borderRadius: "999px",
          }}
        />

        {/* Canto inferior direito — pink neon */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="absolute bottom-0 right-0 h-[2.5px] z-10"
          style={{
            background: "linear-gradient(270deg, #f472b6, transparent)",
            boxShadow: "0 0 14px #f472b6, 0 0 28px rgba(244,114,182,0.6)",
            borderRadius: "999px",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "90px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="absolute bottom-0 right-0 w-[2.5px] z-10"
          style={{
            background: "linear-gradient(0deg, #f472b6, transparent)",
            boxShadow: "0 0 14px #f472b6, 0 0 28px rgba(244,114,182,0.6)",
            borderRadius: "999px",
          }}
        />

        {/* Partícula de luz correndo no topo — vai e volta */}
        <motion.div
          animate={{ left: ["-5%", "105%", "-5%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, #ffffff, #6ab0ff, transparent)",
            boxShadow: "0 0 18px #fff, 0 0 35px rgba(106,176,255,0.9)",
            borderRadius: "999px",
          }}
        />

        {/* Partícula de luz correndo em baixo — vai e volta */}
        <motion.div
          animate={{ right: ["-5%", "105%", "-5%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
          className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, #34d399, #ffffff, transparent)",
            boxShadow: "0 0 18px #34d399, 0 0 35px rgba(52,211,153,0.9)",
            borderRadius: "999px",
            position: "absolute",
          }}
        />

        {/* Partícula de luz descendo na lateral esquerda */}
        <motion.div
          animate={{ top: ["-5%", "105%", "-5%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute left-0 w-[2.5px] h-16 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent, #a78bfa, transparent)",
            boxShadow: "0 0 18px #a78bfa, 0 0 35px rgba(167,139,250,0.9)",
            borderRadius: "999px",
          }}
        />

        {/* Partícula de luz subindo na lateral direita */}
        <motion.div
          animate={{ bottom: ["-5%", "105%", "-5%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute right-0 w-[2.5px] h-16 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, transparent, #f472b6, transparent)",
            boxShadow: "0 0 18px #f472b6, 0 0 35px rgba(244,114,182,0.9)",
            borderRadius: "999px",
            position: "absolute",
          }}
        />

        {/* Fundo interno */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 15% 15%, rgba(106,176,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(52,211,153,0.06) 0%, transparent 50%), rgba(6,15,30,0.92)",
            backdropFilter: "blur(20px)",
          }}
        />

        {/* Conteúdo real */}
        <div className="relative z-10 p-4 md:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}