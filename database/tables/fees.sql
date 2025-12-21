create table public.fees (
  id uuid not null default gen_random_uuid (),
  name character varying not null,
  amount numeric not null,
  account_number character varying not null,
  description text null,
  unit character varying not null,
  department_id uuid null,
  department character varying null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fees_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_fees_updated_at BEFORE
update on fees for EACH row
execute FUNCTION update_updated_at_column ();