"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

interface ReceiptWithDetails {
  id: string
  file_path: string
  amount: number
  status: string
  academic_year: number
  semester: string
  uploaded_at: string
  fees: {
    name: string
    amount: number
    unit: string
  }
}

// Add this temporary debug function at the top of your component
const debugDatabase = async () => {
  const { data: students } = await supabase.from("students").select("*")
  const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "student")
  
  console.log("All students:", students)
  console.log("All student profiles:", profiles)
}

export function VerificationScreen({ user }: { user: any }) {
  const [searchTrackNo, setSearchTrackNo] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [clearanceData, setClearanceData] = useState<any[]>([])
  const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [selectedFee, setSelectedFee] = useState<string>("all")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    debugDatabase()
  }, [])

  const handleSearch = async () => {
    if (!searchTrackNo.trim()) return

    setIsSearching(true)
    const searchTerm = searchTrackNo.trim()
    console.log("Searching for track number or name:", `"${searchTerm}"`)
    
    try {
      // Debug: First check what's actually in the students table
      const { data: allStudents, error: allError } = await supabase
        .from("students")
        .select("*")
      
      console.log("All students in database:", allStudents)
      console.log("All students error:", allError)
      
      // First try to find in students table (search by track_no or name)
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .or(`track_no.eq.${searchTerm},name.ilike.%${searchTerm}%`)

      console.log("Students search result:", { studentData, studentError })

      if (studentData && studentData.length > 0) {
        const student = studentData[0]
        setSearchResult(student)
        
        // Fetch clearance data using both student_id and user_id for compatibility
        const { data: clearanceData, error: clearanceError } = await supabase
          .from("clearance_status")
          .select(`*, units (*)`)
          .or(`student_id.eq.${student.id},user_id.eq.${student.user_id}`)

        console.log("Clearance data:", { clearanceData, clearanceError })
        setClearanceData(clearanceError ? [] : clearanceData || [])

        // Fetch receipts using student.id (exclude rejected ones)
        const { data: receiptsData, error: receiptsError } = await supabase
          .from("receipts")
          .select(`*, fees!receipts_fee_id_fkey (name, amount, unit)`)
          .eq("student_id", student.id)
          .neq("status", "rejected")
          .order('uploaded_at', { ascending: false })

        console.log("Receipts data:", { receiptsData, receiptsError })
        setReceipts(receiptsError ? [] : receiptsData as any || [])
        return
      }

      // Fallback: try profiles table (search by track_no or name)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .or(`track_no.eq.${searchTerm},name.ilike.%${searchTerm}%`)
        .eq("role", "student")

      console.log("Profiles search result:", { profileData, profileError })

      if (profileData && profileData.length > 0) {
        const profile = profileData[0]
        setSearchResult(profile)
        
        // Find corresponding student record
        const { data: linkedStudent } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", profile.user_id)
          .single()

        // Fetch clearance data
        const { data: clearanceData } = await supabase
          .from("clearance_status")
          .select(`*, units (*)`)
          .eq("user_id", profile.user_id)

        setClearanceData(clearanceData || [])

        // Fetch receipts if student record exists (exclude rejected ones)
        if (linkedStudent) {
          const { data: receiptsData } = await supabase
            .from("receipts")
            .select(`*, fees!receipts_fee_id_fkey (name, amount, unit)`)
            .eq("student_id", linkedStudent.id)
            .neq("status", "rejected")
            .order('uploaded_at', { ascending: false })

          setReceipts(receiptsData as any || [])
        }
        return
      }

      alert(`Student with track number or name "${searchTerm}" not found`)
      setSearchResult(null)
      setClearanceData([])
      setReceipts([])

    } catch (error: any) {
      console.error("Search error:", error)
      alert(`An error occurred: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const getImageUrl = async (filePath: string) => {
    setImageLoading(true)
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, 3600) // 1 hour expiry
    
    setImageLoading(false)
    return data?.signedUrl || null
  }

  const handleViewImage = async (filePath: string) => {
    const url = await getImageUrl(filePath)
    setImageUrl(url)
  }

  const handleImageZoom = (factor: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const offsetY = event.clientY - rect.top
      setImagePosition(prev => ({
        x: prev.x + offsetX * (1 - imageZoom) * factor,
        y: prev.y + offsetY * (1 - imageZoom) * factor
      }))
    }
    setImageZoom(prev => Math.min(3, Math.max(0.5, prev + factor)))
  }

  const resetImageView = () => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Filter receipts based on selected year, semester, and fee
  const filteredReceipts = receipts.filter(receipt => {
    const yearMatch = selectedYear === "all" || receipt.academic_year.toString() === selectedYear
    const semesterMatch = selectedSemester === "all" || receipt.semester === selectedSemester
    const feeMatch = selectedFee === "all" || receipt.fees.name === selectedFee
    return yearMatch && semesterMatch && feeMatch
  })

  // Get unique years, semesters, and fees for filter options
  const availableYears = [...new Set(receipts.map(r => r.academic_year.toString()))]
  const availableSemesters = [...new Set(receipts.map(r => r.semester))]
  const availableFees = [...new Set(receipts.map(r => r.fees.name))]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Clearance Verification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Enter track number or name (e.g., 23/132025 or John Doe)"
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
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg">{searchResult.name}</h3>
                <p className="text-sm text-gray-600">Registration: {searchResult.track_no}</p>
                <p className="text-sm text-gray-600">Email: {searchResult.email}</p>
                <p className="text-sm text-gray-600">Department: {searchResult.department}</p>
              </CardContent>
            </Card>

            {/* Clearance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Clearance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clearanceData.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{status.units?.name}</p>
                        <p className="text-sm text-gray-500">{status.units?.description}</p>
                      </div>
                      <Badge variant={status.status === "Cleared" ? "default" : status.status === "rejected" ? "destructive" : "secondary"}>
                        {status.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Receipts Section */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Receipts</CardTitle>
                <div className="flex gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year}>Year {year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {availableSemesters.map(semester => (
                        <SelectItem key={semester} value={semester}>
                          {semester.charAt(0).toUpperCase() + semester.slice(1)} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedFee} onValueChange={setSelectedFee}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by fee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fees</SelectItem>
                      {availableFees.map(fee => (
                        <SelectItem key={fee} value={fee}>{fee}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredReceipts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No receipts found for the selected filters</p>
                ) : (
                  <div className="space-y-4">
                    {filteredReceipts.map((receipt) => (
                      <Card key={receipt.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{receipt.fees?.name}</p>
                            <p className="text-sm">Amount: ₦{receipt.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">
                              Year {receipt.academic_year} - {receipt.semester} semester
                            </p>
                            <p className="text-xs text-gray-400">
                              Uploaded: {new Date(receipt.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={receipt.status === "approved" ? "default" : receipt.status === "rejected" ? "destructive" : "secondary"}>
                              {receipt.status}
                            </Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewImage(receipt.file_path)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center justify-between">
                                    <span>Receipt - {receipt.fees?.name}</span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleImageZoom(-0.25)}
                                        disabled={imageZoom <= 0.5}
                                      >
                                        Zoom Out
                                      </Button>
                                      <span className="text-sm text-gray-500">
                                        {Math.round(imageZoom * 100)}%
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleImageZoom(0.25)}
                                        disabled={imageZoom >= 3}
                                      >
                                        Zoom In
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetImageView}
                                      >
                                        Reset
                                      </Button>
                                    </div>
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="flex justify-center items-center min-h-[500px] overflow-auto bg-gray-50 rounded-lg">
                                  {imageLoading ? (
                                    <div className="flex flex-col items-center p-8">
                                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                      <p className="text-gray-600">Loading receipt image...</p>
                                    </div>
                                  ) : imageUrl ? (
                                    <div 
                                      className="relative overflow-auto max-h-[500px] cursor-move select-none"
                                      style={{ 
                                        transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                        transformOrigin: 'center center',
                                        transition: isDragging ? 'none' : 'transform 0.2s ease-in-out'
                                      }}
                                      onMouseDown={handleMouseDown}
                                      onMouseMove={handleMouseMove}
                                      onMouseUp={handleMouseUp}
                                      onMouseLeave={handleMouseUp}
                                    >
                                      <img 
                                        src={imageUrl} 
                                        alt="Receipt" 
                                        className="max-w-full h-auto select-none pointer-events-none"
                                        style={{ 
                                          imageRendering: 'auto',
                                          maxHeight: '500px'
                                        }}
                                        draggable={false}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center p-8 text-gray-500">
                                      <Eye className="h-12 w-12 mb-4 opacity-50" />
                                      <p>Failed to load receipt image</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center text-sm text-gray-500 mt-2">
                                  Click to zoom in • Double-click to reset • Use zoom controls above
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}






