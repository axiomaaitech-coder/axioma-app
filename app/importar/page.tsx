"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TipoDocumento = {
  tipo: string;
  destino: string;
  icon: string;
  cor: string;
};

type Importacao = {
  id: string;
  nome_arquivo: string;
  tipo_documento: string;
  destino: string;
  status: string;
  created_at: string;
  user_id: string;
  empresa_id: string;
};

const tiposDocumento: TipoDocumento[] = [
  { tipo: "Extrato Bancário", destino: "Fluxo de Caixa + Receitas", icon: "🏦", cor: "#6ab0ff" },
  { tipo: "Nota Fiscal (XML/PDF)", destino: "Fornecedores + Custos", icon: "🧾", cor: "#34d399" },
  { tipo: "Planilha de Vendas", destino: "Receitas", icon: "📊", cor: "#fbbf24" },
  { tipo: "Contrato de Dívida", destino: "Endividamento", icon: "📋", cor: "#f87171" },
  { tipo: "Folha de Pagamento", destino: "Custos Fixos", icon: "👥", cor: "#a78bfa" },
  { tipo: "Documento Fiscal", destino: "IA Tributária", icon: "🧾", cor: "#fb923c" },
];

function detectarTipoDocumento(nomeArquivo: string): TipoDocumento {
  const nome = nomeArquivo.toLowerCase();
  if (nome.includes("extrato") || nome.includes("bancario") || nome.includes("banco")) {
    return tiposDocumento[0];
  } else if (nome.includes("nf") || nome.includes("nota") || nome.includes(".xml")) {
    return tiposDocumento[1];
  } else if (nome.includes("venda") || nome.includes("fatura") || nome.includes("receita")) {
    return tiposDocumento[2];
  } else if (nome.includes("divida") || nome.includes("contrato") || nome.includes("emprestimo")) {
    return tiposDocumento[3];
  } else if (nome.includes("folha") || nome.includes("pagamento") || nome.includes("salario")) {
    return tiposDocumento[4];
  } else if (nome.includes("fiscal") || nome.includes("imposto") || nome.includes("tribut")) {
    return tiposDocumento[5];
  }
  return tiposDocumento[0];
}

export default function ImportarPage() {
  const { t } = useLanguage();
  const imp = t.importar;

  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [tipoDetectado, setTipoDetectado] = useState<TipoDocumento | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    setEmpresaId(empresa?.id || null);

    const { data } = await supabase
      .from("importacoes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setImportacoes(data || []);
    setLoading(false);
  }

  function processarArquivo(file: File) {
    setArquivoSelecionado(file);
    setAnalisando(true);
    setTipoDetectado(null);
    setSucesso(false);

    // Simula análise da IA
    setTimeout(() => {
      const tipo = detectarTipoDocumento(file.name);
      setTipoDetectado(tipo);
      setAnalisando(false);
    }, 2000);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setArrastandoArquivo(true);
  }

  function onDragLeave() {
    setArrastandoArquivo(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastandoArquivo(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  }

  async function confirmarLancamento() {
    if (!arquivoSelecionado || !tipoDetectado) return;
    setConfirmando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("importacoes").insert({
      nome_arquivo: arquivoSelecionado.name,
      tipo_documento: tipoDetectado.tipo,
      destino: tipoDetectado.destino,
      status: "processado",
      user_id: user.id,
      empresa_id: empresaId,
    });

    setConfirmando(false);
    setSucesso(true);
    setArquivoSelecionado(null);
    setTipoDetectado(null);
    carregarDados();

    setTimeout(() => setSucesso(false), 3000);
  }

  function novaImportacao() {
    setArquivoSelecionado(null);
    setTipoDetectado(null);
    setSucesso(false);
    setAnalisando(false);
  }

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#020810", minHeight: "100vh" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>📄 {imp.titulo}</h1>
        <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{imp.subtitulo}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUNA ESQUERDA — Upload */}
        <div className="space-y-4">

          {/* Área de Upload */}
          {!arquivoSelecionado && !sucesso && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="rounded-2xl p-10 text-center cursor-pointer transition-all"
              style={{
                background: arrastandoArquivo ? "rgba(106,176,255,0.1)" : "rgba(10,22,40,0.8)",
                border: `2px dashed ${arrastandoArquivo ? "#6ab0ff" : "rgba(59,111,212,0.3)"}`,
              }}
            >
              <div className="text-5xl mb-4">📂</div>
              <p className="text-lg font-semibold mb-1" style={{ color: "#c8d8f0" }}>{imp.arrasteAqui}</p>
              <p className="text-sm mb-3" style={{ color: "#3a5a8a" }}>{imp.ouClique}</p>
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(59,111,212,0.15)", color: "#6ab0ff" }}>
                {imp.formatosAceitos}
              </span>
              <input ref={inputRef} type="file" accept=".pdf,.xml,.xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            </div>
          )}

          {/* Analisando */}
          {analisando && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-semibold" style={{ color: "#6ab0ff" }}>{imp.analisando}</p>
              <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{arquivoSelecionado?.name}</p>
            </div>
          )}

          {/* Resultado da Análise */}
          {tipoDetectado && !sucesso && (
            <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${tipoDetectado.cor}40` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{tipoDetectado.icon}</span>
                <div>
                  <p className="text-xs" style={{ color: "#3a5a8a" }}>{imp.tipoIdentificado}</p>
                  <p className="font-bold" style={{ color: "#c8d8f0" }}>{tipoDetectado.tipo}</p>
                </div>
              </div>

              <div className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(59,111,212,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{imp.destinoSugerido}</p>
                <p className="text-sm font-semibold" style={{ color: tipoDetectado.cor }}>→ {tipoDetectado.destino}</p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(59,111,212,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{imp.arquivo}</p>
                <p className="text-sm" style={{ color: "#c8d8f0" }}>📄 {arquivoSelecionado?.name}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={novaImportacao} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a", border: "1px solid rgba(59,111,212,0.15)" }}>
                  {imp.cancelar}
                </button>
                <button onClick={confirmarLancamento} disabled={confirmando} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {confirmando ? "..." : imp.confirmarLancamento}
                </button>
              </div>
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-bold" style={{ color: "#34d399" }}>{imp.sucesso}</p>
              <button onClick={novaImportacao} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {imp.novoImporte}
              </button>
            </div>
          )}

          {/* Tipos de documento aceitos */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#3a5a8a" }}>📋 TIPOS DE DOCUMENTO</p>
            <div className="space-y-2">
              {tiposDocumento.map((tipo, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <span>{tipo.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#c8d8f0" }}>{tipo.tipo}</p>
                    <p className="text-xs" style={{ color: tipo.cor }}>→ {tipo.destino}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA — Histórico */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "#6ab0ff" }}>🕓 {imp.historico}</p>

          {loading ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : importacoes.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style={{ color: "#3a5a8a" }}>{imp.semImportacoes}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {importacoes.map((item) => {
                const tipo = tiposDocumento.find(t => t.tipo === item.tipo_documento) || tiposDocumento[0];
                return (
                  <div key={item.id} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tipo.icon}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{item.nome_arquivo}</p>
                          <p className="text-xs mt-0.5" style={{ color: tipo.cor }}>→ {item.destino}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>
                            {new Date(item.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{
                        background: item.status === "processado" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                        color: item.status === "processado" ? "#34d399" : "#f87171"
                      }}>
                        {item.status === "processado" ? imp.processado : imp.falhou}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}