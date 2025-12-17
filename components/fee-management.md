# Fee Management Component

**File:** `components/fee-management.tsx`

## Overview

The `FeeManagement` component allows authorized personnel to view and manage university fees. It provides an interface to list existing fees and edit their details, with permission checks based on the user's unit.

## Features

### 1. Fee Listing

- Fetches and displays a list of all fees from the database.
- Shows key details for each fee: Name, Description, Unit, Department (if applicable), Amount, and Account Number.

### 2. Fee Editing

- **Edit Mode**: Users can switch a fee card into edit mode.
- **Editable Fields**:
  - Name
  - Amount
  - Account Number
  - Department (if the fee unit is 'department')
  - Description
- **Permissions**:
  - **Bursary Unit**: Can edit ALL fees.
  - **Accounts Unit**: Can edit fees belonging to 'accounts' or 'bursary'.
  - **Other Units**: Can only edit fees belonging to their specific unit.

### 3. Visual Feedback

- Displays a "No fees available" message if the user has no fees to manage.
- Shows a "Fee Management Guidelines" section with helpful tips and rules for managing fees (e.g., changes reflect immediately, audit logging).

## Key Functions

- `fetchFees`: Retrieves the list of fees from the `fees` table.
- `handleEdit`: Enters edit mode for a specific fee.
- `handleSave`: Updates the fee details in the database and updates the local state.
- `canEditFee`: Determines if the current user has permission to edit a specific fee.

## Dependencies

- `ui/*`: UI components (Card, Input, Button, Select, Textarea).
- `supabaseClient`: For database interactions.
