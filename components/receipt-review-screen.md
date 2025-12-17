# Receipt Review Screen Component

**File:** `components/receipt-review-screen.tsx`

## Overview

The `ReceiptReviewScreen` component is designed for reviewing payment receipts uploaded by students. It allows officers (primarily Bursary and Accounts) to view receipt images, zoom in for details, and approve or reject them.

## Features

### 1. Receipt Listing

- **Bursary/Accounts**: View **Pending** receipts that require action.
- **Other Units**: View **Approved** receipts for reference.
- Displays student name, track number, fee name, amount, and academic session details.

### 2. Image Viewer

- **Modal View**: Clicking "View" opens the receipt image in a large modal.
- **Zoom & Pan**:
  - Zoom In/Out buttons.
  - Mouse wheel zoom.
  - Drag to pan the image (when zoomed in).
  - Reset view button.
- **Security**: Uses signed URLs to securely fetch and display images from Supabase storage.

### 3. Approval Workflow

- **Approve**:
  - Updates receipt status to 'approved'.
  - Marks the receipt as approved by the specific unit.
- **Reject**:
  - Deletes the receipt record from the database.
  - Deletes the receipt file from storage.
  - Creates a notification for the student explaining the rejection.

## Key Functions

- `handleViewImage`: Generates a signed URL for the receipt image and opens the viewer.
- `handleReceiptAction`: Processes the approval or rejection logic.
- `handleImageZoom` / `handleMouseDown` / `handleMouseMove`: Manages the interactive image viewer controls.

## Dependencies

- `ui/*`: UI components (Card, Button, Dialog, Badge).
- `supabaseClient`: For database and storage interactions.
