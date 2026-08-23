"use client";
// 🦅 AXIOMA AI.TECH — PDV: peças de navegação por Nicho → Categoria →
// Sub-nicho REUTILIZÁVEIS entre o Catálogo (app/(interno)/pdv/page.tsx) e
// qualquer outra tela que precise do mesmo padrão visual (ex: "Produtos
// Cadastrados", app/(interno)/pdv/produtos/page.tsx) — fonte única dos
// cards/breadcrumb/linha de produto, nenhum dos dois duplica JSX do outro.
// Sem i18n interno de propósito: cada tela já tem seu próprio dicionário de
// tradução (padrão já usado em todo o PDV — nenhuma tela central), então os
// textos chegam aqui já traduzidos via prop, e este arquivo nunca precisa
// saber em que idioma está.
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTemaPdv } from "./PdvLayout";
import type { Idioma } from "../lib/translations";
import type { NichoPdvDef } from "../lib/pdvCatalogoTaxonomia";
import type { ProdutoPdv } from "../lib/pdvHelpers";

export type NivelCatalogo = "nicho" | "categoria" | "subnicho" | "produtos";

function moeda(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function EstadoCarregando({ texto }: { texto: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

export function AvisoErro({ texto }: { texto: string }) {
  const { tema } = useTemaPdv();
  const claro = tema !== "escuro";
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm"
      style={{ background: claro ? "rgba(220,38,38,0.08)" : "rgba(239,68,68,0.12)", color: claro ? "#b91c1c" : "#fca5a5", border: `1px solid ${claro ? "rgba(220,38,38,0.25)" : "rgba(239,68,68,0.3)"}` }}>
      {texto}
    </div>
  );
}

export type ItemBreadcrumb = { label: string; onClick?: () => void };

// Breadcrumb genérico (lista de {label, onClick?}) — a peça visual por trás
// do Breadcrumb do Catálogo e de qualquer navegação em níveis fora da
// taxonomia fixa (ex.: Retaguarda do Caixa). Sem onClick = item final
// (nível atual, não clicável).
export function BreadcrumbGenerico({ itens }: { itens: ItemBreadcrumb[] }) {
  const { tokens } = useTemaPdv();
  if (itens.length <= 1) return null;
  return (
    <div className="flex items-center flex-wrap gap-1 mb-4 text-xs">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} style={{ color: tokens.textoMuted }} />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:underline font-medium" style={{ color: tokens.acento }}>{item.label}</button>
          ) : (
            <span style={{ color: tokens.textoSecundario }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function Breadcrumb({
  lang, nivel, nichoSel, categoriaSel, subNichoSel, nichosLabel, semSubNichoLabel, semSubNichoValor,
  semCategoriaLabel, semCategoriaValor, onVoltar,
}: {
  lang: Idioma; nivel: NivelCatalogo; nichoSel: NichoPdvDef | null; categoriaSel: string | null; subNichoSel: string | null;
  nichosLabel: string; semSubNichoLabel: string; semSubNichoValor: string;
  // Só o Catálogo (app/(interno)/pdv/page.tsx) não tem bucket "sem categoria"
  // — sua navegação só alcança categoria REAL. Opcional pra não quebrar esse
  // call site; quem tiver esse bucket (ex: "Produtos Cadastrados") passa os dois.
  semCategoriaLabel?: string; semCategoriaValor?: string;
  onVoltar: (destino: NivelCatalogo) => void;
}) {
  if (nivel === "nicho") return null;
  const itens: { label: string; destino: NivelCatalogo | null }[] = [
    { label: nichosLabel, destino: "nicho" },
  ];
  if (nichoSel) itens.push({ label: nichoSel.label[lang], destino: nichoSel.categorias.length ? "categoria" : null });
  if (categoriaSel) itens.push({ label: categoriaSel === semCategoriaValor ? (semCategoriaLabel ?? categoriaSel) : categoriaSel, destino: "subnicho" });
  if (subNichoSel) itens.push({ label: subNichoSel === semSubNichoValor ? semSubNichoLabel : subNichoSel, destino: null });

  return (
    <BreadcrumbGenerico itens={itens.map((item) => ({ label: item.label, onClick: item.destino ? () => onVoltar(item.destino!) : undefined }))} />
  );
}

// Card genérico (label + sublabel opcional) — a peça visual por trás de
// CartaoNicho (Catálogo) e de qualquer navegação em cards fora da taxonomia
// fixa (ex.: Retaguarda do Caixa, agrupando dados de venda do dia).
export function CardGenerico({ label, sublabel, onClick }: { label: string; sublabel?: React.ReactNode; onClick: () => void }) {
  const { tokens } = useTemaPdv();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-4 rounded-xl text-left min-h-[76px]"
      style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}
    >
      <span className="text-sm font-semibold truncate w-full" style={{ color: tokens.cardTexto }}>{label}</span>
      {sublabel != null && sublabel !== "" && <span className="text-xs font-semibold" style={{ color: tokens.cardTexto, opacity: 0.75 }}>{sublabel}</span>}
    </motion.button>
  );
}

export function CartaoNicho({ nicho, lang, qtd, onClick }: { nicho: NichoPdvDef; lang: Idioma; qtd: number; onClick: () => void }) {
  return <CardGenerico label={nicho.label[lang]} sublabel={qtd > 0 ? qtd : undefined} onClick={onClick} />;
}

export function ListaCarregavel({ carregando, children }: { carregando: boolean; children: React.ReactNode }) {
  const { tokens } = useTemaPdv();
  if (carregando) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 rounded-xl" style={{ background: tokens.cardBg, opacity: 0.4 }} />
        ))}
      </div>
    );
  }
  return <>{children}</>;
}

export function BotaoSimples({ label, onClick, apagado, qtd }: { label: string; onClick: () => void; apagado?: boolean; qtd?: number }) {
  const { tokens } = useTemaPdv();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-3.5 rounded-xl text-left text-sm font-medium min-h-[52px]"
      style={{
        background: apagado ? tokens.fundoContainer : tokens.cardBg,
        border: `1px solid ${apagado ? tokens.bordaContainer : tokens.cardBorda}`,
        color: apagado ? tokens.textoMuted : tokens.cardTexto,
      }}
    >
      {label}
      {qtd != null && qtd > 0 && <span className="text-xs font-semibold" style={{ opacity: 0.75 }}>{qtd}</span>}
    </motion.button>
  );
}

export function EstadoVazio({ texto, dica }: { texto: string; dica?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-1">
      <p className="text-sm" style={{ color: tokens.textoSecundario }}>{texto}</p>
      {dica && <p className="text-xs max-w-sm" style={{ color: tokens.textoMuted }}>{dica}</p>}
    </div>
  );
}

export function LinhaProduto({ produto, estoqueLabel, precoNaoDefinidoLabel, editarLabel, excluirLabel, onExcluir }: {
  produto: ProdutoPdv; estoqueLabel: string; precoNaoDefinidoLabel: string; editarLabel: string; excluirLabel: string;
  onExcluir: (p: ProdutoPdv) => void;
}) {
  const { tokens } = useTemaPdv();
  const preco = produto.preco_venda ?? produto.preco_sugerido;
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl flex-wrap" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: tokens.cardTexto }}>{produto.nome}</p>
        <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.72 }}>
          {produto.codigo_barras || produto.sku || "—"} · {produto.saldo_disponivel} {estoqueLabel}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold" style={{ color: tokens.cardTexto, opacity: preco ? 1 : 0.6 }}>
          {preco ? moeda(preco) : precoNaoDefinidoLabel}
        </span>
        <a href={`/pdv/cadastro?id=${produto.id}`} title={editarLabel} className="p-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85, border: `1px solid ${tokens.cardTexto}` }}>
          <Pencil size={14} />
        </a>
        <button onClick={() => onExcluir(produto)} title={excluirLabel} className="p-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85, border: `1px solid ${tokens.cardTexto}` }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
