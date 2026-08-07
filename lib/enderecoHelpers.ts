// 🦅 AXIOMA AI.TECH - Helper global de Endereço/CEP
// Regra do projeto: qualquer campo de CEP no Axioma autopreenche o endereço.
// Migrado de empresaHelpers.ts (mesma lógica ViaCEP) pra virar reutilizável
// entre módulos (Empresa, Fornecedores, e o que mais tiver endereço).

export function formatarCEP(cep: string): string {
  const limpo = (cep || "").replace(/\D/g, "");
  if (limpo.length !== 8) return cep || "";
  return limpo.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

export type DadosCEP = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

// Consulta o ViaCEP por dentro da nossa própria rota (app/api/empresa/
// consulta-cep) — mesmo padrão do CNPJ, ver empresaHelpers.ts. `codigo` no
// retorno de erro é estável (não muda por idioma) — a tela traduz.
export async function consultarCEP(cep: string): Promise<DadosCEP | { erro: string; codigo: string }> {
  const c = (cep || "").replace(/\D/g, "");
  if (c.length !== 8) return { erro: "CEP deve ter 8 dígitos", codigo: "invalido" };

  let data: any;
  try {
    const resp = await fetch(`/api/empresa/consulta-cep?cep=${c}`);
    data = await resp.json();
  } catch {
    return { erro: "Erro de conexão", codigo: "indisponivel" };
  }

  if (data.status === "invalido") return { erro: "CEP deve ter 8 dígitos", codigo: "invalido" };
  if (data.status === "nao_encontrado") return { erro: "CEP não encontrado", codigo: "nao_encontrado" };
  if (data.status !== "ok") return { erro: "Serviço de consulta indisponível no momento. Tente novamente em instantes.", codigo: "indisponivel" };

  return {
    cep: formatarCEP(data.cep),
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.cidade,
    uf: data.uf,
  };
}

// CPF — mesmo padrão de validarCNPJ (empresaHelpers.ts): dígitos verificadores mod-11.
export function validarCPF(cpf: string): boolean {
  const c = (cpf || "").replace(/\D/g, "");
  if (c.length !== 11) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(c[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(c[10]);
}

export function formatarCPF(cpf: string): string {
  const limpo = (cpf || "").replace(/\D/g, "");
  if (limpo.length !== 11) return cpf || "";
  return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
