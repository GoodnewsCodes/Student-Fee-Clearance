"use client"

import { useState } from "react"
import { Edit, Save, X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Fee } from "@/types"
import { type Department, departments } from "@/types/department"

interface FeeManagementProps {
  userUnit: string
}

export function FeeManagement({ userUnit }: FeeManagementProps) {
  const [fees, setFees] = useState<Fee[]>([
    { id: "1", name: "ACCEPTANCE FEE (NEW STUDENT)", amount: 50000, accountNumber: "1027335816", description: "One-time fee for new students", unit: "admissions" },
    { id: "2", name: "FACULTY DUES (PER SEMESTER)", amount: 10000, accountNumber: "1027335816", description: "Dues for faculty resources", unit: "faculty" },
    { id: "3", name: "DEPARTMENTAL DUES (PER SEMESTER)", amount: 10000, accountNumber: "1027335816", description: "Dues for departmental resources", unit: "department" },
    { id: "4", name: "GSS FEE (PER SEMESTER)", amount: 10000, accountNumber: "1027335816", description: "General studies fee", unit: "bursary" },
    { id: "5", name: "ID CARD FEE", amount: 10000, accountNumber: "1027335816", description: "Student identification card fee", unit: "student_affairs" },
    { id: "6", name: "LIBRARY FEE (PER SEMESTER)", amount: 10000, accountNumber: "1027335816", description: "Access to university libraries", unit: "library" },
    { id: "7", name: "MATRICULATION FEE (NEW STUDENT)", amount: 20000, accountNumber: "1027335816", description: "Fee for matriculation ceremony", unit: "admissions" },
    { id: "8", name: "CONVOCATION FEE (FINAL YEAR STUDENTS)", amount: 60000, accountNumber: "1027335816", description: "Fee for graduation ceremony", unit: "exams" },
    { id: "9", name: "ALUMNI FEE (FINAL YEAR STUDENTS)", amount: 10000, accountNumber: "1027335816", description: "Fee for alumni association", unit: "alumni" },
    { id: "10", name: "TRANSFER FEE", amount: 100000, accountNumber: "1027335816", description: "For students transferring from other institutions", unit: "admissions" },
    { id: "11", name: "TRANSCRIPT FEE (Local)", amount: 50000, accountNumber: "1027335816", description: "Processing of transcripts for local use", unit: "exams" },
    { id: "12", name: "TRANSCRIPT FEE (Foreign)", amount: 100000, accountNumber: "1027335816", description: "Processing of transcripts for foreign use", unit: "exams" },
    { id: "13", name: "SPORTS LEVY (PER SESSION)", amount: 10000, accountNumber: "1027335816", description: "Levy for sports activities", unit: "student_affairs" },
    { id: "14", name: "MEDICAL CARE DEPOSIT (Compulsory Per session)", amount: 40000, accountNumber: "1027335816", description: "Deposit for medical services", unit: "hospital" },
    { id: "16", name: "TECHNOLOGY FEE (PER SEMESTER)", amount: 30000, accountNumber: "1027335816", description: "Fee for technology services and infrastructure", unit: "ict" },
    { id: "17", name: "SRC LEVY (PER SESSION)", amount: 5000, accountNumber: "1023041667", description: "Student Representative Council levy", unit: "student_affairs" },
    { id: "18", name: "UTILITY BILL (PER SEMESTER)", amount: 25000, accountNumber: "1027335816", description: "Contribution to utility expenses", unit: "bursary" },
    { id: "19", name: "LAB/STUDIO FEES (LAB RELATED COURSES) PER SESSION", amount: 40000, accountNumber: "1027335816", description: "Fees for laboratory or studio usage", unit: "department" },
    { id: "20", name: "ACCREDITATION FEES (PER SESSION)", amount: 30000, accountNumber: "1027335816", description: "Fees for programme accreditation", unit: "bursary" },
    { id: "21", name: "PROJECT DEFENCE FEES (FINAL YEAR STUDENTS)", amount: 30000, accountNumber: "1027335816", description: "Fee for final year project defence", unit: "department" },
  ])

  const [editingFee, setEditingFee] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Fee>>({})

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee.id)
    setEditForm(fee)
  }

  const handleSave = () => {
    if (editingFee && editForm) {
      const updatedFee = { ...fees.find(f => f.id === editingFee), ...editForm };
      if (updatedFee.departmentId) {
        const department = departments.find(d => d.id === updatedFee.departmentId);
        updatedFee.department = department ? department.name : '';
      }

      setFees((prev) => prev.map((fee) => (fee.id === editingFee ? updatedFee as Fee : fee)))
      setEditingFee(null)
      setEditForm({})
      // Here you would typically make an API call to update the backend
      console.log("Fee updated:", updatedFee)
    }
  }

  const handleCancel = () => {
    setEditingFee(null)
    setEditForm({})
  }

  // Filter fees based on user permissions
  const canEditFee = (feeUnit: string) => {
    if (userUnit === "bursary") return true // Bursary can edit all fees
    if (userUnit === "accounts") return feeUnit === "accounts" || feeUnit === "bursary"
    return false
  }

  const editableFees = fees.filter((fee) => canEditFee(fee.unit))

  const getUnitDisplayName = (unit: string) => {
    const unitNames: Record<string, string> = {
      bursary: "Bursary",
      exams: "Exams & Records",
      hospital: "Hospital",
      library: "Library",
      student_affairs: "Student Affairs",
      department: "Department",
      faculty: "Faculty",
      admissions: "Admissions",
      accounts: "Accounts",
      ict: "ICT",
      alumni: "Alumni",
    }
    return unitNames[unit] || unit
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-aj-primary flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Fee Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            {userUnit === "bursary"
              ? "You can edit all university fees and account details"
              : "You can edit fees for your unit and bursary-related fees"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editableFees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No fees available for editing in your unit.</p>
              </div>
            ) : (
              editableFees.map((fee) => (
                <Card key={fee.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    {editingFee === fee.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Fee Name</label>
                            <Input
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Fee name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (₦)</label>
                            <Input
                              type="number"
                              value={editForm.amount || ""}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                              placeholder="Amount"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Account Number</label>
                            <Input
                              value={editForm.accountNumber || ""}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                              placeholder="Account number"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Unit</label>
                            <Input value={getUnitDisplayName(editForm.unit || "")} disabled className="bg-gray-100" />
                          </div>
                          {editForm.unit === 'department' && (
                            <>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Department</label>
                                <Select
                                  value={editForm.departmentId || ""}
                                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, departmentId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                          <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Fee description"
                            rows={2}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSave} className="bg-aj-success text-white hover:bg-aj-success/90">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancel} className="bg-transparent">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <p className="font-semibold text-aj-primary text-lg">{fee.name}</p>
                              <p className="text-sm text-gray-600">{fee.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Unit: {getUnitDisplayName(fee.unit)}</p>
                              {fee.department && <p className="text-xs text-blue-500 mt-1">Dept: {fee.department}</p>} 
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Amount</p>
                              <p className="font-bold text-aj-danger text-xl">₦{fee.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Account Number</p>
                              <div>
                              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{fee.accountNumber}</p>
                              <p className="text-xs text-gray-500 mt-1">UBA / AJU FEES ACCOUNT</p>
                            </div>
                            </div>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(fee)}
                                className="bg-transparent border-aj-accent text-aj-accent hover:bg-aj-accent hover:text-white"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {editableFees.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Fee Management Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Changes to fee amounts will be reflected immediately in student dashboards</li>
                <li>• Account numbers should be verified before saving changes</li>
                <li>• All fee modifications are logged for audit purposes</li>
                {userUnit === "bursary" && <li>• As Bursary officer, you have full access to all university fees</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
