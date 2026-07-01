"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import api from "@/lib/api";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function isImageUrl(value: string) {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value) || value.startsWith("https://ik.imagekit.io/");
}

export default function AdminAssetUpload({ label, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await api.post("/uploads/admin-asset", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(response.data.data.url);
    } catch {
      setError("Upload failed. Try a JPG, PNG, WEBP, or PDF under 10MB.");
    } finally {
      setUploading(false);
    }
  };

  const showPreview = value && isImageUrl(value);

  return (
    <div>
      <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[#E7EAF0]">
          {showPreview ? (
            <div className="relative aspect-video w-full bg-[#F0F3F8]">
              <Image src={value} alt={label} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#F7F9FC] px-4 py-6 text-sm font-semibold text-[#667085]">
              <FileText size={16} /> File attached
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-black/80"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files?.[0] || null);
          }}
          className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
            dragging ? "border-[#43A9F6] bg-[#EDF5FF]" : "border-[#E7EAF0] bg-[#F7F9FC] hover:bg-[#F0F3F8]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-[#2F9FE9]" />
              <span className="text-xs font-bold text-[#667085]">Uploading…</span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF5FF] text-[#2F9FE9]">
                <UploadCloud size={18} />
              </span>
              <span className="text-xs font-bold text-[#344054]">Click to upload or drag & drop</span>
              <span className="text-[11px] text-[#98A2B3]">JPG, PNG, WEBP, or PDF · up to 10MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(event) => void upload(event.target.files?.[0] || null)}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
