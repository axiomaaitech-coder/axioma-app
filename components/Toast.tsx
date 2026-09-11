"use client";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type ToastTipo = "erro" | "ok";

interface ToastProps {
  toast: { msg: string; tipo: ToastTipo } | null;
}

// Toast global — via portal, mesmo motivo do Modal.tsx: `position: fixed`
// dentro do ModuloLayout (overflow-hidden + transform) fica preso ao
// container em vez da viewport.
export default function Toast({ toast }: ToastProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed top-20 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : "rgba(52,211,153,0.95)",
            color: "#020810",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
