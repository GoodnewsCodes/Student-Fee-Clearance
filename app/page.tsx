"use client";

import { useState, useEffect } from "react";
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
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ClearanceUnit } from "@/types";
import { LoginScreen } from "@/components/auth/login-screen";
import { AdminDashboard } from "@/components/admin-dashboard";
import { ReceiptUploadModal } from "@/components/student/receipt-upload-modal";
import { ICTAdminDashboard } from "@/components/ict/ict-admin-dashboard";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateClearanceSlip } from "@/lib/pdf-generator";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<ClearanceUnit | null>(null);
  const [clearanceUnits, setClearanceUnits] = useState<ClearanceUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectedReceipts, setRejectedReceipts] = useState<any[]>([]);

  // Helper: map unit/department name to icon
  const unitIconMap: Record<string, React.ElementType> = {
    Bursary: Building,
    "Exams & Records": FileText,
    "Student Affairs": User,
    Accounts: CreditCard,
    Department: GraduationCap,
    Faculty: BookOpen,
    Library: Book,
    Hospital: Heart,
    Admissions: UserCheck,
    // ...add more as needed
  };
  function getUnitIcon(name: string) {
    return unitIconMap[name] || User;
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
        .from("profiles")
        .select("*")
        .eq("user_id", userAuth.id)
        .single();
      if (profileError || !profile) {
        alert(profileError?.message || "Could not fetch user profile.");
        setCurrentUser(null);
        return;
      }
      // Role-based routing
      if (profile.role === "student") {
        setCurrentUser({
          id: userAuth.id,
          name: profile.name,
          trackNo: profile.track_no,
          role: "student",
          unit: null,
          username: profile.email,
        });
        return;
      }
      if (profile.role === "staff") {
        if (!profile.unit) {
          alert("Staff profile missing unit assignment. Contact ICT.");
          setCurrentUser(null);
          return;
        }
        // ICT admin
        if (profile.unit.toLowerCase() === "ict") {
          setCurrentUser({
            id: userAuth.id,
            name: profile.name,
            role: "staff",
            unit: "ict",
            username: profile.email,
          });
          return;
        }
        // Other staff
        setCurrentUser({
          id: userAuth.id,
          name: profile.name,
          role: "staff",
          unit: profile.unit.toLowerCase(),
          username: profile.email,
        });
        return;
      }
      // Invalid role
      alert("Access denied. Invalid user role.");
      setCurrentUser(null);
    } catch (err) {
      alert(
        "An unexpected error occurred during login. Check the console for details."
      );
      setCurrentUser(null);
      console.error(err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      alert("Password changed successfully!");
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      alert(`Error changing password: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Move fetchClearance function here
  const fetchClearance = async () => {
    if (!currentUser || currentUser.role !== "student") return;

    console.log("Fetching clearance for user:", currentUser.id);
    setLoading(true);

    const { data, error } = await supabase
      .from("clearance_status")
      .select(`*, units (id, name, priority)`)
      .eq("user_id", currentUser.id);

    console.log("Clearance query result:", { data, error });

    if (error) {
      console.error("Database error:", error);
      alert("Failed to fetch clearance status: " + error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      console.log("No clearance data found for student");
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((item: any) => ({
      id: item.units?.id || item.id,
      name: item.units?.name || "Unknown",
      icon: getUnitIcon(item.units?.name || "Unknown"),
      status: (item.status || "pending").toLowerCase(),
      amountOwed: item.amount_owed || 0,
      priority: item.units?.priority || "medium",
      rejectionReason: item.rejection_reason || "",
    }));

    console.log("Mapped clearance units:", mapped);
    setClearanceUnits(mapped);
    setLoading(false);
  };

  // ALL useEffect hooks must be here, before any conditional returns
  useEffect(() => {
    fetchClearance();
  }, [currentUser]);

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
          filter: `student_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("Clearance status updated:", payload);
          fetchClearance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  useEffect(() => {
    const previousStatuses = localStorage.getItem("clearance-statuses");
    if (previousStatuses && clearanceUnits.length > 0) {
      const prev = JSON.parse(previousStatuses);
      const newCleared = clearanceUnits.filter(
        (unit) =>
          unit.status === "cleared" &&
          prev.find((p: any) => p.id === unit.id)?.status !== "cleared"
      );

      if (newCleared.length > 0) {
        setNotifications((prev) => [
          ...prev,
          `${newCleared[0].name} clearance approved!`,
        ]);
      }
    }

    localStorage.setItem("clearance-statuses", JSON.stringify(clearanceUnits));
  }, [clearanceUnits]);

  useEffect(() => {
    const fetchRejectedReceipts = async () => {
      if (currentUser?.role === "student") {
        const { data } = await supabase
          .from("receipts")
          .select(`*, fees!receipts_fee_id_fkey (name)`)
          .eq("student_id", currentUser.id)
          .eq("status", "rejected");

        setRejectedReceipts(data || []);
      }
    };

    if (currentUser) {
      fetchRejectedReceipts();
    }
  }, [currentUser]);

  // NOW you can have conditional returns
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === "staff") {
    if (currentUser.unit === "ict") {
      return <ICTAdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-aj-primary">
          Loading your clearance status...
        </span>
      </div>
    );
  }

  // Student Dashboard
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cleared":
        return <CheckCircle className="h-5 w-5 text-aj-success" />;
      case "pending":
        return <Clock className="h-5 w-5 text-aj-warning" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-aj-danger" />;
      case "submit_receipt":
        return <Upload className="h-5 w-5 text-aj-accent" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return (
          <Badge
            variant="default"
            className="bg-green-500 text-white hover:bg-green-600 whitespace-nowrap"
          >
            Cleared
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500 text-white hover:bg-yellow-600 whitespace-nowrap"
          >
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="whitespace-nowrap">
            Rejected
          </Badge>
        );
      case "submit_receipt":
        return (
          <Badge
            variant="default"
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap"
          >
            Submit Receipt
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "high":
        return <div className="w-2 h-2 bg-aj-danger rounded-full" />;
      case "medium":
        return <div className="w-2 h-2 bg-aj-warning rounded-full" />;
      case "low":
        return <div className="w-2 h-2 bg-aj-success rounded-full" />;
      default:
        return null;
    }
  };

  const getActionButton = (unit: ClearanceUnit) => {
    // Remove all action buttons - students only view status
    return null;
  };

  const clearedCount = clearanceUnits.filter(
    (unit) => unit.status === "cleared"
  ).length;
  const pendingCount = clearanceUnits.filter(
    (unit) => unit.status === "pending"
  ).length;
  const rejectedCount = clearanceUnits.filter(
    (unit) => unit.status === "rejected"
  ).length;
  const submitReceiptCount = clearanceUnits.filter(
    (unit) => unit.status === "submit_receipt"
  ).length;
  const totalCount = clearanceUnits.length;
  const progressPercentage =
    totalCount > 0 ? (clearedCount / totalCount) * 100 : 0;
  const totalOwed = clearanceUnits.reduce(
    (sum, unit) => sum + unit.amountOwed,
    0
  );
  const urgentItems = clearanceUnits.filter(
    (unit) => unit.priority === "high" && unit.status !== "cleared"
  );

  const filteredUnits = clearanceUnits.filter(
    (unit) => statusFilter === "all" || unit.status === statusFilter
  );

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
                <span className="text-xl font-semibold hidden sm:block">
                  Arthur Jarvis University
                </span>
                <span className="text-lg font-semibold sm:hidden">
                  Arthur Jarvis University
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {currentUser.name}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem
                    onClick={() => setShowChangePassword(true)}
                    className="hover:bg-gray-100"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-gray-100"
                  >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-aj-primary text-white"
                  >
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
              <h1 className="text-3xl font-bold text-aj-primary mb-2">
                Fee Clearance Status
              </h1>
              <p className="text-gray-600">
                Track your clearance progress across all university departments
                & units
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Track No: {currentUser.trackNo}
              </p>
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
                    <p className="text-xl font-bold text-aj-success">
                      {clearedCount}
                    </p>
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
                    <p className="text-xl font-bold text-aj-warning">
                      {pendingCount}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-aj-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Rejected
                    </p>
                    <p className="text-xl font-bold text-aj-danger">
                      {rejectedCount}
                    </p>
                  </div>
                  <XCircle className="h-6 w-6 text-aj-danger" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Total Owed
                    </p>
                    <p className="text-lg font-bold text-aj-danger">
                      ₦{totalOwed.toLocaleString()}
                    </p>
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
                  <h3 className="text-lg font-semibold text-aj-danger mb-2">
                    Urgent Action Required
                  </h3>
                  <p className="text-gray-700 mb-3">
                    You have {urgentItems.length} high-priority clearance
                    {urgentItems.length > 1 ? "s" : ""} that need immediate
                    attention.
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

        {/* Rejected Receipts Notifications */}
        {rejectedReceipts.length > 0 && (
          <div className="mb-6 space-y-3">
            {rejectedReceipts.map((receipt) => (
              <Card key={receipt.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">
                        Receipt Rejected
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Your receipt for <strong>{receipt.fees?.name}</strong>{" "}
                        has been rejected.
                      </p>
                      {receipt.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          Reason: {receipt.rejection_reason}
                        </p>
                      )}
                      <p className="text-xs text-red-600 mt-2">
                        Please upload a new receipt with the correct
                        information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Progress Summary */}
        <Card className="mb-8 border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-aj-primary flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Clearance Progress
              </CardTitle>
              <Badge
                variant="outline"
                className="text-aj-primary border-aj-primary"
              >
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
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg flex flex-row items-center justify-between lg:flex-col lg:items-start lg:justify-start">
                    <p className="text-sm text-gray-600 mb-0 lg:mb-1">
                      Total Outstanding Balance
                    </p>
                    <p className="text-2xl font-bold text-aj-danger">
                      ₦{totalOwed.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg flex flex-row items-center justify-between lg:flex-col lg:items-start lg:justify-start">
                    <p className="text-sm text-gray-600 mb-0 lg:mb-1">
                      Departments Cleared
                    </p>
                    <p className="text-xl font-bold text-aj-success">
                      {clearedCount}/{totalCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <Button
                    className="bg-aj-accent text-white hover:bg-aj-accent/90 hover:text-white font-semibold"
                    disabled={progressPercentage < 100}
                    size="lg"
                    onClick={() => {
                      if (progressPercentage === 100) {
                        generateClearanceSlip(currentUser, clearanceUnits);
                      }
                    }}
                  >
                    <Shield className="h-6 w-5" />
                    {progressPercentage === 100
                      ? "Generate Clearance Slip"
                      : "Complete All Clearances"}
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

        {/* Add this after the progress section, before clearance status cards */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Submit Payment Receipts
              </h3>
              <p className="text-gray-600 mb-4">
                Upload receipts for fee payments
              </p>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-aj-accent text-white hover:bg-aj-accent/90 hover:text-white font-semibold"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Receipt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clearance Status Cards */}
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <h2 className="text-xl font-semibold text-aj-primary">
            Clearance Units
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Priority Legend */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
              <span className="font-medium">Priority:</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-aj-danger rounded-full" />
                <span>High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-aj-warning rounded-full" />
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-aj-success rounded-full" />
                <span>Low</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submit_receipt">Submit Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredUnits.map((unit) => {
            const IconComponent = unit.icon;
            return (
              <Card key={unit.id} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg">
                        <IconComponent className="h-6 w-6 text-aj-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {unit.name}
                          </h3>
                          {getPriorityDot(unit.priority)}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(unit.status)}
                  </div>

                  {unit.status === "rejected" && unit.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong>{" "}
                        {unit.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* {unit.amountOwed > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm text-orange-700">
                        <strong>Amount Owed:</strong> ₦
                        {unit.amountOwed.toLocaleString()}
                      </p>
                    </div>
                  )} */}
                </CardContent>
              </Card>
            );
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
              <span className="font-semibold text-aj-primary">
                Arthur Jarvis University
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 Arthur Jarvis University. All rights reserved. | Student
              Fee Clearance System
            </p>
          </div>
        </footer>
      </main>

      {/* Receipt Upload Modal */}
      <ReceiptUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        studentId={currentUser.id}
      />

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
