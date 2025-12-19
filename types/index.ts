import type React from "react";

export interface ClearanceUnit {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "cleared" | "pending" | "submit_receipt" | "rejected";
  amountOwed: number;
  priority: "high" | "medium" | "low";
  rejectionReason?: string;
  receiptSubmitted?: boolean;
}

export interface User {
  id: string;
  trackNo: string;
  name: string;
  email: string;
  role: "student" | "admin";
  department?: string;
}

export interface AdminUser extends User {
  role: "admin";
  unit:
    | "bursary"
    | "exams"
    | "student_affairs"
    | "accounts"
    | "department"
    | "faculty"
    | "library"
    | "hospital"
    | "admissions"
    | "ict";
  permissions: string[];
}

export interface Receipt {
  id: string;
  studentId: string;
  imageUrl: string;
  file_path: string;
  uploadedAt: Date;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  feeId: string;
  academicYear: number;
  semester: "first" | "second";
  approvedByBursary?: boolean;
  approvedByAccounts?: boolean;
}

export interface Fee {
  id: string;
  name: string;
  amount: number;
  accountNumber: string;
  description: string;
  unit: string;
  departmentId?: string;
  department?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: "lecturer" | "staff";
  department: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface StudentProfile {
  id: string; // Corresponds to auth.users.id
  name: string; // Changed from name
  track_no: string; // Changed from track_no
  email: string;
  department?: string; // Add this property
  created_at: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface ClearanceStatus {
  id: string;
  student_id: string;
  unit_id: string;
  status: "Cleared" | "Pending" | "rejected";
  updated_at: string;
  // Optional: to hold joined data
  departments?: Department;
  students?: StudentProfile;
  units?: Unit;
  profiles?: StudentProfile;
}
