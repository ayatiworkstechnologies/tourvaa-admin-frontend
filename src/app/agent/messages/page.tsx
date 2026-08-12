"use client";

import { LuMessageSquare as MessageSquare } from "react-icons/lu";
import { AgentPageHeader, AgentPageShell } from "@/components/agent/AgentPage";
import PortalMessageThread from "@/components/messaging/PortalMessageThread";

export default function AgentMessagesPage() {
  return (
    <AgentPageShell>
      <AgentPageHeader title="Messages" description="Chat directly with Tourvaa operations and get help in real time." icon={MessageSquare} eyebrow="Communication" />
      <div className="mt-4">
        <PortalMessageThread portal="agent" />
      </div>
    </AgentPageShell>
  );
}
