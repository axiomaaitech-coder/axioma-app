'use client'
import { useEffect, useState } from 'react'
import { Save, Lock } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../../../../lib/empresaHelpers'
import {
  obterConfigTesouraria, salvarConfigTesouraria, listarContasTesouraria, salvarBancoNomeConta,
  type ContaTesouraria,
} from '../../../../lib/tesourariaHelpers'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const PAPEIS_CONFIG = ['dono', 'admin']

const LABEL_TIPO_LIQUIDEZ: Record<string, { pt: string; en: string; es: string }> = {
  disponivel: { pt: 'Disponível', en: 'Available', es: 'Disponible' },
  aplicado: { pt: 'Aplicado', en: 'Invested', es: 'Aplicado' },
  restrito: { pt: 'Restrito', en: 'Restricted', es: 'Restringido' },
}

export default function TesourariaConfigPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [podeEditar, setPodeEditar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)

  const [reservaMinima, setReservaMinima] = useState('0')
  const [diasAlerta, setDiasAlerta] = useState('30')
  const [contas, setContas] = useState<ContaTesouraria[]>([])
  const [bancoEditando, setBancoEditando] = useState<Record<string, string>>({})
  const [salvandoConta, setSalvandoConta] = useState<string | null>(null)

  function mostrarToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (!empId) { setLoading(false); return }

      const [papel, config, listaContas] = await Promise.all([
        obterMeuPapel(empId), obterConfigTesouraria(empId), listarContasTesouraria(empId),
      ])
      setPodeEditar(papel != null && PAPEIS_CONFIG.includes(papel))
      if (config) {
        setReservaMinima(String(config.reserva_minima))
        setDiasAlerta(String(config.dias_alerta_ruptura))
      }
      setContas(listaContas)
      setBancoEditando(Object.fromEntries(listaContas.map((c) => [c.id, c.banco_nome || ''])))
      setLoading(false)
    })()
  }, [])

  async function salvarConfig() {
    if (!empresaId) return
    const reserva = Number(reservaMinima.replace(',', '.')) || 0
    const dias = Math.max(1, Math.round(Number(diasAlerta) || 30))
    setSalvando(true)
    const r = await salvarConfigTesouraria(empresaId, reserva, dias)
    setSalvando(false)
    if (r.ok) mostrarToast(L('Configuração salva.', 'Settings saved.', 'Configuración guardada.'), 'ok')
    else mostrarToast(L('Não foi possível salvar — tente novamente.', 'Could not save — try again.', 'No se pudo guardar — intente de nuevo.'))
  }

  async function salvarBanco(conta: ContaTesouraria) {
    if (!empresaId) return
    setSalvandoConta(conta.id)
    const r = await salvarBancoNomeConta(conta.id, empresaId, bancoEditando[conta.id] || '')
    setSalvandoConta(null)
    if (r.ok) {
      setContas((prev) => prev.map((c) => (c.id === conta.id ? { ...c, banco_nome: bancoEditando[conta.id] || null } : c)))
      mostrarToast(L('Nome atualizado.', 'Name updated.', 'Nombre actualizado.'), 'ok')
    } else {
      mostrarToast(L('Não foi possível salvar — tente novamente.', 'Could not save — try again.', 'No se pudo guardar — intente de nuevo.'))
    }
  }

  return (
    <ModuloLayout
      titulo={L('Configuração da Tesouraria', 'Treasury Settings', 'Configuración de Tesorería')}
      subtitulo={L('Reserva mínima, alerta de ruptura e nome amigável de cada conta', 'Minimum reserve, rupture alert, and a friendly name for each account', 'Reserva mínima, alerta de ruptura y nombre amigable de cada cuenta')}
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

          <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(106,176,255,0.16)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: TITULO }}>{L('Regras Gerais', 'General Rules', 'Reglas Generales')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: CINZA }}>
                  {L('Reserva mínima (R$)', 'Minimum reserve (R$)', 'Reserva mínima (R$)')}
                </label>
                <input type="text" inputMode="decimal" disabled={!podeEditar} value={reservaMinima}
                  onChange={(e) => setReservaMinima(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                  style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                <p className="text-[10px] mt-1" style={{ color: CINZA }}>
                  {L('Caixa que você quer manter sempre intocado — usado no Liquidity Score e no Radar de ruptura.', 'Cash you always want to keep untouched — used in the Liquidity Score and the rupture radar.', 'Caja que quieres mantener siempre intocada — usada en el Liquidity Score y el radar de ruptura.')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: CINZA }}>
                  {L('Dias de alerta de ruptura', 'Rupture alert days', 'Días de alerta de ruptura')}
                </label>
                <input type="number" min={1} disabled={!podeEditar} value={diasAlerta}
                  onChange={(e) => setDiasAlerta(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                  style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
              </div>
            </div>
            {podeEditar && (
              <button onClick={salvarConfig} disabled={salvando}
                className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
                <Save size={16} />{salvando ? L('Salvando...', 'Saving...', 'Guardando...') : L('Salvar', 'Save', 'Guardar')}
              </button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Contas de Tesouraria', 'Treasury Accounts', 'Cuentas de Tesorería')}</h3>
            <div className="space-y-2">
              {contas.length === 0 && (
                <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma conta de tesouraria encontrada.', 'No treasury accounts found.', 'Ninguna cuenta de tesorería encontrada.')}</p>
              )}
              {contas.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="min-w-[140px]">
                    <p className="text-xs font-bold" style={{ color: TEXTO }}>{c.conta_codigo} — {c.conta_nome}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: `${AZULC}15`, color: AZULC }}>
                      {LABEL_TIPO_LIQUIDEZ[c.tipo_liquidez][lang]}
                    </span>
                  </div>
                  <input type="text" disabled={!podeEditar} value={bancoEditando[c.id] ?? ''}
                    placeholder={L('Nome amigável (ex: Itaú CC)', 'Friendly name (e.g. Chase Checking)', 'Nombre amigable (ej: BBVA CC)')}
                    onChange={(e) => setBancoEditando((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-xs focus:outline-none disabled:opacity-50"
                    style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                  {podeEditar && (
                    <button onClick={() => salvarBanco(c)} disabled={salvandoConta === c.id}
                      className="text-[10px] font-bold px-3 py-2 rounded-lg whitespace-nowrap disabled:opacity-60"
                      style={{ background: 'rgba(59,111,212,0.14)', color: AZULC }}>
                      {salvandoConta === c.id ? L('Salvando...', 'Saving...', 'Guardando...') : L('Salvar', 'Save', 'Guardar')}
                    </button>
                  )}
                </div>
              ))}
            </div>
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
