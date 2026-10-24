"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { isInRequirementQueue } from "@/lib/requirement-queue";
import type {
  ProjectPriority,
  RequirementStatus,
  StandaloneRequirementKind,
  Order,
  RequirementUpdateValues,
} from "@/types/order";

export type StandaloneRequirementModalProps = {
  kind: StandaloneRequirementKind;
  onClose: () => void;
  project?: Order;
  initialRequirement?: RequirementUpdateValues;
  onSaveRequirement?: (values: RequirementUpdateValues) => void;
  combined?: boolean;
  initialRubberRequirement?: RequirementUpdateValues;
  onSaveCombined?: (tooling: RequirementUpdateValues, rubber: RequirementUpdateValues) => void;
};

const toolingTypes = [
  "Auto Peeling",
  "Nikko",
  "Nikko Peeling",
  "Auto Haido",
  "Jinya",
  "TMZ",
  "Pulp Tray",
  "Rotary",
  "Baosika",
  "Manual",
] as const;

const rubberTypes = [
  "Rubber 7MM",
  "Rubber 4MM",
  "Rubber Dupon 3MM",
  "Rubber Varnish 1.7MM",
  "Stencil",
  "Test Run",
  "MC Check",
] as const;

const requirementStatuses: readonly { value: RequirementStatus; label: string }[] = [
  { value: "needed", label: "Needed" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "available", label: "Available / Existing" },
  { value: "on_hold", label: "On Hold" },
  { value: "repair", label: "Repair" },
  { value: "issue", label: "Issue / Reorder" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityOptions: readonly ProjectPriority[] = ["High", "Medium", "Low"];

/**
 * Creates a direct Tooling or Rubber requirement while preserving the normal
 * requirement fields used by the stage-specific update modals.
 */
export function StandaloneRequirementModal({
  kind,
  onClose,
  project,
  initialRequirement,
  onSaveRequirement,
  combined = false,
  initialRubberRequirement,
  onSaveCombined,
}: StandaloneRequirementModalProps) {
  const titleId = useId();
  const submitMode = useRef<"save" | "continue">("save");
  const { orders, createStandaloneRequirementOrder, saveToolingRequirement, saveRubberRequirement } = useWorkflowOrders();
  const [projectId, setProjectId] = useState(project?.id ?? "");
  const selectedProject = project ?? orders.find((order) => order.id === projectId);
  const isLinkedRequirement = kind === "tooling" || kind === "rubber";
  const eligibleProjects = orders.filter((order) => isInRequirementQueue(order, kind) && order.workflow.preparationType === "converting" && order.workflow.convertingRoute === "by_production" && (order.workflow.productionOrder === kind || order.workflow.productionOrder === "tooling_and_rubber"));
  const [error, setError] = useState("");
  const requirementTypes = kind === "tooling" ? toolingTypes : rubberTypes;
  const kindLabel = combined ? "Tooling & Rubber" : kind === "tooling" ? "Tooling" : "Rubber";
  const [rubberType, setRubberType] = useState(initialRubberRequirement?.requirementType ?? rubberTypes[0]);
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [partNo, setPartNo] = useState("");
  const [material, setMaterial] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("Medium");
  const [requestedBy, setRequestedBy] = useState(initialRequirement?.requestedBy ?? (project?.pic === "-" ? "" : project?.pic ?? ""));
  const [deadline, setDeadline] = useState("");
  const [requirementType, setRequirementType] = useState<string>(initialRequirement?.requirementType ?? requirementTypes[0]);
  const [status, setStatus] = useState<RequirementStatus>(initialRequirement?.status ?? "needed");
  const [orderDate, setOrderDate] = useState(initialRequirement?.orderDate ?? "");
  const [expectedDate, setExpectedDate] = useState(initialRequirement?.expectedDate ?? "");
  const [arrivalDate, setArrivalDate] = useState(initialRequirement?.arrivalDate ?? "");
  const [supplier, setSupplier] = useState(initialRequirement?.supplier ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(initialRequirement?.invoiceNumber ?? "");
  const [price, setPrice] = useState(initialRequirement?.price ?? "");
  const [remark, setRemark] = useState(initialRequirement?.remark ?? "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const canContinue = status === "received" || status === "available";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLinkedRequirement) {
      if (!selectedProject || (!project && !eligibleProjects.some((order) => order.id === selectedProject.id)) || selectedProject.workflow.currentStatus === "cancelled") {
        setError(`Select an active Order ${kindLabel} project.`);
        return;
      }
      if (!requestedBy.trim()) { setError("Order By / PIC is required."); return; }
      const requirement: RequirementUpdateValues = { requirementType, status, requestedBy: requestedBy.trim(), supplier, orderDate: orderDate || null, expectedDate: expectedDate || null, arrivalDate: arrivalDate || null, invoiceNumber, price, remark };
      if (combined && onSaveCombined) onSaveCombined(requirement, { ...requirement, requirementType: rubberType });
      else if (onSaveRequirement) onSaveRequirement(requirement);
      else (kind === "tooling" ? saveToolingRequirement : saveRubberRequirement)(selectedProject.no, requirement, submitMode.current === "continue" && canContinue);
      onClose();
      return;
    }

    createStandaloneRequirementOrder(
      kind,
      {
        customer,
        product,
        partNo,
        material,
        priority,
        pic: requestedBy,
        projectDate: orderDate,
        deadline,
        description: remark || "-",
        requirement: {
          requirementType,
          status,
          requestedBy,
          supplier,
          orderDate: orderDate || null,
          expectedDate: expectedDate || null,
          arrivalDate: arrivalDate || null,
          invoiceNumber,
          price,
          remark,
        },
      },
      submitMode.current === "continue" && canContinue,
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
      <section
        className="modal-dialog modal-dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Add {kindLabel}</h2>
            <p>{project ? `Enter ${kindLabel.toLowerCase()} details, then click Update in Incoming Design to submit the project.` : `Select an Order ${kindLabel} project from Incoming Design and enter requirement details.`}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label={`Close ${kindLabel.toLowerCase()} form`}
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            {isLinkedRequirement ? <>
              <label className="modal-field modal-field-full">
                <span>Incoming Design *</span>
                <select value={selectedProject?.id ?? ""} disabled={Boolean(project)} required onChange={(event) => {
                  setProjectId(event.target.value);
                  const selected = orders.find((order) => order.id === event.target.value);
                  setRequestedBy(selected?.pic === "-" ? "" : selected?.pic ?? "");
                  setError("");
                }}>
                  <option value="">Select Order {kindLabel} project...</option>
                  {(project ? [project] : eligibleProjects).map((order) => <option key={order.id} value={order.id}>{order.no} - {order.customer} - {order.product}</option>)}
                </select>
              </label>
              {!project && !eligibleProjects.length ? <p className="project-form-error">No active Order {kindLabel} projects available. Update the preparation in Incoming Design first.</p> : null}
              <label className="modal-field"><span>PSR / Code</span><input value={selectedProject?.no ?? ""} readOnly /></label>
            </> : null}
            <label className="modal-field">
              <span>Customer</span>
              <input value={isLinkedRequirement ? selectedProject?.customer ?? "" : customer} readOnly={isLinkedRequirement} onChange={(event) => setCustomer(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>{isLinkedRequirement ? "Product / Component" : "Produk / Komponen"}</span>
              <input value={isLinkedRequirement ? selectedProject?.product ?? "" : product} readOnly={isLinkedRequirement} onChange={(event) => setProduct(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={isLinkedRequirement ? selectedProject?.mainData.partNo ?? "" : partNo} readOnly={isLinkedRequirement} onChange={(event) => setPartNo(event.target.value)} required={!isLinkedRequirement} />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input value={isLinkedRequirement ? selectedProject?.material ?? "" : material} readOnly={isLinkedRequirement} onChange={(event) => setMaterial(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Priority</span>
              <select
                value={isLinkedRequirement ? selectedProject?.priority ?? "Medium" : priority}
                disabled={isLinkedRequirement}
                onChange={(event) => setPriority(event.target.value as ProjectPriority)}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Order By / PIC</span>
              <input
                value={requestedBy}
                disabled={combined}
                onChange={(event) => setRequestedBy(event.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span>{combined ? "Tooling" : kindLabel} Type</span>
              <select
                value={requirementType}
                onChange={(event) => setRequirementType(event.target.value)}
              >
                {requirementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            {combined ? <label className="modal-field">
              <span>Rubber Type</span>
              <select value={rubberType} onChange={(event) => setRubberType(event.target.value)}>
                {rubberTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label> : null}
            <label className="modal-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RequirementStatus)}
              >
                {requirementStatuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>{isLinkedRequirement ? "Order Date" : "Tanggal Order"}</span>
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>{isLinkedRequirement ? "Expected Arrival Date" : "Estimasi Datang"}</span>
              <input
                type="date"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>{isLinkedRequirement ? "Received Date" : "Tanggal Diterima"}</span>
              <input
                type="date"
                value={arrivalDate}
                onChange={(event) => setArrivalDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>Deadline</span>
              {isLinkedRequirement ? <input value={selectedProject?.deadline ?? ""} readOnly /> : <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />}
            </label>
            <label className="modal-field">
              <span>Supplier / Vendor</span>
              <input value={supplier} onChange={(event) => setSupplier(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Invoice Number</span>
              <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>{isLinkedRequirement ? "Price" : "Harga"}</span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder={isLinkedRequirement ? "Amount in IDR" : "Rp / nominal"}
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder={isLinkedRequirement ? "Requirement notes, supplier details, or order instructions" : "Catatan kebutuhan, supplier, atau instruksi order"}
                rows={3}
              />
            </label>
          </div>

          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              {isLinkedRequirement ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="submit"
              variant="secondary"
              onClick={() => {
                submitMode.current = "save";
              }}
            >
              Save {kindLabel}
            </Button>
            {!project ? <Button
              type="submit"
              icon="arrow"
              disabled={!canContinue}
              title={
                canContinue
                  ? undefined
                  : isLinkedRequirement ? "Status must be Received or Available to continue" : "Status harus Received atau Available untuk melanjutkan"
              }
              onClick={() => {
                submitMode.current = "continue";
              }}
            >
              {isLinkedRequirement ? "Save & Continue" : "Simpan & Lanjut"}
            </Button> : null}
          </footer>
          {error ? <p className="project-form-error" role="alert">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
