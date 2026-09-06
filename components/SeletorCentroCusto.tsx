"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { criarCentroCustoRapido } from "../lib/centroCustoHelpers";

// Regra da plataforma: todo campo importante tem que dar pra preencher na
// mão — centro de custo não podia ser só o que já veio pronto de outro
// módulo. Este seletor reaproveita o <select> normal e adiciona "+ Novo
// centro de custo" inline (cria com nome + tipo padrão via
// criarCentroCustoRapido, sem sair da tela) — nunca duplicado por módulo.

export type CentroCustoOpcao = { id: string; nome: string };

type Idioma3 = "pt" | "en" | "es";

type Props = {
  value: string;
  onChange: (id: string) => void;
  centros: CentroCustoOpcao[];
  empresaId: string | null;
  userId: string | null;
  lang: Idioma3;
  cor?: string;
  onCriado?: (novo: CentroCustoOpcao) => void;
  className?: string;
  style?: React.CSSProperties;
};

const VALOR_NOVO = "__novo_centro_custo__";

export function SeletorCentroCusto({
  value, onChange, centros, empresaId, userId, lang, cor = "#6ab0ff", onCriado, className, style,
}: Props) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function confirmarNovo() {
    if (!empresaId || !userId) { setErro(L("Nenhuma empresa ativa.", "No active company.", "Ninguna empresa activa.")); return; }
    if (!nomeNovo.trim()) { setErro(L("Digite o nome do centro de custo.", "Enter the cost center's name.", "Escriba el nombre del centro de costo.")); return; }
    setSalvando(true);
    setErro("");
    const { id, erro: erroSalvar } = await criarCentroCustoRapido(userId, empresaId, nomeNovo.trim());
    setSalvando(false);
    if (erroSalvar || !id) {
      setErro(L("Não foi possível criar. Tente novamente.", "Could not create it. Try again.", "No se pudo crear. Intente de nuevo."));
      return;
    }
    onCriado?.({ id, nome: nomeNovo.trim() });
    onChange(id);
    setCriando(false);
    setNomeNovo("");
  }

  function cancelar() {
    setCriando(false);
    setNomeNovo("");
    setErro("");
  }

  if (criando) {
    return (
      <div>
        <div className="flex gap-1.5">
          <input
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmarNovo(); if (e.key === "Escape") cancelar(); }}
            placeholder={L("Nome do novo centro de custo", "New cost center name", "Nombre del nuevo centro de costo")}
            autoFocus
            className={className}
            style={style}
          />
          <button type="button" onClick={confirmarNovo} disabled={salvando}
            className="px-2.5 rounded-xl disabled:opacity-50 shrink-0" style={{ background: `${cor}20`, color: cor }}>
            <Check size={15} />
          </button>
          <button type="button" onClick={cancelar} className="px-2.5 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#5a7a9a" }}>
            <X size={15} />
          </button>
        </div>
        {erro && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{erro}</p>}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => { if (e.target.value === VALOR_NOVO) setCriando(true); else onChange(e.target.value); }}
      className={className}
      style={style}
    >
      <option value="">{L("Sem centro de custo", "No cost center", "Sin centro de costo")}</option>
      {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      <option value={VALOR_NOVO}>+ {L("Novo centro de custo...", "New cost center...", "Nuevo centro de costo...")}</option>
    </select>
  );
}
