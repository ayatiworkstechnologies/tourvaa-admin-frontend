"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit,
  Mail,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

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
} from "@/lib/validators";
import {
  countries,
  getCities,
  getStates,
  phoneCountryCodeValues,
} from "@/lib/location-options";
import { mediaUrl } from "@/lib/media-url";

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
    approveUser,
    rejectUser,
    sendPasswordReset,
  } =
    useUsers({
      enabled: canLoadProtectedData,
      page: pagination.page,
      limit: pagination.limit,
      search: pagination.debouncedSearch,
    });
  const { roles } = useRoles({ enabled: canLoadProtectedData });

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

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

    let success = false;

    if (editingUser) {
      const phone = phoneNumber ? combinePhone(phoneCountryCode, phoneNumber) : "";
      if (!validateMobile(phone)) {
        setMessage(mobileHelp);
        return;
      }
      success = await updateUser(editingUser.id, { ...form, phone });
    } else {
      if (!form.password || form.password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
      }
      if (form.password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
      success = await createUser({ ...form, phone: "" });
    }

    if (success) {
      toast.success(editingUser ? "User updated successfully." : "User created successfully.");
      closeModal();
    } else {
      setMessage("Something went wrong. Please check the form.");
    }
  };

  if (dashboardLoading || loading) {
    return <Loader label="Loading users..." fullScreen />;
  }

  if (!dashboard) return null;

  const pendingUsers = users.filter(
    (user) => user.approval_status === "pending"
  );
  const approvedUsers = users.filter(
    (user) => user.approval_status !== "pending"
  );
  const pageSize = pagination.limit;
  const totalPages = pagination.totalPages;
  const paginatedUsers = approvedUsers;

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
      className: "w-20 font-bold text-[#667085]",
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D7E8F5] font-semibold text-[#43A9F6]">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-[#121826]">{user.name}</p>
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
      header: "Approval",
      render: (user) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${approvalClass(
            user.approval_status
          )}`}
        >
          {user.approval_status}
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
      <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#121826]">
              Users Management
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              Approve new registrations, assign roles, and control dynamic
              permission access.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2F9FE9]"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#F7F9FC] p-4">
            <p className="text-sm font-semibold text-[#667085]">Total users</p>
            <p className="mt-2 text-3xl font-bold text-[#121826]">
              {users.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F7F9FC] p-4">
            <p className="text-sm font-semibold text-[#667085]">
              Pending approval
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingUsers.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F7F9FC] p-4">
            <p className="text-sm font-semibold text-[#667085]">Active users</p>
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
                {user.approval_status === "rejected" && (
                  <button
                    disabled={saving}
                    onClick={() => approveUser(user.id, user.role_id || "")}
                    className="rounded-lg border border-[#E7EAF0] p-2 text-emerald-600 hover:bg-emerald-50"
                    title="Approve user"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                )}
                <button
                  disabled={saving}
                  onClick={() => handleSendReset(user.id)}
                  className="rounded-lg border border-[#E7EAF0] p-2 text-gray-500 hover:bg-sky-50 hover:text-[#2F9FE9]"
                  title="Send password reset email"
                >
                  <Mail size={15} />
                </button>
                <button
                  onClick={() => openEdit(user)}
                  className="rounded-lg border border-[#E7EAF0] p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit size={15} />
                </button>

                <button
                  onClick={() => deleteUser(user.id)}
                  className="rounded-lg border border-[#E7EAF0] p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
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
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
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
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Password</span>
                    <input
                      type="password"
                      value={form.password || ""}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Confirm Password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Role</span>
                    <select
                      value={form.role_id}
                      onChange={(e) => updateForm("role_id", e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
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
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      required
                    />
                  </label>
                  <PhoneInput
                    countryCode={phoneCountryCode}
                    number={phoneNumber}
                    onCountryCodeChange={setPhoneCountryCode}
                    onNumberChange={setPhoneNumber}
                    helpText={mobileHelp}
                  />

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Address</span>
                    <input
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
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
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>{country}</option>
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
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                        disabled={!form.country}
                      >
                        <option value="">Select State</option>
                        {getStates(form.country).map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">City</span>
                      <select
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                        disabled={!form.state}
                      >
                        <option value="">Select City</option>
                        {getCities(form.state).map((city) => (
                          <option key={city} value={city}>{city}</option>
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
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">Role</span>
                    <select
                      value={form.role_id}
                      onChange={(e) => updateForm("role_id", e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">Approval</span>
                      <select
                        value={form.approval_status || "pending"}
                        onChange={(e) => updateForm("approval_status", e.target.value as "pending" | "approved" | "rejected")}
                        className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 pt-6 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => updateForm("is_active", e.target.checked)}
                      />
                      Active User
                    </label>
                  </div>
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
                  className="rounded-md bg-[#43A9F6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2F9FE9]"
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






