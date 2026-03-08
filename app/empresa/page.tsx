"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

export default function Empresa() {
  const router = useRouter();
  const { t } = useLanguage();
  const [aba, setAba] = useState("empresa");
  const [salvo, setSalvo] = useState(false);
  const [notificacoes, setNotificacoes] = useState({ email: true, sms: false, alertas: true, relatorio: true });

  const salvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.empresa.titulo}</h2>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.empresa.subtitulo}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-8">
        {[
          { key: "empresa", label: t.empresa.abaEmpresa },
          { key: "perfil", label: t.empresa.abaPerfil },
          { key: "notificacoes", label: t.empresa.abaNotificacoes },
          { key: "plano", label: t.empresa.abaPlano },
        ].map((a) => (
          <button key={a.key} onClick={() => setAba(a.key)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{background: aba === a.key ? "rgba(59,111,212,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.3)" : "rgba(59,111,212,0.15)"}`}}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba Empresa */}
      {aba === "empresa" && (
        <div className="rounded-2xl p-8 max-w-2xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-lg font-bold mb-6" style={{color: "#c8d8f0"}}>{t.empresa.dadosEmpresa}</h3>
          <div className="space-y-4">
            {[
              { label: "Razão Social", value: "Axioma AI Tech Ltda" },
              { label: "CNPJ", value: "12.345.678/0001-90" },
              { label: "Regime Tributário", value: "Simples Nacional" },
              { label: "Setor", value: "Tecnologia / SaaS" },
              { label: "Cidade", value: "São Paulo - SP" },
            ].map((campo) => (
              <div key={campo.label}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{campo.label}</label>
                <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
            ))}
            <button onClick={salvar} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 mt-4" style={{background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none"}}>
              {salvo ? t.geral.salvo : t.geral.salvar}
            </button>
          </div>
        </div>
      )}

      {/* Aba Perfil */}
      {aba === "perfil" && (
        <div className="rounded-2xl p-8 max-w-2xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>E</div>
            <div>
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>Elias Tavares</h3>
              <p className="text-sm" style={{color: "#3a5a8a"}}>CEO / Fundador</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Nome completo", value: "Elias Tavares" },
              { label: "E-mail", value: "elias@axiomaaitech.com.br" },
              { label: "Cargo", value: "CEO / Fundador" },
              { label: "Telefone", value: "(11) 99999-0000" },
            ].map((campo) => (
              <div key={campo.label}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{campo.label}</label>
                <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
            ))}
            <button onClick={salvar} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 mt-4" style={{background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none"}}>
              {salvo ? t.geral.salvo : t.geral.salvar}
            </button>
          </div>
        </div>
      )}

      {/* Aba Notificações */}
      {aba === "notificacoes" && (
        <div className="rounded-2xl p-8 max-w-2xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <h3 className="text-lg font-bold mb-6" style={{color: "#c8d8f0"}}>{t.empresa.abaNotificacoes}</h3>
          <div className="space-y-4">
            {[
              { key: "email", label: "Notificações por e-mail" },
              { key: "sms", label: "Notificações por SMS" },
              { key: "alertas", label: "Alertas financeiros da IA" },
              { key: "relatorio", label: "Relatório semanal automático" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between p-4 rounded-xl" style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,111,212,0.1)"}}>
                <span className="text-sm" style={{color: "#c8d8f0"}}>{n.label}</span>
                <button onClick={() => setNotificacoes({...notificacoes, [n.key]: !notificacoes[n.key as keyof typeof notificacoes]})} className="w-12 h-6 rounded-full transition-all relative" style={{background: notificacoes[n.key as keyof typeof notificacoes] ? "rgba(59,111,212,0.5)" : "rgba(255,255,255,0.1)"}}>
                  <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all" style={{background: notificacoes[n.key as keyof typeof notificacoes] ? "#6ab0ff" : "#3a5a8a", left: notificacoes[n.key as keyof typeof notificacoes] ? "26px" : "2px"}}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba Plano */}
      {aba === "plano" && (
        <div className="max-w-3xl">
          <div className="rounded-2xl p-6 mb-6" style={{background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase" style={{color: "#6ab0ff"}}>{t.empresa.planoAtual}</span>
                <h3 className="text-2xl font-black mt-1" style={{color: "#c8d8f0"}}>Professional</h3>
                <p className="text-sm mt-1" style={{color: "#3a5a8a"}}>5 usuários • Todos os módulos • IA Financeira</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{color: "#6ab0ff"}}>R$ 197</p>
                <p className="text-sm" style={{color: "#3a5a8a"}}>/mês</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { nome: "Starter", preco: "R$ 97", desc: "1 usuário • Módulos básicos", cor: "#3a5a8a" },
              { nome: "Professional", preco: "R$ 197", desc: "5 usuários • Todos os módulos", cor: "#6ab0ff", atual: true },
              { nome: "Enterprise", preco: "R$ 497", desc: "Ilimitado • IA Tributária inclusa", cor: "#a78bfa" },
            ].map((plano) => (
              <div key={plano.nome} className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: `1px solid ${plano.cor}33`}}>
                <h4 className="font-bold mb-1" style={{color: plano.cor}}>{plano.nome}</h4>
                <p className="text-2xl font-black mb-2" style={{color: "#c8d8f0"}}>{plano.preco}<span className="text-sm font-normal" style={{color: "#3a5a8a"}}>/mês</span></p>
                <p className="text-xs mb-4" style={{color: "#3a5a8a"}}>{plano.desc}</p>
                <button className="w-full py-2 rounded-xl text-sm font-bold" style={{background: plano.atual ? "rgba(59,111,212,0.2)" : "transparent", color: plano.atual ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${plano.cor}33`}}>
                  {plano.atual ? "Plano atual" : "Fazer upgrade"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}