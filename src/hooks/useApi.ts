"use client";

import { useState } from "react";
import api from "@/lib/api/client";

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const request = async (
    method: "get" | "post" | "put" | "delete",
    url: string,
    payload?: unknown
  ) => {
    setLoading(true);
    setError("");

    try {
      const response =
        method === "get" || method === "delete"
          ? await api[method](url)
          : await api[method](url, payload);

      setData(response.data.data);
      return response.data;
    } catch {
      setError("Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    request,
  };
}
