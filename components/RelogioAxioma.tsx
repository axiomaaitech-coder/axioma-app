"use client";
// Mantém o motor de hora (lib/datas.ts) sempre certo, sozinho: sincroniza com a hora
// oficial ao abrir, a cada 10 minutos, ao voltar para a aba e ao reconectar; e avisa
// o motor do idioma escolhido (último critério de fuso). Não desenha nada.
import { useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { sincronizarRelogio, definirIdiomaFuso } from "../lib/datas";

export default function RelogioAxioma() {
  const { idioma } = useLanguage();
  useEffect(() => { definirIdiomaFuso(idioma); }, [idioma]);
  useEffect(() => {
    void sincronizarRelogio();
    const id = setInterval(() => void sincronizarRelogio(), 10 * 60 * 1000);
    const aoVoltar = () => { if (document.visibilityState === "visible") void sincronizarRelogio(); };
    const aoReconectar = () => void sincronizarRelogio();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("online", aoReconectar);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", aoVoltar); window.removeEventListener("online", aoReconectar); };
  }, []);
  return null;
}
