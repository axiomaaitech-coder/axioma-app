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
- Variáveis: `VOZ_FALA` (`elevenlabs` | `openai`), `ELEVENLABS_API_KEY`, `ELEVENLABS_VOZ_ID` (padrão: voz pré-pronta "George"), `ELEVENLABS_MODELO` (padrão `eleven_flash_v2_5`), `VOZ_FALA_OPENAI_VOZ` (padrão `coral`), `VOZ_FALA_OPENAI_MODELO` (padrão `gpt-4o-mini-tts`).
- Custo de referência (pesquisa 2026-10-15, resposta típica ≈ 800 caracteres ≈ 50 s): voz do aparelho R$ 0; OpenAI gpt-4o-mini-tts ≈ US$ 0,015/min (≈ US$ 0,013 por resposta); ElevenLabs Flash v2.5 US$ 0,04/1.000 caracteres (≈ US$ 0,032 por resposta), plano grátis 10 mil créditos/mês e sem uso comercial; Google Neural2 US$ 16/milhão (1 milhão grátis/mês), Chirp 3 HD US$ 30/milhão (1 milhão grátis/mês).
- Pendente: comparativo às cegas com o CEO, decisão de cobrança (RNF-V08), LEGAL-V01 com o fornecedor de voz escolhido.

