# Database Documentation

This directory contains SQL scripts for defining the database schema and initial data.

## Tables (`database/tables/`)

1.  **`profiles`**: User profiles for students and staff.
2.  **`students`**: Student-specific information linked to profiles.
3.  **`units`**: Administrative units (e.g., Bursary, Library).
4.  **`fees`**: Fee definitions and their associated units.
5.  **`receipts`**: Student receipt uploads and approval status.
6.  **`clearance_status`**: Clearance progress for student/unit pairs.
7.  **`notifications`**: System notifications for students.
8.  **`fee_unit_mappings`**: Junction table for mapping fees to multiple units.
9.  **`semesters`**: Academic sessions and semesters.

## Security (RLS) (`database/policies/`)

Row Level Security is enabled on all tables to ensure data privacy and integrity.

- **`profiles`**: Users view/edit own; staff view all.
- **`students`**: Students view own; staff view all.
- **`units`**: Public read for authenticated users.
- **`fees`**: Public read for authenticated users; staff manage.
- **`receipts`**: Students manage own; staff view/update all.
- **`clearance_status`**: Students view own; staff manage all.
- **`notifications`**: Students view own; staff manage all.
- **`fee_unit_mappings`**: Public read for authenticated users; staff manage.
- **`semesters`**: Public read for authenticated users; authorized staff manage.

## Setup Instructions

1.  Run all scripts in `database/tables/` to create the schema.
2.  Run all scripts in `database/policies/` to enable RLS and set access rules.
3.  (Optional) Run population scripts in the root directory to add initial data.
