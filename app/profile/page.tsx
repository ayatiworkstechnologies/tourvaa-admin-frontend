"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api";
import Loader from "@/components/ui/Loader";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import {
  combinePhone,
  digitsOnly,
  mobileHelp,
  passwordHelp,
  splitPhone,
  validateMobile,
  validatePassword,
} from "@/lib/validators";
import {
  countries,
  getCities,
  getStates,
  phoneCountryCodes,
  phoneCountryCodeValues,
} from "@/lib/location-options";

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

export default function ProfilePage() {
  const { dashboard, loading } = useDashboard();
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!dashboard?.user) return;

      try {
        const response = await api.get("/profile/me");
        setProfile({
          ...emptyProfile,
          ...response.data.data,
        });
        const phoneParts = splitPhone(response.data.data?.phone || "", phoneCountryCodeValues);
        setPhoneCountryCode(phoneParts.countryCode);
        setPhoneNumber(phoneParts.number);
      } catch {
        setProfile({
          ...emptyProfile,
          name: dashboard.user.name,
          email: dashboard.user.email,
        });
      }
    };

    fetchProfile();
  }, [dashboard]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const phone = combinePhone(phoneCountryCode, phoneNumber);

    if (!validateMobile(phone, true)) {
      setError(mobileHelp);
      setSaving(false);
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
      setMessage("Profile updated successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (passwordForm.current_password === passwordForm.new_password) {
      setError("New password must be different from current password.");
      setSaving(false);
      return;
    }

    if (!validatePassword(passwordForm.new_password)) {
      setError(passwordHelp);
      setSaving(false);
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Confirm password must match new password.");
      setSaving(false);
      return;
    }

    try {
      await api.put("/profile/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setMessage("Password updated successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update password."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading profile..." fullScreen />;
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="profile.view">
    <DashboardLayout title="Profile" menus={dashboard.menus} user={dashboard.user}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
          <h2 className="text-2xl font-bold text-[#121826]">Profile Settings</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Update your account information and password.
          </p>
          {message && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveProfile} className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <h3 className="mb-5 text-lg font-bold text-[#121826]">Account</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Name
                </span>
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Email
                </span>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-[#E7EAF0] bg-[#F7F9FC] px-4 py-2.5 text-sm text-[#667085] outline-none"
                  required
                />
                <p className="mt-1 text-xs text-[#98A2B3]">
                  Email cannot be changed from profile.
                </p>
              </label>
              <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    Code
                  </span>
                  <select
                    value={phoneCountryCode}
                    onChange={(event) => setPhoneCountryCode(event.target.value)}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    required
                  >
                    {phoneCountryCodes.map((item, index) => (
                      <option key={`${item.value}-${index}`} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    Mobile Number
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(digitsOnly(event.target.value))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    required
                  />
                  <p className="mt-1 text-xs text-[#98A2B3]">{mobileHelp}</p>
                </label>
              </div>

              <ProfileImageUpload
                value={profile.profile_image}
                onChange={(value) =>
                  setProfile((current) => ({ ...current, profile_image: value }))
                }
              />
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Address
                </span>
                <input
                  value={profile.address}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, address: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    Country
                  </span>
                  <select
                    value={profile.country}
                    onChange={(event) => {
                      const country = event.target.value;
                      setProfile((current) => ({ ...current, country, state: "", city: "" }));
                    }}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    State
                  </span>
                  <select
                    value={profile.state}
                    onChange={(event) => {
                      const state = event.target.value;
                      setProfile((current) => ({ ...current, state, city: "" }));
                    }}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    disabled={!profile.country}
                  >
                    <option value="">Select State</option>
                    {getStates(profile.country).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    City
                  </span>
                  <select
                    value={profile.city}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, city: event.target.value }))
                    }
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    disabled={!profile.state}
                  >
                    <option value="">Select City</option>
                    {getCities(profile.state).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    Pincode
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={profile.pincode}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        pincode: digitsOnly(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  />
                </label>
              </div>
            </div>
            <button
              disabled={saving}
              className="mt-6 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]"
            >
              Save Profile
            </button>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <h3 className="mb-5 text-lg font-bold text-[#121826]">Password</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Current Password
                </span>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        current_password: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-[#43A9F6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#238DD7]"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  New Password
                </span>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        new_password: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-[#43A9F6]"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#238DD7]"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#98A2B3]">{passwordHelp}</p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Confirm New Password
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirm_password: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  minLength={8}
                  required
                />
              </label>
            </div>
            <button
              disabled={saving}
              className="mt-6 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
