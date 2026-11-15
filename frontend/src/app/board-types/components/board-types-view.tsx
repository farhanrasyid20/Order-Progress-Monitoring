"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  boardCategories,
  getBoardTypeLayers,
  useBoardTypes,
  type BoardType,
  type BoardTypeDraft,
} from "@/components/board-types/board-types-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

const emptyDraft: BoardTypeDraft = { name: "", category: "Single Wall", fluteType: "" };

function BoardTypeFormModal({ boardType, onClose, onSave }: {
  boardType: BoardType | null;
  onClose: () => void;
  onSave: (draft: BoardTypeDraft) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState<BoardTypeDraft>(() => boardType
    ? { name: boardType.name, category: boardType.category, fluteType: boardType.fluteType }
    : emptyDraft);
  const isDuplex = draft.category === "Duplex/Paperboard";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...draft, name: draft.name.trim(), fluteType: isDuplex ? "" : draft.fluteType.trim().toUpperCase() });
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div><h2 id={titleId}>{boardType ? "Edit Board Type" : "Add Board Type"}</h2><p>Set the category and flute configuration for project materials.</p></div>
        <button type="button" className="modal-close" aria-label="Close board type form" onClick={onClose}><Icon name="close" size={18} /></button>
      </header>
      <form className="modal-form" onSubmit={submit}>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Option Name</span><input autoFocus required value={draft.name} placeholder="Example: Single B" onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="modal-field"><span>Category</span><select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as BoardTypeDraft["category"] }))}>{boardCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label className="modal-field"><span>Flute Type</span><input required={!isDuplex} disabled={isDuplex} value={draft.fluteType} placeholder={isDuplex ? "Not applicable" : "Example: B or BC"} onChange={(event) => setDraft((current) => ({ ...current, fluteType: event.target.value.toUpperCase() }))} /></label>
          <label className="modal-field"><span>Material Layers</span><input readOnly value={getBoardTypeLayers(draft.category).length + " layers"} /></label>
        </div>
        <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon={boardType ? "save" : "plus"}>{boardType ? "Save Changes" : "Add Board Type"}</Button></footer>
      </form>
    </section>
  </div>;
}

function DeactivateBoardTypeModal({ boardType, onClose, onConfirm }: { boardType: BoardType; onClose: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  return <dialog ref={dialogRef} className="modal-dialog delete-user-dialog" aria-labelledby={titleId} onCancel={onClose} onClose={onClose}>
    <header className="modal-header"><div><h2 id={titleId}>Deactivate Board Type</h2><p>This preserves historical project data.</p></div><button type="button" className="modal-close" aria-label="Close deactivate dialog" onClick={onClose}><Icon name="close" size={18} /></button></header>
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onConfirm(); }}><p>Deactivate <strong>{boardType.name}</strong>? It will no longer be available for new projects, but projects that already use it remain intact.</p><footer className="modal-actions"><Button type="button" variant="secondary" autoFocus onClick={onClose}>Cancel</Button><Button type="submit" icon="trash" className="user-delete-confirm">Deactivate</Button></footer></form>
  </dialog>;
}

export function BoardTypesView() {
  const { boardTypes, canManageBoardTypes, saveBoardType, deactivateBoardType } = useBoardTypes();
  const [editing, setEditing] = useState<BoardType | null>(null);
  const [adding, setAdding] = useState(false);
  const [deactivating, setDeactivating] = useState<BoardType | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BoardType["category"] | "">("");
  const [status, setStatus] = useState<BoardType["status"] | "">("");
  const activeCount = boardTypes.filter((boardType) => boardType.status === "Active").length;
  const filteredBoardTypes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return boardTypes.filter((boardType) =>
      (!normalizedQuery || boardType.name.toLowerCase().includes(normalizedQuery) || boardType.fluteType.toLowerCase().includes(normalizedQuery)) &&
      (!category || boardType.category === category) &&
      (!status || boardType.status === status),
    );
  }, [boardTypes, category, query, status]);

  if (!canManageBoardTypes) return null;

  return <>
    <div className="page-intro"><div><h1>Board Type Management</h1><p>Manage board type options used by project material specifications.</p></div><Button type="button" icon="plus" onClick={() => setAdding(true)}>Add Board Type</Button></div>
    <div className="filter-card card">
      <label className="search-field">
        <Icon name="search" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search option name or flute type..." aria-label="Search board types" />
      </label>
      <select value={category} onChange={(event) => setCategory(event.target.value as BoardType["category"] | "")} aria-label="Filter by category">
        <option value="">Category: All</option>
        {boardCategories.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value as BoardType["status"] | "")} aria-label="Filter by status">
        <option value="">Status: All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>
    <section className="card users-card" aria-labelledby="board-types-title"><div className="section-head"><div><h2 id="board-types-title">Board Types</h2><p>{boardTypes.length} board types &middot; {activeCount} active</p></div></div>
      <div className="table-wrap"><table className="users-table"><thead><tr><th>Option Name</th><th>Category</th><th>Flute Type</th><th>Material Layers</th><th>Status</th><th className="users-action-cell">Action</th></tr></thead><tbody>
        {filteredBoardTypes.map((boardType) => <tr key={boardType.id}><td><strong className="user-name">{boardType.name}</strong></td><td>{boardType.category}</td><td>{boardType.fluteType || "-"}</td><td>{getBoardTypeLayers(boardType.category).length}</td><td><Badge tone={boardType.status === "Active" ? "success" : "warning"}>{boardType.status}</Badge></td><td className="users-action-cell"><div className="table-actions"><button type="button" className="table-action user-edit-action" aria-label={`Edit ${boardType.name}`} title={`Edit ${boardType.name}`} onClick={() => setEditing(boardType)}><Icon name="pen" size={15} /></button>{boardType.status === "Active" ? <button type="button" className="table-action user-delete-action" aria-label={`Deactivate ${boardType.name}`} title={`Deactivate ${boardType.name}`} onClick={() => setDeactivating(boardType)}><Icon name="trash" size={15} /></button> : null}</div></td></tr>)}
        {!filteredBoardTypes.length ? <tr><td colSpan={6}>No board types found.</td></tr> : null}
      </tbody></table></div>
    </section>
    {adding ? <BoardTypeFormModal boardType={null} onClose={() => setAdding(false)} onSave={(draft) => { saveBoardType(draft); setAdding(false); }} /> : null}
    {editing ? <BoardTypeFormModal boardType={editing} onClose={() => setEditing(null)} onSave={(draft) => { saveBoardType(draft, editing.id); setEditing(null); }} /> : null}
    {deactivating ? <DeactivateBoardTypeModal boardType={deactivating} onClose={() => setDeactivating(null)} onConfirm={() => { deactivateBoardType(deactivating.id); setDeactivating(null); }} /> : null}
  </>;
}
