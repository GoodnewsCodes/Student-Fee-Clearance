# Create User API

**Endpoint:** `POST /api/create-user`

## Description

This endpoint is responsible for creating new users in the system. It handles the creation of the user in Supabase Auth and the corresponding profile record in the database.

## Request Body

The endpoint expects a JSON body with the following fields:

| Field        | Type   | Required    | Description                                              |
| ------------ | ------ | ----------- | -------------------------------------------------------- |
| `name`       | string | Yes         | Full name of the user.                                   |
| `email`      | string | Yes         | Email address (used for login).                          |
| `password`   | string | Yes         | Initial password.                                        |
| `role`       | string | Yes         | User role (`student` or `staff`/`admin`).                |
| `trackNo`    | string | Conditional | Required if role is `student`.                           |
| `staffId`    | string | Conditional | Required if role is NOT `student`.                       |
| `department` | string | Conditional | Required if role is NOT `student` (for staff unit/dept). |

## Logic Flow

1. **Validation**: Checks for the presence of Supabase service role credentials.
2. **Auth Creation**: Uses `supabaseAdmin.auth.admin.createUser` to create a user in Supabase Auth with email auto-confirmed.
3. **Profile Creation**: Inserts a record into the `profiles` table linked to the new Auth user ID.
4. **Error Handling**:
   - If Auth creation fails, returns 400.
   - If Profile creation fails, it attempts to delete the orphaned Auth user and returns 500.

## Security

- Uses the **Service Role Key** to perform administrative actions (creating users without email verification flow).
- **Note**: This endpoint should be protected or restricted to authorized administrators in a production environment.
