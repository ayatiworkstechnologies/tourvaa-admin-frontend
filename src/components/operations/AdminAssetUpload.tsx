"use client";

import { useState } from "react";
import Image from "next/image";
import { LuFileText as FileText, LuLoaderCircle as Loader2, LuTrash2 as Trash2, LuCloudUpload as UploadCloud } from "react-icons/lu";
import api from "@/lib/api/client";
import {
  IMAGE_AND_PDF_ACCEPT,
  IMAGE_AND_PDF_FORMAT_LABEL,
  VIDEO_ACCEPT,
  VIDEO_FORMAT_LABEL,
} from "@/lib/uploads/imageFormats";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "video" accepts MP4/WEBM (up to 50MB) instead of images/PDF (up to 10MB). */
  kind?: "asset" | "video";
};

function isImageUrl(value: string) {
  // Cloudinary delivery URLs always carry the real file extension (it
  // auto-appends the detected format), including for PDFs served under the
  // same /image/upload/ path - so this must stay extension-based rather than
  // matching on the Cloudinary domain, or PDFs would wrongly render as images.
  return /\.(png|jpe?g|webp|avif|gif|svg)(\?.*)?$/i.test(value);
}

function isVideoUrl(value: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(value);
}

export default function AdminAssetUpload({ label, value, onChange, kind = "asset" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const isVideoKind = kind === "video";
  const accept = isVideoKind ? VIDEO_ACCEPT : IMAGE_AND_PDF_ACCEPT;
  const formatLabel = isVideoKind ? VIDEO_FORMAT_LABEL : IMAGE_AND_PDF_FORMAT_LABEL;
  const maxSizeLabel = isVideoKind ? "50MB" : "10MB";

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
    } catch (uploadError: unknown) {
      const detail = (uploadError as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : `Upload failed. Try ${formatLabel} under ${maxSizeLabel}.`);
    } finally {
      setUploading(false);
    }
  };

  const showImagePreview = value && isImageUrl(value);
  const showVideoPreview = value && isVideoUrl(value);

  return (
    <div>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>

      {value ? (
        <div className="relative max-w-xs overflow-hidden rounded-xl border border-dash-border">
          {showImagePreview ? (
            <div className="relative aspect-video w-full bg-[#F0F3F8]">
              <Image src={value} alt={label} fill unoptimized className="object-cover" />
            </div>
          ) : showVideoPreview ? (
            <video src={value} controls muted className="aspect-video w-full bg-black object-contain" />
          ) : (
            <div className="flex items-center gap-2 bg-dash-bg px-4 py-6 text-sm font-semibold text-dash-muted">
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
          className={`flex aspect-video w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
            dragging ? "border-dash-brand bg-[#EDF5FF]" : "border-dash-border bg-dash-bg hover:bg-[#F0F3F8]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-dash-brand-hover" />
              <span className="text-xs font-bold text-dash-muted">Uploading...</span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF5FF] text-dash-brand-hover">
                <UploadCloud size={18} />
              </span>
              <span className="text-xs font-bold text-dash-body">Click to upload or drag & drop</span>
              <span className="text-[11px] text-dash-subtle">{formatLabel} - up to {maxSizeLabel}</span>
            </>
          )}
          <input
            type="file"
            accept={accept}
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
