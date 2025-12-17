# Lib Documentation

This directory contains utility functions, configuration, and shared helpers for the application.

## Files

### `supabaseClient.ts`

Initializes and exports the Supabase client.

- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.
- Exports a singleton `supabase` instance for client-side usage.

### `utils.ts`

General utility functions.

- **`cn`**: A helper function that combines `clsx` and `tailwind-merge` to conditionally join class names and resolve Tailwind CSS conflicts.

### `api-helpers.ts`

Helpers for API interactions.

- **`retryOperation`**: A utility to retry a promise-returning function a specified number of times with exponential backoff.

## Subdirectories

### `hooks`

Contains custom React hooks for shared logic (e.g., data fetching, state management).

### `store`

Contains state management stores (likely using Zustand or similar) for global application state.
