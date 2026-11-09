-- RH-14C — o arquivo do S-2200 tem CPF, endereço e salário: só lê quem tem as liberações de dados pessoais E de salário
-- (antes bastava "ver" o RH). Mesmo critério para preparar (gravar). Rodar DEPOIS de RH-14 e RH-14B.
drop policy if exists le on public.rh_esocial_eventos;
create policy le on public.rh_esocial_eventos for select to authenticated
  using (public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario'));
drop policy if exists insere on public.rh_esocial_eventos;
create policy insere on public.rh_esocial_eventos for insert to authenticated
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario'));
-- CONFERÊNCIA (esperado: 2 regras, as duas exigindo pessoais e salário)
select policyname, cmd, coalesce(qual, with_check) like '%pessoais%salario%' as exige_pessoais_e_salario
from pg_policies where tablename = 'rh_esocial_eventos' order by policyname;
