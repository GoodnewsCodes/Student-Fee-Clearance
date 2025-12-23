create table public.receipts (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  semester_id uuid null references public.semesters(id),
  "imageUrl" text not null,
  status character varying(20) not null default 'pending'::character varying,
  amount numeric null,
  rejection_reason text null,
  uploaded_at timestamp with time zone not null default now(),
  file_path text null,
  fee_id uuid null,
  academic_year integer null,
  semester character varying(10) null,
  approved_by_bursary boolean null default false,
  approved_by_accounts boolean null default false,
  constraint receipts_pkey primary key (id),
  constraint receipts_fee_id_fkey foreign KEY (fee_id) references fees (id),
  constraint receipts_student_id_fkey foreign KEY (student_id) references students (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trigger_clear_units_on_receipt_approval
after
update on receipts for EACH row
execute FUNCTION clear_units_for_approved_receipt ();