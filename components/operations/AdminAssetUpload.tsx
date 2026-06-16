"use client";

import { Upload } from "lucide-react";
import api from "@/lib/api";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function AdminAssetUpload({ label, value, onChange }: Props) {
  const upload = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await api.post("/uploads/admin-asset", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    onChange(response.data.data.path);
  };

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
      <div className="flex flex-col gap-2 rounded-xl border border-[#E7EAF0] p-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7F5FF] text-[#238DD7]">
            <Upload size={17} />
          </span>
          <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => void upload(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-sm text-[#667085]" />
        </div>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/storage/uploads/admin-assets/..." className="w-full rounded-lg border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6]" />
      </div>
    </label>
  );
}
