'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import { Check, X } from 'lucide-react'

export default function Planos() {
  const router = useRouter()
  const { idioma } = useLanguage()
  const [anual, setAnual] = useState(false)

  const recursos = {
    receitas: idioma === 'pt' ? 'Receitas' : idioma === 'en' ? 'Revenue' : 'Ingresos',
    custosFixos: idioma === 'pt' ? 'Custos Fixos' : idioma === 'en' ? 'Fixed Costs' : 'Costos Fijos',
    custosVariaveis: idioma === 'pt' ? 'Custos Variáveis' : idioma === 'en' ? 'Variable Costs' : 'Costos Variables',
    fornecedores: idioma === 'pt' ? 'Fornecedores' : idioma === 'en' ? 'Suppliers' : 'Proveedores',
    endividamento: idioma === 'pt' ? 'Endividamento' : idioma === 'en' ? 'Debt Control' : 'Endeudamiento',
    fluxoCaixa: idioma === 'pt' ? 'Fluxo de Caixa' : idioma === 'en' ? 'Cash Flow' : 'Flujo de Caja',
    dre: idioma === 'pt' ? 'DRE' : idioma === 'en' ? 'Income Statement' : 'Estado de Resultados',
    clientes: idioma === 'pt' ? 'Clientes' : idioma === 'en' ? 'Clients' : 'Clientes',
    centrosCusto: idioma === 'pt' ? 'Centros de Custo' : idioma === 'en' ? 'Cost Centers' : 'Centros de Costo',
    importar: idioma === 'pt' ? 'Importar Documentos' : idioma === 'en' ? 'Import Documents' : 'Importar Documentos',
    empresa: idioma === 'pt' ? 'Empresa' : idioma === 'en' ? 'Company' : 'Empresa',
    relatorios: idioma === 'pt' ? 'Relatórios' : idioma === 'en' ? 'Reports' : 'Informes',
    iaFinanceira: idioma === 'pt' ? 'IA Financeira' : idioma === 'en' ? 'Financial AI' : 'IA Financiera',
    iaTributaria: idioma === 'pt' ? 'IA Tributária' : idioma === 'en' ? 'Tax AI' : 'IA Tributaria',
  }

  const planos = [
    {
      id: 'starter',
      nome: 'Starter',
      mensal: 49,
      anual: 490,
      usuarios: 1,
      cor: '#3b6fd4',
      destaque: false,
      recursos: [
        { label: recursos.receitas, ok: true },
        { label: recursos.custosFixos, ok: true },
        { label: recursos.custosVariaveis, ok: true },
        { label: recursos.fornecedores, ok: true },
        { label: recursos.endividamento, ok: true },
        { label: recursos.fluxoCaixa, ok: true },
        { label: recursos.dre, ok: true },
        { label: recursos.clientes, ok: true },
        { label: recursos.centrosCusto, ok: true },
        { label: recursos.importar, ok: true },
        { label: recursos.empresa, ok: true },
        { label: recursos.relatorios, ok: true },
        { label: recursos.iaFinanceira, ok: false },
        { label: recursos.iaTributaria, ok: false },
      ]
    },
    {
      id: 'pro',
      nome: 'Pro',
      mensal: 97,
      anual: 970,
      usuarios: 4,
      cor: '#f59e0b',
      destaque: true,
      recursos: [
        { label: recursos.receitas, ok: true },
        { label: recursos.custosFixos, ok: true },
        { label: recursos.custosVariaveis, ok: true },
        { label: recursos.fornecedores, ok: true },
        { label: recursos.endividamento, ok: true },
        { label: recursos.fluxoCaixa, ok: true },
        { label: recursos.dre, ok: true },
        { label: recursos.clientes, ok: true },
        { label: recursos.centrosCusto, ok: true },
        { label: recursos.importar, ok: true },
        { label: recursos.empresa, ok: true },
        { label: recursos.relatorios, ok: true },
        { label: recursos.iaFinanceira, ok: true },
        { label: recursos.iaTributaria, ok: false },
      ]
    },
    {
      id: 'business',
      nome: 'Business',
      mensal: 197,
      anual: 1970,
      usuarios: 10,
      cor: '#34d399',
      destaque: false,
      recursos: [
        { label: recursos.receitas, ok: true },
        { label: recursos.custosFixos, ok: true },
        { label: recursos.custosVariaveis, ok: true },
        { label: recursos.fornecedores, ok: true },
        { label: recursos.endividamento, ok: true },
        { label: recursos.fluxoCaixa, ok: true },
        { label: recursos.dre, ok: true },
        { label: recursos.clientes, ok: true },
        { label: recursos.centrosCusto, ok: true },
        { label: recursos.importar, ok: true },
        { label: recursos.empresa, ok: true },
        { label: recursos.relatorios, ok: true },
        { label: recursos.iaFinanceira, ok: true },
        { label: recursos.iaTributaria, ok: true },
      ]
    },
  ]

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>

      <div className="flex flex-col items-center mb-12">
        <div style={{ filter: "drop-shadow(0 0 20px rgba(106,176,255,0.5))" }} className="mb-6">
          <Image src="/logo-aitech.png" alt="Axioma" width={70} height={70} className="object-contain" />
        </div>
        <h1 className="text-4xl font-black mb-3 text-center" style={{ color: "#c8d8f0" }}>
          {idioma === 'pt' ? 'Escolha seu plano' : idioma === 'en' ? 'Choose your plan' : 'Elige tu plan'}
        </h1>
        <p className="text-sm mb-8 text-center" style={{ color: "#3a6090" }}>
          {idioma === 'pt' ? 'Comece agora e escale conforme seu negócio cresce' : idioma === 'en' ? 'Start now and scale as your business grows' : 'Empieza ahora y escala según crece tu negocio'}
        </p>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold" style={{ color: anual ? "#3a6090" : "#c8d8f0" }}>
            {idioma === 'pt' ? 'Mensal' : idioma === 'en' ? 'Monthly' : 'Mensual'}
          </span>
          <div
            className="w-14 h-7 rounded-full cursor-pointer relative transition-all"
            style={{ background: anual ? "#3b6fd4" : "rgba(59,111,212,0.2)", border: "1px solid rgba(59,111,212,0.3)" }}
            onClick={() => setAnual(!anual)}
          >
            <div
              className="absolute top-1 w-5 h-5 rounded-full transition-all"
              style={{ background: "#fff", left: anual ? "calc(100% - 24px)" : "4px" }}
            />
          </div>
          <span className="text-sm font-semibold" style={{ color: anual ? "#c8d8f0" : "#3a6090" }}>
            {idioma === 'pt' ? 'Anual' : idioma === 'en' ? 'Annual' : 'Anual'}
          </span>
          {anual && (
            <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
              🎉 {idioma === 'pt' ? '2 meses grátis' : idioma === 'en' ? '2 months free' : '2 meses gratis'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className="rounded-3xl p-8 flex flex-col relative"
            style={{
              background: plano.destaque ? `linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(10,22,40,0.95) 100%)` : "rgba(10,22,40,0.8)",
              border: plano.destaque ? `2px solid ${plano.cor}` : "1px solid rgba(59,111,212,0.15)",
              boxShadow: plano.destaque ? `0 0 40px ${plano.cor}25` : "none",
            }}
          >
            {plano.destaque && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="text-xs font-black px-4 py-2 rounded-full" style={{ background: `linear-gradient(135deg, #ca8a04, #ea580c)`, color: "#fff" }}>
                  ⭐ {idioma === 'pt' ? 'Mais popular' : idioma === 'en' ? 'Most popular' : 'Más popular'}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-black mb-1" style={{ color: plano.cor }}>{plano.nome}</h2>
              <p className="text-xs mb-4" style={{ color: "#3a6090" }}>
                {idioma === 'pt' ? `até ${plano.usuarios} usuário(s)` : idioma === 'en' ? `up to ${plano.usuarios} user(s)` : `hasta ${plano.usuarios} usuario(s)`}
              </p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black" style={{ color: "#c8d8f0" }}>
                  R$ {anual ? (plano.anual / 12).toFixed(0) : plano.mensal}
                </span>
                <span className="text-sm mb-1" style={{ color: "#3a6090" }}>
                  {idioma === 'pt' ? '/mês' : idioma === 'en' ? '/mo' : '/mes'}
                </span>
              </div>
              {anual && (
                <p className="text-xs mt-1" style={{ color: "#34d399" }}>
                  R$ {plano.anual} {idioma === 'pt' ? '/ano' : idioma === 'en' ? '/year' : '/año'}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-3 mb-8">
              {plano.recursos.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  {r.ok
                    ? <Check size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                    : <X size={16} style={{ color: "#f87171", flexShrink: 0 }} />
                  }
                  <span className="text-sm" style={{ color: r.ok ? "#c8d8f0" : "#3a6090" }}>{r.label}</span>
                  {!r.ok && (r.label.includes('IA') || r.label.includes('AI')) && (
                    <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                      🔒
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105"
              style={{
                background: plano.destaque ? `linear-gradient(135deg, #ca8a04, #ea580c)` : `linear-gradient(135deg, #1a3a8f, #2a5fd4)`,
                color: "#fff",
                boxShadow: plano.destaque ? "0 4px 30px rgba(234,179,8,0.3)" : "0 4px 30px rgba(42,95,212,0.3)",
              }}
            >
              {idioma === 'pt' ? 'Assinar agora' : idioma === 'en' ? 'Subscribe now' : 'Suscribirse ahora'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-12" style={{ color: "#3a6090" }}>
        {idioma === 'pt' ? 'Cancele quando quiser. Sem fidelidade.' : idioma === 'en' ? 'Cancel anytime. No commitment.' : 'Cancela cuando quieras. Sin fidelidad.'}
      </p>

    </div>
  )
}