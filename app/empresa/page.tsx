"use client";
import { useState } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import ModuloLayout from "../../components/ModuloLayout";

export default function Empresa() {
  const { t, idioma } = useLanguage();
  const [aba, setAba] = useState("empresa");
  const [salvo, setSalvo] = useState(false);
  const [notificacoes, setNotificacoes] = useState({ email: true, sms: false, alertas: true, relatorio: true });

  const salvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  const camposEmpresa = {
    pt: [
      { label: "Razão Social", value: "Axioma AI Tech Ltda" },
      { label: "CNPJ", value: "12.345.678/0001-90" },
      { label: "Regime Tributário", value: "Simples Nacional" },
      { label: "Setor", value: "Tecnologia / SaaS" },
      { label: "Cidade", value: "São Paulo - SP" },
    ],
    en: [
      { label: "Company Name", value: "Axioma AI Tech Ltda" },
      { label: "Tax ID", value: "12.345.678/0001-90" },
      { label: "Tax Regime", value: "Simples Nacional" },
      { label: "Sector", value: "Technology / SaaS" },
      { label: "City", value: "São Paulo - SP" },
    ],
    es: [
      { label: "Razón Social", value: "Axioma AI Tech Ltda" },
      { label: "RUT / NIF", value: "12.345.678/0001-90" },
      { label: "Régimen Tributario", value: "Simples Nacional" },
      { label: "Sector", value: "Tecnología / SaaS" },
      { label: "Ciudad", value: "São Paulo - SP" },
    ],
  };

  const camposPerfil = {
    pt: [
      { label: "Nome completo", value: "Elias Tavares" },
      { label: "E-mail", value: "elias@axiomaaitech.com.br" },
      { label: "Cargo", value: "CEO / Fundador" },
      { label: "Telefone", value: "(11) 99999-0000" },
    ],
    en: [
      { label: "Full name", value: "Elias Tavares" },
      { label: "E-mail", value: "elias@axiomaaitech.com.br" },
      { label: "Role", value: "CEO / Founder" },
      { label: "Phone", value: "(11) 99999-0000" },
    ],
    es: [
      { label: "Nombre completo", value: "Elias Tavares" },
      { label: "Correo electrónico", value: "elias@axiomaaitech.com.br" },
      { label: "Cargo", value: "CEO / Fundador" },
      { label: "Teléfono", value: "(11) 99999-0000" },
    ],
  };

  const notificacoesLabels = {
    pt: [
      { key: "email", label: "Notificações por e-mail" },
      { key: "sms", label: "Notificações por SMS" },
      { key: "alertas", label: "Alertas financeiros da IA" },
      { key: "relatorio", label: "Relatório semanal automático" },
    ],
    en: [
      { key: "email", label: "Email notifications" },
      { key: "sms", label: "SMS notifications" },
      { key: "alertas", label: "AI financial alerts" },
      { key: "relatorio", label: "Automatic weekly report" },
    ],
    es: [
      { key: "email", label: "Notificaciones por correo" },
      { key: "sms", label: "Notificaciones por SMS" },
      { key: "alertas", label: "Alertas financieros de IA" },
      { key: "relatorio", label: "Informe semanal automático" },
    ],
  };

  const planosLabels = {
    pt: { atual: "Plano atual", upgrade: "Fazer upgrade", mes: "/mês", usuarios: "usuários", modulos: "Módulos básicos", todos: "Todos os módulos", ia: "IA Tributária inclusa", ilimitado: "Ilimitado" },
    en: { atual: "Current plan", upgrade: "Upgrade", mes: "/month", usuarios: "users", modulos: "Basic modules", todos: "All modules", ia: "Tax AI included", ilimitado: "Unlimited" },
    es: { atual: "Plan actual", upgrade: "Actualizar", mes: "/mes", usuarios: "usuarios", modulos: "Módulos básicos", todos: "Todos los módulos", ia: "IA Tributaria incluida", ilimitado: "Ilimitado" },
  };

  const pl = planosLabels[idioma];

  const botaoAbas = (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "empresa", label: t.empresa.abaEmpresa },
        { key: "perfil", label: t.empresa.abaPerfil },
        { key: "notificacoes", label: t.empresa.abaNotificacoes },
        { key: "plano", label: t.empresa.abaPlano },
      ].map((a) => (
        <button key={a.key} onClick={() => setAba(a.key)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: aba === a.key ? "rgba(59,111,212,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.3)" : "rgba(59,111,212,0.15)"}` }}>
          {a.label}
        </button>
      ))}
    </div>
  );

  return (
    <ModuloLayout
      titulo={t.empresa.titulo}
      subtitulo={t.empresa.subtitulo}
      botaoExtra={botaoAbas}
    >
      {/* Aba Empresa */}
      {aba === "empresa" && (
        <div className="rounded-2xl p-6 md:p-8 w-full md:max-w-2xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: "#c8d8f0" }}>{t.empresa.dadosEmpresa}</h3>
          <div className="space-y-4">
            {camposEmpresa[idioma].map((campo) => (
              <div key={campo.label}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
            ))}
            <button onClick={salvar} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 mt-4"
              style={{ background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none" }}>
              {salvo ? t.geral.salvo : t.geral.salvar}
            </button>
          </div>
        </div>
      )}

      {/* Aba Perfil */}
      {aba === "perfil" && (
        <div className="rounded-2xl p-6 md:p-8 w-full md:max-w-2xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>E</div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>Elias Tavares</h3>
              <p className="text-sm" style={{ color: "#3a5a8a" }}>CEO / {idioma === "pt" ? "Fundador" : idioma === "en" ? "Founder" : "Fundador"}</p>
            </div>
          </div>
          <div className="space-y-4">
            {camposPerfil[idioma].map((campo) => (
              <div key={campo.label}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                <input defaultValue={campo.value} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
            ))}
            <button onClick={salvar} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 mt-4"
              style={{ background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.3)" : "none" }}>
              {salvo ? t.geral.salvo : t.geral.salvar}
            </button>
          </div>
        </div>
      )}

      {/* Aba Notificações */}
      {aba === "notificacoes" && (
        <div className="rounded-2xl p-6 md:p-8 w-full md:max-w-2xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: "#c8d8f0" }}>{t.empresa.abaNotificacoes}</h3>
          <div className="space-y-4">
            {notificacoesLabels[idioma].map((n) => (
              <div key={n.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,111,212,0.1)" }}>
                <span className="text-sm" style={{ color: "#c8d8f0" }}>{n.label}</span>
                <button
                  onClick={() => setNotificacoes({ ...notificacoes, [n.key]: !notificacoes[n.key as keyof typeof notificacoes] })}
                  className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: notificacoes[n.key as keyof typeof notificacoes] ? "rgba(59,111,212,0.5)" : "rgba(255,255,255,0.1)" }}>
                  <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
                    style={{ background: notificacoes[n.key as keyof typeof notificacoes] ? "#6ab0ff" : "#3a5a8a", left: notificacoes[n.key as keyof typeof notificacoes] ? "26px" : "2px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba Plano */}
      {aba === "plano" && (
        <div className="w-full md:max-w-3xl">
          <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: "rgba(59,111,212,0.1)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#6ab0ff" }}>{t.empresa.planoAtual}</span>
                <h3 className="text-2xl font-black mt-1" style={{ color: "#c8d8f0" }}>Professional</h3>
                <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>5 {pl.usuarios} • {pl.todos} • IA</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: "#6ab0ff" }}>R$ 197</p>
                <p className="text-sm" style={{ color: "#3a5a8a" }}>{pl.mes}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { nome: "Starter", preco: "R$ 97", desc: `1 ${pl.usuarios} • ${pl.modulos}`, cor: "#3a5a8a" },
              { nome: "Professional", preco: "R$ 197", desc: `5 ${pl.usuarios} • ${pl.todos}`, cor: "#6ab0ff", atual: true },
              { nome: "Enterprise", preco: "R$ 497", desc: `${pl.ilimitado} • ${pl.ia}`, cor: "#a78bfa" },
            ].map((plano) => (
              <div key={plano.nome} className="rounded-2xl p-5 md:p-6" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${plano.cor}33` }}>
                <h4 className="font-bold mb-1" style={{ color: plano.cor }}>{plano.nome}</h4>
                <p className="text-2xl font-black mb-2" style={{ color: "#c8d8f0" }}>{plano.preco}<span className="text-sm font-normal" style={{ color: "#3a5a8a" }}>{pl.mes}</span></p>
                <p className="text-xs mb-4" style={{ color: "#3a5a8a" }}>{plano.desc}</p>
                <button className="w-full py-2 rounded-xl text-sm font-bold"
                  style={{ background: plano.atual ? "rgba(59,111,212,0.2)" : "transparent", color: plano.atual ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${plano.cor}33` }}>
                  {plano.atual ? pl.atual : pl.upgrade}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}