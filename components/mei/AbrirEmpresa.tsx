'use client'
// 🦅 ABRIR MEI OU ME — passo a passo assistido (2026-10-10)
// O CNPJ só pode ser aberto nos portais oficiais (gov.br / REDESIM / Junta Comercial): o Axioma
// guia cada etapa com o link certo e, quando o CNPJ sai, busca os dados na Receita e preenche
// o cadastro — a pessoa confere e salva. Regras com fonte e data da conferência.
import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { CanvasBox } from '../CanvasBox'
import { consultarCNPJ } from '../../lib/empresaHelpers'

type Lang = 'pt' | 'en' | 'es'
const MENTA = '#0f7a5a', NAVY = '#101b3d'
export type DadosAbertura = { cnpj: string; razao_social: string; cnae: string; data_abertura: string; opcao_mei: boolean; opcao_simples: boolean; situacao: string }

const LINKS = {
  queroSerMei: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei',
  atividadesMei: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas',
  contaGov: 'https://www.gov.br/governodigital/pt-br/identidade/conta-gov-br',
  redesim: 'https://www.gov.br/empresas-e-negocios/pt-br/redesim',
  simples: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
}

export default function AbrirEmpresa({ lang, temaClaro, cartaoTema, onPreencher }: {
  lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; onPreencher: (d: DadosAbertura) => void
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const TEXTO = temaClaro ? '#101b3d' : '#e5edf7', SEC = temaClaro ? '#374151' : '#a3b1c2'
  const CAIXA = { background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)', border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : 'rgba(46,204,155,0.22)'}` }
  const CAMPO = { background: temaClaro ? '#ffffff' : 'rgba(255,255,255,0.06)', border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.2)' : 'rgba(46,204,155,0.3)'}`, color: TEXTO }
  const [tipo, setTipo] = useState<'mei' | 'me'>('mei')
  const [cnpj, setCnpj] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const passosMei: [string, string, string?][] = [
    [L('Confira se sua atividade pode ser MEI', 'Check your activity is allowed as MEI', 'Verifique si su actividad puede ser MEI'), L('Faturamento até R$ 81 mil no ano (caminhoneiro: R$ 251.600), no máximo 1 empregado e não ser sócio ou titular de outra empresa.', 'Revenue up to R$ 81k a year (truck driver: R$ 251,600), at most 1 employee and not a partner or owner of another company.', 'Facturación hasta R$ 81 mil al año (camionero: R$ 251.600), máximo 1 empleado y no ser socio o titular de otra empresa.'), LINKS.atividadesMei],
    [L('Tenha conta gov.br prata ou ouro', 'Have a silver or gold gov.br account', 'Tenga cuenta gov.br plata u oro'), L('A abertura do MEI pede esse nível de conta.', 'Opening an MEI requires this account level.', 'La apertura del MEI exige ese nivel de cuenta.'), LINKS.contaGov],
    [L('Faça a formalização no Portal do Empreendedor', 'Register on the Entrepreneur Portal', 'Formalícese en el Portal del Emprendedor'), L('Em "Quero ser MEI" → "Formalize-se". É gratuito: ninguém pode cobrar por isso. O CNPJ sai na hora, junto com o Certificado (CCMEI).', 'In "Quero ser MEI" → "Formalize-se". It is free: nobody may charge for it. The CNPJ comes out right away with the certificate (CCMEI).', 'En "Quero ser MEI" → "Formalize-se". Es gratuito: nadie puede cobrar por eso. El CNPJ sale al momento, con el certificado (CCMEI).'), LINKS.queroSerMei],
    [L('Traga o CNPJ para o Axioma', 'Bring the CNPJ into Axioma', 'Traiga el CNPJ a Axioma'), L('Digite abaixo: buscamos razão social, atividade e data de abertura na Receita e preenchemos o seu cadastro.', 'Type it below: we fetch the company name, activity and opening date from the Federal Revenue and fill in your profile.', 'Escríbalo abajo: buscamos razón social, actividad y fecha de apertura en la Receita y llenamos su registro.')],
  ]
  const passosMe: [string, string, string?][] = [
    [L('Consulta de viabilidade', 'Feasibility check', 'Consulta de viabilidad'), L('Na REDESIM do seu estado: a prefeitura confirma se a atividade pode funcionar no endereço e se o nome está livre.', 'On your state REDESIM: the city confirms the activity can run at the address and the name is available.', 'En la REDESIM de su estado: la alcaldía confirma si la actividad puede funcionar en la dirección y si el nombre está libre.'), LINKS.redesim],
    [L('DBE na Receita Federal', 'DBE at the Federal Revenue', 'DBE en la Receita Federal'), L('Preencha o Documento Básico de Entrada (DBE) pelo Coletor Nacional, indicado pela própria REDESIM.', 'Fill in the Documento Básico de Entrada (DBE) through the national collector, linked from REDESIM.', 'Complete el Documento Básico de Entrada (DBE) por el Coletor Nacional, indicado por la propia REDESIM.'), LINKS.redesim],
    [L('Registro na Junta Comercial', 'Registration at the Board of Trade', 'Registro en la Junta Comercial'), L('Empresário individual, sociedade limitada unipessoal (SLU) ou limitada (LTDA): a Junta registra o ato e sai o CNPJ, com as inscrições estadual e municipal.', 'Sole proprietor, single-member LLC (SLU) or LLC (LTDA): the Board registers it and the CNPJ is issued, with state and city registrations.', 'Empresario individual, sociedad limitada unipersonal (SLU) o limitada (LTDA): la Junta registra y sale el CNPJ, con las inscripciones estatal y municipal.'), LINKS.redesim],
    [L('Opte pelo Simples Nacional no prazo', 'Opt into Simples Nacional on time', 'Opte por el Simples Nacional a tiempo'), L('Empresa nova: até 30 dias da última inscrição (municipal ou estadual), sem passar de 60 dias da abertura do CNPJ (Resolução CGSN 140/2018, art. 6º). ME fatura até R$ 360 mil/ano; EPP até R$ 4,8 milhões. Regra conferida em 10/10/2026 — pode mudar.', 'New company: up to 30 days from the last registration (city or state), no more than 60 days from the CNPJ opening (CGSN Resolution 140/2018, art. 6). ME: up to R$ 360k/year; EPP: up to R$ 4.8M. Rule checked on 10/10/2026 — it may change.', 'Empresa nueva: hasta 30 días de la última inscripción (municipal o estatal), sin pasar de 60 días de la apertura del CNPJ (Resolución CGSN 140/2018, art. 6º). ME hasta R$ 360 mil/año; EPP hasta R$ 4,8 millones. Regla verificada el 10/10/2026 — puede cambiar.'), LINKS.simples],
    [L('Traga o CNPJ para o Axioma', 'Bring the CNPJ into Axioma', 'Traiga el CNPJ a Axioma'), L('Digite abaixo para buscar os dados na Receita.', 'Type it below to fetch the data from the Federal Revenue.', 'Escríbalo abajo para buscar los datos en la Receita.')],
  ]

  async function buscar() {
    setAviso(null); setBuscando(true)
    const r = await consultarCNPJ(cnpj)
    setBuscando(false)
    if ('erro' in r) {
      setAviso(r.codigo === 'invalido' ? L('CNPJ inválido: confira os números.', 'Invalid CNPJ: check the digits.', 'CNPJ inválido: verifique los números.')
        : r.codigo === 'nao_encontrado' ? L('CNPJ não encontrado na Receita. Se acabou de abrir, tente de novo em algumas horas.', 'CNPJ not found. If just opened, try again in a few hours.', 'CNPJ no encontrado. Si acaba de abrir, intente en unas horas.')
        : L('A consulta da Receita está fora do ar agora. Tente de novo em instantes.', 'The Federal Revenue lookup is down right now. Try again shortly.', 'La consulta de la Receita no está disponible ahora. Intente en instantes.'))
      return
    }
    if (tipo === 'mei' && !r.opcao_mei) setAviso(L('Este CNPJ não aparece como MEI na Receita. Confira se é o CNPJ certo antes de salvar.', 'This CNPJ is not listed as MEI. Check it is the right one before saving.', 'Este CNPJ no figura como MEI. Verifique antes de guardar.'))
    onPreencher({ cnpj: r.cnpj ?? '', razao_social: r.razao_social ?? '', cnae: [r.cnae_principal, r.cnae_descricao].filter(Boolean).join(' — '), data_abertura: r.data_abertura || '', opcao_mei: !!r.opcao_mei, opcao_simples: !!r.opcao_simples, situacao: r.situacao_cadastral ?? '' })
  }

  const passos = tipo === 'mei' ? passosMei : passosMe
  return (
    <CanvasBox cor={MENTA} {...cartaoTema}>
      <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Abrir minha empresa', 'Open my company', 'Abrir mi empresa')}</p>
      <p className="text-xs mt-1" style={{ color: SEC }}>{L('O CNPJ é aberto nos portais oficiais. O Axioma mostra cada passo e, quando o CNPJ sair, preenche seu cadastro sozinho.', 'The CNPJ is opened on the official portals. Axioma shows every step and fills in your profile once the CNPJ is out.', 'El CNPJ se abre en los portales oficiales. Axioma muestra cada paso y, cuando salga el CNPJ, llena su registro solo.')}</p>
      <div className="flex gap-2 mt-3">
        {(['mei', 'me'] as const).map((k) => (
          <button key={k} onClick={() => setTipo(k)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: tipo === k ? MENTA : NAVY, color: '#ffffff' }}>
            {k === 'mei' ? L('Abrir MEI', 'Open MEI', 'Abrir MEI') : L('Abrir ME (Simples)', 'Open ME (Simples)', 'Abrir ME (Simples)')}
          </button>
        ))}
      </div>
      <ol className="mt-3 space-y-2">
        {passos.map(([titulo, texto, link], i) => (
          <li key={titulo} className="rounded-xl p-3" style={CAIXA}>
            <p className="text-xs font-bold" style={{ color: TEXTO }}>{i + 1}. {titulo}</p>
            <p className="text-[11px] mt-1" style={{ color: SEC }}>{texto}</p>
            {link && <a href={link} target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5" style={{ background: NAVY, color: '#ffffff' }}><ExternalLink size={11} />{L('Abrir portal oficial', 'Open official portal', 'Abrir portal oficial')}</a>}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-end gap-2 mt-3">
        <label className="text-[11px] flex-1 min-w-[180px]" style={{ color: SEC }}>{L('Já tenho CNPJ', 'I already have a CNPJ', 'Ya tengo CNPJ')}
          <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} inputMode="numeric" placeholder="00.000.000/0000-00" className="block w-full mt-1 px-3 py-2 rounded-lg text-sm" style={CAMPO} />
        </label>
        <button onClick={() => void buscar()} disabled={buscando || cnpj.replace(/\D/g, '').length !== 14} className="px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: MENTA, color: '#ffffff' }}>
          <Search size={12} />{buscando ? L('Buscando…', 'Searching…', 'Buscando…') : L('Buscar na Receita e preencher', 'Fetch and fill in', 'Buscar y llenar')}
        </button>
      </div>
      {aviso && <p className="text-xs mt-2 font-semibold" style={{ color: '#b45309' }}>{aviso}</p>}
    </CanvasBox>
  )
}
