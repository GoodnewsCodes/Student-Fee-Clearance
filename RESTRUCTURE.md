# Project Restructuring Plan

## Current State Analysis

The current codebase relies heavily on a monolithic `app/page.tsx` ("God Component") to handle authentication, routing, data fetching, and UI rendering for multiple user roles (Student, Staff, ICT). This defeats the purpose of Next.js App Router and leads to maintainability issues.

### Key Issues

1.  **Monolithic Entry Point**: `app/page.tsx` contains over 700 lines of code handling all user roles.
2.  **Manual Routing**: Conditional rendering (`if (!currentUser) return <LoginScreen />`) is used instead of Next.js file-system routing.
3.  **Scattered Components**: Feature-specific components (e.g., `fee-management.tsx`, `admin-dashboard.tsx`) are in the root of `components/` alongside shared UI components.
4.  **Mixed Concerns**: API calls to Supabase are mixed directly inside UI components.
5.  **Inconsistent Naming**: Mix of kebab-case and PascalCase for filenames.

## Proposed File Structure

We recommend restructuring the application to leverage Next.js 16 App Router features (Layouts, Route Groups, Loading UI) and organizing components by feature.

```
/
├── app/
│   ├── (auth)/                 # Route Group for Authentication
│   │   ├── login/
│   │   │   └── page.tsx        # Login Page
│   │   └── layout.tsx          # Auth Layout (centered card, etc.)
│   ├── (dashboard)/            # Route Group for Dashboards (protected)
│   │   ├── layout.tsx          # Dashboard Layout (Sidebar, Navbar, Auth Check)
│   │   ├── student/
│   │   │   ├── page.tsx        # Student Dashboard Main View
│   │   │   └── history/        # Example sub-page
│   │   ├── staff/
│   │   │   └── page.tsx        # Staff/Department Dashboard
│   │   └── ict/
│   │       └── page.tsx        # ICT Admin Dashboard
│   ├── api/                    # API Routes (if needed)
│   ├── globals.css
│   └── layout.tsx              # Root Layout (Providers)
├── components/
│   ├── ui/                     # Shared UI Components (Buttons, Inputs - shadcn/ui)
│   ├── auth/                   # Auth related components (LoginForm, etc.)
│   ├── student/                # Student specific components
│   │   ├── clearance-card.tsx
│   │   ├── receipt-upload.tsx
│   │   └── stats-overview.tsx
│   ├── staff/                  # Staff specific components
│   │   ├── student-list.tsx
│   │   └── approval-modal.tsx
│   └── shared/                 # Shared feature components (e.g., UserProfile)
├── lib/
│   ├── hooks/                  # Custom Hooks
│   │   ├── useAuth.ts          # Auth logic extracted from page.tsx
│   │   └── useClearance.ts     # Clearance data fetching
│   ├── services/               # API/Supabase service layer
│   │   ├── auth.ts
│   │   └── clearance.ts
│   └── utils.ts
└── types/                      # TypeScript definitions
    └── index.ts
```

## Implementation Steps

### Phase 1: Separation of Concerns

1.  **Extract Auth Logic**: Move the `currentUser` state and login/logout logic from `page.tsx` to a `useAuth` hook or Context.
2.  **Extract Data Fetching**: Move `fetchClearance` and `fetchRejectedReceipts` to custom hooks (e.g., `useStudentClearance`).

### Phase 2: Routing Implementation

1.  **Create Routes**: Create the folder structure `app/(auth)/login`, `app/(dashboard)/student`, etc.
2.  **Move Pages**:
    - Move `LoginScreen` logic to `app/(auth)/login/page.tsx`.
    - Move Student Dashboard logic from `page.tsx` to `app/(dashboard)/student/page.tsx`.
    - Move `AdminDashboard` logic to `app/(dashboard)/staff/page.tsx`.
    - Move `ICTAdminDashboard` logic to `app/(dashboard)/ict/page.tsx`.

### Phase 3: Component Reorganization

1.  **Group Components**: Move files like `admin-dashboard.tsx` into `components/staff/` (and rename to `dashboard.tsx` or similar).
2.  **Fix Imports**: Update all import paths to reflect the new structure.

### Phase 4: Cleanup

1.  **Simplify Root Page**: `app/page.tsx` should simply redirect to `/login` or the appropriate dashboard based on the user's session (handled by Middleware or client-side redirect).
