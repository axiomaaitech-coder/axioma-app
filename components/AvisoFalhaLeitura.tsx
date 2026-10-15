"use client";
// Último caso do sistema anti-falha (lib/antiFalha + lib/erroUiHelpers): a leitura já foi tentada
// de novo sozinha e mesmo assim não veio. Mostra o aviso padrão do Axioma uma vez (agrupa várias
// falhas seguidas) para o dado incompleto nunca parecer zero/vazio de verdade. A tela continua
// funcionando. Também pega a falha que escapou de alguma tela sem tratamento (rede de segurança).
import { useEffect, useRef, useState } from "react";
import AvisoAxioma from "./AvisoAxioma";
import { useLanguage } from "../lib/LanguageContext";
import { EVENTO_FALHA_LEITURA, mensagemFalhaCarregamento } from "../lib/erroUiHelpers";

export default function AvisoFalhaLeitura() {
  const { idioma } = useLanguage();
  const [aberto, setAberto] = useState(false);
  const ultimo = useRef(0);
  useEffect(() => {
    let tempo: ReturnType<typeof setTimeout> | undefined;
    const mostrar = () => {
      if (Date.now() - ultimo.current < 15000) return; // várias falhas juntas = um aviso só
      ultimo.current = Date.now();
      setAberto(true);
      clearTimeout(tempo);
      tempo = setTimeout(() => setAberto(false), 8000);
    };
    const escapou = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
      if (msg.startsWith("leitura falhou")) { e.preventDefault(); mostrar(); }
    };
    window.addEventListener(EVENTO_FALHA_LEITURA, mostrar);
    window.addEventListener("unhandledrejection", escapou);
    return () => { window.removeEventListener(EVENTO_FALHA_LEITURA, mostrar); window.removeEventListener("unhandledrejection", escapou); clearTimeout(tempo); };
  }, []);
  return <AvisoAxioma aviso={aberto ? { msg: mensagemFalhaCarregamento(idioma), tipo: "aviso" } : null} onFechar={() => setAberto(false)} duracao={8000} />;
}
