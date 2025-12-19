# Types Documentation

This directory contains TypeScript interface definitions and type constants used throughout the application to ensure type safety and consistency.

## Files

### `index.ts`

Contains the core data models for the application.

- **`ClearanceUnit`**: Represents a unit involved in the clearance process (e.g., Library, Bursary). Includes properties for status, amount owed, and priority.
- **`User`**: Base interface for a system user.
- **`AdminUser`**: Extends `User` for administrators, adding unit assignment and permissions.
- **`StaffUser`**: Extends `User` for staff members.
- **`StudentProfile`**: Represents a student's profile, including track number and department.
- **`Receipt`**: Defines the structure of a payment receipt, including file path, status, and approval flags.
- **`Fee`**: Represents a fee that can be paid by students.
- **`ClearanceStatus`**: Tracks the clearance status of a student with a specific unit.

### `department.ts`

Defines department-related data.

- **`Department`**: Interface with `id`, `name`, and `faculty`.
- **`departments`**: A constant array of predefined departments (e.g., Computer Science, Mass Communication).
- **`departmentUnits`**: List of academic departments with their display labels.

### `units.ts`

Defines constants for administrative and academic units.

- **`adminUnits`**: List of administrative units (e.g., Bursary, ICT, Student Affairs) with their display labels.
