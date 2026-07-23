import { redirect } from "next/navigation";

export default function AgentJoinRedirect() {
  redirect("/register?type=agent&redirect=%2Fagent%2Fprofile");
}
