# SQL Scripts Documentation

This document details the purpose and functionality of the root-level SQL scripts used for database management and population.

## Files

### `create_multi_unit_clearance_function.sql`

**Purpose**: Automates the clearance process when a fee receipt is approved.

- **Function**: `clear_units_for_approved_receipt()`
  - Triggered after an update on the `receipts` table.
  - Checks if the status changed to `approved`.
  - Updates the `clearance_status` table to set `status = 'cleared'` for all units associated with the approved fee.
- **Trigger**: `trigger_clear_units_on_receipt_approval` on `receipts` table.

### `populate_clearance_direct.sql`

**Purpose**: Seeds initial clearance status records for students based on their profile.

- **Logic**:
  - Inserts records into `clearance_status` for every student-unit combination.
  - Sets initial status and amount owed based on the unit:
    - **Bursary**: 50,000 (Status: `submit_receipt`)
    - **Library**: 5,000 (Status: `submit_receipt`)
    - **Hospital**: 10,000 (Status: `submit_receipt`)
    - **Others**: 0 (Status: `pending`)

### `populate_clearance_status.sql`

**Purpose**: A simpler version of clearance population.

- **Logic**:
  - Creates a `Pending` clearance status record for every student across _all_ defined units in the `units` table.
  - Uses a `CROSS JOIN` between `students` and `units`.

### `populate_students.sql`

**Purpose**: Syncs student data from the `profiles` table to the `students` table.

- **Logic**:
  - Selects all users with `role = 'student'` from `profiles`.
  - Inserts their `user_id`, `name`, `track_no`, and `email` into the `students` table.
  - Useful for ensuring the `students` table is populated if users were created only in `profiles`.
