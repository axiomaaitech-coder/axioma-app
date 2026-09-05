'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { explicarMinhaEmpresa, type ExplicacaoEmpresa, type Descoberta } from '../../../../lib/contadorHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

function Secao({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${cor}25` }}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: TITULO }}>
        <span className="w-1 h-4 rounded-full" style={{ background: cor }} />
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function Ranking({ linhas }: { linhas: ExplicacaoEmpresa['comoGanha'] }) {
  return (
    <div className="space-y-1.5">
      {linhas.map((l) => (
        <div key={l.contaId} className="flex items-center justify-between text-xs">
          <span style={{ color: TEXTO }}>{l.nome}</span>
          <span className="font-semibold whitespace-nowrap" style={{ color: CINZA }}>R$ {fBRL2(l.valor)} · {l.percentual.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

function LinhaDescoberta({ d }: { d: Descoberta }) {
  return (
    <div className="text-xs py-1.5" style={{ color: TEXTO, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {d.titulo}
    </div>
  )
}

export default function ContadorExplicarPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<ExplicacaoEmpresa | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (empId) setDados(await explicarMinhaEmpresa(empId))
      setLoading(false)
    })()
  }, [])

  const tendenciaTexto = (pct: number | null, positivoBom: boolean) => {
    if (pct === null) return L('sem histórico suficiente pra comparar ainda', 'not enough history to compare yet', 'sin historial suficiente para comparar aún')
    const sinal = pct >= 0 ? '+' : ''
    const cor = (pct >= 0) === positivoBom ? VERDE : VERMELHO
    return <span style={{ color: cor, fontWeight: 700 }}>{sinal}{pct.toFixed(1)}%</span>
  }

  return (
    <ModuloLayout
      titulo={L('Explique Minha Empresa', 'Explain My Company', 'Explique Mi Empresa')}
      subtitulo={L('Como sua empresa realmente funciona, direto do seu ledger — nada inventado, tudo calculado do que já foi lançado.', 'How your company really works, straight from your ledger — nothing invented, all calculated from what was already recorded.', 'Cómo funciona realmente su empresa, directo de su libro mayor — nada inventado, todo calculado de lo que ya fue registrado.')}
      botaoExtra={
        <button onClick={() => router.push('/contador')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          {L('Voltar ao Contador', 'Back to Accountant', 'Volver al Contador')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : !dados ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Cadastre o plano de contas e lance alguns movimentos pra a Axioma ter o que explicar.', 'Set up the chart of accounts and record some entries so Axioma has something to explain.', 'Configure el plan de cuentas y registre algunos movimientos para que Axioma tenga qué explicar.')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Secao titulo={L('Como sua empresa ganha dinheiro', 'How your company makes money', 'Cómo su empresa gana dinero')} cor={VERDE}>
            <p className="text-xs mb-3" style={{ color: CINZA }}>
              {L(`Receita do mês: R$ ${fBRL2(dados.receitaTotal)}. Comparado ao mês anterior: `, `This month's revenue: R$ ${fBRL2(dados.receitaTotal)}. Compared to last month: `, `Ingresos del mes: R$ ${fBRL2(dados.receitaTotal)}. Comparado al mes anterior: `)}
              {tendenciaTexto(dados.tendenciaReceitaMoMPct, true)}.
            </p>
            {dados.comoGanha.length > 0 ? <Ranking linhas={dados.comoGanha} /> : <p className="text-xs" style={{ color: CINZA }}>{L('Nenhuma receita lançada no período.', 'No revenue recorded in this period.', 'Ningún ingreso registrado en el período.')}</p>}
          </Secao>

          <Secao titulo={L('Onde sua empresa perde dinheiro', "Where your company loses money", 'Dónde su empresa pierde dinero')} cor={VERMELHO}>
            <p className="text-xs mb-3" style={{ color: CINZA }}>
              {L(`Despesa do mês: R$ ${fBRL2(dados.despesaTotal)}. Comparado ao mês anterior: `, `This month's expenses: R$ ${fBRL2(dados.despesaTotal)}. Compared to last month: `, `Gastos del mes: R$ ${fBRL2(dados.despesaTotal)}. Comparado al mes anterior: `)}
              {tendenciaTexto(dados.tendenciaDespesaMoMPct, false)}.
            </p>
            {dados.ondePerde.length > 0 ? <Ranking linhas={dados.ondePerde} /> : <p className="text-xs" style={{ color: CINZA }}>{L('Nenhuma despesa lançada no período.', 'No expenses recorded in this period.', 'Ningún gasto registrado en el período.')}</p>}
          </Secao>

          <Secao titulo={L('Concentração', 'Concentration', 'Concentración')} cor={AMARELO}>
            {dados.concentracaoFornecedor ? (
              <p className="text-xs" style={{ color: TEXTO }}>
                {L(`${dados.concentracaoFornecedor.nome} concentra `, `${dados.concentracaoFornecedor.nome} holds `, `${dados.concentracaoFornecedor.nome} concentra `)}
                <span className="font-bold" style={{ color: AMARELO }}>{dados.concentracaoFornecedor.percentual.toFixed(0)}%</span>
                {L(' das suas contas a pagar em aberto.', ' of your open payables.', ' de sus cuentas por pagar abiertas.')}
              </p>
            ) : (
              <p className="text-xs" style={{ color: CINZA }}>{L('Carteira de fornecedores pulverizada — sem concentração relevante em aberto.', 'Supplier base is spread out — no relevant concentration open.', 'Cartera de proveedores dispersa — sin concentración relevante abierta.')}</p>
            )}
          </Secao>

          <Secao titulo={L('Como o caixa se comporta', 'How cash behaves', 'Cómo se comporta la caja')} cor={AZULC}>
            <p className="text-xs" style={{ color: TEXTO }}>
              {L('Caixa disponível hoje: ', 'Cash available today: ', 'Caja disponible hoy: ')}<span className="font-bold" style={{ color: AZULC }}>R$ {fBRL2(dados.caixaDisponivel)}</span>
              {dados.liquidityScore && (
                <> — {L('Liquidity Score', 'Liquidity Score', 'Liquidity Score')} <span className="font-bold" style={{ color: AZULC }}>{dados.liquidityScore.total}</span></>
              )}
            </p>
          </Secao>

          <Secao titulo={L('Riscos abertos', 'Open risks', 'Riesgos abiertos')} cor={VERMELHO}>
            {dados.riscos.length > 0 ? dados.riscos.map((d) => <LinhaDescoberta key={d.id} d={d} />) : <p className="text-xs" style={{ color: CINZA }}>{L('Nenhum risco aberto no momento.', 'No open risks right now.', 'Ningún riesgo abierto por ahora.')}</p>}
          </Secao>

          <Secao titulo={L('Oportunidades abertas', 'Open opportunities', 'Oportunidades abiertas')} cor={VERDE}>
            {dados.oportunidades.length > 0 ? dados.oportunidades.map((d) => <LinhaDescoberta key={d.id} d={d} />) : <p className="text-xs" style={{ color: CINZA }}>{L('Nenhuma oportunidade mapeada ainda — rode a descoberta no Contador.', 'No opportunities mapped yet — run discovery in the Accountant.', 'Ninguna oportunidad mapeada aún — ejecute el descubrimiento en el Contador.')}</p>}
          </Secao>
        </div>
      )}
    </ModuloLayout>
  )
}
