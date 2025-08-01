"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Menu,
  User,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  LogOut,
  UserPlus,
  Download,
  Edit,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { FeeManagement } from "@/components/fee-management"
import { ICTAdminDashboard } from "@/components/ict-admin-dashboard"
import Image from "next/image"
import { adminUnits } from "@/components/ui/units"
import { supabase } from "@/lib/supabaseClient"
import type { ClearanceStatus, StudentProfile, Unit, Receipt } from "@/types"
import { VerificationScreen } from "@/components/verification-screen"
import { ReceiptReviewScreen } from "@/components/receipt-review-screen"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ReceiptWithStudent extends Receipt {
  students: StudentProfile
}

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  if (user.unit === "ict") {
    return <ICTAdminDashboard user={user} onLogout={onLogout} />
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clearanceStatuses, setClearanceStatuses] = useState<ClearanceStatus[]>([])
  const [receipts, setReceipts] = useState<ReceiptWithStudent[]>([])
  const [filteredStatuses, setFilteredStatuses] = useState<ClearanceStatus[]>([])
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [processingReceiptId, setProcessingReceiptId] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: "",
    trackNo: "",
    email: "",
    password: "12345",
    department: ""
  })
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    setIsChangingPassword(true)
    try {
      const { supabase } = await import("@/lib/supabaseClient")
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      alert("Password changed successfully!")
      setShowChangePassword(false)
      setPasswordData({ newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      alert(`Error changing password: ${error.message}`)
    } finally {
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
    // Fetch initial data
    const fetchReceipts = async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(`
          *, 
          students (*),
          fees!receipts_fee_id_fkey (name, amount, unit)
        `)
        .eq("status", "pending")

      if (error) {
        console.error("Error fetching receipts:", error)
      } else {
        setReceipts(data as any)
      }
    }

    const fetchClearanceStatuses = async () => {
      try {
        // Test basic query first
        console.log("Testing basic clearance_status query...");
        const { data: testData, error: testError } = await supabase
          .from("clearance_status")
          .select("*")
          .limit(5)

        if (testError) {
          console.error("Basic query failed:", testError);
          console.error("Error details:", JSON.stringify(testError, null, 2));
          return
        }

        console.log("Basic query successful, attempting full query...");
        // If basic query works, try the full query
        const { data, error } = await supabase
          .from("clearance_status")
          .select(`
            *,
            units (
              id,
              name
            )
          `)

        if (error) {
          console.error("Error fetching clearance statuses:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
        } else if (data) {
          // Fetch profiles separately and merge
          const userIds = [...new Set(data.map(item => item.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, name, track_no")
            .in("user_id", userIds);

          // Merge the data
          const mergedData = data.map(item => ({
            ...item,
            profiles: profilesData?.find(profile => profile.user_id === item.user_id)
          }));

          console.log("Successfully fetched clearance statuses:", mergedData);
          setClearanceStatuses(mergedData as any)
          setFilteredStatuses(mergedData as any)
        }
      } catch (err) {
        console.error("Unexpected error in fetchClearanceStatuses:", err);
      }
    }

    fetchClearanceStatuses()
    fetchReceipts()

    // Set up real-time subscription
    const channel = supabase
      .channel("realtime-clearance-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clearance_status" },
        (payload) => {
          console.log("Change received!", payload)
          // Refetch or update state based on payload
          fetchClearanceStatuses(); // Simple refetch for now
        }
      )
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const filtered = clearanceStatuses.filter(
      (status) =>
        status.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        status.profiles?.track_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStatuses(filtered);
  }, [searchQuery, clearanceStatuses]);


  const handleUpdateStatus = async (id: string, newStatus: "Cleared" | "Pending" | "rejected") => {
    setUpdatingStatusId(id);
    const { error } = await supabase
      .from('clearance_status')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert("Error updating status: " + error.message)
    }
    // UI will update automatically via real-time subscription
    setUpdatingStatusId(null);
  }

  const handleReceiptAction = async (receiptId: string, action: "approve" | "reject", reason?: string) => {
    setProcessingReceiptId(receiptId);
    try {
      const receipt = receipts.find(r => r.id === receiptId);
      
      const { data, error } = await supabase
        .from("receipts")
        .update({ status: action === "approve" ? "approved" : "rejected", rejection_reason: reason })
        .eq("id", receiptId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // If rejected, delete from storage
      if (action === "reject" && receipt?.file_path) {
        await supabase.storage
          .from('receipts')
          .remove([receipt.file_path]);
      }

      // Optimistically update UI
      setReceipts(receipts.filter((r) => r.id !== receiptId));

      // If approved, update clearance status
      if (action === "approve" && data && data.length > 0) {
        const receiptData = data[0];
        const { error: updateError } = await supabase
          .from("clearance_status")
          .update({ status: "Cleared" })
          .eq("student_id", receiptData.student_id)
          .eq("unit_id", receiptData.unit_id);

        if (updateError) {
          alert("Receipt approved, but failed to update clearance status: " + updateError.message);
        }
      }
    } catch (error: any) {
      console.error("Error processing receipt:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingReceiptId(null);
    }
  };

  const handleRegisterUser = async () => {
    setIsRegistering(true);
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
            role: 'student',
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("User not created in Auth");

      // 2. Create profile in 'profiles' table
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        name: newUserData.name,
        email: newUserData.email,
        role: 'student',
        track_no: newUserData.trackNo,
        department: newUserData.department
      });

      if (profileError) throw new Error(profileError.message);

      // 3. Create student record
      const { error: studentError } = await supabase.from('students').insert({
        user_id: authData.user.id,
        name: newUserData.name,
        track_no: newUserData.trackNo,
        email: newUserData.email
      });

      if (studentError) throw new Error(studentError.message);

      alert("Student registered successfully!");
      setNewUserData({ name: "", trackNo: "", email: "", password: "12345", department: "" });
    } catch (error: any) {
      console.error("Error registering user:", error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const getUnitTitle = (unit: string) => {
    const unitItem = adminUnits.find((u) => u.value === unit)
    return unitItem ? unitItem.label : "Officer"
  }

  const getTabName = (unit: string) => {
    if (unit === "ict" || unit === "bursary" || unit === "accounts") {
      return "Verification";
    }
    return "Clearance";
  };

  // Determine which tabs to show based on user unit
  const tabsConfig = [
    { value: "verification", label: "Verification", icon: Search },
    ...(user.unit === "bursary" || user.unit === "accounts"
      ? [
          { value: "receipts", label: "Receipt Review", icon: FileText },
        ]
      : []),
    ...(user.unit === "admissions"
      ? [{ value: "register", label: "Register User", icon: UserPlus }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-aj-background">
      {/* Top Navigation */}
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
                {getUnitTitle(user.unit)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)} className="hover:bg-gray-100">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="verification" className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabsConfig.length}`}>
            {tabsConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="verification">
            <VerificationScreen user={user} />
          </TabsContent>

          {(user.unit === "bursary" || user.unit === "accounts") && (
            <TabsContent value="receipts">
              <ReceiptReviewScreen user={user} />
            </TabsContent>
          )}

          {user.unit === "admissions" && (
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-aj-primary flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Register New Student
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                      <Input
                        value={newUserData.name}
                        onChange={(e) => setNewUserData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter student's full name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Track Number</label>
                      <Input
                        value={newUserData.trackNo}
                        onChange={(e) => setNewUserData((prev) => ({ ...prev, trackNo: e.target.value }))}
                        placeholder="23/132025"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                      <Input
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="student@aju.edu.ng"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Default Password</label>
                      <Input
                        type="password"
                        value={newUserData.password}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
                      <Input
                        value={newUserData.department}
                        onChange={(e) => setNewUserData((prev) => ({ ...prev, department: e.target.value }))}
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>

                  <Button onClick={handleRegisterUser} className="mt-6 bg-aj-accent text-white hover:bg-aj-accent/90 flex items-center justify-center" disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Student
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}














































