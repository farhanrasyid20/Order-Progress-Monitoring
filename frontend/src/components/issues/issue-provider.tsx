"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { initialIssues } from "@/data/issues";
import { isActiveProject } from "@/lib/active-project";
import { issueProjectInfo } from "@/lib/issue-project";
import type { IssueFormValues, IssueRecord } from "@/types/issue";

type IssuesContextValue = {
  issues: IssueRecord[];
  saveIssue: (values: IssueFormValues, issueId?: number) => string | null;
};

const IssuesContext = createContext<IssuesContextValue | null>(null);

/** Shared session state, matching the existing frontend-only order storage. */
export function IssuesProvider({ children }: { children: ReactNode }) {
  const { orders } = useWorkflowOrders();
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);
  const saveIssue = useCallback((values: IssueFormValues, issueId?: number) => {
    const existing = issueId === undefined ? undefined : issues.find((issue) => issue.id === issueId);
    if (issueId !== undefined && !existing) return "Issue not found.";
    const project = orders.find((order) => order.id === values.incomingDesignId);
    const keepsExistingProject = existing && existing.incomingDesignId === values.incomingDesignId;
    if ((!existing || existing.incomingDesignId || values.incomingDesignId) && !project) return "Select an available Incoming Design project.";
    if (project && !isActiveProject(project) && !keepsExistingProject) return "This Incoming Design project is no longer active. Select an active project.";
    if (![values.dateFound, values.errorDescription, values.preparedBy, values.foundBy, values.action].every((value) => value.trim())) {
      return "Complete Date Found, Description of Error, Prepared By, Found By, and Action / Correction.";
    }
    const savedValues: IssueFormValues = {
      incomingDesignId: values.incomingDesignId,
      ...(project ? issueProjectInfo(project) : {
        source: values.source,
        partCode: values.partCode,
        productDescription: values.productDescription,
        projectCode: existing?.projectCode ?? "",
      }),
      dateFound: values.dateFound,
      errorDescription: values.errorDescription.trim(),
      category: values.category,
      preparedBy: values.preparedBy.trim(),
      foundBy: values.foundBy.trim(),
      action: values.action.trim(),
      targetDate: values.targetDate,
      status: values.status,
      dateClosed: values.status === "Closed" ? values.dateClosed : "",
      remark: values.remark,
    };
    const date = new Date().toISOString();
    setIssues((current) => {
      if (existing) return current.map((issue) => issue.id === existing.id ? {
        ...issue, ...savedValues,
        history: [...issue.history, { date, user: savedValues.preparedBy, summary: `Issue updated. Status: ${issue.status} to ${savedValues.status}.` }],
      } : issue);
      return [{
        ...savedValues,
        id: Math.max(0, ...current.map((issue) => issue.id)) + 1,
        history: [{ date, user: savedValues.preparedBy, summary: "Issue created." }],
      }, ...current];
    });
    return null;
  }, [issues, orders]);
  const value = useMemo(() => ({ issues, saveIssue }), [issues, saveIssue]);
  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error("useIssues must be used inside IssuesProvider.");
  return context;
}
