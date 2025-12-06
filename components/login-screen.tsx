"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { adminUnits } from "@/components/ui/units"

interface LoginScreenProps {
  onLogin: (credentials: any) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [isStudentLoggingIn, setIsStudentLoggingIn] = useState(false)
  const [isStaffLoggingIn, setIsStaffLoggingIn] = useState(false)
  const [studentCredentials, setStudentCredentials] = useState({
    trackNo: "",
    password: "",
  })
  const [adminCredentials, setAdminCredentials] = useState({
    email: "",
    password: "",
  })



  // Reset loading states when component mounts or when returning from navigation
  useEffect(() => {
    setIsStudentLoggingIn(false);
    setIsStaffLoggingIn(false);
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStudentLoggingIn(true);
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: studentCredentials.trackNo, // using trackNo as email
      password: studentCredentials.password,
    });
    console.log("Supabase login response:", { data, error });
    if (error || !data.user) {
      alert(error?.message || "Login failed");
      return;
    }
    // Fetch user profile and check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();
    if (profileError || !profile) {
      alert(profileError?.message || "Could not fetch user profile.");
      return;
    }
    if (profile.role !== 'student') {
      alert("Access denied. Only students can log in here. Please use the staff login tab if you are staff.");
      return;
    }
    try {
      onLogin({ ...studentCredentials, role: "student", user: data.user });
    } catch (err) {
      console.error("Error in onLogin handler:", err);
      alert("An error occurred after login. Check the console for details.");
    }
  } catch (err) {
    console.error("Unexpected error during login:", err);
    alert("An unexpected error occurred during login. Check the console for details.");
  } finally {
    setIsStudentLoggingIn(false);
  }
}

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoggingIn(true);
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminCredentials.email,
        password: adminCredentials.password,
      });

      if (error || !data.user) {
        alert(error?.message || "Login failed. Please check your credentials.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, unit')
        .eq('user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        alert(profileError?.message || "Could not fetch user profile.");
        return;
      }

      if (profile.role !== 'staff' || !profile.unit) {
        alert("Access denied. You are not an authorized staff member.");
        return;
      }

      onLogin({ role: 'staff', unit: profile.unit, user: data.user });
    } catch (err) {
      console.error("Unexpected error during login:", err);
      alert("An unexpected error occurred during login.");
    } finally {
      setIsStaffLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4">
              <Image
                src="/aju-logo.png"
                alt="Arthur Jarvis University Logo"
                width={64}
                height={64}
                className="object-contain drop-shadow-aj-logo rounded-sm"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-aj-accent mb-2">Arthur Jarvis University</CardTitle>
            <p className="text-gray-600 text-sm">Fee Clearance System</p>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Student</span>
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Staff</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Track Number</label>
                    <Input
                      type="text"
                      placeholder="24/123012"
                      value={studentCredentials.trackNo}
                      onChange={(e) => setStudentCredentials((prev) => ({ ...prev, trackNo: e.target.value }))}
                      className="h-12 border-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={studentCredentials.password}
                        onChange={(e) => setStudentCredentials((prev) => ({ ...prev, password: e.target.value }))}
                        className="h-12 pr-12 border-gray-300"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold text-base flex items-center justify-center"
                    disabled={isStudentLoggingIn}
                  >
                    {isStudentLoggingIn ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  <div className="text-center">
                    <Button variant="link" className="text-blue-600 text-sm" onClick={() => router.push('/forgot-password')}>
                      Forgot Password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">


                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={adminCredentials.email}
                      onChange={(e) => setAdminCredentials((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-12 border-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))}
                        className="h-12 pr-12 border-gray-300"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold text-base flex items-center justify-center"
                    disabled={isStaffLoggingIn}
                  >
                    {isStaffLoggingIn ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  <div className="text-center">
                    <Button variant="link" className="text-blue-600 text-sm" onClick={() => router.push('/forgot-password')}>
                      Forgot Password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


