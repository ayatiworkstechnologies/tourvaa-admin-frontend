"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, KeyRound, Plus, Save, Trash2, X } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import api from "@/lib/api";
import { Role } from "@/types/user";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";

type Permission = {
  id: number;
  name: string;
  slug: string;
  module: string;
  action?: "get" | "post" | "put" | "delete";
  is_active: boolean;
};

type RoleForm = {
  name: string;
  slug: string;
  is_active: boolean;
};

const emptyForm: RoleForm = {
  name: "",
  slug: "",
  is_active: true,
};

const actions = [
  { key: "get", label: "GET", description: "View" },
  { key: "post", label: "POST", description: "Create" },
  { key: "put", label: "PUT", description: "Update" },
  { key: "delete", label: "DELETE", description: "Delete" },
] as const;

const inferAction = (permission: Permission) => {
  if (permission.action) return permission.action;
  if (permission.slug.startsWith("create-")) return "post";
  if (permission.slug.startsWith("update-")) return "put";
  if (permission.slug.startsWith("delete-")) return "delete";
  return "get";
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(roles.length / pageSize));
  const paginatedRoles = roles.slice((page - 1) * pageSize, page * pageSize);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, item) => {
      groups[item.module] = groups[item.module] || [];
      groups[item.module].push(item);
      return groups;
    }, {});
  }, [permissions]);

  const permissionMatrix = useMemo(() => {
    return Object.entries(groupedPermissions)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([module, items]) => ({
        module,
        items,
        byAction: actions.reduce<Record<string, Permission | undefined>>(
          (map, action) => {
            map[action.key] = items.find(
              (permission) => inferAction(permission) === action.key
            );
            return map;
          },
          {}
        ),
      }));
  }, [groupedPermissions]);

  const allPermissionIds = permissions.map((permission) => permission.id);
  const allSelected =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => selectedPermissionIds.includes(id));

  const fetchRoles = useCallback(async () => {
    const response = await api.get("/roles/");
    setRoles(response.data.data || []);
    setPage(1);
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      let allPerms: Permission[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await api.get(`/permissions/?limit=100&page=${currentPage}`);
        allPerms = [...allPerms, ...(response.data.data || [])];
        totalPages = response.data.total_pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      setPermissions(allPerms);
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      setPermissions([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([fetchRoles(), fetchPermissions()]);
    } finally {
      setLoading(false);
    }
  }, [fetchPermissions, fetchRoles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      slug: role.slug,
      is_active: role.is_active,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const submitRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, form);
      } else {
        await api.post("/roles/", form);
      }

      await fetchRoles();
      closeForm();
    } catch {
      alert("Role save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: Role) => {
    const ok = confirm(`Delete role "${role.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/roles/${role.id}`);
      await fetchRoles();
    } catch {
      alert("Role delete failed");
    }
  };

  const openPermissions = async (role: Role) => {
    setSelectedRole(role);
    setPermissionOpen(true);

    try {
      const response = await api.get(`/roles/${role.id}/permissions`);
      const assigned: Permission[] = response.data.data || [];
      setSelectedPermissionIds(assigned.map((permission) => permission.id));
    } catch {
      setSelectedPermissionIds([]);
    }
  };

  const closePermissions = () => {
    setSelectedRole(null);
    setSelectedPermissionIds([]);
    setPermissionOpen(false);
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  };

  const toggleAllPermissions = () => {
    setSelectedPermissionIds(allSelected ? [] : allPermissionIds);
  };

  const toggleModulePermissions = (items: Permission[]) => {
    const ids = items.map((permission) => permission.id);
    const moduleSelected = ids.every((id) => selectedPermissionIds.includes(id));

    setSelectedPermissionIds((current) =>
      moduleSelected
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])]
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);

    try {
      await api.post(`/roles/${selectedRole.id}/permissions`, {
        permission_ids: selectedPermissionIds,
      });

      closePermissions();
    } catch {
      alert("Permission assignment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModuleWrapper title="Roles" requiredPermission="roles.view">
      <div className="rounded-lg border border-[#E6E8F0] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#1F1B2D]">Roles</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create roles and assign module permissions with checkboxes.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-md bg-[#43A9F6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-100 hover:bg-[#2F9FE9]"
          >
            <Plus size={16} />
            Add Role
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#E6E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead className="bg-[#F7F9FC] text-xs uppercase text-gray-500">
                <tr>
                  <th className="w-20 px-5 py-4">No</th>
                  <th className="px-5 py-4">Role Name</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E6E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <Loader label="Loading roles..." />
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map((role, index) => (
                    <tr key={role.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-5 py-4 font-bold text-[#667085]">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1F1B2D]">
                        {role.name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{role.slug}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            role.is_active
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openPermissions(role)}
                            className="rounded-md border border-[#E6E8F0] p-2 text-gray-500 hover:bg-sky-50 hover:text-[#43A9F6]"
                            title="Assign permissions"
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(role)}
                            className="rounded-md border border-[#E6E8F0] p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit role"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => deleteRole(role)}
                            className="rounded-md border border-[#E6E8F0] p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete role"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && roles.length > 0 && (
            <Pagination
              page={Math.min(page, totalPages)}
              pageSize={pageSize}
              total={roles.length}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1F1B2D]">
                {editingRole ? "Edit Role" : "Add Role"}
              </h3>
              <button
                onClick={closeForm}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitRole} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Role Name
                </span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
                Active Role
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-[#E6E8F0] px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-md bg-[#43A9F6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2F9FE9]"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {permissionOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[86vh] w-full max-w-5xl flex-col rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#1F1B2D]">
                  Assign Permissions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose exactly which HTTP actions this role can use.
                </p>
              </div>
              <button
                onClick={closePermissions}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-lg bg-[#F7F9FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-semibold text-[#1F1B2D]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAllPermissions}
                />
                Select All Permissions
              </label>
              <span className="text-xs font-semibold text-[#43A9F6]">
                {selectedPermissionIds.length} / {permissions.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="overflow-hidden rounded-xl border border-[#E6E8F0]">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr_2fr_0.8fr] bg-[#F7F9FC] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <span>Module</span>
                      <span className="text-center">View</span>
                      <span className="text-center">Create</span>
                      <span className="text-center">Update</span>
                      <span className="text-center">Delete</span>
                      <span className="text-left pl-4">Others</span>
                      <span className="text-right">All</span>
                    </div>

                    <div className="divide-y divide-[#E6E8F0]">
                      {Object.entries(groupedPermissions)
                        .sort(([left], [right]) => left.localeCompare(right))
                        .map(([module, items]) => {
                          const moduleSelected = items.every((permission) =>
                            selectedPermissionIds.includes(permission.id)
                          );

                          const getCoreAction = (p: Permission) => {
                            const s = p.slug;
                            const m = p.module;
                            if (s === `view-${m}` || s === `${m}.view`) return "get";
                            if (s === `create-${m}` || s === `${m}.create`) return "post";
                            if (s === `update-${m}` || s === `${m}.edit` || s === `${m}.update`) return "put";
                            if (s === `delete-${m}` || s === `${m}.delete`) return "delete";
                            return "other";
                          };

                          const byAction: Record<string, Permission | undefined> = {};
                          const others: Permission[] = [];

                          items.forEach((p) => {
                            const action = getCoreAction(p);
                            if (action !== "other" && !byAction[action]) {
                              byAction[action] = p;
                            } else {
                              others.push(p);
                            }
                          });

                          const coreKeys = ["get", "post", "put", "delete"];

                          return (
                            <div
                              key={module}
                              className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr_2fr_0.8fr] items-center px-4 py-4 hover:bg-[#F9FAFB]"
                            >
                              <div>
                                <p className="font-semibold capitalize text-[#1F1B2D]">
                                  {module.replace("-", " ")}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {items.length} permissions
                                </p>
                              </div>

                              {coreKeys.map((key) => {
                                const permission = byAction[key];
                                const labelMap: Record<string, string> = { get: "View", post: "Create", put: "Update", delete: "Delete" };
                                return (
                                  <div key={key} className="flex justify-center">
                                    <label
                                      className="flex flex-col items-center gap-1 text-xs font-semibold text-gray-500 cursor-pointer"
                                      title={permission?.name || "Not available"}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={!permission}
                                        className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        checked={
                                          !!permission &&
                                          selectedPermissionIds.includes(permission.id)
                                        }
                                        onChange={() =>
                                          permission && togglePermission(permission.id)
                                        }
                                      />
                                      <span>{labelMap[key]}</span>
                                    </label>
                                  </div>
                                );
                              })}

                              <div className="flex flex-col gap-2 pl-4 justify-center">
                                {others.length > 0 ? (
                                  others.map((p) => (
                                    <label
                                      key={p.id}
                                      className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer leading-tight"
                                      title={p.slug}
                                    >
                                      <input
                                        type="checkbox"
                                        className="cursor-pointer"
                                        checked={selectedPermissionIds.includes(p.id)}
                                        onChange={() => togglePermission(p.id)}
                                      />
                                      <span>{p.name.replace(new RegExp(`^.*${module.replace('-', ' ')}$`, 'i'), '').trim() || p.name}</span>
                                    </label>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">None</span>
                                )}
                              </div>

                              <div className="flex justify-end pr-2">
                                <input
                                  type="checkbox"
                                  className="cursor-pointer"
                                  checked={moduleSelected}
                                  onChange={() => toggleModulePermissions(items)}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t border-[#E6E8F0] pt-4">
              <button
                type="button"
                onClick={closePermissions}
                className="rounded-md border border-[#E6E8F0] px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-[#43A9F6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2F9FE9]"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleWrapper>
  );
}
