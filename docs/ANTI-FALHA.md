# Sistema Anti-Falha do Axioma

| Campo | Valor |
|---|---|
| Decisão | Elias Tavares (CEO), 2026-10-15: "primeiro o sistema se defende sozinho; o aviso é o último caso" |
| Peças | `lib/antiFalha.ts`, `lib/erroUiHelpers.ts`, `lib/lerTodas.ts`, `components/AvisoFalhaLeitura.tsx`, `lib/supabaseServico.ts`, `lib/datas.ts` |
| Testes | `npx tsx scripts/check-anti-falha.mts`, `npx tsx scripts/check-voz-fase0.mts` |

## 1. As três camadas

1. **Defesa automática** — `comRetentativa` (`lib/antiFalha.ts`): leitura que falha por banco lento, rede
   oscilando ou tempo esgotado é refeita sozinha até 3 vezes (pausas de 0,4 s e 1,2 s). Erro que não muda
   tentando de novo (permissão/regra/dado inválido: códigos 42xxx, 23xxx, 22xxx, PGRST1xx) volta na hora.
   Só leitura: gravação nunca é repetida (poderia duplicar).
2. **Leitor em lotes** — `lerTodas` usa a mesma defesa em cada lote de 1000 linhas: nenhuma linha some.
3. **Último caso** (`lib/erroUiHelpers.ts`):
   - `exigirLeitura(() => consulta, "arquivo:linha")` — checagem "já existe?" antes de gravar e dados que
     decidem dinheiro: se falhou de verdade, **lança** (a gravação é cancelada; nunca grava em dobro).
   - `registrarLeitura(() => consulta, "arquivo:linha")` — listas e consultas: segue sem o dado.
   - Os dois registram no Sentry e disparam o aviso **"Alguns dados não puderam ser carregados"**
     (`components/AvisoFalhaLeitura`, no layout interno, 3 idiomas, um aviso por 15 s). Dado faltante
     nunca aparece como zero. O mesmo componente pega falha de leitura que escapou de alguma tela.

## 2. Regra para código novo

- Leitura do Supabase: nunca `const { data } = await supabase...` sem olhar `error`. Use
  `exigirLeitura` (decide gravação/dinheiro) ou `registrarLeitura` (exibição), ou `lerTodas` para listas.
- Quem chama algo que usa `exigirLeitura` trata a exceção (try/catch, `.catch`, ou devolve `{ erro }`) e
  **nunca deixa botão preso em "carregando"**.
- Cliente com chave de serviço em rota: `clienteServicoSobDemanda()` (`lib/supabaseServico.ts`), nunca
  `createClient` no topo do arquivo — sem a chave, só a rota falha; a publicação do site segue.
- Datas: "hoje" = `hojeISO()` (fuso da empresa); dia de uma data local = `isoDia(d)`; somar dias/meses =
  `somarDiasISO` / `somarMesesISO` (31/01 + 1 mês = 28/02). Nunca `new Date().toISOString().slice(0, 10)`.

## 3. Aplicado em 2026-10-15

- 144 leituras convertidas em 54 arquivos (as checagens antes de gravar de Contas a Pagar, Importar, Open
  Finance, DRE, Estoque, PDV, Pedido de Compra, MEI/DAS, Rastreio, Contabilidade e Nexus cancelam; listas e
  painéis seguem com aviso). 6 restantes são de login (não são leitura de dados).
- Telas que tratam a falha explicitamente: Contas a Pagar (fornecedor pelo CNPJ, conferência de NF),
  Importar (fornecedor pelo CNPJ, checagem de duplicatas: tudo desmarcado para revisão).
- Gravação de destinos do Rastreio: falha agora devolve erro (antes seguia como gravado).
- 75 pontos de data em UTC trocados (o dia virava às 21h); parcela de cartão no fim do mês corrigida;
  receita de 1º de janeiro não cai mais no ano anterior (Contas a Receber, Inadimplência).
- 4 rotas com conexão criada na montagem do site passaram a conectar sob demanda.
