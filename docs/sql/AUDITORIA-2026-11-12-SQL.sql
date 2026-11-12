-- Auditoria 2026-11-12 — proteção: dia de vencimento só de 1 a 31.
-- Achado: "Aluguel" (Minha Empresa, criado 17/08/2026, antes da validação da tela) salvo com dia 1017.
-- NOT VALID: vale para toda gravação nova sem travar por causa da linha antiga (que o Elias corrige com o dia certo).
alter table public.custos_fixos drop constraint if exists custos_fixos_dia_valido;
alter table public.custos_fixos add constraint custos_fixos_dia_valido check (dia_vencimento between 1 and 31) not valid;
alter table public.mei_dados drop constraint if exists mei_dados_dia_das_valido;
alter table public.mei_dados add constraint mei_dados_dia_das_valido check (dia_vencimento_das is null or dia_vencimento_das between 1 and 31);
