// Fontes da página inicial (next/font, hospedadas pelo próprio site — o @import do Google
// dentro do <style jsx> não carregava e caía numa fonte genérica pesada).
import { Montserrat, Inter } from 'next/font/google'

export const fonteTitulo = Montserrat({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap', variable: '--ax-titulo' })
export const fonteTexto = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--ax-texto' })
