"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { User, UserFormData } from "@/types/user";

type UseUsersOptions = {
  enabled?: boolean;
};

export function useUsers({ enabled = true }: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/users/");
      setUsers(response.data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const createUser = async (data: UserFormData) => {
    setSaving(true);

    try {
      await api.post("/users/", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        profile_image: data.profile_image,
        address: data.address,
        country: data.country,
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        password: data.password,
        role_id: data.role_id || null,
      });

      await fetchUsers();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (id: number, data: UserFormData) => {
    setSaving(true);

    try {
      await api.put(`/users/${id}`, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        profile_image: data.profile_image,
        address: data.address,
        country: data.country,
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        role_id: data.role_id || null,
        is_active: data.is_active,
        approval_status: data.approval_status,
      });

      await fetchUsers();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this user?");

    if (!confirmDelete) return false;

    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  };

  const approveUser = async (id: number, roleId?: number | "") => {
    setSaving(true);

    try {
      await api.post(`/users/${id}/approve`, {
        role_id: roleId || undefined,
      });
      await fetchUsers();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const rejectUser = async (id: number) => {
    const confirmReject = confirm("Reject this user registration?");

    if (!confirmReject) return false;

    setSaving(true);

    try {
      await api.post(`/users/${id}/reject`);
      await fetchUsers();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async (id: number) => {
    setSaving(true);

    try {
      await api.post(`/users/${id}/send-reset-mail`);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    saving,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
    sendPasswordReset,
  };
}
