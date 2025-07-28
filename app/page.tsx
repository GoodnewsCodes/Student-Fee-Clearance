"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Menu,
  User,
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
  Building,
  HelpCircle,
  FileText,
  Book,
  Heart,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Phone,
  Upload,
  UserCheck,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type { ClearanceUnit } from "@/types"
import { LoginScreen } from "@/components/login-screen"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ReceiptUploadModal } from "@/components/receipt-upload-modal"
import { ICTAdminDashboard } from "@/components/ict-admin-dashboard"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<ClearanceUnit | null>(null)
  const [clearanceUnits, setClearanceUnits] = useState<ClearanceUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  // Helper: map unit/department name to icon
  const unitIconMap: Record<string, React.ElementType> = {
    "Bursary": Building,
    "Exams & Records": FileText,
    "Student Affairs": User,
    "Accounts": CreditCard,
    "Department": GraduationCap,
    "Faculty": BookOpen,
    "Library": Book,
    "Hospital": Heart,
    "Admissions": UserCheck,
    // ...add more as needed
  }
  function getUnitIcon(name: string) {
    return unitIconMap[name] || User
  }

  const handleLogin = async (credentials: any) => {
  try {
    let userAuth = credentials.user;
    // If user object is not passed (legacy), try to get from supabase
    if (!userAuth) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        alert("Unable to authenticate user.");
        setCurrentUser(null);
        return;
      }
      userAuth = data.user;
    }
    // Fetch profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userAuth.id)
      .single();
    if (profileError || !profile) {
      alert(profileError?.message || "Could not fetch user profile.");
      setCurrentUser(null);
      return;
    }
    // Role-based routing
    if (profile.role === 'student') {
      setCurrentUser({
        id: userAuth.id,
        name: profile.name,
        trackNo: profile.track_no,
        role: 'student',
        unit: null,
        username: profile.email,
      });
      return;
    }
    if (profile.role === 'staff') {
      if (!profile.unit) {
        alert("Staff profile missing unit assignment. Contact ICT.");
        setCurrentUser(null);
        return;
      }
      // ICT admin
      if (profile.unit.toLowerCase() === 'ict') {
        setCurrentUser({
          id: userAuth.id,
          name: profile.name,
          role: 'staff',
          unit: 'ict',
          username: profile.email,
        });
        return;
      }
      // Other staff
      setCurrentUser({
        id: userAuth.id,
        name: profile.name,
        role: 'staff',
        unit: profile.unit.toLowerCase(),
        username: profile.email,
      });
      return;
    }
    // Invalid role
    alert("Access denied. Invalid user role.");
    setCurrentUser(null);
  } catch (err) {
    alert("An unexpected error occurred during login. Check the console for details.");
    setCurrentUser(null);
    console.error(err);
  }
}

  const handleLogout = () => {
    setCurrentUser(null)
  }

  const handleReceiptUpload = async (unit: ClearanceUnit) => {
    setSelectedUnit(unit)
    setUploadModalOpen(true)
  }

  const handleReceiptSubmit = async (file: File) => {
    if (!selectedUnit || !currentUser) return;
  
    try {
      // 1. Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${selectedUnit.id}-${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`
  
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)
  
      if (uploadError) throw uploadError
  
      // 2. Create receipt record in database
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert([{
          student_id: currentUser.id,
          unit_id: selectedUnit.id,
          file_path: filePath,
          amount: selectedUnit.amountOwed,
          status: 'pending'
        }])
  
      if (receiptError) throw receiptError
  
      // 3. Update clearance status to pending
      const { error: statusError } = await supabase
        .from('clearance_status')
        .update({ status: 'Pending' })
        .eq('student_id', currentUser.id)
        .eq('unit_id', selectedUnit.id)

      if (statusError) throw statusError

      // Refresh clearance status to show updated badge
      const { data } = await supabase
        .from('clearance_status')
        .select(`*, units (id, name, description, priority)`)
        .eq('student_id', currentUser.id)

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.units?.id || item.id,
          name: item.units?.name || "Unknown",
          icon: getUnitIcon(item.units?.name || "Unknown"),
          status: (item.status || "pending").toLowerCase(),
          amountOwed: item.amount_owed || 0,
          description: item.units?.description || "",
          priority: item.units?.priority || "medium",
          rejectionReason: item.rejection_reason || "",
        }))
        setClearanceUnits(mapped)
      }

      setUploadModalOpen(false)
      setSelectedUnit(null)
    } catch (error) {
      console.error("Receipt upload error:", error)
      alert("Failed to upload receipt. Please try again.")
    }
  }

  // Move fetchClearance function here
  const fetchClearance = async () => {
    if (!currentUser || currentUser.role !== "student") return;
    
    console.log("Fetching clearance for user:", currentUser.id);
    setLoading(true)
    
    const { data, error } = await supabase
      .from("clearance_status")
      .select(`*, units (id, name, description, priority)`)
      .eq("user_id", currentUser.id)
      
    console.log("Clearance query result:", { data, error });
    
    if (error) {
      console.error("Database error:", error);
      alert("Failed to fetch clearance status: " + error.message)
      setLoading(false)
      return
    }
    
    if (!data || data.length === 0) {
      console.log("No clearance data found for student");
      setLoading(false)
      return
    }
    
    const mapped = (data || []).map((item: any) => ({
      id: item.units?.id || item.id,
      name: item.units?.name || "Unknown",
      icon: getUnitIcon(item.units?.name || "Unknown"),
      status: (item.status || "pending").toLowerCase(),
      amountOwed: item.amount_owed || 0,
      description: item.units?.description || "",
      priority: item.units?.priority || "medium",
      rejectionReason: item.rejection_reason || "",
    }))
    
    console.log("Mapped clearance units:", mapped);
    setClearanceUnits(mapped)
    setLoading(false)
  }

  // ALL useEffect hooks must be here, before any conditional returns
  useEffect(() => {
    fetchClearance()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;
    
    const channel = supabase
      .channel("student-clearance-updates")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "clearance_status",
          filter: `student_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log("Clearance status updated:", payload)
          fetchClearance()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  useEffect(() => {
    const previousStatuses = localStorage.getItem('clearance-statuses')
    if (previousStatuses && clearanceUnits.length > 0) {
      const prev = JSON.parse(previousStatuses)
      const newCleared = clearanceUnits.filter(unit => 
        unit.status === 'cleared' && 
        prev.find((p: any) => p.id === unit.id)?.status !== 'cleared'
      )
      
      if (newCleared.length > 0) {
        setNotifications(prev => [...prev, `${newCleared[0].name} clearance approved!`])
      }
    }
    
    localStorage.setItem('clearance-statuses', JSON.stringify(clearanceUnits))
  }, [clearanceUnits])

  // NOW you can have conditional returns
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (currentUser.role === "staff") {
    if (currentUser.unit === "ict") {
      return <ICTAdminDashboard user={currentUser} onLogout={handleLogout} />
    }
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-aj-primary">Loading your clearance status...</span>
      </div>
    )
  }

  // Student Dashboard
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cleared":
        return <CheckCircle className="h-5 w-5 text-aj-success" />
      case "pending":
        return <Clock className="h-5 w-5 text-aj-warning" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-aj-danger" />
      case "submit_receipt":
        return <Upload className="h-5 w-5 text-aj-accent" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return <Badge variant="default" className="bg-green-500 text-white hover:bg-green-600">Cleared</Badge>
      case "pending":
        return <Badge variant="default" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending Review</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "submit_receipt":
        return <Badge variant="default" className="bg-blue-500 text-white hover:bg-blue-600">Submit Receipt</Badge>
      default:
        return null
    }
  }

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "high":
        return <div className="w-2 h-2 bg-aj-danger rounded-full" />
      case "medium":
        return <div className="w-2 h-2 bg-aj-warning rounded-full" />
      case "low":
        return <div className="w-2 h-2 bg-aj-success rounded-full" />
      default:
        return null
    }
  }

  const getActionButton = (unit: ClearanceUnit) => {
    switch (unit.status) {
      case "cleared":
        return null
      case "pending":
        return (
          <Button className="w-full bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Under Review
          </Button>
        )
      case "submit_receipt":
        return (
          <Button
            onClick={() => handleReceiptUpload(unit)}
            className="w-full bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold"
          >
            <Upload className="h-4 w-4 mr-2" />
            Submit Receipt
          </Button>
        )
      case "rejected":
        return (
          <Button
            onClick={() => handleReceiptUpload(unit)}
            className="w-full bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold"
          >
            <Upload className="h-4 w-4 mr-2" />
            Submit Again
          </Button>
        )
      default:
        return null
    }
  }

  const clearedCount = clearanceUnits.filter((unit) => unit.status === "cleared").length
  const pendingCount = clearanceUnits.filter((unit) => unit.status === "pending").length
  const rejectedCount = clearanceUnits.filter((unit) => unit.status === "rejected").length
  const submitReceiptCount = clearanceUnits.filter((unit) => unit.status === "submit_receipt").length
  const totalCount = clearanceUnits.length
  const progressPercentage = totalCount > 0 ? (clearedCount / totalCount) * 100 : 0
  const totalOwed = clearanceUnits.reduce((sum, unit) => sum + unit.amountOwed, 0)
  const urgentItems = clearanceUnits.filter((unit) => unit.priority === "high" && unit.status !== "cleared")

  return (
    <div className="min-h-screen bg-aj-background">
      {/* Top Navigation Bar */}
      <nav className="bg-aj-primary text-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    {currentUser.name}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-gray-100">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-aj-primary text-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button
                      variant="ghost"
                      className="justify-start text-white hover:bg-white/10 hover:text-white"
                      onClick={handleLogout}
                    >
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-aj-primary mb-2">Fee Clearance Status</h1>
              <p className="text-gray-600">Track your clearance progress across all university departments & units</p>
              <p className="text-sm text-gray-500 mt-1">Track No: {currentUser.trackNo}</p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Status Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Cleared</p>
                    <p className="text-xl font-bold text-aj-success">{clearedCount}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-aj-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-aj-warning">{pendingCount}</p>
                  </div>
                  <Clock className="h-6 w-6 text-aj-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Rejected</p>
                    <p className="text-xl font-bold text-aj-danger">{rejectedCount}</p>
                  </div>
                  <XCircle className="h-6 w-6 text-aj-danger" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Owed</p>
                    <p className="text-lg font-bold text-aj-danger">₦{totalOwed.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-aj-danger" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Urgent Actions Alert */}
        {urgentItems.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-aj-danger bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-aj-danger mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-aj-danger mb-2">Urgent Action Required</h3>
                  <p className="text-gray-700 mb-3">
                    You have {urgentItems.length} high-priority clearance{urgentItems.length > 1 ? "s" : ""} that need
                    immediate attention.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {urgentItems.map((item) => (
                      <Badge key={item.id} variant="destructive">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        <Card className="mb-8 border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-aj-primary flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Clearance Progress
              </CardTitle>
              <Badge variant="outline" className="text-aj-primary border-aj-primary">
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-semibold">
                    {clearedCount}/{totalCount} Units Cleared
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Outstanding Balance</p>
                    <p className="text-2xl font-bold text-aj-danger">₦{totalOwed.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Departments Cleared</p>
                    <p className="text-xl font-bold text-aj-success">
                      {clearedCount}/{totalCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <Button
                    className="bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold"
                    disabled={progressPercentage < 100}
                    size="lg"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    {progressPercentage === 100 ? "Generate Clearance Slip" : "Complete All Clearances"}
                  </Button>
                  {progressPercentage < 100 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Complete all clearances to generate your clearance slip
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clearance Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {clearanceUnits.map((unit) => {
            const IconComponent = unit.icon

            return (
              <Card key={unit.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-aj-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-aj-primary text-lg">{unit.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getPriorityDot(unit.priority)}
                          <span className="text-xs text-gray-500 capitalize">{unit.priority} Priority</span>
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(unit.status)}
                  </div>
                  {getStatusBadge(unit.status)}
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{unit.description}</p>

                  {unit.status === "rejected" && unit.rejectionReason && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-aj-danger mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{unit.rejectionReason}</p>
                    </div>
                  )}

                  {unit.amountOwed > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-gray-600">Amount Owed</p>
                      <p className="text-xl font-bold text-aj-danger">₦{unit.amountOwed.toLocaleString()}</p>
                    </div>
                  )}

                  {getActionButton(unit)}

                  {unit.status === "cleared" && (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-aj-success mx-auto mb-2" />
                      <p className="text-aj-success font-semibold">Clearance Complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 mt-12">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6">
            <Button
              variant="outline"
              className="border-aj-accent text-aj-accent hover:bg-aj-accent hover:text-white bg-transparent"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </Button>
            <Button
              variant="outline"
              className="border-aj-primary text-aj-primary hover:bg-aj-primary hover:text-white bg-transparent"
            >
              <FileText className="h-4 w-4 mr-2" />
              FAQ
            </Button>
            <Button
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white bg-transparent"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-6 h-6 relative">
                <Image
                  src="/aju-logo.png"
                  alt="Arthur Jarvis University Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-aj-primary">Arthur Jarvis University</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 Arthur Jarvis University. All rights reserved. | Student Fee Clearance System
            </p>
          </div>
        </footer>
      </main>

      {/* Receipt Upload Modal */}
      {selectedUnit && (
        <ReceiptUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          unitName={selectedUnit.name}
          amount={selectedUnit.amountOwed}
          studentId={currentUser.id}
          unitId={selectedUnit.id}
        />
      )}
    </div>
  )
}
