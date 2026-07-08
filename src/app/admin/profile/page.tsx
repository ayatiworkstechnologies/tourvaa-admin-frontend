"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { LuEye as Eye, LuEyeOff as EyeOff } from "react-icons/lu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import PhoneInput from "@/components/ui/PhoneInput";
import LocationInput from "@/components/ui/LocationInput";
import {
  combinePhone,
  digitsOnly,
  mobileHelp,
  passwordHelp,
  splitPhone,
  validateMobile,
  validatePassword,
} from "@/lib/utils/validators";
import {  phoneCountryCodeValues,
} from "@/lib/constants/locationOptions";

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
        <section className="rounded-2xl border border-dash-border bg-white p-6">
          <h2 className="text-2xl font-bold text-dash-text">Profile Settings</h2>
          <p className="mt-1 text-sm text-dash-muted">
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
          <form onSubmit={saveProfile} className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-5 text-lg font-bold text-dash-text">Account</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                  Name
                </span>
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                  Email
                </span>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-muted outline-none"
                  required
                />
                <p className="mt-1 text-xs text-dash-subtle">
                  Email cannot be changed from profile.
                </p>
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
                onChange={(value) =>
                  setProfile((current) => ({ ...current, profile_image: value }))
                }
              />
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                  Address
                </span>
                <input
                  value={profile.address}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, address: event.target.value }))
                  }
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  required
                />
              </label>
              <LocationInput
                country={profile.country}
                city={profile.city}
                onCountryChange={(country) =>
                  setProfile((current) => ({ ...current, country, state: "", city: "" }))
                }
                onCityChange={(city) =>
                  setProfile((current) => ({ ...current, city }))
                }
                state={profile.state}
                pincode={profile.pincode}
                onStateChange={(state) =>
                  setProfile((current) => ({ ...current, state }))
                }
                onPincodeChange={(pincode) =>
                  setProfile((current) => ({ ...current, pincode: digitsOnly(pincode) }))
                }
                theme="sky"
                required
              />
            </div>
            <button
              disabled={saving}
              className="mt-6 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
            >
              Save Profile
            </button>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-5 text-lg font-bold text-dash-text">Password</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
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
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-dash-brand"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-dash-brand-hover"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
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
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-dash-brand"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-dash-brand-hover"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-dash-subtle">{passwordHelp}</p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
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
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  minLength={8}
                  required
                />
              </label>
            </div>
            <button
              disabled={saving}
              className="mt-6 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
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











