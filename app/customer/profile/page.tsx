"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import PhoneInput from "@/components/ui/PhoneInput";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LocationInput from "@/components/ui/LocationInput";
import {
  combinePhone,
  digitsOnly,
  mobileHelp,
  passwordHelp,
  splitPhone,
  validateMobile,
  validatePassword,
} from "@/lib/validators";
import { phoneCountryCodeValues } from "@/lib/location-options";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  profile_image: "",
  address: "",
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile/me");
        const d = response.data.data;
        setProfile({
          name: d.name || "",
          email: d.email || "",
          phone: d.phone || "",
          profile_image: d.profile_image || "",
          address: d.address || "",
          country: d.country || "",
          state: d.state || "",
          city: d.city || "",
          pincode: d.pincode || "",
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
      await api.put("/profile/me", {
        name: profile.name,
        phone,
        profile_image: profile.profile_image,
        address: profile.address,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        pincode: profile.pincode,
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
      await api.put("/profile/password", {
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

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">My Profile</h1>
        <p className="mt-1 text-sm text-[#667085]">Manage your traveller details, address info, and security credentials.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile/Account Form */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
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

            <LocationInput
              country={profile.country}
              city={profile.city}
              onCountryChange={(country) => setProfile((current) => ({ ...current, country, state: "", city: "" }))}
              onCityChange={(city) => setProfile((current) => ({ ...current, city }))}
              state={profile.state}
              pincode={profile.pincode}
              onStateChange={(state) => setProfile((current) => ({ ...current, state }))}
              onPincodeChange={(pincode) => setProfile((current) => ({ ...current, pincode: digitsOnly(pincode) }))}
              theme="sky"
              required
            />
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={savePassword} className="rounded-2xl border border-[#E7EAF0] bg-white p-6 shadow-sm self-start">
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
