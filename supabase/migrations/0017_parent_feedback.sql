-- Correção #8 — "Devolutiva para os Pais": novo tipo de atendimento na evolução
-- diária com layout próprio (linguagem acessível p/ familiares) e PDF em 2 vias.
--
-- Obs.: o valor de enum é adicionado fora de transação (ALTER TYPE ADD VALUE):
--   alter type public.attendance_type add value if not exists 'devolutiva_pais';
-- Já aplicado ao projeto; mantido aqui como registro.

-- Campos estruturados da devolutiva (texto acessível para os pais):
-- { previous_activities, next_activities, home_guidance }.
alter table public.daily_evolutions
  add column if not exists parent_feedback jsonb;
