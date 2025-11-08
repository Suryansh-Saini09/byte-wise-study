import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileUploadCardProps {
  userId: string;
}

const FileUploadCard = ({ userId }: FileUploadCardProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      let content = "";
      const fileType = file.type;

      if (fileType === "application/pdf") {
        content = await extractTextFromPDF(file);
      } else if (fileType === "text/plain") {
        content = await file.text();
      } else {
        throw new Error("Unsupported file type. Please upload PDF or TXT files.");
      }

      const { error } = await supabase.from("notes").insert({
        user_id: userId,
        title: file.name,
        content,
        file_type: fileType,
        file_size: file.size,
      });

      if (error) throw error;

      // Store in localStorage for offline access
      const offlineNotes = JSON.parse(localStorage.getItem("offlineNotes") || "[]");
      offlineNotes.push({
        id: Date.now().toString(),
        title: file.name,
        content,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("offlineNotes", JSON.stringify(offlineNotes));

      toast.success("Note uploaded successfully!");
      window.location.reload();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Notes
        </CardTitle>
        <CardDescription>Upload PDF or TXT files to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <FileText className="w-12 h-12 text-primary" />
              )}
              <div>
                <p className="font-medium mb-1">
                  {uploading ? "Uploading..." : "Click to upload"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF and TXT files
                </p>
              </div>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadCard;