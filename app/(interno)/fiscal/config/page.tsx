'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Save, Lock, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../../../../lib/empresaHelpers'
import {
  obterConfigFiscal, salvarConfigFiscal, atividadeFiscalParaPresuncao,
  type AtividadeFiscalConfig, type ConfigFiscal,
} from '../../../../lib/fiscalHelpers'
import { carregarDadosFiscais, calcularImpostoRegime } from '../../../../lib/iaTributariaHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const PAPEIS_CONFIG = ['dono', 'admin']

const ATIVIDADES: { key: AtividadeFiscalConfig; label: Record<Idioma3, string> }[] = [
  { key: 'comercio', label: { pt: 'Comércio', en: 'Trade', es: 'Comercio' } },
  { key: 'industria', label: { pt: 'Indústria', en: 'Industry', es: 'Industria' } },
  { key: 'servico', label: { pt: 'Serviço', en: 'Services', es: 'Servicio' } },
  { key: 'misto', label: { pt: 'Misto', en: 'Mixed', es: 'Mixto' } },
]

export default function FiscalConfigPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [podeEditar, setPodeEditar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)

  const [config, setConfig] = useState<ConfigFiscal | null>(null)
  const [atividade, setAtividade] = useState<AtividadeFiscalConfig | ''>('')
  const [aliquotaIss, setAliquotaIss] = useState('')

  const [receitaBruta12m, setReceitaBruta12m] = useState(0)
  const [receitaBrutaMensal, setReceitaBrutaMensal] = useState(0)

  function mostrarToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4500)
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id || null
      setUserId(uid)
      if (!empId) { setLoading(false); return }

      const [papel, cfg, dadosFiscais] = await Promise.all([
        obterMeuPapel(empId), obterConfigFiscal(empId), uid ? carregarDadosFiscais(uid, empId) : Promise.resolve(null),
      ])
      setPodeEditar(papel != null && PAPEIS_CONFIG.includes(papel))
      setConfig(cfg)
      setAtividade(cfg?.atividade_fiscal || '')
      setAliquotaIss(cfg?.aliquota_iss_pct != null ? String(cfg.aliquota_iss_pct) : '')
      if (dadosFiscais) {
        setReceitaBruta12m(dadosFiscais.receita_bruta_12m)
        setReceitaBrutaMensal(dadosFiscais.receita_bruta_mensal)
      }
      setLoading(false)
    })()
  }, [])

  async function salvar() {
    if (!empresaId || !userId || !atividade) return
    setSalvando(true)
    const aliq = aliquotaIss.trim() === '' ? null : Number(aliquotaIss.replace(',', '.'))
    const { erro, bloqueadoPorRls } = await salvarConfigFiscal(empresaId, userId, { atividade_fiscal: atividade, aliquota_iss_pct: aliq != null && !isNaN(aliq) ? aliq : null })
    setSalvando(false)
    if (erro) {
      mostrarToast(bloqueadoPorRls
        ? L('Apenas o dono da empresa pode alterar este cadastro.', 'Only the company owner can change this record.', 'Solo el dueño de la empresa puede cambiar este registro.')
        : L('Não foi possível salvar — tente novamente.', 'Could not save — try again.', 'No se pudo guardar — intente de nuevo.'))
      return
    }
    setConfig((prev) => prev ? { ...prev, atividade_fiscal: atividade, aliquota_iss_pct: aliq } : prev)
    mostrarToast(L('Atividade fiscal salva.', 'Tax activity saved.', 'Actividad fiscal guardada.'), 'ok')
  }

  const regime = (config?.regime_tributario || '').toLowerCase()
  const regimeUsaAtividade = regime.includes('presumido')
  const mostraIss = atividade === 'servico' || atividade === 'misto'

  const impostoComDefault = regimeUsaAtividade && receitaBrutaMensal > 0
    ? calcularImpostoRegime(config?.regime_tributario || '', receitaBruta12m, receitaBrutaMensal)
    : null
  const impostoComAtividade = regimeUsaAtividade && receitaBrutaMensal > 0 && atividade
    ? calcularImpostoRegime(config?.regime_tributario || '', receitaBruta12m, receitaBrutaMensal, atividadeFiscalParaPresuncao(atividade), mostraIss && aliquotaIss ? Number(aliquotaIss.replace(',', '.')) : undefined)
    : null

  return (
    <ModuloLayout
      titulo={L('Atividade Fiscal', 'Tax Activity', 'Actividad Fiscal')}
      subtitulo={L('Define a atividade e a alíquota de ISS da empresa — liga o cálculo correto de Lucro Presumido.', "Sets the company's activity and ISS rate — enables the correct Presumed Profit calculation.", 'Define la actividad y la alícuota de ISS de la empresa — activa el cálculo correcto de Lucro Presumido.')}
      botaoExtra={
        <button onClick={() => router.push('/fiscal')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          <ArrowLeft size={15} />{L('Voltar ao Fiscal', 'Back to Tax', 'Volver a Fiscal')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-6">
          {!podeEditar && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold w-fit" style={{ background: `${CINZA}15`, color: CINZA }}>
              <Lock size={14} />
              {L('Só dono ou admin da empresa pode editar — você está vendo em modo leitura.', 'Only the company owner or admin can edit — you are viewing in read-only mode.', 'Solo el dueño o admin de la empresa puede editar — estás viendo en modo lectura.')}
            </div>
          )}

          {!config?.regime_tributario && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ background: `${AMARELO}12`, color: AMARELO, border: `1px solid ${AMARELO}35` }}>
              <AlertTriangle size={14} />
              {L('Regime tributário ainda não definido — defina primeiro em Empresa antes da atividade fiscal.', 'Tax regime not defined yet — set it under Company first, before the tax activity.', 'Régimen tributario aún no definido — defínalo primero en Empresa antes de la actividad fiscal.')}
            </div>
          )}

          <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(106,176,255,0.16)' }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: TITULO }}>{L('Regime e CNAE', 'Regime and CNAE', 'Régimen y CNAE')}</h3>
            <p className="text-xs mb-4" style={{ color: CINZA }}>
              {L('Só leitura aqui — edite em Empresa.', 'Read-only here — edit under Company.', 'Solo lectura aquí — edite en Empresa.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Regime Tributário', 'Tax Regime', 'Régimen Tributario')}</p>
                <p style={{ color: TEXTO }}>{config?.regime_tributario || L('Não definido', 'Not defined', 'No definido')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('CNAE Principal', 'Main CNAE', 'CNAE Principal')}</p>
                <p style={{ color: TEXTO }}>{config?.cnae_principal || L('Não definido', 'Not defined', 'No definido')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(106,176,255,0.16)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: TITULO }}>{L('Atividade Fiscal', 'Tax Activity', 'Actividad Fiscal')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {ATIVIDADES.map((a) => (
                <button key={a.key} disabled={!podeEditar} onClick={() => setAtividade(a.key)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  style={{
                    background: atividade === a.key ? `${AZULC}25` : 'rgba(255,255,255,0.06)',
                    color: atividade === a.key ? AZULC : TEXTO,
                    border: `1px solid ${atividade === a.key ? AZULC : 'transparent'}40`,
                  }}>
                  {a.label[lang]}
                </button>
              ))}
            </div>

            {mostraIss && (
              <div className="max-w-xs mb-2">
                <label className="text-xs font-semibold block mb-1" style={{ color: CINZA }}>
                  {L('Alíquota de ISS do seu município (%)', 'ISS rate for your municipality (%)', 'Alícuota de ISS de su municipio (%)')}
                </label>
                <input type="text" inputMode="decimal" disabled={!podeEditar} value={aliquotaIss}
                  onChange={(e) => setAliquotaIss(e.target.value)} placeholder="5"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                  style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                <p className="text-[10px] mt-1" style={{ color: CINZA }}>
                  {L('Varia por município (2% a 5%). Deixe em branco pra usar 5% (default).', 'Varies by municipality (2% to 5%). Leave blank to use 5% (default).', 'Varía por municipio (2% a 5%). Deje en blanco para usar 5% (por defecto).')}
                </p>
              </div>
            )}

            {regimeUsaAtividade && impostoComDefault != null && impostoComAtividade != null && (
              <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Sem atividade definida (default)', 'Without activity defined (default)', 'Sin actividad definida (por defecto)')}</p>
                  <p className="text-lg font-black" style={{ color: CINZA }}>R$ {impostoComDefault.toFixed(2)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: `${VERDE}12`, border: `1px solid ${VERDE}30` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: VERDE }}>{L('Com a atividade que você escolheu', 'With the activity you chose', 'Con la actividad que eligió')}</p>
                  <p className="text-lg font-black" style={{ color: VERDE }}>R$ {impostoComAtividade.toFixed(2)}</p>
                </div>
              </div>
            )}
            {!regimeUsaAtividade && config?.regime_tributario && (
              <p className="text-[11px] mt-3" style={{ color: CINZA }}>
                {L(`Seu regime atual (${config.regime_tributario}) não usa a atividade fiscal no cálculo — fica pronta pra quando você mudar de regime ou simular Lucro Presumido em IA Tributária.`,
                  `Your current regime (${config.regime_tributario}) doesn't use tax activity in its calculation — it's ready for when you switch regimes or simulate Presumed Profit under Tax AI.`,
                  `Su régimen actual (${config.regime_tributario}) no usa la actividad fiscal en el cálculo — queda lista para cuando cambie de régimen o simule Lucro Presumido en IA Tributaria.`)}
              </p>
            )}

            {podeEditar && (
              <button onClick={salvar} disabled={salvando || !atividade}
                className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
                <Save size={16} />{salvando ? L('Salvando...', 'Saving...', 'Guardando...') : L('Salvar', 'Save', 'Guardar')}
              </button>
            )}
          </div>

          {toast && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
              style={{ background: toast.tipo === 'ok' ? `${VERDE}20` : `${VERMELHO}20`, color: toast.tipo === 'ok' ? VERDE : VERMELHO, border: `1px solid ${toast.tipo === 'ok' ? VERDE : VERMELHO}40` }}>
              {toast.msg}
            </div>
          )}
        </div>
      )}
    </ModuloLayout>
  )
}
