create table public.clearance_status (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  unit_id uuid not null,
  semester_id uuid null references public.semesters(id),
  status character varying not null default 'pending'::character varying,
  amount_owed numeric null default 0,
  rejection_reason text null,
  updated_at timestamp with time zone not null default now(),
  constraint clearance_status_pkey primary key (id),
  constraint user_unit_semester_unique unique (user_id, unit_id, semester_id),
  constraint clearance_status_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE,
  constraint clearance_status_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;