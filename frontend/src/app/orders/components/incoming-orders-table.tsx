"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type {
  DesignDecision,
  Order,
  PreparationOrderSelection,
  PreparationRoute,
  PreparationWorkflowUpdate,
} from "@/types/order";

type PreparationDraft = PreparationWorkflowUpdate & {
  designDecision: DesignDecision | "";
};

export type IncomingOrdersTableProps = {
  orders: Order[];
  onShowDetails: (order: Order) => void;
  onCancel: (order: Order) => void;
  onUpdatePreparation: (
    orderNo: string,
    values: PreparationWorkflowUpdate,
  ) => void;
  onCompleteDesignDecision: (orderNo: string, decision: DesignDecision) => void;
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

const designDecisionOptions: readonly {
  value: DesignDecision;
  label: string;
}[] = [
  { value: "approve", label: "Preparation: Design Approve" },
  { value: "revision", label: "Preparation: Design Revision" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function draftFromOrder(order: Order): PreparationDraft {
  return {
    route:
      order.workflow.preparationType === "offset"
        ? "offset"
        : order.workflow.convertingRoute ?? "by_design",
    productionOrder: order.workflow.productionOrder,
    materialRequested: order.workflow.materialRequested,
    remark: "",
    designDecision: order.workflow.designDecision ?? "",
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

/**
 * Feature-owned table for the Design Masuk queue. Its preparation controls are
 * deliberately separate from the shared read-only workflow table.
 */
export function IncomingOrdersTable({
  orders,
  onShowDetails,
  onCancel,
  onUpdatePreparation,
  onCompleteDesignDecision,
}: IncomingOrdersTableProps) {
  const [drafts, setDrafts] = useState<Record<string, PreparationDraft>>({});

  const draftFor = (order: Order) => drafts[order.no] ?? draftFromOrder(order);
  const hasProductionOrderColumn = orders.some(
    (order) => isPreparationOrder(order) && canSelectProductionOrder(draftFor(order)),
  );
  const hasMaterialRequestColumn = orders.some(isPreparationOrder);
  const hasRemarkColumn = orders.some(
    (order) => isPreparationOrder(order) && canEnterRemark(draftFor(order)),
  );

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
    if (order.stage === "review-approval" && draft.designDecision) {
      onCompleteDesignDecision(order.no, draft.designDecision);
    } else {
      onUpdatePreparation(order.no, draft);
    }

    setDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[order.no];
      return nextDrafts;
    });
  };

  return (
    <div className="table-wrap">
      <table className="incoming-orders-table">
        <thead>
          <tr>
            <th>PSR / Code</th>
            <th>Customer &amp; Product</th>
            <th>Description</th>
            <th>Material</th>
            <th>Preparation</th>
            {hasMaterialRequestColumn ? <th>Next Preparation</th> : null}
            {hasProductionOrderColumn ? <th>Preparation Order</th> : null}
            {hasRemarkColumn ? <th>Remarks</th> : null}
            <th>Design Decision</th>
            <th>Current Process</th>
            <th>Designer</th>
            <th>Deadline</th>
            <th>Drawing Link</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const draft = draftFor(order);
            const isCancelled = order.workflow.currentStatus === "cancelled";
            const isPreparation = isPreparationOrder(order);
            const canMakeDesignDecision = Boolean(
              order.stage === "review-approval" && order.workflow.drawingLink,
            );
            const productionOrderAvailable =
              isPreparation && canSelectProductionOrder(draft);
            const remarkAvailable = isPreparation && canEnterRemark(draft);
            const canUpdatePreparation =
              !isCancelled &&
              isPreparation &&
              draft.materialRequested &&
              (draft.route !== "by_production" || Boolean(draft.productionOrder)) &&
              remarkAvailable &&
              Boolean(draft.remark.trim());
            const canUpdateDesignDecision =
              !isCancelled && canMakeDesignDecision && Boolean(draft.designDecision);
            const canUpdate = canUpdatePreparation || canUpdateDesignDecision;
            const canCancel = !isCancelled && isPreparation;

            return (
              <tr key={order.no}>
                <td>
                  <strong className="order-number">{order.no}</strong>
                </td>
                <td>
                  <strong>{order.customer}</strong>
                  <span>{order.product}</span>
                </td>
                <td>{order.description}</td>
                <td>{order.material}</td>
                <td className="preparation-cell">
                  {isPreparation ? (
                    <select
                      className="preparation-select"
                      value={draft.route}
                      aria-label={`Select preparation route for ${order.no}`}
                      disabled={isCancelled}
                      onChange={(event) =>
                        updateDraft(order, {
                          route: event.target.value as PreparationRoute,
                          productionOrder: null,
                          materialRequested: false,
                          remark: "",
                        })
                      }
                    >
                      {routeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="preparation-empty">-</span>
                  )}
                </td>
                {hasMaterialRequestColumn ? (
                  <td className="preparation-cell">
                    {isPreparation ? (
                      <select
                        className="preparation-select"
                        value={draft.materialRequested ? "requested" : ""}
                        aria-label={`Select material request for ${order.no}`}
                        disabled={isCancelled}
                        onChange={(event) =>
                          updateDraft(order, {
                            materialRequested: event.target.value === "requested",
                            productionOrder: null,
                            remark: "",
                          })
                        }
                      >
                        <option value="">Select next step...</option>
                        <option value="requested">Preparation: Request Material</option>
                      </select>
                    ) : (
                      <span className="preparation-empty">-</span>
                    )}
                  </td>
                ) : null}
                {hasProductionOrderColumn ? (
                  <td className="preparation-cell">
                    {productionOrderAvailable ? (
                      <select
                        className="preparation-select"
                        value={draft.productionOrder ?? ""}
                        aria-label={`Select production order for ${order.no}`}
                        disabled={isCancelled}
                        onChange={(event) =>
                          updateDraft(order, {
                            productionOrder:
                              (event.target.value as PreparationOrderSelection) || null,
                            remark: "",
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
                    ) : (
                      <span className="preparation-empty">Complete Request Material first</span>
                    )}
                  </td>
                ) : null}
                {hasRemarkColumn ? (
                  <td className="preparation-cell">
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
                  </td>
                ) : null}
                <td className="preparation-cell">
                  <select
                    className="preparation-select"
                    value={draft.designDecision}
                    aria-label={`Select design decision for ${order.no}`}
                    disabled={!canMakeDesignDecision || isCancelled}
                    onChange={(event) =>
                      updateDraft(order, {
                        designDecision: event.target.value as DesignDecision | "",
                      })
                    }
                  >
                    <option value="">Select a decision...</option>
                    {designDecisionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{order.process}</td>
                <td>
                  <div className="pic">
                    <span>{initials(order.pic)}</span>
                    {order.pic}
                  </div>
                </td>
                <td>{order.deadline}</td>
                <td>
                  {order.workflow.drawingLink ? (
                    <a
                      className="drawing-link"
                      href={order.workflow.drawingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Drawing ↗
                    </a>
                  ) : (
                    <span className="preparation-empty">No drawing link</span>
                  )}
                </td>
                <td>
                  <Badge tone={order.tone}>{finalPreparationStatus(order, draft)}</Badge>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-detail-button"
                      onClick={() => onShowDetails(order)}
                    >
                      <Icon name="eye" size={14} />
                      Details
                    </button>
                    <button
                      type="button"
                      className="table-update-button"
                      disabled={!canUpdate}
                      title={
                        canUpdateDesignDecision
                          ? "Save design decision and move the project forward"
                          : canUpdatePreparation
                          ? "Save preparation and move the project forward"
                          : canMakeDesignDecision
                            ? "Select Design Approve or Design Revision"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div>
            <Icon name="search" />
          </div>
          <h3>No projects found</h3>
          <p>Try adjusting the search or filters.</p>
        </div>
      ) : null}
    </div>
  );
}

export default IncomingOrdersTable;
