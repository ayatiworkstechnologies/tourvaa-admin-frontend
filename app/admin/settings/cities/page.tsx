"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CitiesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/settings/countries?tab=cities"); }, [router]);
  return null;
}
