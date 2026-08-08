"use client";
import { useMemo, useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Sparkles, Package } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { parseXMLNFe, type ItemNFe } from "../../../../lib/importarParsers";
import { type Produto, criarProduto, atualizarProduto, criarMovimentacao, buscarProdutoPorCodigo, buscarProdutoPorId } from "../../../../lib/estoqueHelpers";
import { NICHOS_PDV, type NichoPdvDef } from "../../../../lib/pdvCatalogoTaxonomia";
import {
  nfeJaImportada, registrarNfeImportada, buscarFornecedorPorCnpj, criarFornecedorDaNfe,
  buscarVinculoFornecedor, salvarVinculoFornecedor, converterFardoParaUnidade, precoComMargem, type FornecedorMinimo,
} from "../../../../lib/pdvNfeHelpers";

// Botões de ação usam tokens.acaoBg/acaoTexto (verde só sobrevive no tema
// escuro, ver components/PdvLayout.tsx). Âmbar segue fixo: é cor de status.
const AMBAR = "#f5b942";

const txt = {
  titulo: { pt: "PDV — Importar XML da NF-e", en: "POS — Import NF-e XML", es: "PDV — Importar XML de NF-e" },
  subtitulo: {
    pt: "Envie a nota de compra e confira item a item antes de gravar — nada entra sem você ver.",
    en: "Upload the purchase invoice and review item by item before saving — nothing gets in without you seeing it.",
    es: "Envíe la factura de compra y revise ítem por ítem antes de guardar — nada entra sin que usted lo vea.",
  },
  operadorTitulo: { pt: "PDV — Ponto de Venda", en: "POS — Point of Sale", es: "PDV — Punto de Venta" },
  operadorCorpo: { pt: "Em breve você vai poder vender por aqui. Volte mais tarde.", en: "Soon you'll be able to sell from here. Check back later.", es: "Pronto podrás vender desde aquí. Vuelve más tarde." },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  escolhaNicho: { pt: "Primeiro, escolha o nicho desta nota", en: "First, choose the niche for this invoice", es: "Primero, elija el nicho de esta factura" },
  nicho: { pt: "Nicho", en: "Niche", es: "Nicho" },
  selecione: { pt: "Selecione…", en: "Select…", es: "Seleccione…" },
  enviarArquivo: { pt: "Enviar arquivo XML da NF-e", en: "Upload NF-e XML file", es: "Enviar archivo XML de NF-e" },
  arrastarSolte: { pt: "Clique ou arraste o arquivo .xml aqui", en: "Click or drag the .xml file here", es: "Haga clic o arrastre el archivo .xml aquí" },
  processando: { pt: "Lendo o XML…", en: "Reading the XML…", es: "Leyendo el XML…" },
  erroXmlInvalido: { pt: "Arquivo não reconhecido como NF-e válida.", en: "File not recognized as a valid NF-e.", es: "Archivo no reconocido como NF-e válida." },
  notaJaImportada: { pt: "Esta nota já foi importada antes (mesma chave de acesso) — não é possível importar duas vezes.", en: "This invoice was already imported before (same access key) — cannot import twice.", es: "Esta factura ya fue importada antes (misma clave de acceso) — no se puede importar dos veces." },
  fornecedorTitulo: { pt: "Fornecedor", en: "Supplier", es: "Proveedor" },
  fornecedorNovo: { pt: "Novo — será cadastrado automaticamente ao confirmar", en: "New — will be registered automatically on confirm", es: "Nuevo — se registrará automáticamente al confirmar" },
  fornecedorExistente: { pt: "Já cadastrado", en: "Already registered", es: "Ya registrado" },
  resolvendoItens: { pt: "Conferindo o que já existe no seu catálogo…", en: "Checking what's already in your catalog…", es: "Verificando qué ya existe en su catálogo…" },
  classificarAutomatico: { pt: "Sugestão automática para os itens novos", en: "Automatic suggestion for new items", es: "Sugerencia automática para los ítems nuevos" },
  classificando: { pt: "Classificando…", en: "Classifying…", es: "Clasificando…" },
  margemLabel: { pt: "Margem sobre o custo (%)", en: "Margin over cost (%)", es: "Margen sobre el costo (%)" },
  aplicarMargem: { pt: "Aplicar aos itens novos sem preço", en: "Apply to new items without a price", es: "Aplicar a los ítems nuevos sin precio" },
  itensTitulo: { pt: "Itens da nota", en: "Invoice items", es: "Ítems de la factura" },
  statusNovo: { pt: "Produto novo", en: "New product", es: "Producto nuevo" },
  statusExistente: { pt: "Já existe no catálogo", en: "Already in catalog", es: "Ya existe en el catálogo" },
  colNome: { pt: "Nome", en: "Name", es: "Nombre" },
  colDescricaoOriginal: { pt: "Descrição na nota", en: "Invoice description", es: "Descripción en la factura" },
  colCategoria: { pt: "Categoria", en: "Category", es: "Categoría" },
  colSubNicho: { pt: "Sub-nicho", en: "Sub-niche", es: "Sub-nicho" },
  colQuantidade: { pt: "Quantidade", en: "Quantity", es: "Cantidad" },
  colCusto: { pt: "Custo Unit.", en: "Unit Cost", es: "Costo Unit." },
  colPrecoVenda: { pt: "Preço de Venda", en: "Sale Price", es: "Precio de Venta" },
  vemEmFardo: { pt: "Veio em fardo/caixa?", en: "Came in a pack/case?", es: "¿Vino en fardo/caja?" },
  unidadesPorFardo: { pt: "1 fardo = quantas unidades?", en: "1 pack = how many units?", es: "1 fardo = ¿cuántas unidades?" },
  incluirItem: { pt: "Incluir", en: "Include", es: "Incluir" },
  loteValidadeDetectado: { pt: "Lote/validade detectado na nota", en: "Batch/expiry detected in invoice", es: "Lote/vencimiento detectado en la factura" },
  confirmarImportacao: { pt: "Confirmar e Gravar", en: "Confirm and Save", es: "Confirmar y Guardar" },
  gravando: { pt: "Gravando…", en: "Saving…", es: "Guardando…" },
  faltaCategoriaSubnicho: { pt: "Todo item novo incluído precisa de categoria, sub-nicho e preço de venda.", en: "Every included new item needs a category, sub-niche and sale price.", es: "Cada ítem nuevo incluido necesita categoría, sub-nicho y precio de venta." },
  resumoSucesso: { pt: "{n} item(ns) gravado(s) com sucesso.", en: "{n} item(s) saved successfully.", es: "{n} ítem(s) guardado(s) con éxito." },
  resumoFalhas: { pt: "{n} item(ns) falharam — veja os detalhes abaixo.", en: "{n} item(s) failed — see details below.", es: "{n} ítem(s) fallaron — vea los detalles abajo." },
  importarOutra: { pt: "Importar outra nota", en: "Import another invoice", es: "Importar otra factura" },
  irParaCatalogo: { pt: "Ir para o Catálogo", en: "Go to Catalog", es: "Ir al Catálogo" },
  sugestaoAutomaticaBadge: { pt: "sugestão automática", en: "automatic suggestion", es: "sugerencia automática" },
};

type Lang = Idioma;
function t(chave: keyof typeof txt, lang: Lang, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

type ItemConferencia = {
  original: ItemNFe;
  status: "novo" | "existente";
  produtoIdExistente?: string;
  nome: string;
  categoria: string;
  subNicho: string;
  usaFardo: boolean;
  unidadesPorFardo: string;
  precoVenda: string;
  sugeridoIA: boolean;
  incluir: boolean;
};

export default function PDVImportarNFe() {
  const { idioma } = useLanguage();
  const lang: Lang = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Lang;
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);
  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") { setToast({ msg, tipo }); setTimeout(() => setToast(null), 4000); }

  useState(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCarregandoPapel(false); return; }
      setUserId(user.id);
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      if (id) setPapel(await obterMeuPapel(id));
      setCarregandoPapel(false);
    })();
  });

  const [nichoSel, setNichoSel] = useState<NichoPdvDef | null>(null);
  const [processandoArquivo, setProcessandoArquivo] = useState(false);
  const [resolvendoItens, setResolvendoItens] = useState(false);
  const [classificando, setClassificando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [chaveAcesso, setChaveAcesso] = useState<string | null>(null);
  const [numeroNf, setNumeroNf] = useState<string | undefined>(undefined);
  const [fornecedorInfo, setFornecedorInfo] = useState<{ existente: FornecedorMinimo | null; cnpj: string; razaoSocial?: string; fantasia?: string } | null>(null);
  const [itens, setItens] = useState<ItemConferencia[] | null>(null);
  const [margemPct, setMargemPct] = useState("");
  const [resumo, setResumo] = useState<{ sucesso: number; falhas: string[] } | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  async function handleArquivo(file: File) {
    if (!empresaId || !nichoSel) return;
    setProcessandoArquivo(true); setErroArquivo(null); setResumo(null); setItens(null);
    try {
      const texto = await file.text();
      const resultado = await parseXMLNFe(texto, undefined, lang);
      const chave = resultado.metadados?.chave_acesso;
      if (!resultado.itensNFe || resultado.itensNFe.length === 0 || !chave) {
        setErroArquivo(t("erroXmlInvalido", lang));
        return;
      }
      if (await nfeJaImportada(empresaId, chave)) {
        setErroArquivo(t("notaJaImportada", lang));
        return;
      }
      setChaveAcesso(chave);
      setNumeroNf(resultado.metadados.numero_nf ? String(resultado.metadados.numero_nf) : undefined);

      const cnpjEmit = String(resultado.metadados.cnpj_emitente || "").replace(/\D/g, "");
      const existente = cnpjEmit ? await buscarFornecedorPorCnpj(empresaId, cnpjEmit) : null;
      setFornecedorInfo({ existente, cnpj: cnpjEmit, razaoSocial: resultado.metadados.razao_social, fantasia: resultado.metadados.fantasia });

      await resolverItens(resultado.itensNFe, existente);
    } catch {
      setErroArquivo(t("erroXmlInvalido", lang));
    } finally {
      setProcessandoArquivo(false);
    }
  }

  async function resolverItens(itensNFe: ItemNFe[], fornecedor: FornecedorMinimo | null) {
    if (!empresaId) return;
    setResolvendoItens(true);
    try {
      const resolvidos = await Promise.all(itensNFe.map(async (item): Promise<ItemConferencia> => {
        let existente: Produto | null = null;
        if (fornecedor && item.codigoFornecedor) {
          const produtoId = await buscarVinculoFornecedor(fornecedor.id, item.codigoFornecedor);
          if (produtoId) existente = await buscarProdutoPorId(produtoId);
        }
        if (!existente && item.ean) existente = await buscarProdutoPorCodigo(empresaId, item.ean);

        if (existente) {
          return {
            original: item, status: "existente", produtoIdExistente: existente.id,
            nome: existente.nome, categoria: existente.categoria || "", subNicho: existente.subcategoria || "",
            usaFardo: false, unidadesPorFardo: "", precoVenda: existente.preco_venda ? String(existente.preco_venda) : "",
            sugeridoIA: false, incluir: true,
          };
        }
        return {
          original: item, status: "novo",
          nome: item.descricao, categoria: "", subNicho: "",
          usaFardo: false, unidadesPorFardo: "", precoVenda: "",
          sugeridoIA: false, incluir: true,
        };
      }));
      setItens(resolvidos);
    } finally {
      setResolvendoItens(false);
    }
  }

  async function classificarItensNovos() {
    if (!itens || !nichoSel) return;
    const pendentesIdx = itens.map((it, i) => ({ it, i })).filter(({ it }) => it.status === "novo" && !it.categoria);
    if (pendentesIdx.length === 0) return;
    setClassificando(true);
    try {
      const resp = await fetch("/api/produto/classificar-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicho: nichoSel.value, idioma: lang,
          itens: pendentesIdx.map(({ it }) => ({ ean: it.original.ean, descricao: it.original.descricao })),
        }),
      });
      const dados = await resp.json();
      if (dados.status !== "ok") { mostrarToast(t("classificando", lang), "info"); return; }
      setItens((atual) => {
        if (!atual) return atual;
        const copia = [...atual];
        dados.resultados.forEach((r: any, idx: number) => {
          const alvo = pendentesIdx[idx];
          if (!alvo) return;
          copia[alvo.i] = {
            ...copia[alvo.i],
            nome: r.nomeSugerido || copia[alvo.i].nome,
            categoria: r.categoriaSugerida || copia[alvo.i].categoria,
            subNicho: r.subNichoSugerido || copia[alvo.i].subNicho,
            sugeridoIA: !!(r.nomeSugerido || r.categoriaSugerida),
          };
        });
        return copia;
      });
    } finally {
      setClassificando(false);
    }
  }

  function aplicarMargemGlobal() {
    const pct = Number(margemPct);
    if (!itens || isNaN(pct)) return;
    setItens((atual) => (atual || []).map((it) => {
      if (it.status !== "novo" || it.precoVenda) return it;
      const custo = it.usaFardo && Number(it.unidadesPorFardo) > 0
        ? converterFardoParaUnidade(it.original.quantidade, Number(it.unidadesPorFardo), it.original.valorUnitario).custoUnitario
        : it.original.valorUnitario;
      return { ...it, precoVenda: precoComMargem(custo, pct).toFixed(2) };
    }));
  }

  function atualizarItem(idx: number, campo: keyof ItemConferencia, valor: any) {
    setItens((atual) => {
      if (!atual) return atual;
      const copia = [...atual];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  }

  async function confirmarImportacao() {
    if (!itens || !empresaId || !userId || !nichoSel || !fornecedorInfo) return;
    const incluidos = itens.filter((it) => it.incluir);
    const semDadosMinimos = incluidos.some((it) => it.status === "novo" && (!it.categoria || !it.subNicho || !it.precoVenda));
    if (semDadosMinimos) { mostrarToast(t("faltaCategoriaSubnicho", lang), "erro"); return; }

    setSalvando(true);
    const falhas: string[] = [];
    let sucesso = 0;
    try {
      let fornecedorId = fornecedorInfo.existente?.id;
      if (!fornecedorId) {
        const { id, erro } = await criarFornecedorDaNfe(empresaId, userId, { cnpj: fornecedorInfo.cnpj, razaoSocial: fornecedorInfo.razaoSocial, fantasia: fornecedorInfo.fantasia });
        if (erro) { mostrarToast(erro, "erro"); setSalvando(false); return; }
        fornecedorId = id;
      }

      for (const it of incluidos) {
        const conversao = it.usaFardo && Number(it.unidadesPorFardo) > 0
          ? converterFardoParaUnidade(it.original.quantidade, Number(it.unidadesPorFardo), it.original.valorUnitario)
          : { quantidadeUnidades: it.original.quantidade, custoUnitario: it.original.valorUnitario };

        let produtoId = it.produtoIdExistente;
        if (it.status === "novo") {
          const { id, erro } = await criarProduto(empresaId, userId, {
            nome: it.nome, categoria: it.categoria, subcategoria: it.subNicho, segmento: nichoSel.value,
            codigo_barras: it.original.ean || null, ncm: it.original.ncm || null, unidade: it.original.unidade || "UN",
            preco_custo: conversao.custoUnitario, preco_venda: Number(it.precoVenda), estoque_minimo: 0,
            status: "ativo", atributos_nicho: {}, controla_estoque: nichoSel.modo !== "servico",
          });
          if (erro) { falhas.push(`${it.nome}: ${erro}`); continue; }
          produtoId = id;
        } else if (produtoId) {
          const { erro } = await atualizarProduto(produtoId, {
            preco_custo: conversao.custoUnitario,
            ...(it.precoVenda ? { preco_venda: Number(it.precoVenda) } : {}),
          });
          if (erro) { falhas.push(`${it.nome}: ${erro}`); continue; }
        }
        if (!produtoId) { falhas.push(`${it.nome}: sem produto`); continue; }

        const { erro: erroMov } = await criarMovimentacao(empresaId, userId, {
          produto_id: produtoId, tipo: "entrada", quantidade: conversao.quantidadeUnidades, custo_unitario: conversao.custoUnitario,
          status_recebimento: "confirmada",
          lote: it.original.numeroLote ? { numero_lote: it.original.numeroLote, data_fabricacao: it.original.dataFabricacao, data_validade: it.original.dataValidade } : undefined,
        });
        if (erroMov) { falhas.push(`${it.nome}: ${erroMov}`); continue; }

        if (fornecedorId && it.original.codigoFornecedor) {
          await salvarVinculoFornecedor(fornecedorId, userId, empresaId, produtoId, it.original.codigoFornecedor);
        }
        sucesso++;
      }

      if (chaveAcesso) {
        await registrarNfeImportada(empresaId, userId, {
          chaveAcesso, numeroNf, fornecedorId, valorTotal: incluidos.reduce((s, it) => s + it.original.valorTotal, 0), qtdItens: sucesso,
        });
      }
      setResumo({ sucesso, falhas });
      if (falhas.length === 0) mostrarToast(t("resumoSucesso", lang, { n: sucesso }));
    } finally {
      setSalvando(false);
    }
  }

  function reiniciar() {
    setItens(null); setChaveAcesso(null); setNumeroNf(undefined); setFornecedorInfo(null);
    setErroArquivo(null); setResumo(null); setMargemPct("");
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  if (carregandoPapel) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (papel === "operador") {
    return (
      <PdvLayout titulo={t("operadorTitulo", lang)} subtitulo="">
        <AvisoOperador lang={lang} />
      </PdvLayout>
    );
  }

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
      {toast && <ToastPdv msg={toast.msg} tipo={toast.tipo} />}

      {resumo ? (
        <ResumoFinal lang={lang} resumo={resumo} onImportarOutra={reiniciar} />
      ) : (
        <div className="space-y-5">
          <SeletorNichoSimples lang={lang} nichoSel={nichoSel} onSelecionar={(v) => { setNichoSel(NICHOS_PDV.find((n) => n.value === v) || null); reiniciar(); }} />

          {nichoSel && !itens && (
            <AreaUpload lang={lang} inputRef={inputArquivoRef} processando={processandoArquivo} erro={erroArquivo}
              onArquivo={(f) => handleArquivo(f)} />
          )}

          {resolvendoItens && <SpinnerResolvendoItens lang={lang} />}

          {fornecedorInfo && itens && !resolvendoItens && (
            <FornecedorCard lang={lang} info={fornecedorInfo} />
          )}

          {itens && !resolvendoItens && nichoSel && (
            <TabelaConferencia
              lang={lang} nicho={nichoSel} itens={itens} classificando={classificando} margemPct={margemPct}
              onMargemChange={setMargemPct} onAplicarMargem={aplicarMargemGlobal} onClassificar={classificarItensNovos}
              onAtualizarItem={atualizarItem} onConfirmar={confirmarImportacao} salvando={salvando}
            />
          )}
        </div>
      )}
    </PdvLayout>
  );
}

// ============================================================================
// SUBCOMPONENTES
// ============================================================================

function EstadoCarregando({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} /><span className="text-sm">{t("carregando", lang)}</span>
    </div>
  );
}

function AvisoOperador({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <p className="text-sm text-center max-w-md" style={{ color: tokens.textoMuted }}>{t("operadorCorpo", lang)}</p>
    </div>
  );
}

function SpinnerResolvendoItens({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center gap-2 py-6 justify-center" style={{ color: tokens.textoSecundario }}>
      <Loader2 className="animate-spin" size={16} /><span className="text-sm">{t("resolvendoItens", lang)}</span>
    </div>
  );
}

function ToastPdv({ msg, tipo }: { msg: string; tipo: "ok" | "erro" | "info" }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{
        background: tipo === "erro" ? "rgba(239,68,68,0.95)" : tipo === "info" ? "rgba(30,41,59,0.95)" : tokens.acaoBg,
        color: tipo === "ok" ? tokens.acaoTexto : "#fff",
      }}>
      {msg}
    </div>
  );
}

function SeletorNichoSimples({ lang, nichoSel, onSelecionar }: { lang: Lang; nichoSel: NichoPdvDef | null; onSelecionar: (v: string) => void }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="p-4 rounded-xl" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.textoSecundario }}>{t("escolhaNicho", lang)}</label>
      <select value={nichoSel?.value || ""} onChange={(e) => onSelecionar(e.target.value)}
        className="w-full sm:w-80 px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.inputTexto }}>
        <option value="">{t("selecione", lang)}</option>
        {NICHOS_PDV.filter((n) => n.modo !== "servico" && n.value !== "generico").map((n) => (
          <option key={n.value} value={n.value}>{n.label[lang]}</option>
        ))}
      </select>
    </div>
  );
}

function AreaUpload({ lang, inputRef, processando, erro, onArquivo }: {
  lang: Lang; inputRef: React.RefObject<HTMLInputElement | null>; processando: boolean; erro: string | null; onArquivo: (f: File) => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <button onClick={() => inputRef.current?.click()} disabled={processando}
        className="w-full flex flex-col items-center justify-center gap-2 py-12 rounded-xl border-2 border-dashed disabled:opacity-60"
        style={{ borderColor: tokens.cardBorda, background: tokens.cardBg }}>
        {processando ? <Loader2 className="animate-spin" size={28} style={{ color: tokens.cardTexto }} /> : <Upload size={28} style={{ color: tokens.cardTexto }} />}
        <span className="text-sm font-semibold" style={{ color: tokens.cardTexto }}>{processando ? t("processando", lang) : t("enviarArquivo", lang)}</span>
        <span className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.72 }}>{t("arrastarSolte", lang)}</span>
      </button>
      <input ref={inputRef} type="file" accept=".xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onArquivo(f); }} />
      {erro && (
        <div className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={15} /> {erro}
        </div>
      )}
    </div>
  );
}

function FornecedorCard({ lang, info }: { lang: Lang; info: { existente: FornecedorMinimo | null; cnpj: string; razaoSocial?: string; fantasia?: string } }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="p-4 rounded-xl flex items-center justify-between flex-wrap gap-2" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: tokens.cardTexto, opacity: 0.75 }}>{t("fornecedorTitulo", lang)}</p>
        <p className="text-sm" style={{ color: tokens.cardTexto }}>{info.existente?.nome || info.fantasia || info.razaoSocial || info.cnpj}</p>
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: info.existente ? "rgba(255,255,255,0.18)" : "rgba(245,185,66,0.15)", color: info.existente ? tokens.cardTexto : AMBAR }}>
        {info.existente ? t("fornecedorExistente", lang) : t("fornecedorNovo", lang)}
      </span>
    </div>
  );
}

function TabelaConferencia({ lang, nicho, itens, classificando, margemPct, onMargemChange, onAplicarMargem, onClassificar, onAtualizarItem, onConfirmar, salvando }: {
  lang: Lang; nicho: NichoPdvDef; itens: ItemConferencia[]; classificando: boolean; margemPct: string;
  onMargemChange: (v: string) => void; onAplicarMargem: () => void; onClassificar: () => void;
  onAtualizarItem: (idx: number, campo: keyof ItemConferencia, valor: any) => void; onConfirmar: () => void; salvando: boolean;
}) {
  const { tokens } = useTemaPdv();
  const opcoesCategoria = nicho.categorias.map((c) => ({ value: c.label[lang], label: c.label[lang], subNichos: c.subNichos }));
  const qtdNovosSemCategoria = itens.filter((it) => it.status === "novo" && !it.categoria).length;

  return (
    <div className="space-y-4">
      {qtdNovosSemCategoria > 0 && (
        <button onClick={onClassificar} disabled={classificando}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
          style={{ background: "rgba(245,185,66,0.15)", color: AMBAR }}>
          {classificando ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} {classificando ? t("classificando", lang) : t("classificarAutomatico", lang)}
        </button>
      )}

      <div className="flex items-end gap-2 flex-wrap p-3 rounded-xl" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: tokens.cardTexto, opacity: 0.75 }}>{t("margemLabel", lang)}</label>
          <input type="number" value={margemPct} onChange={(e) => onMargemChange(e.target.value)}
            className="w-28 px-3 py-2 rounded-lg text-sm" style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.inputTexto }} />
        </div>
        <button onClick={onAplicarMargem} className="px-3.5 py-2 rounded-lg text-xs font-semibold" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
          {t("aplicarMargem", lang)}
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tokens.texto }}>{t("itensTitulo", lang)} ({itens.length})</p>
        {itens.map((it, idx) => (
          <ItemConferenciaCard key={idx} lang={lang} item={it} opcoesCategoria={opcoesCategoria} onAtualizar={(campo, v) => onAtualizarItem(idx, campo, v)} />
        ))}
      </div>

      <button onClick={onConfirmar} disabled={salvando}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {salvando ? t("gravando", lang) : t("confirmarImportacao", lang)}
      </button>
    </div>
  );
}

function ItemConferenciaCard({ lang, item, opcoesCategoria, onAtualizar }: {
  lang: Lang; item: ItemConferencia; opcoesCategoria: { value: string; label: string; subNichos: { value: string; label: Record<Lang, string> }[] }[];
  onAtualizar: (campo: keyof ItemConferencia, valor: any) => void;
}) {
  const { tokens } = useTemaPdv();
  const categoriaAtual = opcoesCategoria.find((c) => c.value === item.categoria);
  const conversao = item.usaFardo && Number(item.unidadesPorFardo) > 0
    ? converterFardoParaUnidade(item.original.quantidade, Number(item.unidadesPorFardo), item.original.valorUnitario)
    : { quantidadeUnidades: item.original.quantidade, custoUnitario: item.original.valorUnitario };

  return (
    <div className="p-4 rounded-xl space-y-3" style={{ background: tokens.cardBg, border: `1px solid ${item.status === "novo" ? "rgba(245,185,66,0.3)" : tokens.cardBorda}` }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input type="checkbox" checked={item.incluir} onChange={(e) => onAtualizar("incluir", e.target.checked)} className="w-4 h-4 rounded shrink-0" />
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: item.status === "novo" ? "rgba(245,185,66,0.18)" : "rgba(255,255,255,0.18)", color: item.status === "novo" ? AMBAR : tokens.cardTexto }}>
            {item.status === "novo" ? t("statusNovo", lang) : t("statusExistente", lang)}
          </span>
          {item.sugeridoIA && <span className="flex items-center gap-1 text-xs" style={{ color: AMBAR }}><Sparkles size={11} /> {t("sugestaoAutomaticaBadge", lang)}</span>}
        </div>
        <Package size={15} style={{ color: tokens.cardTexto, opacity: 0.75 }} />
      </div>

      <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.75 }}>{t("colDescricaoOriginal", lang)}: {item.original.descricao}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CampoTexto label={t("colNome", lang)} value={item.nome} onChange={(v) => onAtualizar("nome", v)} />
        <CampoSelect label={t("colCategoria", lang)} value={item.categoria}
          onChange={(v) => { onAtualizar("categoria", v); onAtualizar("subNicho", ""); }}
          opcoes={opcoesCategoria.map((c) => ({ value: c.value, label: c.label }))} disabled={item.status === "existente"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CampoSelect label={t("colSubNicho", lang)} value={item.subNicho} onChange={(v) => onAtualizar("subNicho", v)}
          opcoes={(categoriaAtual?.subNichos || []).map((s) => ({ value: s.label[lang], label: s.label[lang] }))} disabled={item.status === "existente" || !item.categoria} />
        <CampoTexto label={t("colPrecoVenda", lang)} tipo="number" value={item.precoVenda} onChange={(v) => onAtualizar("precoVenda", v)} />
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: tokens.cardTexto, opacity: 0.85 }}>
        <span>{t("colQuantidade", lang)}: {conversao.quantidadeUnidades} {item.original.unidade || ""}</span>
        <span>{t("colCusto", lang)}: {conversao.custoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        {item.original.numeroLote && <span style={{ color: tokens.cardTexto, opacity: 1 }}>{t("loteValidadeDetectado", lang)}: {item.original.numeroLote}{item.original.dataValidade ? ` · ${item.original.dataValidade}` : ""}</span>}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={item.usaFardo} onChange={(e) => onAtualizar("usaFardo", e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.85 }}>{t("vemEmFardo", lang)}</span>
      </label>
      {item.usaFardo && (
        <CampoTexto label={t("unidadesPorFardo", lang)} tipo="number" value={item.unidadesPorFardo} onChange={(v) => onAtualizar("unidadesPorFardo", v)} />
      )}
    </div>
  );
}

function CampoTexto({ label, value, onChange, tipo = "text" }: { label: string; value: string; onChange: (v: string) => void; tipo?: "text" | "number" }) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.cardTexto, opacity: 0.8 }}>{label}</label>
      <input type={tipo} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.inputTexto }} />
    </div>
  );
}

function CampoSelect({ label, value, onChange, opcoes, disabled }: { label: string; value: string; onChange: (v: string) => void; opcoes: { value: string; label: string }[]; disabled?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.cardTexto, opacity: 0.8 }}>{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm disabled:opacity-50"
        style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.inputTexto }}>
        <option value="">—</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ResumoFinal({ lang, resumo, onImportarOutra }: { lang: Lang; resumo: { sucesso: number; falhas: string[] }; onImportarOutra: () => void }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="text-center py-10 space-y-4">
      <CheckCircle2 size={40} style={{ color: tokens.acento, margin: "0 auto" }} />
      <p className="text-sm font-semibold" style={{ color: tokens.texto }}>{t("resumoSucesso", lang, { n: resumo.sucesso })}</p>
      {resumo.falhas.length > 0 && (
        <div className="text-left max-w-md mx-auto p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#fca5a5" }}>{t("resumoFalhas", lang, { n: resumo.falhas.length })}</p>
          {resumo.falhas.map((f, i) => <p key={i} className="text-xs" style={{ color: "#fca5a5" }}>{f}</p>)}
        </div>
      )}
      <div className="flex gap-2 justify-center flex-wrap">
        <button onClick={onImportarOutra} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>{t("importarOutra", lang)}</button>
        <a href="/pdv" className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: tokens.textoSecundario, border: `1px solid ${tokens.bordaContainer}` }}>{t("irParaCatalogo", lang)}</a>
      </div>
    </div>
  );
}
