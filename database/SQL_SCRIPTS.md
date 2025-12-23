# SQL Scripts Documentation

This document details the database schema and security policies for the Student Fee Clearance system.

## Table Definitions (`database/tables/`)

1.  **`profiles.sql`**: Defines user profiles (students and staff).
2.  **`students.sql`**: Stores student-specific data linked to profiles.
3.  **`units.sql`**: Defines administrative units (Bursary, Library, etc.).
4.  **`fees.sql`**: Defines various fees and their associated units.
5.  **`receipts.sql`**: Tracks student receipt uploads and approvals.
6.  **`clearance_status.sql`**: Tracks clearance progress for each student/unit pair.
7.  **`notifications.sql`**: Manages system notifications for students.
8.  **`fee_units_mappings.sql`**: Junction table for mapping fees to multiple units (Table: `fee_unit_mappings`).
9.  **`semesters.sql`**: Stores academic sessions and semesters.

## Security Policies (`database/policies/`)

All tables have Row Level Security (RLS) enabled. The following scripts define the access control:

1.  **`profiles.sql`**: Users can manage their own profiles; staff can read all.
2.  **`students.sql`**: Students read own; staff read all.
3.  **`units.sql`**: Public read for authenticated users.
4.  **`fees.sql`**: Public read for authenticated users; bursary staff manage.
5.  **`receipts.sql`**: Students manage own; staff read/update all.
6.  **`clearance_status_policies.sql`**: Students read own; staff manage all.
7.  **`notifications.sql`**: Students read own; staff manage all.
8.  **`fee_units_mappings.sql`**: Public read for authenticated users; staff manage (Table: `fee_unit_mappings`).
9.  **`semesters.sql`**: Public read for authenticated users; authorized staff manage.
