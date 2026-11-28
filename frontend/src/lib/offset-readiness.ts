import type {
  MaterialRequestValues,
  OffsetPreparationBranchKind,
  OffsetPreparationPlanValues,
  OffsetPreparationSaveAction,
  OffsetPreparationStep,
  OffsetPreparationSubmission,
  OffsetPrepressValues,
  OffsetToolingValues,
  Order,
} from "@/types/order";
import {
  hasValidOffsetVarnishCompletion,
  isActiveOffsetPreparation,
  isCurrentOffsetCompletion,
} from "./offset-preparation";
import { isOffsetPreparationStatus, offsetToolingStatus } from "./offset-preparation-status";

export type OffsetCompletionStep = Exclude<OffsetPreparationStep, "varnish">;
export const offsetCompletionSteps: readonly OffsetCompletionStep[] = ["prepress", "material", "tooling"];
const prepressStatuses = ["proofColor", "plot", "plate", "ink"] as const;
const toolingDetailFields = [
  "mcNo", "status", "grammage", "priority", "machine", "orderDate",
  "receivedDate", "supplier", "invoiceNumber", "price",
] as const;

const prepressMasterFields = ["mcNo", "boardQua", "corFlut", "fgQuantity", "imposition", "colours", "varnish"] as const;
const materialMasterFields = ["boardQua", "corFlut", "grammage"] as const;
const toolingMasterFields = ["mcNo", "boardQua", "corFlut", "grammage", "imposition"] as const;
const allReadinessMasterFields = [...new Set([...prepressMasterFields, ...materialMasterFields, ...toolingMasterFields])];

export function lockedOffsetReadinessMasterFields(order: Order) {
  if (order.workflow.preparationType !== "offset") return [];
  if (isOffsetPreparationLocked(order)) return allReadinessMasterFields;
  return [...new Set([
    ...(hasCurrentOffsetCompletion(order, "prepress") ? prepressMasterFields : []),
    ...(hasCurrentOffsetCompletion(order, "material") ? materialMasterFields : []),
    ...(hasCurrentOffsetCompletion(order, "tooling") ? toolingMasterFields : []),
  ])];
}

export function isOffsetPreparationLocked(order: Order) {
  return order.workflow.preparationType === "offset" && (
    order.workflow.currentStatus === "completed" || order.workflow.currentStatus === "cancelled" ||
    ["offset-press", "quality-control", "fa-report", "submit-sample", "sample-completed", "order-production", "completed"].includes(order.stage)
  );
}

function validDate(value: string) {
  const date = new Date(value + "T00:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isOffsetPrepressReady(values: OffsetPrepressValues) {
  return prepressStatuses.every((field) => values[field] === "Ready");
}

export function validateOffsetPrepressValues(values: OffsetPrepressValues, action: OffsetPreparationSaveAction) {
  if (prepressStatuses.some((field) => !["", "Ready", "Waiting"].includes(values[field]))) {
    return "Select a valid status for Proof Color, Plot, Plate, and Ink.";
  }
  if (typeof values.remark !== "string") return "Enter a valid Prepress remark.";
  if (!["", "GTO54", "CD102", "SM102", "SUMITOMO"].includes(values.plateType)) return "Select a valid Plate Type.";
  if (typeof values.idPlate !== "string" || typeof values.fgQuantity !== "string" ||
      (values.fgQuantity !== "" && (!values.fgQuantity.trim() || !Number.isInteger(Number(values.fgQuantity)) || Number(values.fgQuantity) < 0))) {
    return "Enter a valid ID Plate and non-negative whole FG Qty where applicable.";
  }
  if (action === "draft") return "";
  if (prepressStatuses.some((field) => values[field] === "Waiting") && !values.remark.trim()) {
    return "Remark is required when any Prepress Status is Waiting. All four statuses must be Ready to continue.";
  }
  return isOffsetPrepressReady(values) ? "" : "Proof Color, Plot, Plate, and Ink must be Ready to continue.";
}

export function isOffsetMaterialReady(values: MaterialRequestValues) {
  return values.status === "released" || values.status === "received";
}

function isNonNegativeDecimal(value: string) {
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) && Number.isFinite(Number(value));
}

function validateOffsetMaterialFields(values: MaterialRequestValues, action: OffsetPreparationSaveAction, legacyCompletion = false) {
  if (!["draft", "requested", "released", "received", "on_hold"].includes(values.status)) return "Select a valid MI Status.";
  if (typeof values.requestDate !== "string" || (values.requestDate !== "" && !validDate(values.requestDate))) return "Enter a valid Request Date.";
  if (typeof values.quantity !== "string" || (!legacyCompletion && values.quantity.trim() && !isNonNegativeDecimal(values.quantity))) {
    return "Enter a valid non-negative Request Quantity.";
  }
  if (!["", "sheet", "pcs"].includes(values.unit)) return "Select sheet or pcs for Unit.";
  if (typeof values.remark !== "string") return "Enter a valid MI remark.";
  if (action === "draft") return "";
  if (!values.requestDate || !values.quantity.trim()) {
    return "Request Date and Request Quantity are required.";
  }
  if (!values.unit) return "Select sheet or pcs for Unit.";
  return isOffsetMaterialReady(values) ? "" : "Material / MI must be Ready to continue. Select Released or Received for MI Status.";
}

export function validateOffsetMaterialValues(values: MaterialRequestValues, action: OffsetPreparationSaveAction) {
  return validateOffsetMaterialFields(values, action);
}

export function isOffsetToolingReady(values: { status: string }) {
  return values.status === "received";
}

type ToolingValidationValues = Omit<OffsetToolingValues, "status"> & { status: string };

function validateOffsetToolingFields(values: ToolingValidationValues, action: OffsetPreparationSaveAction, legacyCompletion = false) {
  if (![...toolingDetailFields, "remark" as const].every((field) => typeof values[field] === "string") ||
      !isOffsetPreparationStatus(values.status)) {
    return "Enter valid Tooling details and status.";
  }
  if ((values.orderDate && !validDate(values.orderDate)) || (values.receivedDate && !validDate(values.receivedDate))) {
    return "Enter a valid Tooling date.";
  }
  if (!legacyCompletion) {
    if (!["", "Low", "Medium", "Hard"].includes(values.priority) ||
        !["", "Auto Haido", "Auto Jingya", "Baozika", "DC Manual", "DC TMZ", "DC Flat"].includes(values.machine)) {
      return "Select a valid Tooling Priority and Machine.";
    }
    if (values.price.trim() && !isNonNegativeDecimal(values.price)) return "Enter a valid non-negative Tooling Price.";
  }
  if (action === "draft") return "";
  if (!isOffsetToolingReady(values)) return "Tooling Status must be Received to continue.";
  return [values.receivedDate, values.supplier, values.invoiceNumber, values.price].every((value) => value.trim())
    ? "" : "Complete Received Date, Supplier, Invoice Number, and Price for Received Tooling.";
}

export function validateOffsetToolingValues(values: ToolingValidationValues, action: OffsetPreparationSaveAction) {
  return validateOffsetToolingFields(values, action);
}

function submittedBranch(order: Order, kind: OffsetPreparationBranchKind) {
  if (!Array.isArray(order.offsetPreparationRecords)) return undefined;
  const records = order.offsetPreparationRecords.filter((record) => record?.kind === kind);
  if (records.length !== 1) return undefined;
  const [record] = records;
  return record.projectId === order.id && record.state === "submitted" &&
    typeof record.id === "string" && record.id.trim() && Number.isFinite(Date.parse(record.createdAt))
    ? record
    : undefined;
}

function selectedSubmittedBranch(order: Order, kind: OffsetPreparationBranchKind) {
  const plan = order.offsetPreparationPlan;
  return plan?.projectId === order.id && plan.material?.state === "submitted" && plan[kind]?.state === "submitted"
    ? submittedBranch(order, kind)
    : undefined;
}

export function hasSubmittedOffsetBranch(order: Order, kind: OffsetPreparationBranchKind) {
  return Boolean(submittedBranch(order, kind));
}

export function isLegacyOffsetPreparation(order: Order) {
  return !order.offsetPreparationPlan && hasNoPreparationRecords(order);
}

function hasNoPreparationRecords(order: Order) {
  const records = order.offsetPreparationRecords;
  return records == null || (Array.isArray(records) && records.length === 0);
}

export function activeOffsetTooling(order: Order) {
  if (!order.offsetToolingId || !Array.isArray(order.offsetToolingRecords)) return undefined;
  const records = order.offsetToolingRecords.filter((record) => record?.id === order.offsetToolingId);
  return records.length === 1 ? records[0] : undefined;
}

export function canAddLegacyOffsetTooling(order: Order) {
  return isActiveOffsetPreparation(order) && isLegacyOffsetPreparation(order) &&
    order.stage === "offset-plate" && !order.offsetToolingId && !order.offsetToolingRecords?.length;
}

export function canEditOffsetPreparation(order: Order, step: OffsetCompletionStep) {
  return isActiveOffsetPreparation(order) && !hasCurrentOffsetCompletion(order, step) && (step === "prepress" || (
    (step !== "tooling" || Boolean(activeOffsetTooling(order))) &&
    (Boolean(selectedSubmittedBranch(order, step)) || (isLegacyOffsetPreparation(order) &&
      order.stage === (step === "material" ? "offset-material-request" : "offset-plate")))
  ));
}

export function canChangeOffsetPreparationPlan(order: Order) {
  const plan = order.offsetPreparationPlan;
  return isActiveOffsetPreparation(order) && order.stage === "offset-prepress" &&
    hasNoPreparationRecords(order) && (!plan || (plan.projectId === order.id &&
      plan.material?.state === "draft" && (!plan.tooling || plan.tooling.state === "draft") &&
      (!plan.varnish || plan.varnish.state === "draft")));
}

export function validateOffsetPreparationSubmission(values: OffsetPreparationSubmission) {
  if (!Array.isArray(values.rows) || values.rows.some((row) => row !== "tooling" && row !== "varnish") ||
      new Set(values.rows).size !== values.rows.length) {
    return "Select a different preparation order in every row, or remove empty rows.";
  }
  if (values.rows.includes("tooling")) {
    if (!values.toolingDraft) return "Save Tooling details before updating preparation.";
    return validateOffsetToolingValues({ ...values.toolingDraft, status: offsetToolingStatus(values.toolingDraft.status) }, "draft");
  }
  return "";
}

export function offsetPlanSnapshot(order: Order) {
  return JSON.stringify([order.offsetPreparationPlan, order.offsetPreparationRecords]);
}

export function draftOffsetPlan(values: OffsetPreparationPlanValues) {
  return values.material?.state === "draft" && (!values.tooling || values.tooling.state === "draft") &&
    (!values.varnish || values.varnish.state === "draft");
}

export function offsetMaterialName(order: Order) {
  return order.mainData.boardQua || (order.material === "-" ? "" : order.material) ||
    latestOffsetMaterial(order)?.material || "";
}

function latestOffsetMaterial(order: Order) {
  return Array.isArray(order.materialRequests) ? order.materialRequests.at(-1) : undefined;
}

export function offsetPreparationRecord(order: Order, step: OffsetCompletionStep) {
  if (step === "prepress") return order.offsetPrepress;
  if (step === "material") return latestOffsetMaterial(order);
  return activeOffsetTooling(order);
}

export function offsetPreparationFingerprint(order: Order, step: OffsetCompletionStep) {
  const record = offsetPreparationRecord(order, step);
  const branch = step === "prepress" ? undefined : selectedSubmittedBranch(order, step);
  const master = order.mainData;
  const masterFields = step === "prepress" ? prepressMasterFields : step === "material" ? materialMasterFields : toolingMasterFields;
  let values: unknown;
  if (record && "proofColor" in record) {
    values = [record.noJoPnCode, record.idPlate, record.plateType, record.fgQuantity, ...prepressStatuses.map((field) => record[field])];
  } else if (record && "miNumber" in record) {
    values = [record.sequence, record.miNumber, record.status, record.requestDate, record.material, record.quantity, record.unit];
  } else if (record) {
    values = [record.id, ...toolingDetailFields.map((field) => record[field])];
  }
  return JSON.stringify([order.id, branch?.id, branch?.createdAt, values,
    step === "material" ? offsetMaterialName(order) : null, ...masterFields.map((field) => master[field]?.trim() ?? "")]);
}

export function offsetPreparationSnapshot(order: Order, step: OffsetCompletionStep) {
  return JSON.stringify([offsetPreparationFingerprint(order, step), offsetPreparationRecord(order, step)?.remark,
    order.offsetPreparationProgress?.[step]?.revision]);
}

export function hasCurrentOffsetCompletion(order: Order, step: OffsetCompletionStep) {
  const completion = order.offsetPreparationProgress?.[step]?.completion;
  if (!completion) return false;
  const fingerprint = offsetPreparationFingerprint(order, step);
  if (isCurrentOffsetCompletion(completion, fingerprint)) return true;
  if (step !== "tooling" || typeof completion?.fingerprint !== "string") return false;

  // Legacy Tooling completions stored two Open Size slots after grammage.
  try {
    const legacy: unknown = JSON.parse(completion.fingerprint);
    if (!Array.isArray(legacy) || !Array.isArray(legacy[3]) || legacy[3].length !== toolingDetailFields.length + 3) return false;
    legacy[3].splice(4, 2);
    return isCurrentOffsetCompletion({ ...completion, fingerprint: JSON.stringify(legacy) }, fingerprint);
  } catch {
    return false;
  }
}

export function canEditOffsetPrinting(order: Order) {
  return order.stage === "offset-press" && evaluateOffsetReadiness(order).ready &&
    !order.processHistory.some((event) => event.stage === "offset-press" && event.process === "handoff_details_updated");
}

export function isOffsetPrintingHandoff(event: Order["processHistory"][number] | undefined, legacyPrintingStage = false) {
  return Boolean(event && event.process === "handoff_details_updated" &&
    (event.stage === "offset-press" || (!event.stage && legacyPrintingStage)) &&
    typeof event.user === "string" && event.user.trim() && Number.isFinite(Date.parse(event.date)));
}

type Readiness = "ready" | "not-selected" | "not-submitted" | "invalid-data" | "not-ready" | "not-continued";

/** Evaluates workflow readiness without changing state or scheduling a transition. */
export function evaluateOffsetReadiness(order: Order) {
  const plan = order.offsetPreparationPlan;
  const planValid = plan?.projectId === order.id && plan.material?.state === "submitted" &&
    Number.isFinite(Date.parse(plan.updatedAt)) && typeof plan.updatedBy === "string" && Boolean(plan.updatedBy.trim()) &&
    (plan.tooling === undefined || plan.tooling?.state === "submitted") &&
    (plan.varnish === undefined || plan.varnish?.state === "submitted");
  const intendedPlan = plan?.projectId === order.id ? plan : undefined;
  const completionResult = (step: OffsetCompletionStep, error: string, ready: boolean): Readiness =>
    error ? "invalid-data" : !ready ? "not-ready" : hasCurrentOffsetCompletion(order, step) ? "ready" : "not-continued";

  const prepress = order.offsetPrepress;
  const material = latestOffsetMaterial(order);
  const tooling = activeOffsetTooling(order);
  const prepressReady = Boolean(prepress && isOffsetPrepressReady(prepress));
  const materialReady = Boolean(material && isOffsetMaterialReady(material));
  const toolingReady = Boolean(tooling && isOffsetToolingReady(tooling));
  // Preserve verified pre-A4 Continue events without mapping Available to Received.
  const legacyToolingComplete = tooling?.status === "available" && hasCurrentOffsetCompletion(order, "tooling") &&
    !validateOffsetToolingFields({ ...tooling, status: "received" }, "continue", true);
  const branches = {
    prepress: prepress ? completionResult("prepress", validateOffsetPrepressValues(prepress, prepressReady ? "continue" : "draft"), prepressReady) : "invalid-data",
    material: !selectedSubmittedBranch(order, "material") ? "not-submitted"
      : material ? completionResult("material", validateOffsetMaterialFields(material, materialReady ? "continue" : "draft", hasCurrentOffsetCompletion(order, "material")), materialReady) : "invalid-data",
    tooling: intendedPlan?.tooling === undefined ? "not-selected" : !selectedSubmittedBranch(order, "tooling") ? "not-submitted"
      : legacyToolingComplete ? "ready"
      : tooling ? completionResult("tooling", validateOffsetToolingFields({ ...tooling, status: offsetToolingStatus(tooling.status) }, toolingReady ? "continue" : "draft", hasCurrentOffsetCompletion(order, "tooling")), toolingReady) : "invalid-data",
    varnish: intendedPlan?.varnish === undefined ? "not-selected" : !selectedSubmittedBranch(order, "varnish") ? "not-submitted"
      : hasValidOffsetVarnishCompletion(order) ? "ready" : order.offsetVarnish?.status === "received" ? "not-continued" : "not-ready",
  } satisfies Record<OffsetPreparationStep, Readiness>;
  // Re-evaluate the same branch evidence at Printing before accepting the QC handoff.
  const activePrinting = order.workflow.preparationType === "offset" && order.stage === "offset-press" &&
    order.workflow.currentStatus !== "cancelled" && order.workflow.currentStatus !== "completed";
  const eligible = planValid && (isActiveOffsetPreparation(order) || activePrinting);
  return { eligible, planValid, branches, ready: eligible && Object.values(branches).every((state) => state === "ready" || state === "not-selected") };
}

export function canContinueOffsetPreparation(order: Order, step: OffsetCompletionStep) {
  return canEditOffsetPreparation(order, step) && (step === "prepress" || Boolean(selectedSubmittedBranch(order, step)));
}
