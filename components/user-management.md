# User Management Component

**File:** `components/user-management.tsx`

## Overview

The `UserManagement` component provides an interface for administrators to manage system users. It allows for searching, filtering, and deleting user accounts.

## Features

### 1. User Listing

- Fetches and displays a list of all users from the backend API.
- Shows user details: Name, Email, Role (Student/Staff), Track Number, Staff ID, Department, and Unit.

### 2. Search & Filter

- **Search**: Real-time filtering by name, email, track number, or staff ID.
- **Role Filter**: Filter users by role (All, Student, Staff).
- Displays counts for each category.

### 3. User Deletion

- Allows administrators to delete user accounts.
- **Safety**:
  - Prevents self-deletion.
  - Requires confirmation via an Alert Dialog before deletion.
  - Calls a backend API endpoint to securely remove the user and associated data.

## Key Functions

- `fetchUsers`: Calls `/api/admin/users` to retrieve user data.
- `handleDeleteUser`: Calls DELETE `/api/admin/users` to remove a user.

## Dependencies

- `ui/*`: UI components (Card, Input, Button, Badge, AlertDialog).
- `supabaseClient`: For session management (getting the access token).
