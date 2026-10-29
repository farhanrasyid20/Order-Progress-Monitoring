"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { StandaloneRequirementModal } from "@/app/converting/components/standalone-requirement-modal";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { canUpdateDrawingStatus } from "@/lib/permissions";
import { drawingStatusOptions, getDrawingStatus } from "@/lib/drawing-status";
import { drawingDisplayName, drawingHref } from "@/lib/drawing-link";
import type {
  DrawingStatus,
  Order,
  PreparationOrderKind,
  PreparationRoute,
  PreparationWorkflowUpdate,
  RequirementRecord,
  RequirementUpdateValues,
} from "@/types/order";

/** Empty rows are only UI state. Persisted updates contain selected kinds. */
type PreparationDraft = Omit<PreparationWorkflowUpdate, "preparationOrders"> & {
  preparationOrders: Array<PreparationOrderKind | null>;
};

type RequirementEditor = { order: Order; kind: PreparationOrderKind };

export type IncomingPreparationDetailsProps = {
  order: Order;
  onCancel: (order: Order) => void;
  onUpdatePreparation: (orderNo: string, values: PreparationWorkflowUpdate) => void;
};

const routeOptions: readonly { value: PreparationRoute; label: string }[] = [
  { value: "by_design", label: "Converting: Design" },
  { value: "by_production", label: "Converting: Production" },
  { value: "offset", label: "Offset: Production" },
];

const preparationOrderOptions: readonly { value: PreparationOrderKind; label: string }[] = [
  { value: "tooling", label: "Order Tooling" },
  { value: "rubber", label: "Order Rubber" },
];

function valuesFromRecord(record: RequirementRecord | undefined): RequirementUpdateValues | undefined {
  if (!record) return undefined;
  const { sequence, ...values } = record;
  void sequence;
  return values;
}

function selectedOrdersFromWorkflow(order: Order): PreparationOrderKind[] {
  const stored = order.workflow.preparationOrders;
  if (stored?.length) return [...new Set(stored)];
  if (order.workflow.productionOrder === "tooling_and_rubber") return ["tooling", "rubber"];
  if (order.workflow.productionOrder === "tooling" || order.workflow.productionOrder === "rubber") return [order.workflow.productionOrder];
  return [];
}

function draftFromOrder(order: Order): PreparationDraft {
  const preparationOrders = selectedOrdersFromWorkflow(order);
  return {
    route: order.workflow.preparationType === "offset" ? "offset" : order.workflow.convertingRoute ?? "by_design",
    productionOrder: preparationOrders[0] ?? null,
    preparationOrders,
    materialRequested: order.workflow.materialRequested,
    remark: "",
    toolingRequirement: valuesFromRecord(order.toolingOrders.at(-1)),
    rubberRequirement: valuesFromRecord(order.rubberOrders.at(-1)),
  };
}

function isPreparationOrder(order: Order) {
  return order.stage === "order";
}

function requirementsEqual(left: RequirementUpdateValues | undefined, right: RequirementUpdateValues | undefined) {
  if (!left || !right) return left === right;
  return (Object.keys(left) as Array<keyof RequirementUpdateValues>).every((key) => left[key] === right[key]);
}

function kindLabel(kind: PreparationOrderKind) {
  return kind === "tooling" ? "Order Tooling" : "Order Rubber";
}

function finalPreparationStatus(order: Order, draft: PreparationDraft) {
  if (order.workflow.currentStatus === "cancelled" || !isPreparationOrder(order)) return order.status;
  if (draft.materialRequested) return "Request Material / Create MI";
  if (draft.route === "offset") return "Order Tooling / Plate";
  const selected = draft.preparationOrders.filter((kind): kind is PreparationOrderKind => Boolean(kind));
  if (selected.length === 2) return "Order Tooling & Order Rubber";
  if (selected[0]) return kindLabel(selected[0]);
  return draft.route === "by_design" ? "Under Design" : "Under Production";
}

function drawingNetworkPath(order: Order) {
  return (order.workflow as typeof order.workflow & { drawingNetworkPath?: string | null }).drawingNetworkPath;
}

/** Collects the plan only; operational detail remains in its route-specific menu. */
export function IncomingPreparationDetails({ order, onCancel, onUpdatePreparation }: IncomingPreparationDetailsProps) {
  const { currentUserRole, updateDrawingStatus, updateIncomingRequirementDetails } = useWorkflowOrders();
  const [drafts, setDrafts] = useState<Record<string, PreparationDraft>>({});
  const [requirementEditor, setRequirementEditor] = useState<RequirementEditor | null>(null);

  const draftFor = (currentOrder: Order) => drafts[currentOrder.no] ?? draftFromOrder(currentOrder);
  const updateDraft = (currentOrder: Order, patch: Partial<PreparationDraft>) => {
    setDrafts((current) => ({
      ...current,
      [currentOrder.no]: { ...(current[currentOrder.no] ?? draftFromOrder(currentOrder)), ...patch },
    }));
  };

  const draft = draftFor(order);
  const savedDraft = draftFromOrder(order);
  const hasChanges = draft.route !== savedDraft.route ||
    draft.materialRequested !== savedDraft.materialRequested ||
    draft.remark !== savedDraft.remark ||
    draft.preparationOrders.length !== savedDraft.preparationOrders.length ||
    draft.preparationOrders.some((kind, index) => kind !== savedDraft.preparationOrders[index]) ||
    !requirementsEqual(draft.toolingRequirement, savedDraft.toolingRequirement) ||
    !requirementsEqual(draft.rubberRequirement, savedDraft.rubberRequirement);
  const isCancelled = order.workflow.currentStatus === "cancelled";
  const isPreparation = isPreparationOrder(order);
  const preparationOrderLocked = !draft.materialRequested;
  const selectedKinds = draft.preparationOrders.filter((kind): kind is PreparationOrderKind => Boolean(kind));
  const hasIncompleteRow = draft.preparationOrders.some((kind) => !kind);
  const canAddPreparationOrder = draft.route === "by_production" && draft.preparationOrders.length < preparationOrderOptions.length && !hasIncompleteRow;
  const canUpdatePreparation = !isCancelled && isPreparation && !hasIncompleteRow && hasChanges;
  const updateTitle = isCancelled ? "This project has already been cancelled"
    : !isPreparation ? "Only new incoming projects can update their preparation plan"
    : hasIncompleteRow ? "Complete any empty preparation-order row first"
    : !hasChanges ? "Make changes before updating"
    : "Save the preparation plan and move the project to Progress Drawing";
  const networkPath = drawingNetworkPath(order);
  const savedDrawingHref = drawingHref(order.workflow.drawingLink, networkPath);

  const requirementFor = (kind: PreparationOrderKind) => kind === "tooling" ? draft.toolingRequirement : draft.rubberRequirement;
  const updatePreparationRow = (index: number, nextKind: PreparationOrderKind | null) => {
    const nextRows = [...draft.preparationOrders];
    const previousKind = nextRows[index];
    nextRows[index] = nextKind;
    updateDraft(order, {
      preparationOrders: nextRows,
      productionOrder: nextRows.find((kind): kind is PreparationOrderKind => Boolean(kind)) ?? null,
      toolingRequirement: previousKind === "tooling" && nextKind !== "tooling" ? undefined : draft.toolingRequirement,
      rubberRequirement: previousKind === "rubber" && nextKind !== "rubber" ? undefined : draft.rubberRequirement,
    });
  };

  const persistDraft = () => {
    if (!canUpdatePreparation) return;
    const preparationOrders = draft.preparationOrders.filter((kind): kind is PreparationOrderKind => Boolean(kind));
    onUpdatePreparation(order.id, { ...draft, preparationOrders, productionOrder: preparationOrders[0] ?? null });
    setDrafts((current) => {
      const next = { ...current };
      delete next[order.no];
      return next;
    });
  };
  const saveRequirementDetail = (
    kind: PreparationOrderKind,
    requirement: RequirementUpdateValues,
  ) => {
    if (isPreparation) {
      updateDraft(order, kind === "tooling"
        ? { toolingRequirement: requirement }
        : { rubberRequirement: requirement });
      return;
    }

    updateIncomingRequirementDetails(order.id, kind, requirement);
  };

  return <section className="project-form-section">
    <div className="project-form-section-heading"><h3>Status &amp; Preparation</h3></div>
    <div className="modal-form-grid">
      <div className="modal-field">
        <span>Production / Design</span>
        <select className="preparation-select" value={draft.route} aria-label={`Route for ${order.no}`} disabled>
          {routeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <label className="modal-field material-request-field">
        <span>Next Preparation</span>
        <select
          className="preparation-select"
          value={draft.materialRequested ? "requested" : ""}
          aria-label={`Select material request for ${order.no}`}
          disabled={isCancelled || !isPreparation}
          onChange={(event) => updateDraft(order, { materialRequested: event.target.value === "requested" })}
        >
          <option value="">Select next step...</option>
          <option value="requested">Request Material / Create MI</option>
        </select>
      </label>

      {draft.route === "by_production" ? <div className="modal-field modal-field-full">
        <span>Preparation Order</span>
        <div className="preparation-order-list is-compact">
          {draft.preparationOrders.map((kind, index) => {
            const detailSaved = kind ? Boolean(requirementFor(kind) || (kind === "tooling" ? order.toolingOrders.length : order.rubberOrders.length)) : false;
            return <div className="preparation-order-controls" key={`${kind ?? "empty"}-${index}`}>
              <select
                className="preparation-select"
                value={kind ?? ""}
                aria-label={`Preparation order ${index + 1} for ${order.no}`}
                disabled={isCancelled || !isPreparation || preparationOrderLocked || detailSaved}
                onChange={(event) => updatePreparationRow(index, (event.target.value as PreparationOrderKind) || null)}
              >
                <option value="">Select preparation order...</option>
                {preparationOrderOptions.map((option) => <option key={option.value} value={option.value} disabled={selectedKinds.includes(option.value) && option.value !== kind}>{option.label}</option>)}
              </select>
              {kind ? <button type="button" className="table-action" disabled={isCancelled || (isPreparation && preparationOrderLocked)} aria-label={`Edit ${kindLabel(kind)} for ${order.no}`} title={detailSaved ? `Edit ${kindLabel(kind)} detail` : `Add ${kindLabel(kind)} detail`} onClick={() => setRequirementEditor({ order, kind })}><Icon name="pen" size={15} /></button> : null}
              {!detailSaved ? <button type="button" className="table-action preparation-row-remove" disabled={isCancelled || !isPreparation} aria-label={`Remove preparation order ${index + 1}`} title="Remove preparation order" onClick={() => updateDraft(order, { preparationOrders: draft.preparationOrders.filter((_, rowIndex) => rowIndex !== index) })}><Icon name="close" size={14} /></button> : null}
            </div>;
          })}
          {canAddPreparationOrder ? <button type="button" className="preparation-add-button" disabled={isCancelled || !isPreparation || preparationOrderLocked} title={preparationOrderLocked ? "Select Next Preparation first" : undefined} onClick={() => updateDraft(order, { preparationOrders: [...draft.preparationOrders, null] })}><Icon name="plus" size={14} /> Add Preparation Order</button> : null}
          {preparationOrderLocked && isPreparation ? <span className="preparation-empty">Select Next Preparation before choosing or adding a preparation order.</span> : null}
          {!draft.preparationOrders.length ? <span className="preparation-empty">Tooling and Rubber are optional for Converting: Production.</span> : null}
        </div>
      </div> : null}

      <label className="modal-field">
        <span>Remarks</span>
        <input className="preparation-remark" value={draft.remark} aria-label={`Write remarks for ${order.no}`} placeholder="Write a remark..." disabled={isCancelled || !isPreparation} onChange={(event) => updateDraft(order, { remark: event.target.value })} />
      </label>

      <div className="modal-field">
        <span>Drawing Status</span>
        {canUpdateDrawingStatus(currentUserRole) ? <select className="preparation-select" aria-label={`Drawing status for ${order.no}`} value={getDrawingStatus(order)} disabled={isCancelled} onChange={(event) => updateDrawingStatus(order.id, event.target.value as DrawingStatus)}>{drawingStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Badge tone={drawingStatusOptions.find((option) => option.value === getDrawingStatus(order))?.tone}>{drawingStatusOptions.find((option) => option.value === getDrawingStatus(order))?.label}</Badge>}
        {savedDrawingHref ? <a className="drawing-link" href={savedDrawingHref} target="_blank" rel="noopener noreferrer"><Icon name="file" size={14} /> {drawingDisplayName(order.workflow.drawingFileName, networkPath)}</a> : null}
      </div>
    </div>

    <div className="incoming-detail-actions">
      <Badge tone={order.tone}>{finalPreparationStatus(order, draft)}</Badge>
      <button type="button" className="table-update-button" disabled={!canUpdatePreparation} title={updateTitle} onClick={persistDraft}><Icon name="save" size={14} /> Update</button>
      <button type="button" className="table-cancel-button" disabled={isCancelled || !isPreparation} title={isCancelled ? "This project has already been cancelled" : !isPreparation ? "Only new incoming projects can be cancelled" : "Cancel this project"} onClick={() => onCancel(order)}><Icon name="close" size={14} /> Cancel</button>
    </div>

    {requirementEditor ? <StandaloneRequirementModal kind={requirementEditor.kind} project={requirementEditor.order} initialRequirement={requirementFor(requirementEditor.kind)} saveImmediately={!isPreparation} onSaveRequirement={(requirement) => saveRequirementDetail(requirementEditor.kind, requirement)} onClose={() => setRequirementEditor(null)} /> : null}
  </section>;
}

export default IncomingPreparationDetails;
