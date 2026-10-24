"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LuCheck as Check, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import CustomerAvatar from "@/components/customer/CustomerAvatar";
import DatePicker from "@/components/ui/DatePicker";
import CountryPhoneInput from "@/components/ui/CountryPhoneInput";
import { combinePhone, passwordHelp, validateEmail, validateMobile, validatePassword } from "@/lib/utils/validators";
import { PHONE_COUNTRIES, dialCodeForIso, isoForDialCode, validatePhoneForCountry } from "@/lib/utils/phoneCountries";
import type { CountryCode } from "libphonenumber-js/min";

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

const COUNTRIES = PHONE_COUNTRIES.map((country) => country.name);
// Existing profiles may only have a legacy nationality value. Use it to
// prefill the replacement Country field without modifying stored history.
const LEGACY_NATIONALITY_COUNTRIES: Record<string, string> = {
  American: "United States",
  Indian: "India",
  British: "United Kingdom",
  Australian: "Australia",
  Canadian: "Canada",
  German: "Germany",
  French: "France",
  Japanese: "Japan",
  Singaporean: "Singapore",
  Emirati: "United Arab Emirates",
  "New Zealander": "New Zealand",
  Swiss: "Switzerland",
  Italian: "Italy",
  Spanish: "Spain",
};

const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];
const todayIso = new Date().toISOString().slice(0, 10);
const earliestBirthDate = `${new Date().getFullYear() - 120}-01-01`;

function splitStoredPhone(value?: string) {
  if (!value) return { countryIso: "IN" as CountryCode, number: "" };
  const countryIso = isoForDialCode(value);
  const dialCode = dialCodeForIso(countryIso);
  return {
    countryIso,
    number: value.startsWith(dialCode) ? value.slice(dialCode.length) : value.replace(/^\+/, ""),
  };
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, refreshSession, logout } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userParts = (user?.name || "").trim().split(" ");
  const initialFirst = userParts[0] || "";
  const initialLast = userParts.slice(1).join(" ") || "";

  // Form states initialized cleanly from auth session
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(user?.email || "");
  const [phoneCountryIso, setPhoneCountryIso] = useState<CountryCode>(() => splitStoredPhone(user?.phone).countryIso);
  const [phoneNumber, setPhoneNumber] = useState(() => splitStoredPhone(user?.phone).number);
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Passport & Travel Documents
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [frequentFlyer, setFrequentFlyer] = useState("");
  const [preferredAirline, setPreferredAirline] = useState("");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhoneCountryIso, setEmergencyPhoneCountryIso] = useState<CountryCode>("IN");
  const [emergencyPhoneNumber, setEmergencyPhoneNumber] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");

  // Profile Image
  const [profileImage, setProfileImage] = useState<string>(user?.profile_image || "");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const phone = phoneNumber ? combinePhone(dialCodeForIso(phoneCountryIso), phoneNumber) : "";
  const emergencyPhone = emergencyPhoneNumber
    ? combinePhone(dialCodeForIso(emergencyPhoneCountryIso), emergencyPhoneNumber)
    : "";

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
          if (d.phone) {
            const parsedPhone = splitStoredPhone(d.phone);
            setPhoneCountryIso(parsedPhone.countryIso);
            setPhoneNumber(parsedPhone.number);
          }
          if (d.profile_image) setProfileImage(d.profile_image);
          setAddressLine1(d.address_line_1 || d.address || "");
          setAddressLine2(d.address_line_2 || "");
          setState(d.state_name || d.state || "");
          setCity(d.city_name || d.city || "");
          setPostalCode(d.postal_code || d.pincode || "");
          const savedNationality = d.nationality || "";
          const savedCountry = d.country_name || d.country || LEGACY_NATIONALITY_COUNTRIES[savedNationality] || "";
          setCountry(savedCountry);
          if (d.date_of_birth || d.dob) setDob(d.date_of_birth || d.dob);
          if (d.gender) setGender(d.gender);
          if (d.passport_number) setPassportNumber(d.passport_number);
          if (d.passport_expiry) setPassportExpiry(d.passport_expiry);
          if (d.frequent_flyer) setFrequentFlyer(d.frequent_flyer);
          if (d.preferred_airline) setPreferredAirline(d.preferred_airline);
          if (d.emergency_name || d.emergency_contact_name) setEmergencyName(d.emergency_name || d.emergency_contact_name);
          if (d.emergency_relation || d.emergency_contact_relationship) setEmergencyRelation(d.emergency_relation || d.emergency_contact_relationship);
          if (d.emergency_phone || d.emergency_contact_phone) {
            const parsedEmergencyPhone = splitStoredPhone(d.emergency_phone || d.emergency_contact_phone);
            setEmergencyPhoneCountryIso(parsedEmergencyPhone.countryIso);
            setEmergencyPhoneNumber(parsedEmergencyPhone.number);
          }
          if (d.emergency_email || d.emergency_contact_email) setEmergencyEmail(d.emergency_email || d.emergency_contact_email);
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
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Enter your first and last name.");
      return;
    }
    if (!phoneNumber || !validatePhoneForCountry(phoneCountryIso, phoneNumber) || !validateMobile(phone)) {
      toast.error("Select the correct country code and enter a valid mobile number.");
      return;
    }
    if (emergencyPhoneNumber && (!validatePhoneForCountry(emergencyPhoneCountryIso, emergencyPhoneNumber) || !validateMobile(emergencyPhone))) {
      toast.error("Select the correct country code and enter a valid emergency mobile number.");
      return;
    }
    if (emergencyEmail.trim() && !validateEmail(emergencyEmail)) {
      toast.error("Enter a valid emergency email address.");
      return;
    }
    setSaving(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await api.patch("/customers/me", {
        full_name: fullName,
        phone,
        profile_image: profileImage,
        // `address` remains populated for existing portal/API consumers.
        address: addressLine1,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        country,
        state,
        city,
        postal_code: postalCode,
        pincode: postalCode,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        date_of_birth: dob,
        gender,
        frequent_flyer: frequentFlyer,
        preferred_airline: preferredAirline,
        emergency_name: emergencyName,
        emergency_relation: emergencyRelation,
        emergency_phone: emergencyPhone,
        ...(emergencyEmail.trim() ? { emergency_email: emergencyEmail.trim() } : {}),
      });
      await refreshSession();
      toast.success("Profile updated successfully.");
      router.push("/customer/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        toast.error(
          err.response?.data?.message ||
            (Array.isArray(detail) ? detail[0]?.msg : detail) ||
            "Could not save profile.",
        );
      } else {
        toast.error("Could not save profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.current_password === passwordForm.new_password) {
      toast.error("New password must be different from your current password.");
      return;
    }
    if (!validatePassword(passwordForm.new_password)) {
      toast.error(passwordHelp);
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Confirm password must match the new password.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.post("/customer/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Password updated. All devices have been signed out.");
      await logout("/login");
    } catch (err: unknown) {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || "Could not update password."
          : "Could not update password.",
      );
    } finally {
      setSavingPassword(false);
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

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_310px]"
        >
          {/* ── Left Column: Form Sections ── */}
          <div className="space-y-6">
            {/* 1. Personal Information */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-sm font-bold text-[#0B1527]">
                  Personal Information
                </h2>
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
                      placeholder="e.g. Sarah"
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
                      placeholder="e.g. Mitchell"
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
                  <CountryPhoneInput
                    countryIso={phoneCountryIso}
                    number={phoneNumber}
                    onCountryChange={setPhoneCountryIso}
                    onNumberChange={setPhoneNumber}
                    countryLabel="Mobile country"
                    label="Phone Number"
                    helpText="Select country code, then enter the local mobile number."
                  />
                  <DatePicker
                    value={dob}
                    onChange={setDob}
                    minDate={earliestBirthDate}
                    maxDate={todayIso}
                    label="Date of Birth"
                    placeholder="Select date of birth"
                    clearable
                  />
                </div>

                {/* Country & gender */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
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

                {/* Manual home address. A future Places selection can populate
                    these same fields without replacing manual entry. */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address, building or house number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Address Line 2 <span className="normal-case tracking-normal text-slate-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, floor or landmark"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">State / Region</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State or region" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Postal Code</label>
                    <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Passport & Travel Documents */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-sm font-bold text-[#0B1527]">
                  Passport & Travel Documents
                </h2>
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
                      placeholder="e.g. A12345678"
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
                      placeholder="e.g. Mar 2029"
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
                      placeholder="e.g. FF-12345678"
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
                <h2 className="text-sm font-bold text-[#0B1527]">
                  Emergency Contact
                </h2>
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
                      placeholder="e.g. David Mitchell"
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
                      placeholder="e.g. Spouse, Parent, Sibling"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CountryPhoneInput
                    countryIso={emergencyPhoneCountryIso}
                    number={emergencyPhoneNumber}
                    onCountryChange={setEmergencyPhoneCountryIso}
                    onNumberChange={setEmergencyPhoneNumber}
                    countryLabel="Emergency contact country"
                    label="Contact Phone"
                    helpText="Select country code, then enter the local mobile number."
                  />
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={emergencyEmail}
                      onChange={(e) => setEmergencyEmail(e.target.value)}
                      placeholder="e.g. emergency@example.com"
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
              <h3 className="text-xs font-bold text-[#0B1527]">
                Profile Photo
              </h3>

              <div className="my-5 flex justify-center">
                <CustomerAvatar
                  name={`${firstName} ${lastName}`.trim() || user?.name || "Explorer"}
                  src={profileImage}
                  size="xl"
                  showBadge
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl bg-[#0B1527] py-2.5 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C] disabled:opacity-60"
                >
                  {uploadingImage ? "Uploading..." : profileImage ? "Change Photo" : "Upload Photo"}
                </button>
                <p className="text-xs text-slate-500">JPG, PNG, WEBP or AVIF. Maximum 2 MB. Recommended: square image, 400 ? 400 px.</p>
                {Boolean(profileImage) && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Widget 2: Profile Strength */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#0B1527]">
                  Profile Strength
                </h3>
                <span className="text-xs font-bold text-emerald-500">90%</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[90%] rounded-full bg-emerald-500 transition-all duration-500" />
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                Complete your profile to unlock faster bookings and personalized
                tour recommendations.
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

        <form
          onSubmit={handlePasswordChange}
          className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]"
        >
          <h2 className="text-sm font-bold text-[#0B1527]">Account Security</h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Changing your password signs your account out on every device.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Current password</span>
              <input type="password" required autoComplete="current-password" value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((form) => ({ ...form, current_password: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">New password</span>
              <input type="password" required minLength={8} autoComplete="new-password" value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((form) => ({ ...form, new_password: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm password</span>
              <input type="password" required minLength={8} autoComplete="new-password" value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((form) => ({ ...form, confirm_password: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
            </label>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">{passwordHelp}</p>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1527] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#15233C] disabled:opacity-60">
              {savingPassword && <Loader2 size={13} className="animate-spin" />}
              Change Password &amp; Sign Out Everywhere
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
