import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  courseId: string;
  studentId: string;
}

export const generateCertificate = async (data: CertificateData) => {
  const { studentName, courseName, completionDate, courseId, studentId } = data;

  // Create PDF
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Rwanda Flag Colors
  const skyBlue = "#00A1DE";
  const yellow = "#FAD201";
  const green = "#00A651";

  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Border with Rwanda flag colors
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 161, 222); // Sky Blue
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, "S");

  pdf.setLineWidth(1);
  pdf.setDrawColor(250, 210, 1); // Yellow
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24, "S");

  // Top decorative band (Rwanda flag colors)
  const bandY = 25;
  const bandHeight = 8;
  pdf.setFillColor(0, 161, 222); // Sky Blue
  pdf.rect(15, bandY, (pageWidth - 30) / 3, bandHeight, "F");
  pdf.setFillColor(250, 210, 1); // Yellow
  pdf.rect(15 + (pageWidth - 30) / 3, bandY, (pageWidth - 30) / 3, bandHeight, "F");
  pdf.setFillColor(0, 166, 81); // Green
  pdf.rect(15 + (2 * (pageWidth - 30)) / 3, bandY, (pageWidth - 30) / 3, bandHeight, "F");

  // Certificate Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(40);
  pdf.setTextColor(0, 161, 222); // Sky Blue
  pdf.text("CERTIFICATE", pageWidth / 2, 55, { align: "center" });

  pdf.setFontSize(20);
  pdf.setTextColor(80, 80, 80);
  pdf.text("of Course Completion", pageWidth / 2, 68, { align: "center" });

  // Decorative line
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(250, 210, 1); // Yellow
  pdf.line(pageWidth / 2 - 50, 72, pageWidth / 2 + 50, 72);

  // Student Name
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(60, 60, 60);
  pdf.text("This certifies that", pageWidth / 2, 85, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.setTextColor(0, 0, 0);
  pdf.text(studentName, pageWidth / 2, 100, { align: "center" });

  // Course completion text
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(60, 60, 60);
  pdf.text("has successfully completed the course", pageWidth / 2, 115, { align: "center" });

  // Course Name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(0, 166, 81); // Green
  pdf.text(courseName, pageWidth / 2, 130, { align: "center" });

  // Date
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(80, 80, 80);
  const formattedDate = new Date(completionDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.text(`Completion Date: ${formattedDate}`, pageWidth / 2, 145, { align: "center" });

  // Footer
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Rwanda Secondary Education Online Learning Platform", pageWidth / 2, 175, {
    align: "center",
  });

  // Signature line
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(150, 150, 150);
  pdf.line(pageWidth / 2 - 30, 165, pageWidth / 2 + 30, 165);
  pdf.setFontSize(10);
  pdf.text("Authorized Signature", pageWidth / 2, 170, { align: "center" });

  // Convert to blob
  const pdfBlob = pdf.output("blob");
  const fileName = `certificate-${courseName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;

  try {
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(`certificates/${studentId}/${fileName}`, pdfBlob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("content-files")
      .getPublicUrl(`certificates/${studentId}/${fileName}`);

    // Update student_courses with certificate URL
    const { error: updateError } = await supabase
      .from("student_courses")
      .update({ certificate_url: urlData.publicUrl })
      .eq("student_id", studentId)
      .eq("subject_id", courseId);

    if (updateError) throw updateError;

    // Also trigger download
    pdf.save(fileName);

    toast.success("Certificate generated and saved successfully!");
    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    toast.error("Failed to save certificate");
    // Still allow download even if upload fails
    pdf.save(fileName);
    return null;
  }
};
