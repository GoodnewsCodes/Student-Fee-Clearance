"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"

interface ReceiptUploadModalProps {
  isOpen: boolean
  onClose: () => void
  unitName: string
  amount: number
  studentId: string
  unitId: string
}

export function ReceiptUploadModal({ 
  isOpen, 
  onClose, 
  unitName, 
  amount, 
  studentId,
  unitId
}: ReceiptUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (file: File) => {
    setError("")

    // Check file size (300KB limit)
    if (file.size > 300 * 1024) {
      setError("File size must be less than 300KB")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG)")
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${studentId}_${unitId}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
      }

      // Insert receipt record into the database
      const { error: insertError } = await supabase.from("receipts").insert({
        student_id: studentId,
        unit_id: unitId,
        imageUrl: urlData.publicUrl,
        status: "pending",
        amount: amount,
      });

      if (insertError) {
        throw insertError;
      }

      alert("Receipt submitted successfully!");
      onClose();
      setSelectedFile(null);
    } catch (error: any) {
      setError(`Upload failed: ${error.message}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + " KB"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-aj-primary">Submit Payment Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Upload receipt for</p>
            <p className="font-semibold text-aj-primary">{unitName}</p>
            <p className="text-lg font-bold text-aj-danger">₦{amount.toLocaleString()}</p>
          </div>

          <Card
            className={`border-2 border-dashed transition-colors ${
              dragActive ? "border-aj-accent bg-orange-50" : "border-gray-300"
            }`}
          >
            <CardContent className="p-6">
              <div
                className="text-center cursor-pointer"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("receipt-upload")?.click()}
              >
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-aj-success mx-auto" />
                    <p className="font-medium text-aj-success">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 300KB</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center space-x-2 text-aj-danger text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-aj-accent text-white hover:bg-aj-accent/90"
            >
              {uploading ? "Uploading..." : "Submit Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
