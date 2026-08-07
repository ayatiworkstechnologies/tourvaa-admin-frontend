"use client";

import { useRef, useState } from "react";
import { LuDownload as Download, LuLoaderCircle as Loader2, LuUpload as UploadIcon } from "react-icons/lu";
import { downloadTourImportTemplate, importToursExcel } from "@/lib/api/services/tourImportExportService";
import { useToast } from "@/hooks/useToast";

const THEME_BUTTON = {
  admin: "border-dash-border text-dash-brand-hover hover:bg-[#E7F5FF]",
  supplier: "border-[#D5E6DB] text-[#527060] hover:bg-[#F0F8F3]",
};

export default function TourExcelImportButton({
  theme = "admin",
  onImported,
  className = "",
}: {
  theme?: "admin" | "supplier";
  onImported?: () => void;
  className?: string;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const buttonCls = `inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${THEME_BUTTON[theme]}`;

  async function downloadTemplate() {
    try {
      await downloadTourImportTemplate();
    } catch {
      toast.error("Could not download the import template.");
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const result = await importToursExcel(file);
      if (result.created > 0) {
        toast.success(`${result.created} tour${result.created === 1 ? "" : "s"} created from the file.`);
      }
      if (result.failed > 0) {
        const firstError = result.results.find((row) => row.status === "error");
        toast.error(
          result.created > 0
            ? `${result.failed} row${result.failed === 1 ? "" : "s"} skipped due to errors.`
            : `Import failed for all rows${firstError ? ` - Row ${firstError.row}: ${firstError.message}` : "."}`
        );
      }
      if (result.created > 0) onImported?.();
    } catch {
      toast.error("Could not import the file. Make sure it matches the downloaded template.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" onClick={() => void downloadTemplate()} className={buttonCls}>
        <Download size={14} /> Download Template
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        aria-label="Upload tours Excel file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className={buttonCls}>
        {uploading ? <Loader2 className="animate-spin" size={14} /> : <UploadIcon size={14} />}
        {uploading ? "Uploading…" : "Upload Excel"}
      </button>
    </div>
  );
}
