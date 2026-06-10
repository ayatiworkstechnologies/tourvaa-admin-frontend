"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { Role } from "@/types/user";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await api.get("/roles/public/options");
      setRoles(response.data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    refetch: fetchRoles,
  };
}
