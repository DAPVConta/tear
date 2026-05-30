-- ============================================================
-- TEAR — Schema inicial (multi-tenant) + RLS
-- Postgres / Supabase. Migrado do legado (MySQL/Drizzle).
-- Tenant = clínica. Isolamento por clinic_id + Row Level Security.
-- ============================================================

-- ---------- ENUMS ----------
create type platform_role as enum ('member', 'platform_admin');
create type member_role as enum ('clinic_admin', 'therapist', 'receptionist');
create type clinic_plan as enum ('trial', 'basic', 'professional', 'enterprise');
create type clinic_plan_status as enum ('active', 'past_due', 'canceled', 'trialing');
create type specialty as enum (
  'psicologia_aba', 'fonoaudiologia', 'terapia_ocupacional_is',
  'terapia_ocupacional_avds', 'fisioterapia', 'psicopedagogia',
  'musicoterapia', 'neuropsicologia'
);
create type gender as enum ('masculino', 'feminino', 'outro');
create type payment_type as enum ('operadora', 'particular');
create type authorization_status as enum ('ativa', 'vencida', 'cancelada', 'esgotada');
create type plan_status as enum ('ativo', 'revisao', 'encerrado');
create type goal_status as enum ('em_andamento', 'adquirida', 'em_manutencao', 'descontinuada');
create type attendance_type as enum (
  'individual_presencial', 'individual_domiciliar',
  'individual_escolar', 'grupo_presencial'
);
create type prompting_level as enum (
  'fisica_total', 'fisica_parcial', 'gestual', 'verbal', 'independente'
);
create type evolution_assessment as enum (
  'evolucao_significativa', 'evolucao_leve', 'estavel',
  'retrocesso_leve', 'retrocesso_significativo'
);
create type guardian_validation_method as enum ('assinatura_digital', 'token', 'presencial');
create type attendance_status as enum (
  'presente', 'falta_justificada', 'falta_injustificada',
  'cancelado_clinica', 'cancelado_paciente'
);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- TABELAS ----------

-- Perfis (espelham auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  platform_role platform_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clínicas (tenants)
create table public.clinics (
  id bigint generated always as identity primary key,
  name varchar(255) not null,
  cnpj varchar(18) not null unique,
  trade_name varchar(255),
  email varchar(320) not null,
  phone varchar(20),
  address text,
  city varchar(100),
  state varchar(2),
  zip_code varchar(10),
  plan clinic_plan not null default 'trial',
  plan_status clinic_plan_status not null default 'trialing',
  trial_ends_at timestamptz,
  max_professionals int not null default 5,
  max_patients int not null default 50,
  logo_url varchar(500),
  theme jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membros da clínica (vínculo usuário ↔ clínica + papel)
create table public.clinic_members (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null,
  active boolean not null default true,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

-- Profissionais / terapeutas
create table public.professionals (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name varchar(255) not null,
  cpf varchar(14) not null,
  specialty specialty not null,
  council_type varchar(20) not null,
  council_number varchar(30) not null,
  council_state varchar(2) not null,
  email varchar(320),
  phone varchar(20),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pacientes
create table public.patients (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  name varchar(255) not null,
  cpf varchar(14),
  birth_date date not null,
  gender gender not null,
  guardian_name varchar(255) not null,
  guardian_cpf varchar(14) not null,
  guardian_phone varchar(20) not null,
  guardian_email varchar(320),
  payment_type payment_type not null default 'operadora',
  health_plan_name varchar(255),
  health_plan_card varchar(50),
  cid10_primary varchar(10) not null,
  cid10_secondary varchar(10),
  diagnosis text,
  address text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guias / autorizações
create table public.authorizations (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  patient_id bigint not null references public.patients(id) on delete cascade,
  guide_number varchar(50) not null,
  authorization_date date not null,
  expiration_date date not null,
  procedure_code varchar(20) not null,
  procedure_name varchar(255) not null,
  authorized_quantity int not null,
  used_quantity int not null default 0,
  specialty specialty not null,
  status authorization_status not null default 'ativa',
  observations text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plano Terapêutico Singular (PTS)
create table public.therapeutic_plans (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  patient_id bigint not null references public.patients(id) on delete cascade,
  professional_id bigint not null references public.professionals(id) on delete restrict,
  title varchar(255) not null,
  start_date date not null,
  end_date date,
  frequency varchar(100) not null,
  session_duration int not null,
  general_objective text not null,
  status plan_status not null default 'ativo',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Metas do PTS
create table public.therapeutic_goals (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  plan_id bigint not null references public.therapeutic_plans(id) on delete cascade,
  description text not null,
  category varchar(100) not null,
  target_criteria text not null,
  current_progress numeric(5,2) not null default 0,
  status goal_status not null default 'em_andamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evolução diária
create table public.daily_evolutions (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  patient_id bigint not null references public.patients(id) on delete cascade,
  professional_id bigint not null references public.professionals(id) on delete restrict,
  authorization_id bigint references public.authorizations(id) on delete set null,
  plan_id bigint references public.therapeutic_plans(id) on delete set null,
  is_private boolean not null default false,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  session_duration_minutes int not null,
  attendance_type attendance_type not null,
  goals_worked jsonb not null default '[]'::jsonb,
  skills_worked jsonb not null default '[]'::jsonb,
  prompting_level prompting_level not null,
  behavioral_notes text,
  behavioral_intervention text,
  session_summary text not null,
  evolution_assessment evolution_assessment not null,
  next_session_plan text not null,
  incidents text,
  professional_signature boolean not null default false,
  signed_at timestamptz,
  guardian_presence_validation boolean not null default false,
  guardian_validation_method guardian_validation_method,
  locked boolean not null default false,
  locked_at timestamptz,
  addendum jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evolução mensal
create table public.monthly_evolutions (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  patient_id bigint not null references public.patients(id) on delete cascade,
  professional_id bigint not null references public.professionals(id) on delete restrict,
  reference_month int not null,
  reference_year int not null,
  total_sessions int not null,
  total_present int not null,
  total_absent int not null,
  goals_progress jsonb not null default '[]'::jsonb,
  generated_summary text not null,
  professional_review text,
  approved boolean not null default false,
  approved_at timestamptz,
  conclusion text,
  next_month_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registro de presença / frequência
create table public.attendance_records (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete cascade,
  patient_id bigint not null references public.patients(id) on delete cascade,
  professional_id bigint not null references public.professionals(id) on delete restrict,
  authorization_id bigint references public.authorizations(id) on delete set null,
  session_date date not null,
  status attendance_status not null,
  justification text,
  evolution_id bigint references public.daily_evolutions(id) on delete set null,
  guardian_signature boolean not null default false,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auditoria
create table public.audit_logs (
  id bigint generated always as identity primary key,
  clinic_id bigint references public.clinics(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action varchar(100) not null,
  table_name varchar(100) not null,
  record_id bigint,
  old_values jsonb,
  new_values jsonb,
  ip_address varchar(45),
  created_at timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
create index idx_clinic_members_user on public.clinic_members(user_id);
create index idx_clinic_members_clinic on public.clinic_members(clinic_id);
create index idx_professionals_clinic on public.professionals(clinic_id);
create index idx_patients_clinic on public.patients(clinic_id);
create index idx_authorizations_clinic on public.authorizations(clinic_id);
create index idx_authorizations_patient on public.authorizations(patient_id);
create index idx_therapeutic_plans_clinic on public.therapeutic_plans(clinic_id);
create index idx_therapeutic_plans_patient on public.therapeutic_plans(patient_id);
create index idx_therapeutic_goals_clinic on public.therapeutic_goals(clinic_id);
create index idx_therapeutic_goals_plan on public.therapeutic_goals(plan_id);
create index idx_daily_evolutions_clinic on public.daily_evolutions(clinic_id);
create index idx_daily_evolutions_patient on public.daily_evolutions(patient_id);
create index idx_monthly_evolutions_clinic on public.monthly_evolutions(clinic_id);
create index idx_attendance_records_clinic on public.attendance_records(clinic_id);
create index idx_audit_logs_clinic on public.audit_logs(clinic_id);

-- ---------- updated_at triggers ----------
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_clinics_updated before update on public.clinics for each row execute function public.set_updated_at();
create trigger trg_clinic_members_updated before update on public.clinic_members for each row execute function public.set_updated_at();
create trigger trg_professionals_updated before update on public.professionals for each row execute function public.set_updated_at();
create trigger trg_patients_updated before update on public.patients for each row execute function public.set_updated_at();
create trigger trg_authorizations_updated before update on public.authorizations for each row execute function public.set_updated_at();
create trigger trg_therapeutic_plans_updated before update on public.therapeutic_plans for each row execute function public.set_updated_at();
create trigger trg_therapeutic_goals_updated before update on public.therapeutic_goals for each row execute function public.set_updated_at();
create trigger trg_daily_evolutions_updated before update on public.daily_evolutions for each row execute function public.set_updated_at();
create trigger trg_monthly_evolutions_updated before update on public.monthly_evolutions for each row execute function public.set_updated_at();

-- ---------- Novo usuário → perfil ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNÇÕES AUXILIARES DE RLS (SECURITY DEFINER p/ evitar recursão)
-- ============================================================
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'platform_admin'
  );
$$;

create or replace function public.is_clinic_member(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_members
    where user_id = auth.uid() and clinic_id = cid and active = true
  );
$$;

create or replace function public.is_clinic_admin(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_members
    where user_id = auth.uid() and clinic_id = cid
      and role = 'clinic_admin' and active = true
  );
$$;

-- ============================================================
-- RPC: criação de clínica + vínculo do criador como admin (atômico)
-- ============================================================
create or replace function public.create_clinic(
  p_name varchar,
  p_cnpj varchar,
  p_email varchar,
  p_phone varchar default null,
  p_trade_name varchar default null
)
returns public.clinics language plpgsql security definer set search_path = public as $$
declare
  v_clinic public.clinics;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.clinics (name, cnpj, email, phone, trade_name, trial_ends_at)
  values (p_name, p_cnpj, p_email, p_phone, p_trade_name, now() + interval '14 days')
  returning * into v_clinic;

  insert into public.clinic_members (clinic_id, user_id, role, joined_at)
  values (v_clinic.id, auth.uid(), 'clinic_admin', now());

  return v_clinic;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.professionals enable row level security;
alter table public.patients enable row level security;
alter table public.authorizations enable row level security;
alter table public.therapeutic_plans enable row level security;
alter table public.therapeutic_goals enable row level security;
alter table public.daily_evolutions enable row level security;
alter table public.monthly_evolutions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- clinics
create policy clinics_select on public.clinics for select to authenticated
  using (public.is_clinic_member(id) or public.is_platform_admin());
create policy clinics_update on public.clinics for update to authenticated
  using (public.is_clinic_admin(id) or public.is_platform_admin())
  with check (public.is_clinic_admin(id) or public.is_platform_admin());
create policy clinics_insert on public.clinics for insert to authenticated
  with check (public.is_platform_admin());
create policy clinics_delete on public.clinics for delete to authenticated
  using (public.is_platform_admin());

-- clinic_members
create policy clinic_members_select on public.clinic_members for select to authenticated
  using (public.is_clinic_member(clinic_id) or public.is_platform_admin());
create policy clinic_members_insert on public.clinic_members for insert to authenticated
  with check (public.is_clinic_admin(clinic_id) or public.is_platform_admin());
create policy clinic_members_update on public.clinic_members for update to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin())
  with check (public.is_clinic_admin(clinic_id) or public.is_platform_admin());
create policy clinic_members_delete on public.clinic_members for delete to authenticated
  using (public.is_clinic_admin(clinic_id) or public.is_platform_admin());

-- Macro de políticas por clínica para tabelas clínicas
do $$
declare t text;
begin
  foreach t in array array[
    'professionals','patients','authorizations','therapeutic_plans',
    'therapeutic_goals','daily_evolutions','monthly_evolutions',
    'attendance_records','audit_logs'
  ] loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated using (public.is_clinic_member(clinic_id) or public.is_platform_admin());',
      t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_clinic_member(clinic_id));',
      t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated using (public.is_clinic_member(clinic_id)) with check (public.is_clinic_member(clinic_id));',
      t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_clinic_member(clinic_id) or public.is_platform_admin());',
      t);
  end loop;
end;
$$;
