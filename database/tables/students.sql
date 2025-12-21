create table public.students (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  track_no text not null,
  email text not null,
  created_at timestamp with time zone not null default now(),
  constraint students_pkey primary key (id),
  constraint students_track_no_key unique (track_no),
  constraint students_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;