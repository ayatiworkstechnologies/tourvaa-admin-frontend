import { redirect } from "next/navigation";

// Viator is the only integration today.
export default function IntegrationsIndexPage() {
  redirect("/admin/integrations/viator");
}
