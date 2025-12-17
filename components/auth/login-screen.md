# Login Screen Component

**File:** `components/auth/login-screen.tsx`

## Overview

The `LoginScreen` component provides a unified authentication interface for both students and staff members of the university. It uses a tabbed layout to separate the login flows for different user roles.

## Features

### 1. Dual Login Modes

- **Student Login**:
  - Authenticates using **Track Number** and Password.
  - Verifies that the user has the 'student' role.
- **Staff Login**:
  - Authenticates using **Email Address** and Password.
  - Verifies that the user has the 'staff' role and is assigned to a valid unit.

### 2. Security & UX

- **Password Visibility**: Toggle button to show/hide password characters.
- **Loading States**: Visual feedback during the authentication process.
- **Error Handling**: Displays specific error messages for invalid credentials or access denial.
- **Forgot Password**: Direct link to the password recovery page.

## Key Functions

- `handleStudentLogin`: Authenticates students using Supabase Auth (treating Track No as email/identifier logic) and verifies profile role.
- `handleStaffLogin`: Authenticates staff using Supabase Auth and verifies profile role and unit assignment.

## Dependencies

- `ui/*`: UI components (Card, Input, Button, Tabs).
- `supabaseClient`: For authentication and profile fetching.
