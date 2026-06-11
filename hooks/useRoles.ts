"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { Role } from "@/types/user";

type UseRolesOptions = {
  enabled?: boolean;
};

export function useRoles({ enabled = true }: UseRolesOptions = {}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchRoles = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/roles/public/options");
      setRoles(response.data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

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
