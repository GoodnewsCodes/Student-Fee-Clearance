# Receipt Upload Modal Component

**File:** `components/student/receipt-upload-modal.tsx`

## Overview

The `ReceiptUploadModal` component provides a user-friendly interface for students to upload proof of payment for various university fees.

## Features

### 1. File Upload

- **Drag & Drop**: Supports dragging and dropping image files.
- **File Validation**:
  - **Type**: Accepts only image files (JPG, PNG, WebP).
  - **Size**: Enforces a maximum file size of 300KB.
- **Preview**: Shows the selected file name and size.

### 2. Metadata Collection

- **Fee Selection**: Dropdown to select which fee is being paid (fetched dynamically from the database).
- **Academic Session**: Dropdown to select the Academic Year (1-6) and Semester (First/Second).

### 3. Submission Process

- **Storage**: Uploads the image file to the `receipts` bucket in Supabase Storage.
- **Database**: Creates a record in the `receipts` table linking the file, student, and fee details.
- **Error Handling**: Reverts the file upload if the database record creation fails.
- **Feedback**: Displays success toast notification upon completion.

## Key Functions

- `handleFileSelect`: Validates the selected file.
- `handleSubmit`: Orchestrates the upload process (Auth check -> File Upload -> DB Insert).
- `fetchFees`: Loads available fees for the dropdown.

## Dependencies

- `ui/*`: UI components (Dialog, Button, Card).
- `supabaseClient`: For storage and database operations.
- `sonner`: For toast notifications.
