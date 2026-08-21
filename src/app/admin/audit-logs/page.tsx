import { redirect } from "next/navigation";

// Audit Logs and Activity Logs were two separate pages rendering the same
// backend data (app/routers/audit.py serves both prefixes with one handler).
// Activity Logs is the one linked from the admin sidebar navigation, so it
// is the canonical page; this route redirects rather than duplicating it.
export default function AuditLogsPage() {
  redirect("/admin/activity-logs");
}
