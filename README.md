# Student Fee Clearance System

## Overview

This is a comprehensive Student Fee Clearance System built for Arthur Jarvis University (AJU). It streamlines the process of students getting cleared by various departments (Bursary, Library, Student Affairs, etc.) and allows staff to manage approvals digitally.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (via shadcn/ui)
- **State Management**: React Hooks & Redux Toolkit
- **Backend/Auth**: Supabase
- **Icons**: Lucide React

## Navigation Flows

### 1. Authentication Flow

- **Entry Point**: Users land on the application.
- **Login**: Users authenticate via email/password.
- **Role Detection**: The system checks the user's role (`student`, `staff`) and unit (for staff) from the `profiles` table.
- **Redirection**:
  - **Students** -> Student Dashboard
  - **ICT Staff** -> ICT Admin Dashboard
  - **Department Staff** -> Department Admin Dashboard

### 2. Student Workflow

- **Dashboard**: View overall clearance progress, total amount owed, and status per department.
- **Clearance Status**:
  - **Pending**: Waiting for department review.
  - **Cleared**: Approved by the department.
  - **Rejected**: Request denied (with reason displayed).
  - **Submit Receipt**: Specific status requiring payment proof.
- **Actions**:
  - **Upload Receipt**: Students can upload payment receipts for verification.
  - **Change Password**: Securely update account credentials.

### 3. Staff Workflow

- **Dashboard**: View list of students requiring clearance from their specific unit.
- **Review**:
  - View student details and payment history.
  - **Approve**: Mark student as cleared for that unit.
  - **Reject**: Deny clearance with a mandatory reason.
- **Receipt Verification**: View uploaded receipts and verify against records.

## Implemented Features

### Core Features

- **Role-Based Access Control (RBAC)**: Distinct interfaces for Students, Staff, and ICT Admins.
- **Real-time Updates**: Uses Supabase subscriptions to update clearance status in real-time.
- **Receipt Management**:
  - Upload functionality for students.
  - Review interface for staff.
  - Rejection handling with feedback loop.
- **Progress Tracking**: Visual progress bars and status indicators for students.
- **Responsive Design**: Mobile-friendly interface with adaptive navigation (Hamburger menu on mobile).

### UI/UX

- **Dashboard Widgets**: Summary cards for Cleared, Pending, Rejected, and Total Owed.
- **Notifications**: Alerts for rejected receipts or urgent actions.
- **Theme**: Custom AJU branding (Green/Gold/White palette).

## Folder Structure (Current)

- `app/`: Contains the main application logic (currently centralized in `page.tsx`).
- `components/`: Contains UI components and feature-specific views.
  - `ui/`: Reusable primitive components (Buttons, Cards, etc.).
  - `auth/`: Authentication related components.
- `lib/`: Utilities, Supabase client, and Redux store configuration.
- `database/`: SQL scripts for database schema and seeding.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```
