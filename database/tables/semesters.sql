create table public.semesters (
  id uuid not null default gen_random_uuid (),
  session text not null,
  semester text not null,
  is_current boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint semesters_pkey primary key (id)
) TABLESPACE pg_default;

-- Add semester_id to clearance_status
alter table public.clearance_status add column semester_id uuid references public.semesters(id);

-- Update clearance_status unique constraint
alter table public.clearance_status drop constraint user_unit_unique;
alter table public.clearance_status add constraint user_unit_semester_unique unique (user_id, unit_id, semester_id);

-- Add semester_id to receipts
alter table public.receipts add column semester_id uuid references public.semesters(id);
