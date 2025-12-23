"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Ghost, PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function NewSemesterDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("");

  const handleStartNewSemester = async () => {
    if (!session || !semester) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("start_new_semester", {
        new_session: session,
        new_semester: semester,
      });

      if (error) throw error;

      alert(
        "New semester started successfully! All clearance statuses have been reset."
      );
      setOpen(false);
      setSession("");
      setSemester("");
      window.location.reload(); // Refresh to update data
    } catch (error: any) {
      console.error("Error starting new semester:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-aj-primary border-aj-white text-white hover:bg-aj-white/20 hover:text-white focus-visible:ring-aj-accent"
          variant={"outline"}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Start New Semester
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-aj-primary" />
            Start New Semester
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Session</label>
            <Input
              placeholder="e.g. 2023/2024"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Semester</label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First">First Semester</SelectItem>
                <SelectItem value="Second">Second Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> Starting a new semester will reset all
              student clearance statuses to "Submit Receipt". This action cannot
              be undone.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStartNewSemester}
            disabled={isSubmitting}
            className="bg-aj-primary text-white hover:text-white hover:bg-aj-primary/90"
          >
            {isSubmitting ? "Processing..." : "Confirm & Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
