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
  })

  useEffect(() => {
    // Fetch initial data
    const fetchReceipts = async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(`*, students (*)`)
        .eq("status", "pending")

      if (error) {
        console.error("Error fetching receipts:", error)
      } else {
        setReceipts(data as any)
      }
    }

    const fetchClearanceStatuses = async () => {
      const { data, error } = await supabase
        .from("clearance_status")
        .select(`
          *,
          students (*),
          units (*)
        `)

      if (error) {
        console.error("Error fetching clearance statuses:", error)
      } else if (data) {
        setClearanceStatuses(data as any)
        setFilteredStatuses(data as any)
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
        status.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        status.students?.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStatuses(filtered);
  }, [searchQuery, clearanceStatuses]);


  const handleUpdateStatus = async (id: string, newStatus: "Cleared" | "Pending" | "Not Cleared") => {
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
      const { data, error } = await supabase
        .from("receipts")
        .update({ status: action === "approve" ? "approved" : "rejected", rejection_reason: reason })
        .eq("id", receiptId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Optimistically update UI
      setReceipts(receipts.filter((r) => r.id !== receiptId));

      // If approved, update clearance status
      if (action === "approve" && data && data.length > 0) {
        const receipt = data[0];
        const { error: updateError } = await supabase
          .from("clearance_status")
          .update({ status: "Cleared" })
          .eq("student_id", receipt.student_id)
          .eq("unit_id", receipt.unit_id); // Assuming unitId in receipt maps to department_id in clearance_status

        if (updateError) {
          // Note: This won't roll back the receipt approval, but will alert the user.
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
            full_name: newUserData.name,
            role: 'student',
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("User not created in Auth");

      // 2. Create profile in 'profiles' table
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        full_name: newUserData.name,
        email: newUserData.email,
        role: 'student',
        registration_number: newUserData.trackNo, // Using trackNo as reg number
      });

      if (profileError) throw new Error(profileError.message);

      alert("Student registered successfully!");
      // Optionally clear the form
      setNewUserData({ name: "", trackNo: "", email: "", password: "12345" });
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

  // Determine which tabs to show based on user unit
  const tabsConfig = [
    { value: "verification", label: "Verification", icon: Search },
    ...(user.unit === "bursary" || user.unit === "accounts"
      ? [
          { value: "receipts", label: "Receipt Review", icon: FileText },
          { value: "fees", label: "Fee Management", icon: Edit },
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
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-semibold">Admin Dashboard</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="outline" className="text-white border-white">
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-aj-primary text-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button variant="ghost" className="justify-start text-white hover:bg-white/10" onClick={onLogout}>
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
          <TabsList className="flex overflow-x-auto w-full mb-8">
            {tabsConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle className="text-aj-primary flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Student Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <Input
                    placeholder="Search by Name or Track No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {filteredStatuses.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStatuses.map((status) => (
                      <Card key={status.id}>
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center text-base">
                            <span>
                              {status.students?.full_name} ({status.students?.registration_number})
                            </span>
                            <Badge
                              className={status.status === "Cleared" ? "bg-green-100 text-green-800" : status.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
                            >
                              {status.departments?.name}: {status.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">Email: {status.students?.email}</p>
                          <p className="text-sm text-gray-500">Last Updated: {new Date(status.updated_at).toLocaleString()}</p>
                          <div className="mt-4 flex gap-2">
                            <Button onClick={() => handleUpdateStatus(status.id, 'Cleared')} size="sm" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" /> Clear
                            </Button>
                            <Button onClick={() => handleUpdateStatus(status.id, 'Not Cleared')} size="sm" variant="destructive">
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-6">No students match your search or none found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(user.unit === "bursary" || user.unit === "accounts") && (
            <TabsContent value=" ">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {receipts.length > 0 ? (
                      receipts.map((receipt) => (
                        <Card key={receipt.id}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-bold">{receipt.students.full_name}</p>
                              <p className="text-sm text-gray-500">Reg No: {receipt.students.registration_number}</p>
                              <p className="text-sm">Unit: {getUnitTitle(receipt.unitId)}</p>
                              <a href={receipt.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View Receipt</a>
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={() => handleReceiptAction(receipt.id, "approve")} size="sm" className="bg-green-500 hover:bg-green-600" disabled={processingReceiptId === receipt.id}>
                                {processingReceiptId === receipt.id ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button onClick={() => handleReceiptAction(receipt.id, "reject", prompt("Rejection Reason:") || "")} size="sm" variant="destructive" disabled={processingReceiptId === receipt.id}>
                                {processingReceiptId === receipt.id ? 'Processing...' : 'Reject'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 mt-6">No pending receipts for your unit.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(user.unit === "bursary" || user.unit === "accounts") && (
            <TabsContent value="fees">
              <FeeManagement userUnit={user.unit} />
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
    </div>
  )
}
