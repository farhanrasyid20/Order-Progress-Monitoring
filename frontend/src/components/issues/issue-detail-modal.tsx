"use client";

import { useEffect, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DetailGrid } from "@/components/workflow/requirement-details";
import { ProjectInformation } from "@/components/workflow/project-information";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { useIssues } from "./issue-provider";
import type { IssueRecord } from "@/types/issue";

function dateLabel(value: string, withTime = false) {
  if (!value) return "-";
  const date = new Date(withTime ? value : value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

export function IssueDetailModal({ issue: initialIssue, onClose }: { issue: IssueRecord; onClose: () => void }) {
  const titleId = useId();
  const { issues } = useIssues();
  const { orders } = useWorkflowOrders();
  const issue = issues.find(item => item.id === initialIssue.id) ?? initialIssue;
  const project = orders.find(order => order.id === issue.incomingDesignId);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog history-dialog incoming-detail-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div><h2 id={titleId}>Issue Details &amp; History</h2><p>Issue #{issue.id} / {project?.no || issue.projectCode || issue.partCode || "-"}</p></div>
        <button type="button" className="modal-close" aria-label="Close issue details" onClick={onClose} autoFocus><Icon name="close" size={18} /></button>
      </header>
      <div className="history-modal-body">
        <section className="requirement-detail-section" aria-label="Issue details">
          <h3>Issue Information</h3>
          <Badge tone={issue.status === "Open" ? "warning" : "success"}>{issue.status}</Badge>
          <DetailGrid fields={[
            ["Incoming Design / PSR / Code", project?.no || issue.projectCode],
            ["Source / Customer / Machine", project?.customer || issue.source],
            ["Part No / Code", project?.mainData.partNo || issue.partCode],
            ["Product / Description", project?.product !== "-" ? project?.product || issue.productDescription : issue.productDescription],
            ["Date Found", dateLabel(issue.dateFound)],
            ["Description of Error", issue.errorDescription],
            ["Type of Error", issue.category],
            ["Prepared By", issue.preparedBy],
            ["Found By", issue.foundBy],
            ["Deadline for Revision", dateLabel(issue.targetDate)],
            ["Date Closed", dateLabel(issue.dateClosed)],
            ["Action / Correction", issue.action],
            ["Remark", issue.remark],
          ]} />
        </section>
        {project ? <ProjectInformation order={project} /> : null}
        <div className="project-form-section-heading"><h3>Activity History</h3></div>
        {issue.history.length ? <div className="table-wrap history-table-wrap"><table className="history-table">
          <thead><tr><th>Time</th><th>Updated By</th><th>Activity / Changes</th></tr></thead>
          <tbody>{[...issue.history].reverse().map((record, index) => <tr key={record.date + "-" + index}>
            <td>{dateLabel(record.date, true)}</td><td>{record.user || "-"}</td><td>{record.summary}</td>
          </tr>)}</tbody>
        </table></div> : <p>No activity recorded.</p>}
      </div>
      <footer className="modal-actions history-modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Close</Button></footer>
    </section>
  </div>;
}
