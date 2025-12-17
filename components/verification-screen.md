# Verification Screen Component

**File:** `components/verification-screen.tsx`

## Overview

The `VerificationScreen` is a critical component for administrative officers to verify the clearance status of students. It aggregates student information, clearance status across all units, and payment history into a single view.

## Features

### 1. Student Search

- Allows searching for students by **Track Number** or **Name**.
- robust search logic:
  - Checks `students` table first.
  - Fallback to `profiles` table if not found in students.
  - Handles linking between profiles and student records.

### 2. Student Profile Display

- Shows the selected student's details: Name, Registration/Track No, Email, and Department.

### 3. Clearance Status Dashboard

- Displays a grid of cards representing the student's status with each unit.
- **Status Indicators**:
  - **Cleared**: Green card with checkmark. Shows due date.
  - **Blocked/Rejected**: Red card with X mark. Shows amount owed and overdue status.
  - **Pending**: Yellow card. Indicates awaiting review.
- **Priority**: Visually highlights "High Priority" (Blocked) vs "Low Priority" items.

### 4. Payment Receipts History

- Lists all receipts uploaded by the student.
- **Filtering**: Filter receipts by Academic Year, Semester, and Fee type.
- **Details**: Shows Fee Name, Amount, Session, Upload Date, and Status.
- **View Image**: Includes the same image viewing capabilities as the `ReceiptReviewScreen` (zoom, pan).

## Key Functions

- `handleSearch`: Complex logic to find a student and fetch their related clearance data and receipts.
- `filteredReceipts`: Logic to filter the displayed receipts based on dropdown selections.
- `handleViewImage`: Opens the receipt image viewer.

## Dependencies

- `ui/*`: UI components (Card, Input, Button, Badge, Dialog, Select).
- `supabaseClient`: For fetching student data, clearance status, and receipts.
