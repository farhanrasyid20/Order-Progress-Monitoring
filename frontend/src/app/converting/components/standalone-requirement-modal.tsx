"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { canRecordConvertingRequirement } from "@/lib/requirement-queue";
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
  /** The detail is already persisted in Incoming Design and can be saved directly. */
  saveImmediately?: boolean;
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
type RequirementEntryMode = "existing" | "manual";

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
  saveImmediately = false,
}: StandaloneRequirementModalProps) {
  const titleId = useId();
  const submitMode = useRef<"save" | "continue">("save");
  const { orders, createStandaloneRequirementOrder, saveToolingRequirement, saveRubberRequirement } = useWorkflowOrders();
  const [projectId, setProjectId] = useState(project?.id ?? "");
  const [entryMode, setEntryMode] = useState<RequirementEntryMode>("existing");
  const selectedProject = project ?? orders.find((order) => order.id === projectId);
  const usesExistingProject = Boolean(project) || entryMode === "existing";
  const eligibleProjects = orders.filter((order) => canRecordConvertingRequirement(order, kind));
  const [error, setError] = useState("");
  const requirementTypes = kind === "tooling" ? toolingTypes : rubberTypes;
  const kindLabel = kind === "tooling" ? "Tooling" : "Rubber";
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

    if (usesExistingProject) {
      if (!selectedProject || (!project && !eligibleProjects.some((order) => order.id === selectedProject.id)) || selectedProject.workflow.currentStatus === "cancelled") {
        setError(`Select an active Order ${kindLabel} project.`);
        return;
      }
      if (!requestedBy.trim()) { setError("Order By / PIC is required."); return; }
      const requirement: RequirementUpdateValues = { requirementType, status, requestedBy: requestedBy.trim(), supplier, orderDate: orderDate || null, expectedDate: expectedDate || null, arrivalDate: arrivalDate || null, invoiceNumber, price, remark };
      if (onSaveRequirement) onSaveRequirement(requirement);
      else (kind === "tooling" ? saveToolingRequirement : saveRubberRequirement)(selectedProject.id, requirement, submitMode.current === "continue" && canContinue);
      onClose();
      return;
    }

    if (!customer.trim() || !product.trim() || !requestedBy.trim()) {
      setError("Customer, product, and Order By / PIC are required for a manual order.");
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
            <h2 id={titleId}>{saveImmediately ? "Edit" : "Add"} {kindLabel}</h2>
            <p>{project
              ? saveImmediately
                ? `Edit ${kindLabel.toLowerCase()} details for this project. Changes save directly without changing its workflow stage.`
                : `Enter ${kindLabel.toLowerCase()} details, then click Update in Incoming Design to submit the project.`
              : usesExistingProject
                ? `Select a project code to add its ${kindLabel.toLowerCase()} details.`
                : `Enter the order manually when no project code exists yet. The system will generate an internal code after saving.`}</p>
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
            {!project ? <label className="modal-field modal-field-full">
              <span>Order Source</span>
              <select
                value={entryMode}
                onChange={(event) => {
                  const nextMode = event.target.value as RequirementEntryMode;
                  setEntryMode(nextMode);
                  if (nextMode === "manual") setProjectId("");
                  setError("");
                }}
              >
                <option value="existing">Existing project / PSR code</option>
                <option value="manual">No project code yet (manual entry)</option>
              </select>
            </label> : null}
            {usesExistingProject ? <>
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
              {!project && !eligibleProjects.length ? <p className="project-form-error">No active or repeat {kindLabel} projects are available. Add the first {kindLabel.toLowerCase()} order from Incoming Design first.</p> : null}
              <label className="modal-field"><span>PSR / Code</span><input value={selectedProject?.no ?? ""} readOnly /></label>
            </> : null}
            <label className="modal-field">
              <span>Customer</span>
              <input value={usesExistingProject ? selectedProject?.customer ?? "" : customer} readOnly={usesExistingProject} onChange={(event) => setCustomer(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Product / Component</span>
              <input value={usesExistingProject ? selectedProject?.product ?? "" : product} readOnly={usesExistingProject} onChange={(event) => setProduct(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>{usesExistingProject ? "Part Number / Code" : "Part Number / Reference (optional)"}</span>
              <input value={usesExistingProject ? selectedProject?.mainData.partNo ?? "" : partNo} readOnly={usesExistingProject} onChange={(event) => setPartNo(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input value={usesExistingProject ? selectedProject?.material ?? "" : material} readOnly={usesExistingProject} onChange={(event) => setMaterial(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Priority</span>
              <select
                value={usesExistingProject ? selectedProject?.priority ?? "Medium" : priority}
                disabled={usesExistingProject}
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
                onChange={(event) => setRequestedBy(event.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span>{kindLabel} Type</span>
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
              <span>Order Date</span>
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Expected Arrival Date</span>
              <input
                type="date"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>Received Date</span>
              <input
                type="date"
                value={arrivalDate}
                onChange={(event) => setArrivalDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>Deadline</span>
              {usesExistingProject ? <input value={selectedProject?.deadline ?? ""} readOnly /> : <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />}
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
              <span>Price</span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder={usesExistingProject ? "Amount in IDR" : "Rp / nominal"}
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Requirement notes, supplier details, or order instructions"
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
                  : "Status must be Received or Available to continue"
              }
              onClick={() => {
                submitMode.current = "continue";
              }}
            >
              Save & Continue
            </Button> : null}
          </footer>
          {error ? <p className="project-form-error" role="alert">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
