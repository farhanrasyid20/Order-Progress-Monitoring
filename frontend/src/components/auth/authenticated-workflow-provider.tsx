"use client";

import type { ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { WorkflowOrdersProvider } from "@/components/workflow/workflow-provider";
import { workflowRoleForUser } from "@/lib/auth";

export function AuthenticatedWorkflowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <WorkflowOrdersProvider currentUserRole={user ? workflowRoleForUser[user.role] : "intern"} currentUserName={user?.name ?? "System"}>{children}</WorkflowOrdersProvider>;
}
