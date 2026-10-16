# Axioma Voice Intelligence

| Campo | Valor |
|---|---|
| Documento | Especificação técnica — voz como camada de entrada/saída do motor de IA |
| Fase atual | **Fase 1 implementada — ditado (desligado para clientes até LEGAL-V01)** · Fase 0 concluída — 2026-10-15 |
| Responsável pelo produto | Elias Tavares (CEO) |
| Base | `docs/MOTOR-IA.md` (motor único de IA) |

## 1. Arquitetura proposta (Fase 1 em diante)

```
Botão 🎤 (clique da pessoa; o navegador pede permissão)
  → POST /api/voz/transcrever   login · papel · saldo · limite de duração · áudio descartado
  → texto aparece no campo da tela (a pessoa confere e envia)
  → POST /api/ia/motor          motor existente — mesmas regras, ferramentas e conferência do texto
  → resposta em texto (+ verificacao) → síntese de voz opcional (/api/voz/falar)
```

Regras: um só motor (nada de segundo agente); nenhuma API nova de escrita financeira — lançamento por voz
vira **rascunho** que abre o formulário existente e só grava quando a pessoa confirma; áudio não é guardado;
nem áudio nem transcrição vão para analytics/Sentry; chaves de API só no servidor; conversa em tempo real fora
desta etapa.

## 2. Correções da Fase 0

| # | Problema | Correção | Arquivo |
|---|---|---|---|
| A | Microfone proibido no app inteiro; áudio gerado (blob:) bloqueado pela CSP | `microphone=(self)` (só o próprio Axioma; câmera e localização seguem bloqueadas); `media-src 'self' blob:`. Nenhum domínio de fornecedor adicionado | `middleware.ts` |
| B | Motor não conferia o papel: operador de PDV recebia análise sobre dados vazios (a RLS esconde tudo dele) | `podeUsarIAFinanceira()` = mesma regra da RLS (`empresas_do_usuario_operacional`: todos menos operador), checada antes de gastar saldo; 403 com aviso trilíngue | `lib/ia/motor.ts`, `app/api/ia/motor/route.ts`, `lib/ia/cliente.ts` |
| B2 | IA Financeira e IA Tributária ignoravam o aviso de saldo esgotado (402) e caíam caladas nas regras | Mostram o aviso de 402 e de 403 | `app/(interno)/ia-financeira/page.tsx`, `ia-tributaria/page.tsx` |
| C | Ferramenta `custos` somava custo fixo encerrado/futuro (o retrato já filtrava) | `soVigentes(…, hoje da empresa)` | `lib/ia/ferramentas.ts` |
| C2 | Leitura que falhava nas ferramentas virava lista vazia | `semFalha()`: falha vira `{"erro": "não foi possível consultar agora…"}` | `lib/ia/ferramentas.ts` |
| D | Datas em UTC: depois das 21h (Brasília) o servidor já estava "amanhã"; meses virando 3h antes | Ferramentas no fuso da empresa (`umAnoAntes`, `mesesAte`); retrato com "hoje" de Brasília nas leituras paralelas e fuso da empresa no restante | `lib/ia/ferramentas.ts`, `lib/ia/retratoEmpresa.ts` |
| D2 | Leitura que falhava no retrato virava zero calado | `leiturasFalhas` + linha "LEITURAS QUE FALHARAM AGORA" no texto da IA | `lib/ia/retratoEmpresa.ts` |
| D3 | "Lucro X/mês" sem dizer que é média; caixa sem ressalva | Rótulos "Lucro médio (média de 12 meses…)" e "Caixa realizado até hoje (não desconta contas a pagar nem reservas)" + regra de semântica no prompt | `lib/ia/retratoEmpresa.ts`, `lib/ia/motor.ts` |
| E | Número vindo do navegador (contexto da tela, histórico) contava como conferido | Escalonamento preservado; nova contagem `valoresSemFonteServidor` (só retrato, economia e ferramentas contam como verificado), na auditoria e na resposta (`verificacao`) | `lib/ia/motor.ts`, `app/api/ia/motor/route.ts` |

## 3. Permissões por perfil (papéis reais do banco)

`empresa_usuarios.papel` aceita: `dono`, `admin`, `financeiro`, `contabil`, `leitor`, `operador`
(constraint `empresa_usuarios_papel_check`). "Sócio" e "CEO" são cargos da hierarquia da Equipe, não papéis.

| Papel | Inteligência financeira (texto e voz) | Base |
|---|---|---|
| Dono da empresa (com ou sem linha em `empresa_usuarios`) | sim | `empresas.user_id` |
| admin, financeiro, contabil, leitor (acesso válido) | sim, só leitura dos dados que a RLS já mostra | `empresas_do_usuario_operacional()` |
| operador | não — aviso "acesso de operador de caixa" | RLS exclui `papel = 'operador'` |
| suspenso / acesso vencido | não (empresa não encontrada → 404) | `suspenso_em`, `acesso_expira_em` |

Contador não tem acesso global: só às empresas em que é membro. A voz não concede permissão nenhuma a mais.
Ainda não há distinção de dado por papel dentro da inteligência (ex.: `contabil` só módulos contábeis) —
a RLS das tabelas é a mesma para todos os não-operadores; se o negócio quiser essa distinção, ela é mudança
de RLS (banco), fora da Fase 0.

## 4. Semântica das consultas financeiras

| Termo | Significado | Fonte |
|---|---|---|
| Faturamento | receita total do período pedido (sem período: dizer qual usou) | `receitas`; ferramenta `receitas_por_mes` |
| Lucro | o servidor só tem a **média mensal de 12 meses** (retrato); resposta diz "em média por mês". Resultado de um mês por competência = tela DRE (`lib/dreCompetencia.ts` roda só no navegador) | `lib/ia/retratoEmpresa.ts` |
| Caixa / saldo de caixa | caixa realizado até hoje (Fluxo realizado + PDV recebido); nunca "livre para gastar" | `lib/caixaSaldo.ts` |
| Contas a pagar | separar em aberto, vencido e próximos 30 dias | retrato + ferramenta `contas_a_pagar` |
| Sem registro | "não há registros de X no período" | — |
| Falha de leitura | "não foi possível consultar X agora" (nunca zero) | `leiturasFalhas`, `{"erro"}` das ferramentas |
| Valor não verificado | não é apresentado como confirmado; contado em `verificacao` | `conferirNumeros`, `contarSemFonteServidor` |

## 5. Custo e privacidade

- Saldo atual: `ia_consumir`/`ia_devolver` por empresa (tipos `openai`, `anthropic`, `nota`), cobrado antes da IA e devolvido se ela falhar (`lib/iaSaldo.ts`).
- Limite de taxa: 30 pedidos/min por IP em `/api/ia/*` (`middleware.ts`, em memória por instância — ver riscos).
- Proposta para voz (sem mudar schema nem planos agora): gravação de até **60 s** e **2 MB**; transcrição cobrada como 1 pergunta `openai`; botão "ouvir" (TTS) só sob clique; teto de 10 transcrições/min por pessoa.
- Fornecedor inicial: **OpenAI** (já integrada; transcrição cobrada por minuto). ElevenLabs só após comparativo de qualidade, latência, custo, privacidade e contrato (60 frases pt/en/es com valores, datas e nomes; vozes avaliadas às cegas).
- Privacidade: áudio descartado após transcrever; auditoria só com metadados (tela, duração, fornecedor, custo, latência, confirmou ou não).
- **Antes de ativar para clientes (jurídico, não feito nesta fase):** Política de Privacidade e Termos precisam citar o tratamento de voz, o fornecedor de transcrição como operador de dados (LGPD) e a não retenção do áudio.

## 6. Riscos remanescentes

1. Rate limit em memória por instância (várias instâncias = limite real maior). Correção definitiva é no banco.
2. DRE, obrigações MEI, tesouraria e conferência só rodam no navegador (`supabaseBrowser`); para a voz responder "lucro de setembro" é preciso refatorá-los para receber o cliente por parâmetro.
3. Retrato usa "hoje" de Brasília nas leituras paralelas: empresas do Acre/Amazonas podem divergir 1–2h perto da meia-noite (comentário `ponytail:` no código).
4. Escalonamento continua aceitando números do contexto da tela (decisão para não aumentar custo/latência das telas MEI); a verificação estrita está em `verificacao`.
5. Testes de rota com sessão real (usuário de outra empresa, operador real) dependem de 2 contas de teste — ver §7.

## 7. Testes

| Teste | Resultado (2026-10-15) |
|---|---|
| `npx tsx scripts/check-voz-fase0.mts` (novo: papel, custos vigente/encerrado/futuro/limites/ausente/falha, datas na virada de mês/ano e 29/02, fuso na meia-noite, verificação estrita, retrato com falha de leitura, empresa sem vínculo) | OK |
| `check-ia-motor`, `check-risco`, `check-regras-oficiais`, `check-dre-competencia`, `check-mei`, `check-mei-obrigacoes`, `check-guia-das`, `check-importar-nfe` | OK |
| `check-nexus-previsoes`, `check-nexus-simulacao`, `check-pdf-relatorio`, `check-manuais` | OK |
| `check-nexus-eventos`, `check-nexus-saude-fontes` | OK (corrigidos em 2026-10-15: rodam com `npx tsx`; régua mensal do teste alinhada à regra atual) |
| ESLint nas telas de IA | 0 erros (os 17 anteriores corrigidos em 2026-10-15) |
| `npx tsc --noEmit` | OK |
| `npx next build` | OK — 100/100 páginas (2026-10-15) |
| `npx tsx scripts/check-anti-falha.mts` | OK |
| Local (`next dev`): cabeçalhos | `permissions-policy: camera=(), microphone=(self), geolocation=()`; CSP com `media-src 'self' blob:`; X-Frame-Options, HSTS, nosniff e `frame-ancestors 'none'` intactos |
| Local: `POST /api/ia/motor` sem login | 401 |
| Não executado: operador real e usuário de outra empresa com sessão | precisa de contas de teste; roteiro: logar como operador e perguntar na IA Financeira (esperado: aviso de operador); logar na empresa A e chamar o motor com `empresa_id` da B (esperado: 404, saldo da B intacto) |

## 8. Próxima etapa

Fase 1 — botão de ditado (`components/BotaoVoz.tsx`) + `app/api/voz/transcrever` nos 8 módulos prioritários
(José, IA Financeira, IA Tributária, IA MEI Advisor, Contas a Pagar, Importar Documentos, PDV, Contas a Receber):
pedido de permissão só no clique, aviso claro de microfone negado/indisponível, 3 idiomas, 2 temas, saldo,
auditoria sem conteúdo e manuais atualizados.

## 9. Fase 1 — Ditado (implementada 2026-10-15, desligada para clientes)

| Peça | Arquivo | Função |
|---|---|---|
| Regra do servidor | `lib/voz/servidor.ts` (`processarDitado`) | login → parâmetros → liberação → arquivo → acesso (RLS via `ia_situacao`) → papel → saldo → transcrição → texto não vazio → **cobra 1** (`ia_consumir`) |
| Rota | `app/api/voz/transcrever/route.ts` | POST multipart (`audio`, `empresa_id`, `tela`, `lang`); GET `?empresa_id=` → `{ ativa }` |
| Gravador | `lib/voz/gravador.ts` (`GravadorVoz`, `juntarTexto`) | microfone só após clique; 60 s; 2 MB; para no silêncio (~2,5 s após falar); cancelar; microfone sempre liberado |
| Botão | `components/BotaoVoz.tsx` | toque para falar/parar ou segure e solte; tempo + nível do som; mensagens trilíngues; só PREENCHE o campo |
| Limite de pedidos | `middleware.ts` | 12 gravações/min por conexão (GET de liberação à parte) |
| Testes | `scripts/check-voz-fase1.mts` | 23 cenários do servidor, gravador simulado, 8 telas, chave/áudio/texto fora de logs |

**Liberação:** `VOZ_ATIVA=on` (todas) ou `VOZ_EMPRESAS_TESTE=uuid,uuid` (só internas). Sem variável = botão não aparece e a rota responde 403 `voz_desativada`.

**Modelo:** `whisper-1` com `verbose_json` (padrão; `VOZ_MODELO` troca) — único caminho em que a **duração vem do fornecedor**, então os 60 s são conferidos no servidor sem confiar no navegador. Dica de vocabulário financeiro por idioma.

**Cobrança (saldo comum, sem mudar banco/planos):** confere saldo antes (sem debitar); transcreve; só depois de texto válido chama `ia_consumir` **uma vez** (atômico no banco). Falha técnica, áudio vazio/longo/inválido, transcrição vazia, recusa de acesso: **não cobra**. Se o saldo acabar entre a conferência e a cobrança, o texto **não é entregue** (nem uso grátis, nem cobrança dupla). Limite conhecido: repetir manualmente o mesmo áudio cobra de novo (sem chave de idempotência no banco — exigiria schema); o botão fica bloqueado enquanto transcreve.

**Privacidade:** áudio só na memória do pedido; não vai a banco, storage, arquivo, log, Sentry ou PostHog; transcrição nunca vai à auditoria (só tela, idioma, código, cobrado, bytes, duração, modelo, ms). **Retenção no fornecedor:** pela API da OpenAI, até 30 dias em registros de monitoramento de abuso, salvo Zero Data Retention/Modified Abuse Monitoring aprovados pela OpenAI — por isso a função **não pode ser liberada a clientes** antes de `docs/PRIVACIDADE-VOZ-RASCUNHO.md` ser revisado e publicado (LEGAL-V01).

**Telas e campos:** José (pergunta); IA Financeira, IA Tributária, IA MEI Advisor (pergunta do chat); Contas a Pagar (pergunta ao CFO, descrição); Importar Documentos (descrição na edição da linha); PDV (busca de produto — único campo do caixa; operador pode usar só aqui); Contas a Receber (descrição, anotação da cobrança).

**Verificação manual pendente:** `docs/VOZ-FRASES-TESTE.md` (60 frases, NÃO executadas); Chrome/Edge/Firefox/Safari, Android e iPhone; microfone negado; tema Claro/Escuro em cada tela.

## 10. Referência internacional (pesquisa 2026-10-15)

| Fonte | Padrão | Como o Axioma aplica |
|---|---|---|
| Alipay + Banma (compra por voz no carro, 2026) | voz nunca executa pagamento sem **confirmação explícita**; risco e antifraude em camadas | voz só preenche; pessoa revisa e envia; nada financeiro automático |
| Alipay (ligação de verificação de identidade) | conversa de verificação **não é armazenada** | áudio descartado após transcrever |
| AliGenie (Alibaba) | impressão vocal + segundo fator para comprar | Axioma **não usa biometria de voz** (evita dado sensível; identidade = login) |
| ING (Inge) e BBVA/Garanti (MIA) | voz para consultar e iniciar; confiança do cliente é a barreira | Fase 1 só ditado; Fase 2 resposta falada; lançamento por voz só como rascunho |
| GDPR/UK GDPR | impressão vocal para identificar = dado biométrico de categoria especial | sem identificação por voz |
| Guias de interface de voz (VAD, push-to-talk) | sinal claro de microfone ativo; parar no silêncio; modo "segure para falar" | nível do som + tempo; parada por silêncio; toque ou segure-e-solte |

Fontes: SCMP (Alipay voice call); Fintech Hong Kong (Alipay in-car voice payments); Wikipedia (AliGenie); BBVA (Garanti MIA, Efma); Asian Banker/Emerj (ING Inge); OpenAI "Your data"; Picovoice (guia de VAD 2026).

## 11. Fase 2 — A voz responde (pedido do Elias em 2026-10-15)

Objetivo: depois que a IA pesquisa e responde (mesmo motor, mesmas regras e conferência de números), uma **voz natural lê a resposta**, e a pessoa pode responder falando — conversa por voz, sem perder o texto na tela.

1. `app/api/voz/falar/route.ts`: recebe o texto da resposta já gerada pelo motor (nunca texto livre do navegador sem passar pelo motor), com as mesmas travas (login, papel, saldo, liberação); devolve áudio em fluxo; nada guardado.
2. Botão "ouvir/parar" em cada resposta e modo **conversa** (após a resposta falada, o microfone reabre só com toque — nunca escuta escondido).
3. Ressalvas faladas: valor não confirmado e dado que não pôde ser lido são ditos em voz (campo `verificacao` do motor).
4. Comparativo antes de escolher a voz: OpenAI TTS × ElevenLabs, 10 respostas reais ouvidas às cegas pelo CEO (naturalidade pt-BR, latência para começar ≤ 3 s, custo/min, retenção e contrato LGPD).
5. Cobrança: decidir com o CEO (1 pergunta comum por resposta falada, ou cota própria — cota própria exige schema).
6. Privacidade: incluir a síntese de voz e o fornecedor escolhido no mesmo rascunho LEGAL-V01 antes de liberar.

### 11.1 Implementado em 2026-10-15 (desligado para clientes)

- `lib/voz/assinatura.ts` — o motor assina cada resposta (HMAC-SHA256, segredo `VOZ_SEGREDO` ou a chave de serviço; ligado à empresa).
- `lib/voz/fala.ts` + `app/api/voz/falar/route.ts` — login → liberação → fornecedor → assinatura → empresa (RLS) → papel → síntese em fluxo. Sem fornecedor: 409 `fala_no_aparelho`.
- `lib/voz/textoFala.ts` — tira markdown/emoji, corta em 3.800 caracteres no fim de frase, junta a ressalva trilíngue.
- `components/OuvirResposta.tsx` — botão Ouvir/Parar nas 4 telas de conversa; voz do servidor quando houver fornecedor e assinatura; senão (ou em falha) voz do aparelho (`speechSynthesis`, melhor voz natural do idioma, em frases curtas).
- Variáveis: `VOZ_FALA` (`elevenlabs` | `openai`), `ELEVENLABS_API_KEY`, `ELEVENLABS_VOZ_ID` (padrão: voz pré-pronta "George"), `ELEVENLABS_MODELO` (padrão `eleven_flash_v2_5`), `VOZ_FALA_OPENAI_VOZ` (padrão `onyx`, masculina), `VOZ_FALA_OPENAI_MODELO` (padrão `gpt-4o-mini-tts`).
- Custo de referência (pesquisa 2026-10-15, resposta típica ≈ 800 caracteres ≈ 50 s): voz do aparelho R$ 0; OpenAI gpt-4o-mini-tts ≈ US$ 0,015/min (≈ US$ 0,013 por resposta); ElevenLabs Flash v2.5 US$ 0,04/1.000 caracteres (≈ US$ 0,032 por resposta), plano grátis 10 mil créditos/mês e sem uso comercial; Google Neural2 US$ 16/milhão (1 milhão grátis/mês), Chirp 3 HD US$ 30/milhão (1 milhão grátis/mês).
- Pendente: comparativo às cegas com o CEO, decisão de cobrança (RNF-V08), LEGAL-V01 com o fornecedor de voz escolhido.


## 12. Diretor Financeiro Conversacional — Fases A, B e C (2026-10-16)

### 12.1 Fase A — diagnóstico do que existe (confirmado no código e no site)

| Peça | Situação real |
|---|---|
| Ditado | `components/BotaoVoz.tsx` + `lib/voz/gravador.ts` + `POST /api/voz/transcrever` (whisper-1). Grava no navegador, transcreve inteiro (sem streaming), só preenche o campo. |
| Fala | `POST /api/voz/falar` (OpenAI `gpt-4o-mini-tts` ou ElevenLabs Flash, por `VOZ_FALA`); sem fornecedor → voz do aparelho (`speechSynthesis`). Áudio inteiro (blob), não em fluxo. Hoje em produção: **sem fornecedor** (voz do aparelho). |
| Conversa | Não existia: ditar → revisar → enviar → tocar em Ouvir. Contexto = histórico de texto (8 falas) mandado pela tela; sem id de conversa. |
| Motor | Um só (`lib/ia/motor.ts`), com triagem, retrato, conferência de números e assinatura. **Ferramentas de consulta só no caminho Anthropic.** |
| Interrupção | O botão Parar já cortava o áudio de verdade; não havia como interromper falando nem cancelar pergunta em andamento (o José ficava preso em "pensando"). |

**Teste no site (empresa de teste, 16/10/2026, 9 perguntas em 4 roteiros, sem dado de cliente):** latência
total de 1,9 s a 6,1 s por resposta. Pergunta complementar ("E quanto disso está atrasado?"), correção ("Na
verdade, quero setembro") e simulação ("E se metade atrasar mais uma semana?", marcada "Cenário:")
funcionaram pelo histórico. Contratação: listou os dados que tem e o que falta. **Achado crítico (conferido
na auditoria): as 9 respostas vieram da OpenAI (gpt-4o / modelo de rotina) com 0 consultas — a Anthropic não
respondeu e a reserva não tinha ferramentas**; "esta semana" foi respondido com "próximos 30 dias" do
retrato. A OpenAI também devolvia `**` (markdown proibido no prompt).

### 12.2 Fase B — conversa contínua (implementado, só local)

- `lib/voz/reprodutor.ts`: **um reprodutor para a tela inteira** — uma resposta por vez; `pararFala()` pausa o
  `<audio>`, aborta o pedido ao servidor e cancela a voz do aparelho; resposta que chega depois de um parar é
  descartada (não fala sozinha); áudio já gerado é reaproveitado.
- O microfone **interrompe** a fala (`BotaoVoz` chama `pararFala()` ao começar a gravar).
- José: **"Conversa por voz"** (liga/desliga, só com voz liberada). Ligado: a fala vai direto como pergunta e o
  José responde falando; o microfone só reabre no toque. Desligado (padrão): igual à Fase 1.
- **Correção/cancelamento:** pergunta nova durante a análise abandona a anterior (AbortController); a resposta
  velha não aparece nem fala; a pergunta abandonada fica no histórico para o José entender a correção.
  Limitação: o servidor **termina e cobra** a pergunta abandonada (o motor não para no meio) — 1 pergunta a
  mais por correção feita durante a análise.
- Servidor: histórico limpo (`historicoSeguro`: só user/assistant, 8 falas, 4.000 caracteres cada);
  `conversa_id` (só agrupa na auditoria) e `correlacao` (auditoria + Sentry). Empresa e papel continuam vindo
  do servidor/RLS, nunca da tela. Sem tabela nova: **a conversa não é gravada** (memória só na tela).
- Já existia e foi conferido: 30 pedidos/min em `/api/ia/*` e 12/min nas rotas de voz (middleware), saldo de IA
  por empresa, operador bloqueado (403), assinatura da resposta.

### 12.3 Fase C — matriz de ferramentas

| Ferramenta | Responde | Fonte | Permissão | Regra | Limitação |
|---|---|---|---|---|---|
| `contas_a_receber` | quanto entra, atrasado, **esta semana** | `contas_receber` + `clientes` | RLS (não operador) | saldo = valor − recebido; vencidas / 7 / 30 dias / todas | sem previsão de atraso por cliente |
| `contas_a_pagar` | o que vence, atrasado, a quem deve | `contas_pagar` + `fornecedores` | idem | saldo = total − pago | — |
| `maiores_devedores` | inadimplência por cliente | `contas_receber` | idem | saldo aberto e vencido | — |
| `maiores_fornecedores` | concentração de compras | `contas_pagar` | idem | total lançado e aberto | — |
| `receitas_por_mes` | faturamento por mês (até 24) | `receitas` | idem | soma por mês no fuso da empresa | mês corrente parcial |
| `custos` | fixos vigentes / variáveis (média 12 m) | `custos_fixos`, `custos_variaveis` | idem | `soVigentes` | — |
| `dividas` | endividamento, ordem de quitação | `dividas` | idem | maior juro primeiro | — |
| `estoque_avisos` | ruptura, baixo, parado, custo subindo | `vw_estoque_avisos` | idem | flags da view | — |
| (retrato) | caixa realizado, lucro médio, alertas, risco | `lib/ia/retratoEmpresa.ts` | idem | `lib/caixaSaldo.ts` | caixa não é "livre para gastar" |
| **Faltam** | DRE de um mês por competência, obrigações fiscais por período, simulação de folha (salário + encargos) | regras ainda **só no navegador** (`dre/page.tsx`, `meiHelpers`) | — | precisam ir para `lib/` antes de virar ferramenta | não inventar resultado |

Entrou nesta fase: **a OpenAI usa as mesmas ferramentas** (`chamarOpenAIComFerramentas`: mesma leitura com
RLS, até 4 rodadas, a última obrigada a responder, pedido repetido não roda de novo, no máximo 8 consultas).
Cadeia: Claude (com ferramentas) → OpenAI forte (com ferramentas) → OpenAI forte (sem) → reserva. Situação
`proximos_7_dias` ("esta semana") e período informado na saída das contas. Markdown removido da resposta
(`limparFormato`) antes da assinatura.

Testes: `npx tsx scripts/check-voz-faseB.mts` (simulados). **Ainda não provado (precisa do site):** consultas
reais da OpenAI com os dados da empresa de teste, som e latência da fala no aparelho, captação do microfone.
Exige publicar (prévia ou produção) — aguardando o CEO.

### 12.4 Próximo passo recomendado

1. Autorizar uma publicação de prévia para repetir os 4 roteiros com as ferramentas (medir consultas e latência).
2. Ligar a Anthropic (José, IA Financeira e Tributária foram feitas para ela) ou aceitar a OpenAI como principal.
3. Fase D (resumo falado curto + detalhe na tela) e Fase E (comparativo OpenAI Realtime × Gemini Live × Qwen
   Omni × ElevenLabs). O motor atual não é de tempo real; migrar exigiria refazer a conferência de números em
   fluxo, por isso só depois do comparativo.

## 13. Fase D — Validação financeira rigorosa e preparação para tempo real (2026-10-16)

### 13.1 Diagnóstico antes das alterações

| # | Onde | Problema |
|---|---|---|
| D1 | `perguntarAoMotor` → nível rotina | O modelo barato **nunca tinha ferramentas**: "quanto recebo esta semana?" era respondido com o resumo (30 dias). |
| D2 | `chamarClaude` / `chamarOpenAIComFerramentas` | `tool_choice: auto` — o modelo podia responder sem consultar mesmo quando a pergunta pedia dado. |
| D3 | Cadeia de reserva | Claude (com ferramentas) → OpenAI forte (com, desde a Fase C) → OpenAI forte **sem** → reserva **sem**: as duas últimas respondem só com o resumo, sem aviso. |
| D4 | Falha de ferramenta | `{"erro"}` ia para o modelo, mas nada garantia que a pessoa soubesse; o aviso de valor não conferido só existia **na voz**, não no texto. |
| D5 | Conferência de números | Só confere R$; datas, percentuais e quantidades não são conferidos. |
| D6 | Histórico | Valores de respostas anteriores contam como "conferidos" (vêm do navegador); só a métrica `sem_fonte_servidor` os separa. |
| D7 | Auditoria | Não registrava quais ferramentas rodaram, se falharam, a latência nem "respondeu sem consultar". |
| D8 | Rota do motor | Leitura do papel que **falhava virava "dono"** (passava); empresa alheia recebia "o saldo de IA acabou" (402, mensagem errada — conferido no site em 16/10). |
| D9 | Cobrança | Pergunta abandonada pelo navegador (correção) segue processada e cobrada (limitação da Fase B). |

### 13.2 Correções (local, sem deploy)

- **Consulta obrigatória** (`exigeConsulta`, `lib/ia/motor.ts`): pergunta sobre receber/pagar/vencidos/devedores/fornecedores/dívidas/estoque/custos/faturamento/mês/semana (pt/en/es) — ou continuação curta de uma pergunta assim ("e quanto disso…", "na verdade, setembro") — obriga o modelo a consultar na 1ª rodada (OpenAI `required`, Claude `any`). Pergunta geral ("o que é EBITDA?", "obrigado") não força.
- **Rotina com ferramentas**: quando a pergunta exige dado, o modelo barato também consulta (antes só o resumo).
- **Registro de consultas** (`RegistroFerramenta`: nome, ok/vazio/erro, ms) e **avisos fixos no fim do texto**, independentes do modelo: consulta que falhou ("não foi possível consultar agora: contas a receber… não são zero"); pergunta de dado respondida sem nenhuma consulta bem-sucedida; R$ não encontrado no que o servidor leu. A voz não repete o aviso.
- **Prompt**: número só do retrato ou de consulta feita agora; histórico serve para entender, não como dado; correção = consultar de novo; erro ≠ vazio; dizer o período; DRE mensal, impostos de um período e folha **não têm ferramenta** — dizer isso, mostrar o que há e indicar a tela; cálculo/simulação marcados com conta e fonte.
- **Rota** (`lib/ia/rotaMotor.ts`, testável): acesso pela RLS (`ia_situacao`) **antes** de cobrar → empresa alheia = 404 sem cobrança; papel ilegível = 503 (não vira dono); devolução do saldo no máximo 1 vez.
- **Auditoria** (`nexus_audit_log`, sem conteúdo): `exige_consulta`, `ferramentas[]` (nome/status/ms), `sem_consulta_exigida`, `latencia_ms`, `cobrado`, `conversa_id`, `correlacao`.

### 13.3 Testes

`npx tsx scripts/check-voz-faseD.mts` — casos 1–7 (consulta obrigatória pt/en/es, continuação, correção, simulação), consulta forçada só quando exige, 11–12 (erro ≠ vazio ≠ zero, avisos), 7–10 (regras no prompt), 13–15 (outra empresa, operador, falha de leitura, saldo, devolução única), 16 em `check-voz-faseB`. Caso 5 (custos vigentes) em `check-voz-fase0`.
**Pendente (exige IA real):** o que o modelo efetivamente escreve nos casos 7–10 e a taxa real de consultas — rodar os roteiros na prévia logada (login por e-mail/senha; "Entrar com Google" volta ao site principal). Operador real: precisa de um usuário operador de teste.

### 13.4 Voz em tempo real — comparação (consultado em 16/10/2026; preços de tabela, não garantidos)

Premissas: áudio de entrada ≈ 600 tokens/min (OpenAI) e 25 tokens/s (Google, informado pelo fornecedor); saída ≈ 1.200 tokens/min (OpenAI, estimativa de mercado); conversa equilibrada (metade fala a pessoa, metade a IA). Tempo real **reenvia o contexto a cada turno** (parte com preço de cache), então o custo cresce com a duração da sessão.

| | OpenAI Realtime (`gpt-realtime-2.1-mini`) | Gemini Live (`gemini-3.8-live` / `3.1-flash-live`) | Qwen Omni Realtime (`qwen3.8-omni-flash-realtime`) |
|---|---|---|---|
| Preço oficial | áudio US$ 10 entrada / 0,30 cache / 20 saída por 1M tokens | áudio US$ 3 / 12 por 1M (US$ 0,005/min entrada, 0,018/min saída) | áudio US$ 0,93 / 1,87 por 1M (Singapura); saída cobra áudio **e** texto |
| Estimativa/min de conversa | ~US$ 0,015–0,03 | ~US$ 0,012 | < US$ 0,005 (tokens/s não informado) |
| Grátis para testar | não | **sim** (dados do plano grátis usados para melhorar o produto — só dado sintético) | 1M tokens por 90 dias |
| Ferramentas | sim | sim | sim (conferir no teste) |
| Turnos/interrupção | VAD no servidor, interrupção nativa | VAD automático, interrupção nativa | VAD no servidor |
| Conexão | WebRTC, WebSocket, SIP; token efêmero | WebSocket; token efêmero | WebSocket |
| Português BR | bom (conhecido) | a medir | a medir |
| Privacidade | contrato que já usamos; retenção até 30 dias salvo ZDR | pago: não treina; grátis: treina | dados em Singapura/China — exige análise LGPD |
| Complexidade | média (mesmo fornecedor) | média | alta (conta e região novas) |

`gpt-realtime-mini` (página oficial sem preço de áudio) aparece como modelo anterior do 2.1-mini.

### 13.5 Prova de conceito proposta (próxima fase, não implementada)

**Ouvido e boca em tempo real; cérebro continua sendo o motor do Axioma.**
1. Botão "Iniciar conversa" (sem palavra-chave, sem microfone permanente): o servidor confere login, papel, liberação e saldo e entrega um **token efêmero** (a chave nunca vai ao navegador).
2. A sessão de tempo real recebe **uma única ferramenta**: `perguntar_ao_axioma(pergunta)`. Instrução: qualquer dado da empresa só por essa ferramenta; falar os números exatamente como vieram.
3. A ferramenta chama `/api/ia/motor` com a sessão do usuário (RLS, consulta obrigatória, avisos, assinatura) e devolve a resposta; o modelo de voz só a fala.
4. Conferência depois da fala: a transcrição do que a voz disse é comparada com os R$ da resposta do motor; divergência → aviso na tela.
5. Limites: sessão de até 10 min, encerra após 60 s de silêncio, indicador de microfone sempre visível, auditoria por sessão (minutos, consultas, sem áudio/texto).
6. Comparar OpenAI 2.1-mini × Gemini Live com os mesmos 4 roteiros: latência até começar a falar, acerto de números/datas falados, interrupção, custo por sessão.

**Critérios de aceitação da PoC:** latência até a 1ª palavra ≤ 1,5 s; 100% dos valores falados iguais aos do motor nos roteiros; interrupção corta a fala em ≤ 300 ms; nenhuma consulta fora do motor; custo medido por sessão; nada ligado para clientes antes de LEGAL-V01.
**Decisões do CEO antes de começar:** créditos (OpenAI ~US$ 10; Google pode começar no grátis só com dados de teste), cobrança por minuto de conversa (precisa de regra de saldo), fornecedor para a Política de Privacidade.


## 14. Prova de conceito — Conversa ao vivo (2026-10-16, local, desligada sem variável)

Ouvido e boca em tempo real; **cérebro = motor do Axioma** (uma única ferramenta `perguntar_ao_axioma`, atendida
pelo navegador chamando `/api/ia/motor` com a sessão do usuário — RLS, consulta obrigatória, avisos, saldo).

| Peça | Arquivo |
|---|---|
| Regras (liberação, início, instruções do José, configuração) | `lib/voz/tempoReal/servidor.ts` |
| Rotas | `app/api/voz/tempo-real/route.ts` (GET liberados, POST início, PUT métricas do fim), `app/api/voz/tempo-real/sdp/route.ts` (ponte SDP do Qwen) |
| Navegador | `lib/voz/tempoReal/cliente.ts` (Gemini por WebSocket + PCM; Qwen por WebRTC), `components/ConversaAoVivo.tsx` (painel no José) |
| Testes | `npx tsx scripts/check-voz-tempo-real.mts` |

- **Gemini Live:** o servidor cria um **token efêmero de 1 uso** (começa em até 60 s, vale 11 min) com a
  configuração inteira **travada** (modelo, instruções, ferramenta, voz `Charon`) — corrige a falha pública de
  2026 com tokens sem restrição. Endpoint `v1beta ...BidiGenerateContentConstrained?access_token=` (trocável por
  `GEMINI_LIVE_WS`). Modelo `GEMINI_LIVE_MODELO` (padrão `gemini-3.1-flash-live-preview`).
- **Qwen Omni Realtime:** WebRTC; a troca SDP passa por `/api/voz/tempo-real/sdp` (chave só no servidor). Host
  `QWEN_REALTIME_HOST` (padrão `dashscope-intl.aliyuncs.com`, Singapura — **a confirmar no painel da Alibaba**),
  modelo `QWEN_REALTIME_MODELO` (padrão `qwen3.8-omni-flash-realtime`), voz `QWEN_VOZ` (se não existir, volta à padrão).
  Limitação: a configuração da sessão é enviada pelo navegador (a pessoa pode alterar a própria sessão, mas a
  única ferramenta continua sendo o motor com a permissão dela — sem ganho de acesso).
- **Ligar (só Preview):** `VOZ_TEMPO_REAL=gemini,qwen` + `GEMINI_API_KEY` e/ou `QWEN_API_KEY` + empresa em
  `VOZ_EMPRESAS_TESTE`. CSP: `connect-src` passou a aceitar `wss://generativelanguage.googleapis.com`.
- **Comportamento:** abre só no toque; "microfone aberto" visível; interrupção falando por cima (Gemini:
  `interrupted` corta a fila; Qwen: `response.cancel`); fim em 60 s de silêncio ou 10 min; falas vão para o chat;
  a resposta do motor vem curta (até 4 frases) para ser falada; métricas no fim (duração, tokens, consultas,
  latência da 1ª resposta, motivo) sem áudio/texto.
- **Cobrança:** abrir a sessão não cobra; cada consulta ao motor cobra 1 pergunta (como no chat). O custo de
  minutos do fornecedor é do Axioma — decidir regra antes de clientes.
- **Pendente (precisa de chave e aparelho):** voz e português reais, latência, WebRTC do Qwen de ponta a ponta,
  conferência automática dos valores falados (transcrição × resposta do motor).


### 14.1 Conversa ao vivo nas 4 IAs e fora da tela (2026-10-16)

- Telas: `nexus` (José), `ia-financeira`, `ia-tributaria`, `mei-ia-advisor` — identidade da Opção A (`lib/ia/identidade.ts`) na
  instrução travada no token; o José mantém o texto aprovado.
- `lib/voz/tempoReal/sessaoGlobal.ts`: a sessão vive fora da tela; a tela aberta recebe as falas (as pendentes chegam ao
  voltar) e pode dar uma consulta mais rica; com a tela fechada a consulta usa o mesmo motor com o histórico da conversa.
- `components/BarraVozGlobal.tsx` no layout interno: microfone aberto, estado, última fala, Voltar à conversa, Encerrar; também
  aparece quando o botão Ouvir está lendo (Parar). Testes em `scripts/check-voz-tempo-real.mts`.
