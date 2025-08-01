"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { GraduationCap, Building, Trash2, Search, Users } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface User {
  user_id: string
  name: string
  email: string
  role: string
  track_no?: string
  staff_id?: string
  department?: string
  unit?: string
  created_at: string
}

interface UserManagementProps {
  currentUser: {
    id: string
    unit: string
  }
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "staff">("all")
  const [loading, setLoading] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.track_no && user.track_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.staff_id && user.staff_id.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, users])

  const fetchUsers = async () => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users')
      }
      
      setUsers(result.users || [])
      setFilteredUsers(result.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === currentUser.id) {
      alert("You cannot delete your own account")
      return
    }

    setDeletingUserId(userId)
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session')
      }

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      // Update local state
      setUsers(prev => prev.filter(u => u.user_id !== userId))
      alert(`User ${userEmail} deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Error deleting user: ${error.message}`)
    } finally {
      setDeletingUserId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Manage Users ({users.length} total)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, track number, or staff ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All ({users.length})
            </Button>
            <Button
              variant={roleFilter === "student" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("student")}
            >
              Students ({users.filter(u => u.role === "student").length})
            </Button>
            <Button
              variant={roleFilter === "staff" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("staff")}
            >
              Staff ({users.filter(u => u.role === "staff").length})
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <Card key={user.user_id} className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {user.role === 'student' ? (
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{user.name}</p>
                      <Badge variant={user.role === 'student' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.unit && (
                        <Badge variant="outline">{user.unit}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.track_no && (
                      <p className="text-sm text-gray-500">Track: {user.track_no}</p>
                    )}
                    {user.staff_id && (
                      <p className="text-sm text-gray-500">Staff ID: {user.staff_id}</p>
                    )}
                    {user.department && (
                      <p className="text-sm text-gray-500">Department: {user.department}</p>
                    )}
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingUserId === user.user_id || user.user_id === currentUser.id}
                    >
                      {deletingUserId === user.user_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete <strong>{user.name}</strong> ({user.email})?
                        This action cannot be undone and will remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUser(user.user_id, user.email)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No users found matching your search.' : 'No users found.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




