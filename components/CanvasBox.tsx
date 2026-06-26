"use client";
import { ReactNode } from "react";

// CanvasBox LIMPO — borda sutil + acento estático no topo. Sem partículas, sem piscar.
// Aceita corB/corC/corD por compatibilidade com os módulos antigos (são ignorados).
export function CanvasBox({
  children,
  cor = "#6ab0ff",
}: {
  children: ReactNode;
  cor?: string;
  corB?: string;
  corC?: string;
  corD?: string;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,20,36,0.7)",
        border: `1px solid ${cor}26`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {/* acento fino no topo (estático) */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}80, transparent)` }}
      />
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  );
}

export default CanvasBox;