-- ============================================================================
-- CORREÇÃO DA AUDITORIA 2026-10-01 — rodar UMA VEZ no SQL Editor do Supabase.
-- Parte 1-2: "column reference is ambiguous" (erro 42702)
-- 1) ap_decidir_aprovacao: botão Aprovar/Rejeitar em Contas a Pagar falhava
--    sempre ("Não foi possível registrar a decisão") — confirmado no site.
-- 2) contador_detectar_variacao_despesa: mesmo defeito (GROUP BY conta_id).
-- Causa: o nome da coluna de saída (RETURNS TABLE) é igual ao de uma coluna
-- da tabela. Correção: #variable_conflict use_column (corpo igual ao original).
-- Seguro rodar mais de uma vez. Não mexe em nenhum dado.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ap_decidir_aprovacao(
  p_aprovacao_id uuid,
  p_decisao text,
  p_motivo text DEFAULT NULL
)
RETURNS TABLE (contas_pagar_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_empresa_id uuid;
  v_contas_pagar_id uuid;
  v_dono_id uuid;
  v_aprovadores uuid[];
  v_pode_decidir boolean;
BEGIN
  IF p_decisao NOT IN ('aprovada', 'rejeitada') THEN
    RAISE EXCEPTION 'Decisão inválida: %', p_decisao;
  END IF;

  SELECT empresa_id, contas_pagar_id INTO v_empresa_id, v_contas_pagar_id
  FROM public.contas_pagar_aprovacao WHERE id = p_aprovacao_id AND status = 'pendente';
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Aprovação % não encontrada ou já decidida', p_aprovacao_id;
  END IF;
  IF v_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'Sem acesso a esta empresa';
  END IF;

  SELECT user_id INTO v_dono_id FROM public.empresas WHERE id = v_empresa_id;
  SELECT aprovadores INTO v_aprovadores FROM public.empresa_config_ap WHERE empresa_id = v_empresa_id;
  v_pode_decidir := (auth.uid() = v_dono_id) OR (v_aprovadores IS NOT NULL AND auth.uid() = ANY(v_aprovadores));

  IF NOT v_pode_decidir THEN
    RAISE EXCEPTION 'Você não está habilitado a aprovar contas desta empresa';
  END IF;

  UPDATE public.contas_pagar_aprovacao
  SET status = p_decisao, motivo = p_motivo, aprovador_id = auth.uid(), decidido_em = now()
  WHERE id = p_aprovacao_id;

  -- rejeitada: volta pro estado anterior (pendente/vencido, recalculado pelo
  -- client). aprovada: sai de 'aguardando_aprovacao', também recalculado
  -- pelo client (calcStatus já existe em fornecedorHelpers.ts — não duplicado
  -- aqui em SQL).
  UPDATE public.contas_pagar SET status = 'pendente' WHERE id = v_contas_pagar_id AND status = 'aguardando_aprovacao';

  PERFORM public.ap_registrar_auditoria(v_contas_pagar_id, CASE WHEN p_decisao = 'aprovada' THEN 'aprovou' ELSE 'rejeitou' END, NULL, jsonb_build_object('motivo', p_motivo));

  RETURN QUERY SELECT v_contas_pagar_id, 'pendente'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.contador_detectar_variacao_despesa(
  p_empresa_id      uuid,
  p_competencia     date,
  p_meses_historico int DEFAULT 6,
  p_limiar_pct      numeric DEFAULT 20
)
RETURNS TABLE (
  conta_id          uuid,
  conta_codigo      text,
  conta_nome        text,
  valor_competencia numeric,
  media_historica   numeric,
  variacao_pct      numeric,
  causa_provavel    text,
  descoberta_id     uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_competencia_inicio date := date_trunc('month', p_competencia)::date;
  v_competencia_fim    date := (date_trunc('month', p_competencia) + interval '1 month' - interval '1 day')::date;
  v_historico_inicio   date := (date_trunc('month', p_competencia) - make_interval(months => p_meses_historico))::date;
  rec                  record;
  v_causa              text;
  v_descoberta_id      uuid;
BEGIN
  IF p_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'Sem acesso a esta empresa';
  END IF;

  FOR rec IN
    WITH mes_atual AS (
      SELECT pc.id AS conta_id, pc.codigo, pc.nome,
        COALESCE(SUM(lcp.valor) FILTER (WHERE lcp.tipo = 'debito'), 0)
          - COALESCE(SUM(lcp.valor) FILTER (WHERE lcp.tipo = 'credito'), 0) AS valor_mes
      FROM public.plano_de_contas pc
      JOIN public.lancamento_contabil_partida lcp ON lcp.conta_id = pc.id AND lcp.empresa_id = pc.empresa_id
      JOIN public.lancamento_contabil lc ON lc.id = lcp.lancamento_id
      WHERE pc.empresa_id = p_empresa_id
        AND pc.tipo = 'despesa'
        AND lc.data BETWEEN v_competencia_inicio AND v_competencia_fim
      GROUP BY pc.id, pc.codigo, pc.nome
    ),
    historico_mensal AS (
      SELECT lcp.conta_id, date_trunc('month', lc.data)::date AS mes,
        COALESCE(SUM(lcp.valor) FILTER (WHERE lcp.tipo = 'debito'), 0)
          - COALESCE(SUM(lcp.valor) FILTER (WHERE lcp.tipo = 'credito'), 0) AS valor_mes
      FROM public.lancamento_contabil_partida lcp
      JOIN public.lancamento_contabil lc ON lc.id = lcp.lancamento_id
      JOIN public.plano_de_contas pc ON pc.id = lcp.conta_id
      WHERE lcp.empresa_id = p_empresa_id
        AND pc.tipo = 'despesa'
        AND lc.data >= v_historico_inicio
        AND lc.data < v_competencia_inicio
      GROUP BY lcp.conta_id, date_trunc('month', lc.data)
    ),
    media_historica_cte AS (
      SELECT conta_id, AVG(valor_mes) AS media, COUNT(*) AS qtd_meses
      FROM historico_mensal
      GROUP BY conta_id
    )
    SELECT ma.conta_id, ma.codigo, ma.nome, ma.valor_mes, mh.media, mh.qtd_meses,
      ROUND(((ma.valor_mes - mh.media) / mh.media) * 100, 1) AS variacao_pct
    FROM mes_atual ma
    JOIN media_historica_cte mh ON mh.conta_id = ma.conta_id
    WHERE mh.qtd_meses >= 2
      AND mh.media <> 0
      AND ABS((ma.valor_mes - mh.media) / mh.media) * 100 >= p_limiar_pct
    ORDER BY ABS(ma.valor_mes - mh.media) DESC
  LOOP
    -- causa provável: maior lançamento individual dessa conta na competência
    SELECT COALESCE(f.nome, lc2.descricao) INTO v_causa
    FROM public.lancamento_contabil_partida lcp2
    JOIN public.lancamento_contabil lc2 ON lc2.id = lcp2.lancamento_id
    LEFT JOIN public.contas_pagar cp2 ON lc2.origem_tabela = 'contas_pagar' AND lc2.origem_id = cp2.id
    LEFT JOIN public.fornecedores f ON f.id = cp2.fornecedor_id
    WHERE lcp2.conta_id = rec.conta_id
      AND lcp2.empresa_id = p_empresa_id
      AND lcp2.tipo = 'debito'
      AND lc2.data BETWEEN v_competencia_inicio AND v_competencia_fim
    ORDER BY lcp2.valor DESC
    LIMIT 1;

    -- idempotente: reaproveita descoberta já aberta pra essa conta+competência
    SELECT id INTO v_descoberta_id
    FROM public.contador_descoberta
    WHERE empresa_id = p_empresa_id
      AND tipo = 'anomalia'
      AND status = 'aberto'
      AND evidencia @> jsonb_build_object('conta_id', rec.conta_id, 'competencia', to_char(v_competencia_inicio, 'YYYY-MM'))
    LIMIT 1;

    IF v_descoberta_id IS NULL THEN
      INSERT INTO public.contador_descoberta (
        empresa_id, tipo, prioridade, titulo, descricao, causa, impacto_estimado, evidencia, confianca
      ) VALUES (
        p_empresa_id,
        'anomalia',
        CASE WHEN ABS(rec.valor_mes - rec.media) >= 10000 THEN 'P1' ELSE 'P2' END, -- corte simples por valor absoluto; refinar por % da receita fica pra quando o DRE consolidado (Data Trust) estiver ligado
        rec.nome || ' variou ' || rec.variacao_pct || '% no mês',
        'Despesa em "' || rec.nome || '" foi de ' || rec.media || ' (média de ' || rec.qtd_meses || ' meses) para ' || rec.valor_mes || ' na competência ' || to_char(v_competencia_inicio, 'YYYY-MM') || '.',
        v_causa,
        ABS(rec.valor_mes - rec.media),
        jsonb_build_object(
          'conta_id', rec.conta_id, 'conta_codigo', rec.codigo, 'competencia', to_char(v_competencia_inicio, 'YYYY-MM'),
          'valor_competencia', rec.valor_mes, 'media_historica', rec.media, 'meses_historico', rec.qtd_meses,
          'variacao_pct', rec.variacao_pct, 'limiar_pct', p_limiar_pct
        ),
        'calculo'
      ) RETURNING id INTO v_descoberta_id;
    END IF;

    conta_id := rec.conta_id;
    conta_codigo := rec.codigo;
    conta_nome := rec.nome;
    valor_competencia := rec.valor_mes;
    media_historica := rec.media;
    variacao_pct := rec.variacao_pct;
    causa_provavel := v_causa;
    descoberta_id := v_descoberta_id;
    RETURN NEXT;
  END LOOP;
END;
$$;


-- ============================================================================
-- 3) EQUIPE + CONVITES — tela Equipe dava "Não foi possível concluir"
--    (confirmado no site: "column eq.user_id_convidado does not exist") e o
--    link de convite dizia "não é válido" pra qualquer convite (a função
--    obter_convite_por_token não existe no banco). Causa: CONVITE-EQUIPE-SQL.sql
--    nunca foi rodado. Aqui vai só o que falta, sem sobrescrever a versão
--    mais nova de aceitar_convite (PDV-FASE0), que é recriada igual.
-- ============================================================================

ALTER TABLE public.empresa_equipe
  ADD COLUMN IF NOT EXISTS aceito_em timestamptz,
  ADD COLUMN IF NOT EXISTS user_id_convidado uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS expira_em timestamptz NOT NULL DEFAULT (now() + interval '7 days');

CREATE INDEX IF NOT EXISTS idx_empresa_equipe_token ON public.empresa_equipe (token_convite);

create or replace function public.obter_convite_por_token(p_token text)
returns table (
  empresa_nome text,
  email_convidado text,
  papel text,
  cargo text,
  convite_aceito boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select e.nome, eq.email_convidado, eq.papel, eq.cargo, coalesce(eq.convite_aceito, false)
    from empresa_equipe eq
    join empresas e on e.id = eq.empresa_id
    where eq.token_convite = p_token
    limit 1;
end;
$$;

revoke all on function public.obter_convite_por_token(text) from public;
grant execute on function public.obter_convite_por_token(text) to anon, authenticated;

create or replace function public.listar_equipe(p_empresa_id uuid)
returns table (
  id uuid,
  origem text,
  user_id uuid,
  email text,
  nome text,
  cargo text,
  papel text,
  token_convite text,
  expira_em timestamptz,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.meu_papel(p_empresa_id) <> 'dono' then
    raise exception 'Apenas o proprietário pode ver a equipe.' using errcode = 'AX006';
  end if;

  return query
    -- Ativos com vínculo real em empresa_usuarios
    select eu.id, 'ativo'::text, eu.user_id, u.email::text,
           coalesce(eq.nome, '')::text, coalesce(eq.cargo, '')::text, eu.papel,
           null::text, null::timestamptz, eu.created_at
    from empresa_usuarios eu
    join auth.users u on u.id = eu.user_id
    left join empresa_equipe eq on eq.user_id_convidado = eu.user_id and eq.empresa_id = eu.empresa_id
    where eu.empresa_id = p_empresa_id

    union all

    -- Dono sem linha em empresa_usuarios ainda (não deveria mais acontecer
    -- depois do backfill do item 1, mas fica de proteção permanente —
    -- nunca deixa o proprietário sumir da própria lista de equipe).
    -- LIMITAÇÃO CONHECIDA: o "id" devolvido aqui é e.user_id (id do usuário),
    -- não o id de uma linha real em empresa_usuarios — essa linha não existe
    -- nesse ramo (é exatamente o que falta e o backfill do item 1 resolve).
    -- Não quebra hoje porque a tela (/equipe) esconde lápis/lixeira pra quem
    -- é "(você)" (ehVoce), e é sempre o dono vendo a própria linha aqui. Se um
    -- dia a tela permitir editar/remover essa linha usando esse id, ela vai
    -- apontar pra um id que não existe em empresa_usuarios — não usar esse id
    -- pra UPDATE/DELETE em empresa_usuarios sem antes resolver essa lacuna.
    select e.user_id, 'ativo'::text, e.user_id, u.email::text,
           coalesce(eq.nome, '')::text, coalesce(eq.cargo, '')::text, 'dono'::text,
           null::text, null::timestamptz, e.created_at
    from empresas e
    join auth.users u on u.id = e.user_id
    left join empresa_equipe eq on eq.user_id_convidado = e.user_id and eq.empresa_id = e.id
    where e.id = p_empresa_id
      and not exists (select 1 from empresa_usuarios eu2 where eu2.empresa_id = e.id and eu2.user_id = e.user_id)

    union all

    -- Convites pendentes
    select eq2.id, 'convite'::text, null::uuid, eq2.email_convidado,
           coalesce(eq2.nome, '')::text, coalesce(eq2.cargo, '')::text, eq2.papel,
           eq2.token_convite, eq2.expira_em, eq2.created_at
    from empresa_equipe eq2
    where eq2.empresa_id = p_empresa_id and not coalesce(eq2.convite_aceito, false)

    order by 10 desc; -- 10 = criado_em (em UNION só vale nome/posição da coluna do resultado)
end;
$$;

revoke all on function public.listar_equipe(uuid) from public;
grant execute on function public.listar_equipe(uuid) to authenticated;

create or replace function public.aceitar_convite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_convite record;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar logado para aceitar um convite' using errcode = 'AX007';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_convite
  from empresa_equipe
  where token_convite = p_token
  limit 1;

  if v_convite is null then
    raise exception 'Convite não encontrado' using errcode = 'AX002';
  end if;

  if coalesce(v_convite.convite_aceito, false) then
    raise exception 'Este convite já foi utilizado' using errcode = 'AX003';
  end if;

  if v_convite.expira_em < now() then
    raise exception 'Este convite expirou' using errcode = 'AX004';
  end if;

  if lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro e-mail (%). Entre com a conta correta.', v_convite.email_convidado using errcode = 'AX005';
  end if;

  insert into empresa_usuarios (empresa_id, user_id, papel)
  values (v_convite.empresa_id, v_user_id, coalesce(v_convite.papel, 'leitor'))
  on conflict (empresa_id, user_id) do nothing;

  update empresa_equipe
  set convite_aceito = true, aceito_em = now(), user_id_convidado = v_user_id
  where id = v_convite.id;

  return v_convite.empresa_id;
end;
$$;

revoke all on function public.aceitar_convite(text) from public;
grant execute on function public.aceitar_convite(text) to authenticated;

-- ============================================================================
-- 4) COLUNAS QUE FALTAVAM (arquivos antigos que nunca foram rodados) —
--    cada erro abaixo foi visto no site em 2026-10-01. Tudo ADD COLUMN IF NOT
--    EXISTS: só acrescenta, não apaga nem altera nenhum dado.
-- ============================================================================

-- 4a) MEI (Painel, Cockpit e DAS): "column mei_obrigacoes.competencia does not exist"
--     — status das obrigações do MEI não carregava nem salvava. (MEI-OBRIGACOES-SQL.sql)
ALTER TABLE public.mei_obrigacoes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'DAS',
  ADD COLUMN IF NOT EXISTS competencia text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS data_entrega date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Índice único só se não houver linha repetida (linha antiga ganharia a mesma
-- competência padrão e travaria o arquivo inteiro). Se avisar, me mande o aviso.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.mei_obrigacoes GROUP BY empresa_id, tipo, competencia HAVING count(*) > 1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mei_obrigacoes_unico ON public.mei_obrigacoes (empresa_id, tipo, competencia);
  ELSE
    RAISE NOTICE 'mei_obrigacoes tem linhas repetidas - indice unico NAO criado (avise o Claude)';
  END IF;
END $$;
ALTER TABLE public.mei_declaracoes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS data_entrega date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 4b) MEI Cockpit: "column receitas.considera_teto_mei does not exist"
--     — teto de R$ 81 mil não carregava no Cockpit. (MEI-TETO-FLAG-SQL.sql)
ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS considera_teto_mei boolean NOT NULL DEFAULT true;

-- 4c) PDV Venda: "column empresas.pdv_impressao_automatica does not exist"
--     — config de impressão do cupom não carregava. (PDV-FASE3-ETAPA3-IMPRESSAO-CUPOM-SQL.sql)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pdv_impressao_automatica boolean NOT NULL DEFAULT true;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pdv_cupom_rodape text;

-- 4d) Banco (Open Finance): "column of_transacoes.pluggy_transaction_id does not exist"
--     — transações e conciliação não carregavam. (OPEN-FINANCE-CONCILIACAO-SQL.sql)
ALTER TABLE public.of_transacoes ADD COLUMN IF NOT EXISTS pluggy_transaction_id text;
CREATE UNIQUE INDEX IF NOT EXISTS of_transacoes_pluggy_transaction_id_key
  ON public.of_transacoes (pluggy_transaction_id) WHERE pluggy_transaction_id IS NOT NULL;
ALTER TABLE public.of_transacoes
  ADD COLUMN IF NOT EXISTS lancamento_id uuid,
  ADD COLUMN IF NOT EXISTS lancamento_tabela text CHECK (lancamento_tabela IN ('receitas','custos_variaveis'));
CREATE UNIQUE INDEX IF NOT EXISTS of_transacoes_lancamento_unico
  ON public.of_transacoes (lancamento_tabela, lancamento_id) WHERE lancamento_id IS NOT NULL;
ALTER TABLE public.open_finance ADD COLUMN IF NOT EXISTS saldo_atual numeric;

-- ============================================================================
-- VERIFICAÇÃO (só leitura) — deve listar as 5 funções e as 2 colunas.
-- ============================================================================
SELECT proname FROM pg_proc WHERE proname IN ('ap_decidir_aprovacao','contador_detectar_variacao_despesa','obter_convite_por_token','aceitar_convite','listar_equipe');
SELECT column_name FROM information_schema.columns WHERE table_name = 'empresa_equipe' AND column_name IN ('user_id_convidado','aceito_em');
