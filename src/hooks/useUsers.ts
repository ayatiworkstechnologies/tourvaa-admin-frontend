"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api/client";
import { User, UserFormData } from "@/types/user";

type UseUsersOptions = {
  enabled?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: string;
  userType?: string;
};

export function useUsers({ enabled = true, page = 1, limit = 10, search = "", accountStatus = "", userType = "" }: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/users/", {
        params: { page, limit, search, account_status: accountStatus, user_type: userType },
      });
      const items = response.data.items || response.data.data || [];
      setUsers(items);
      setTotal(response.data.total ?? items.length);
      setTotalPages(response.data.total_pages ?? 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [accountStatus, enabled, limit, page, search, userType]);

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
      return { success: true as const };
    } catch (error) {
      return { success: false as const, error };
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
      });

      await fetchUsers();
      return { success: true as const };
    } catch (error) {
      return { success: false as const, error };
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
     
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    saving,
    fetchUsers,
    total,
    totalPages,
    createUser,
    updateUser,
    deleteUser,
    sendPasswordReset,
  };
}


