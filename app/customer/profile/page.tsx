"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import PhoneInput from "@/components/ui/PhoneInput";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import {
  combinePhone,
  mobileHelp,
  passwordHelp,
  splitPhone,
  validateMobile,
  validatePassword,
} from "@/lib/validators";
import { phoneCountryCodeValues } from "@/lib/location-options";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  profile_image: "",
  address: "",
  country_id: "",
  state_id: "",
  city_id: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }
  return fallback;
}

export default function CustomerProfilePage() {
  const toast = useToast();
  const { user, refreshSession } = useAuthContext();
  const [profile, setProfile] = useState(emptyProfile);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { countries } = useGeoCountries();
  const { states } = useGeoStates(profile.country_id ? Number(profile.country_id) : null);
  const { cities } = useGeoCities(
    profile.state_id ? Number(profile.state_id) : null,
    profile.country_id ? Number(profile.country_id) : null
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/customers/me");
        const d = response.data.data;
        setProfile({
          name: d.full_name || d.name || "",
          email: d.email || "",
          phone: d.phone || "",
          profile_image: d.profile_image || "",
          address: d.address || d.address_line_1 || "",
          country_id: String(d.country_id || ""),
          state_id: "",
          city_id: String(d.city_id || ""),
          country: d.country_name || d.country || "",
          state: d.state_name || d.state || "",
          city: d.city_name || d.city || "",
          pincode: d.pincode || d.postal_code || "",
        });
        const phoneParts = splitPhone(d.phone || "", phoneCountryCodeValues);
        setPhoneCountryCode(phoneParts.countryCode);
        setPhoneNumber(phoneParts.number);
      } catch {
        if (user) {
          setProfile({
            ...emptyProfile,
            name: user.name,
            email: user.email,
            profile_image: user.profile_image || "",
            country_id: "",
            state_id: "",
            city_id: "",
          });
        }
      }
    };

    fetchProfile();
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);

    const phone = combinePhone(phoneCountryCode, phoneNumber);

    if (!validateMobile(phone, true)) {
      toast.error(mobileHelp);
      setSavingProfile(false);
      return;
    }

    try {
      const selectedCountry = countries.find((country) => String(country.id) === profile.country_id);
      const selectedState = states.find((state) => String(state.id) === profile.state_id);
      const selectedCity = cities.find((city) => String(city.id) === profile.city_id);
      await api.patch("/customers/me", {
        full_name: profile.name,
        phone,
        profile_image: profile.profile_image,
        address: profile.address,
        address_line_1: profile.address,
        country_id: parseInt(profile.country_id) || null,
        city_id: parseInt(profile.city_id) || null,
        country: selectedCountry?.name || profile.country,
        state: selectedState?.name || profile.state,
        city: selectedCity?.name || profile.city,
        pincode: profile.pincode,
        postal_code: profile.pincode,
      });
      await refreshSession();
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);

    if (passwordForm.current_password === passwordForm.new_password) {
      toast.error("New password must be different from current password.");
      setSavingPassword(false);
      return;
    }

    if (!validatePassword(passwordForm.new_password)) {
      toast.error(passwordHelp);
      setSavingPassword(false);
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Confirm password must match new password.");
      setSavingPassword(false);
      return;
    }

    try {
      await api.post("/customer/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password updated successfully.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not update password."));
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 to-sky-700 p-7 text-white shadow-xl shadow-sky-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-xl font-black backdrop-blur-sm ring-4 ring-white/20">
            {profile.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_image} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight md:text-3xl">{profile.name || "My Profile"}</h1>
            <p className="mt-1 text-sm font-medium text-sky-100">{profile.email}</p>
            <p className="mt-2 text-sm text-sky-100">Manage your traveller details, address info, and security credentials.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile/Account Form */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#121826]">Account Details</h3>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#238DD7] disabled:opacity-60 transition-colors"
            >
              {savingProfile ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
              Save Profile
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                required
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Email</span>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-2.5 text-sm text-[#667085] outline-none"
                required
              />
              <p className="mt-1 text-xs text-[#98A2B3]">Email cannot be changed from profile.</p>
            </label>

            <PhoneInput
              countryCode={phoneCountryCode}
              number={phoneNumber}
              onCountryCodeChange={setPhoneCountryCode}
              onNumberChange={setPhoneNumber}
              required
              helpText={mobileHelp}
            />

            <ProfileImageUpload
              value={profile.profile_image}
              onChange={(value) => setProfile((current) => ({ ...current, profile_image: value }))}
            />

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Address</span>
              <input
                value={profile.address}
                onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                required
                placeholder="Home address"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Country</span>
                <select
                  required
                  value={profile.country_id}
                  onChange={(event) => setProfile((current) => ({ ...current, country_id: event.target.value, state_id: "", city_id: "", country: countries.find((country) => String(country.id) === event.target.value)?.name || "", state: "", city: "" }))}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">State</span>
                <select
                  value={profile.state_id}
                  onChange={(event) => setProfile((current) => ({ ...current, state_id: event.target.value, city_id: "", state: states.find((state) => String(state.id) === event.target.value)?.name || "", city: "" }))}
                  disabled={!profile.country_id}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all disabled:bg-[#F7F9FC]"
                >
                  <option value="">{profile.country_id ? "Select state" : "Select country first"}</option>
                  {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">City</span>
                <select
                  required
                  value={profile.city_id}
                  onChange={(event) => setProfile((current) => ({ ...current, city_id: event.target.value, city: cities.find((city) => String(city.id) === event.target.value)?.name || "" }))}
                  disabled={!profile.country_id}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all disabled:bg-[#F7F9FC]"
                >
                  <option value="">{profile.country_id ? "Select city" : "Select country first"}</option>
                  {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Pincode</span>
                <input
                  value={profile.pincode}
                  onChange={(event) => setProfile((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, "") }))}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                  required
                  placeholder="Pincode"
                />
              </label>
            </div>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={savePassword} className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100 self-start">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#121826]">Security & Password</h3>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#238DD7] disabled:opacity-60 transition-colors"
            >
              {savingPassword ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
              Update Password
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Current Password</span>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                  required
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#43A9F6]"
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">New Password</span>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                  minLength={8}
                  required
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#43A9F6]"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#98A2B3]">{passwordHelp}</p>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Confirm New Password</span>
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all"
                minLength={8}
                required
                placeholder="Confirm new password"
              />
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}
