create table public.units (
  id uuid not null default gen_random_uuid (),
  name character varying not null,
  priority character varying null default 'medium'::character varying,
  created_at timestamp with time zone not null default now(),
  constraint units_pkey primary key (id),
  constraint units_name_key unique (name)
) TABLESPACE pg_default;