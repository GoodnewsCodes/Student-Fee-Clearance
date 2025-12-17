import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_SERVICE_ROLE_KEY present:", "Yes" if SUPABASE_SERVICE_ROLE_KEY else "No")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: Missing Supabase URL or Service Role Key in environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- Define Users to Create ---

users_to_create = [
    {
        "email": "bur@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Bursar",
            "unit": "bursary",
            "staff_id": "BUR001"
        }
    },
    {
        "email": "test@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "student",
            "name": "Test Student",
            "track_no": "25/132001",
            "department": "Law"
        }
    }
]

# --- Create Users and Profiles ---

for user_data in users_to_create:
    try:
        # Step 1: Create the user in Supabase Auth
        print(f"Attempting to create auth user: {user_data['email']}")
        auth_response = supabase.auth.admin.create_user(user_data)

        if not auth_response.user:
            print(f"Failed to create auth user {user_data['email']}. Response: {auth_response}")
            continue  # Skip to the next user

        created_user = auth_response.user
        print(f"Successfully created auth user: {created_user.email} (ID: {created_user.id})")

        # Step 2: Create the corresponding profile in the public.profiles table
        profile_data = {
            "user_id": created_user.id,
            "email": created_user.email,
            "name": created_user.user_metadata.get('name'),
            "role": created_user.user_metadata.get('role')
        }

        if profile_data['role'] == 'student':
            profile_data['track_no'] = created_user.user_metadata.get('track_no')
            profile_data['department'] = created_user.user_metadata.get('department')
        elif profile_data['role'] == 'staff':
            profile_data['staff_id'] = created_user.user_metadata.get('staff_id')
            profile_data['unit'] = created_user.user_metadata.get('unit')

        print(f"Attempting to create profile for: {created_user.email}")
        profile_response = supabase.table('profiles').insert(profile_data).execute()

        # The insert response is a list in data. Check if it's not empty.
        if profile_response.data:
            print(f"Successfully created profile for: {created_user.email}")
        else:
            print(f"Failed to create profile for {created_user.email}. Error: {profile_response.error}")

    except Exception as e:
        print(f"An error occurred while processing user {user_data['email']}: {e}")