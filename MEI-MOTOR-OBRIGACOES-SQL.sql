-- ============================================================================
-- AXIOMA — RODADA 1: MOTOR CANÔNICO DE OBRIGAÇÕES MEI (DAS) — 2026-10-09
-- Rodar no SQL Editor do Supabase, UM BLOCO POR VEZ, na ordem A → B → C → D.
-- Desfazer: MEI-MOTOR-OBRIGACOES-DESFAZER-SQL.sql (ordem inversa).
-- Testar: MEI-MOTOR-OBRIGACOES-TESTE-SQL.sql (roda e desfaz tudo no final).
--
-- Modelo (reaproveita o que já existe — nada de tabela paralela):
--   OBRIGAÇÃO   = mei_obrigacoes (calendário fiscal: competência ≠ vencimento)
--                 + contas_pagar.mei_obrigacao_id (o "a pagar" que Contas a Pagar,
--                 Tesouraria, Fluxo previsto e aviso de 7 dias já enxergam)
--   PROJEÇÃO    = mei_obrigacoes com natureza 'projecao' (nunca vira conta a pagar)
--   PAGAMENTO   = pagamentos_obrigacao (novo: não existia tabela de pagamento)
--   ALOCAÇÃO    = pagamento_alocacoes (novo: parcial e guia com vários meses)
--   GUIA        = guias_arrecadacao (novo: DAS emitido — nº, código de barras, Pix)
--   REGRA       = regras_fiscais (novo: valor oficial com fonte e vigência)
--   CENÁRIO     = simulacoes (já existe — Rodada 2)
-- Dinheiro: numeric(14,2) no banco; somas feitas aqui dentro (sem float).
-- ============================================================================


-- ============================================================================
-- BLOCO A — REGRAS FISCAIS VERSIONADAS (globais, só leitura pelo app)
-- ============================================================================
create table if not exists public.regras_fiscais (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('DAS_MEI')),
  versao integer not null,
  vigencia_inicio date not null,           -- 1ª competência coberta (dia 1 do mês)
  vigencia_fim date,                        -- última competência coberta (null = em aberto)
  parametros jsonb not null,                -- {salario_minimo, inss_pct, inss_pct_tac, icms, iss}
  status text not null check (status in ('oficial', 'pendente_validacao', 'hipotetica')),
  fonte_url text,
  fonte_descricao text,
  verificado_em date,
  criado_em timestamptz not null default now(),
  unique (tipo, versao),
  check (vigencia_fim is null or vigencia_fim >= vigencia_inicio)
);
-- Duas regras OFICIAIS nunca cobrem a mesma competência.
create unique index if not exists ux_regras_fiscais_oficial_inicio on public.regras_fiscais (tipo, vigencia_inicio) where status = 'oficial';

alter table public.regras_fiscais enable row level security;
drop policy if exists regras_fiscais_leitura on public.regras_fiscais;
create policy regras_fiscais_leitura on public.regras_fiscais for select to authenticated using (true);
-- Sem política de escrita: só o SQL Editor (dono do banco) cadastra regra nova.

insert into public.regras_fiscais (tipo, versao, vigencia_inicio, vigencia_fim, parametros, status, fonte_url, fonte_descricao, verificado_em) values
  ('DAS_MEI', 2025, '2025-01-01', '2025-12-31',
   '{"salario_minimo": 1518.00, "inss_pct": 5, "inss_pct_tac": 12, "icms": 1.00, "iss": 5.00}', 'oficial',
   'https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=f8fd8ebc-76b2-46ce-8bd6-2379f9988501',
   'Simples Nacional, 02/01/2025: MEI - atualização de valores devidos em 2025 (Decreto 12.342/2024). INSS R$ 75,90; caminhoneiro R$ 182,16.', '2026-10-09'),
  ('DAS_MEI', 2026, '2026-01-01', '2026-12-31',
   '{"salario_minimo": 1621.00, "inss_pct": 5, "inss_pct_tac": 12, "icms": 1.00, "iss": 5.00}', 'oficial',
   'https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3',
   'Simples Nacional, 02/01/2026: MEI - atualização de valores devidos em 2026 (Decreto 12.797/2025). INSS R$ 81,05; caminhoneiro R$ 194,52.', '2026-10-09')
on conflict (tipo, versao) do nothing;
-- 2027 NÃO é cadastrada: o salário mínimo de 2027 e o efeito da Reforma no MEI ainda
-- não têm fonte oficial. Os meses de 2027 nascem como PROJEÇÃO (natureza 'projecao').


-- ============================================================================
-- BLOCO B — OBRIGAÇÃO: campos novos em mei_obrigacoes + vínculo com Contas a Pagar
-- O status antigo ("Entregue"/"Pendente") NÃO é alterado.
-- ============================================================================
alter table public.mei_obrigacoes
  add column if not exists valor_esperado numeric(14,2) check (valor_esperado is null or valor_esperado >= 0),
  add column if not exists natureza text not null default 'oficial' check (natureza in ('oficial', 'projecao')),
  add column if not exists regra_id uuid references public.regras_fiscais(id),
  add column if not exists premissa text,   -- de onde veio o valor (regra oficial X / projeção com premissa Y)
  add column if not exists situacao text check (situacao in ('previsto', 'pendente', 'parcial', 'pago', 'aguardando_conciliacao', 'cancelado', 'retificado')),
  add column if not exists situacao_origem text check (situacao_origem in ('motor', 'usuario', 'legado'));

-- Legado (antes do motor): "Entregue" sem pagamento registrado vira AGUARDANDO
-- CONCILIAÇÃO — não conta como pago nem como dívida até alguém informar o pagamento.
-- (Os 10 meses marcados em 2026-10-09 na empresa de teste caem aqui.)
update public.mei_obrigacoes
   set situacao = case when status = 'Entregue' then 'aguardando_conciliacao' else 'pendente' end,
       situacao_origem = 'legado'
 where situacao is null;

-- Uma obrigação = no máximo uma conta a pagar (idempotente: gerar de novo não duplica).
-- (sem "on delete restrict": a checagem padrão roda no fim do comando, então apagar a EMPRESA
-- inteira em cascata funciona; apagar só a obrigação que tem conta continua proibido)
alter table public.contas_pagar add column if not exists mei_obrigacao_id uuid references public.mei_obrigacoes(id);
create unique index if not exists ux_contas_pagar_mei_obrigacao on public.contas_pagar (mei_obrigacao_id) where mei_obrigacao_id is not null;

-- Histórico de toda mudança na obrigação (retificação/cancelamento nunca apagam o passado).
create table if not exists public.mei_obrigacoes_historico (
  id uuid primary key default gen_random_uuid(),
  obrigacao_id uuid not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  antes jsonb,
  depois jsonb,
  usuario_id uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create index if not exists idx_mei_obrig_hist_empresa on public.mei_obrigacoes_historico (empresa_id, obrigacao_id, criado_em desc);
alter table public.mei_obrigacoes_historico enable row level security;
drop policy if exists mei_obrig_hist_leitura on public.mei_obrigacoes_historico;
create policy mei_obrig_hist_leitura on public.mei_obrigacoes_historico for select
  using (empresa_id in (select empresas_do_usuario_operacional()));

create or replace function public.fn_mei_obrigacoes_historico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.mei_obrigacoes_historico (obrigacao_id, empresa_id, antes, depois)
  values (coalesce(new.id, old.id), coalesce(new.empresa_id, old.empresa_id),
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end $$;
drop trigger if exists trg_mei_obrigacoes_historico on public.mei_obrigacoes;
-- Só criação/mudança: exclusão só acontece quando a EMPRESA é apagada (cascata) — registrar
-- ali travaria a exclusão da empresa (transferência, LGPD).
create trigger trg_mei_obrigacoes_historico after insert or update on public.mei_obrigacoes
  for each row execute function public.fn_mei_obrigacoes_historico();


-- ============================================================================
-- BLOCO C — GUIA, PAGAMENTO E ALOCAÇÃO
-- Pagamento e alocação NÃO têm política de escrita: só as funções do Bloco D gravam
-- (impossível criar/alterar pagamento direto pelo navegador).
-- ============================================================================
create table if not exists public.guias_arrecadacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null default 'DAS_MEI' check (tipo in ('DAS_MEI')),
  numero_documento text,                    -- nº do documento de arrecadação (vem na guia)
  codigo_barras text,
  pix_copia_cola text,
  valor_total numeric(14,2) not null check (valor_total > 0),
  data_vencimento date,                     -- "pagar até" impresso na guia
  competencias text[] not null,             -- ex.: {2026-08} ou {2026-07,2026-08}
  origem text not null check (origem in ('manual', 'pdf_ia', 'integra_contador')),
  arquivo_path text,
  status text not null default 'emitida' check (status in ('emitida', 'paga', 'vencida', 'cancelada')),
  usuario_id uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create unique index if not exists ux_guias_numero on public.guias_arrecadacao (empresa_id, numero_documento) where numero_documento is not null;
create index if not exists idx_guias_empresa on public.guias_arrecadacao (empresa_id, criado_em desc);
alter table public.guias_arrecadacao enable row level security;
drop policy if exists guias_leitura on public.guias_arrecadacao;
create policy guias_leitura on public.guias_arrecadacao for select using (empresa_id in (select empresas_do_usuario_operacional()));
drop policy if exists guias_insercao on public.guias_arrecadacao;
create policy guias_insercao on public.guias_arrecadacao for insert with check (empresa_id in (select empresas_do_usuario_operacional()));
drop policy if exists guias_edicao on public.guias_arrecadacao;
create policy guias_edicao on public.guias_arrecadacao for update using (empresa_id in (select empresas_do_usuario_operacional()))
  with check (empresa_id in (select empresas_do_usuario_operacional()));

create table if not exists public.pagamentos_obrigacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  valor numeric(14,2) not null check (valor > 0),
  data_pagamento date not null,
  metodo text not null check (metodo in ('pix', 'boleto', 'debito_automatico', 'cartao', 'transferencia', 'outro')),
  referencia text,                           -- nº do documento / autenticação bancária
  guia_id uuid references public.guias_arrecadacao(id),
  evidencia_path text,                       -- comprovante no storage
  origem text not null check (origem in ('manual', 'extrato', 'comprovante_ia', 'integra_contador', 'pix_axioma')),
  chave_idempotencia text not null,          -- mesmo clique/chamada repetida = mesmo pagamento
  estorno_de uuid references public.pagamentos_obrigacao(id),  -- linha de estorno aponta pro original
  estornado_em timestamptz,                  -- marcado no ORIGINAL quando estornado (nunca apagado)
  motivo_estorno text,
  rastreio_ok boolean not null default false,-- motor de rastreio (Contabilidade/Fluxo) já recebeu
  usuario_id uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  unique (empresa_id, chave_idempotencia)
);
create index if not exists idx_pag_obrig_empresa on public.pagamentos_obrigacao (empresa_id, data_pagamento desc);
create unique index if not exists ux_pag_obrig_um_estorno on public.pagamentos_obrigacao (estorno_de) where estorno_de is not null;
alter table public.pagamentos_obrigacao enable row level security;
drop policy if exists pag_obrig_leitura on public.pagamentos_obrigacao;
create policy pag_obrig_leitura on public.pagamentos_obrigacao for select using (empresa_id in (select empresas_do_usuario_operacional()));

create table if not exists public.pagamento_alocacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pagamento_id uuid not null references public.pagamentos_obrigacao(id),   -- sem restrict: ver nota no Bloco B
  obrigacao_id uuid not null references public.mei_obrigacoes(id),
  valor numeric(14,2) not null check (valor > 0),       -- abate do valor esperado
  encargos numeric(14,2) not null default 0 check (encargos >= 0), -- multa/juros pagos à parte
  criado_em timestamptz not null default now(),
  unique (pagamento_id, obrigacao_id)
);
create index if not exists idx_aloc_obrigacao on public.pagamento_alocacoes (empresa_id, obrigacao_id);
alter table public.pagamento_alocacoes enable row level security;
drop policy if exists aloc_leitura on public.pagamento_alocacoes;
create policy aloc_leitura on public.pagamento_alocacoes for select using (empresa_id in (select empresas_do_usuario_operacional()));


-- ============================================================================
-- BLOCO D — FUNÇÕES DO MOTOR (uma transação cada; a empresa é conferida AQUI,
-- nunca confiando no que o navegador manda)
-- ============================================================================

-- Situação derivada de valores (fonte única: o app nunca calcula isto sozinho).
create or replace function public.mei_situacao_obrigacao(p_obrigacao uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when o.situacao in ('cancelado', 'retificado') then o.situacao
    when o.natureza = 'projecao' then 'previsto'
    when coalesce(a.pago, 0) > 0 and coalesce(a.pago, 0) + 0.005 >= coalesce(o.valor_esperado, 0) and o.valor_esperado is not null then 'pago'
    when coalesce(a.pago, 0) > 0 then 'parcial'
    when o.situacao = 'aguardando_conciliacao' then 'aguardando_conciliacao'
    else 'pendente' end
  from public.mei_obrigacoes o
  left join lateral (
    select sum(pa.valor) pago from public.pagamento_alocacoes pa
    join public.pagamentos_obrigacao p on p.id = pa.pagamento_id
    where pa.obrigacao_id = o.id and p.estorno_de is null and p.estornado_em is null
  ) a on true
  where o.id = p_obrigacao and o.empresa_id in (select empresas_do_usuario_operacional());
$$;

-- Status da conta a pagar (espelho de calcStatus em lib/fornecedorHelpers.ts).
create or replace function public.mei_status_conta(p_total numeric, p_pago numeric, p_venc date) returns text
language sql stable as $$
  select case when p_pago >= p_total and p_total > 0 then 'pago'
              when p_pago > 0 and p_pago < p_total then 'parcial'
              when p_venc is not null and p_venc < current_date then 'vencido'
              else 'pendente' end;
$$;

-- GERAR PERÍODOS — 12 meses pelo VENCIMENTO (jan = ref. dez anterior … dez = ref. nov),
-- idempotente: rodar de novo não duplica; só preenche valor de linha antiga sem valor
-- e promove projeção a oficial quando a regra oficial passa a existir.
create or replace function public.mei_gerar_periodos_das(p_empresa uuid, p_ano integer) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_mei record; v_comp date; v_venc date; v_regra record; v_ultima record;
  v_inss numeric; v_valor numeric; v_icms boolean; v_iss boolean; v_pct text; v_dia integer; v_n integer := 0; v_m integer;
begin
  if p_empresa is null or p_empresa not in (select empresas_do_usuario_operacional()) then raise exception 'sem_permissao'; end if;
  if p_ano < 2000 or p_ano > 2100 then raise exception 'ano_invalido'; end if;
  select * into v_mei from public.mei_dados where empresa_id = p_empresa;
  if not found then return 0; end if;
  v_dia := least(28, greatest(1, coalesce(v_mei.dia_vencimento_das, 20)));
  v_icms := coalesce(v_mei.categoria_mei, 'Serviços') in ('Comércio', 'Indústria', 'Transporte', 'Comércio e Serviços');
  v_iss  := coalesce(v_mei.categoria_mei, 'Serviços') in ('Serviços', 'Comércio e Serviços');
  -- "Transporte" no Axioma = MEI caminhoneiro (transportador autônomo de cargas): INSS 12%
  v_pct  := case when v_mei.categoria_mei = 'Transporte' then 'inss_pct_tac' else 'inss_pct' end;
  select * into v_ultima from public.regras_fiscais where tipo = 'DAS_MEI' and status = 'oficial' order by vigencia_inicio desc limit 1;

  for v_m in 0..11 loop
    v_venc := make_date(p_ano, v_m + 1, v_dia);
    v_comp := (make_date(p_ano, v_m + 1, 1) - interval '1 month')::date;     -- competência = mês anterior ao vencimento
    if v_mei.data_abertura is not null and v_comp < date_trunc('month', v_mei.data_abertura)::date then continue; end if;
    select * into v_regra from public.regras_fiscais
     where tipo = 'DAS_MEI' and status = 'oficial' and vigencia_inicio <= v_comp and (vigencia_fim is null or vigencia_fim >= v_comp)
     order by vigencia_inicio desc limit 1;
    if found then
      v_inss := round((v_regra.parametros->>'salario_minimo')::numeric * (v_regra.parametros->>v_pct)::numeric / 100, 2);
      v_valor := v_inss + case when v_icms then (v_regra.parametros->>'icms')::numeric else 0 end + case when v_iss then (v_regra.parametros->>'iss')::numeric else 0 end;
    elsif v_ultima.id is not null then
      v_inss := round((v_ultima.parametros->>'salario_minimo')::numeric * (v_ultima.parametros->>v_pct)::numeric / 100, 2);
      v_valor := v_inss + case when v_icms then (v_ultima.parametros->>'icms')::numeric else 0 end + case when v_iss then (v_ultima.parametros->>'iss')::numeric else 0 end;
    else
      v_valor := null;
    end if;

    insert into public.mei_obrigacoes (user_id, empresa_id, tipo, competencia, prazo, data_vencimento, ano_referencia, mes_referencia,
                                       status, valor_esperado, natureza, regra_id, premissa, situacao, situacao_origem, descricao)
    values (auth.uid(), p_empresa, 'DAS', to_char(v_comp, 'YYYY-MM'), v_venc, v_venc,
            extract(year from v_comp)::int, extract(month from v_comp)::int, 'Pendente', v_valor,
            case when v_regra.id is not null then 'oficial' else 'projecao' end,
            v_regra.id,
            case when v_regra.id is not null then 'Regra oficial DAS_MEI v' || v_regra.versao
                 else 'Projeção: parâmetros da última regra oficial (v' || coalesce(v_ultima.versao::text, '?') || ') mantidos — valor oficial ainda não publicado' end,
            case when v_regra.id is not null then 'pendente' else 'previsto' end, 'motor', 'DAS-MEI')
    on conflict (empresa_id, tipo, competencia) do update set
      valor_esperado = coalesce(public.mei_obrigacoes.valor_esperado, excluded.valor_esperado),
      regra_id       = coalesce(public.mei_obrigacoes.regra_id, excluded.regra_id),
      data_vencimento = coalesce(public.mei_obrigacoes.data_vencimento, excluded.data_vencimento),
      -- projeção vira oficial quando a regra oficial aparece (valor recalculado; sem pagamento ainda)
      natureza = case when public.mei_obrigacoes.natureza = 'projecao' and excluded.natureza = 'oficial' then 'oficial' else public.mei_obrigacoes.natureza end,
      premissa = case when public.mei_obrigacoes.natureza = 'projecao' and excluded.natureza = 'oficial' then excluded.premissa else coalesce(public.mei_obrigacoes.premissa, excluded.premissa) end,
      situacao = case when public.mei_obrigacoes.natureza = 'projecao' and excluded.natureza = 'oficial' then 'pendente' else public.mei_obrigacoes.situacao end
    -- só grava quando há o que mudar (linha antiga sem valor, ou regra oficial que acabou de
    -- aparecer); senão abrir a tela regravaria tudo e encheria o histórico à toa
    where public.mei_obrigacoes.valor_esperado is null
       or (public.mei_obrigacoes.regra_id is null and excluded.regra_id is not null);
    if found then v_n := v_n + 1; end if;
  end loop;
  -- Projeção promovida: valor de projeção é trocado pelo oficial (só quando não há pagamento).
  update public.mei_obrigacoes o set valor_esperado = (
      select round((r.parametros->>'salario_minimo')::numeric * (r.parametros->>v_pct)::numeric / 100, 2)
           + case when v_icms then (r.parametros->>'icms')::numeric else 0 end + case when v_iss then (r.parametros->>'iss')::numeric else 0 end
      from public.regras_fiscais r where r.id = o.regra_id)
   where o.empresa_id = p_empresa and o.tipo = 'DAS' and o.natureza = 'oficial' and o.regra_id is not null
     and o.premissa like 'Regra oficial%' and o.ano_referencia between p_ano - 1 and p_ano
     and not exists (select 1 from public.pagamento_alocacoes pa where pa.obrigacao_id = o.id)
     and not exists (select 1 from public.contas_pagar c where c.mei_obrigacao_id = o.id)   -- conta já nasceu: não muda por baixo
     and o.valor_esperado is distinct from (
      select round((r.parametros->>'salario_minimo')::numeric * (r.parametros->>v_pct)::numeric / 100, 2)
           + case when v_icms then (r.parametros->>'icms')::numeric else 0 end + case when v_iss then (r.parametros->>'iss')::numeric else 0 end
      from public.regras_fiscais r where r.id = o.regra_id);
  return v_n;
end $$;

-- TRAVA: conta a pagar de DAS só muda pelo motor (senão Contas a Pagar daria baixa por
-- fora e o MEI e a Contabilidade divergiriam). As funções do motor ligam a marca
-- axioma.motor_mei só dentro da própria transação.
create or replace function public.fn_contas_pagar_trava_das() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('axioma.motor_mei', true), '') = 'on' then return coalesce(new, old); end if;
  if tg_op = 'DELETE' and old.mei_obrigacao_id is not null then raise exception 'conta_do_das: apague/estorne pelo MEI → DAS e Obrigações'; end if;
  if tg_op = 'UPDATE' and (old.mei_obrigacao_id is not null or new.mei_obrigacao_id is not null) and (
       new.valor_pago is distinct from old.valor_pago or new.valor_total is distinct from old.valor_total
       or new.mei_obrigacao_id is distinct from old.mei_obrigacao_id or new.status is distinct from old.status and new.status = 'pago') then
    raise exception 'conta_do_das: pagamento do DAS só pelo MEI → DAS e Obrigações';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_contas_pagar_trava_das on public.contas_pagar;
create trigger trg_contas_pagar_trava_das before update or delete on public.contas_pagar
  for each row execute function public.fn_contas_pagar_trava_das();

-- REGISTRAR PAGAMENTO — uma transação: confere empresa e cargo, trava as obrigações
-- (dois cliques ao mesmo tempo esperam um pelo outro), recusa clique repetido pela
-- chave, recusa pagar acima do devido sem dizer que é multa/juros, grava pagamento +
-- alocações, atualiza a conta a pagar ligada e devolve o que o app precisa pro motor
-- de rastreio levar o dinheiro até Contabilidade e Fluxo de Caixa.
-- p_alocacoes: [{"obrigacao_id": "...", "valor": 86.05, "encargos": 3.20}, ...]
create or replace function public.mei_registrar_pagamento(
  p_empresa uuid, p_valor numeric, p_data date, p_metodo text, p_origem text, p_chave text,
  p_alocacoes jsonb, p_referencia text default null, p_guia uuid default null, p_evidencia text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_papel text; v_pag uuid; v_item jsonb; v_obr record; v_pago numeric; v_saldo numeric; v_soma numeric := 0;
  v_conta record; v_res jsonb := '[]'::jsonb; v_valor numeric; v_enc numeric; v_sit text;
begin
  if p_empresa is null or p_empresa not in (select empresas_do_usuario_operacional()) then raise exception 'sem_permissao'; end if;
  v_papel := public.meu_papel(p_empresa);
  if v_papel in ('leitor', 'operador') then raise exception 'sem_permissao'; end if;
  if p_chave is null or length(p_chave) < 8 then raise exception 'chave_invalida'; end if;
  if not (p_valor > 0) then raise exception 'valor_invalido'; end if;
  if p_data is null or p_data > current_date + 1 then raise exception 'data_invalida'; end if;   -- pagamento é fato: não existe no futuro
  if jsonb_typeof(p_alocacoes) <> 'array' or jsonb_array_length(p_alocacoes) = 0 then raise exception 'sem_alocacao'; end if;
  perform set_config('axioma.motor_mei', 'on', true);   -- só nesta transação

  -- Clique repetido / chamada repetida: devolve o MESMO pagamento, sem gravar de novo.
  select id into v_pag from public.pagamentos_obrigacao where empresa_id = p_empresa and chave_idempotencia = p_chave;
  if found then perform set_config('axioma.motor_mei', 'off', true); return jsonb_build_object('pagamento_id', v_pag, 'ja_existia', true); end if;

  -- Soma das alocações (valor + encargos) tem de bater com o pagamento, ao centavo.
  select coalesce(sum(round((x->>'valor')::numeric, 2) + round(coalesce((x->>'encargos')::numeric, 0), 2)), 0) into v_soma from jsonb_array_elements(p_alocacoes) x;
  if abs(v_soma - round(p_valor, 2)) > 0.004 then raise exception 'alocacao_nao_bate'; end if;

  insert into public.pagamentos_obrigacao (empresa_id, valor, data_pagamento, metodo, referencia, guia_id, evidencia_path, origem, chave_idempotencia)
  values (p_empresa, round(p_valor, 2), p_data, p_metodo, p_referencia, p_guia, p_evidencia, p_origem, p_chave)
  on conflict (empresa_id, chave_idempotencia) do nothing
  returning id into v_pag;
  if v_pag is null then   -- outra chamada simultânea com a mesma chave ganhou a corrida
    select id into v_pag from public.pagamentos_obrigacao where empresa_id = p_empresa and chave_idempotencia = p_chave;
    perform set_config('axioma.motor_mei', 'off', true);
    return jsonb_build_object('pagamento_id', v_pag, 'ja_existia', true);
  end if;

  for v_item in select * from jsonb_array_elements(p_alocacoes) order by (value->>'obrigacao_id') loop   -- ordem fixa evita deadlock
    v_valor := round((v_item->>'valor')::numeric, 2);
    v_enc := round(coalesce((v_item->>'encargos')::numeric, 0), 2);
    if not (v_valor > 0) or v_enc < 0 then raise exception 'alocacao_invalida'; end if;
    select * into v_obr from public.mei_obrigacoes where id = (v_item->>'obrigacao_id')::uuid and empresa_id = p_empresa for update;
    if not found then raise exception 'obrigacao_nao_encontrada'; end if;
    if v_obr.natureza = 'projecao' then raise exception 'obrigacao_projecao'; end if;        -- não se paga estimativa
    if v_obr.situacao in ('cancelado', 'retificado') then raise exception 'obrigacao_inativa'; end if;
    if v_obr.valor_esperado is null then raise exception 'obrigacao_sem_valor'; end if;
    select coalesce(sum(pa.valor), 0) into v_pago from public.pagamento_alocacoes pa join public.pagamentos_obrigacao p on p.id = pa.pagamento_id
     where pa.obrigacao_id = v_obr.id and p.estorno_de is null and p.estornado_em is null;
    v_saldo := v_obr.valor_esperado - v_pago;
    if v_valor > v_saldo + 0.004 then raise exception 'excede_saldo:%', v_saldo; end if;      -- excedente = encargos, informado à parte

    insert into public.pagamento_alocacoes (empresa_id, pagamento_id, obrigacao_id, valor, encargos) values (p_empresa, v_pag, v_obr.id, v_valor, v_enc);
    v_sit := public.mei_situacao_obrigacao(v_obr.id);
    update public.mei_obrigacoes set situacao = v_sit, situacao_origem = 'motor',
           status = case when v_sit = 'pago' then 'Entregue' else status end,          -- telas antigas continuam certas
           data_entrega = case when v_sit = 'pago' then p_data else data_entrega end,
           valor = v_pago + v_valor + coalesce((select sum(pa.encargos) from public.pagamento_alocacoes pa join public.pagamentos_obrigacao p on p.id = pa.pagamento_id
                    where pa.obrigacao_id = v_obr.id and p.estorno_de is null and p.estornado_em is null), 0),
           updated_at = now()
     where id = v_obr.id;

    -- Conta a pagar ligada: soma o que saiu NESTA baixa (principal + encargos), igual darBaixaContaPagar.
    select * into v_conta from public.contas_pagar where mei_obrigacao_id = v_obr.id and empresa_id = p_empresa for update;
    if found then
      update public.contas_pagar set valor_pago = coalesce(valor_pago, 0) + v_valor + v_enc, data_pagamento = p_data,
             forma_pagamento = p_metodo, status = public.mei_status_conta(valor_total, coalesce(valor_pago, 0) + v_valor + v_enc, data_vencimento)
       where id = v_conta.id;
    end if;
    v_res := v_res || jsonb_build_object('obrigacao_id', v_obr.id, 'competencia', v_obr.competencia, 'situacao', v_sit,
                                         'saldo', greatest(0, v_saldo - v_valor), 'valor', v_valor, 'encargos', v_enc,
                                         'conta_pagar_id', case when v_conta.id is null then null else v_conta.id end);
    v_conta := null;
  end loop;
  if p_guia is not null then update public.guias_arrecadacao set status = 'paga' where id = p_guia and empresa_id = p_empresa; end if;
  perform set_config('axioma.motor_mei', 'off', true);   -- trava volta a valer no resto da transação
  return jsonb_build_object('pagamento_id', v_pag, 'ja_existia', false, 'alocacoes', v_res);
end $$;

-- ESTORNAR — cria a linha de estorno (o original fica, marcado) e recalcula tudo.
create or replace function public.mei_estornar_pagamento(p_empresa uuid, p_pagamento uuid, p_motivo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_papel text; v_pag record; v_est uuid; v_a record; v_res jsonb := '[]'::jsonb; v_sit text;
begin
  if p_empresa is null or p_empresa not in (select empresas_do_usuario_operacional()) then raise exception 'sem_permissao'; end if;
  v_papel := public.meu_papel(p_empresa);
  if v_papel not in ('dono', 'ceo', 'socio', 'admin', 'financeiro', 'contabil') then raise exception 'sem_permissao'; end if;
  if p_motivo is null or length(trim(p_motivo)) < 5 then raise exception 'motivo_obrigatorio'; end if;
  select * into v_pag from public.pagamentos_obrigacao where id = p_pagamento and empresa_id = p_empresa for update;
  if not found then raise exception 'pagamento_nao_encontrado'; end if;
  if v_pag.estorno_de is not null then raise exception 'linha_de_estorno'; end if;
  if v_pag.estornado_em is not null then raise exception 'ja_estornado'; end if;
  perform set_config('axioma.motor_mei', 'on', true);   -- só nesta transação

  insert into public.pagamentos_obrigacao (empresa_id, valor, data_pagamento, metodo, referencia, origem, chave_idempotencia, estorno_de, motivo_estorno)
  values (p_empresa, v_pag.valor, current_date, v_pag.metodo, v_pag.referencia, v_pag.origem, 'estorno:' || v_pag.id, v_pag.id, p_motivo)
  returning id into v_est;
  update public.pagamentos_obrigacao set estornado_em = now(), motivo_estorno = p_motivo where id = v_pag.id;

  for v_a in select * from public.pagamento_alocacoes where pagamento_id = v_pag.id order by obrigacao_id loop
    perform 1 from public.mei_obrigacoes where id = v_a.obrigacao_id for update;
    v_sit := public.mei_situacao_obrigacao(v_a.obrigacao_id);
    update public.mei_obrigacoes set situacao = v_sit, situacao_origem = 'motor',
           status = case when v_sit = 'pago' then 'Entregue' else 'Pendente' end,
           data_entrega = case when v_sit = 'pago' then data_entrega else null end, updated_at = now()
     where id = v_a.obrigacao_id;
    update public.contas_pagar set valor_pago = greatest(0, coalesce(valor_pago, 0) - v_a.valor - v_a.encargos),
           status = public.mei_status_conta(valor_total, greatest(0, coalesce(valor_pago, 0) - v_a.valor - v_a.encargos), data_vencimento),
           data_pagamento = case when greatest(0, coalesce(valor_pago, 0) - v_a.valor - v_a.encargos) = 0 then null else data_pagamento end
     where mei_obrigacao_id = v_a.obrigacao_id and empresa_id = p_empresa;
    v_res := v_res || jsonb_build_object('obrigacao_id', v_a.obrigacao_id, 'situacao', v_sit, 'valor', v_a.valor, 'encargos', v_a.encargos,
                                         'conta_pagar_id', (select id from public.contas_pagar where mei_obrigacao_id = v_a.obrigacao_id));
  end loop;
  perform set_config('axioma.motor_mei', 'off', true);
  return jsonb_build_object('estorno_id', v_est, 'alocacoes', v_res);
end $$;

-- Marca que o motor de rastreio (Contabilidade/Fluxo) já recebeu o pagamento.
create or replace function public.mei_marcar_rastreio_ok(p_empresa uuid, p_pagamento uuid) returns void
language sql security definer set search_path = public as $$
  update public.pagamentos_obrigacao set rastreio_ok = true
   where id = p_pagamento and empresa_id = p_empresa and p_empresa in (select empresas_do_usuario_operacional());
$$;

-- RESUMO — a conta que TODOS os módulos usam (ano pelo vencimento). Pago só conta
-- pagamento válido; vencido/pendente só obrigação OFICIAL; projeção à parte.
create or replace function public.mei_resumo_obrigacoes(p_empresa uuid, p_ano integer)
returns table (situacao text, natureza text, quantidade integer, valor_esperado numeric, valor_pago numeric, encargos_pagos numeric, saldo numeric, saldo_vencido numeric)
language sql stable security definer set search_path = public as $$
  with base as (
    select o.id, o.natureza, coalesce(o.valor_esperado, 0) esperado, o.data_vencimento,
           public.mei_situacao_obrigacao(o.id) sit,
           coalesce(sum(pa.valor) filter (where p.estorno_de is null and p.estornado_em is null), 0) pago,
           coalesce(sum(pa.encargos) filter (where p.estorno_de is null and p.estornado_em is null), 0) enc
    from public.mei_obrigacoes o
    left join public.pagamento_alocacoes pa on pa.obrigacao_id = o.id
    left join public.pagamentos_obrigacao p on p.id = pa.pagamento_id
    where o.empresa_id = p_empresa and o.tipo = 'DAS' and extract(year from o.data_vencimento) = p_ano
      and p_empresa in (select empresas_do_usuario_operacional())
    group by o.id
  )
  select sit, natureza, count(*)::int, sum(esperado), sum(pago), sum(enc),
         sum(case when sit in ('cancelado', 'retificado', 'aguardando_conciliacao') then 0 else greatest(0, esperado - pago) end),
         sum(case when natureza = 'oficial' and sit in ('pendente', 'parcial') and data_vencimento < current_date then greatest(0, esperado - pago) else 0 end)
  from base group by sit, natureza;
$$;

revoke all on function public.mei_gerar_periodos_das(uuid, integer) from public, anon;
revoke all on function public.mei_registrar_pagamento(uuid, numeric, date, text, text, text, jsonb, text, uuid, text) from public, anon;
revoke all on function public.mei_estornar_pagamento(uuid, uuid, text) from public, anon;
revoke all on function public.mei_marcar_rastreio_ok(uuid, uuid) from public, anon;
revoke all on function public.mei_resumo_obrigacoes(uuid, integer) from public, anon;
revoke all on function public.mei_situacao_obrigacao(uuid) from public, anon;
grant execute on function public.mei_gerar_periodos_das(uuid, integer) to authenticated;
grant execute on function public.mei_registrar_pagamento(uuid, numeric, date, text, text, text, jsonb, text, uuid, text) to authenticated;
grant execute on function public.mei_estornar_pagamento(uuid, uuid, text) to authenticated;
grant execute on function public.mei_marcar_rastreio_ok(uuid, uuid) to authenticated;
grant execute on function public.mei_resumo_obrigacoes(uuid, integer) to authenticated;
grant execute on function public.mei_situacao_obrigacao(uuid) to authenticated;
