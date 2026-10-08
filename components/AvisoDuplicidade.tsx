'use client'
// Aviso de duplicidade dos lançamentos manuais (lib/rastreio/lancamentoManual.ts).
// "duplicata": o motor já bloqueou — mostra onde estava e deixa lançar só se a pessoa
// disser que é outro dinheiro. "perguntar": caso extremo, a pessoa decide.
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import Modal from './Modal'
import { CanvasBox } from './CanvasBox'
import { useLanguage } from '../lib/LanguageContext'
import type { VeredictoDuplicidade } from '../lib/rastreio/lancamentoManual'

export default function AvisoDuplicidade({ aviso, temaClaro, onBloquear, onLancar }: {
  aviso: VeredictoDuplicidade | null; temaClaro: boolean; onBloquear: () => void; onLancar: () => void
}) {
  const { idioma } = useLanguage()
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)
  const local = idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR'
  const texto = temaClaro ? '#101b3d' : '#e5edf7'
  const certa = aviso?.veredicto === 'duplicata'
  return (
    <Modal open={!!aviso && aviso.veredicto !== 'segue'} onClose={onBloquear}>
      <CanvasBox cor={certa ? '#f87171' : '#f59e0b'} fundo={temaClaro ? '#f6f7c4' : undefined}>
        <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: certa ? '#f87171' : '#f59e0b' }}>AXIOMA AI.TECH</p>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: texto }}>
          {certa ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          {certa ? L('Duplicata bloqueada', 'Duplicate blocked', 'Duplicado bloqueado') : L('Suspeita de duplicata', 'Possible duplicate', 'Sospecha de duplicado')}
        </h3>
        <p className="text-xs mt-2" style={{ color: texto }}>
          {certa
            ? L('Este dinheiro já está lançado. Não lancei de novo, para não contar duas vezes:', 'This money is already recorded. I did not record it again, to avoid counting it twice:', 'Este dinero ya está registrado. No lo registré de nuevo, para no contarlo dos veces:')
            : L('Já existe um lançamento com o mesmo valor e a mesma data. É o mesmo dinheiro?', 'There is already an entry with the same amount and date. Is it the same money?', 'Ya existe un registro con el mismo valor y fecha. ¿Es el mismo dinero?')}
        </p>
        {aviso?.explicacao && <p className="text-xs mt-2 font-semibold" style={{ color: texto }}>{aviso.explicacao}</p>}
        {!certa && aviso?.pergunta && <p className="text-sm mt-2 font-bold" style={{ color: texto }}>❓ {aviso.pergunta}</p>}
        <div className="mt-3 space-y-1.5">
          {aviso?.suspeitas.map((s, i) => (
            <div key={i} className="rounded-lg px-3 py-2 text-xs axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.04)', color: texto }}>
              <strong>{s.modulo}</strong> • {s.descricao} • R$ {s.valor.toLocaleString(local, { minimumFractionDigits: 2 })} • {new Date(`${s.data}T00:00:00`).toLocaleDateString(local)}
            </div>
          ))}
        </div>
        {certa ? (
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={onBloquear} className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>{L('Entendi', 'Got it', 'Entendido')}</button>
            <button onClick={onLancar} className="text-xs underline" style={{ color: texto, opacity: 0.75 }}>{L('Não é repetido, é outro dinheiro — lançar mesmo assim', 'Not repeated, it is different money — record anyway', 'No se repite, es otro dinero — registrar igual')}</button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={onBloquear} className="py-2.5 rounded-xl text-sm font-bold" style={{ background: '#f87171', color: '#fff' }}>{L('Sim, é duplicata', 'Yes, duplicate', 'Sí, es duplicado')}</button>
            <button onClick={onLancar} className="py-2.5 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>{L('Não, lançar', 'No, record it', 'No, registrar')}</button>
          </div>
        )}
      </CanvasBox>
    </Modal>
  )
}
