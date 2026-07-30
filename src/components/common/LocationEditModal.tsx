"use client";

import { useEffect, useState } from "react";
import { LuX as X } from "react-icons/lu";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type LocationEditModalProps = {
  open: boolean;
  title?: string;
  countryId: number | null;
  cityId: number | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: { country_id: number | null; city_id: number | null }) => void;
};

export default function LocationEditModal({
  open,
  title = "Edit Location",
  countryId,
  cityId,
  saving = false,
  onClose,
  onSave,
}: LocationEditModalProps) {
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  const { countries } = useGeoCountries();
  const { states } = useGeoStates(selectedCountryId ? Number(selectedCountryId) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    selectedCountryId ? Number(selectedCountryId) : null
  );

  useEffect(() => {
    if (!open) return;
    setSelectedCountryId(countryId ? String(countryId) : "");
    setSelectedCityId(cityId ? String(cityId) : "");
    setSelectedStateId("");
  }, [open, countryId, cityId]);

  // No state_id is persisted on suppliers/agents/customers -- derive it from
  // the loaded city once the country's cities (which carry state_id) load.
  useEffect(() => {
    if (!open || selectedStateId || !selectedCityId) return;
    const match = cities.find((c) => String(c.id) === selectedCityId);
    if (match?.state_id) setSelectedStateId(String(match.state_id));
  }, [open, cities, selectedCityId, selectedStateId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-dash-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
          <h2 className="text-base font-bold text-dash-text">{title}</h2>
          <button type="button" title="Close" onClick={onClose} className="rounded-lg p-1.5 hover:bg-dash-bg">
            <X size={18} className="text-dash-muted" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
            <select
              value={selectedCountryId}
              onChange={(e) => {
                setSelectedCountryId(e.target.value);
                setSelectedStateId("");
                setSelectedCityId("");
              }}
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
            >
              <option value="">Select country</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">State</span>
            <select
              value={selectedStateId}
              disabled={!selectedCountryId}
              onChange={(e) => {
                setSelectedStateId(e.target.value);
                setSelectedCityId("");
              }}
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand disabled:bg-dash-bg"
            >
              <option value="">{selectedCountryId ? "Select state" : "Select country first"}</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
            <select
              value={selectedCityId}
              disabled={!selectedCountryId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand disabled:bg-dash-bg"
            >
              <option value="">{selectedCountryId ? "Select city" : "Select country first"}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="flex gap-3 border-t border-dash-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-dash-border py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSave({
                country_id: selectedCountryId ? Number(selectedCountryId) : null,
                city_id: selectedCityId ? Number(selectedCityId) : null,
              })
            }
            className="flex-1 rounded-xl bg-dash-brand py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-all"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
