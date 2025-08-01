import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: Missing Supabase URL or Service Role Key in environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Define remaining unit staff to create
users_to_create = [
    {
        "email": "exams@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Exams & Records Officer",
            "unit": "exams",
            "staff_id": "EXM001"
        }
    },
    {
        "email": "department@aju.ng", 
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Department Officer",
            "unit": "department",
            "staff_id": "DEPT001"
        }
    },
    {
        "email": "admissions@aju.ng",
        "password": "123", 
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Admissions Officer",
            "unit": "admissions",
            "staff_id": "ADM001"
        }
    },
    {
        "email": "faculty@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Faculty Officer", 
            "unit": "faculty",
            "staff_id": "FAC001"
        }
    },
    {
        "email": "library@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Library Officer",
            "unit": "library", 
            "staff_id": "LIB001"
        }
    },
    {
        "email": "studentaffairs@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Student Affairs Officer",
            "unit": "studentaffairs",
            "staff_id": "SA001"
        }
    },
    {
        "email": "accounts@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff", 
            "name": "Accounts Officer",
            "unit": "accounts",
            "staff_id": "ACC001"
        }
    },
    {
        "email": "hospital@aju.ng",
        "password": "123",
        "email_confirm": True,
        "user_metadata": {
            "role": "staff",
            "name": "Hospital Officer",
            "unit": "hospital",
            "staff_id": "HOS001"
        }
    }
]

# Create Users and Profiles
for user_data in users_to_create:
    try:
        print(f"Creating auth user: {user_data['email']}")
        auth_response = supabase.auth.admin.create_user(user_data)

        if not auth_response.user:
            print(f"Failed to create auth user {user_data['email']}")
            continue

        created_user = auth_response.user
        print(f"Successfully created auth user: {created_user.email}")

        # Create profile
        profile_data = {
            "user_id": created_user.id,
            "email": created_user.email,
            "name": created_user.user_metadata.get('name'),
            "role": created_user.user_metadata.get('role'),
            "staff_id": created_user.user_metadata.get('staff_id'),
            "unit": created_user.user_metadata.get('unit')
        }

        profile_response = supabase.table('profiles').insert(profile_data).execute()

        if profile_response.data:
            print(f"Successfully created profile for: {created_user.email}")
        else:
            print(f"Failed to create profile for {created_user.email}")

    except Exception as e:
        print(f"Error processing user {user_data['email']}: {e}")

print("✅ All remaining unit staff accounts created!")