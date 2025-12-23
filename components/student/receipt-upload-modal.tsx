"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export function ReceiptUploadModal({
  isOpen,
  onClose,
  studentId,
}: ReceiptUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [currentSemester, setCurrentSemester] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFees();
      fetchCurrentSemester();
    }
  }, [isOpen]);

  const fetchCurrentSemester = async () => {
    const { data } = await supabase
      .from("semesters")
      .select("*")
      .eq("is_current", true)
      .single();
    if (data) {
      setCurrentSemester(data);
    }
  };

  const fetchFees = async () => {
    try {
      const { data: feesData, error } = await supabase
        .from("fees")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching fees:", error);
        setError("Failed to load fees");
        return;
      }

      setFees(feesData || []);
    } catch (error) {
      console.error("Error fetching fees:", error);
      setError("Failed to load fees");
    }
  };

  const handleFileSelect = (file: File) => {
    setError("");

    // Check file size (300KB limit)
    if (file.size > 300 * 1024) {
      setError("File size must be less than 300KB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG)");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedFee || !selectedYear || !selectedSemester) {
      setError("Please fill all required fields");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (studentError || !studentData) {
        throw new Error("Could not find student record for authenticated user");
      }

      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(fileExt || "")) {
        throw new Error("Invalid file type. Please use JPG, PNG, or WebP.");
      }

      const fileName = `${
        studentData.id
      }-${selectedFee}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      const selectedFeeData = fees.find((f) => f.id === selectedFee);

      const { error: insertError } = await supabase.from("receipts").insert({
        student_id: studentData.id,
        fee_id: selectedFee,
        imageUrl: urlData.publicUrl,
        file_path: filePath,
        status: "pending",
        amount: selectedFeeData?.amount || 0,
        academic_year: parseInt(selectedYear),
        semester: selectedSemester,
        semester_id: currentSemester?.id,
        // Remove unit_id from insert
      });

      if (insertError) {
        await supabase.storage.from("receipts").remove([filePath]);
        throw new Error(`Database error: ${insertError.message}`);
      }

      onClose();
      setSelectedFile(null);
      setSelectedFee("");
      setSelectedYear("");
      setSelectedSemester("");

      toast.success("Receipt uploaded successfully!", {
        description: "Your receipt has been submitted for verification.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Upload failed. Please try again.");
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
    return (bytes / 1024).toFixed(1) + " KB";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-aj-primary">
            Submit Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fee Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Fee *
            </label>
            <select
              value={selectedFee}
              onChange={(e) => setSelectedFee(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Choose a fee...</option>
              {fees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} - ₦{fee.amount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Academic Year *
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select year...</option>
              {[1, 2, 3, 4, 5, 6].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Semester *</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select semester...</option>
              <option value="first">First Semester</option>
              <option value="second">Second Semester</option>
            </select>
          </div>

          {/* File Upload Area */}
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
                onClick={() =>
                  document.getElementById("receipt-upload")?.click()
                }
              >
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-aj-success mx-auto" />
                    <p className="font-medium text-aj-success">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 300KB
                    </p>
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
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedFile ||
                !selectedFee ||
                !selectedYear ||
                !selectedSemester ||
                uploading
              }
              className="flex-1 bg-aj-accent text-white hover:bg-aj-accent/90"
            >
              {uploading ? "Uploading..." : "Submit Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
