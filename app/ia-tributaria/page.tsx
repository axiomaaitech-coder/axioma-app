"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Lightbulb, Shield, Paperclip, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const alertas = [
  { icon: AlertTriangle, texto: "Reforma Tributária 2026: IBS e CBS substituem PIS/COFINS. Sua empresa pode ser impactada.", cor: "#f87171" },
  { icon: Lightbulb, texto: "Simples Nacional: verifique se seu faturamento ainda permite enquadramento (até R$ 4,8M/ano).", cor: "#fbbf24" },
  { icon: CheckCircle, texto: "JCP (Juros sobre Capital Próprio): sua empresa pode deduzir até R$ 18.000/mês.", cor: "#34d399" },
  { icon: Shield, texto: "Incentivos fiscais disponíveis para seu setor: Lei do Bem, Rota 2030, Pró-Inovação.", cor: "#a78bfa" },
];

const economias = [
  { titulo: "Troca de Regime", descricao: "Lucro Real → Lucro Presumido", economia: "até 30%", cor: "#34d399" },
  { titulo: "JCP", descricao: "Juros sobre Capital Próprio", economia: "até 15%", cor: "#6ab0ff" },
  { titulo: "Reforma Tributária", descricao: "Planejamento antecipado", economia: "até 34%", cor: "#a78bfa" },
  { titulo: "Incentivos Fiscais", descricao: "Lei do Bem e similares", economia: "até 75%", cor: "#fbbf24" },
];

const respostas: Record<string, string> = {
  "Qual regime tributário é melhor para mim?": "Analisando seu faturamento de R$ 62.000/mês (R$ 744.000/ano), o Simples Nacional pode ser vantajoso se sua margem for alta. Porém, se você tem muitos funcionários CLT, o Lucro Presumido pode reduzir a carga em até 22%. Recomendo uma simulação com seu contador usando esses dados.",
  "Como funciona o JCP?": "JCP (Juros sobre Capital Próprio) permite remunerar sócios com tributação menor (15% IR na fonte vs 27,5% no pro-labore). Com patrimônio líquido de R$ 200.000, você pode distribuir até R$ 18.000/mês via JCP, economizando aproximadamente R$ 2.700/mês em impostos.",
  "O que muda com a Reforma Tributária?": "A Reforma unifica PIS, COFINS e IPI no CBS, e ICMS e ISS no IBS. Transição: 2026-2032. Para PMEs: o Simples Nacional permanece, mas haverá ajustes nas alíquotas. Recomendo mapear agora seus principais insumos e clientes para simular o impacto antes de 2027.",
  "Quais deduções posso usar?": "Para sua empresa, identifiquei: 1) Depreciação acelerada de equipamentos; 2) Dedução de despesas com P&D (Lei do Bem); 3) PAT — Programa de Alimentação do Trabalhador; 4) Vale-transporte e benefícios dedutíveis. Potencial de redução na base de cálculo: R$ 8.400/mês.",
};

const perguntasSugeridas = [
  "Qual regime tributário é melhor para mim?",
  "Como funciona o JCP?",
  "O que muda com a Reforma Tributária?",
  "Quais deduções posso usar?",
];

const paises = ["🇧🇷 Brasil", "🇺🇸 EUA", "🇵🇹 Portugal", "🇩🇪 Alemanha", "🇬🇧 Reino Unido", "🇨🇦 Canadá", "🇦🇺 Austrália"];

export default function IATributaria() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mensagens, setMensagens] = useState<{ role: string; texto: string; arquivo?: string }[]>([
    { role: "assistant", texto: "Olá! Sou sua IA Tributária Premium. Analisei seu perfil fiscal e estou pronto para ajudar com planejamento tributário legal e estratégico. Como posso reduzir sua carga tributária?" }
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [paisSelecionado, setPaisSelecionado] = useState("🇧🇷 Brasil");
  const [arquivoAnexado, setArquivoAnexado] = useState<File | null>(null);

  const enviarMensagem = (texto: string) => {
    if (!texto.trim() && !arquivoAnexado) return;

    const msgUsuario: { role: string; texto: string; arquivo?: string } = {
      role: "user",
      texto: texto || (arquivoAnexado ? `📎 ${arquivoAnexado.name}` : ""),
      arquivo: arquivoAnexado?.name,
    };

    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);

    const temArquivo = !!arquivoAnexado;
    setArquivoAnexado(null);

    setTimeout(() => {
      let resposta = "";
      if (temArquivo) {
        resposta = "Recebi seu documento fiscal! Analisei o conteúdo e identifiquei os principais dados tributários. Com base neste arquivo, posso responder perguntas sobre regimes, deduções e oportunidades de economia. O que você gostaria de saber?";
      } else {
        resposta = respostas[texto] || "Ótima questão tributária! Para uma análise precisa, recomendo combinar este planejamento com seu contador. Posso detalhar alguma estratégia específica de redução de impostos dentro da legalidade?";
      }
      setMensagens([...novasMensagens, { role: "assistant", texto: resposta }]);
      setCarregando(false);
    }, 1500);
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArquivoAnexado(file);
  }

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#3a5a8a" }}><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>{t.nav.iaTributaria}</h2>
              <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>PREMIUM</span>
            </div>
            <p className="text-sm" style={{ color: "#3a5a8a" }}>Planejamento tributário legal e estratégico</p>
          </div>
        </div>
        <select value={paisSelecionado} onChange={(e) => setPaisSelecionado(e.target.value)} className="px-4 py-2 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(167,139,250,0.3)", color: "#c8d8f0" }}>
          {paises.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Cards de economia */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {economias.map((e, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${e.cor}22` }}>
            <p className="text-3xl font-black mb-1" style={{ color: e.cor }}>{e.economia}</p>
            <p className="text-sm font-bold mb-1" style={{ color: "#c8d8f0" }}>{e.titulo}</p>
            <p className="text-xs" style={{ color: "#3a5a8a" }}>{e.descricao}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {alertas.map((a, i) => (
          <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${a.cor}22` }}>
            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${a.cor}15` }}>
              <a.icon size={20} style={{ color: a.cor }} />
            </div>
            <p className="text-sm" style={{ color: "#8aaad4" }}>{a.texto}</p>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(167,139,250,0.15)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#a78bfa" }}>⚡ {t.nav.iaTributariaPremium}</h3>
        </div>

        {/* Mensagens */}
        <div className="p-6 space-y-4 min-h-64 max-h-96 overflow-auto">
          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-md px-4 py-3 rounded-2xl text-sm" style={{
                background: m.role === "user" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${m.role === "user" ? "rgba(167,139,250,0.3)" : "rgba(167,139,250,0.1)"}`,
                color: "#c8d8f0"
              }}>
                {m.arquivo && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
                    <Paperclip size={12} style={{ color: "#a78bfa" }} />
                    <span className="text-xs" style={{ color: "#a78bfa" }}>{m.arquivo}</span>
                  </div>
                )}
                {m.texto !== `📎 ${m.arquivo}` && m.texto}
              </div>
            </div>
          ))}
          {carregando && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.1)", color: "#3a5a8a" }}>
                Consultando legislação tributária...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 pb-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {perguntasSugeridas.map((p, i) => (
              <button key={i} onClick={() => enviarMensagem(p)} className="text-xs px-3 py-2 rounded-xl transition-all hover:scale-105" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                {p}
              </button>
            ))}
          </div>

          {/* Arquivo anexado preview */}
          {arquivoAnexado && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)" }}>
              <Paperclip size={14} style={{ color: "#a78bfa" }} />
              <span className="text-xs flex-1" style={{ color: "#a78bfa" }}>{arquivoAnexado.name}</span>
              <button onClick={() => setArquivoAnexado(null)} style={{ color: "#f87171" }}>
                <X size={14} />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept=".pdf,.xml,.xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />

          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-3 rounded-xl transition-all hover:opacity-80" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }} title="Anexar documento fiscal">
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensagem(input)}
              placeholder="Pergunte sobre impostos e planejamento tributário..."
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", color: "#c8d8f0" }}
            />
            <button onClick={() => enviarMensagem(input)} className="px-4 py-3 rounded-xl transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "#1a3a5a" }}>⚠️ As informações são educativas. Consulte sempre um contador para decisões fiscais.</p>
        </div>
      </div>
    </div>
  );
}