# Database Documentation

This directory contains SQL scripts for defining the database schema and initial data.

## Files

### `schema.sql`

The main schema definition file. It sets up the core tables, relationships, and security policies.

#### Tables

1. **`units`**: Stores administrative units (e.g., Bursary, Library).
2. **`students`**: Stores student profile information, linked to Auth users.
3. **`receipts`**: Stores payment receipt metadata, linked to students and fees.
4. **`clearance_status`**: Tracks the clearance status (Cleared/Pending/Rejected) for a student against a specific unit.
5. **`fees`** (Referenced): Referenced in receipts, stores fee definitions.

#### Security (RLS)

- **Row Level Security** is enabled on all tables.
- **Policies**:
  - `units`: Public read access for authenticated users.
  - `students`: Users can view their own profile.
  - `receipts`: Students view their own; Staff/Admins view all. Students can insert their own.
  - `clearance_status`: Students view their own; Staff/Admins view all. Only Staff/Admins can update.

#### Initial Data

- Inserts default administrative units (ICT, Bursary, Library, etc.) into the `units` table.

### `notifications.sql`

Defines the notification system schema.

#### Table: `notifications`

- **`id`**: UUID primary key.
- **`student_id`**: Foreign key to `students` table.
- **`message`**: Content of the notification.
- **`type`**: Type of notification (e.g., 'info', 'rejection').
- **`is_read`**: Boolean flag for read status.
