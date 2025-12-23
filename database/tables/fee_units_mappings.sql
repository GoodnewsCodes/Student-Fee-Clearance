create table public.fee_unit_mappings (
  id uuid not null default gen_random_uuid (),
  fee_id uuid not null,
  unit_name character varying not null,
  created_at timestamp with time zone not null default now(),
  constraint fee_unit_mappings_pkey primary key (id),
  constraint fee_unit_mappings_fee_id_fkey foreign KEY (fee_id) references fees (id) on delete CASCADE
) TABLESPACE pg_default;