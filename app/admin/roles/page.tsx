"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, KeyRound, Plus, Save, Trash2, X } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import api from "@/lib/api";
import { Role } from "@/types/user";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

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
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const pageSize = 10;

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.slug.toLowerCase().includes(query)
    );
  }, [roles, roleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const paginatedRoles = filteredRoles.slice((page - 1) * pageSize, page * pageSize);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, item) => {
      groups[item.module] = groups[item.module] || [];
      groups[item.module].push(item);
      return groups;
    }, {});
  }, [permissions]);

  const filteredGroupedPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    const entries = Object.entries(groupedPermissions);
    if (!query) return entries;

    return entries
      .map(([module, items]) => {
        const moduleMatches = module.toLowerCase().includes(query);
        const matchedItems = moduleMatches
          ? items
          : items.filter(
              (item) =>
                item.name.toLowerCase().includes(query) ||
                item.slug.toLowerCase().includes(query)
            );
        return [module, matchedItems] as [string, Permission[]];
      })
      .filter(([, items]) => items.length > 0);
  }, [groupedPermissions, permissionSearch]);


  const allPermissionIds = permissions.map((permission) => permission.id);
  const allSelected =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => selectedPermissionIds.includes(id));

  const fetchRoles = useCallback(async () => {
    const response = await api.get("/roles/", { params: { limit: 1000 } });
    setRoles(response.data.data || []);
    setPage(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [roleSearch]);

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
    setPermissionSearch("");
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

  const columns: DataTableColumn<Role>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-[#667085]",
      render: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "roleName",
      header: "Role Name",
      className: "font-semibold text-[#1F1B2D]",
      render: (role) => role.name,
    },
    {
      key: "slug",
      header: "Slug",
      className: "text-gray-600",
      render: (role) => role.slug,
    },
    {
      key: "status",
      header: "Status",
      render: (role) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            role.is_active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {role.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Roles" requiredPermission="roles.view">
      <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[28px] font-black tracking-tight text-[#121826]">Roles</h2>
            <p className="mt-1 text-sm font-medium text-[#667085]">
              Create roles and assign module permissions with checkboxes.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <input
              value={roleSearch}
              onChange={(event) => setRoleSearch(event.target.value)}
              placeholder="Search roles by name or slug…"
              className="w-full rounded-xl border border-[#E7EAF0]/80 bg-[#F7F9FC] px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all sm:w-64"
            />
            <button
              type="button"
              onClick={openCreate}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-[#2F9FE9] transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Role
            </button>
          </div>
        </div>

        <div className="mt-6">
          <DataTable
            ariaLabel="Roles table"
            columns={columns}
            rows={paginatedRoles}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={roles.length}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No roles found."
            actions={(role) => (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openPermissions(role)}
                  className="rounded-xl border border-[#E7EAF0]/80 bg-white p-2 text-[#667085] shadow-sm hover:bg-[#F3F8FC] hover:text-[#43A9F6] transition-colors"
                  title="Assign permissions"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={() => openEdit(role)}
                  className="rounded-xl border border-[#E7EAF0]/80 bg-white p-2 text-[#667085] shadow-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="Edit role"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteRole(role)}
                  className="rounded-xl border border-[#E7EAF0]/80 bg-white p-2 text-[#667085] shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight text-[#121826]">
                {editingRole ? "Edit Role" : "Add Role"}
              </h3>
              <button
                onClick={closeForm}
                className="rounded-xl p-2 text-[#667085] hover:bg-[#F7F9FC] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitRole} className="space-y-4">
              <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#667085]">
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
                    className="w-full rounded-xl border border-[#E7EAF0]/80 bg-[#F7F9FC] px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#667085]">
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
                    className="w-full rounded-xl border border-[#E7EAF0]/80 bg-[#F7F9FC] px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all"
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

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-[#E7EAF0]/80 bg-white px-5 py-2.5 text-sm font-bold text-[#344054] shadow-sm hover:bg-[#F7F9FC] hover:text-[#121826] transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-[#43A9F6] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-[#2F9FE9] transition-all hover:-translate-y-0.5"
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
                type="button"
                onClick={closePermissions}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <input
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
              placeholder="Search by module or permission name…"
              className="mb-3 w-full rounded-lg border border-[#E6E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10 transition-all"
            />

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
                      {filteredGroupedPermissions.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                          No modules or permissions match your search.
                        </p>
                      )}
                      {filteredGroupedPermissions
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


