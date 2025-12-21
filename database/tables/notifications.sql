create table public.notifications (
  id uuid not null default gen_random_uuid (),
  student_id uuid null,
  message text not null,
  type character varying(50) null default 'info'::character varying,
  is_dismissable boolean null default true,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_student_id_fkey foreign KEY (student_id) references students (id) on delete CASCADE
) TABLESPACE pg_default;