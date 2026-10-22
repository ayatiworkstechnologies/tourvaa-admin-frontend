"use client";

import { useState } from "react";
import Image from "next/image";
import { LuCheck as Check, LuCopy as Copy, LuExternalLink as ExternalLink, LuFileText as FileText, LuLoaderCircle as Loader2, LuTrash2 as Trash2, LuCloudUpload as UploadCloud } from "react-icons/lu";
import api from "@/lib/api/client";
import {
  IMAGE_ACCEPT,
  IMAGE_AND_PDF_ACCEPT,
  IMAGE_AND_PDF_FORMAT_LABEL,
  IMAGE_FORMAT_LABEL,
  VIDEO_ACCEPT,
  VIDEO_FORMAT_LABEL,
} from "@/lib/uploads/imageFormats";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "image" restricts the picker to images; "video" accepts MP4/WEBM (up to 50MB). */
  kind?: "asset" | "image" | "video";
  /** Public destination in Cloudinary. Private document endpoints do not use this component. */
  assetScope?: "tour" | "cms";
};

// Admin assets are relayed through the API and Cloudinary before the browser
// receives a response. Images/PDFs may be up to 10MB, so the API client's
// normal 30-second request limit is too short on slower connections.
const ASSET_UPLOAD_TIMEOUT_MS = 180_000;

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

function storedFileName(value: string) {
  try {
    return decodeURIComponent(new URL(value).pathname.split("/").pop() || "Attached file");
  } catch {
    return value.split("/").pop()?.split("?")[0] || "Attached file";
  }
}

export default function AdminAssetUpload({ label, value, onChange, kind = "asset", assetScope = "cms" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isVideoKind = kind === "video";
  const isImageOnly = kind === "image";
  const isPdfLabel = /\bPDF\b/i.test(label);
  const isSupplierItinerary = /itinerary/i.test(label);
  const accept = isVideoKind ? VIDEO_ACCEPT : isImageOnly ? IMAGE_ACCEPT : IMAGE_AND_PDF_ACCEPT;
  const formatLabel = isVideoKind ? VIDEO_FORMAT_LABEL : isImageOnly ? IMAGE_FORMAT_LABEL : IMAGE_AND_PDF_FORMAT_LABEL;
  const maxSizeLabel = isVideoKind ? "50MB" : "10MB";
  const maxBytes = (isVideoKind ? 50 : 10) * 1024 * 1024;
  const guidance = isVideoKind
    ? "Recommended: 1920 x 1080 px (16:9). MP4 or WebM, maximum 50 MB."
    : isPdfLabel
      ? "PDF files: maximum 10 MB."
      : isImageOnly
        ? "Article images: JPG, PNG, WEBP, or AVIF, maximum 10 MB."
        : "Landscape images: recommended 1200 x 675 px (16:9). Images/PDF maximum 10 MB.";

  const upload = async (file: File | null) => {
    if (!file) return;
    if (file.size > maxBytes) {
      setError(`${isVideoKind ? "Video" : "File"} must be ${maxSizeLabel} or smaller.`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scope", assetScope);
      const response = await api.post("/uploads/admin-asset", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: ASSET_UPLOAD_TIMEOUT_MS,
      });
      onChange(response.data.data.url);
    } catch (uploadError: unknown) {
      const detail = (uploadError as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const status = (uploadError as { response?: { status?: number }; code?: string })?.response?.status;
      const code = (uploadError as { code?: string })?.code;
      setError(typeof detail === "string" ? detail : status === 413
        ? "Upload exceeds the server's allowed file size. Contact the site administrator."
        : code === "ECONNABORTED" ? "Upload timed out after three minutes. Check your connection and try again."
        : `Upload failed. Try ${formatLabel} under ${maxSizeLabel}.`);
    } finally {
      setUploading(false);
    }
  };

  const showImagePreview = value && isImageUrl(value);
  const showVideoPreview = value && isVideoUrl(value);
  const isCloudinaryUrl = /^https:\/\/res\.cloudinary\.com\//i.test(value);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("Could not copy the stored file link. Select it below and copy it manually.");
    }
  };

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
            <div className="bg-dash-bg px-4 py-5 text-sm font-semibold text-dash-muted">
              <div className="flex items-center gap-2"><FileText size={16} /> {isSupplierItinerary ? "Itinerary PDF attached" : isPdfLabel ? "PDF attached" : "File attached"}</div>
              <p className="mt-1 truncate text-xs font-medium text-dash-subtle" title={storedFileName(value)}>{storedFileName(value)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-dash-brand-hover underline underline-offset-2 hover:text-dash-brand"
                  title={`Open ${storedFileName(value)}`}
                >
                  <ExternalLink size={13} className="shrink-0" />
                  <span>{isPdfLabel ? "Open PDF" : "Open file"}</span>
                </a>
                {isCloudinaryUrl && (
                  <button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 text-xs font-bold text-dash-brand-hover underline underline-offset-2 hover:text-dash-brand">
                    {copied ? <Check size={13} className="shrink-0" /> : <Copy size={13} className="shrink-0" />}
                    <span>{copied ? "Copied" : "Copy Cloudinary link"}</span>
                  </button>
                )}
              </div>
              {isCloudinaryUrl && (
                <input
                  aria-label="Stored Cloudinary file URL"
                  readOnly
                  value={value}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-3 w-full rounded-md border border-dash-border bg-white px-2 py-1.5 text-[11px] font-medium text-dash-subtle outline-none focus:border-dash-brand"
                />
              )}
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
              <span className="text-[11px] leading-4 text-dash-subtle">{guidance}</span>
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

      {value && <p className="mt-2 text-xs text-dash-subtle">{guidance}</p>}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
