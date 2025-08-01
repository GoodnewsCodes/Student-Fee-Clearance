import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Create the test student
try:
    # Step 1: Create auth user
    auth_response = supabase.auth.admin.create_user({
        "email": "test@aju.ng",
        "password": "123456",
        "email_confirm": True,
        "user_metadata": {
            "name": "Test Student",
            "role": "student",
            "track_no": "25/132001"
        }
    })
    
    if not auth_response.user:
        print("Failed to create auth user")
        exit(1)
        
    user_id = auth_response.user.id
    print(f"Created auth user: {user_id}")
    
    # Step 2: Create profile
    profile_response = supabase.table('profiles').insert({
        "user_id": user_id,
        "name": "Test Student",
        "email": "test@aju.ng",
        "role": "student",
        "track_no": "25/132001",
        "department": "Computer Science"
    }).execute()
    
    print("Created profile:", profile_response.data)
    
    # Step 3: Create student record
    student_response = supabase.table('students').insert({
        "user_id": user_id,
        "name": "Test Student",
        "track_no": "25/132001",
        "email": "test@aju.ng"
    }).execute()
    
    print("Created student:", student_response.data)
    
    print("✅ Test student created successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")