"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import type { StudentProfile } from "@/types"

interface VerificationScreenProps {
  user: any
}

export function VerificationScreen({ user }: VerificationScreenProps) {
  const [searchTrackNo, setSearchTrackNo] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<StudentProfile | null>(null)
  const [clearanceData, setClearanceData] = useState<any[]>([])

  const handleSearch = async () => {
    if (!searchTrackNo.trim()) return

    setIsSearching(true)
    try {
      const { data: studentData, error: studentError } = await supabase
        .from("profiles")
        .select("*")
        .eq("track_no", searchTrackNo.trim())
        .eq("role", "student")
        .single()

      if (studentError || !studentData) {
        alert("Student not found")
        setSearchResult(null)
        setClearanceData([])
        return
      }

      setSearchResult(studentData)

      const { data: clearanceData, error: clearanceError } = await supabase
        .from("clearance_status")
        .select(`
          *,
          units (*)
        `)
        .eq("user_id", studentData.user_id)

      if (clearanceError) {
        console.error("Error fetching clearance data:", clearanceError)
        setClearanceData([])
      } else {
        setClearanceData(clearanceData || [])
      }
    } catch (error: any) {
      alert(`An error occurred: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Clearance Verification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Enter student registration number (e.g., 23/132025)"
            value={searchTrackNo}
            onChange={(e) => setSearchTrackNo(e.target.value)}
          />
          <Button 
            onClick={handleSearch} 
            className="w-full sm:w-auto flex items-center justify-center" 
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {searchResult && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg">{searchResult.name}</h3>
                <p className="text-sm text-gray-600">Registration: {searchResult.track_no}</p>
                <p className="text-sm text-gray-600">Email: {searchResult.email}</p>
                <p className="text-sm text-gray-600">Department: {searchResult.department}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <h4 className="font-semibold">Clearance Status</h4>
              {clearanceData.length > 0 ? (
                clearanceData.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.units?.name}</p>
                        <p className="text-sm text-gray-500">Last updated: {new Date(item.updated_at).toLocaleDateString()}</p>
                      </div>
                      <Badge className={
                        item.status === "Cleared" 
                          ? "bg-green-100 text-green-800" 
                          : item.status === "Pending" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-red-100 text-red-800"
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No clearance data found.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




