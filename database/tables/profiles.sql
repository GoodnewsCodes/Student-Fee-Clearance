create table public.profiles (
  user_id uuid not null,
  name text null,
  email text null,
  role text not null,
  track_no text null,
  staff_id text null,
  department text null,
  unit text null,
  created_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (user_id),
  constraint profiles_email_key unique (email),
  constraint profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (array['student'::text, 'staff'::text])
    )
  )
) TABLESPACE pg_default;