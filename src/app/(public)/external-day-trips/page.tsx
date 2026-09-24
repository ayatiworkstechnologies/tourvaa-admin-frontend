import { redirect } from "next/navigation";

// Retired page; kept so old links land on the homepage instead of a 404.
export default function ExternalDayTripsPage() {
  redirect("/");
}
