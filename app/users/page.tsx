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
import Pagination from "@/components/ui/Pagination";
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
  phoneCountryCodes,
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
    const phone = phoneNumber ? combinePhone(phoneCountryCode, phoneNumber) : "";

    if (!validateMobile(phone)) {
      setMessage(mobileHelp);
      return;
    }

    const payload = { ...form, phone };

    if (editingUser) {
      success = await updateUser(editingUser.id, payload);
    } else {
      success = await createUser(payload);
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
        <label className="mt-5 block max-w-md">
          <span className="sr-only">Search users</span>
          <input
            value={pagination.search}
            onChange={(event) => pagination.setSearch(event.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
          />
        </label>
      </section>

      {pendingUsers.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[#121826]">
              Pending Registrations
            </h3>
            <p className="mt-1 text-sm text-[#667085]">
              Review new users before they can sign in.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-amber-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-[#121826]">{user.name}</p>
                    <p className="mt-1 truncate text-sm text-[#667085]">
                      {user.email}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      Requested role: {resolveRoleName(user)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC]"
                  >
                    Assign Role
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => approveUser(user.id, user.role_id || "")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => rejectUser(user.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[#121826]">All Users</h3>
          <p className="mt-1 text-sm text-[#667085]">
            Approved and rejected users remain available for audit and edits.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7EAF0]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
              <tr>
                <th className="w-20 px-5 py-4">No</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Approval</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EEF2F6] bg-white">
              {paginatedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-5 py-4 font-bold text-[#667085]">
                    {(pagination.page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {user.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(user.profile_image)}
                          alt={user.name}
                          className="h-9 w-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF1FF] font-semibold text-[#43A9F6]">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#121826]">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-600">{user.email}</td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {resolveRoleName(user)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${approvalClass(
                        user.approval_status
                      )}`}
                    >
                      {user.approval_status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
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
                        className="rounded-lg border border-[#E7EAF0] p-2 text-gray-500 hover:bg-sky-50 hover:text-[#238DD7]"
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
                  </td>
                </tr>
              ))}

              {approvedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {approvedUsers.length > 0 && (
            <Pagination
              page={Math.min(pagination.page, totalPages)}
              pageSize={pageSize}
              total={total}
              onPageChange={pagination.setPage}
            />
          )}
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
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Name
                </span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>

              {!editingUser && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    Password
                  </span>
                  <input
                    type="password"
                    value={form.password || ""}
                    onChange={(e) => updateForm("password", e.target.value)}
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    required
                  />
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    Country Code
                  </span>
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  >
                    {phoneCountryCodes.map((item, index) => (
                      <option key={`${item.value}-${index}`} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    Mobile Number
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                    placeholder="9876543210"
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  />
                  <p className="mt-1 text-xs text-[#98A2B3]">{mobileHelp}</p>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Address
                </span>
                <input
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    Country
                  </span>
                  <select
                    value={form.country}
                    onChange={(e) => {
                      updateForm("country", e.target.value);
                      updateForm("state", "");
                      updateForm("city", "");
                    }}
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
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
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    State
                  </span>
                  <select
                    value={form.state}
                    onChange={(e) => {
                      updateForm("state", e.target.value);
                      updateForm("city", "");
                    }}
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    disabled={!form.country}
                  >
                    <option value="">Select State</option>
                    {getStates(form.country).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    City
                  </span>
                  <select
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    disabled={!form.state}
                  >
                    <option value="">Select City</option>
                    {getCities(form.state).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    Pincode
                  </span>
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
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Role
                </span>
                <select
                  value={form.role_id}
                  onChange={(e) =>
                    updateForm(
                      "role_id",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required={!editingUser}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              {editingUser && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-500">
                      Approval
                    </span>
                    <select
                      value={form.approval_status || "pending"}
                      onChange={(e) =>
                        updateForm(
                          "approval_status",
                          e.target.value as "pending" | "approved" | "rejected"
                        )
                      }
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
                  {saving
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
