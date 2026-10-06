"use client";
// Aviso padrão do Axioma (toast) — um só componente para todas as telas.
// Microinterações: entra deslizando, erro dá uma tremida curta, ícone por tipo,
// barra de tempo que esvazia e botão de fechar. Lido por leitores de tela
// (role=alert no erro). Uso: <AvisoAxioma aviso={toast} onFechar={() => setToast(null)} />
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type TipoAviso = "erro" | "ok" | "sucesso" | "info" | "aviso";
type Aviso = { msg: string; tipo?: string } | string | null | undefined;

const ESTILO: Record<"erro" | "ok" | "info", { fundo: string; borda: string; Icone: typeof Info }> = {
  erro: { fundo: "linear-gradient(135deg, #b42318, #dc2626)", borda: "#fca5a5", Icone: AlertTriangle },
  ok: { fundo: "linear-gradient(135deg, #0a4f3b, #0f7d5c)", borda: "#2ecc9b", Icone: CheckCircle2 },
  info: { fundo: "linear-gradient(135deg, #0a1628, #101b3d)", borda: "#2ecc9b", Icone: Info },
};
const normalizar = (tipo?: string): "erro" | "ok" | "info" =>
  tipo === "erro" || tipo === "aviso" ? "erro" : tipo === "info" ? "info" : "ok";

export default function AvisoAxioma({ aviso, onFechar, duracao = 3000, posicao = "topo" }: {
  aviso: Aviso;
  onFechar?: () => void;
  /** Só a barra visual; quem some com o aviso é a própria tela (setTimeout). */
  duracao?: number;
  posicao?: "topo" | "base";
}) {
  const dados = typeof aviso === "string" ? { msg: aviso, tipo: "info" } : aviso ?? null;
  const tipo = normalizar(dados?.tipo);
  const { fundo, borda, Icone } = ESTILO[tipo];
  // Portal no <body>: `position: fixed` dentro do ModuloLayout (transform/overflow)
  // ficaria preso ao cartão em vez da tela (mesmo motivo do Modal.tsx).
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) return null;
  return createPortal(
    <AnimatePresence>
      {dados && dados.msg && (
        <motion.div
          key={dados.msg}
          role={tipo === "erro" ? "alert" : "status"}
          aria-live={tipo === "erro" ? "assertive" : "polite"}
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={tipo === "erro"
            ? { opacity: 1, x: [40, 0, -8, 7, -5, 3, 0], scale: 1 }
            : { opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: tipo === "erro" ? 0.55 : 0.28, ease: "easeOut" }}
          className={`fixed ${posicao === "topo" ? "top-28" : "bottom-20"} right-4 left-4 sm:left-auto sm:w-[380px] z-[200] rounded-xl overflow-hidden shadow-2xl`}
          style={{ background: fundo, border: `1px solid ${borda}`, color: "#fff" }}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <motion.span
              initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.05 }}
              className="mt-0.5 shrink-0"
            >
              <Icone size={18} />
            </motion.span>
            <p className="flex-1 text-[13px] font-bold leading-snug break-words">{dados.msg}</p>
            {onFechar && (
              <button onClick={onFechar} className="shrink-0 opacity-80 hover:opacity-100" aria-label="Fechar">
                <X size={16} />
              </button>
            )}
          </div>
          <motion.div
            className="h-[3px]"
            style={{ background: "rgba(255,255,255,0.75)", transformOrigin: "left" }}
            initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
            transition={{ duration: duracao / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
