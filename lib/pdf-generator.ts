import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { ClearanceUnit } from "@/types";

interface StudentData {
  name: string;
  trackNo: string;
  department?: string;
  role: string;
}

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateClearanceSlip = async (
  student: StudentData,
  clearanceUnits: ClearanceUnit[]
) => {
  const doc = new jsPDF();

  // --- Header Section ---
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2 + 10;
  const margin = 20;

  // 1. Logo
  try {
    const logoBase64 = await getBase64ImageFromUrl("/aju-logo.png");
    doc.addImage(logoBase64, "PNG", centerX - 50, 13, 18, 18);
  } catch (error) {
    console.error("Error loading logo:", error);
  }

  const textStartX = centerX; // Centered text
  let currentY = 20;

  // 2. "Arthur Jarvis"
  doc.setFont("Times New Roman", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 35, 126); // aj-primary #1a237e
  const ajText = "ARTHUR JARVIS";
  const ajWidth = doc.getTextWidth(ajText);
  doc.text(ajText, textStartX, currentY, { align: "center" });

  // 3. "University" (Stretched to match Arthur Jarvis width)
  currentY += 6;
  doc.setFontSize(16); // Slightly smaller font
  const uniText = "UNIVERSITY";
  const uniWidth = doc.getTextWidth(uniText);
  const charSpace = (ajWidth - uniWidth) / (uniText.length - 1);

  doc.text(uniText, textStartX / 1.12, currentY, {
    align: "center",
    charSpace: charSpace,
  });

  // 4. Horizontal Line (aj-accent #ffa200)
  currentY += 3;
  doc.setDrawColor(255, 162, 0); // #ffa200
  doc.setLineWidth(0.3);
  // Calculate start X based on center alignment
  const lineStartX = textStartX - ajWidth / 2;
  doc.line(lineStartX, currentY, lineStartX + ajWidth, currentY);

  // 5. Motto: "Onion ye Ifiok"
  currentY += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Onion ye Ifiok", textStartX, currentY, { align: "center" });

  // --- Student Details ---
  currentY += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const leftColumnX = margin;
  const rightColumnX = pageWidth - margin - 60; // Space for date

  doc.text(`Name: ${student.name.toUpperCase()}`, leftColumnX, currentY);
  doc.text(`Track No: ${student.trackNo}`, leftColumnX, currentY + 7);
  if (student.department) {
    doc.text(`Department: ${student.department}`, leftColumnX, currentY + 14);
  }

  doc.setFontSize(10);
  doc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    pageWidth - margin,
    currentY,
    { align: "right" }
  );

  // --- Clearance Status Table ---
  const tableColumn = ["Unit / Department", "Status", "Date Cleared"];
  const tableRows = clearanceUnits.map((unit) => [
    unit.name,
    "CLEARED", // Force "CLEARED" as per requirement for the slip
    new Date().toLocaleDateString(), // Mock date
  ]);

  autoTable(doc, {
    startY: currentY + 25,
    head: [tableColumn],
    body: tableRows,
    theme: "plain", // Transparent header
    headStyles: {
      fillColor: false, // Transparent
      textColor: [0, 0, 0], // Black text
      fontStyle: "bold",
      lineWidth: 0.1, // Border width
      lineColor: [0, 0, 0], // Black border
    },
    bodyStyles: {
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      1: { textColor: [22, 163, 74] }, // Green "CLEARED" text
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // --- Footer & QR Code ---
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Generate QR Code
  try {
    const qrData = JSON.stringify({
      student: student.name,
      trackNo: student.trackNo,
      status: "CLEARED",
      date: new Date().toISOString(),
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Add QR Code
    doc.addImage(
      qrCodeDataUrl,
      "PNG",
      pageWidth - margin - 30,
      finalY + 10,
      30,
      30
    );
  } catch (err) {
    console.error("Error generating QR code:", err);
  }

  // Save the PDF
  doc.save(`Clearance_Slip_${student.trackNo}.pdf`);
};
