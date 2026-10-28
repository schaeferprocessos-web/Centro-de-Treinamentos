-- Centro de Treinamentos Schaefer Yachts
-- Sem login: as políticas abaixo permitem acesso anônimo. Use somente após aprovação da empresa.
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  registration text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  assessment_name text not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  assessment_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists assessments_employee_idx on public.assessments(employee_id);
create index if not exists assessments_course_idx on public.assessments(course_id);
create index if not exists assessments_date_idx on public.assessments(assessment_date);

alter table public.employees enable row level security;
alter table public.courses enable row level security;
alter table public.assessments enable row level security;

drop policy if exists "public access employees" on public.employees;
drop policy if exists "public access courses" on public.courses;
drop policy if exists "public access assessments" on public.assessments;
create policy "public access employees" on public.employees for all to anon, authenticated using (true) with check (true);
create policy "public access courses" on public.courses for all to anon, authenticated using (true) with check (true);
create policy "public access assessments" on public.assessments for all to anon, authenticated using (true) with check (true);
