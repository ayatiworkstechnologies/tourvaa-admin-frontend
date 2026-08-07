import { redirect } from "next/navigation";

export default function AgentJoinRedirect() {
  redirect("/agent-portal/login?tab=register&redirect=%2Fagent%2Fprofile");
}
