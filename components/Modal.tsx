"use client";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Classe Tailwind de largura máxima do conteúdo. Default: max-w-md. */
  maxWidthClassName?: string;
}

// Modal global — via portal em document.body, fora de qualquer container
// com overflow-hidden/transform (ex: ModuloLayout), que corta e reposiciona
// filhos `position: fixed` por virarem containing block. Ver STATUS-AXIOMA
// seção 3-I (bug encontrado e corrigido antes só no Clientes).
export default function Modal({ open, onClose, children, maxWidthClassName = "max-w-md" }: ModalProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-8 px-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full ${maxWidthClassName} max-h-[calc(100vh-8rem)] overflow-y-auto`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
