"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { MaterialRequestStatus, Order } from "@/types/order";

export type MaterialRequestModalProps = {
  order: Order;
  onClose: () => void;
  offset?: boolean;
};

const statuses: readonly { value: MaterialRequestStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
  { value: "on_hold", label: "On Hold" },
];

export function MaterialRequestModal({ order, onClose, offset = false }: MaterialRequestModalProps) {
  const { orders } = useWorkflowOrders();
  const currentOrder = { ...(orders.find((item) => item.id === order.id) ?? order), materialRequestSource: order.materialRequestSource };

  return (
    <MaterialRequestForm
      key={`${currentOrder.id}-${currentOrder.materialRequestSource ?? "project"}-${currentOrder.materialRequests.length}`}
      order={currentOrder}
      onClose={onClose}
      offset={offset}
    />
  );
}

function MaterialRequestForm({ order, onClose, offset = false }: MaterialRequestModalProps) {
  const titleId = useId();
  const router = useRouter();
  const submitMode = useRef<"save" | "continue">("save");
  const { saveMaterialRequest } = useWorkflowOrders();
  const latest = order.materialRequests.filter((record) => record.source === order.materialRequestSource).at(-1);
  const [miNumber] = useState(
    latest?.miNumber ?? `${offset ? "OMI" : "MI"}-${order.no.replace("#", "-")}-${order.requirementBranch ? order.requirementBranch.toUpperCase() + "-" : ""}${order.materialRequests.length + 1}`,
  );
  const [status, setStatus] = useState<MaterialRequestStatus>(latest?.status ?? "draft");
  const [requestedBy] = useState(latest?.requestedBy ?? (order.pic === "-" ? "" : order.pic));
  const [requestDate, setRequestDate] = useState(latest?.requestDate ?? "");
  const [material, setMaterial] = useState(latest?.material ?? (order.material === "-" ? "" : order.material));
  const [quantity, setQuantity] = useState(latest?.quantity ?? "");
  const [unit, setUnit] = useState(latest?.unit ?? "sheet");
  const [remark, setRemark] = useState(latest?.remark ?? "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const canContinue =
    !offset || true;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const continueWorkflow = submitMode.current === "continue" && canContinue;
    saveMaterialRequest(
      order.id,
      {
        source: order.materialRequestSource,
        miNumber,
        status,
        requestedBy,
        requestDate,
        material,
        quantity,
        unit,
        remark,
      },
      continueWorkflow,
    );
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{offset ? "Offset Material / Create MI" : "Material Request / Create MI"}</h2>
            <p>Record material and MI details for project {order.no}.</p>
            {order.materialRequestSource ? <p>Source: {order.materialRequestSource === "tooling" ? "Tooling" : "Rubber"}</p> : null}
            <p>Use Save MI to save a draft. Complete all required fields before Save &amp; Continue.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close material request form"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field">
              <span>MI Number</span>
              <input value={miNumber} disabled />
            </label>
            <label className="modal-field">
              <span>MI Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MaterialRequestStatus)}
              >
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Requested By</span>
              <input value={requestedBy} disabled />
            </label>
            <label className="modal-field">
              <span>Request Date</span>
              <input type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input value={material} onChange={(event) => setMaterial(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Quantity</span>
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Unit</span>
              <input value={unit} onChange={(event) => setUnit(event.target.value)} required />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Specifications, priority, or material release notes"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              formNoValidate
              onClick={() => {
                submitMode.current = "save";
              }}
            >
              Save MI
            </Button>
            <Button
              type="submit"
              icon="arrow"
              disabled={!canContinue}
              title={canContinue ? undefined : "MI status must be Released or Received to continue"}
              onClick={() => {
                submitMode.current = "continue";
              }}
            >
              Save &amp; Continue
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
