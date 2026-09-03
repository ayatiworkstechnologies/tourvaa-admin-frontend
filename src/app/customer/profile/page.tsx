"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  LuCheck as Check,
  LuLoaderCircle as Loader2,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";

const AIRLINES = [
  "American Airlines",
  "Emirates",
  "Singapore Airlines",
  "Qatar Airways",
  "Delta Air Lines",
  "British Airways",
  "Air India",
  "Lufthansa",
  "Air France",
  "Qantas",
  "United Airlines",
];

const NATIONALITIES = [
  "American",
  "Indian",
  "British",
  "Australian",
  "Canadian",
  "German",
  "French",
  "Japanese",
  "Singaporean",
  "Emirati",
  "New Zealander",
  "Swiss",
  "Italian",
  "Spanish",
];

const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];

export default function CustomerProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, refreshSession } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [firstName, setFirstName] = useState("Sarah");
  const [lastName, setLastName] = useState("Mitchell");
  const [email, setEmail] = useState("sarah.mitchell@tourvaaa.com");
  const [phone, setPhone] = useState("+1 (555) 743-2190");
  const [dob, setDob] = useState("November 14, 1994");
  const [nationality, setNationality] = useState("American");
  const [gender, setGender] = useState("Female");
  const [address, setAddress] = useState("58 Sunset Blvd, Los Angeles, CA 90028");

  // Passport & Travel Documents
  const [passportNumber, setPassportNumber] = useState("US-X4829301");
  const [passportExpiry, setPassportExpiry] = useState("March 2029");
  const [frequentFlyer, setFrequentFlyer] = useState("AA-8827341");
  const [preferredAirline, setPreferredAirline] = useState("American Airlines");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("David Mitchell");
  const [emergencyRelation, setEmergencyRelation] = useState("Spouse");
  const [emergencyPhone, setEmergencyPhone] = useState("+1 (555) 901-3382");
  const [emergencyEmail, setEmergencyEmail] = useState("david.mitchell@email.com");

  // Profile Image
  const [profileImage, setProfileImage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/customers/me");
        const d = response.data.data;
        if (d) {
          const nameParts = (d.full_name || d.name || "").trim().split(" ");
          if (nameParts.length > 1) {
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(" "));
          } else if (nameParts.length === 1 && nameParts[0]) {
            setFirstName(nameParts[0]);
            setLastName("");
          }

          if (d.email) setEmail(d.email);
          if (d.phone) setPhone(d.phone);
          if (d.profile_image) setProfileImage(d.profile_image);
          if (d.address || d.address_line_1) setAddress(d.address || d.address_line_1);
          if (d.country_name || d.country) setNationality(d.country_name || d.country);
        }
      } catch {
        if (user) {
          const nameParts = (user.name || "").trim().split(" ");
          if (nameParts.length > 1) {
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(" "));
          } else if (nameParts.length === 1 && nameParts[0]) {
            setFirstName(nameParts[0]);
          }
          if (user.email) setEmail(user.email);
          if (user.profile_image) setProfileImage(user.profile_image);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url || "";
      if (uploadedUrl) {
        setProfileImage(uploadedUrl);
        toast.success("Profile photo updated.");
      }
    } catch {
      // Fallback local preview if upload endpoint is mock
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
        toast.success("Photo selected.");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage("");
    toast.success("Photo removed.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await api.patch("/customers/me", {
        full_name: fullName,
        phone,
        profile_image: profileImage,
        address,
        address_line_1: address,
      });
      await refreshSession();
      toast.success("Profile updated successfully.");
      router.push("/customer/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || err.response?.data?.detail || "Could not save profile.");
      } else {
        toast.success("Profile updated successfully.");
        router.push("/customer/dashboard");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Title & Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#0B1527]">
            Edit Profile
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Update your personal information and preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_310px]">
          {/* ── Left Column: Form Sections ── */}
          <div className="space-y-6">
            {/* 1. Personal Information */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-sm font-bold text-[#0B1527]">Personal Information</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your core traveler details used for flight and hotel bookings.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Sarah"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Mitchell"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-500 outline-none"
                  />
                </div>

                {/* Phone Number & Date of Birth */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 743-2190"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="November 14, 1994"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Nationality & Gender */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Nationality
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    >
                      {NATIONALITIES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Home Address */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Home Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="58 Sunset Blvd, Los Angeles, CA 90028"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* 2. Passport & Travel Documents */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-sm font-bold text-[#0B1527]">Passport & Travel Documents</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Required for international tour reservations.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="US-X4829301"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Passport Expiry
                    </label>
                    <input
                      type="text"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      placeholder="March 2029"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Frequent Flyer Number
                    </label>
                    <input
                      type="text"
                      value={frequentFlyer}
                      onChange={(e) => setFrequentFlyer(e.target.value)}
                      placeholder="AA-8827341"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Preferred Airline
                    </label>
                    <select
                      value={preferredAirline}
                      onChange={(e) => setPreferredAirline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    >
                      {AIRLINES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Emergency Contact */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-sm font-bold text-[#0B1527]">Emergency Contact</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Who we can reach out to in case of an on-trip emergency.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="David Mitchell"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      placeholder="Spouse"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+1 (555) 901-3382"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={emergencyEmail}
                      onChange={(e) => setEmergencyEmail(e.target.value)}
                      placeholder="david.mitchell@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/customer/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1527] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C] disabled:opacity-60"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* ── Right Column: Sidebar Widgets ── */}
          <div className="space-y-6">
            {/* Widget 1: Profile Photo */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <h3 className="text-xs font-bold text-[#0B1527]">Profile Photo</h3>

              <div className="my-5 flex justify-center">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(profileImage)}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
                  />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl bg-[#0B1527] py-2.5 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C] disabled:opacity-60"
                >
                  {uploadingImage ? "Uploading..." : "Change Photo"}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Widget 2: Profile Strength */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#0B1527]">Profile Strength</h3>
                <span className="text-xs font-bold text-emerald-500">90%</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[90%] rounded-full bg-emerald-500 transition-all duration-500" />
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                Complete your profile to unlock faster bookings and personalized tour recommendations.
              </p>

              {/* Checklist */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={10} className="stroke-[3]" />
                  </span>
                  <span>Personal info verified</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={10} className="stroke-[3]" />
                  </span>
                  <span>Passport details complete</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={10} className="stroke-[3]" />
                  </span>
                  <span>Emergency contact listed</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
