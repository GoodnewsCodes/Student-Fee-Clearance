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
  academic_year: number
  semester: string
  students: {
    name: string
    track_no: string
  }
  fees: {
    id: string
    name: string
    amount: number
    unit: string
  }
}

export function ReceiptReviewScreen({ user }: { user: any }) {
  const [receipts, setReceipts] = useState<ReceiptWithStudent[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
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
    const fetchReceipts = async () => {
      try {
        let query = supabase
          .from("receipts")
          .select(`
            *,
            students!receipts_student_id_fkey (
              name,
              track_no
            ),
            fees!receipts_fee_id_fkey (
              name,
              amount,
              unit
            )
          `)
          .order('uploaded_at', { ascending: false });

        // Only bursary and accounts can see pending receipts
        if (user.unit === "bursary" || user.unit === "accounts") {
          query = query.eq("status", "pending");
        } else {
          // Other units see approved receipts
          query = query.eq("status", "approved");
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching receipts:", error);
        } else {
          setReceipts(data as any);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchReceipts();
  }, [user.unit]);

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

  const handleReceiptAction = async (receiptId: string, action: "approve" | "reject") => {
    setProcessingId(receiptId);
    try {
      if (action === "reject") {
        // Find the receipt to get file path
        const receipt = receipts.find(r => r.id === receiptId);
        if (receipt) {
          // Delete from storage bucket
          await supabase.storage
            .from('receipts')
            .remove([receipt.file_path]);
          
          // Get student_id from the database since it's not in the interface
          const { data: receiptData } = await supabase
            .from('receipts')
            .select('student_id')
            .eq('id', receiptId)
            .single();
          
          // Create notification for student
          if (receiptData) {
            await supabase
              .from('notifications')
              .insert({
                student_id: receiptData.student_id,
                message: `Your receipt for ${receipt.fees?.name} (₦${receipt.amount.toLocaleString()}) has been rejected. Please resubmit with a valid receipt.`,
                type: 'rejection',
                is_dismissable: false
              });
          }
          
          // Delete the receipt record
          await supabase
            .from("receipts")
            .delete()
            .eq("id", receiptId);
        }
      } else {
        // Approve receipt
        await supabase
          .from("receipts")
          .update({ 
            status: "approved",
            [`approved_by_${user.unit}`]: true
          })
          .eq("id", receiptId);
      }

      setReceipts(receipts.filter(r => r.id !== receiptId));
    } catch (error: any) {
      console.error("Error processing receipt:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const canReviewReceipts = user.unit === "bursary" || user.unit === "accounts";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {canReviewReceipts ? "Receipt Review" : "Approved Receipts"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {canReviewReceipts ? "No receipts to review" : "No approved receipts"}
              </p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <Card key={receipt.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{receipt.students?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{receipt.students?.track_no || 'N/A'}</p>
                    <p className="text-sm">Fee: {receipt.fees?.name}</p>
                    <p className="text-sm">Amount: ₦{receipt.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      Year {receipt.academic_year} - {receipt.semester} semester
                    </p>
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
                      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>Receipt - {receipt.students?.name || 'Unknown'}</span>
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
                              className={`relative overflow-auto max-h-[500px] ${canReviewReceipts ? 'cursor-move' : 'cursor-default'}`}
                              style={{ 
                                transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                transformOrigin: 'center center',
                              }}
                              onMouseDown={canReviewReceipts ? handleMouseDown : undefined}
                              onMouseMove={canReviewReceipts ? handleMouseMove : undefined}
                              onMouseUp={canReviewReceipts ? handleMouseUp : undefined}
                              onWheel={canReviewReceipts ? (e) => {
                                e.preventDefault();
                                handleImageZoom(e.deltaY > 0 ? -0.25 : 0.25, e);
                              } : undefined}
                            >
                              <img 
                                src={imageUrl} 
                                alt="Receipt" 
                                className="max-w-full h-auto select-none"
                                style={{ 
                                  imageRendering: 'auto',
                                  maxHeight: '500px'
                                }}
                                onClick={(e) => handleImageZoom(0.5, e)}
                                onDoubleClick={resetImageView}
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
                    
                    {canReviewReceipts && (
                      <>
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
                      </>
                    )}
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

































