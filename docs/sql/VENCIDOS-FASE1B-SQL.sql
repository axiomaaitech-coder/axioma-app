-- AXIOMA OVERDUE INTELLIGENCE — Fase 1 (complemento da versão recuperada do pedido). 2026-11-02.
-- Só acrescenta/relaxa listas e troca políticas das tabelas NOVAS da Fase 1. Nenhum dado é apagado.

-- 1) Causas novas: esquecimento, insolvência informada, problema documental
alter table public.vencido_caso drop constraint if exists vencido_caso_causa_check;
alter table public.vencido_caso add constraint vencido_caso_causa_check check (causa in ('financeiro','liquidez','divergencia_comercial','entrega','qualidade','nota_fiscal','documental','erro_administrativo','contestacao_contratual','pagamento','esquecimento','insolvencia','desconhecido'));
-- 2) Disputa "outros"
alter table public.vencido_caso drop constraint if exists vencido_caso_disputa_tipo_check;
alter table public.vencido_caso add constraint vencido_caso_disputa_tipo_check check (disputa_tipo is null or disputa_tipo in ('valor','nota_fiscal','entrega','qualidade','devolucao','duplicidade','contrato','desconto','outros'));
-- 3) Fornecedor: impacto na produção e nas vendas (Supplier Payment Priority)
alter table public.vencido_caso add column if not exists impacto_producao boolean not null default false;
alter table public.vencido_caso add column if not exists impacto_vendas boolean not null default false;
-- 4) Promessa: confirmada / cancelada (as demais situações são calculadas)
alter table public.cobranca_compromissos drop constraint if exists cobranca_compromissos_status_check;
alter table public.cobranca_compromissos add constraint cobranca_compromissos_status_check check (status is null or status in ('pendente','confirmado','cumprido','quebrado','cancelado'));

-- 5) Permissões por papel (governança): ler = quem já lê o financeiro; gravar caso/evento/promessa =
--    dono, sócio, admin, financeiro; configuração = dono, sócio, admin; aprovar negociação = dono, sócio, admin (trava do evento).
--    leitor e contábil só leem; operador não acessa (mesma regra de empresas_do_usuario_operacional).
create or replace function public.vencido_pode_gravar(p_empresa uuid, p_config boolean default false) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.meu_papel(p_empresa), '') = any (case when p_config then array['dono','socio','admin'] else array['dono','socio','admin','financeiro'] end)
$$;

drop policy if exists vencido_caso_multi_tenant on public.vencido_caso;
drop policy if exists vencido_caso_ler on public.vencido_caso;
drop policy if exists vencido_caso_gravar on public.vencido_caso;
drop policy if exists vencido_caso_alterar on public.vencido_caso;
create policy vencido_caso_ler on public.vencido_caso for select using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy vencido_caso_gravar on public.vencido_caso for insert with check (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id));
create policy vencido_caso_alterar on public.vencido_caso for update using (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id)) with check (public.vencido_pode_gravar(empresa_id));
-- (sem delete: caso não some; o histórico depende dele)

drop policy if exists vencido_evento_inserir on public.vencido_evento;
create policy vencido_evento_inserir on public.vencido_evento for insert with check (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id));

drop policy if exists vencido_config_multi_tenant on public.vencido_config;
drop policy if exists vencido_config_ler on public.vencido_config;
drop policy if exists vencido_config_gravar on public.vencido_config;
create policy vencido_config_ler on public.vencido_config for select using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy vencido_config_gravar on public.vencido_config for all using (public.vencido_pode_gravar(empresa_id, true)) with check (public.vencido_pode_gravar(empresa_id, true));

-- previsão: a foto do dia é gravada por quem abre a análise (qualquer papel que lê) — não é decisão, é registro
