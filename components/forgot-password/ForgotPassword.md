# Forgot Password Component

**File:** `components/forgot-password/ForgotPassword.tsx`

## Overview

The `ForgotPassword` component allows users to initiate the password reset process if they have lost their credentials.

## Features

### 1. Password Reset Request

- **Email Input**: Accepts the user's registered email address.
- **Supabase Integration**: Calls `supabase.auth.resetPasswordForEmail` to send a recovery link.
- **Redirect URL**: Configures the email link to redirect users to the `/reset-password` page.

### 2. User Feedback

- **Success Message**: Notifies the user to check their inbox upon successful request.
- **Error Handling**: Displays error messages if the request fails (e.g., invalid email or network error).
- **Navigation**: "Back to Login" button to return to the main authentication screen.

## Dependencies

- `ui/*`: UI components (Card, Input, Button).
- `supabaseClient`: For initiating the password reset flow.
