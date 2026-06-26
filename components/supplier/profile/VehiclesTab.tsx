"use client";

import { useEffect, useRef, useState } from "react";
import { Bus, CheckCircle2, ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/media-url";

type Vehicle = {
  id: number;
  make: string;
  model: string;
  vehicle_type: string;
  registration_number: string;
  year: number | null;
  capacity: number | null;
  fitness_certificate: string;
  insurance_document: string;
  vehicle_photos: string[];
  approval_status: string;
};

const VEHICLE_TYPES = [
  "sedan", "suv", "van", "minibus", "bus", "luxury", "4wd", "yacht", "speedboat", "other",
];

const emptyForm = {
  make: "",
  model: "",
  vehicle_type: "",
  registration_number: "",
  year: "",
  capacity: "",
};

function apiErr(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    return d?.message || d?.detail || fallback;
  }
  return fallback;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${map[status] ?? "bg-[#F2F4F7] text-[#667085]"}`}>
      {status}
    </span>
  );
}

export default function VehiclesTab() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // File upload state per vehicle
  const fitnessRef = useRef<HTMLInputElement | null>(null);
  const insuranceRef = useRef<HTMLInputElement | null>(null);
  const photosRef = useRef<HTMLInputElement | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/suppliers/me/vehicles");
      setVehicles(res.data?.data ?? []);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  function openNew() {
    setForm(emptyForm);
    setExpandedId("new");
    setActiveVehicleId(null);
  }

  function openEdit(v: Vehicle) {
    setForm({
      make: v.make,
      model: v.model,
      vehicle_type: v.vehicle_type,
      registration_number: v.registration_number,
      year: v.year != null ? String(v.year) : "",
      capacity: v.capacity != null ? String(v.capacity) : "",
    });
    setExpandedId(v.id);
    setActiveVehicleId(v.id);
  }

  function cancelEdit() {
    setExpandedId(null);
    setActiveVehicleId(null);
    setForm(emptyForm);
  }

  async function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.make.trim()) { toast.error("Make is required."); return; }
    setSaving(true);
    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      vehicle_type: form.vehicle_type,
      registration_number: form.registration_number.trim(),
      year: form.year ? parseInt(form.year) : null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    };
    try {
      if (expandedId === "new") {
        await api.post("/suppliers/me/vehicles", payload);
        toast.success("Vehicle added.");
      } else {
        await api.patch(`/suppliers/me/vehicles/${expandedId}`, payload);
        toast.success("Vehicle updated.");
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(apiErr(err, "Could not save vehicle."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle(id: number) {
    setDeleting(id);
    try {
      await api.delete(`/suppliers/me/vehicles/${id}`);
      toast.success("Vehicle removed.");
      await load();
      if (expandedId === id) cancelEdit();
    } catch (err) {
      toast.error(apiErr(err, "Could not delete vehicle."));
    } finally {
      setDeleting(null);
    }
  }

  async function uploadDoc(vehicleId: number, field: "fitness_certificate" | "insurance_document", file: File) {
    setUploadingField(field);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/suppliers/me/vehicles/${vehicleId}/upload/${field}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded.");
      await load();
    } catch (err) {
      toast.error(apiErr(err, "Upload failed."));
    } finally {
      setUploadingField(null);
    }
  }

  async function uploadPhotos(vehicleId: number, files: FileList) {
    setUploadingField("photos");
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append("files", f));
    try {
      await api.post(`/suppliers/me/vehicles/${vehicleId}/photos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photos uploaded.");
      await load();
    } catch (err) {
      toast.error(apiErr(err, "Upload failed."));
    } finally {
      setUploadingField(null);
    }
  }

  async function removePhoto(vehicleId: number, url: string) {
    try {
      await api.delete(`/suppliers/me/vehicles/${vehicleId}/photos`, { params: { photo_url: url } });
      await load();
    } catch (err) {
      toast.error(apiErr(err, "Could not remove photo."));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#121826]">My Vehicles</h3>
          <p className="text-sm text-[#667085]">Add and manage vehicles available for your tours.</p>
        </div>
        <button onClick={openNew} disabled={expandedId === "new"}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Add new vehicle form */}
      {expandedId === "new" && (
        <VehicleForm form={form} set={set} onSave={saveVehicle} onCancel={cancelEdit} saving={saving} isNew />
      )}

      {/* Vehicle list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : vehicles.length === 0 && expandedId !== "new" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7EAF0] bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Bus size={26} className="text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#121826]">No vehicles yet</p>
          <p className="mt-1 text-xs text-[#667085]">Click "Add Vehicle" to register your first vehicle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="rounded-2xl border border-[#E7EAF0] bg-white shadow-sm overflow-hidden">
              {/* Vehicle header row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Bus size={20} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#121826]">
                    {[v.make, v.model].filter(Boolean).join(" ")}
                    {v.year ? ` (${v.year})` : ""}
                  </p>
                  <p className="text-xs text-[#667085]">
                    {[
                      v.vehicle_type && v.vehicle_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                      v.capacity ? `${v.capacity} seats` : null,
                      v.registration_number || null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.approval_status} />
                  <button onClick={() => expandedId === v.id ? cancelEdit() : openEdit(v)}
                    className="rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-xs font-bold text-[#667085] hover:border-emerald-300 hover:text-emerald-700 transition-colors">
                    {expandedId === v.id ? "Close" : "Edit"}
                  </button>
                  <button onClick={() => deleteVehicle(v.id)} disabled={deleting === v.id}
                    className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40 transition-colors">
                    {deleting === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded edit area */}
              {expandedId === v.id && (
                <div className="border-t border-[#E7EAF0] bg-[#FAFBFC] p-5 space-y-5">
                  {/* Edit form */}
                  <VehicleForm form={form} set={set} onSave={saveVehicle} onCancel={cancelEdit} saving={saving} isNew={false} />

                  {/* Documents */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Fitness Certificate */}
                    <DocUploadCard
                      label="Fitness Certificate"
                      currentUrl={v.fitness_certificate}
                      uploading={uploadingField === "fitness_certificate"}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onFile={file => uploadDoc(v.id, "fitness_certificate", file)}
                    />
                    {/* Insurance Document */}
                    <DocUploadCard
                      label="Insurance Document"
                      currentUrl={v.insurance_document}
                      uploading={uploadingField === "insurance_document"}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onFile={file => uploadDoc(v.id, "insurance_document", file)}
                    />
                    {/* Vehicle Photos */}
                    <div className="rounded-xl border border-[#E7EAF0] bg-white p-4">
                      <p className="mb-2 text-xs font-bold uppercase text-[#667085]">Vehicle Photos</p>
                      {v.vehicle_photos.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {v.vehicle_photos.map((url, i) => (
                            <div key={i} className="relative">
                              <img src={mediaUrl(url)} alt={`photo-${i}`} className="h-14 w-14 rounded-lg object-cover border border-[#E7EAF0]" />
                              <button type="button" onClick={() => removePhoto(v.id, url)}
                                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                                <X size={9} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" multiple className="hidden"
                          aria-label="Upload vehicle photos"
                          disabled={uploadingField === "photos"}
                          onChange={e => { if (e.target.files?.length) void uploadPhotos(v.id, e.target.files); }} />
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                          {uploadingField === "photos" ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          Add Photos
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type FormFields = typeof emptyForm;

function VehicleForm({
  form, set, onSave, onCancel, saving, isNew,
}: {
  form: FormFields;
  set: (k: keyof FormFields, v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  return (
    <form onSubmit={onSave} className="rounded-2xl border border-[#E7EAF0] bg-white p-5">
      <p className="mb-4 text-sm font-bold text-[#121826]">{isNew ? "New Vehicle" : "Edit Vehicle Info"}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Make <span className="text-red-500">*</span></span>
          <input required value={form.make} onChange={e => set("make", e.target.value)}
            placeholder="e.g. Toyota"
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Model</span>
          <input value={form.model} onChange={e => set("model", e.target.value)}
            placeholder="e.g. Hiace"
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Vehicle Type</span>
          <select value={form.vehicle_type} onChange={e => set("vehicle_type", e.target.value)}
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500">
            <option value="">Select type</option>
            {VEHICLE_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("wd", "WD")}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Registration Number</span>
          <input value={form.registration_number} onChange={e => set("registration_number", e.target.value)}
            placeholder="e.g. DXB-12345"
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Year</span>
          <input type="number" min="1900" max={new Date().getFullYear() + 1} value={form.year} onChange={e => set("year", e.target.value)}
            placeholder="e.g. 2022"
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Seating Capacity</span>
          <input type="number" min="1" value={form.capacity} onChange={e => set("capacity", e.target.value)}
            placeholder="e.g. 14"
            className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {isNew ? "Add Vehicle" : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function DocUploadCard({
  label, currentUrl, uploading, accept, onFile,
}: {
  label: string;
  currentUrl: string;
  uploading: boolean;
  accept: string;
  onFile: (f: File) => void;
}) {
  return (
    <div className="rounded-xl border border-[#E7EAF0] bg-white p-4">
      <p className="mb-2 text-xs font-bold uppercase text-[#667085]">{label}</p>
      {currentUrl ? (
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-xs text-[#667085] truncate">Uploaded</span>
        </div>
      ) : (
        <p className="mb-2 text-xs text-[#98A2B3]">Not uploaded yet</p>
      )}
      <label className="cursor-pointer">
        <input type="file" accept={accept} className="hidden" aria-label={`Upload ${label}`}
          disabled={uploading}
          onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {currentUrl ? "Replace" : "Upload"}
        </span>
      </label>
    </div>
  );
}
