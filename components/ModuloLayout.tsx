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

      {/* Container principal com borda neon animada */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative rounded-2xl"
      >
        {/* Camada de glow externo pulsante */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 30px rgba(106,176,255,0.08), 0 0 60px rgba(106,176,255,0.04)",
              "0 0 40px rgba(52,211,153,0.10), 0 0 80px rgba(52,211,153,0.05)",
              "0 0 35px rgba(167,139,250,0.09), 0 0 70px rgba(167,139,250,0.04)",
              "0 0 30px rgba(106,176,255,0.08), 0 0 60px rgba(106,176,255,0.04)",
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
        />

        {/* Borda neon — linha completa com gradiente rotativo */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            padding: "1.5px",
            background: "linear-gradient(135deg, #6ab0ff 0%, #34d399 25%, #a78bfa 50%, #f472b6 75%, #6ab0ff 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Cantos neon com glow — superior esquerdo azul */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-0 h-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(90deg, #6ab0ff, transparent)",
            boxShadow: "0 0 12px #6ab0ff, 0 0 24px rgba(106,176,255,0.5)",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-0 w-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(180deg, #6ab0ff, transparent)",
            boxShadow: "0 0 12px #6ab0ff, 0 0 24px rgba(106,176,255,0.5)",
          }}
        />

        {/* Cantos neon — superior direito verde */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="absolute top-0 right-0 h-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(270deg, #34d399, transparent)",
            boxShadow: "0 0 12px #34d399, 0 0 24px rgba(52,211,153,0.5)",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="absolute top-0 right-0 w-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(180deg, #34d399, transparent)",
            boxShadow: "0 0 12px #34d399, 0 0 24px rgba(52,211,153,0.5)",
          }}
        />

        {/* Cantos neon — inferior esquerdo roxo */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="absolute bottom-0 left-0 h-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(90deg, #a78bfa, transparent)",
            boxShadow: "0 0 12px #a78bfa, 0 0 24px rgba(167,139,250,0.5)",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="absolute bottom-0 left-0 w-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(0deg, #a78bfa, transparent)",
            boxShadow: "0 0 12px #a78bfa, 0 0 24px rgba(167,139,250,0.5)",
          }}
        />

        {/* Cantos neon — inferior direito pink */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
          className="absolute bottom-0 right-0 h-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(270deg, #f472b6, transparent)",
            boxShadow: "0 0 12px #f472b6, 0 0 24px rgba(244,114,182,0.5)",
          }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "80px", opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
          className="absolute bottom-0 right-0 w-[2px] rounded-full z-10"
          style={{
            background: "linear-gradient(0deg, #f472b6, transparent)",
            boxShadow: "0 0 12px #f472b6, 0 0 24px rgba(244,114,182,0.5)",
          }}
        />

        {/* Partícula de luz deslizando na borda — topo */}
        <motion.div
          animate={{ left: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 h-[2px] w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, #ffffff, transparent)",
            boxShadow: "0 0 16px #fff, 0 0 30px rgba(106,176,255,0.8)",
            borderRadius: "999px",
          }}
        />

        {/* Partícula de luz deslizando na borda — baixo */}
        <motion.div
          animate={{ right: ["0%", "100%", "0%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-0 h-[2px] w-16 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, #34d399, transparent)",
            boxShadow: "0 0 16px #34d399, 0 0 30px rgba(52,211,153,0.8)",
            borderRadius: "999px",
            position: "absolute",
          }}
        />

        {/* Fundo interno com gradiente sutil */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 20% 20%, rgba(106,176,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(52,211,153,0.05) 0%, transparent 50%), rgba(6,15,30,0.9)",
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