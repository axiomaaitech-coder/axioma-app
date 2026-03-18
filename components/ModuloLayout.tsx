"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { ReactNode } from "react";

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
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#3a5a8a" }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h2>
        </div>
        <p className="text-sm ml-7" style={{ color: "#3a5a8a" }}>{subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {onExportarPDF && (
            <button
              onClick={onExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: "#dc2626", color: "#fff" }}
            >
              <Download size={16} />
              {exportando ? "Gerando..." : "Exportar PDF"}
            </button>
          )}
          {onNovo && (
            <button
              onClick={onNovo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}
            >
              <Plus size={16} />
              {labelBotao}
            </button>
          )}
          {botaoExtra}
        </div>
      </div>
      {children}
    </div>
  );
}