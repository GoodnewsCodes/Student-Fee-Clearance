import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, password, role, trackNo, staffId, department } = await request.json()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase URL or Service Role Key' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Automatically confirm the email as an admin is creating the account
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create user in Auth' }, { status: 400 })
  }

  // 2. Insert the user's profile into the 'profiles' table
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    user_id: authData.user.id,
    name,
    email,
    role,
    track_no: role === 'student' ? trackNo : null,
    staff_id: role !== 'student' ? staffId : null,
    department: role !== 'student' ? department : null,
  })

  if (profileError) {
    // If profile insertion fails, delete the user from auth to avoid orphaned users
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message || 'Failed to save user profile' }, { status: 500 })
  }

  return NextResponse.json({ message: 'User created successfully' })
}
