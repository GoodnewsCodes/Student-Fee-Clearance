# Admin Dashboard Component

**File:** `components/admin-dashboard.tsx`

## Overview

The `AdminDashboard` component serves as the main entry point for administrative users. It provides a tailored interface based on the user's unit (e.g., ICT, Bursary, Accounts, Admissions). It orchestrates various administrative functionalities such as student verification, receipt review, and user registration.

## Features

### 1. Dynamic Unit-Based Rendering

- **ICT Unit**: Redirects to the specialized `ICTAdminDashboard`.
- **Other Units**: Renders the standard admin dashboard with features relevant to the specific unit.

### 2. Navigation & User Profile

- **Responsive Navigation**: Includes a top navigation bar with the university logo and title.
- **User Menu**: Displays the user's username and unit. Provides options to:
  - **Change Password**: Opens a dialog to update the user's password.
  - **Logout**: Logs the user out of the application.
- **Mobile Support**: Features a collapsible mobile menu for smaller screens.

### 3. Tabbed Interface

The dashboard uses a tabbed layout to organize functionalities:

- **Verification Tab**: (Default) Displays the `VerificationScreen` component for verifying student clearance status.
- **Receipt Review Tab**: (Visible to Bursary and Accounts units) Displays the `ReceiptReviewScreen` component for managing payment receipts.
- **Register User Tab**: (Visible to Admissions unit) Provides a form to register new students.

### 4. Student Registration (Admissions Only)

- Allows admissions officers to register new students.
- **Form Fields**: Full Name, Track Number, Email Address, Department.
- **Process**:
  1. Creates a user in Supabase Auth.
  2. Creates a user profile in the `profiles` table.
  3. Creates a student record in the `students` table.

### 5. Real-time Updates

- Subscribes to real-time changes in the `clearance_status` table to ensure the dashboard displays the most up-to-date information.

## Key Functions

- `handleRegisterUser`: Handles the multi-step process of registering a new student.
- `handleChangePassword`: Updates the authenticated user's password.
- `handleReceiptAction`: (Passed down logic) Manages approval or rejection of receipts, including updating clearance status upon approval and deleting files upon rejection.

## Dependencies

- `VerificationScreen`: For student clearance verification.
- `ReceiptReviewScreen`: For reviewing payment receipts.
- `ICTAdminDashboard`: Specialized dashboard for ICT unit.
- `FeeManagement`: (Imported but usage depends on specific implementation flow).
- `ui/*`: Various UI components from the design system (Button, Card, Input, Tabs, etc.).
