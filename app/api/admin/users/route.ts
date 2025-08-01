import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function verifyAdminAccess(request: Request) {
  // Get authorization header
  const authorization = request.headers.get('authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authorization.replace('Bearer ', '')
  
  // Use service role client to verify user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    console.log('Auth verification failed:', error)
    throw new Error('Unauthorized')
  }

  // Check if user is admin/staff
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, unit')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    console.log('Profile fetch failed:', profileError)
    throw new Error('Profile not found')
  }

  // Only allow ICT admins or staff to manage users
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Insufficient permissions')
  }

  return { user, profile }
}

export async function GET(request: Request) {
  try {
    await verifyAdminAccess(request)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 403 : 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user: currentUser } = await verifyAdminAccess(request)
    const { userId } = await request.json()
    
    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) throw profileError

    // Delete from students table if exists
    await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', userId)

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.warn('Could not delete from auth:', authError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' || error.message === 'Insufficient permissions' ? 403 : 500 }
    )
  }
}




