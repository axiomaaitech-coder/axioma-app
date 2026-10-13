// Fontes da página inicial (next/font, hospedadas pelo próprio site — o @import do Google
// dentro do <style jsx> não carregava e caía numa fonte genérica pesada).
// Títulos: serifada executiva (padrão de bancos/consultorias); texto: sem serifa limpa de fintech.
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'

export const fonteTitulo = Playfair_Display({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap', variable: '--ax-titulo' })
export const fonteTexto = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--ax-texto' })
