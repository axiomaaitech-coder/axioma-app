"use client";
// Mantido por compatibilidade: repassa para o aviso padrão do Axioma.
import AvisoAxioma from "./AvisoAxioma";

export type ToastTipo = "erro" | "ok";

export default function Toast({ toast }: { toast: { msg: string; tipo: ToastTipo } | null }) {
  return <AvisoAxioma aviso={toast} />;
}
