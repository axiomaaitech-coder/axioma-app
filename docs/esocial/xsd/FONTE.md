# Esquemas oficiais do eSocial (S-1.3)

Arquivo "Esquemas XSD eSocial - Leiautes v. S-1.3 (até NT 07/2026 rev.) - produção em 26/10/2026", baixado em 08/11/2026 de
https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/2026-10-26_esquemas_xsd_v_s_01_03_00-1-1.zip
(sha256 do zip: 0f0cc812d3fb7cdd057d3ae048356de45be81ea08ca733992b3337a0fb7c7648).
O pacote de 23/11/2026 tem o `evtAdmissao.xsd` idêntico (conferido).

Usados só no teste `scripts/check-rh-esocial.mts` (via `scripts/valida-xsd.py`) para conferir o S-2200 gerado em `lib/rhEsocial.ts`.
A assinatura digital (`ds:Signature`) é exigida pelo esquema, mas quem assina é o contador, com o certificado dele,
na hora do envio — por isso o teste valida tudo menos a assinatura.
