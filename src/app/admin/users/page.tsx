"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuSquarePen as Edit, LuMail as Mail, LuPlus as Plus, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { User, UserFormData } from "@/types/user";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import PhoneInput from "@/components/ui/PhoneInput";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  combinePhone,
  digitsOnly,
  mobileHelp,
  splitPhone,
  validateMobile,
} from "@/lib/utils/validators";
import { phoneCountryCodeValues } from "@/lib/constants/locationOptions";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { getFieldErrors } from "@/lib/utils/errorHandler";

function fieldInputClass(hasError: boolean) {
  return `w-full rounded-md border px-4 py-2.5 text-sm outline-none ${
    hasError ? "border-red-400 focus:border-red-400" : "border-[#E6E8F0] focus:border-dash-brand"
  }`;
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  phone: "",
  profile_image: "",
  address: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  password: "",
  role_id: "",
  is_active: true,
};

export default function UsersPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const pagination = usePagination(10);
  const [accountStatusFilter, setAccountStatusFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const { setTotal, setTotalPages } = pagination;
  const toast = useToast();
  const canLoadProtectedData = Boolean(dashboard);
  const {
    users,
    total,
    totalPages: backendTotalPages,
    loading,
    saving,
    createUser,
    updateUser,
    deleteUser,
    sendPasswordReset,
  } =
    useUsers({
      enabled: canLoadProtectedData,
      page: pagination.page,
      limit: pagination.limit,
      search: pagination.debouncedSearch,
      accountStatus: accountStatusFilter,
      userType: userTypeFilter,
    });
  const { roles } = useRoles({ enabled: canLoadProtectedData });

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { countries } = useGeoCountries();
  const countryId = useMemo(
    () => countries.find((country) => country.name === form.country)?.id ?? null,
    [countries, form.country]
  );
  const { states } = useGeoStates(countryId);
  const stateId = useMemo(
    () => states.find((state) => state.name === form.state)?.id ?? null,
    [states, form.state]
  );
  const { cities } = useGeoCities(stateId);

  useEffect(() => {
    setTotal(total);
    setTotalPages(backendTotalPages);
  }, [backendTotalPages, setTotal, setTotalPages, total]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setConfirmPassword("");
    setPhoneCountryCode("+91");
    setPhoneNumber("");
    setMessage("");
    setFieldErrors({});
    setOpen(true);
  };

  const openEdit = (user: User) => {
    const phoneParts = splitPhone(user.phone || "", phoneCountryCodeValues);
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      profile_image: user.profile_image || "",
      address: user.address || "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      pincode: user.pincode || "",
      role_id: user.role_id || "",
      is_active: user.is_active,
      approval_status: user.approval_status,
    });
    setPhoneCountryCode(phoneParts.countryCode);
    setPhoneNumber(phoneParts.number);
    setMessage("");
    setFieldErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setConfirmPassword("");
    setPhoneCountryCode("+91");
    setPhoneNumber("");
  };

  const updateForm = (
    key: keyof UserFormData,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    let result: { success: boolean; error?: unknown };
    const phone = phoneNumber ? combinePhone(phoneCountryCode, phoneNumber) : "";

    if (!validateMobile(phone)) {
      setFieldErrors({ phone: mobileHelp });
      setMessage(mobileHelp);
      return;
    }

    if (editingUser) {
      result = await updateUser(editingUser.id, { ...form, phone });
    } else {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password || "")) {
        const passwordMessage = "Password must include uppercase, lowercase, number, and special character.";
        setFieldErrors({ password: passwordMessage });
        setMessage(passwordMessage);
        return;
      }
      if (form.password !== confirmPassword) {
        setFieldErrors({ confirm_password: "Passwords do not match." });
        setMessage("Passwords do not match.");
        return;
      }
      result = await createUser({ ...form, phone });
    }

    if (result.success) {
      toast.success(editingUser ? "User updated successfully." : "User created successfully.");
      closeModal();
    } else {
      const errors = getFieldErrors(result.error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setMessage("Please fix the highlighted fields.");
      } else {
        setMessage("Something went wrong. Please check the form.");
      }
    }
  };

  if (dashboardLoading || loading) {
    return <Loader label="Loading users..." fullScreen />;
  }

  if (!dashboard) return null;

  const pendingUsers = users.filter(
    (user) => user.account_status === "PENDING_ADMIN_VERIFICATION"
  );
  const pageSize = pagination.limit;
  const totalPages = pagination.totalPages;
  const paginatedUsers = users;

  const resolveRoleName = (user: User) =>
    user.role?.name ||
    roles.find((role) => role.id === user.role_id)?.name ||
    "No Role";

  const approvalClass = (status: User["approval_status"]) => {
    if (status === "approved") return "bg-emerald-50 text-emerald-600";
    if (status === "rejected") return "bg-red-50 text-red-600";
    return "bg-amber-50 text-amber-700";
  };

  const handleSendReset = async (userId: number) => {
    const sent = await sendPasswordReset(userId);
    setMessage(sent ? "Password reset email sent." : "Could not send reset email.");
    if (sent) toast.success("Password reset email sent.");
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_, index) => (pagination.page - 1) * pageSize + index + 1,
    },
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(user.profile_image)}
              alt={user.name}
              className="h-9 w-9 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D7E8F5] font-semibold text-dash-brand">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-dash-text">{user.name}</p>
            <p className="text-xs text-gray-400">ID: {user.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <span className="text-gray-600">{user.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {resolveRoleName(user)}
        </span>
      ),
    },
    {
      key: "approval",
      header: "Account status",
      render: (user) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${approvalClass(
            user.account_status === "ACTIVE" ? "approved" : user.account_status === "INACTIVE" ? "rejected" : "pending"
          )}`}
        >
          {(user.account_status || user.approval_status).replaceAll("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.is_active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout title="Users" menus={dashboard.menus} user={dashboard.user}>
      <div className="space-y-6">
      <section className="rounded-2xl border border-dash-border bg-white p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-dash-text">
              Users Management
            </h2>
            <p className="mt-1 text-sm leading-6 text-dash-muted">
              Approve new registrations, assign roles, and control dynamic
              permission access.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-dash-brand-hover"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-dash-bg p-4">
            <p className="text-sm font-semibold text-dash-muted">Total users</p>
            <p className="mt-2 text-3xl font-bold text-dash-text">
              {users.length}
            </p>
          </div>
          <div className="rounded-2xl bg-dash-bg p-4">
            <p className="text-sm font-semibold text-dash-muted">
              Pending approval
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingUsers.length}
            </p>
          </div>
          <div className="rounded-2xl bg-dash-bg p-4">
            <p className="text-sm font-semibold text-dash-muted">Active users</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {users.filter((user) => user.is_active).length}
            </p>
          </div>
        </div>

        {message && (
          <p
            className={`mt-5 rounded-xl px-4 py-3 text-sm ${
              message.includes("Could not")
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </p>
        )}
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["", "All Users"],
              ["PENDING_ADMIN_VERIFICATION", "Pending Verification"],
              ["ACTIVE", "Active Users"],
              ["INACTIVE", "Inactive Users"],
            ].map(([value, label]) => <button key={label} type="button" onClick={() => { setAccountStatusFilter(value); pagination.setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${accountStatusFilter === value ? "bg-dash-brand text-white" : "bg-dash-bg text-dash-muted"}`}>{label}</button>)}
            <span className="mx-1 hidden h-8 w-px bg-dash-border sm:block" />
            {[
              ["CUSTOMER", "Customers"],
              ["AGENT", "Travel Agents"],
              ["SUPPLIER", "Suppliers"],
            ].map(([value, label]) => <button key={label} type="button" onClick={() => { setUserTypeFilter(userTypeFilter === value ? "" : value); pagination.setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${userTypeFilter === value ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>{label}</button>)}
          </div>
          <DataTable
            ariaLabel="All users table"
            columns={columns}
            rows={paginatedUsers}
            loading={loading}
            page={pagination.page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            search={pagination.search}
            onSearchChange={pagination.setSearch}
            onPageChange={pagination.setPage}
            emptyTitle="No users found"
            emptyDescription="There are currently no approved or rejected users."
            actions={(user) => (
              <div className="flex justify-end gap-2">
                <Link href={`/admin/users/${user.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-dash-border px-3 text-xs font-bold text-blue-600 hover:bg-blue-50">View</Link>
                <button
                  disabled={saving}
                  onClick={() => handleSendReset(user.id)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-gray-500 hover:bg-sky-50 hover:text-dash-brand-hover"
                  aria-label={`Send password reset email to ${user.name}`}
                  title="Send password reset email"
                >
                  <Mail size={15} />
                </button>
                <button
                  onClick={() => openEdit(user)}
                  aria-label={`Edit ${user.name}`}
                  title={`Edit ${user.name}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit size={15} />
                </button>

                <button
                  onClick={() => deleteUser(user.id)}
                  aria-label={`Delete ${user.name}`}
                  title={`Delete ${user.name}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          />
        </div>
      </section>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1F1B2D]">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>

              <button
                onClick={closeModal}
                aria-label="Close dialog"
                title="Close dialog"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {!editingUser ? (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Name</span>
                    <input
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Full name"
                      className={fieldInputClass(Boolean(fieldErrors.name))}
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "user-name-error" : undefined}
                    />
                    {fieldErrors.name && (
                      <p id="user-name-error" className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="user@example.com"
                      className={fieldInputClass(Boolean(fieldErrors.email))}
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "user-email-error" : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="user-email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Password</span>
                    <input
                      type="password"
                      value={form.password || ""}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className={fieldInputClass(Boolean(fieldErrors.password))}
                      required
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "user-password-error" : undefined}
                    />
                    {fieldErrors.password && (
                      <p id="user-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Confirm Password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={fieldInputClass(Boolean(fieldErrors.confirm_password))}
                      required
                      aria-invalid={Boolean(fieldErrors.confirm_password)}
                      aria-describedby={fieldErrors.confirm_password ? "user-confirm-password-error" : undefined}
                    />
                    {fieldErrors.confirm_password && (
                      <p id="user-confirm-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.confirm_password}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Role</span>
                    <select
                      value={form.role_id}
                      onChange={(e) => updateForm("role_id", e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Name</span>
                    <input
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      className={fieldInputClass(Boolean(fieldErrors.name))}
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "user-name-error-edit" : undefined}
                    />
                    {fieldErrors.name && (
                      <p id="user-name-error-edit" className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      className={fieldInputClass(Boolean(fieldErrors.email))}
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "user-email-error-edit" : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="user-email-error-edit" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                    )}
                  </label>
                  <PhoneInput
                    countryCode={phoneCountryCode}
                    number={phoneNumber}
                    onCountryCodeChange={setPhoneCountryCode}
                    onNumberChange={setPhoneNumber}
                    helpText={mobileHelp}
                    errorMessage={fieldErrors.phone}
                  />

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Address</span>
                    <input
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">Country</span>
                      <select
                        value={form.country}
                        onChange={(event) => {
                          updateForm("country", event.target.value);
                          updateForm("state", "");
                          updateForm("city", "");
                        }}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.name}>{country.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">State</span>
                      <select
                        value={form.state}
                        onChange={(event) => {
                          updateForm("state", event.target.value);
                          updateForm("city", "");
                        }}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                        disabled={!form.country}
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.name}>{state.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">City</span>
                      <select
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                        disabled={!form.state}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">Pincode</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.pincode}
                        onChange={(e) => updateForm("pincode", digitsOnly(e.target.value))}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Role</span>
                    <select
                      value={form.role_id}
                      onChange={(e) => updateForm("role_id", e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </label>

                  <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                    Account activation and deactivation are managed from the user detail page and recorded in account history.
                  </p>
                </>
              )}

              {message && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                  {message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-[#E6E8F0] px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="rounded-md bg-dash-brand px-5 py-2 text-sm font-semibold text-white hover:bg-dash-brand-hover"
                >
                  {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}






