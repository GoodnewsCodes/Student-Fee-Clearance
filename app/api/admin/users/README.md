# Admin Users API

**Endpoint:** `/api/admin/users`

## Description

This API route provides administrative capabilities to manage system users. It supports listing all users and deleting specific users.

## Authentication & Authorization

- **Headers**: Requires an `Authorization` header with a valid Bearer token (`Bearer <token>`).
- **Access Control**:
  - Verifies the token using Supabase Auth.
  - Checks the user's profile to ensure they have the `admin` or `staff` role.
  - Rejects requests from unauthorized users with 403 Forbidden.

## Methods

### `GET`

Retrieves a list of all user profiles.

- **Response**: JSON object containing an array of users.
- **Ordering**: Results are ordered by `created_at` descending.

### `DELETE`

Deletes a user account and all associated data.

- **Request Body**:
  ```json
  {
    "userId": "uuid-of-user-to-delete"
  }
  ```
- **Logic**:
  1. **Self-Deletion Check**: Prevents an admin from deleting their own account.
  2. **Profile Deletion**: Removes the user's record from the `profiles` table.
  3. **Student Record Deletion**: Removes the user's record from the `students` table (if applicable).
  4. **Auth Deletion**: Permanently removes the user from Supabase Auth.
- **Response**: `{ "success": true }` or error details.
