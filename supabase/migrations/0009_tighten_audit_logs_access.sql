-- Audit logs contêm CPFs, contatos e dados sensíveis: restringe SELECT
-- a clinic_admin/platform_admin (terapeutas/recepcionistas não veem).
drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs for select to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

-- DELETE e UPDATE em audit_logs: nunca permitido pela API.
drop policy if exists "audit_logs_update" on public.audit_logs;
drop policy if exists "audit_logs_delete" on public.audit_logs;
