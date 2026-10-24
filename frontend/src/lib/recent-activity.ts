import type { Order } from "@/types/order";
import type { IssueRecord } from "@/types/issue";
import type { ActivityItem } from "@/app/dashboard/components/recent-activity";
import { formatRecordedAt } from "./detail-date";
import { englishOffsetLabel } from "./offset-labels";

/** Merge persisted audit events, deduplicating shared history copied into requirement branches. */
export function buildRecentActivity(orders: readonly Order[], issues: readonly IssueRecord[], limit = 5): ActivityItem[] {
  const events = new Map<string, ActivityItem & { timestamp: number }>();
  for (const order of orders) {
    for (const record of order.processHistory) {
      const timestamp = Date.parse(record.date);
      if (!Number.isFinite(timestamp)) continue;
      const id = JSON.stringify(["project", order.sourceProjectId ?? order.id, record.source ?? "", record.date, record.process, record.status, record.user, record.changeSummary, record.remark]);
      const prepress = record.process === "handoff_details_updated" && record.stage === "offset-prepress";
      const warning = ["cancel", "cancelled", "revision", "issue", "on_hold"].includes(record.status);
      const completed = ["approve", "approved", "completed", "received", "available", "submitted"].includes(record.status);
      events.set(id, {
        id, timestamp,
        title: prepress ? "Prepress completed" : englishOffsetLabel(record.changeSummary || record.process.replaceAll("_", " ")),
        meta: [order.no, record.source === "tooling" ? "Tooling" : record.source === "rubber" ? "Rubber" : "", record.user || "System"].filter(Boolean).join(" / "),
        time: formatRecordedAt(record.date),
        icon: warning ? "alert" : completed ? "check" : "clock",
        tone: warning ? "amber" : completed ? "green" : "blue",
      });
    }
  }
  for (const issue of issues) {
    issue.history.forEach((record, index) => {
      const timestamp = Date.parse(record.date);
      if (!Number.isFinite(timestamp)) return;
      const id = "issue-" + issue.id + "-" + index;
      events.set(id, {
        id, timestamp, title: record.summary,
        meta: ["Issue #" + issue.id, issue.projectCode || issue.partCode, record.user || "System"].filter(Boolean).join(" / "),
        time: formatRecordedAt(record.date), icon: "alert", tone: "amber",
      });
    });
  }
  return [...events.values()].sort((a, b) => b.timestamp - a.timestamp || a.id!.localeCompare(b.id!)).slice(0, Math.max(0, limit));
}
