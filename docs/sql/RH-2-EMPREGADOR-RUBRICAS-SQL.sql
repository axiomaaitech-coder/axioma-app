-- RH · Fase 1 · Subfase 2 — Empregador (S-1000) e verbas da folha (S-1010) — 2026-11-08
-- Campos, tamanhos e valores copiados do leiaute oficial: eSocial S-1.3, NT 07/2026 rev. 20/10/2026
-- (gov.br/esocial · leiaute index.html e tabelas.html). Só CRIA coisas novas.
-- Rodar os blocos na ordem; depois RH-2-TESTE-EMPREGADOR-RUBRICAS-SQL.sql (esperado falhas=0).
-- Regras do leiaute que dependem da natureza jurídica (cooperativa, órgão público, CNPJ completo) NÃO são
-- conferidas aqui, porque o Axioma ainda não guarda a natureza jurídica. Ficam para o contador conferir.

-- ═════ BLOCO 1 — tabelas oficiais de referência (iguais para todas as Empresas, só leitura) ═════
-- A Tabela 03 tem versões: o mesmo código pode ter um texto até 31/12/2025 e outro a partir de 2026.
create table if not exists public.esocial_tab03_natureza_rubrica (
  codigo text not null check (codigo ~ '^[0-9]{4}$'),
  nome text not null, descricao text, inicio date not null, termino date,
  primary key (codigo, inicio),
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 03'
);
create table if not exists public.esocial_tab08_class_trib (
  codigo text primary key check (codigo ~ '^[0-9]{2}$'),
  descricao text not null,
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 08'
);
create table if not exists public.esocial_tab21_inc_irrf (
  codigo text primary key check (codigo ~ '^[0-9]{1,4}$'),
  descricao text not null, inicio date, termino date,
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 21'
);
alter table public.esocial_tab03_natureza_rubrica enable row level security;
alter table public.esocial_tab08_class_trib enable row level security;
alter table public.esocial_tab21_inc_irrf enable row level security;
drop policy if exists le on public.esocial_tab03_natureza_rubrica;
create policy le on public.esocial_tab03_natureza_rubrica for select to authenticated using (true);
drop policy if exists le on public.esocial_tab08_class_trib;
create policy le on public.esocial_tab08_class_trib for select to authenticated using (true);
drop policy if exists le on public.esocial_tab21_inc_irrf;
create policy le on public.esocial_tab21_inc_irrf for select to authenticated using (true);
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — conteúdo oficial das tabelas 03, 08 e 21 ═════
insert into public.esocial_tab03_natureza_rubrica (codigo, nome, descricao, inicio, termino) values
('1000','Salário, vencimento, soldo','Corresponde ao salário básico contratual do empregado contratado de acordo com a CLT e o vencimento mensal do servidor público e do militar','2014-01-01',null),
('1001','Subsídio','Corresponde à remuneração paga na forma de subsídio','2014-01-01',null),
('1002','Descanso semanal remunerado - DSR','Valor correspondente a um dia de trabalho incidente sobre as verbas de natureza variável, tais como: horas extras, adicional noturno, produção, comissão, etc.','2014-01-01','2024-04-30'),
('1003','Horas extraordinárias','Valor correspondente à hora extraordinária de trabalho, acrescido de percentual de no mínimo 50%','2014-01-01',null),
('1004','Horas extraordinárias - Banco de horas','Valor correspondente a pagamento das horas extraordinárias, inicialmente destinadas para o banco de horas e que não foram compensadas','2014-01-01',null),
('1005','Direito de arena','Valores relativos a direito de arena decorrente do espetáculo, devidos ao atleta','2014-01-01',null),
('1006','Intervalos intra e inter jornadas não concedidos','Valores relativos a intervalos não concedidos de intrajornada ou interjornada','2014-01-01',null),
('1007','Luvas e premiações','Valores correspondentes a prêmios e luvas, devidos ao atleta','2014-01-01',null),
('1009','Salário-família - Complemento','Valor excedente ao do fixado pela previdência social para o salário-família','2014-01-01',null),
('1010','Salário in natura - Pagos em bens ou serviços','Salário in natura , também conhecido por salário utilidade, correspondente a remunerações pagas em bens ou serviços','2014-01-01',null),
('1011','Sobreaviso e prontidão','Valor correspondente a um percentual da hora normal de trabalho','2014-01-01',null),
('1012','Descanso semanal remunerado - DSR e feriado','Valores correspondentes a DSR e feriado: a) devidos a trabalhadores cuja remuneração não inclua o pagamento do descanso semanal remunerado (horistas, diaristas, semanalistas etc.); b) incidentes sobre parcelas salariais de natureza variável, tais como tarefa, horas extras, adicional noturno, produção, comissão etc.; c) devidos a trabalhadores que prestaram serviços nos dias de repouso semanal e feriado','2014-01-01',null),
('1015','Adiantamento de férias','Valor correspondente ao pagamento do adiantamento da remuneração de férias, inclusive do terço constitucional','2014-01-01',null),
('1016','Férias','Valor correspondente à remuneração devida na época da concessão das férias, inclusive o adiantamento de férias. Nessa natureza deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de férias','2014-01-01','2025-12-31'),
('1016','Férias','Valor correspondente à remuneração devida na época da concessão das férias. Nessa natureza deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de férias','2026-01-01',null),
('1017','Terço constitucional de férias','Valor correspondente ao terço constitucional de férias relativo à remuneração devida na época da concessão das férias, inclusive o adiantamento de férias. Nessa natureza deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de terço constitucional de férias','2014-01-01','2025-12-31'),
('1017','Terço constitucional de férias','Valor correspondente ao terço constitucional de férias relativo à remuneração devida na época da concessão das férias. Nessa natureza deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de terço constitucional de férias','2026-01-01',null),
('1018','Férias - Abono ou gratificação de férias superior a 20 dias','Remuneração a título de abono de férias, desde que excedente a 20 (vinte) dias do salário e concedido em virtude de cláusula contratual, do regulamento da empresa, de convenção ou acordo coletivo, como por exemplo, o art. 144 da CLT','2014-01-01',null),
('1019','Terço constitucional de férias - Abono ou gratificação de férias superior a 20 dias','Terço constitucional de férias incidente sobre remuneração a título de abono de férias, desde que excedente a 20 (vinte) dias do salário e concedido em virtude de cláusula contratual, do regulamento da empresa, de convenção ou acordo coletivo, como por exemplo, o art. 144 da CLT','2014-01-01',null),
('1020','Férias','Valor correspondente à remuneração a que faz jus na época da concessão das férias e o adicional constitucional a que o trabalhador adquiriu direito, inclusive o adiantamento de férias, quando pagas antecipadamente – nessa opção deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de férias','2014-01-01','2023-04-30'),
('1021','Férias - Abono ou gratificação de férias superior a 20 dias','Remuneração a título de abono de férias, desde que excedente a 20 (vinte) dias do salário e concedido em virtude de cláusula contratual, do regulamento da empresa, de convenção ou acordo coletivo, como por exemplo, o art. 144 da CLT','2014-01-01','2023-04-30'),
('1022','Férias - Abono ou gratificação de férias não excedente a 20 dias','Remuneração a título de abono de férias, incluído o terço constitucional de férias, desde que não excedente a 20 (vinte) dias do salário e concedido em virtude de cláusula contratual, do regulamento da empresa, de convenção ou acordo coletivo, como por exemplo o art. 144 da CLT','2014-01-01',null),
('1023','Férias - Abono pecuniário','Valor correspondente a conversão em dinheiro de parte dos dias de férias a que o trabalhador adquiriu direito, inclusive o adicional constitucional','2014-01-01',null),
('1024','Férias - Dobro na vigência do contrato','Valor correspondente a remuneração a que faz jus na época da concessão das férias, concedidas após o prazo de concessão, inclusive o adicional constitucional','2014-01-01',null),
('1040','Licença-prêmio','Valor relativo a licença-prêmio, em decorrência de afastamento do trabalho','2014-01-01',null),
('1041','Licença-prêmio indenizada','Valor correspondente à conversão em dinheiro da licença-prêmio','2014-01-01',null),
('1050','Remuneração de dias de afastamento','Remuneração de dias nos quais o trabalhador esteja afastado do trabalho sem prejuízo de sua remuneração','2014-01-01',null),
('1080','Stock option','Remuneração pelo exercício de opção de compra de ações da empresa','2014-01-01',null),
('1099','Outras verbas salariais','Outras verbas salariais/remuneratórias não previstas nos demais itens','2014-01-01',null),
('1201','Adicional de função / cargo confiança','Adicional ou gratificação concedida em virtude de cargo ou função de confiança','2014-01-01',null),
('1202','Adicional de insalubridade','Adicional por serviços em condições de insalubridade','2014-01-01',null),
('1203','Adicional de periculosidade','Adicional por serviços em condições perigosas','2014-01-01',null),
('1204','Adicional de transferência','Adicional em razão de transferência de trabalhador, enquanto durar a transferência','2014-01-01',null),
('1205','Adicional noturno','Adicional por trabalho em horário noturno','2014-01-01',null),
('1206','Adicional por tempo de serviço','Adicional em virtude do tempo de serviço (anuênio, quinquênio, etc.)','2014-01-01',null),
('1207','Comissões, porcentagens, produção','Valor correspondente a contraprestação de serviço, normalmente baseada em um percentual sobre as vendas totais desse trabalhador','2014-01-01',null),
('1208','Gueltas ou gorjetas - Repassadas por fornecedores ou clientes','Valores pagos diretamente por fornecedores a trabalhador a título de incentivos de vendas (gueltas) ou por clientes a título de recompensa por bons serviços prestados (gorjetas)','2014-01-01',null),
('1209','Gueltas ou gorjetas - Repassadas pelo empregador','Valores pagos relativos a gueltas ou gorjetas, por meio de repasse ao empregador','2014-01-01',null),
('1210','Gratificação por acordo ou convenção coletiva','Verba estabelecida em acordo ou convenção coletiva de trabalho','2014-01-01',null),
('1211','Gratificações','Verba não estabelecida em acordo ou convenção coletiva, mas paga para o empregado em decorrência de ajuste entre as partes ou por liberalidade do empregador, como por exemplo produtividade, assiduidade, etc.','2014-01-01',null),
('1212','Gratificações ou outras verbas de natureza permanente','Órgão público - Parcelas remuneratórias reconhecidamente inerentes às funções do cargo efetivo, cujo valor integra a remuneração do cargo efetivo','2014-01-01',null),
('1213','Gratificações ou outras verbas de natureza transitória','Órgão público - Parcelas remuneratórias vinculadas à atividade cujo recebimento dependa de avaliação de desempenho ou determinadas condições','2014-01-01',null),
('1214','Adicional de penosidade','Adicional pela realização de atividade árdua que exija do trabalhador esforço, atenção ou vigilância acima do comum','2014-01-01',null),
('1215','Adicional de unidocência','Adicional de unidocência para professores de 1ª a 4ª série','2014-01-01',null),
('1216','Adicional de localidade','Adicional pela realização de atividade em localidade transfronteiriça','2014-01-01',null),
('1217','Gratificação de curso/concurso','Verba de natureza remuneratória por atividade exercida em curso/concurso','2014-01-01',null),
('1225','Quebra de caixa','Valor destinado a cobrir os riscos assumidos por quem trabalha com manuseio de valores, para compensar eventuais descontos ou diferenças de numerários','2014-01-01',null),
('1230','Remuneração do dirigente sindical','Remuneração paga ao trabalhador afastado, durante o exercício da atividade sindical','2014-01-01',null),
('1299','Outros adicionais','Valores relativos a outros adicionais não previstos nos demais itens','2014-01-01',null),
('1300','PLR - Participação em Lucros ou Resultados','Valor correspondente a participação em lucros ou resultados da empresa, de acordo com lei específica','2014-01-01',null),
('1350','Bolsa de estudo - Estagiário','Valor devido ao estagiário em atividades práticas de complementação do currículo escolar, inclusive os valores pagos a título de recesso remunerado - Lei 11.788/2008','2014-01-01',null),
('1351','Bolsa de estudo - Médico residente','Bolsa de estudo ao médico residente','2014-01-01',null),
('1352','Bolsa de estudo ou pesquisa','Remuneração a professores, pesquisadores e demais profissionais com a finalidade de estudos ou pesquisa, exceto pagamentos a estagiário e médico-residente','2014-01-01',null),
('1401','Abono','Qualquer abono concedido de forma espontânea ou em virtude de acordo ou convenção coletiva, norma, etc.','2014-01-01',null),
('1402','Abono PIS/PASEP','Abono e/ou rendimento do PIS/PASEP repassado pelo empregador ou órgão público','2014-01-01',null),
('1403','Abono legal','As importâncias recebidas a título de ganhos eventuais e os abonos expressamente desvinculados do salário, por força da lei','2014-01-01',null),
('1404','Auxílio babá','Valor relativo a reembolso de despesas com babá, limitado ao menor salário de contribuição mensal e condicionado à comprovação do registro na carteira de trabalho e previdência social da empregada, do pagamento da remuneração e do recolhimento da contribuição previdenciária, pago em conformidade com a legislação trabalhista, observado o limite máximo de 6 (seis) anos de idade da criança (caso haja previsão em acordo coletivo da categoria, este limite de idade poderá ser maior)','2014-01-01',null),
('1405','Assistência médica','Valor pago diretamente ao trabalhador a título de assistência médica ou odontológica, inclusive o reembolso de despesas com medicamentos, óculos, aparelhos ortopédicos, despesas médico-hospitalares e outras similares','2014-01-01',null),
('1406','Auxílio-creche','O reembolso creche pago em conformidade com a legislação trabalhista, observado o limite máximo de 6 (seis) anos de idade da criança, quando devidamente comprovadas as despesas realizadas. Caso haja previsão em acordo coletivo da categoria, este limite de idade poderá ser maior.','2014-01-01',null),
('1407','Auxílio-educação','Valor relativo a plano educacional, ou bolsa de estudo, que vise à educação básica de trabalhadores e seus dependentes e, desde que vinculada às atividades desenvolvidas pela empresa, à educação profissional e tecnológica de trabalhadores, nos termos da Lei 9.394/1996, e: 1) não seja utilizado em substituição de parcela salarial; 2) o valor mensal do plano educacional ou bolsa de estudo, considerado individualmente, não ultrapasse 5% (cinco por cento) da remuneração do segurado a que se destina ou o valor correspondente a uma vez e meia o valor do limite mínimo mensal do salário de contribuição, o que for maior','2014-01-01',null),
('1409','Salário-família','Valor do salário-família, conforme definição legal aplicável','2014-01-01',null),
('1410','Auxílio - Locais de difícil acesso','Valor correspondente a transporte, habitação e alimentação fornecido ao trabalhador contratado para prestar serviço em localidade distante da sua residência, em canteiro de obras ou local que, por força da atividade, exija deslocamento e estada','2014-01-01',null),
('1411','Auxílio-natalidade','Valor relativo ao nascimento do filho de servidor público, previsto em lei','2014-01-01',null),
('1412','Abono permanência','Valor relativo ao abono de permanência, de acordo com a CF/1988','2014-01-01',null),
('1601','Ajuda de custo - Aeronauta','Adicional mensal recebidos pelo aeronauta, nos termos da Lei 5.929/1973','2014-01-01',null),
('1602','Ajuda de custo de transferência','Ajuda de custo em parcela única, em razão de transferência de local de trabalho','2014-01-01',null),
('1603','Ajuda de custo','Ajuda de custo paga ao trabalhador','2018-05-01',null),
('1604','Ajuda de custo - Acima de 50% da remuneração mensal','Ajuda de custo paga ao trabalhador, superior a 50% da sua remuneração mensal','2018-05-01','2019-03-31'),
('1619','Ajuda compensatória - Programa Emergencial de Manutenção do Emprego e da Renda','Ajuda compensatória paga pelo empregador ao empregado durante período de suspensão do contrato de trabalho ou redução proporcional de salário e jornada','2020-04-01',null),
('1620','Ressarcimento de despesas pelo uso de veículo próprio','Ressarcimento de despesas ao trabalhador, pela utilização de veículo de sua propriedade','2014-01-01',null),
('1621','Ressarcimento de despesas de viagem, exceto despesas com veículos','Ressarcimento de despesas pagas com recursos do trabalhador em viagens a trabalho','2014-01-01',null),
('1623','Ressarcimento de provisão','Ressarcimento de desconto efetuado em recibos de férias relativo a provisão de contribuição previdenciária','2014-01-01',null),
('1629','Ressarcimento de outras despesas','Ressarcimento de outras despesas pagas pelo trabalhador, não previstas nos demais itens','2014-01-01',null),
('1650','Diárias de viagem','Diárias de viagem ao trabalhador','2018-05-01',null),
('1651','Diárias de viagem - Até 50% do salário','Diárias de viagem ao trabalhador, desde que não exceda a 50% do seu salário-base mensal','2014-01-01','2018-04-30'),
('1652','Diárias de viagem - Acima de 50% do salário','Diárias de viagem superior a 50% do salário-base mensal','2014-01-01','2018-04-30'),
('1799','Alimentação concedida em pecúnia com caráter indenizatório','Auxílio-alimentação ou alimentação concedida sob a forma de pecúnia com natureza indenizatória por força de lei','2014-01-01',null),
('1800','Alimentação concedida em pecúnia','Alimentação concedida sob a forma de pecúnia','2014-01-01','2025-12-31'),
('1800','Alimentação concedida em pecúnia com caráter salarial','Alimentação concedida sob a forma de pecúnia com natureza salarial','2026-01-01',null),
('1801','Alimentação','Auxílio-alimentação','2014-01-01','2021-06-30'),
('1802','Etapas (marítimos)','Auxílio-alimentação ao trabalhador marítimo','2014-01-01',null),
('1805','Moradia','Auxílio-moradia','2014-01-01',null),
('1806','Alimentação em ticket ou cartão, vinculada ao PAT','Alimentação concedida sob a forma de ticket ou cartão, por empresa vinculada ao Programa de Alimentação do Trabalhador - PAT','2014-01-01',null),
('1807','Alimentação em ticket ou cartão, não vinculada ao PAT','Alimentação concedida sob a forma de ticket ou cartão, por empresa não vinculada ao PAT','2014-01-01',null),
('1808','Cesta básica ou refeição, vinculada ao PAT','Alimentação concedida sob a forma de cesta básica ou refeição, por empresa vinculada ao PAT','2014-01-01',null),
('1809','Cesta básica ou refeição, não vinculada ao PAT','Alimentação concedida sob a forma de cesta básica ou refeição, por empresa não vinculada ao PAT','2014-01-01',null),
('1810','Transporte','Auxílio-transporte ou vale-transporte','2014-01-01','2025-12-31'),
('1810','Vale-transporte ou auxílio-transporte com caráter indenizatório','Vale-transporte ou auxílio-transporte com natureza indenizatória por força de lei','2026-01-01',null),
('1811','Auxílio-transporte ou auxílio-combustível com caráter salarial','Auxílio-transporte, pago em pecúnia ou de outra forma, com natureza salarial','2014-01-01',null),
('1899','Outros auxílios','Valores relativos a outros auxílios não previstos nos demais itens','2014-01-01',null),
('1901','Juros e/ou atualização monetária','Juros e/ou atualização monetária devidos pelo atraso no pagamento de valores por exercício de emprego, cargo ou função','2014-01-01',null),
('2501','Prêmios','Liberalidades concedidas pelo empregador em forma de bens, serviços ou valor em dinheiro a empregado ou a grupo de empregados, em razão de desempenho superior ao ordinariamente esperado no exercício de suas atividades','2014-01-01',null),
('2502','Liberalidades concedidas em mais de duas parcelas anuais','Liberalidades concedidas pelo empregador em forma de bens, serviços ou valor em dinheiro a empregado ou a grupo de empregados, em razão de desempenho superior ao ordinariamente esperado no exercício de suas atividades, em mais de duas parcelas anuais','2018-05-01','2019-03-31'),
('2510','Direitos autorais e intelectuais','Valor correspondente a participação em produção científica, intelectual ou artística','2014-01-01',null),
('2801','Quarentena remunerada','Valor equivalente a remuneração se em exercício estivesse, devida ao trabalhador desligado, em período de quarentena','2014-01-01',null),
('2901','Empréstimos','Empréstimos ao trabalhador para posterior desconto','2014-01-01',null),
('2902','Vestuário e equipamentos','Valor correspondente a vestuários, equipamentos e outros acessórios fornecidos ao trabalhador e utilizados no local de trabalho para prestação dos respectivos serviços','2014-01-01','2021-07-31'),
('2903','Vestuário e equipamentos','Valor correspondente a vestuários, equipamentos e outros acessórios quando esses se constituírem em salário utilidade','2014-01-01',null),
('2920','Reembolsos diversos','Valor relativo a reembolsos diversos referentes a descontos indevidos efetuados em competências anteriores','2014-01-01','2021-07-31'),
('2930','Insuficiência de saldo','Valor lançado em folha de pagamento para cobertura de excesso de descontos em relação a vencimentos, tanto o valor do vencimento no mês em que houver a insuficiência de saldo, como o respectivo desconto no(s) mês(es) posteriores','2014-01-01',null),
('2999','Arredondamentos','Valor lançado em folha de pagamento, não superior a 99 centavos, relativo a arrendamentos','2014-01-01',null),
('3501','Remuneração por prestação de serviços','Remuneração (inclusive adiantamentos) a contribuintes individuais, inclusive honorários, em trabalhos de natureza eventual e sem vínculo trabalhista','2014-01-01',null),
('3505','Retiradas (pró-labore) de diretores empregados','Pró-labore ou retirada (remuneração) a diretores empregados (CLT)','2014-01-01',null),
('3506','Retiradas (pró-labore) de diretores não empregados','Pró-labore ou retirada (remuneração) a diretores não empregados','2014-01-01',null),
('3508','Retiradas (pró-labore) de proprietários ou sócios','Pró-labore ou retirada (remuneração) a proprietários ou sócios da empresa','2014-01-01',null),
('3509','Honorários a conselheiros','Valor correspondente a honorários pagos a membros de conselho','2014-01-01',null),
('3510','Gratificação ( jeton )','Valor correspondente a gratificação ( jeton ) por comparecimento a sessões ou reuniões','2014-01-01',null),
('3511','Gratificação eleitoral','Valor correspondente ao exercício da atividade pelo juiz eleitoral','2014-01-01',null),
('3520','Remuneração de cooperado','Remuneração a cooperado vinculado a cooperativa de trabalho','2014-01-01',null),
('3525','Côngruas, prebendas e afins','Valores pagos a ministros de confissão religiosa e que independem de natureza e da quantidade do trabalho executado','2018-05-01',null),
('4010','Complementação salarial de auxílio-doença','Complementação salarial de auxílio-doença ao trabalhador afastado por acidente de trabalho ou por doença','2014-01-01',null),
('4011','Complemento de salário-mínimo - RPPS','Valor correspondente à diferença entre o salário-mínimo e o valor do vencimento do cargo efetivo pago a servidor público vinculado a Regime Próprio de Previdência Social - RPPS','2014-01-01',null),
('4050','Salário-maternidade','Remuneração mensal da trabalhadora empregada durante a licença maternidade, quando paga pelo contratante ou órgão público','2014-01-01',null),
('4051','Salário-maternidade - 13° salário','Valor correspondente ao 13° salário pago pelo contratante ou órgão público, no período de licença maternidade','2014-01-01',null),
('4052','Salário-paternidade','Remuneração mensal do trabalhador empregado durante a licença paternidade, quando paga pelo contratante ou órgão público','2026-12-01',null),
('4053','Salário-paternidade - 13° salário','Valor correspondente ao 13° salário pago pelo contratante ou órgão público, no período de licença paternidade','2026-12-01',null),
('5001','13º salário','Valor relativo ao 13° salário de trabalhador, inclusive as médias de 13° salário (horas extras, adicional noturno, etc.), exceto se relativo à primeira parcela ou se pago em rescisão contratual – nessa opção deve ser classificado também o valor pago mensalmente ao trabalhador avulso e ao empregado com contrato de trabalho intermitente, a título de 13° salário','2014-01-01',null),
('5005','13° salário complementar','Valor do 13° salário complementar relativo a diferenças apuradas não consideradas na folha de fechamento do 13° salário','2014-01-01',null),
('5501','Adiantamento de salário','Valor relativo a adiantamento, antecipação ou pagamento parcial de folha de salários','2014-01-01',null),
('5504','13º salário - Adiantamento','Valor relativo a adiantamento do 13° salário','2014-01-01',null),
('5510','Adiantamento de benefícios previdenciários','Valor relativo a adiantamento de benefícios a serem pagos pela Previdência Social Oficial','2014-01-01',null),
('6000','Saldo de salários na rescisão contratual','Valor correspondente aos dias trabalhados no mês da rescisão contratual','2014-01-01',null),
('6001','13º salário relativo ao aviso prévio indenizado','Valor correspondente ao 13° salário incidente sobre o aviso prévio indenizado','2014-01-01',null),
('6002','13° salário proporcional na rescisão','Valor correspondente ao 13° salário proporcional pago na rescisão do contrato de trabalho, exceto o pago sobre o aviso prévio indenizado','2014-01-01',null),
('6003','Indenização compensatória do aviso prévio','Valor da maior remuneração do trabalhador, correspondente ao número de dias relativo ao aviso prévio, calculado de acordo com o tempo de serviço do empregado','2014-01-01',null),
('6004','Férias - Dobro na rescisão','Valor correspondente a remuneração a que faz jus a época da rescisão contratual, correspondente a férias não concedidas no prazo legal, inclusive o adicional constitucional','2014-01-01',null),
('6006','Férias proporcionais','Valor correspondente a 1/12 avos da remuneração a que faz jus a época da rescisão contratual, fração superior a 14 dias por mês de trabalho e a projeção do aviso prévio indenizado, inclusive o adicional constitucional','2014-01-01',null),
('6007','Férias vencidas na rescisão','Valor correspondente a remuneração a que faz jus a época da rescisão contratual, correspondente a férias vencidas, mas dentro do prazo concessivo, inclusive o adicional constitucional','2014-01-01',null),
('6101','Indenização compensatória - Multa rescisória 20 ou 40% (CF/88)','Valor correspondente à indenização por demissão sem justa causa, por culpa recíproca ou força maior (ambas reconhecidas pela Justiça do Trabalho) ou por acordo entre empregado e empregador, quando da rescisão do contrato de trabalho; ou correspondente à antecipação da multa rescisória do FGTS paga ao empregado com contrato Verde e Amarelo','2014-01-01',null),
('6102','Indenização do art. 9º da Lei 7.238/1984','Valor correspondente a indenização quando a dispensa ocorrer sem justa causa dentro dos trinta dias que antecedem a data base','2014-01-01',null),
('6103','Indenização do art. 14 da Lei 5.889/1973','Valor correspondente a indenização do tempo de serviço ao safrista, importância correspondente a 1/12 (um doze avos) do salário mensal, por mês de serviço ou fração superior a 14 (quatorze) dias','2014-01-01',null),
('6104','Indenização do art. 479 da CLT','Valor correspondente a metade da remuneração devida ate o termino do contrato a prazo determinado em caso de rescisão antecipada','2014-01-01',null),
('6105','Indenização recebida a título de incentivo a demissão','Valor correspondente a incentivo a demissão em Programas de Demissão Voluntária - PDV','2014-01-01',null),
('6106','Multa do art. 477 da CLT','Valor devido ao trabalhador por atraso no pagamento de rescisão do contrato de trabalho (art. 477 da CLT, § 8º)','2014-01-01',null),
('6107','Indenização por quebra de estabilidade','Valor correspondente a indenização por desligamento durante período de estabilidade legal, ou estabilidade derivada de acordo ou convenção coletiva de trabalho','2014-01-01',null),
('6108','Tempo de espera do motorista profissional','Valor correspondente ao tempo de espera do motorista profissional','2014-01-01',null),
('6119','Indenização rescisória - Programa Emergencial de Manutenção do Emprego e da Renda','Indenização pela dispensa sem justa causa que ocorrer durante o período de garantia provisória no emprego de que trata o Programa Emergencial de Manutenção do Emprego e da Renda','2020-04-01',null),
('6129','Outras verbas não remuneratórias (indenizatórias ou multas)','Valor correspondente a parcelas indenizatórias ou outras multas previstas em leis ou em Instrumentos Coletivos de Trabalho, exceto as previstas nos demais itens','2014-01-01',null),
('6901','Desconto do aviso prévio','Valor descontado do trabalhador que tenha pedido demissão e não cumpriu aviso prévio, total ou parcialmente','2014-01-01',null),
('6904','Multa prevista no art. 480 da CLT','Valor descontado do empregado pela rescisão antecipada, por iniciativa do empregado, do contrato de trabalho a termo','2014-01-01',null),
('7001','Proventos','Valor dos proventos de Aposentadoria a servidor público','2014-01-01',null),
('7002','Proventos - Pensão por morte Civil','Valor dos proventos por morte a beneficiário de servidor público','2014-01-01',null),
('7003','Proventos - Reserva','Valor dos proventos a militar da reserva remunerada','2014-01-01',null),
('7004','Proventos - Reforma','Valor dos proventos a militar reformado','2014-01-01',null),
('7005','Pensão Militar','Valor da pensão a beneficiário de militar','2014-01-01',null),
('7006','Auxílio-reclusão','Valor de auxílio-reclusão para o servidor público de baixa renda','2014-01-01',null),
('7007','Pensões especiais','Valor das pensões de caráter especial diferentes de pensão por morte','2014-01-01',null),
('7008','Complementação de aposentadoria/ pensão','Valor relativo à complementação de aposentadoria/pensão vinculada ao Regime Geral de Previdência Social - RGPS','2014-01-01',null),
('9200','Desconto de adiantamentos','Valor relativo a descontos a título de adiantamentos em geral, como de salários e outros, exceto a 1ª parcela do 13° salário','2014-01-01',null),
('9201','Contribuição previdenciária','Desconto a título de contribuição previdenciária','2014-01-01',null),
('9202','Contribuição militar','Desconto relativo à seguridade do militar e seus dependentes','2014-01-01',null),
('9203','Imposto de Renda Retido na Fonte','Desconto a título de Imposto de Renda Retido na Fonte - IRRF','2014-01-01',null),
('9205','Provisão de contribuição previdenciária','Desconto efetuado em recibos de férias relativo a provisão de contribuição previdenciária','2014-01-01',null),
('9207','Faltas','Desconto decorrente de ausência de trabalho durante todo o dia em razão de, por exemplo, falta injustificada, suspensão disciplinar, greve','2014-01-01',null),
('9208','Atrasos','Desconto decorrente de ausência de trabalho em razão de, por exemplo, atrasos no início da jornada de trabalho ou de saída antecipada do trabalhador','2014-01-01',null),
('9209','Faltas ou atrasos','Desconto correspondente a faltas, atrasos no início da jornada de trabalho ou à saída antecipada do trabalhador','2014-01-01',null),
('9210','DSR s/faltas e atrasos','Desconto correspondente ao Descanso Semanal Remunerado - DSR, calculado sobre faltas e atrasos do trabalhador','2014-01-01',null),
('9211','DSR sobre faltas','Desconto correspondente ao Descanso Semanal Remunerado - DSR, calculado sobre faltas do trabalhador','2014-01-01',null),
('9212','DSR sobre atrasos','Desconto correspondente ao Descanso Semanal Remunerado - DSR, calculado sobre atrasos do trabalhador','2014-01-01',null),
('9213','Pensão alimentícia','Desconto correspondente a pensão alimentícia sobre o salário mensal, 13° salário, PLR e férias','2014-01-01',null),
('9214','13° salário - Desconto de adiantamento','Desconto de antecipação do 13° salário','2014-01-01',null),
('9216','Desconto de vale-transporte','Desconto do vale-transporte referente a participação do trabalhador no custo ou em virtude de concessão do benefício em valor maior','2014-01-01',null),
('9217','Contribuição a Outras Entidades e Fundos','Desconto relativo a contribuições destinadas a outras entidades e fundos (Terceiros), como por exemplo, Sest, Senat, etc., devidas por algumas categorias de contribuintes individuais','2014-01-01',null),
('9218','Retenções judiciais','Desconto relativo a retenções de verbas devidas a trabalhadores por ordem judicial, exceto pensão alimentícia','2014-01-01',null),
('9219','Desconto de assistência médica ou odontológica - Plano coletivo empresarial','Desconto referente a participação do trabalhador no custo de assistência médica ou odontológica, ou em virtude de concessão do benefício em valor maior, nos casos de plano coletivo empresarial','2014-01-01',null),
('9220','Alimentação - Desconto','Desconto referente a participação do trabalhador no custo ou em virtude de concessão do benefício em valor maior','2014-01-01','2021-06-30'),
('9221','Desconto de férias','Valor correspondente a remuneração (dias) de férias do mês corrente pago no mês anterior ou adiantamento de férias','2014-01-01',null),
('9222','Desconto de outros impostos e contribuições','Desconto de outros impostos, taxas e contribuições, exceto Imposto de Renda Retido na Fonte, contribuição previdenciária e contribuições destinadas a outras entidades e fundos (Terceiros)','2014-01-01',null),
('9223','Previdência complementar - Parte do empregado','Desconto referente a participação do trabalhador no custo ou em virtude de concessão do benefício em valor maior','2014-01-01',null),
('9224','FAPI - Parte do empregado','Desconto referente a participação do trabalhador no custo de Fundo de Aposentadoria Programada Individual - FAPI, ou em virtude de concessão do benefício em valor maior','2014-01-01',null),
('9225','Previdência complementar - Parte do servidor','Desconto referente a participação do trabalhador no custeio de Plano de Previdência Complementar do Servidor Público','2014-01-01',null),
('9226','Desconto de férias - Abono','Desconto correspondente ao abono de férias pago no mês anterior ou adiantamento de férias','2014-01-01',null),
('9230','Contribuição sindical laboral','Valor correspondente ao desconto da contribuição laboral correspondente a um dia de trabalho a título de contribuição sindical','2014-01-01',null),
('9231','Mensalidade sindical ou associativa','Valor correspondente ao desconto referente a mensalidade sindical ou associativa do trabalhador','2014-01-01',null),
('9232','Contribuição sindical - Assistencial','Valor correspondente ao desconto da contribuição destinada ao custeio das atividades assistenciais do sindicato','2014-01-01',null),
('9233','Contribuição sindical - Confederativa','Valor correspondente ao desconto da contribuição destinada ao custeio do sistema confederativo','2014-01-01',null),
('9240','Alimentação concedida em pecúnia - Desconto','Desconto referente à alimentação concedida sob a forma de pecúnia','2014-01-01',null),
('9241','Alimentação em ticket ou cartão, vinculada ao PAT - Desconto','Desconto referente à participação do trabalhador no custo de alimentação concedida sob a forma de ticket ou cartão, por empresa vinculada ao Programa de Alimentação do Trabalhador - PAT','2014-01-01',null),
('9242','Alimentação em ticket ou cartão, não vinculada ao PAT - Desconto','Desconto referente à participação do trabalhador no custo de alimentação concedida sob a forma de ticket ou cartão, por empresa não vinculada ao PAT','2014-01-01',null),
('9243','Cesta básica ou refeição, vinculada ao PAT - Desconto','Desconto referente à participação do trabalhador no custo de alimentação concedida sob a forma de cesta básica ou refeição, por empresa vinculada ao PAT','2014-01-01',null),
('9244','Cesta básica ou refeição, não vinculada ao PAT - Desconto','Desconto referente à participação do trabalhador no custo de alimentação concedida sob a forma de cesta básica ou refeição, por empresa não vinculada ao PAT','2014-01-01',null),
('9250','Seguro de vida - Desconto','Desconto referente a participação do trabalhador no custo ou em virtude de concessão do benefício em valor maior','2014-01-01',null),
('9253','Empréstimos eConsignado - Desconto','Desconto de trabalhadores a título de empréstimos na modalidade eConsignado para repasse à instituição financeira consignatária recolhido em guia do FGTS conforme legislação específica','2024-07-01',null),
('9254','Empréstimos consignados - Desconto','Desconto de trabalhadores a título de empréstimos consignados, para repasse a instituição financeira consignatária','2014-01-01',null),
('9255','Empréstimos do empregador - Desconto','Desconto de trabalhadores a título de empréstimos efetuados pelo empregador ao trabalhador','2014-01-01',null),
('9258','Convênios','Desconto relativos a convênios diversos com empresas para fornecimento de produtos ou serviços ao empregado, sem pagamento imediato, mas com posterior desconto em folha de pagamento como farmácias, supermercados, etc.','2014-01-01',null),
('9260','FIES - Desconto','Desconto referente à amortização de financiamento do Fundo de Financiamento Estudantil (FIES), para repasse à instituição consignatária','2018-05-01',null),
('9270','Danos e prejuízos causados pelo trabalhador','Desconto do trabalhador para reparar danos e prejuízos por ele causados','2014-01-01',null),
('9290','Desconto de pagamento indevido em meses anteriores','Valor correspondente a desconto de verbas pagas indevidamente ao trabalhador em meses anteriores e que estão sendo descontadas no mês de referência, exceto valores relativos a assistência médica, alimentação, previdência complementar e seguro de vida','2014-01-01','2021-07-31'),
('9291','Abate-teto','Valor deduzido da remuneração total do segurado que supere o teto remuneratório constitucional','2014-01-01',null),
('9292','Ressarcimento ao erário','Valor deduzido da remuneração para pagamento de ressarcimento ou de penalidade','2014-01-01',null),
('9293','Honorários advocatícios','Valor descontado do trabalhador por determinação judicial a ser pago ao advogado/escritório de advocacia','2014-01-01',null),
('9294','Redutor EC 41/03','Valor descontado da remuneração do instituidor da pensão (Emenda Constitucional 41/2003)','2014-01-01',null),
('9299','Outros descontos','Outros descontos não previstos nos demais itens','2014-01-01',null),
('9901','Base de cálculo da contribuição previdenciária','Valor total da base de cálculo da contribuição previdenciária','2014-01-01',null),
('9902','Total da base de cálculo do FGTS','Valor total da base de cálculo do FGTS','2014-01-01',null),
('9903','Total da base de cálculo do IRRF','Valor total da base de cálculo do Imposto de Renda Retido na Fonte','2014-01-01',null),
('9904','Total da base de cálculo do FGTS rescisório','Valor total da base de cálculo do FGTS rescisório','2014-01-01',null),
('9905','Serviço militar','Valor não relativo a vencimento ou desconto, relativo à remuneração a que teria direito, se em atividade, o trabalhador afastado do trabalho para prestação do serviço militar obrigatório','2014-01-01',null),
('9906','Remuneração no exterior','Remuneração recebida no exterior por trabalhador expatriado sobre a qual incida contribuição previdenciária e/ou IRRF e/ou FGTS','2014-01-01',null),
('9907','Total da contribuição da previdenciária patronal - RPPS','Valor total da contribuição previdenciária patronal para o RPPS (normal, suplementar e aportes)','2014-01-01',null),
('9908','FGTS - Depósito','Valor do depósito do FGTS','2014-01-01',null),
('9910','Seguros','Valor relativo a prêmio de seguro de vida em grupo pago a empresa de seguros como benefício do trabalhador','2014-01-01',null),
('9911','Assistência Médica','Valor não relativo a vencimento ou desconto, relativo à assistência prestada por serviço médico ou odontológico, próprio da empresa ou por ela conveniado, como benefício ao trabalhador','2014-01-01',null),
('9912','Desconto de assistência médica ou odontológica - Plano diferente de coletivo empresarial','Desconto referente aos custos de assistência médica ou odontológica, quando não se tratar de plano de saúde coletivo empresarial (código [9219])','2014-01-01',null),
('9928','Salário-paternidade pago pela Previdência Social','Valor correspondente à remuneração mensal do(a) trabalhador(a) durante a licença paternidade, quando paga pela Previdência Social (RGPS ou pela Unidade Gestora do RPPS)','2026-12-01',null),
('9929','Salário-paternidade pago pela Previdência Social - 13° salário','Valor correspondente ao 13° salário do(a) trabalhador(a) durante a licença paternidade, quando pago pela Previdência Social (RGPS ou pela Unidade Gestora do RPPS)','2026-12-01',null),
('9930','Salário-maternidade pago pela Previdência Social','Valor correspondente à remuneração mensal do(a) trabalhador(a) durante a licença maternidade, quando paga pela Previdência Social (RGPS ou pela Unidade Gestora do RPPS)','2014-01-01',null),
('9931','Salário-maternidade pago pela Previdência Social - 13° salário','Valor correspondente ao 13° salário do(a) trabalhador(a) durante a licença maternidade, quando pago pela Previdência Social (RGPS ou pela Unidade Gestora do RPPS)','2014-01-01',null),
('9932','Auxílio-doença acidentário','Valor relativo a base de cálculo do FGTS referente a afastamento decorrente de acidente de trabalho','2014-01-01',null),
('9933','Auxílio-doença','Valor de benefício previdenciário pago por Regime Próprio de Previdência Social ou valor de auxílio-doença dedutível conforme Lei 13.982/2020 (Covid-19)','2014-01-01',null),
('9938','Isenção IRRF - 65 anos','Valor da parcela isenta dos rendimentos de aposentadoria e pensão, transferência para a reserva remunerada ou reforma, pagos por órgão público de previdência oficial ou por entidade de previdência complementar, no caso de contribuinte com idade igual ou superior a 65 anos','2014-01-01',null),
('9939','Outros valores tributáveis','Valor não relativo a vencimento ou desconto mas considerado como base de cálculo do FGTS, e/ou da contribuição previdenciária e/ou do Imposto de Renda Retido na Fonte inclusive suas deduções e isenções','2014-01-01',null),
('9950','Horas extraordinárias - Banco de horas','Quantidade (em número decimal com dois dígitos) de horas extraordinárias incorporadas ao banco de horas','2014-01-01','2019-10-31'),
('9951','Horas compensadas - Banco de horas','Quantidade (em número decimal com dois dígitos) de horas compensadas no banco de horas','2014-01-01','2019-10-31'),
('9989','Outros valores informativos','Outros valores informativos, que não sejam vencimentos nem descontos','2014-01-01',null)
on conflict (codigo, inicio) do update set nome=excluded.nome, descricao=excluded.descricao, termino=excluded.termino;
insert into public.esocial_tab08_class_trib (codigo, descricao) values
('01','Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída'),
('02','Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária não substituída'),
('03','Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída e não substituída'),
('04','Microempreendedor Individual - MEI'),
('06','Agroindústria'),
('07','Produtor rural Pessoa Jurídica'),
('09','Órgão Gestor de Mão de Obra - OGMO'),
('10','Entidade sindical a que se refere a Lei 12.023/2009'),
('11','Associação desportiva que mantém clube de futebol profissional'),
('13','Banco, caixa econômica, sociedade de crédito, financiamento e investimento e demais empresas relacionadas no parágrafo 1º do art. 22 da Lei 8.212/1991'),
('14','Sindicatos em geral, exceto aquele classificado no código [10]'),
('21','Pessoa Física, exceto segurado especial'),
('22','Segurado especial, inclusive quando for empregador doméstico'),
('60','Missão diplomática ou repartição consular de carreira estrangeira'),
('70','Empresa de que trata o Decreto 5.436/2005'),
('80','Entidade beneficente de assistência social isenta de contribuições sociais'),
('85','Administração direta da União, Estados, Distrito Federal e Municípios; autarquias e fundações públicas'),
('99','Pessoas Jurídicas em geral')
on conflict (codigo) do update set descricao=excluded.descricao;
insert into public.esocial_tab21_inc_irrf (codigo, descricao, inicio, termino) values
('0','Rendimento não tributável','2015-10-01','2021-06-30'),
('1','Rendimento não tributável em função de acordos internacionais de bitributação','2015-10-01','2021-06-30'),
('9','Verba transitada pela folha de pagamento de natureza diversa de rendimento ou retenção/isenção/dedução de IR (exemplo: desconto de convênio farmácia, desconto de consignações, etc.)','2015-10-01',null),
('11','Remuneração mensal','2015-10-01',null),
('12','13º salário','2015-10-01',null),
('13','Férias','2015-10-01',null),
('14','PLR','2015-10-01',null),
('15','Rendimentos Recebidos Acumuladamente - RRA','2015-10-01','2021-06-30'),
('31','Remuneração mensal','2015-10-01',null),
('32','13º salário','2015-10-01',null),
('33','Férias','2015-10-01',null),
('34','PLR','2015-10-01',null),
('35','Rendimentos Recebidos Acumuladamente - RRA','2015-10-01','2021-06-30'),
('41','Previdência Social Oficial - PSO - Remuneração mensal','2015-10-01',null),
('42','PSO - 13º salário','2015-10-01',null),
('43','PSO - Férias','2015-10-01',null),
('44','PSO - RRA','2015-10-01','2021-06-30'),
('46','Previdência complementar - Salário mensal','2015-10-01',null),
('47','Previdência complementar - 13º salário','2015-10-01',null),
('48','Previdência complementar - Férias','2015-10-01',null),
('51','Pensão alimentícia - Remuneração mensal','2015-10-01',null),
('52','Pensão alimentícia - 13º salário','2015-10-01',null),
('53','Pensão alimentícia - Férias','2015-10-01',null),
('54','Pensão alimentícia - PLR','2015-10-01',null),
('55','Pensão alimentícia - RRA','2015-10-01','2021-06-30'),
('61','Fundo de Aposentadoria Programada Individual - FAPI - Remuneração mensal','2015-10-01',null),
('62','Fundo de Aposentadoria Programada Individual - FAPI - 13º salário','2015-10-01',null),
('63','Fundação de previdência complementar do servidor público - Remuneração mensal','2015-10-01',null),
('64','Fundação de previdência complementar do servidor público - 13º salário','2015-10-01',null),
('65','Fundação de previdência complementar do servidor público - Férias','2015-10-01',null),
('66','Fundo de Aposentadoria Programada Individual - FAPI - Férias','2015-10-01',null),
('68','Desconto simplificado mensal','2023-05-01',null),
('67','Plano privado coletivo de assistência à saúde','2015-10-01',null),
('70','Parcela isenta 65 anos - Remuneração mensal','2015-10-01',null),
('71','Parcela isenta 65 anos - 13º salário','2015-10-01',null),
('72','Diárias','2015-10-01',null),
('73','Ajuda de custo','2015-10-01',null),
('74','Indenização e rescisão de contrato, inclusive a título de PDV e acidentes de trabalho','2015-10-01',null),
('75','Abono pecuniário','2015-10-01',null),
('76','Rendimento de beneficiário com moléstia grave ou acidente em serviço - Remuneração mensal','2015-10-01',null),
('77','Rendimento de beneficiário com moléstia grave ou acidente em serviço - 13º salário','2015-10-01',null),
('78','Valores pagos a titular ou sócio de microempresa ou empresa de pequeno porte, exceto pró-labore e aluguéis','2015-10-01','2021-06-30'),
('700','Auxílio moradia','2015-10-01',null),
('701','Parte não tributável do valor de serviço de transporte de passageiros ou cargas','2015-10-01',null),
('702','Bolsa médico residente - remuneração mensal','2024-12-01',null),
('703','Bolsa médico residente - 13º salário','2024-12-01',null),
('704','Juros de mora recebidos, devidos pelo atraso no pagamento de remuneração por exercício de emprego, cargo ou função','2024-12-01',null),
('79','Outras isenções (o nome da rubrica deve ser claro para identificação da natureza dos valores)','2015-10-01',null),
('81','Depósito judicial','2015-10-01','2021-06-30'),
('82','Compensação judicial do ano-calendário','2015-10-01','2021-06-30'),
('83','Compensação judicial de anos anteriores','2015-10-01','2021-06-30'),
('91','Remuneração mensal','2015-10-01','2021-06-30'),
('92','13º salário','2015-10-01','2021-06-30'),
('93','Férias','2015-10-01','2021-06-30'),
('94','PLR','2015-10-01','2021-06-30'),
('95','RRA','2015-10-01','2021-06-30'),
('9011','Remuneração mensal','2015-10-01',null),
('9012','13º salário','2015-10-01',null),
('9013','Férias','2015-10-01',null),
('9014','PLR','2015-10-01',null),
('9031','Remuneração mensal','2015-10-01',null),
('9032','13º salário','2015-10-01',null),
('9033','Férias','2015-10-01',null),
('9034','PLR','2015-10-01',null),
('9831','Depósito judicial - Mensal','2015-10-01',null),
('9832','Depósito judicial - 13º salário','2015-10-01',null),
('9833','Depósito judicial - Férias','2015-10-01',null),
('9834','Depósito judicial - PLR','2015-10-01',null),
('9041','Previdência Social Oficial - PSO - Remuneração mensal','2015-10-01',null),
('9042','PSO - 13º salário','2015-10-01',null),
('9043','PSO - Férias','2015-10-01',null),
('9046','Previdência complementar - Salário mensal','2015-10-01',null),
('9047','Previdência complementar - 13º salário','2015-10-01',null),
('9048','Previdência complementar - Férias','2015-10-01',null),
('9051','Pensão alimentícia - Remuneração mensal','2015-10-01',null),
('9052','Pensão alimentícia - 13º salário','2015-10-01',null),
('9053','Pensão alimentícia - Férias','2015-10-01',null),
('9054','Pensão alimentícia - PLR','2015-10-01',null),
('9061','Fundo de Aposentadoria Programada Individual - FAPI - Remuneração mensal','2015-10-01',null),
('9062','Fundo de Aposentadoria Programada Individual - FAPI - 13º salário','2015-10-01',null),
('9063','Fundação de previdência complementar do servidor público - Remuneração mensal','2015-10-01',null),
('9064','Fundação de previdência complementar do servidor público - 13º salário','2015-10-01',null),
('9065','Fundação de previdência complementar do servidor público - Férias','2015-10-01',null),
('9066','Fundo de Aposentadoria Programada Individual - FAPI - Férias','2015-10-01',null),
('9067','Plano privado coletivo de assistência à saúde','2015-10-01',null),
('9082','Compensação judicial do ano-calendário','2015-10-01',null),
('9083','Compensação judicial de anos anteriores','2015-10-01',null)
on conflict (codigo) do update set descricao=excluded.descricao, inicio=excluded.inicio, termino=excluded.termino;
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — dados do empregador (S-1000). Uma linha por período de validade; mudança = nova linha. ═════
create table if not exists public.rh_empregador (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tp_insc smallint not null check (tp_insc in (1,2)),                 -- 1 CNPJ · 2 CPF
  nr_insc text not null check (nr_insc ~ '^[0-9]+$'),                 -- CNPJ: raiz (8) ou completo (14) · CPF: 11
  ini_valid text not null check (ini_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  fim_valid text check (fim_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  class_trib text not null references public.esocial_tab08_class_trib(codigo),
  ind_coop smallint check (ind_coop in (0,1,2,3)),
  ind_constr smallint check (ind_constr in (0,1)),
  ind_des_folha smallint not null default 0 check (ind_des_folha in (0,1,2)),
  ind_opc_cp smallint check (ind_opc_cp in (1,2)),
  ind_porte text check (ind_porte = 'S'),
  ind_opt_reg_eletron smallint check (ind_opt_reg_eletron in (0,1)),
  cnpj_efr text check (cnpj_efr ~ '^[0-9]{14}$'),
  dt_trans_11096 date check (dt_trans_11096 > date '2005-11-21'),
  ind_trib_folha_pis_pasep text check (ind_trib_folha_pis_pasep = 'S'),
  ind_pert_irrf text check (ind_pert_irrf = 'S'),
  ind_siafi text check (ind_siafi = 'S'),
  -- dadosIsencao (entidade beneficente com certificado — classTrib 80)
  isen_ide_min_lei text check (char_length(isen_ide_min_lei) <= 70),
  isen_nr_certif text check (char_length(isen_nr_certif) <= 40),
  isen_dt_emis_certif date,
  isen_dt_venc_certif date,
  isen_nr_prot_renov text check (char_length(isen_nr_prot_renov) <= 40),
  isen_dt_prot_renov date,
  isen_dt_dou date,
  isen_pag_dou integer check (isen_pag_dou between 1 and 99999),
  -- infoOrgInternacional
  ind_acordo_isen_multa smallint check (ind_acordo_isen_multa in (0,1)),
  -- situação no eSocial: "preparado" nunca é "enviado"
  situacao_esocial text not null default 'rascunho'
    check (situacao_esocial in ('rascunho','preparado','enviado','aceito','recusado','enviado_pelo_contador')),
  recibo_esocial text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_empregador_periodo unique (empresa_id, ini_valid),
  constraint rh_empregador_nr_tamanho check ((tp_insc = 1 and char_length(nr_insc) in (8,14)) or (tp_insc = 2 and char_length(nr_insc) = 11)),
  constraint rh_empregador_fim_depois check (fim_valid is null or fim_valid >= ini_valid),
  constraint rh_empregador_pf_class check ((class_trib in ('21','22')) = (tp_insc = 2)),
  constraint rh_empregador_pj_coop_constr check (tp_insc = 2 or (ind_coop is not null and ind_constr is not null)),
  constraint rh_empregador_desfolha check (ind_des_folha <> 1 or class_trib in ('02','03','99')),
  constraint rh_empregador_opc_cp check (ind_opc_cp is null or class_trib in ('07','21')),
  constraint rh_empregador_porte check (ind_porte is null or class_trib not in ('21','22')),
  constraint rh_empregador_reg_eletron check (ind_opt_reg_eletron is null or ini_valid < '2026-02'),
  constraint rh_empregador_trans11096 check (dt_trans_11096 is null or class_trib not in ('21','22')),
  constraint rh_empregador_isencao check (isen_nr_certif is null or (class_trib = '80' and isen_ide_min_lei is not null
      and isen_dt_emis_certif is not null and isen_dt_venc_certif is not null and isen_dt_venc_certif >= isen_dt_emis_certif))
);
alter table public.rh_empregador enable row level security;
drop policy if exists rh_empregador_le on public.rh_empregador;
create policy rh_empregador_le on public.rh_empregador for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_empregador_insere on public.rh_empregador;
create policy rh_empregador_insere on public.rh_empregador for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_empregador_altera on public.rh_empregador;
create policy rh_empregador_altera on public.rh_empregador for update to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_empregador_apaga on public.rh_empregador;
create policy rh_empregador_apaga on public.rh_empregador for delete to authenticated
  using (public.rh_pode(empresa_id, 'editar') and situacao_esocial = 'rascunho');
-- ═════ FIM BLOCO 3 ═════

-- ═════ BLOCO 4 — verbas da folha (S-1010). Mudança de incidência = nova linha com nova validade. ═════
create table if not exists public.rh_rubricas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cod_rubr text not null check (char_length(cod_rubr) between 1 and 30 and cod_rubr !~* '^esocial'),
  ide_tab_rubr text not null default 'AXIOMA' check (char_length(ide_tab_rubr) between 1 and 8 and ide_tab_rubr !~* '^esocial'),
  ini_valid text not null check (ini_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  fim_valid text check (fim_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  dsc_rubr text not null check (char_length(dsc_rubr) between 1 and 100),
  nat_rubr text not null check (nat_rubr ~ '^[0-9]{4}$'),           -- conferido contra a Tabela 03 VIGENTE no mês (gatilho abaixo)
  tp_rubr smallint not null check (tp_rubr in (1,2,3,4)),             -- 1 provento · 2 desconto · 3 informativa · 4 informativa dedutora
  -- Códigos de suspensão por decisão judicial (9x) exigem a Tabela de Processos (S-1070), que ainda não existe: bloqueados por ora.
  cod_inc_cp text not null check (cod_inc_cp in ('00','01','11','12','13','14','15','16','21','22','23','24','25','26','27','28','31','32','34','35','51')),
  cod_inc_irrf text not null references public.esocial_tab21_inc_irrf(codigo),
  cod_inc_fgts text not null check (cod_inc_fgts in ('00','11','12','21','31')),
  cod_inc_cprp text check (cod_inc_cprp in ('00','11','12','31','32')),
  cod_inc_pis_pasep text check (cod_inc_pis_pasep in ('00','11','12')),
  teto_remun text check (teto_remun in ('S','N')),
  observacao text check (char_length(observacao) <= 255),
  situacao_esocial text not null default 'rascunho'
    check (situacao_esocial in ('rascunho','preparado','enviado','aceito','recusado','enviado_pelo_contador')),
  recibo_esocial text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_rubricas_periodo unique (empresa_id, ide_tab_rubr, cod_rubr, ini_valid),
  constraint rh_rubricas_fim_depois check (fim_valid is null or fim_valid >= ini_valid),
  constraint rh_rubricas_obs_dedutora check (tp_rubr <> 4 or observacao is not null),
  constraint rh_rubricas_econsignado check ((nat_rubr = '9253') = (cod_inc_fgts = '31') and (nat_rubr <> '9253' or tp_rubr = 2))
);
create index if not exists rh_rubricas_empresa_nat on public.rh_rubricas (empresa_id, nat_rubr);
-- A natureza precisa existir e estar valendo no mês de início da verba (Tabela 03 tem início e término).
create or replace function public.rh_rubricas_confere_natureza()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if not exists (select 1 from public.esocial_tab03_natureza_rubrica t
                 where t.codigo = new.nat_rubr
                   and t.inicio <= to_date(new.ini_valid || '-01', 'YYYY-MM-DD')
                   and (t.termino is null or t.termino >= to_date(new.ini_valid || '-01', 'YYYY-MM-DD'))) then
    raise exception 'Natureza % não existe ou não vale em % (Tabela 03 do eSocial)', new.nat_rubr, new.ini_valid
      using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_rubricas_confere_natureza on public.rh_rubricas;
create trigger rh_rubricas_confere_natureza before insert or update of nat_rubr, ini_valid on public.rh_rubricas
  for each row execute function public.rh_rubricas_confere_natureza();
alter table public.rh_rubricas enable row level security;
drop policy if exists rh_rubricas_le on public.rh_rubricas;
create policy rh_rubricas_le on public.rh_rubricas for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_rubricas_insere on public.rh_rubricas;
create policy rh_rubricas_insere on public.rh_rubricas for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_rubricas_altera on public.rh_rubricas;
create policy rh_rubricas_altera on public.rh_rubricas for update to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_rubricas_apaga on public.rh_rubricas;
create policy rh_rubricas_apaga on public.rh_rubricas for delete to authenticated
  using (public.rh_pode(empresa_id, 'editar') and situacao_esocial = 'rascunho');
-- ═════ FIM BLOCO 4 ═════
