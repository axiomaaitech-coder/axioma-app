"use client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <div className="min-h-screen p-4 md:p-8 overflow-auto" style={{ background: "#020810" }}>

      {/* Header animado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h2>
        </div>
        <p className="text-sm" style={{ color: "#3a5a8a" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
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

      {/* Conteúdo com borda premium animada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative rounded-2xl p-4 md:p-6"
        style={{
          background: "rgba(6, 15, 30, 0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Borda animada — canto superior esquerdo */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute top-0 left-0 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, #6ab0ff, transparent)" }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute top-0 left-0 w-[2px] rounded-full"
          style={{ background: "linear-gradient(180deg, #6ab0ff, transparent)" }}
        />

        {/* Borda animada — canto superior direito */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute top-0 right-0 h-[2px] rounded-full"
          style={{ background: "linear-gradient(270deg, #34d399, transparent)" }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute top-0 right-0 w-[2px] rounded-full"
          style={{ background: "linear-gradient(180deg, #34d399, transparent)" }}
        />

        {/* Borda animada — canto inferior esquerdo */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="absolute bottom-0 left-0 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, #a78bfa, transparent)" }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="absolute bottom-0 left-0 w-[2px] rounded-full"
          style={{ background: "linear-gradient(0deg, #a78bfa, transparent)" }}
        />

        {/* Borda animada — canto inferior direito */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-0 right-0 h-[2px] rounded-full"
          style={{ background: "linear-gradient(270deg, #f472b6, transparent)" }}
        />
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "60px", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-0 right-0 w-[2px] rounded-full"
          style={{ background: "linear-gradient(0deg, #f472b6, transparent)" }}
        />

        {/* Glow sutil no fundo */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top left, rgba(106,176,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(52,211,153,0.04) 0%, transparent 60%)",
          }}
        />

        {/* Conteúdo real */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}