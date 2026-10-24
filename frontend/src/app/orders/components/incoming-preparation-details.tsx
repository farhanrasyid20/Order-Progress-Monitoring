"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { StandaloneRequirementModal } from "@/app/converting/components/standalone-requirement-modal";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { canUpdateDrawingStatus } from "@/lib/permissions";
import { drawingStatusOptions, getDrawingStatus } from "@/lib/drawing-status";
import type {
  Order,
  DrawingStatus,
  PreparationOrderSelection,
  PreparationRoute,
  PreparationWorkflowUpdate,
} from "@/types/order";

type PreparationDraft = PreparationWorkflowUpdate;

export type IncomingPreparationDetailsProps = {
  order: Order;
  onCancel: (order: Order) => void;
  onUpdatePreparation: (
    orderNo: string,
    values: PreparationWorkflowUpdate,
  ) => void;
};

const routeOptions: readonly { value: PreparationRoute; label: string }[] = [
  { value: "by_design", label: "Preparation: By Design" },
  { value: "by_production", label: "Preparation: By Production" },
  { value: "offset", label: "Preparation: Offset" },
];

const productionOrderOptions: readonly {
  value: PreparationOrderSelection;
  label: string;
}[] = [
  { value: "tooling", label: "Preparation: Order Tooling" },
  { value: "rubber", label: "Preparation: Order Rubber" },
  {
    value: "tooling_and_rubber",
    label: "Preparation: Order Tooling & Rubber",
  },
];

function draftFromOrder(order: Order): PreparationDraft {
  return {
    route:
      order.workflow.preparationType === "offset"
        ? "offset"
        : order.workflow.convertingRoute ?? "by_design",
    productionOrder: order.workflow.productionOrder,
    materialRequested: order.workflow.materialRequested,
    remark: "",
  };
}

function isPreparationOrder(order: Order) {
  return order.stage === "order";
}

function canSelectProductionOrder(draft: PreparationDraft) {
  return draft.route === "by_production" && draft.materialRequested;
}

function canEnterRemark(draft: PreparationDraft) {
  return draft.route === "by_production"
    ? Boolean(draft.materialRequested && draft.productionOrder)
    : draft.materialRequested;
}

function finalPreparationStatus(order: Order, draft: PreparationDraft) {
  if (
    order.workflow.currentStatus === "cancelled" ||
    !isPreparationOrder(order)
  ) {
    return order.status;
  }

  if (draft.route === "by_production" && draft.productionOrder) {
    return productionOrderOptions.find(
      (option) => option.value === draft.productionOrder,
    )?.label ?? order.status;
  }

  return draft.materialRequested ? "Preparation: Request Material" : order.status;
}

export function IncomingPreparationDetails({ order, onCancel, onUpdatePreparation }: IncomingPreparationDetailsProps) {
  const { currentUserRole, updateDrawingStatus } = useWorkflowOrders();
  const [drafts, setDrafts] = useState<Record<string, PreparationDraft>>({});
  const [toolingProject, setToolingProject] = useState<Order | null>(null);

  const draftFor = (order: Order) => drafts[order.no] ?? draftFromOrder(order);

  const updateDraft = (order: Order, patch: Partial<PreparationDraft>) => {
    setDrafts((current) => ({
      ...current,
      [order.no]: {
        ...(current[order.no] ?? draftFromOrder(order)),
        ...patch,
      },
    }));
  };

  const handleUpdate = (order: Order, draft: PreparationDraft) => {
    onUpdatePreparation(order.id, draft);

    setDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[order.no];
      return nextDrafts;
    });
  };

  const draft = draftFor(order);
  const isCancelled = order.workflow.currentStatus === "cancelled";
  const isPreparation = isPreparationOrder(order);
  const productionOrderAvailable =
    canSelectProductionOrder(draft);
  const remarkAvailable = isPreparation && canEnterRemark(draft);
  const canUpdatePreparation =
    !isCancelled &&
    isPreparation &&
    draft.materialRequested &&
    (draft.route !== "by_production" || Boolean(draft.productionOrder)) &&
    remarkAvailable &&
    Boolean(draft.remark.trim());
  const canCancel = !isCancelled && isPreparation;

  const showProductionOrder = Boolean(draft.productionOrder) || canSelectProductionOrder(draft);

  return <section className="project-form-section">
    <div className="project-form-section-heading"><h3>Status &amp; Preparation</h3></div>
    <div className="modal-form-grid">
      <div className="modal-field"><span>Preparation</span>
        <select
          className="preparation-select"
          value={draftFromOrder(order).route}
          aria-label={`Preparation route for ${order.no}`}
          disabled
        >
          {routeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field"><span>Next Preparation</span>
        <select
          className="preparation-select"
          value={draft.materialRequested ? "requested" : ""}
          aria-label={`Select material request for ${order.no}`}
          disabled={isCancelled || !isPreparation}
          onChange={(event) =>
            updateDraft(order, {
              materialRequested: event.target.value === "requested",
              productionOrder: null,
              toolingRequirement: undefined,
              rubberRequirement: undefined,
              remark: "",
            })
          }
        >
          <option value="">Select next step...</option>
          <option value="requested">Preparation: Request Material</option>
        </select>
      </div>
      {showProductionOrder ? (
        <div className="modal-field"><span>Preparation Order</span>
          {productionOrderAvailable ? (
            <div className="preparation-order-controls">
            <select
              className="preparation-select"
              value={draft.productionOrder ?? ""}
              aria-label={`Select production order for ${order.no}`}
              disabled={isCancelled || !isPreparation}
              onChange={(event) =>
                updateDraft(order, {
                  productionOrder:
                    (event.target.value as PreparationOrderSelection) || null,
                  remark: "",
                  toolingRequirement: undefined,
                  rubberRequirement: undefined,
                })
              }
            >
              <option value="">Select an order...</option>
              {productionOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {draft.productionOrder === "tooling" || draft.productionOrder === "rubber" || draft.productionOrder === "tooling_and_rubber" ? (
              <button type="button" className="table-action" disabled={isCancelled || !isPreparation} aria-label={`Add ${draft.productionOrder} for ${order.no}`} title={`Add or edit ${draft.productionOrder} details`} onClick={() => setToolingProject(order)}>
                <Icon name={(draft.productionOrder === "tooling_and_rubber" ? draft.toolingRequirement && draft.rubberRequirement : draft.productionOrder === "tooling" ? draft.toolingRequirement : draft.rubberRequirement) ? "check" : "plus"} size={16} />
              </button>
            ) : null}
            </div>
          ) : (
            <span className="preparation-empty">Complete Request Material first</span>
          )}
        </div>
      ) : null}
      {remarkAvailable ? (
        <div className="modal-field"><span>Remarks</span>
          {remarkAvailable ? (
            <input
              className="preparation-remark"
              value={draft.remark}
              aria-label={`Write remarks for ${order.no}`}
              placeholder="Write a remark..."
              disabled={isCancelled}
              onChange={(event) =>
                updateDraft(order, { remark: event.target.value })
              }
            />
          ) : (
            <span className="preparation-empty">Complete previous step</span>
          )}
        </div>
      ) : null}
      <div className="modal-field">
        <span>Drawing Status</span>
        {canUpdateDrawingStatus(currentUserRole) ? (
          <select className="preparation-select" aria-label={`Drawing status for ${order.no}`} value={getDrawingStatus(order)} disabled={isCancelled} onChange={(event) => updateDrawingStatus(order.id, event.target.value as DrawingStatus)}>
            {drawingStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <Badge tone={drawingStatusOptions.find((option) => option.value === getDrawingStatus(order))?.tone}>{drawingStatusOptions.find((option) => option.value === getDrawingStatus(order))?.label}</Badge>
        )}
      </div>
    </div>
    <div className="incoming-detail-actions">
      <Badge tone={order.tone}>{finalPreparationStatus(order, draft)}</Badge>
      <button
        type="button"
        className="table-update-button"
        disabled={!canUpdatePreparation}
        title={
          canUpdatePreparation
            ? "Save preparation and move the project forward"
            : "Complete the required preparation steps and remarks first"
        }
        onClick={() => handleUpdate(order, draft)}
      >
        <Icon name="save" size={14} />
        Update
      </button>
      <button
        type="button"
        className="table-cancel-button"
        disabled={!canCancel}
        title={
          isCancelled
            ? "This project has already been cancelled"
            : !isPreparation
              ? "Only incoming projects can be cancelled"
            : "Cancel this project"
        }
        onClick={() => onCancel(order)}
      >
        <Icon name="close" size={14} />
        Cancel
      </button>
    </div>
      {toolingProject ? (
        <StandaloneRequirementModal
          kind={draftFor(toolingProject).productionOrder === "rubber" ? "rubber" : "tooling"}
          project={toolingProject}
          combined={draftFor(toolingProject).productionOrder === "tooling_and_rubber"}
          initialRubberRequirement={draftFor(toolingProject).rubberRequirement}
          onSaveCombined={(toolingRequirement, rubberRequirement) => updateDraft(toolingProject, { toolingRequirement, rubberRequirement })}
          initialRequirement={draftFor(toolingProject).productionOrder === "rubber" ? draftFor(toolingProject).rubberRequirement : draftFor(toolingProject).toolingRequirement}
          onSaveRequirement={(requirement) => updateDraft(toolingProject, draftFor(toolingProject).productionOrder === "rubber" ? { rubberRequirement: requirement } : { toolingRequirement: requirement })}
          onClose={() => setToolingProject(null)}
        />
      ) : null}
  </section>;
}
