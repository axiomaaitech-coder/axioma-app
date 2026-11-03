// Vigia de segurança (Camada 3, Elias 2026-11-03: "não deve ter nenhuma chave exposta no código de nenhuma natureza").
// Roda sozinho antes de todo build (prebuild) e BARRA a publicação se achar:
//  1) chave/segredo escrito no código (OpenAI, Anthropic, Google, Stripe, Supabase, GitHub, Groq, Resend, PostHog pessoal, chave privada, JWT);
//  2) tela do navegador ('use client') usando a chave mestra do banco ou o cliente de servidor;
//  3) variável pública (NEXT_PUBLIC_) com nome de segredo — tudo que é NEXT_PUBLIC_ vai para o navegador;
//  4) .env.example com valor preenchido.
// Os valores reais ficam só na Vercel e no .env.local (fora do git e fora desta varredura).
// Uso: node scripts/check-seguranca.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative, extname } from 'node:path'

const RAIZ = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const IGNORAR = new Set(['node_modules', '.next', '.git', 'graphify-out', '.vercel', '.agents', 'coverage', 'out'])
const TEXTO = new Set(['.ts', '.tsx', '.js', '.mjs', '.mts', '.cjs', '.json', '.md', '.sql', '.yml', '.yaml', '.html', '.css', '.txt', '.toml', ''])

const CHAVES = [
  ['OpenAI', /sk-(proj-)?[A-Za-z0-9_-]{32,}/],
  ['Anthropic', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['Google', /AIza[0-9A-Za-z_-]{35}/],
  ['Stripe secreta', /(sk|rk)_live_[0-9A-Za-z]{20,}/],
  ['Stripe webhook', /whsec_[A-Za-z0-9]{20,}/],
  ['Supabase secreta', /sb_secret_[A-Za-z0-9_-]{10,}/],
  ['GitHub', /(ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
  ['Groq', /gsk_[A-Za-z0-9]{40,}/],
  ['Resend', /re_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/],
  ['PostHog pessoal', /phx_[A-Za-z0-9]{30,}/],
  ['Chave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['JWT (ex.: chave de serviço do Supabase)', /eyJhbGciOi[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
]
// Variáveis públicas que são públicas de propósito (identificadores, não segredos)
const PUBLICAS_OK = new Set(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'])
const SERVIDOR = /SUPABASE_SERVICE_ROLE_KEY|service_role|supabaseServico|supervisorServidor/

function arquivos(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (IGNORAR.has(n)) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) arquivos(p, out)
    else if (!(n.startsWith('.env') && n !== '.env.example') && TEXTO.has(extname(n)) && statSync(p).size < 2_000_000) out.push(p)
  }
  return out
}

const falhas = []
for (const p of arquivos(RAIZ)) {
  const rel = relative(RAIZ, p).replaceAll('\\', '/')
  if (rel === 'scripts/check-seguranca.mjs' || rel === 'package-lock.json') continue
  const txt = readFileSync(p, 'utf8')
  for (const [nome, re] of CHAVES) { const m = txt.match(re); if (m) falhas.push(`${rel}: parece chave ${nome} (${m[0].slice(0, 6)}…)`) }
  if (/\.(tsx?|jsx?)$/.test(rel) && /^\s*['"]use client['"]/.test(txt) && SERVIDOR.test(txt.replace(/\/\/.*$/gm, '')))
    falhas.push(`${rel}: tela do navegador usando a chave mestra/cliente de servidor`)
  for (const v of txt.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g))
    if (!PUBLICAS_OK.has(v[0]) && /SECRET|SERVICE|PRIVATE|PASSWORD|SENHA|TOKEN|_KEY$/.test(v[0])) falhas.push(`${rel}: ${v[0]} vai para o navegador e tem nome de segredo`)
  if (rel === '.env.example') for (const l of txt.split('\n')) if (/^[A-Z0-9_]+=\S/.test(l.trim()) && !/=(true|false|\d+|https?:\/\/[^\s]*example[^\s]*)$/.test(l.trim())) falhas.push(`.env.example: valor preenchido em ${l.split('=')[0]}`)
}

const unicas = [...new Set(falhas)]
if (unicas.length) {
  console.error(`✗ check-seguranca: ${unicas.length} problema(s) — publicação barrada:\n  ` + unicas.join('\n  '))
  process.exit(1)
}
console.log('✓ check-seguranca: nenhuma chave no código, nenhuma tela com acesso de servidor')
