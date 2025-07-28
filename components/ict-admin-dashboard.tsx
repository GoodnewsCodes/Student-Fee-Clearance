"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Menu,
  User,
  Search,
  FileText,
  LogOut,
  UserPlus,
  Trash2,
  Users,
  Building,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import type { Receipt, StudentProfile, ClearanceStatus } from "@/types"
import { departmentUnits, adminUnits } from "@/components/ui/units"
import { VerificationScreen } from "@/components/verification-screen"
import { ReceiptReviewScreen } from "@/components/receipt-review-screen"

// Combined type for user data to be managed in the state
type UserData = {
  id: string
  name: string
  email: string
  role: string
  trackNo?: string
  staffId?: string
  department?: string
  unit?: string
}

// Enriched receipt type with student details
interface ReceiptWithStudent extends Receipt {
  students: StudentProfile
}

// Props for the main dashboard component
interface ICTAdminDashboardProps {
  user: any
  onLogout: () => void
}

export function ICTAdminDashboard({ user, onLogout }: ICTAdminDashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchTrackNo, setSearchTrackNo] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null)
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus[] | null>(null)
  const [newUserData, setNewUserData] = useState({
    name: "",
    trackNo: "",
    email: "",
    password: "12345", // Default password
    role: "student",
    staffId: "",
    department: "",
    unit: "",
  })
  const [receipts, setReceipts] = useState<ReceiptWithStudent[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [processingReceiptId, setProcessingReceiptId] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Fetch initial data for receipts and users
  useEffect(() => {
    const fetchInitialData = async () => {
      // Mock user data for demonstration
      setUsers([
        {
          id: "1",
          name: "John Doe",
          trackNo: "23/132025",
          email: "john.doe@aju.edu.ng",
          role: "student",
          department: "Computer Science",
        },
        {
          id: "3",
          name: "Mike Johnson",
          staffId: "AJU/STAFF/002",
          email: "mike.johnson@aju.edu.ng",
          role: "staff",
          unit: "ict",
        },
      ])

      // Fetch pending receipts for ICT unit only
      const { data, error } = await supabase
        .from("receipts")
        .select(`
          *, 
          students (*),
          units!receipts_unit_id_fkey (name)
        `)
        .eq("status", "pending")
        .eq("units.name", "ICT")

      if (error) console.error("Error fetching receipts:", error)
      else setReceipts(data as any)
    }

    fetchInitialData()

    // Subscribe to real-time changes in the receipts table
    const channel = supabase
      .channel("public:receipts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        (payload) => {
          // Refetch receipts on any change
          fetchInitialData()
        }
      )
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Search for a student by track number
  const handleSearch = async () => {
    if (!searchTrackNo) return;
    setIsSearching(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("track_no", searchTrackNo)
        .single();

      if (studentError || !studentData) {
        alert("Student not found.");
        setSelectedStudent(null);
        setClearanceStatus(null);
        return;
      }

      setSelectedStudent(studentData);

      const { data: clearanceData, error: clearanceError } = await supabase
        .from("clearance_status")
        .select("*, departments(*)")
        .eq("student_id", studentData.id);

      if (clearanceError) {
        alert("Error fetching clearance status.");
        setClearanceStatus(null);
      } else {
        setClearanceStatus(clearanceData);
      }
    } catch (error: any) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Approve or reject a receipt
  const handleReceiptAction = async (receiptId: string, action: "approve" | "reject") => {
    setProcessingReceiptId(receiptId);
    try {
      const { data, error } = await supabase
        .from("receipts")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", receiptId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Also update the corresponding clearance status
      await supabase
        .from("clearance_status")
        .update({ status: action === "approve" ? "Cleared" : "rejected" })
        .eq("student_id", data.student_id)
        .eq("unit_id", data.unitId);

      // Refresh receipts list
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    } catch (e: any) {
      console.error("Error processing receipt:", e);
      alert(`Receipt processing failed: ${e.message}`);
    } finally {
      setProcessingReceiptId(null);
    }
  };

  // Register a new user
  const handleRegisterUser = async () => {
    setIsRegistering(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
            role: newUserData.role,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      alert("User registered successfully!");
      // Add to local state or refetch
    } catch (error: any) {
      alert("Error registering user: " + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Delete a user
  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      // Mock deletion for now, replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert(`User ${userId} deleted.`);
    } catch (error: any) {
      alert(`Error deleting user: ${error.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-aj-primary text-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 relative">
                <Image
                  src="/aju-logo.png"
                  alt="Arthur Jarvis University Logo"
                  width={32}
                  height={32}
                  className="object-contain drop-shadow-aj-logo rounded-sm"
                />
              </div>
              <div>
                <span className="text-xl font-semibold hidden sm:block">Arthur Jarvis University</span>
                <span className="text-lg font-semibold sm:hidden">AJU</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="outline" className="text-aj-accent border-aj-accent">
                ICT Administrator
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={onLogout} className="hover:bg-gray-100">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-aj-primary text-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button variant="ghost" className="justify-start text-white hover:bg-white/10 hover:text-white" onClick={onLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="verification" className="w-full">
          <TabsList className="flex w-full gap-2 mb-6 h-auto">
            <TabsTrigger value="verification"><Search className="h-4 w-4 mr-2" />Verification</TabsTrigger>
            <TabsTrigger value="receipts"><FileText className="h-4 w-4 mr-2" />Receipts</TabsTrigger>
            <TabsTrigger value="register"><UserPlus className="h-4 w-4 mr-2" />Register</TabsTrigger>
            <TabsTrigger value="manage"><Users className="h-4 w-4 mr-2" />Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <VerificationScreen user={user} />
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptReviewScreen user={user} />
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader><CardTitle>Register New User</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-lg mx-auto">
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData(p => ({ ...p, role: value, department: '', unit: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Full Name" value={newUserData.name} onChange={(e) => setNewUserData(p => ({ ...p, name: e.target.value }))} />
                  <Input type="email" placeholder="Email Address" value={newUserData.email} onChange={(e) => setNewUserData(p => ({ ...p, email: e.target.value }))} />
                  {newUserData.role === 'student' ? (
                    <>
                      <Input placeholder="Registration Number" value={newUserData.trackNo} onChange={(e) => setNewUserData(p => ({ ...p, trackNo: e.target.value }))} />
                      <Select value={newUserData.department} onValueChange={(value) => setNewUserData(p => ({ ...p, department: value }))}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>{departmentUnits.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <Input placeholder="Staff ID" value={newUserData.staffId} onChange={(e) => setNewUserData(p => ({ ...p, staffId: e.target.value }))} />
                       <Select value={newUserData.unit} onValueChange={(value) => setNewUserData(p => ({ ...p, unit: value }))}>
                        <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                        <SelectContent>{adminUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </>
                  )}
                  <Button onClick={handleRegisterUser} className="w-full flex items-center justify-center" disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Registering...
                      </>
                    ) : 'Register User'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader><CardTitle>Manage Users</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <Card key={u.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {u.role === 'student' ? <GraduationCap className="h-5 w-5 text-gray-600" /> : <Building className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the user {u.name}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-700 flex items-center justify-center" disabled={deletingUserId === u.id}>
                                {deletingUserId === u.id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Deleting...
                                  </>
                                ) : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}













