# Scripts Documentation

This directory contains Python scripts used for seeding the database with initial data and test users. These scripts utilize the `supabase` Python client and environment variables for configuration.

## Prerequisites

- Python 3.x installed.
- `python-dotenv` and `supabase` packages installed.
- `.env` file present in the project root with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Files

### `add_user.py`

Creates initial staff and student users to bootstrap the system.

- **Creates**:
  - A Bursary Officer (`bur@aju.ng`) with staff ID `BUR001`.
  - A Test Student (`test@aju.ng`) with track number `25/132001`.
- **Process**:
  1. Creates the user in Supabase Auth.
  2. Creates a corresponding record in the `profiles` table with appropriate role-specific metadata (unit for staff, department/track_no for students).

### `add_test_student.py`

A simplified script focused solely on creating a single test student account.

- **Creates**: Student `test@aju.ng` (password: `123456`).
- **Process**:
  1. Creates Auth user.
  2. Creates `profiles` record.
  3. Creates `students` record.

### `add_remaining_units.py`

Bulk creates staff accounts for all remaining administrative units.

- **Creates**: Staff accounts for:
  - Exams & Records (`exams@aju.ng`)
  - Department Officer (`department@aju.ng`)
  - Admissions (`admissions@aju.ng`)
  - Faculty (`faculty@aju.ng`)
  - Library (`library@aju.ng`)
  - Student Affairs (`studentaffairs@aju.ng`)
  - Accounts (`accounts@aju.ng`)
  - Hospital (`hospital@aju.ng`)
- **Process**: Iterates through a list of predefined users, creating Auth accounts and Profile records for each.
