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
    name: string
    track_no: string
  }
  units: {
    id: string
    name: string
  }
}

export function ReceiptReviewScreen({ user }: { user: any }) {
  const [receipts, setReceipts] = useState<ReceiptWithStudent[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        // Map admin unit to database unit name
        const unitName = user.unit === "bursary" ? "Bursary" : 
                         user.unit === "accounts" ? "Accounts" : 
                         user.unit === "library" ? "Library" :
                         user.unit === "hospital" ? "Hospital" :
                         user.unit === "ict" ? "ICT" :
                         user.unit === "student_affairs" ? "Student Affairs" :
                         user.unit === "exams" ? "Exams & Records" :
                         user.unit === "faculty" ? "Faculty" :
                         user.unit === "department" ? "Department" :
                         user.unit === "admissions" ? "Admissions" :
                         user.unit;

        console.log("Fetching receipts for unit:", unitName);

        const { data, error } = await supabase
          .from("receipts")
          .select(`
            *,
            students!receipts_student_id_fkey (
              name,
              track_no
            ),
            units!receipts_unit_id_fkey (
              id,
              name
            )
          `)
          .eq("status", "pending")
          .eq("units.name", unitName)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error("Error fetching receipts:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
        } else {
          console.log("Fetched receipts for unit:", unitName, data);
          setReceipts(data as any);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchReceipts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("receipts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        () => {
          fetchReceipts(); // Refetch when receipts change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.unit]);

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
    setProcessingId(receiptId);
    try {
      const { data, error } = await supabase
        .from("receipts")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", receiptId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update clearance status based on action
      await supabase
        .from("clearance_status")
        .update({ status: action === "approve" ? "Cleared" : "rejected" })
        .eq("student_id", data.student_id)
        .eq("unit_id", data.unit_id);

      // Remove from pending receipts list
      setReceipts(receipts.filter(r => r.id !== receiptId));

    } catch (error: any) {
      console.error("Error processing receipt:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Review</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No receipts to review</p>
              <p className="text-gray-400 text-sm mt-2">All receipts have been processed or none have been submitted yet.</p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <Card key={receipt.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{receipt.students?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{receipt.students?.track_no || 'N/A'}</p>
                    <p className="text-sm">Amount: ₦{receipt.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Unit: {receipt.units?.name}</p>
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
                          <DialogTitle>Receipt - {receipt.students?.name || 'Unknown'}</DialogTitle>
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}






















