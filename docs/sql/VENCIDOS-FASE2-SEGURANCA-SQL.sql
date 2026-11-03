-- Contas Vencidas — Fase 2 etapa 15 (segurança), 2026-11-03. Rodar bloco a bloco no SQL Editor.
-- Achados da revisão (tabelas já isolavam uma Empresa da outra; o ajuste é de PAPEL dentro da Empresa):
--  1) Contatos e promessas de cobrança: leitor e contábil conseguiam gravar e APAGAR DE VEZ pelo banco
--     (a tela usa lixeira de 60 dias; apagar de vez não deve existir para ninguém).
--  2) Funções internas das travas podiam ser chamadas por quem não fez login (resposta era sempre "não", mas não precisa estar aberto).
--  3) Tabelas do módulo apareciam no catálogo para quem não fez login (sem dados, as travas já bloqueavam).

-- ═══ BLOCO 1 — contatos de cobrança: ler = Empresa; gravar/alterar = dono, sócio, admin, financeiro; apagar de vez = ninguém ═══
drop policy if exists cobranca_interacoes_multi_tenant on public.cobranca_interacoes;
create policy cobranca_interacoes_ler on public.cobranca_interacoes for select to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy cobranca_interacoes_gravar on public.cobranca_interacoes for insert to authenticated
  with check (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id));
create policy cobranca_interacoes_alterar on public.cobranca_interacoes for update to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id))
  with check (public.vencido_pode_gravar(empresa_id));
-- ═══ FIM BLOCO 1 ═══

-- ═══ BLOCO 2 — promessas de pagamento: mesma regra ═══
drop policy if exists cobranca_compromissos_multi_tenant on public.cobranca_compromissos;
create policy cobranca_compromissos_ler on public.cobranca_compromissos for select to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy cobranca_compromissos_gravar on public.cobranca_compromissos for insert to authenticated
  with check (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id));
create policy cobranca_compromissos_alterar on public.cobranca_compromissos for update to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional()) and public.vencido_pode_gravar(empresa_id))
  with check (public.vencido_pode_gravar(empresa_id));
-- ═══ FIM BLOCO 2 ═══

-- ═══ BLOCO 3 — fechar funções internas e catálogo para quem não fez login ═══
revoke execute on function public.vencido_pode_gravar(uuid, boolean) from anon, public;
grant execute on function public.vencido_pode_gravar(uuid, boolean) to authenticated;
revoke execute on function public.vencido_caso_conferir() from anon, authenticated, public;
revoke execute on function public.vencido_evento_conferir() from anon, authenticated, public;
revoke all on public.vencido_caso, public.vencido_evento, public.vencido_config, public.vencido_previsao,
  public.cobranca_interacoes, public.cobranca_compromissos from anon;
-- ═══ FIM BLOCO 3 ═══

-- ═══ BLOCO 4 — conferência (só leitura) ═══
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('cobranca_interacoes', 'cobranca_compromissos') order by 1, 3;
-- ═══ FIM BLOCO 4 ═══
