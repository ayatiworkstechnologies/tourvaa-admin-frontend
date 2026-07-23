"use client";

import { ChangeEvent, useState } from "react";
import axios from "axios";
import { LuImageUp as ImageUp, LuLoaderCircle as Loader2, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { IMAGE_ACCEPT, IMAGE_FORMAT_LABEL } from "@/lib/uploads/imageFormats";

type ProfileImageUploadProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Could not upload image.";
  }

  return "Could not upload image.";
}

export default function ProfileImageUpload({
  value,
  onChange,
  label = "Profile Image",
  required = false,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    setUploading(true);

    try {
      const response = await api.post("/uploads/profile-image", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreviewFailed(false);
      onChange(response.data.data.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <X size={13} />
            Remove
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E6E8F0] bg-dash-bg">
          {value && !previewFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(value)}
              alt="Profile preview"
              className="h-full w-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <ImageUp size={24} className="text-gray-400" />
          )}
        </div>

        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-dash-brand px-4 py-2.5 text-sm font-bold text-dash-brand-hover hover:bg-sky-50">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
          {uploading ? "Uploading..." : "Upload Image"}
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={upload}
            className="sr-only"
            disabled={uploading}
            required={required && !value}
          />
        </label>
      </div>

      <p className="text-xs text-dash-muted">{IMAGE_FORMAT_LABEL}. Maximum 2MB.</p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
