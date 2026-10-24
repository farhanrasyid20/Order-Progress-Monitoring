"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";

import { IssueDetailModal } from "@/components/issues/issue-detail-modal";
import { IssueFormModal } from "@/components/issues/issue-form-modal";
import { useIssues } from "@/components/issues/issue-provider";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { issueProjectInfo } from "@/lib/issue-project";
import { categories } from "@/data/issues";
import type { IssueRecord, IssueStatus } from "@/types/issue";

function toDateLabel(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB").format(date);
}

/** Standalone log for drawing and machine issues sourced from the error-log workbook. */
export default function IssueLogPage() {
  const { issues: storedIssues } = useIssues();
  const { orders } = useWorkflowOrders();
  const issues = useMemo(() => storedIssues.map((issue) => {
    const order = orders.find((order) => order.id === issue.incomingDesignId);
    return order ? { ...issue, ...issueProjectInfo(order) } : issue;
  }), [storedIssues, orders]);
  const [toastMessage, setToastMessage] = useState("");
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<IssueRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailIssue, setDetailIssue] = useState<IssueRecord | null>(null);

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesQuery = !normalizedQuery || [
        issue.projectCode,
        issue.source,
        issue.partCode,
        issue.productDescription,
        issue.errorDescription,
        issue.preparedBy,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, issues, query, statusFilter]);
  const pagination = useTablePagination(filteredIssues);

  const openCount = issues.filter((issue) => issue.status === "Open").length;
  const closedCount = issues.length - openCount;

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (issue: IssueRecord) => {
    setEditing(issue);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Issue Log</h1>
          <p>Track design, customer, and machine issues with corrective actions and activity history.</p>
        </div>
        <Button icon="plus" onClick={openCreate}>Add Issue</Button>
      </div>

      <section className="summary-grid process-summary">
        <article className="summary-card">
          <div className="summary-icon blue"><Icon name="alert" /></div>
          <div className="summary-label">Total Issues</div>
          <strong className="summary-value">{issues.length}</strong>
          <span className="summary-meta">All sources</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon blue"><Icon name="clock" /></div>
          <div className="summary-label">Open</div>
          <strong className="summary-value">{openCount}</strong>
          <span className="summary-meta">Action required</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon green"><Icon name="check" /></div>
          <div className="summary-label">Closed</div>
          <strong className="summary-value">{closedCount}</strong>
          <span className="summary-meta">Resolved issues</span>
        </article>
      </section>

      <section className="card full-orders issue-log-card">
        <div className="section-head issue-toolbar">
          <div>
            <h2>Issue List</h2>
            <p>Filter by status, category, customer, machine, or part code.</p>
          </div>
          <div className="issue-filters">
            <label>
              <span className="sr-only">Search issues</span>
              <input value={query} onChange={(event) => { setQuery(event.target.value); pagination.resetPage(); }} placeholder="Search issues..." />
            </label>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "all" | IssueStatus); pagination.resetPage(); }}>
              <option value="all">All statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); pagination.resetPage(); }}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap issue-table-wrap">
          <table className="issue-table">
            <colgroup>
              <col className="issue-col-actions" />
              <col className="issue-col-status" />
              <col className="issue-col-code" />
              <col className="issue-col-source" />
              <col className="issue-col-error" />
              <col className="issue-col-designer" />
              <col className="issue-col-category" />
              <col className="issue-col-target" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="issue-actions-cell">Action</th>
                <th scope="col" className="issue-status-cell">Status</th>
                <th scope="col">PSR / Code</th>
                <th scope="col">Customer &amp; Product</th>
                <th scope="col">Error</th>
                <th scope="col">Designer</th>
                <th scope="col">Category</th>
                <th scope="col">Deadline for Revision</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((issue) => (
                <tr key={issue.id}>
                  <td className="issue-actions-cell">
                    <div className="table-actions issue-actions">
                      <button type="button" className="table-action" aria-label={`View details and history for issue ${issue.id}`} title="View details" onClick={() => setDetailIssue(issue)}><Icon name="eye" size={16} /></button>
                      <button type="button" className="table-action" aria-label={`Edit issue ${issue.id}`} onClick={() => openEdit(issue)}><Icon name="pen" size={16} /></button>
                    </div>
                  </td>
                  <td className="issue-status-cell"><Badge tone={issue.status === "Open" ? "warning" : "success"}>{issue.status}</Badge></td>
                  <td>{issue.projectCode || issue.partCode || "-"}</td>
                  <td className="issue-source-cell">
                    <strong>{issue.source}</strong>
                    <span>{issue.productDescription || "-"}</span>

                  </td>
                  <td className="issue-error-cell">{issue.errorDescription || "-"}</td>
                  <td>{orders.find(order => order.id === issue.incomingDesignId)?.pic || issue.preparedBy || "-"}</td>
                  <td className="issue-category-cell">{issue.category}</td>
                  <td className="issue-target-cell">{toDateLabel(issue.targetDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalItems === 0 ? (
            <div className="empty-state"><div><Icon name="search" /></div><h3>No issues found</h3><p>Adjust the filters or add a new issue.</p></div>
          ) : null}
        </div>
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="issues"
          onPageChange={pagination.goToPage}
        />
      </section>

      {isFormOpen ? <IssueFormModal editing={editing} onClose={() => { setEditing(null); setIsFormOpen(false); }} onSaved={() => { pagination.resetPage(); setToastMessage("Issue saved successfully."); }} /> : null}
      {toastMessage ? <div className="toast-message" role="status">{toastMessage}</div> : null}

      {detailIssue ? <IssueDetailModal issue={detailIssue} onClose={() => setDetailIssue(null)} /> : null}
    </>
  );
}
