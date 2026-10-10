'use client'
// 🦅 PAGAR O DAS POR DENTRO DO AXIOMA (MEI) — 2026-10-10
// 1) gerar a guia no PGMEI (link + CNPJ pra copiar)  2) enviar o PDF/foto: a IA lê e a
// PESSOA confere (códigos conferidos por regra)  3) pagar: copiar Pix / código de barras
// no app do banco, ou "Pagar com Pix pelo Axioma" (Pluggy, quando ligado) → "Já paguei"
// dá a baixa pelo motor de obrigações (guia com vários meses é dividida do mais antigo).
// ME/EPP (Simples): mesma tela com `simples` — guia do PGDAS-D ligada à conta a pagar do DAS,
// e "Já paguei" dá a baixa pela própria Contas a Pagar (multa/juros da guia viram encargos).
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import { Copy, ExternalLink, Upload, Check, AlertTriangle } from 'lucide-react'
import Modal from '../Modal'
import { CanvasBox } from '../CanvasBox'
import { hojeISO } from '../../lib/datas'
import { lerGuiaComIA, conferirGuia, iniciarPixAxioma, PIX_AXIOMA_ATIVO, URL_PGMEI, URL_PGDASD, soDigitos, type GuiaLida } from '../../lib/guiaDas'
import { registrarPagamentoDAS, planejarAlocacao, type MesDAS, type MetodoPagamento } from '../../lib/meiObrigacoesMotor'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
type Lang = 'pt' | 'en' | 'es'
const MENTA = '#0f7a5a', NAVY = '#101b3d'

export default function PagarGuiaDAS({ aberto, onFechar, empresaId, cnpjEmpresa, meses, competenciaInicial, lang, temaClaro, cartaoTema, onPago, showToast, simples }: {
  aberto: boolean; onFechar: () => void; empresaId: string; cnpjEmpresa: string | null; meses: MesDAS[]; competenciaInicial: string | null
  simples?: { contaPagarId: string; registrar: (valor: number, data: string, metodo: MetodoPagamento) => Promise<boolean> }
  lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; onPago: () => void; showToast: (m: string, t?: 'erro' | 'ok') => void
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const fmt = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const TEXTO = temaClaro ? '#101b3d' : '#e5edf7', SEC = temaClaro ? '#374151' : '#a3b1c2'
  const CAIXA = { background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)', border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : 'rgba(46,204,155,0.22)'}` }
  const CAMPO = { background: temaClaro ? '#ffffff' : 'rgba(255,255,255,0.06)', border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.2)' : 'rgba(46,204,155,0.3)'}`, color: TEXTO }
  const portal = simples ? URL_PGDASD : URL_PGMEI
  const btn = (cor: string) => ({ className: 'px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50', style: { background: cor, color: '#fff' } })

  const [lendo, setLendo] = useState(false)
  const [guia, setGuia] = useState<GuiaLida | null>(null)
  const [guiaId, setGuiaId] = useState<string | null>(null)
  const [dataPg, setDataPg] = useState(hojeISO())
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix')
  const [salvando, setSalvando] = useState(false)
  const conferencia = guia ? conferirGuia(guia, cnpjEmpresa) : null
  const AVISO: Record<string, string> = {
    nao_e_das: L('Este arquivo não parece um DAS. Confira se enviou a guia certa.', 'This file does not look like a DAS. Check you sent the right slip.', 'Este archivo no parece un DAS. Verifique la guía.'),
    sem_valor: L('Não consegui ler o valor.', 'Could not read the amount.', 'No pude leer el valor.'),
    competencia: L('Não consegui ler o(s) mês(es) da guia.', 'Could not read the period(s).', 'No pude leer el/los mes(es).'),
    pix_invalido: L('O código Pix lido não confere (dígito de controle errado) — não use; pague pelo código de barras ou pela imagem do QR na guia.', 'The Pix code does not check out — do not use it; pay with the barcode or the QR image.', 'El código Pix no confiere — no lo use; pague con el código de barras o el QR.'),
    codigo_barras_invalido: L('O código de barras lido não confere — copie direto da guia.', 'The barcode does not check out — copy it from the slip.', 'El código de barras no confiere — cópielo de la guía.'),
    sem_codigo: L('Não achei código Pix nem código de barras.', 'No Pix code or barcode found.', 'No encontré código Pix ni de barras.'),
    cnpj_diferente: L('O CNPJ da guia é diferente do CNPJ da empresa. Confira antes de pagar.', 'The slip CNPJ differs from the company CNPJ. Check before paying.', 'El CNPJ de la guía es diferente del de la empresa. Verifique antes de pagar.'),
  }
  const pixOk = !!guia?.pix_copia_cola && !conferencia?.avisos.includes('pix_invalido')
  const barrasOk = !!guia?.codigo_barras && !conferencia?.avisos.includes('codigo_barras_invalido')

  function fechar() { setGuia(null); setGuiaId(null); setLendo(false); onFechar() }
  const copiar = async (t: string, o: string) => { try { await navigator.clipboard.writeText(t); showToast(L(`${o} copiado — cole no app do seu banco.`, `${o} copied — paste it in your bank app.`, `${o} copiado — péguelo en la app de su banco.`), 'ok') } catch { showToast(L('Não consegui copiar — selecione e copie manualmente.', 'Could not copy — select and copy manually.', 'No pude copiar — seleccione y copie manualmente.')) } }

  async function enviarArquivo(f: File) {
    setLendo(true)
    const r = await lerGuiaComIA(f, empresaId)
    setLendo(false)
    if (!r.guia) { showToast(L('Não consegui ler a guia. Tente uma foto mais nítida ou o PDF original.', 'Could not read the slip. Try a sharper photo or the original PDF.', 'No pude leer la guía. Intente una foto más nítida o el PDF original.')); return }
    setGuia({ ...r.guia, competencias: r.guia.competencias.length ? r.guia.competencias : competenciaInicial ? [competenciaInicial] : [] })
  }

  // Grava a guia (uma vez por nº de documento — enviar de novo reaproveita).
  async function garantirGuia(): Promise<string | null> {
    if (guiaId) return guiaId
    if (!guia || !(Number(guia.valor_total) > 0)) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (guia.numero_documento) {
      const { data: ja } = await supabase.from('guias_arrecadacao').select('id').eq('empresa_id', empresaId).eq('numero_documento', guia.numero_documento).maybeSingle()
      if (ja) { setGuiaId(ja.id); return ja.id }
    }
    const { data, error } = await supabase.from('guias_arrecadacao').insert({
      empresa_id: empresaId, tipo: simples ? 'DAS_SIMPLES' : 'DAS_MEI', conta_pagar_id: simples?.contaPagarId ?? null, numero_documento: guia.numero_documento, codigo_barras: barrasOk ? soDigitos(guia.codigo_barras) : null,
      pix_copia_cola: pixOk ? guia.pix_copia_cola : null, valor_total: guia.valor_total, data_vencimento: guia.data_vencimento,
      competencias: guia.competencias, origem: 'pdf_ia', cnpj: guia.cnpj ? soDigitos(guia.cnpj) : null, usuario_id: user?.id ?? null,
    }).select('id').single()
    if (error || !data) { Sentry.captureException(new Error(`[pagar DAS] gravar guia: ${error?.message || '0 linhas'}`)); showToast(L('Não consegui guardar a guia. Tente de novo.', 'Could not save the slip. Try again.', 'No pude guardar la guía. Intente de nuevo.')); return null }
    setGuiaId(data.id); return data.id
  }

  async function pagarPixAxioma() {
    const id = await garantirGuia(); if (!id) return
    const r = await iniciarPixAxioma(id)
    if (r.url) { window.location.href = r.url; return }
    showToast(r.erro === 'desligado' ? L('O Pix pelo Axioma ainda está sendo ativado. Use "Copiar Pix" por enquanto.', 'Pix through Axioma is still being activated. Use "Copy Pix" for now.', 'El Pix por Axioma aún se está activando. Use "Copiar Pix" por ahora.') : L('Não consegui iniciar o Pix agora. Tente de novo ou use "Copiar Pix".', 'Could not start the Pix now. Try again or use "Copy Pix".', 'No pude iniciar el Pix ahora. Intente de nuevo o use "Copiar Pix".'))
  }

  async function jaPaguei() {
    if (!guia || !conferencia) return
    if (dataPg > hojeISO()) { showToast(L('A data do pagamento não pode ser no futuro.', 'The payment date cannot be in the future.', 'La fecha del pago no puede ser futura.')); return }
    if (simples) {
      setSalvando(true)
      const id = await garantirGuia()
      const ok = id ? await simples.registrar(Number(guia.valor_total), dataPg, metodo) : false
      if (ok && id) {
        const { error } = await supabase.from('guias_arrecadacao').update({ status: 'paga' }).eq('id', id).eq('empresa_id', empresaId)
        if (error) Sentry.captureException(new Error(`[pagar DAS Simples] marcar guia paga: ${error.message}`))
      }
      setSalvando(false)
      if (!ok) return // a Contas a Pagar já mostrou o motivo
      showToast(L('Pago! A baixa já está em Contas a Pagar, no Fluxo de Caixa e na Contabilidade.', 'Paid! Recorded in Payables, Cash Flow and Accounting.', '¡Pagado! Registrado en Cuentas a Pagar, Flujo de Caja y Contabilidad.'), 'ok')
      fechar(); onPago(); return
    }
    const abertas = meses.filter((m) => guia.competencias.includes(m.competencia) && m.natureza === 'oficial' && (m.saldo > 0 || m.situacao === 'aguardando_conciliacao'))
      .map((m) => ({ id: m.id, data_vencimento: m.data_vencimento, saldo: m.situacao === 'aguardando_conciliacao' ? Math.max(0, (m.valor_esperado ?? 0) - m.pago) : m.saldo }))
    if (!abertas.length) { showToast(L('Os meses desta guia não estão em aberto no Axioma. Confira os períodos.', 'The months on this slip are not open in Axioma. Check the periods.', 'Los meses de esta guía no están abiertos en Axioma. Verifique los períodos.')); return }
    const valor = Number(guia.valor_total)
    const plano = planejarAlocacao(valor, abertas)
    if (!plano.alocacoes.length) return
    // O que passar do DAS dos meses é multa/juros da guia (vai pra conta de juros).
    plano.alocacoes[plano.alocacoes.length - 1].encargos = plano.excedente
    setSalvando(true)
    const id = await garantirGuia()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !id) { setSalvando(false); return }
    const r = await registrarPagamentoDAS({
      userId: user.id, empresaId, chave: `guia:${id}`, valor, data: dataPg, metodo, origem: 'comprovante_ia',
      alocacoes: plano.alocacoes, referencia: guia.numero_documento, guiaId: id,
    })
    setSalvando(false)
    if (r.erro) { showToast(L('Não consegui dar a baixa. Nada foi gravado — tente de novo.', 'Could not record it. Nothing was saved — try again.', 'No pude registrar. No se guardó nada — intente de nuevo.')); return }
    showToast(r.jaExistia ? L('Esta guia já estava registrada como paga.', 'This slip was already recorded as paid.', 'Esta guía ya estaba registrada como pagada.') : L('Pago! A baixa já está no DAS, no Fluxo de Caixa e na Contabilidade.', 'Paid! Recorded in DAS, Cash Flow and Accounting.', '¡Pagado! Registrado en DAS, Flujo de Caja y Contabilidad.'), 'ok')
    fechar(); onPago()
  }

  return (
    <Modal open={aberto} onClose={() => { if (!lendo && !salvando) fechar() }} maxWidthClassName="max-w-lg">
      <CanvasBox cor={MENTA} {...cartaoTema}>
        <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Pagar o DAS', 'Pay the DAS', 'Pagar el DAS')}{competenciaInicial ? ` — ${L('competência', 'period', 'competencia')} ${competenciaInicial.slice(5, 7)}/${competenciaInicial.slice(0, 4)}` : ''}</p>

        <div className="rounded-xl p-3 mt-3" style={CAIXA}>
          <p className="text-xs font-bold" style={{ color: TEXTO }}>1. {L('Gere a guia no portal oficial', 'Issue the slip on the official portal', 'Genere la guía en el portal oficial')}</p>
          <p className="text-[11px] mt-1" style={{ color: SEC }}>{simples
            ? L('No Portal do Simples, entre no PGDAS-D (certificado digital ou código de acesso), faça a apuração do mês e clique em "Gerar DAS". Baixe o PDF.', 'On the Simples Portal, open PGDAS-D (digital certificate or access code), file the month and click "Gerar DAS". Download the PDF.', 'En el Portal del Simples, entre al PGDAS-D (certificado digital o código de acceso), haga la apuración del mes y haga clic en "Gerar DAS". Descargue el PDF.')
            : L('No PGMEI, informe o CNPJ, escolha o ano, marque o(s) mês(es) e clique em "Emitir DAS". Baixe o PDF.', 'In PGMEI, enter the CNPJ, pick the year, tick the month(s) and click "Emitir DAS". Download the PDF.', 'En el PGMEI, informe el CNPJ, elija el año, marque el/los mes(es) y haga clic en "Emitir DAS". Descargue el PDF.')}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <a href={portal} target="_blank" rel="noopener noreferrer" {...btn(NAVY)}><ExternalLink size={12} />{simples ? L('Abrir o PGDAS-D', 'Open PGDAS-D', 'Abrir el PGDAS-D') : L('Abrir o PGMEI', 'Open PGMEI', 'Abrir el PGMEI')}</a>
            {cnpjEmpresa && <button {...btn(NAVY)} onClick={() => void copiar(soDigitos(cnpjEmpresa), 'CNPJ')}><Copy size={12} />{L('Copiar CNPJ', 'Copy CNPJ', 'Copiar CNPJ')}</button>}
          </div>
        </div>

        <div className="rounded-xl p-3 mt-2" style={CAIXA}>
          <p className="text-xs font-bold" style={{ color: TEXTO }}>2. {L('Envie a guia (PDF ou foto)', 'Upload the slip (PDF or photo)', 'Suba la guía (PDF o foto)')}</p>
          <label {...btn(MENTA)} className="mt-2 px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer" style={{ background: MENTA, color: '#fff' }}>
            <Upload size={12} />{lendo ? L('Lendo a guia…', 'Reading the slip…', 'Leyendo la guía…') : L('Escolher arquivo', 'Choose file', 'Elegir archivo')}
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" disabled={lendo} onChange={(e) => { const f = e.target.files?.[0]; if (f) void enviarArquivo(f); e.target.value = '' }} />
          </label>
          {guia && (
            <div className="mt-2 text-[11px] space-y-0.5" style={{ color: TEXTO }}>
              <p>{L('A IA leu assim — confira com a guia:', 'AI read it like this — check against the slip:', 'La IA leyó así — verifique con la guía:')}</p>
              <p><b>{L('Valor', 'Amount', 'Valor')}:</b> {guia.valor_total != null ? fmt(guia.valor_total) : '—'} · <b>{L('Pagar até', 'Pay by', 'Pagar hasta')}:</b> {guia.data_vencimento ? new Date(guia.data_vencimento + 'T00:00:00').toLocaleDateString(local) : '—'}</p>
              <p><b>{L('Meses', 'Months', 'Meses')}:</b> {guia.competencias.map((c) => `${c.slice(5, 7)}/${c.slice(0, 4)}`).join(', ') || '—'} · <b>{L('Nº do documento', 'Doc. no.', 'Nº del documento')}:</b> {guia.numero_documento || '—'}</p>
              {conferencia?.avisos.map((a) => <p key={a} className="flex items-start gap-1 font-semibold" style={{ color: '#b45309' }}><AlertTriangle size={12} className="mt-0.5 shrink-0" />{AVISO[a] ?? a}</p>)}
              {guia.duvidas.map((d) => <p key={d.campo} style={{ color: '#b45309' }}>• {d.pergunta}</p>)}
              {conferencia?.ok && <p className="flex items-center gap-1 font-semibold" style={{ color: MENTA }}><Check size={12} />{L('Códigos conferidos.', 'Codes checked.', 'Códigos verificados.')}</p>}
            </div>
          )}
        </div>

        {guia && (
          <div className="rounded-xl p-3 mt-2" style={CAIXA}>
            <p className="text-xs font-bold" style={{ color: TEXTO }}>3. {L('Pague', 'Pay', 'Pague')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pixOk && <button {...btn(MENTA)} onClick={() => void copiar(guia.pix_copia_cola!, 'Pix')}><Copy size={12} />{L('Copiar Pix', 'Copy Pix', 'Copiar Pix')}</button>}
              {barrasOk && <button {...btn(NAVY)} onClick={() => void copiar(soDigitos(guia.codigo_barras), L('Código de barras', 'Barcode', 'Código de barras'))}><Copy size={12} />{L('Copiar código de barras', 'Copy barcode', 'Copiar código de barras')}</button>}
              {!simples && <a href={URL_PGMEI} target="_blank" rel="noopener noreferrer" {...btn(NAVY)}><ExternalLink size={12} />{L('Cartão de crédito (PGMEI → Pagar Online)', 'Credit card (PGMEI → Pagar Online)', 'Tarjeta de crédito (PGMEI → Pagar Online)')}</a>}
              {pixOk && <button {...btn(MENTA)} disabled={!PIX_AXIOMA_ATIVO} onClick={() => void pagarPixAxioma()} title={PIX_AXIOMA_ATIVO ? '' : L('Em ativação com a Pluggy', 'Being activated with Pluggy', 'En activación con Pluggy')}>
                {L('Pagar com Pix pelo Axioma', 'Pay with Pix through Axioma', 'Pagar con Pix por Axioma')}{PIX_AXIOMA_ATIVO ? '' : L(' (em ativação)', ' (being activated)', ' (en activación)')}
              </button>}
            </div>
            {!simples && <p className="text-[11px] mt-2" style={{ color: SEC }}>{L('Cartão de crédito: aceito pela Receita desde set/2025 no próprio PGMEI ("Pagar Online"). Os juros do cartão costumam ser bem maiores que o parcelamento oficial do PGMEI — compare antes. Cartão de débito não é aceito pelas regras oficiais que encontramos.', 'Credit card: accepted by the Federal Revenue since Sep/2025 in PGMEI itself ("Pagar Online"). Card interest is usually much higher than the official PGMEI installment plan — compare first. Debit card is not accepted under the official rules we found.', 'Tarjeta de crédito: aceptada por la Receita desde sep/2025 en el propio PGMEI ("Pagar Online"). Los intereses de la tarjeta suelen ser mucho mayores que el parcelamiento oficial del PGMEI — compare antes. Tarjeta de débito no es aceptada según las reglas oficiales encontradas.')}</p>}
            <p className="text-[11px] mt-2" style={{ color: SEC }}>{L('Pagou no app do banco? Informe a data e clique em "Já paguei" — a baixa sai com o nº desta guia, e o extrato reconhece sozinho.', 'Paid in your bank app? Enter the date and click "Already paid" — it is recorded with this slip number and the statement matches it automatically.', '¿Pagó en la app del banco? Informe la fecha y haga clic en "Ya pagué" — se registra con el nº de esta guía y el extracto lo reconoce solo.')}</p>
            <div className="flex flex-wrap items-end gap-2 mt-2">
              <label className="text-[11px]" style={{ color: SEC }}>{L('Data do pagamento', 'Payment date', 'Fecha del pago')}
                <input type="date" value={dataPg} max={hojeISO()} onChange={(e) => setDataPg(e.target.value)} className="block mt-1 px-2 py-1.5 rounded-lg text-xs" style={CAMPO} />
              </label>
              <label className="text-[11px]" style={{ color: SEC }}>{L('Como pagou', 'How you paid', 'Cómo pagó')}
                <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagamento)} className="block mt-1 px-2 py-1.5 rounded-lg text-xs" style={CAMPO}>
                  <option value="pix">Pix</option><option value="boleto">{L('Código de barras', 'Barcode', 'Código de barras')}</option><option value="debito_automatico">{L('Débito automático', 'Direct debit', 'Débito automático')}</option><option value="cartao">{L('Cartão de crédito', 'Credit card', 'Tarjeta de crédito')}</option>
                </select>
              </label>
              <button {...btn(MENTA)} disabled={salvando || !(Number(guia.valor_total) > 0)} onClick={() => void jaPaguei()}><Check size={12} />{salvando ? '…' : L('Já paguei', 'Already paid', 'Ya pagué')}</button>
            </div>
          </div>
        )}
        <button onClick={fechar} disabled={lendo || salvando} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold" style={{ background: NAVY, color: '#fff' }}>{L('Fechar', 'Close', 'Cerrar')}</button>
      </CanvasBox>
    </Modal>
  )
}
