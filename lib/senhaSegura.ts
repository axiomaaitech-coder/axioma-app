// Senha profissional (2026-10-16), ÚNICA para Cadastro, Atualizar senha e Convite:
// mínimo 8 caracteres com letra e número, sem o e-mail dentro, e fora das senhas vazadas na internet
// (base pública Have I Been Pwned por "k-anonimato": só os 5 primeiros caracteres do SHA-1 saem do
// aparelho, pela rota /api/senha/vazada — a senha nunca é enviada). A mesma regra mínima vale no
// servidor do Supabase (Auth → requisitos de senha), então pular a tela não adianta.
type Lang = "pt" | "en" | "es";
export type ProblemaSenha = "curta" | "fraca" | "email" | "vazada";

export const SENHA_MIN = 8;

export function regraSenha(senha: string, email = ""): ProblemaSenha | null {
  if (senha.length < SENHA_MIN) return "curta";
  if (!/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha)) return "fraca";
  const usuario = email.trim().toLowerCase().split("@")[0];
  if (usuario.length >= 4 && senha.toLowerCase().includes(usuario)) return "email";
  return null;
}

// true = vazada; false = não aparece; null = não deu para conferir (a tela segue: é camada extra,
// a regra mínima acima e a do Supabase continuam valendo — a falha fica registrada no servidor).
export async function senhaVazada(senha: string): Promise<boolean | null> {
  try {
    const bytes = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(senha));
    const hash = Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const r = await fetch("/api/senha/vazada", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixo: hash.slice(0, 5) }) });
    if (!r.ok) return null;
    const resto = hash.slice(5);
    return (await r.text()).split("\n").some((l) => { const [suf, n] = l.trim().split(":"); return suf === resto && Number(n) > 0; });
  } catch {
    return null;
  }
}

// Regra + base de vazadas, na ordem. Devolve o problema ou null (senha aceita).
export async function conferirSenha(senha: string, email = ""): Promise<ProblemaSenha | null> {
  return regraSenha(senha, email) ?? ((await senhaVazada(senha)) ? "vazada" : null);
}

export function mensagemSenha(p: ProblemaSenha, lang: Lang): string {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  switch (p) {
    case "curta": return L(`A senha precisa de pelo menos ${SENHA_MIN} caracteres.`, `Password needs at least ${SENHA_MIN} characters.`, `La contraseña necesita al menos ${SENHA_MIN} caracteres.`);
    case "fraca": return L("Use letras e números na senha.", "Use letters and numbers in the password.", "Use letras y números en la contraseña.");
    case "email": return L("A senha não pode conter o seu e-mail.", "The password cannot contain your e-mail.", "La contraseña no puede contener su correo.");
    case "vazada": return L("Esta senha já apareceu em vazamentos de dados na internet. Escolha outra.", "This password has appeared in data leaks on the internet. Choose another one.", "Esta contraseña ya apareció en filtraciones de datos en internet. Elija otra.");
  }
}

export const dicaSenha = (lang: Lang) =>
  lang === "en" ? `At least ${SENHA_MIN} characters, with letters and numbers.` : lang === "es" ? `Mínimo ${SENHA_MIN} caracteres, con letras y números.` : `Mínimo de ${SENHA_MIN} caracteres, com letras e números.`;
