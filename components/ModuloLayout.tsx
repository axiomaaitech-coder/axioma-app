"use client";
import { Download, Plus } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BORDA_3D, SOMBRA_3D } from "./CanvasBox";

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

export default function ModuloLayout({
  titulo, subtitulo, onExportarPDF, exportando, labelBotao, onNovo, children, botaoExtra, aurora,
  headerFundo, corExportar, corNovo
}: ModuloLayoutProps) {
  // Cabeçalho = cartão azul com o nome do módulo em TODOS os módulos e nos 2
  // temas (padronização 2026-09-27): no Claro vem o degradê do módulo
  // (headerFundo); no Escuro, o mesmo azul-marinho profundo. Sempre com o
  // efeito do card creme — borda/glow verde-menta + faixa verde no topo no hover.
  const fundoCabecalho = headerFundo ?? "linear-gradient(180deg, #0a1628 0%, #0f2346 100%)";
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--axi-bg)" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-6 md:mb-8 relative overflow-hidden rounded-2xl p-5 md:p-7 axi-card-premium3d"
        style={{ background: fundoCabecalho, border: BORDA_3D, boxShadow: SOMBRA_3D }}
      >
        <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: "#2ecc9b" }} />
        <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: "#fff" }}>{titulo}</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ background: corExportar || "linear-gradient(135deg, #16a97d, #2ecc9b)", color: "#fff" }}
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
              style={{ background: corNovo || "linear-gradient(135deg, #16a97d, #2ecc9b)", color: "#fff" }}
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
        <div className="relative p-4 md:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}