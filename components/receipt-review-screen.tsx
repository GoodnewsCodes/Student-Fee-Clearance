"use client"

import { useState, useEffect } from "react"
import { Eye, Download, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"

interface ReceiptWithStudent {
  id: string
  file_path: string
  amount: number
  status: string
  students: {
    full_name: string
    registration_number: string
  }
}

export function ReceiptReviewScreen({ user }: { user: any }) {
  const [receipts, setReceipts] = useState<ReceiptWithStudent[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const getImageUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, 3600) // 1 hour expiry
    
    return data?.signedUrl || null
  }

  const handleViewImage = async (filePath: string) => {
    const url = await getImageUrl(filePath)
    setImageUrl(url)
  }

  const handleReceiptAction = async (receiptId: string, action: "approve" | "reject") => {
    setProcessingId(receiptId)
    try {
      const { data, error } = await supabase
        .from("receipts")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", receiptId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update clearance status
      await supabase
        .from("clearance_status")
        .update({ status: action === "approve" ? "Cleared" : "Not Cleared" })
        .eq("student_id", data.student_id)
        .eq("unit_id", data.unitId)

      // Remove from receipts list
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId))
    } catch (e: any) {
      console.error("Error processing receipt:", e)
      alert(`Receipt processing failed: ${e.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Review</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{receipt.students.full_name}</p>
                  <p className="text-sm text-gray-500">{receipt.students.registration_number}</p>
                  <p className="text-sm">Amount: ₦{receipt.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
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
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Receipt - {receipt.students.full_name}</DialogTitle>
                      </DialogHeader>
                      {imageUrl && (
                        <div className="flex justify-center">
                          <img 
                            src={imageUrl} 
                            alt="Receipt" 
                            className="max-w-full max-h-[70vh] object-contain"
                          />
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleReceiptAction(receipt.id, "approve")}
                    disabled={processingId === receipt.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleReceiptAction(receipt.id, "reject")}
                    disabled={processingId === receipt.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
