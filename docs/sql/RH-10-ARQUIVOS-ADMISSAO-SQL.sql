-- RH-10: arquivo (PDF/foto) em cada documento e exame da admissão — enviar e baixar.
-- Cofre privado "rh-documentos". Caminho: <empresa_id>/<colaborador_id>/<documento|exame>/<tipo>-<carimbo>.<ext>
-- Quem lê: só quem enxerga a linha do item (RLS de rh_admissao_itens: documento = dados pessoais, exame = saúde).
-- Quem envia/remove: precisa de "editar" + a liberação da categoria. Sem atualizar no lugar (troca = novo arquivo).

alter table public.rh_admissao_itens
  add column if not exists arquivo_path text,
  add column if not exists arquivo_nome text check (char_length(arquivo_nome) <= 200),
  add column if not exists arquivo_mime text check (arquivo_mime in ('application/pdf','image/jpeg','image/png','image/webp')),
  add column if not exists arquivo_bytes integer check (arquivo_bytes between 1 and 10485760);
create unique index if not exists rh_adm_itens_arquivo on public.rh_admissao_itens (arquivo_path) where arquivo_path is not null;

-- o caminho do arquivo tem de ser da mesma empresa, pessoa e categoria da linha
create or replace function public.rh_adm_item_confere_arquivo()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.arquivo_path is not null and new.arquivo_path not like (new.empresa_id::text || '/' || new.colaborador_id::text || '/' || new.categoria || '/%') then
    raise exception 'Arquivo fora da pasta deste item' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_adm_item_confere_arquivo on public.rh_admissao_itens;
create trigger rh_adm_item_confere_arquivo before insert or update on public.rh_admissao_itens
  for each row execute function public.rh_adm_item_confere_arquivo();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rh-documentos', 'rh-documentos', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- lê o caminho sem nunca dar erro (caminho malformado = false)
create or replace function public.rh_arquivo_pode_gravar(p_nome text)
returns boolean language plpgsql stable security invoker set search_path to 'public' as $$
declare
  m text[] := regexp_match(p_nome, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/(documento|exame)/[a-z0-9_]+-[0-9]+\.(pdf|jpg|png|webp)$');
begin
  if m is null then return false; end if;
  return public.rh_pode(m[1]::uuid, 'editar')
     and public.rh_pode(m[1]::uuid, case m[3] when 'exame' then 'saude' else 'pessoais' end)
     and exists (select 1 from public.rh_colaboradores c where c.id = m[2]::uuid and c.empresa_id = m[1]::uuid);
end $$;

drop policy if exists rhdocs_select on storage.objects;
drop policy if exists rhdocs_insert on storage.objects;
drop policy if exists rhdocs_delete on storage.objects;
create policy rhdocs_select on storage.objects for select to authenticated
  using (bucket_id = 'rh-documentos' and (exists (select 1 from public.rh_admissao_itens i where i.arquivo_path = name) or public.rh_arquivo_pode_gravar(name)));
create policy rhdocs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'rh-documentos' and public.rh_arquivo_pode_gravar(name));
create policy rhdocs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'rh-documentos' and public.rh_arquivo_pode_gravar(name));
