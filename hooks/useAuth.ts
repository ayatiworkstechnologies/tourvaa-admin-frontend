"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { saveToken, saveUser, removeToken } from "@/lib/auth";

type LoginPayload = {
  email: string;
  password: string;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Invalid email or password";
  }

  return "Invalid email or password";
}

export function useAuth() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", payload);
      const data = response.data.data;

      saveToken(data.access_token);
      saveUser(data.user);

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem("tourvaa_user");
    router.push("/login");
  };

  return {
    login,
    logout,
    loading,
    error,
  };
}
