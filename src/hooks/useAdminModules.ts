"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api/client";

export type AdminModule = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  is_system: boolean;
};

export function useAdminModules(enabled = true) {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchModules = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/modules/");
      setModules(response.data.data || []);
    } catch {
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchModules();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchModules]);

  return { modules, loading, refetch: fetchModules };
}
