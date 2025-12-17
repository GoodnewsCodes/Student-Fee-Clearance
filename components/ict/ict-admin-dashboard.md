# ICT Admin Dashboard Component

**File:** `components/ict/ict-admin-dashboard.tsx`

## Overview

The `ICTAdminDashboard` is a specialized dashboard for ICT Administrators. In addition to standard verification features, it provides advanced capabilities for user management and system administration.

## Features

### 1. User Management (CRUD)

- **Register Users**:
  - Create new **Student** accounts (requires Track No, Department).
  - Create new **Staff** accounts (requires Staff ID, Unit).
  - Automatically creates Auth user, Profile record, and Student record (if applicable).
- **Manage Users**:
  - Integrates the `UserManagement` component to list, search, and delete users.

### 2. Verification & Clearance

- **Student Verification**: Includes the `VerificationScreen` to check clearance status.
- **Receipt Processing**: Capabilities to view and process receipts (similar to the main dashboard).

### 3. Administrative Tools

- **Change Password**: Allows the admin to update their own password.
- **Real-time Updates**: Subscribes to receipt changes to keep the dashboard current.

## Key Functions

- `handleRegisterUser`: Complex transaction to create a user across multiple tables (Auth, Profiles, Students).
- `handleSearch`: Finds students by track number or name for verification.
- `handleReceiptAction`: Approves or rejects receipts.

## Dependencies

- `VerificationScreen`: For student clearance checks.
- `UserManagement`: For listing and deleting users.
- `ui/*`: UI components.
- `supabaseClient`: For all database operations.
