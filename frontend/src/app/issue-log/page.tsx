"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";

type IssueStatus = "Open" | "Closed";

type IssueHistory = {
  date: string;
  user: string;
  summary: string;
};

type IssueRecord = {
  id: number;
  source: string;
  partCode: string;
  productDescription: string;
  dateFound: string;
  errorDescription: string;
  category: string;
  preparedBy: string;
  foundBy: string;
  action: string;
  targetDate: string;
  status: IssueStatus;
  dateClosed: string;
  remark: string;
  history: IssueHistory[];
};

const categories = [
  "Missing Element / Asset",
  "Typo / Spelling",
  "Size / Dimension",
  "QR tidak bisa scan",
  "Alignment / Spacing",
  "Font / Typography",
  "Branding Consistency",
  "Error Machine",
  "Wrong Printing Position",
] as const;

const initialIssues: IssueRecord[] = [
  {
    id: 1,
    source: "SANIPAK INDONESIA. PT",
    partCode: "CML40",
    productDescription: "Printed RSC Box",
    dateFound: "2026-05-10",
    errorDescription: "Missing Drawing",
    category: "Missing Element / Asset",
    preparedBy: "M. Ihsan",
    foundBy: "Customer",
    action: "3 layer checking (self, peer, superior)",
    targetDate: "2026-05-18",
    status: "Closed",
    dateClosed: "2026-05-18",
    remark: "Customer approval",
    history: [{ date: "2026-05-10T08:00:00.000Z", user: "M. Ihsan", summary: "Issue created." }],
  },
  {
    id: 2,
    source: "Allied Telesis",
    partCode: "595-001446 Rev. B",
    productDescription: "Printed RSC Box",
    dateFound: "2026-05-25",
    errorDescription: "Typo Inside Measure",
    category: "Typo / Spelling",
    preparedBy: "Safar",
    foundBy: "Dervin",
    action: "3 layer checking (self, peer, superior)",
    targetDate: "2026-05-25",
    status: "Closed",
    dateClosed: "2026-05-25",
    remark: "",
    history: [{ date: "2026-05-25T08:00:00.000Z", user: "Safar", summary: "Issue created." }],
  },
  {
    id: 3,
    source: "Machine digital cutting",
    partCode: "-",
    productDescription: "-",
    dateFound: "2026-09-28",
    errorDescription: "Error Machine",
    category: "Error Machine",
    preparedBy: "Ade",
    foundBy: "Ade",
    action: "Vacuum engine leak",
    targetDate: "",
    status: "Open",
    dateClosed: "",
    remark: "",
    history: [{ date: "2026-09-28T08:00:00.000Z", user: "Ade", summary: "Issue created." }],
  },
];

const emptyIssue = (): Omit<IssueRecord, "id" | "history"> => ({
  source: "",
  partCode: "",
  productDescription: "",
  dateFound: "",
  errorDescription: "",
  category: categories[0],
  preparedBy: "",
  foundBy: "",
  action: "",
  targetDate: "",
  status: "Open",
  dateClosed: "",
  remark: "",
});

function toDateLabel(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB").format(date);
}

/** Standalone log for drawing and machine issues sourced from the error-log workbook. */
export default function IssueLogPage() {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<IssueRecord | null>(null);
  const [form, setForm] = useState<Omit<IssueRecord, "id" | "history">>(emptyIssue);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState<IssueRecord | null>(null);

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesQuery = !normalizedQuery || [
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
    setForm(emptyIssue());
    setIsFormOpen(true);
  };

  const openEdit = (issue: IssueRecord) => {
    setEditing(issue);
    setForm({
      source: issue.source,
      partCode: issue.partCode,
      productDescription: issue.productDescription,
      dateFound: issue.dateFound,
      errorDescription: issue.errorDescription,
      category: issue.category,
      preparedBy: issue.preparedBy,
      foundBy: issue.foundBy,
      action: issue.action,
      targetDate: issue.targetDate,
      status: issue.status,
      dateClosed: issue.dateClosed,
      remark: issue.remark,
    });
    setIsFormOpen(true);
  };

  const updateForm = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const user = form.preparedBy || "Current user";

    if (editing) {
      setIssues((current) => current.map((issue) =>
        issue.id === editing.id
          ? {
              ...issue,
              ...form,
              history: [
                ...issue.history,
                {
                  date: now,
                  user,
                  summary: `Issue updated. Status: ${issue.status} to ${form.status}.`,
                },
              ],
            }
          : issue,
      ));
    } else {
      setIssues((current) => [
        {
          id: Math.max(0, ...current.map((issue) => issue.id)) + 1,
          ...form,
          history: [{ date: now, user, summary: "Issue created." }],
        },
        ...current,
      ]);
    }

    setEditing(null);
    setForm(emptyIssue());
    setIsFormOpen(false);
    pagination.resetPage();
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Issue Log</h1>
          <p>Catat error desain, customer, maupun mesin beserta tindakan koreksi dan history-nya.</p>
        </div>
        <Button icon="plus" onClick={openCreate}>Tambah Issue</Button>
      </div>

      <section className="summary-grid process-summary">
        <article className="summary-card">
          <div className="summary-icon blue"><Icon name="alert" /></div>
          <div className="summary-label">Total Issue</div>
          <strong className="summary-value">{issues.length}</strong>
          <span className="summary-meta">Semua sumber</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon blue"><Icon name="clock" /></div>
          <div className="summary-label">Open</div>
          <strong className="summary-value">{openCount}</strong>
          <span className="summary-meta">Butuh tindakan</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon green"><Icon name="check" /></div>
          <div className="summary-label">Closed</div>
          <strong className="summary-value">{closedCount}</strong>
          <span className="summary-meta">Sudah ditutup</span>
        </article>
      </section>

      <section className="card full-orders issue-log-card">
        <div className="section-head issue-toolbar">
          <div>
            <h2>Daftar Issue</h2>
            <p>Filter berdasarkan status, kategori, customer, mesin, atau part code.</p>
          </div>
          <div className="issue-filters">
            <label>
              <span className="sr-only">Cari issue</span>
              <input value={query} onChange={(event) => { setQuery(event.target.value); pagination.resetPage(); }} placeholder="Cari issue..." />
            </label>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "all" | IssueStatus); pagination.resetPage(); }}>
              <option value="all">Semua status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); pagination.resetPage(); }}>
              <option value="all">Semua kategori</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap issue-table-wrap">
          <table className="issue-table">
            <colgroup>
              <col className="issue-col-number" />
              <col className="issue-col-source" />
              <col className="issue-col-code" />
              <col className="issue-col-error" />
              <col className="issue-col-category" />
              <col className="issue-col-target" />
              <col className="issue-col-status" />
              <col className="issue-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Source / Customer</th>
                <th scope="col">Part Code</th>
                <th scope="col">Error</th>
                <th scope="col">Category</th>
                <th scope="col">Target</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.id}</td>
                  <td className="issue-source-cell"><strong>{issue.source}</strong><span>{issue.productDescription || "-"}</span></td>
                  <td>{issue.partCode || "-"}</td>
                  <td className="issue-error-cell">{issue.errorDescription}</td>
                  <td className="issue-category-cell">{issue.category}</td>
                  <td>{toDateLabel(issue.targetDate)}</td>
                  <td><Badge tone={issue.status === "Open" ? "warning" : "success"}>{issue.status}</Badge></td>
                  <td>
                    <div className="table-actions issue-actions">
                      <button type="button" className="table-action" aria-label={`View history for issue ${issue.id}`} onClick={() => setShowHistory(issue)}><Icon name="clock" size={16} /></button>
                      <button type="button" className="table-action" aria-label={`Edit issue ${issue.id}`} onClick={() => openEdit(issue)}><Icon name="pen" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalItems === 0 ? (
            <div className="empty-state"><div><Icon name="search" /></div><h3>Tidak ada issue</h3><p>Ubah filter atau tambah issue baru.</p></div>
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

      {isFormOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setEditing(null);
            setForm(emptyIssue());
            setIsFormOpen(false);
          }
        }}>
          <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="issue-form-title">
            <header className="modal-header">
              <div><h2 id="issue-form-title">{editing ? "Update Issue" : "Tambah Issue"}</h2><p>Setiap penyimpanan akan menambah event pada history issue.</p></div>
              <button type="button" className="modal-close" aria-label="Tutup formulir issue" onClick={() => { setEditing(null); setForm(emptyIssue()); setIsFormOpen(false); }} autoFocus><Icon name="close" size={18} /></button>
            </header>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="modal-form-grid">
                <label className="modal-field"><span>Source / Customer / Machine</span><input value={form.source} onChange={(event) => updateForm("source", event.target.value)} required /></label>
                <label className="modal-field"><span>Part No / Code</span><input value={form.partCode} onChange={(event) => updateForm("partCode", event.target.value)} /></label>
                <label className="modal-field"><span>Description</span><input value={form.productDescription} onChange={(event) => updateForm("productDescription", event.target.value)} /></label>
                <label className="modal-field"><span>Date Found</span><input type="date" value={form.dateFound} onChange={(event) => updateForm("dateFound", event.target.value)} required /></label>
                <label className="modal-field modal-field-full"><span>Description of Error</span><textarea value={form.errorDescription} onChange={(event) => updateForm("errorDescription", event.target.value)} rows={2} required /></label>
                <label className="modal-field"><span>Type of Error</span><select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="modal-field"><span>Prepared By</span><input value={form.preparedBy} onChange={(event) => updateForm("preparedBy", event.target.value)} required /></label>
                <label className="modal-field"><span>Found By</span><input value={form.foundBy} onChange={(event) => updateForm("foundBy", event.target.value)} required /></label>
                <label className="modal-field"><span>Target Date</span><input type="date" value={form.targetDate} onChange={(event) => updateForm("targetDate", event.target.value)} /></label>
                <label className="modal-field"><span>Status</span><select value={form.status} onChange={(event) => updateForm("status", event.target.value as IssueStatus)}><option>Open</option><option>Closed</option></select></label>
                <label className="modal-field"><span>Date Closed</span><input type="date" value={form.dateClosed} onChange={(event) => updateForm("dateClosed", event.target.value)} disabled={form.status !== "Closed"} /></label>
                <label className="modal-field modal-field-full"><span>Action / Correction</span><textarea value={form.action} onChange={(event) => updateForm("action", event.target.value)} rows={2} required /></label>
                <label className="modal-field modal-field-full"><span>Remark</span><textarea value={form.remark} onChange={(event) => updateForm("remark", event.target.value)} rows={2} /></label>
              </div>
              <footer className="modal-actions"><Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyIssue()); setIsFormOpen(false); }}>Batal</Button><Button type="submit" icon="save">Simpan Issue</Button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {showHistory ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHistory(null); }}>
          <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="issue-history-title">
            <header className="modal-header"><div><h2 id="issue-history-title">Issue History #{showHistory.id}</h2><p>{showHistory.errorDescription}</p></div><button type="button" className="modal-close" aria-label="Tutup history issue" onClick={() => setShowHistory(null)} autoFocus><Icon name="close" size={18} /></button></header>
            <div className="history-list">
              {[...showHistory.history].reverse().map((history, index) => <article className="history-item" key={`${history.date}-${index}`}><div><strong>{history.summary}</strong><span>{history.user}</span></div><time>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(history.date))}</time></article>)}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
