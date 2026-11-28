"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { matchesOrder } from "@/lib/requirement-branches";
import { orders as initialOrders } from "@/data/orders";
import { canUpdateDrawingStatus } from "@/lib/permissions";
import { drawingStatusOptions, getDrawingStatus } from "@/lib/drawing-status";
import { canRecordConvertingRequirement, isParallelPreparationPending, isParallelPreparationComplete, isInRequirementQueue, materialRequestQueueEntries } from "@/lib/requirement-queue";
import { defaultOffsetPreparationStatus, isOffsetPreparationStatus, offsetToolingStatus } from "@/lib/offset-preparation-status";
import {
  appendOffsetPreparationRecords,
  canEditOffsetVarnish,
  createOffsetPreparationPlan,
  hasValidOffsetVarnishCompletion,
  isOffsetVarnishQueueOrder,
  offsetVarnishFingerprint,
  offsetVarnishSnapshot,
  submittedOffsetPreparationKinds,
  validateOffsetVarnishValues,
  varnishSpecification,
  varnishSpecificationFields,
} from "@/lib/offset-preparation";
import {
  activeOffsetTooling,
  canAddLegacyOffsetTooling,
  canChangeOffsetPreparationPlan,
  canContinueOffsetPreparation,
  canEditOffsetPreparation,
  canEditOffsetPrinting,
  draftOffsetPlan,
  evaluateOffsetReadiness,
  hasSubmittedOffsetBranch,
  isLegacyOffsetPreparation,
  isOffsetMaterialReady,
  isOffsetPrintingHandoff,
  isOffsetPrepressReady,
  isOffsetToolingReady,
  offsetCompletionSteps,
  offsetMaterialName,
  offsetPlanSnapshot,
  offsetPreparationFingerprint,
  offsetPreparationRecord,
  offsetPreparationSnapshot,
  lockedOffsetReadinessMasterFields,
  validateOffsetMaterialValues,
  validateOffsetPreparationSubmission,
  validateOffsetPrepressValues,
  validateOffsetToolingValues,
  type OffsetCompletionStep,
} from "@/lib/offset-readiness";
import type {
  DesignDecision,
  DrawingStatus,
  ProjectRole,
  DrawingSubmission,
  MaterialRequestValues,
  SampleProgressValues,
  Order,
  OrderFormValues,
  OrderStatusTone,
  OffsetSpkStatus,
  OffsetSpkValues,
  OffsetPrepressValues,
  OffsetVarnishRecord,
  OffsetVarnishValues,
  OffsetPreparationPlanValues,
  OffsetPreparationSaveAction,
  OffsetPreparationSubmission,
  OffsetToolingValues,
  ManualOffsetToolingValues,
  ManualOffsetToolingRecord,
  ProjectCurrentStage,
  ProjectFormValues,
  ProjectLineage,
  ProjectMainData,
  ProjectWorkflow,
  PreparationOrderKind,
  PreparationWorkflowUpdate,
  RequirementUpdateValues,
  StandaloneRequirementKind,
  StandaloneRequirementOrderValues,
  WorkflowStage,
} from "@/types/order";

type WorkflowStageDetails = {
  process: string;
  status: string;
  tone: OrderStatusTone;
  progress: number;
};

/** Display adapters used by the existing queue screens during the staged migration. */
export const workflowStageDetails: Record<WorkflowStage, WorkflowStageDetails> = {
  order: {
    process: "New Project",
    status: "New",
    tone: "info",
    progress: 0,
  },
  "design-incoming": {
    process: "Incoming Design",
    status: "New",
    tone: "info",
    progress: 15,
  },
  "design-progress": {
    process: "Progress Drawing",
    status: "In Progress",
    tone: "info",
    progress: 28,
  },
  "review-approval": {
    process: "Review Drawing Status",
    status: "Waiting for Design Decision",
    tone: "warning",
    progress: 42,
  },
  "converting-design": {
    process: "Under Design",
    status: "Under Design",
    tone: "info",
    progress: 48,
  },
  "converting-production": {
    process: "Under Production",
    status: "Under Production",
    tone: "info",
    progress: 48,
  },
  "tooling-progress": {
    process: "Order Tooling",
    status: "Waiting for Tooling",
    tone: "info",
    progress: 56,
  },
  "rubber-order-setting": {
    process: "Order Rubber",
    status: "Waiting for Rubber",
    tone: "warning",
    progress: 70,
  },
  "material-request": {
    process: "Request Material / Create MI",
    status: "Waiting for Material Request",
    tone: "warning",
    progress: 74,
  },
  "offset-design": {
    process: "Offset Design",
    status: "Waiting for Offset Design",
    tone: "info",
    progress: 52,
  },
  "offset-prepress": {
    process: "Prepress",
    status: "Waiting for Prepress",
    tone: "info",
    progress: 62,
  },
  "offset-material-request": {
    process: "Offset Material / Create MI",
    status: "Waiting for Offset Material",
    tone: "warning",
    progress: 68,
  },
  "offset-plate": {
    process: "Tooling / Plate",
    status: "Waiting for Plate",
    tone: "info",
    progress: 75,
  },
  "offset-varnish": {
    process: "Block / Spot Varnish",
    status: "Waiting for Varnish Preparation",
    tone: "warning",
    progress: 82,
  },
  "offset-press": {
    process: "Press / Printing",
    status: "Waiting for Press",
    tone: "info",
    progress: 88,
  },
  "sample-progress": {
    process: "Sample Process",
    status: "Sample In Progress",
    tone: "info",
    progress: 85,
  },
  "quality-control": {
    process: "QC Checking",
    status: "Waiting for QC",
    tone: "warning",
    progress: 92,
  },
  "fa-report": {
    process: "FA Report",
    status: "Waiting for FA Report",
    tone: "info",
    progress: 95,
  },
  "submit-sample": {
    process: "Submit Sample",
    status: "Waiting for Sample Submission",
    tone: "info",
    progress: 98,
  },
  "sample-completed": {
    process: "Sample Decision",
    status: "Waiting for Sample Decision",
    tone: "warning",
    progress: 99,
  },
  "order-production": {
    process: "Order / Production",
    status: "In Production",
    tone: "info",
    progress: 100,
  },
  completed: {
    process: "Closed Project",
    status: "Completed",
    tone: "success",
    progress: 100,
  },
};

const nextWorkflowStage: Partial<Record<WorkflowStage, WorkflowStage>> = {
  order: "design-progress",
  "design-incoming": "design-progress",
  "design-progress": "review-approval",
  "converting-design": "material-request",
  "converting-production": "material-request",
  "tooling-progress": "material-request",
  "rubber-order-setting": "material-request",
  "material-request": "sample-progress",
  "sample-progress": "quality-control",
  "quality-control": "fa-report",
  "fa-report": "submit-sample",

  "order-production": "completed",
};

export type WorkflowOrdersContextValue = {
  currentUserRole: ProjectRole;
  updateDrawingStatus: (projectId: string, status: DrawingStatus) => void;
  orders: Order[];
  manualOffsetToolingRecords: ManualOffsetToolingRecord[];
  nextProjectCode: string;
  addProject: (values: ProjectFormValues) => string;
  editProject: (orderNo: string, values: ProjectFormValues) => string;
  createStandaloneRequirementOrder: (
    kind: StandaloneRequirementKind,
    values: StandaloneRequirementOrderValues,
    continueWorkflow: boolean,
  ) => void;
  completeIncomingPreparation: (
    orderNo: string,
    values: PreparationWorkflowUpdate,
  ) => string;
  /** Updates the first Incoming Design tooling/rubber detail without changing the workflow stage. */
  updateIncomingRequirementDetails: (
    orderNo: string,
    kind: PreparationOrderKind,
    values: RequirementUpdateValues,
  ) => void;
  submitDrawing: (orderNo: string, values: DrawingSubmission) => void;
  completeDesignDecision: (orderNo: string, decision: DesignDecision) => void;
  cancelIncomingProject: (orderNo: string, reason: string) => string;
  cancelProject: (orderNo: string, reason: string) => void;
  updateOrder: (orderNo: string, values: Partial<OrderFormValues>) => void;
  saveToolingRequirement: (
    orderNo: string,
    values: RequirementUpdateValues,
    continueWorkflow: boolean,
    saveMode?: "draft" | "repeat",
  ) => void;
  saveRubberRequirement: (
    orderNo: string,
    values: RequirementUpdateValues,
    continueWorkflow: boolean,
    saveMode?: "draft" | "repeat",
  ) => void;
  saveMaterialRequest: (
    orderNo: string,
    values: MaterialRequestValues,
    continueWorkflow: boolean,
  ) => void;
  saveOffsetSpk: (
    orderNo: string,
    values: OffsetSpkValues,
    continueWorkflow: boolean,
  ) => void;
  saveOffsetPrepress: OffsetPreparationSave<OffsetPrepressValues>;
  saveOffsetMaterial: OffsetPreparationSave<MaterialRequestValues>;
  /** Saves only the submitted Varnish monitoring branch; it never advances the project. */
  saveOffsetVarnish: OffsetPreparationSave<OffsetVarnishValues>;
  completeOffsetPrinting: (projectId: string, notes: string, expectedUpdatedAt: string) => string;
  /** Saves only the Offset parallel-preparation plan; it never moves a workflow stage. */
  saveOffsetPreparationPlan: (projectId: string, values: OffsetPreparationPlanValues, expectedSnapshot: string) => Order | string;
  /** Submits all selected branches together and opens the MI queue. */
  submitOffsetMaterialPreparation: (projectId: string, values: OffsetPreparationSubmission, expectedSnapshot: string) => string;
  saveOffsetTooling: OffsetPreparationSave<OffsetToolingValues>;
  createOffsetTooling: (orderNo: string, values: OffsetToolingValues) => void;
  updateOffsetTooling: (orderNo: string, toolingId: string, values: OffsetToolingValues) => void;
  createManualOffsetTooling: (values: ManualOffsetToolingValues) => void;
  updateManualOffsetTooling: (toolingId: string, values: ManualOffsetToolingValues) => void;
  completeSampleDecision: (orderNo: string, decision: "approve" | "revision" | "cancel", pic: string, notes: string) => void;
  submitSample: (orderNo: string, submittedDate: string) => void;
  advanceOrder: (orderNo: string, values?: Partial<OrderFormValues>, sample?: SampleProgressValues) => void;
  moveOrderToStage: (
    orderNo: string,
    stage: WorkflowStage,
    values?: Partial<OrderFormValues>,
  ) => void;
};

const WorkflowOrdersContext = createContext<WorkflowOrdersContextValue | null>(null);
type OffsetPreparationSave<T> = (projectId: string, values: T, action: OffsetPreparationSaveAction, expectedSnapshot: string) => string;
type OffsetPreparationChange = (order: Order, timestamp: string) => Order | string;
const offsetPreparationError = (result: Order | string) => typeof result === "string" ? result : "";
const ordersStorageKey = "cots-workflow-orders-v1";
const manualToolingStorageKey = "cots-offset-manual-tooling-v1";
const storageConflict = "Project data changed in another tab. Reload the page before saving.";
const legacyVarnishSubmissionWindowMs = 5_000;
const printingRouteProcess = "offset_printing_routed";
const offsetPreparationHistory = {
  prepress: { label: "Prepress", process: "offset_prepress", stage: "offset-prepress" },
  material: { label: "Material / MI", process: "material_request", stage: "offset-material-request" },
  tooling: { label: "Tooling / Plate", process: "offset_tooling", stage: "offset-plate" },
} as const;

/** Generates the next monthly Sample Number as YYMMNNN without changing existing numbers. */
export function nextOrderCode(currentOrders: readonly Pick<Order, "no">[], now = new Date()) {
  const prefix = `${String(now.getFullYear() % 100).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const highestSequence = currentOrders.reduce((highest, order) => {
    const match = new RegExp(`^${prefix}(\\d{3})$`).exec(order.no.trim());
    const sequence = Number(match?.[1]);
    return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);

  if (highestSequence >= 999) throw new Error(`Monthly Sample Number sequence exhausted for ${prefix}.`);
  return `${prefix}${String(highestSequence + 1).padStart(3, "0")}`;
}

function normalizeProjectCode(value: string) {
  return value.trim().toUpperCase();
}

function createVersionUpLineage(
  currentOrders: Order[],
  previousProjectCode: string,
): ProjectLineage {
  const normalizedPreviousCode = normalizeProjectCode(previousProjectCode);
  const sourceProject = currentOrders.find(
    (order) => normalizeProjectCode(order.no) === normalizedPreviousCode,
  );
  const rootProjectNo = sourceProject?.lineage.rootProjectNo ?? normalizedPreviousCode;
  const currentHighestVersion = currentOrders
    .filter(
      (order) =>
        normalizeProjectCode(order.lineage.rootProjectNo) ===
        normalizeProjectCode(rootProjectNo),
    )
    .reduce((highest, order) => Math.max(highest, order.lineage.versionNumber), 0);

  return {
    entryType: "version_up",
    rootProjectNo,
    sourceProjectNo: sourceProject?.no ?? normalizedPreviousCode,
    versionNumber: currentHighestVersion + 1,
  };
}

function displayDate(value: string) {
  if (!value) return "-";

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function createStandaloneRequirementMainData(
  code: string,
  values: StandaloneRequirementOrderValues,
): ProjectMainData {
  return {
    mcNo: code,
    component: values.product.trim(),
    custName: values.customer.trim(),
    partNo: values.partNo.trim(),
    partNo2: "",
    set: "",
    sub: "",
    singDoub: "",
    width: "",
    length: "",
    dieCutSht: "",
    boardQua: values.material.trim(),
    corFlut: "",
    creaseL: "",
    creaseW: "",
    slotting: "",
    remark: values.description.trim(),
    iSizeL: "",
    iSizeW: "",
    iSizeH: "",
    printing: "",
    colours: "",
    dispFlag: "",
    unit: "",
    manfJoin1: "",
    manfJoin2: "",
    weight: "",
    assembly: "",
    colour2: "",
    colour3: "",
    colour4: "",
    colour5: "",
    finishing: "",
    fgWeight: "",
  };
}

function standaloneRequirementStage(kind: StandaloneRequirementKind): WorkflowStage {
  return kind === "tooling" ? "tooling-progress" : "rubber-order-setting";
}

function currentStageForQueue(stage: WorkflowStage): ProjectCurrentStage {
  if (stage === "order" || stage === "design-incoming") return "order";
  if (stage === "design-progress") return "drawing";
  if (
    stage === "review-approval" ||
    stage === "converting-design" ||
    stage === "converting-production" ||
    stage === "tooling-progress" ||
    stage === "rubber-order-setting" ||
    stage === "material-request" ||
    stage === "offset-design" ||
    stage === "offset-prepress" ||
    stage === "offset-material-request" ||
    stage === "offset-plate" ||
    stage === "offset-varnish" ||
    stage === "offset-press"
  ) {
    return "preparation";
  }
  if (stage === "sample-progress") return "sample";
  if (stage === "completed") return "completed";
  return "closing";
}

function currentStatusForQueue(stage: WorkflowStage, status: string): ProjectWorkflow["currentStatus"] {
  if (stage === "order" || stage === "design-incoming") return "new";
  if (stage === "completed") return "completed";
  if (/waiting|menunggu/i.test(status)) return "waiting";
  return "in_progress";
}

function mergeMainData(order: Order, values: Partial<OrderFormValues>): ProjectMainData {
  return {
    ...order.mainData,
    custName: values.customer ?? order.mainData.custName,
    component: values.product ?? order.mainData.component,
    remark: values.description ?? order.mainData.remark,
    boardQua: values.material ?? order.mainData.boardQua,
  };
}

const boardMaterialKeys = [
  "liner1", "fluting1", "liner2", "middleLiner", "fluting2", "liner3", "paperboardType", "paperboardGsm",
] as const;

/** Material entries are normalized again at persistence time, including imported form values. */
function normalizeBoardMaterialCapitalization(mainData: ProjectMainData): ProjectMainData {
  return {
    ...mainData,
    ...Object.fromEntries(boardMaterialKeys.map((key) => [
      key,
      (mainData[key] ?? "").replace(/^\s*([a-z])/, (_, letter: string) => letter.toUpperCase()),
    ])),
  } as ProjectMainData;
}

const orderFormFields = ["customer", "product", "description", "material", "priority", "pic", "projectDate", "deadline"] as const;

function applyOrderValues(order: Order, values: Partial<OrderFormValues>): Order {
  const acceptedValues = Object.fromEntries(
    orderFormFields.filter((field) => Object.hasOwn(values, field)).map((field) => [field, values[field]]),
  );
  const materialLocked = acceptedValues.material !== undefined && lockedOffsetReadinessMasterFields(order).includes("boardQua");
  const mainData = mergeMainData(order, acceptedValues);
  if (materialLocked) mainData.boardQua = order.mainData.boardQua;
  return {
    ...order,
    ...acceptedValues,
    ...(materialLocked ? { material: order.material } : {}),
    mainData,
    updatedAt: new Date().toISOString(),
  };
}

/** Offset handoffs must not turn a process note into the project master remark. */
function applyOffsetHandoffValues(order: Order, values: Partial<OrderFormValues>): Order {
  return {
    ...order,
    pic: values.pic ?? order.pic,
    deadline: values.deadline ?? order.deadline,
    workflow: {
      ...order.workflow,
      offsetHandoffRemark: values.description?.trim() ?? "",
    },
    updatedAt: new Date().toISOString(),
  };
}

function hasOrderValues(values: Partial<OrderFormValues>) {
  return Object.values(values).some((value) => value !== undefined && value !== "");
}

function appendHistory(
  order: Order,
  entry: Pick<Order["processHistory"][number], "process" | "status" | "user" | "changeSummary" | "remark" | "stage" | "pic" | "deadline" | "source">,
  updatedAt = new Date().toISOString(),
): Order {
  return {
    ...order,
    processHistory: [
      ...order.processHistory,
      {
        ...entry,
        source: entry.source ?? order.requirementBranch,
        date: updatedAt,
      },
    ],
    updatedAt,
  };
}

function hasVerifiedOffsetVarnishSubmission(order: Order, plan: NonNullable<Order["offsetPreparationPlan"]>) {
  const planUpdatedAt = Date.parse(plan.updatedAt);
  if (!Number.isFinite(planUpdatedAt) || plan.material?.state !== "submitted") return false;
  const hasCorrelatedMaterial = order.offsetPreparationRecords?.some((record) =>
    record.projectId === order.id && record.kind === "material" && record.state === "submitted" &&
    Date.parse(record.createdAt) === planUpdatedAt && record.updatedBy === plan.updatedBy,
  );
  if (!hasCorrelatedMaterial) return false;

  // Legacy Update assigned the same timestamp to the plan and Material record,
  // then appended the parent history event in the same synchronous handler.
  return order.processHistory.some((entry) => {
    const elapsed = Date.parse(entry.date) - planUpdatedAt;
    return entry.process === "offset_preparation_plan" && entry.status === "submitted" &&
      entry.user === plan.updatedBy && entry.user !== "System" &&
      /^Offset Material preparation submitted\b/i.test(entry.changeSummary ?? "") &&
      elapsed >= 0 && elapsed <= legacyVarnishSubmissionWindowMs;
  });
}

/** Restores only a missing Varnish branch with branch-specific submission evidence. */
export function reconcileOffsetVarnishSubmission(order: Order, timestamp: string) {
  const plan = order.offsetPreparationPlan;
  if (
    order.workflow.preparationType !== "offset" ||
    order.workflow.currentStatus === "cancelled" ||
    order.workflow.currentStatus === "completed" ||
    order.stage === "completed" ||
    plan?.projectId !== order.id ||
    (plan.varnish?.state !== "draft" && plan.varnish?.state !== "submitted") ||
    order.offsetPreparationRecords?.some((record) => record.projectId === order.id && record.kind === "varnish")
  ) return order;

  if (!hasVerifiedOffsetVarnishSubmission(order, plan)) return order;

  const wasDraft = plan.varnish.state === "draft";
  const recoveredPlan = wasDraft
    ? { ...plan, varnish: { state: "submitted" as const }, updatedAt: timestamp, updatedBy: "System" }
    : plan;
  const records = appendOffsetPreparationRecords(order.offsetPreparationRecords, { ...recoveredPlan, tooling: undefined }, "System", timestamp);
  if (records.length === (order.offsetPreparationRecords?.length ?? 0)) return order;

  return appendHistory({
    ...order,
    offsetPreparationPlan: recoveredPlan,
    offsetPreparationRecords: records,
    ...(order.offsetVarnish?.completion ? { offsetVarnish: { ...order.offsetVarnish, completion: undefined } } : {}),
  }, {
    process: "offset_varnish",
    stage: "offset-varnish",
    status: "submitted",
    user: "System",
    changeSummary: wasDraft
      ? "Offset Block / Spot Varnish monitoring recovered from a verified prior submission."
      : "Offset Block / Spot Varnish record restored from a submitted preparation.",
    remark: "",
  }, timestamp);
}

function firstStageAfterDesignApproval(order: Order): WorkflowStage {
  if (order.workflow.preparationType === "offset") return "offset-design";

  const hasPreparationOrder = selectedPreparationOrders(order.workflow).length > 0;
  if (!hasPreparationOrder && !order.workflow.materialRequested) {
    return "sample-progress";
  }

  if (order.workflow.convertingRoute === "by_design") {
    return "converting-design";
  }

  return "converting-production";
}

function nextStageForOrder(order: Order): WorkflowStage | undefined {
  if (order.stage === "review-approval") {
    return firstStageAfterDesignApproval(order);
  }

  return nextWorkflowStage[order.stage];
}

function isReadyToContinueRequirement(status: RequirementUpdateValues["status"]) {
  return status === "received" || status === "available";
}

function nextSpkNumber(order: Order) {
  const year = new Date().getFullYear();
  const projectSequence = order.offsetSpks.length + 1;
  const projectSuffix = order.no.replace(/[^0-9]/g, "").slice(-4) || "0000";

  return `SPK-${year}-${projectSuffix}-${String(projectSequence).padStart(2, "0")}`;
}

function offsetSpkStatusForStage(stage: WorkflowStage): OffsetSpkStatus | null {
  const statuses: Partial<Record<WorkflowStage, OffsetSpkStatus>> = {
    "offset-design": "design_offset",
    "offset-prepress": "prepress",
    "offset-material-request": "material",
    "offset-plate": "plate",
    "offset-varnish": "varnish",
    "offset-press": "press",
    "quality-control": "qc",
  };

  return statuses[stage] ?? null;
}

function incomingPreparationLabel(values: PreparationWorkflowUpdate) {
  const routeLabel =
    values.route === "by_design"
      ? "Preparation: By Design"
      : values.route === "by_production"
        ? "Preparation: By Production"
        : "Preparation: Offset";

  const productionLabels = selectedPreparationOrders(values).map((kind) =>
    kind === "tooling" ? "Preparation: Order Tooling" : "Preparation: Order Rubber",
  );

  return [
    routeLabel,
    values.materialRequested ? "Preparation: Request Material" : null,
    ...productionLabels,
  ]
    .filter(Boolean)
    .join(" -> ");
}

function finalPreparationStatus(values: PreparationWorkflowUpdate) {
  if (values.materialRequested) return "Preparation: Request Material";
  if (values.route === "offset") return "Preparation: Order Tooling / Plate";

  const selected = selectedPreparationOrders(values);
  if (selected.length === 2) return "Preparation: Order Tooling & Rubber";
  if (selected[0] === "tooling") return "Preparation: Order Tooling";
  if (selected[0] === "rubber") return "Preparation: Order Rubber";

  return values.route === "by_design" ? "Preparation: By Design" : "Preparation: By Production";
}

function isCompleteIncomingPreparation(values: PreparationWorkflowUpdate) {
  // Tooling/Rubber and Request Material are independent preparation tasks.
  // A remark is optional; only the selected route is needed to start drawing.
  if (values.route === "offset") return values.offsetNextPreparation === "prepress";
  return Boolean(values.route);
}

function selectedPreparationOrders(
  values: Pick<PreparationWorkflowUpdate, "preparationOrders" | "productionOrder">,
): PreparationOrderKind[] {
  const legacy = values.productionOrder === "tooling_and_rubber"
    ? (["tooling", "rubber"] as const)
    : values.productionOrder
      ? [values.productionOrder]
      : [];
  const candidates = values.preparationOrders ?? legacy;

  return [...new Set(candidates.filter((kind): kind is PreparationOrderKind =>
    kind === "tooling" || kind === "rubber",
  ))];
}

function hasUnforwardedPreparationOrder(order: Order) {
  return selectedPreparationOrders(order.workflow).some((kind) =>
    kind === "tooling" ? !order.workflow.toolingForwarded : !order.workflow.rubberForwarded,
  );
}

function isConvertingRequirementStage(stage: WorkflowStage) {
  return stage === "converting-production" ||
    stage === "tooling-progress" ||
    stage === "rubber-order-setting";
}

function isOffsetWorkflowStage(stage: WorkflowStage) {
  return stage.startsWith("offset-");
}

/** Tooling/Rubber are visible as planning items while a drawing awaits review. */
function isDrawingReviewPendingStage(stage: WorkflowStage) {
  return stage === "design-progress" || stage === "review-approval";
}

function applyIncomingPreparation(
  order: Order,
  values: PreparationWorkflowUpdate,
  currentUserName: string,
): Order {
  const updatedAt = new Date().toISOString();
  const preparationOrders = values.route === "by_production"
    ? selectedPreparationOrders(values)
    : [];
  const productionOrder = preparationOrders[0] ?? null;
  const materialRequested = Boolean(values.materialRequested);
  const normalizedValues = {
    ...values,
    productionOrder,
    preparationOrders,
    materialRequested,
  };

  return {
    ...order,
    status: finalPreparationStatus(normalizedValues),
    tone: "info",
    workflow: {
      ...order.workflow,
      preparationType: values.route === "offset" ? "offset" : "converting",
      convertingRoute: values.route === "offset" ? null : values.route,
      offsetHandoffRemark: values.route === "offset"
        ? values.remark.trim()
        : order.workflow.offsetHandoffRemark,
      preparationOrders,
      productionOrder,
      materialRequested,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: "incoming_preparation",
        status: "updated",
        date: updatedAt,
        user: currentUserName,
        changeSummary: incomingPreparationLabel(normalizedValues),
        remark: values.remark.trim(),
      },
    ],
    updatedAt,
  };
}

function normalizeDrawingLink(value: string) {
  const drawingLink = value.trim();

  if (drawingLink.startsWith("\\\\")) {
    const [server, ...pathSegments] = drawingLink
      .replace(/^\\+/, "")
      .split(/\\+/)
      .filter(Boolean);
    if (!server || pathSegments.length === 0) return null;
    return `file://${[server, ...pathSegments].map(encodeURIComponent).join("/")}`;
  }

  try {
    const url = new URL(drawingLink);

    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function drawingFileNameFromSource(value: string) {
  const source = value.trim();
  if (!source) return "";

  try {
    const url = new URL(source);
    const fromUrl = url.pathname.split("/").filter(Boolean).at(-1);
    if (fromUrl) return decodeURIComponent(fromUrl);
  } catch {
    // A UNC path is parsed below.
  }

  return source.split(/[\\/]/).filter(Boolean).at(-1) ?? "";
}

function applyDrawingSubmission(
  order: Order,
  values: DrawingSubmission,
  drawingLink: string,
  currentUserName: string,
): Order {
  const updatedAt = new Date().toISOString();

  return {
    ...applyOrderValues(order, { pic: values.pic, deadline: values.deadline }),
    workflow: {
      ...order.workflow,
      drawingLink,
      drawingNetworkPath: values.drawingNetworkPath ??
        (values.drawingLink.trim().startsWith("\\\\") ? values.drawingLink.trim() : order.workflow.drawingNetworkPath),
      drawingFileName: values.drawingFileName?.trim() ||
        drawingFileNameFromSource(values.drawingNetworkPath ?? values.drawingLink) ||
        order.workflow.drawingFileName,
      designDecision: null,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: "drawing_submitted",
        status: "waiting",
        date: updatedAt,
        user: currentUserName,
        changeSummary: "Drawing link submitted for design decision.",
        remark: values.notes.trim(),
      },
    ],
    updatedAt,
  };
}

function designDecisionLabel(decision: DesignDecision) {
  return decision === "approve"
    ? "Preparation: Design Approve"
    : "Preparation: Design Revision";
}

function applyDesignDecision(order: Order, decision: DesignDecision, currentUserName: string): Order {
  const updatedAt = new Date().toISOString();
  const status = decision === "approve" ? "Approve" : "Revision";

  return {
    ...order,
    status,
    tone: decision === "approve" ? "success" : "warning",
    workflow: {
      ...order.workflow,
      designDecision: decision,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: "design_decision",
        status: decision,
        date: updatedAt,
        user: currentUserName,
        changeSummary: designDecisionLabel(decision),
        remark: "",
      },
    ],
    updatedAt,
  };
}

function withToolingDetailsStatus(order: Order): Order {
  return withRequirementDetailsStatus(order, "tooling");
}

function withRequirementDetailsStatus(order: Order, kind: StandaloneRequirementKind): Order {
  const hasDetails = (kind === "tooling" ? order.toolingOrders : order.rubberOrders).length > 0;
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  return {
    ...order,
    status: `${label} Details ${hasDetails ? "Added" : "Required"}`,
    tone: hasDetails ? "info" : "warning",
    workflow: {
      ...order.workflow,
      currentStatus: hasDetails ? "in_progress" : "waiting",
    },
  };
}

function moveToStageWithActor(
  order: Order,
  stage: WorkflowStage,
  options: { preserveStatus?: boolean; actor: string; timestamp?: string; event?: { process: string; changeSummary: string } },
): Order {
  if (stage === "sample-progress" && isParallelPreparationPending(order) && !isParallelPreparationComplete(order)) return order;
  const isOffset = order.workflow.preparationType === "offset";
  if (isOffsetWorkflowStage(stage) && !isOffset) return order;
  // Optional preparation queues are projected from submissions, never from a linear handoff.
  if (stage === "offset-plate" || stage === "offset-varnish") return order;
  if (stage === "offset-material-request" && (order.stage !== "offset-prepress" ||
      !evaluateOffsetReadiness(order).planValid || !hasSubmittedOffsetBranch(order, "material"))) return order;
  if (stage === "offset-press" && (options.event?.process !== printingRouteProcess ||
      !evaluateOffsetReadiness(order).ready)) return order;
  if (isOffset && stage === "quality-control") {
    const handoff = order.processHistory.at(-1);
    if (order.stage !== "offset-press" || !evaluateOffsetReadiness(order).ready || !isOffsetPrintingHandoff(handoff) ||
        handoff?.date !== options.timestamp || handoff?.user !== options.actor) return order;
  }

  const details = workflowStageDetails[stage];
  const updatedAt = options.timestamp ?? new Date().toISOString();
  const status = options.preserveStatus ? order.status : details.status;
  const tone = options.preserveStatus ? order.tone : details.tone;
  const spkStatus = offsetSpkStatusForStage(stage);
  const latestSpkIndex = order.offsetSpks.length - 1;
  const offsetSpks =
    order.workflow.preparationType === "offset" && spkStatus && latestSpkIndex >= 0
      ? order.offsetSpks.map((spk, index) =>
        index === latestSpkIndex ? { ...spk, status: spkStatus } : spk,
      )
      : order.offsetSpks;
  const stageProcess =
    stage === "order"
      ? order.lineage.entryType === "version_up"
        ? `version_up_${order.lineage.versionNumber}`
        : "new_project"
      : details.process;

  return {
    ...order,
    ...details,
    status,
    tone,
    stage,
    offsetSpks,
    workflow: {
      ...order.workflow,
      currentStage: currentStageForQueue(stage),
      currentProcess: stageProcess,
      currentStatus: currentStatusForQueue(stage, status),
      progress: details.progress,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: options.event?.process ?? stageProcess,
        ...(options.event ? { stage } : {}),
        status,
        date: updatedAt,
        user: options.actor,
        changeSummary: options.event?.changeSummary ?? `Moved to ${details.process}.`,
        remark: "",
      },
    ],
    updatedAt,
  };
}

/** Only successful preparation actions can call this transition. */
function routeReadyOffsetToPrinting(order: Order, timestamp: string) {
  if (order.processHistory.some((entry) => entry.process === printingRouteProcess)) return order;
  return moveToStageWithActor(order, "offset-press", {
    actor: "System",
    timestamp,
    event: { process: printingRouteProcess, changeSummary: "Automatically routed to Press / Printing after all required preparations were continued." },
  });
}

/** Convert browser data created by earlier prototypes into the current workflow shape. */
export function normalizePersistedOrder(order: Order): Order {
  const legacySelections = order.workflow.productionOrder === "tooling_and_rubber"
    ? (["tooling", "rubber"] as PreparationOrderKind[])
    : order.workflow.productionOrder
      ? [order.workflow.productionOrder]
      : [];
  const preparationOrders = [...new Set(
    (order.workflow.preparationOrders ?? legacySelections).filter(
      (kind): kind is PreparationOrderKind => kind === "tooling" || kind === "rubber",
    ),
  )];

  const savedToolingRecords = order.offsetToolingRecords ?? [];
  const offsetToolingRecords = savedToolingRecords.length
    ? savedToolingRecords.map((record) => ({ ...record, status: record.status ?? defaultOffsetPreparationStatus }))
    : order.offsetTooling
      ? [{ ...order.offsetTooling, status: order.offsetTooling.status ?? defaultOffsetPreparationStatus, id: `legacy-offset-tooling-${order.id}` }]
      : [];
  const offsetToolingId = offsetToolingRecords.some((record) => record.id === order.offsetToolingId)
    ? order.offsetToolingId
    : offsetToolingRecords[0]?.id;

  return {
    ...order,
    toolingOrders: order.toolingOrders ?? [],
    rubberOrders: order.rubberOrders ?? [],
    materialRequests: order.materialRequests ?? [],
    offsetSpks: order.offsetSpks ?? [],
    offsetToolingRecords,
    offsetToolingId,
    offsetVarnish: order.offsetVarnish ? {
      ...order.offsetVarnish,
      status: order.offsetVarnish.status ?? defaultOffsetPreparationStatus,
      remark: order.offsetVarnish.remark ?? "",
    } : undefined,
    workflow: {
      ...order.workflow,
      preparationOrders,
      // Old screens still read this value. It is a single display adapter only.
      productionOrder: preparationOrders[0] ?? null,
    },
  };
}

function codePrefixForDate(value: string) {
  const date = new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${String(safeDate.getFullYear() % 100).padStart(2, "0")}${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}

/** Migrates only legacy PSR Sample Numbers while retaining each project's stable internal ID. */
export function migrateLegacyProjectCodes(orders: readonly Order[]): Order[] {
  const usedSequences = new Map<string, number>();
  const replacements = new Map<string, string>();
  const isLegacyPsrCode = (value: string) => /^PSR(?:#|\s|$)/i.test(value.trim());

  for (const order of orders) {
    const match = /^(\d{4})(\d{3})$/.exec(order.no.trim());
    if (match) usedSequences.set(match[1], Math.max(usedSequences.get(match[1]) ?? 0, Number(match[2])));
  }

  for (const order of [...orders].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  )) {
    if (!isLegacyPsrCode(order.no)) continue;
    const prefix = codePrefixForDate(order.createdAt);
    const nextSequence = (usedSequences.get(prefix) ?? 0) + 1;
    if (nextSequence > 999) throw new Error(`Monthly Sample Number sequence exhausted for ${prefix}.`);
    usedSequences.set(prefix, nextSequence);
    replacements.set(normalizeProjectCode(order.no), `${prefix}${String(nextSequence).padStart(3, "0")}`);
  }

  return orders.map((order) => {
    const code = replacements.get(normalizeProjectCode(order.no));
    if (!code) return order;
    const rootProjectNo = replacements.get(normalizeProjectCode(order.lineage.rootProjectNo)) ?? order.lineage.rootProjectNo;
    const sourceProjectNo = order.lineage.sourceProjectNo
      ? replacements.get(normalizeProjectCode(order.lineage.sourceProjectNo)) ?? order.lineage.sourceProjectNo
      : null;
    return {
      ...order,
      no: code,
      mainData: {
        ...order.mainData,
        mcNo: order.mainData.mcNo === order.no ? code : order.mainData.mcNo,
      },
      lineage: {
        ...order.lineage,
        rootProjectNo,
        sourceProjectNo,
      } as ProjectLineage,
    };
  });
}

function normalizePersistedOrders(orders: readonly Order[]) {
  return migrateLegacyProjectCodes(orders.map(normalizePersistedOrder));
}

function readPersistedOrders(saved: string): Order[] {
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every((order) =>
    order && typeof order.id === "string" && typeof order.projectDate === "string" &&
    order.workflow && order.mainData && order.lineage && Array.isArray(order.processHistory),
  )) throw new Error("Invalid saved project data");

  return normalizePersistedOrders(parsed).map((order) =>
    reconcileOffsetVarnishSubmission(order, order.updatedAt),
  );
}

/**
 * Browser-persisted prototype state. New records use the nested Project model, while the flat
 * display fields keep the existing dashboard and queue UI working unchanged.
 */
export function WorkflowOrdersProvider({ children, currentUserRole = "design", currentUserName = "System" }: { children: ReactNode; currentUserRole?: ProjectRole; currentUserName?: string }) {
  const [orders, publishOrders] = useState<Order[]>(() => normalizePersistedOrders(initialOrders));
  const [manualOffsetToolingRecords, setManualOffsetToolingRecords] = useState<ManualOffsetToolingRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const latestOrders = useRef(orders);
  const lastStoredOrders = useRef<string | null | undefined>(null);
  const lastStoredManualTooling = useRef<string | null>(null);
  const latestManualTooling = useRef(manualOffsetToolingRecords);
  const designFileUrls = useRef<string[]>([]);
  const commitOrders = useCallback((
    change: (current: Order[]) => Order[] | string,
    label = "Project data",
    projectId?: string,
  ): string => {
    if (!storageReady) return "Project data is still loading. Try again.";
    const current = latestOrders.current;
    let next: Order[];
    try {
      const stored = window.localStorage.getItem(ordersStorageKey);
      const storageChanged = stored !== lastStoredOrders.current;
      if (storageChanged && stored === null) return storageConflict;
      const persisted = storageChanged && stored !== null ? readPersistedOrders(stored) : current;
      const persistedById = new Map(persisted.map((order) => [order.id, order]));
      const isCurrent = (order: Order) => JSON.stringify(order) === JSON.stringify(persistedById.get(order.id));

      if (storageChanged && projectId) {
        const expected = current.find((order) => matchesOrder(order, projectId));
        if (!expected || !isCurrent(expected)) return storageConflict;
      }

      const changed = change(current);
      if (typeof changed === "string") return changed;
      next = changed;
      const currentById = new Map(current.map((order) => [order.id, order]));
      const updates = new Map(next.filter((order) => currentById.get(order.id) !== order).map((order) => [order.id, order]));
      if (!updates.size) return "";

      // New projects allocate their Sample Number and lineage from the whole list.
      if (storageChanged && [...updates.keys()].some((id) => {
        const expected = currentById.get(id);
        return !expected || !isCurrent(expected);
      })) return storageConflict;

      const merged = storageChanged ? persisted.map((order) => updates.get(order.id) ?? order) : next;
      const serialized = JSON.stringify(merged);
      if (window.localStorage.getItem(ordersStorageKey) !== stored) return storageConflict;
      window.localStorage.setItem(ordersStorageKey, serialized);
      lastStoredOrders.current = storageChanged ? undefined : serialized;
    } catch {
      return label + " could not be saved to browser storage. Your last saved data is unchanged.";
    }

    // Keep remotely changed records on their original form baseline until reload.
    latestOrders.current = next;
    publishOrders(next);
    return "";
  }, [storageReady]);
  const setOrders = useCallback((change: (current: Order[]) => Order[]) => {
    const error = commitOrders(change);
    if (error) window.alert(error);
  }, [commitOrders]);
  const moveToStage = useCallback((order: Order, stage: WorkflowStage, options: { preserveStatus?: boolean } = {}) =>
    moveToStageWithActor(order, stage, { ...options, actor: currentUserName }), [currentUserName]);
  useEffect(() => {
    // Restore browser data after hydration so the server and initial client render agree.
    try {
      const saved = window.localStorage.getItem(ordersStorageKey);
      if (saved !== null) {
        latestOrders.current = readPersistedOrders(saved);
        publishOrders(latestOrders.current);
      }
      lastStoredOrders.current = saved;
    } catch {
      // Do not mark unreadable data as a writable baseline.
      lastStoredOrders.current = undefined;
    }
    try {
      const savedManualTooling = window.localStorage.getItem(manualToolingStorageKey);
      if (savedManualTooling !== null) {
        const parsed: unknown = JSON.parse(savedManualTooling);
        if (!Array.isArray(parsed) || !parsed.every((record) => record && typeof record.id === "string" && typeof record.mcNo === "string")) {
          throw new Error("Invalid saved manual tooling data");
        }
        latestManualTooling.current = parsed;
        setManualOffsetToolingRecords(parsed);
      }
      lastStoredManualTooling.current = savedManualTooling;
    } catch {
      // Keep unreadable storage intact.
    }
    setStorageReady(true);
  }, []);

  const commitManualTooling = useCallback((change: (current: ManualOffsetToolingRecord[]) => ManualOffsetToolingRecord[]) => {
    if (!storageReady) return false;
    try {
      const next = change(latestManualTooling.current);
      const serialized = JSON.stringify(next);
      if (window.localStorage.getItem(manualToolingStorageKey) !== lastStoredManualTooling.current) {
        window.alert("Manual tooling data changed in another tab. Reload the page before saving.");
        return false;
      }
      window.localStorage.setItem(manualToolingStorageKey, serialized);
      lastStoredManualTooling.current = serialized;
      latestManualTooling.current = next;
      setManualOffsetToolingRecords(next);
      return true;
    } catch {
      window.alert("Manual tooling could not be saved to browser storage. Your last saved data is unchanged.");
      return false;
    }
  }, [storageReady]);

  useEffect(() => () => {
    designFileUrls.current.forEach((url) => URL.revokeObjectURL(url));
    designFileUrls.current = [];
  }, []);

  const updateDrawingStatus = useCallback((projectId: string, status: DrawingStatus) => {
    if (!canUpdateDrawingStatus(currentUserRole) || !drawingStatusOptions.some((option) => option.value === status)) return;
    setOrders((current) => current.map((order) => {
      if (order.id !== projectId || order.workflow.currentStatus === "cancelled" || getDrawingStatus(order) === status) return order;
      return appendHistory({ ...order, workflow: { ...order.workflow, drawingStatus: status } }, {
        process: "drawing_status_updated",
        status,
        user: currentUserName,
        changeSummary: `Drawing status changed to ${drawingStatusOptions.find((option) => option.value === status)?.label}.`,
        remark: `Updated by ${currentUserName}.`,
      });
    }));
  }, [currentUserRole, currentUserName, setOrders]);

  const addProject = useCallback((values: ProjectFormValues) => {
    const drawingLink = values.designFile
      ? URL.createObjectURL(values.designFile)
      : normalizeDrawingLink(values.drawingLink);
    if (values.designFile && drawingLink) {
      designFileUrls.current.push(drawingLink);
    }
    const error = commitOrders((currentOrders) => {
      const createdAt = new Date().toISOString();
      const code = nextOrderCode(currentOrders);
      const lineage: ProjectLineage =
        values.entryType === "version_up"
          ? createVersionUpLineage(currentOrders, values.previousProjectCode)
          : {
            entryType: "new",
            rootProjectNo: code,
            sourceProjectNo: null,
            versionNumber: 0,
          };
      const mainData = {
        ...normalizeBoardMaterialCapitalization(values.mainData),
        mcNo: values.mainData.mcNo.trim() || code,
      };
      // Offset starts in Prepress as soon as its Add Project submission succeeds.
      // Existing persisted projects keep their saved stage and legacy handoff path.
      const stage = values.preparationType === "offset" ? "offset-prepress" : "order";
      const details = workflowStageDetails[stage];
      const isVersionUp = lineage.entryType === "version_up";
      const process = stage === "order" && isVersionUp
        ? `Version Up ${lineage.versionNumber}`
        : details.process;
      const material = [mainData.boardQua, mainData.corFlut]
        .filter(Boolean)
        .join(" / ");

      return [
        {
          id: `project-${Date.now()}-${code}`,
          lineage,
          mainData,
          workflow: {
            preparationType: values.preparationType,
            convertingRoute:
              values.preparationType === "converting" && values.convertingRoute
                ? values.convertingRoute
                : null,
            preparationOrders: [],
            productionOrder: null,
            materialRequested: false,
            currentStage: currentStageForQueue(stage),
            currentProcess: stage === "order"
              ? isVersionUp
                ? `version_up_${lineage.versionNumber}`
                : "new_project"
              : details.process,
            currentStatus: currentStatusForQueue(stage, details.status),
            drawingLink,
            drawingFileName: values.designFile?.name,
            designDecision: null,
            progress: details.progress,
          },
          toolingOrders: [],
          rubberOrders: [],
          materialRequests: [],
          offsetSpks: [],
          processHistory: [
            {
              process: isVersionUp ? "version_up" : "new_project",
              status: "new",
              date: createdAt,
              user: currentUserName,
              changeSummary: isVersionUp
                ? `Version Up ${lineage.versionNumber} created from ${lineage.sourceProjectNo}.`
                : drawingLink
                  ? values.designFile
                    ? `New project created with design file: ${values.designFile.name}.`
                    : "New project created with a design link."
                  : "New project created.",
              remark: mainData.remark.trim(),
            },
            ...(stage === "offset-prepress" ? [{
              process: details.process,
              status: details.status,
              date: createdAt,
              user: "System",
              changeSummary: "Automatically routed to Prepress after project creation.",
              remark: "",
            }] : []),
          ],
          createdAt,
          updatedAt: createdAt,
          no: code,
          customer: mainData.custName || "-",
          product: mainData.component || "-",
          description: mainData.remark || "-",
          material: material || "-",
          priority: "Medium",
          process,
          pic: values.pic || "-",
          projectDate: values.projectDate
            ? displayDate(values.projectDate)
            : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(createdAt)),
          deadline: displayDate(values.deadline),
          status: details.status,
          tone: details.tone,
          stage,
          progress: details.progress,
        },
        ...currentOrders,
      ];
    });
    if (error && values.designFile && drawingLink) {
      URL.revokeObjectURL(drawingLink);
      designFileUrls.current.pop();
    }
    return error;
  }, [currentUserName, commitOrders]);

  const createStandaloneRequirementOrder = useCallback(
    (
      kind: StandaloneRequirementKind,
      values: StandaloneRequirementOrderValues,
      continueWorkflow: boolean,
    ) => {
      setOrders((currentOrders) => {
        const createdAt = new Date().toISOString();
        const code = nextOrderCode(currentOrders);
        const stage = standaloneRequirementStage(kind);
        const details = workflowStageDetails[stage];
        const mainData = createStandaloneRequirementMainData(code, values);
        const requirement = {
          ...values.requirement,
          sequence: 1,
        };
        const kindLabel = kind === "tooling" ? "Tooling" : "Rubber";
        const pic = values.pic.trim() || values.requirement.requestedBy.trim() || "-";
        const initialOrder: Order = {
          id: `standalone-${kind}-${Date.now()}-${code}`,
          lineage: {
            entryType: "new",
            rootProjectNo: code,
            sourceProjectNo: null,
            versionNumber: 0,
          },
          mainData,
          workflow: {
            preparationType: "converting",
            convertingRoute: "by_production",
            preparationOrders: [kind],
            productionOrder: kind,
            materialRequested: false,
            currentStage: currentStageForQueue(stage),
            currentProcess: details.process,
            currentStatus: currentStatusForQueue(stage, details.status),
            drawingLink: null,
            designDecision: null,
            progress: details.progress,
          },
          toolingOrders: kind === "tooling" ? [requirement] : [],
          rubberOrders: kind === "rubber" ? [requirement] : [],
          materialRequests: [],
          offsetSpks: [],
          processHistory: [
            {
              process: `standalone_${kind}_order`,
              status: requirement.status,
              date: createdAt,
              user: currentUserName,
              changeSummary: `Standalone ${kindLabel.toLowerCase()} order created for ${requirement.requirementType}.`,
              remark: requirement.remark.trim(),
            },
          ],
          createdAt,
          updatedAt: createdAt,
          no: code,
          customer: mainData.custName || "-",
          product: mainData.component || "-",
          description: mainData.remark || "-",
          material: mainData.boardQua || "-",
          priority: values.priority,
          process: details.process,
          pic,
          projectDate: displayDate(values.projectDate),
          deadline: displayDate(values.deadline),
          status: details.status,
          tone: details.tone,
          stage,
          progress: details.progress,
        };
        const nextStage =
          continueWorkflow && isReadyToContinueRequirement(requirement.status)
            ? nextStageForOrder(initialOrder)
            : undefined;
        const completedOrder = nextStage
          ? moveToStage(initialOrder, nextStage)
          : initialOrder;

        return [completedOrder, ...currentOrders];
      });
    },
    [currentUserName, moveToStage, setOrders],
  );

  const completeIncomingPreparation = useCallback(
    (orderNo: string, values: PreparationWorkflowUpdate) => {
      return commitOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (!matchesOrder(order, orderNo)) return order;
          if (
            order.stage !== "order" ||
            order.workflow.currentStatus === "cancelled" ||
            !isCompleteIncomingPreparation(values) || lockedOffsetReadinessMasterFields(order).length > 0 || hasValidOffsetVarnishCompletion(order)
          ) {
            return order;
          }

          const selections = values.route === "by_production"
            ? selectedPreparationOrders(values)
            : [];
          let prepared = applyIncomingPreparation(order, values, currentUserName);
          if (selections.includes("tooling") && values.toolingRequirement) {
            prepared = appendHistory({
              ...prepared,
              toolingOrders: [...prepared.toolingOrders, {
                ...values.toolingRequirement,
                sequence: prepared.toolingOrders.length + 1,
              }],
            }, {
              process: "tooling_requirement",
              status: values.toolingRequirement.status,
              user: currentUserName,
              changeSummary: "Tooling requirement added from Incoming Design.",
              remark: values.toolingRequirement.remark,
            });
          }
          if (selections.includes("rubber") && values.rubberRequirement) {
            prepared = appendHistory({
              ...prepared,
              rubberOrders: [...prepared.rubberOrders, { ...values.rubberRequirement, sequence: prepared.rubberOrders.length + 1 }],
            }, {
              process: "rubber_requirement",
              status: values.rubberRequirement.status,
              user: currentUserName,
              changeSummary: "Rubber requirement added from Incoming Design.",
              remark: values.rubberRequirement.remark,
            });
          }
          return moveToStage(
            prepared,
            values.route === "offset" ? "offset-prepress" : "design-progress",
          );
        }),
        "Preparation plan", orderNo,
      );
    },
    [currentUserName, moveToStage, commitOrders],
  );

  const updateIncomingRequirementDetails = useCallback(
    (
      orderNo: string,
      kind: PreparationOrderKind,
      values: RequirementUpdateValues,
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            order.stage === "order" ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const currentRecords = kind === "tooling"
            ? order.toolingOrders
            : order.rubberOrders;
          const previous = currentRecords.at(-1);
          const nextRecord = {
            ...values,
            sequence: previous?.sequence ?? currentRecords.length + 1,
          };
          const nextRecords = previous
            ? [...currentRecords.slice(0, -1), nextRecord]
            : [...currentRecords, nextRecord];
          const label = kind === "tooling" ? "Tooling" : "Rubber";
          const updatedOrder = kind === "tooling"
            ? { ...order, toolingOrders: nextRecords }
            : { ...order, rubberOrders: nextRecords };
          if (isParallelPreparationPending(order)) {
            const ready = isReadyToContinueRequirement(values.status);
            updatedOrder.workflow = { ...updatedOrder.workflow, ...(kind === "tooling"
              ? { toolingReady: ready, toolingForwarded: ready && Boolean(order.workflow.toolingForwarded) }
              : { rubberReady: ready, rubberForwarded: ready && Boolean(order.workflow.rubberForwarded) }) };
          }

          return appendHistory(updatedOrder, {
            process: `${kind}_requirement`,
            status: values.status,
            user: currentUserName,
            changeSummary: `${label} requirement updated from Incoming Design.`,
            remark: values.remark.trim(),
          });
        }),
      );
    },
    [currentUserName, setOrders],
  );

  const submitDrawing = useCallback(
    (orderNo: string, values: DrawingSubmission) => {
      const drawingLink = normalizeDrawingLink(values.drawingLink);

      if (!drawingLink) return;

      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            order.stage !== "design-progress" ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          return moveToStage(
            applyDrawingSubmission(order, values, drawingLink, currentUserName),
            "review-approval",
          );
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const completeDesignDecision = useCallback(
    (orderNo: string, decision: DesignDecision) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            order.stage !== "review-approval" ||
            order.workflow.currentStatus === "cancelled" ||
            !order.workflow.drawingLink
          ) {
            return order;
          }

          return moveToStage(
            applyDesignDecision(order, decision, currentUserName),
            decision === "approve"
              ? firstStageAfterDesignApproval(order)
              : "design-progress",
            { preserveStatus: decision === "revision" },
          );
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const cancelIncomingProject = useCallback((orderNo: string, reason: string) => {
    const cancellationReason = reason.trim();

    if (!cancellationReason) return "Cancellation reason is required.";

    return commitOrders((currentOrders) =>
      currentOrders.map((order) => {
        if (
          !matchesOrder(order, orderNo) ||
          order.workflow.currentStatus === "cancelled"
        ) {
          return order;
        }

        const updatedAt = new Date().toISOString();

        return {
          ...order,
          process: "Cancelled Project",
          status: "Cancelled",
          tone: "danger",
          stage: "completed",
          workflow: {
            ...order.workflow,
            currentStage: "completed",
            currentProcess: "project_cancelled",
            currentStatus: "cancelled",
          },
          processHistory: [
            ...order.processHistory,
            {
              process: "project_cancelled",
              status: "cancelled",
              date: updatedAt,
              user: currentUserName,
              changeSummary: "Project cancelled.",
              remark: cancellationReason,
            },
          ],
          updatedAt,
        };
      }),
      "Project cancellation", orderNo,
    );
  }, [currentUserName, commitOrders]);

  const editProject = useCallback((orderNo: string, values: ProjectFormValues) => {
    const fileUrl = values.designFile ? URL.createObjectURL(values.designFile) : null;
    if (fileUrl) designFileUrls.current.push(fileUrl);
    const error = commitOrders((currentOrders) => {
      const current = currentOrders.find((order) => matchesOrder(order, orderNo));
      if (current && current.stage !== "order" && current.workflow.preparationType !== values.preparationType &&
          (current.workflow.preparationType === "offset" || values.preparationType === "offset")) {
        return "The preparation type cannot be changed after the project has entered its workflow.";
      }
      return currentOrders.map((order) => {
        if (!matchesOrder(order, orderNo) || order.workflow.currentStatus === "cancelled") return order;
        const varnishSubmitted = isOffsetVarnishQueueOrder(order);
        const varnishLocked = varnishSubmitted && !canEditOffsetVarnish(order);
        const lockedMasterFields = lockedOffsetReadinessMasterFields(order);
        const readinessLocked = lockedMasterFields.length > 0;
        const planSubmitted = order.workflow.preparationType === "offset" &&
          (order.offsetPreparationPlan?.material?.state === "submitted" || Boolean(order.offsetPreparationRecords?.length));
        const preparationType = readinessLocked || planSubmitted ? order.workflow.preparationType : values.preparationType;
        const mainData = normalizeBoardMaterialCapitalization(values.mainData);
        if (readinessLocked) {
          Object.assign(mainData, Object.fromEntries(lockedMasterFields.map((field) => [field, order.mainData[field]])));
        }
        if (varnishLocked) {
          for (const field of varnishSpecificationFields) mainData[field] = order.mainData[field];
        }
        const changedVarnishReadiness = varnishSubmitted && (preparationType !== "offset" ||
          JSON.stringify(varnishSpecification(order.mainData)) !== JSON.stringify(varnishSpecification(mainData)));
        const preparationOrders = preparationType === "converting" && values.convertingRoute === "by_production"
          ? order.workflow.preparationOrders ?? []
          : [];
        const edited: Order = {
          ...order,
          mainData,
          ...(changedVarnishReadiness && order.offsetVarnish ? {
            offsetVarnish: {
              ...order.offsetVarnish,
              revision: (order.offsetVarnish.revision ?? 0) + 1,
              completion: undefined,
            },
          } : {}),
          customer: values.mainData.custName || "-",
          product: values.mainData.component || "-",
          description: values.mainData.remark || "-",
          material: lockedMasterFields.includes("boardQua") ? order.material : [mainData.boardQua, mainData.corFlut].filter(Boolean).join(" / ") || "-",
          pic: values.pic || "-",
          projectDate: displayDate(values.projectDate),
          deadline: displayDate(values.deadline),
          workflow: {
            ...order.workflow,
            preparationType,
            convertingRoute: preparationType === "converting" ? values.convertingRoute || null : null,
            preparationOrders,
            productionOrder: preparationOrders[0] ?? null,
            drawingLink: fileUrl ?? order.workflow.drawingLink,
            drawingFileName: values.designFile?.name ?? order.workflow.drawingFileName,
          },
        };
        if (order.workflow.preparationType === "offset") {
          const progress = { ...order.offsetPreparationProgress };
          for (const step of offsetCompletionSteps) {
            if (preparationType !== "offset" || offsetPreparationFingerprint(edited, step) !== offsetPreparationFingerprint(order, step)) {
              progress[step] = { revision: (progress[step]?.revision ?? 0) + 1 };
            }
          }
          if (Object.keys(progress).length) edited.offsetPreparationProgress = progress;
        }
        return appendHistory(edited, {
          process: "project_updated",
          status: "updated",
          user: currentUserName,
          changeSummary: "Project data edited from Incoming Design details.",
          remark: values.mainData.remark.trim(),
        });
      });
    }, "Project data", orderNo);
    if (error && fileUrl) {
      URL.revokeObjectURL(fileUrl);
      designFileUrls.current.pop();
    }
    return error;
  }, [currentUserName, commitOrders]);

  const updateOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues>) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          matchesOrder(order, orderNo) && order.workflow.currentStatus !== "cancelled"
            ? appendHistory(applyOrderValues(order, values), {
              process: "project_updated",
              status: "updated",
              user: currentUserName,
              changeSummary: "Project information updated.",
              remark: values.description?.trim() ?? "",
            })
            : order,
        ),
      );
    },
    [currentUserName, setOrders],
  );

  const saveToolingRequirement = useCallback(
    (
      orderNo: string,
      values: RequirementUpdateValues,
      continueWorkflow: boolean,
      saveMode: "draft" | "repeat" = "repeat",
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          const isInitialQueueTask = isInRequirementQueue(order, "tooling");
          if (
            !matchesOrder(order, orderNo) ||
            !canRecordConvertingRequirement(order, "tooling") ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const replaceLatestRecord = order.toolingOrders.length > 0 &&
            (isDrawingReviewPendingStage(order.stage) || saveMode === "draft");
          const canContinueWorkflow = continueWorkflow && isReadyToContinueRequirement(values.status);
          const record = {
            ...values,
            sequence: replaceLatestRecord
              ? order.toolingOrders.at(-1)?.sequence ?? order.toolingOrders.length
              : order.toolingOrders.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              toolingOrders: replaceLatestRecord
                ? [...order.toolingOrders.slice(0, -1), record]
                : [...order.toolingOrders, record],
            },
            {
              process: "tooling_requirement",
              status: values.status,
              user: currentUserName,
              changeSummary: replaceLatestRecord
                ? isDrawingReviewPendingStage(order.stage)
                  ? "Tooling requirement updated while drawing review is pending."
                  : `Tooling draft updated to ${values.status}.`
                : `Tooling ${values.requirementType} updated to ${values.status}.`,
              remark: values.remark.trim(),
            },
          );
          if (isInitialQueueTask && isParallelPreparationPending(order)) {
            const ready = isReadyToContinueRequirement(values.status);
            const prepared = { ...updated, workflow: {
              ...updated.workflow, toolingReady: ready,
              toolingForwarded: ready && (canContinueWorkflow || Boolean(order.workflow.toolingForwarded)),
            } };
            return canContinueWorkflow && isParallelPreparationComplete(prepared)
              ? moveToStage(prepared, "sample-progress")
              : prepared;
          }
          // These preparation details may be edited before drawing approval,
          // but must remain in their queue and cannot advance the workflow yet.
          if (isDrawingReviewPendingStage(order.stage)) return updated;
          if (canContinueWorkflow) {
            const forwarded = {
              ...updated,
              workflow: { ...updated.workflow, toolingReady: isReadyToContinueRequirement(values.status), toolingForwarded: true },
            };
            // A repeat order is only an additional record; it must not send a
            // project that is already in Process/Closing back to Preparation.
            if (!isInitialQueueTask || !isConvertingRequirementStage(order.stage)) {
              return forwarded;
            }
            // Standalone orders retain their original direct material handoff.
            if (order.requirementBranch) return moveToStage(forwarded, "material-request");
            // Request Material deliberately remains independent: it may proceed
            // even while a supervisor sees another Tooling/Rubber task pending.
            if (forwarded.workflow.materialRequested) return moveToStage(forwarded, "material-request");
            // Without MI, wait for a second selected task; the last one sends
            // the project straight to Sample Process.
            return hasUnforwardedPreparationOrder(forwarded)
              ? withToolingDetailsStatus(forwarded)
              : moveToStage(forwarded, "sample-progress");
          }
          return isInitialQueueTask && isConvertingRequirementStage(order.stage)
            ? withToolingDetailsStatus(updated)
            : updated;
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const saveRubberRequirement = useCallback(
    (
      orderNo: string,
      values: RequirementUpdateValues,
      continueWorkflow: boolean,
      saveMode: "draft" | "repeat" = "repeat",
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          const isInitialQueueTask = isInRequirementQueue(order, "rubber");
          if (
            !matchesOrder(order, orderNo) ||
            !canRecordConvertingRequirement(order, "rubber") ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const replaceLatestRecord = order.rubberOrders.length > 0 &&
            (isDrawingReviewPendingStage(order.stage) || saveMode === "draft");
          const canContinueWorkflow = continueWorkflow && isReadyToContinueRequirement(values.status);
          const record = {
            ...values,
            sequence: replaceLatestRecord
              ? order.rubberOrders.at(-1)?.sequence ?? order.rubberOrders.length
              : order.rubberOrders.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              rubberOrders: replaceLatestRecord
                ? [...order.rubberOrders.slice(0, -1), record]
                : [...order.rubberOrders, record],
            },
            {
              process: "rubber_requirement",
              status: values.status,
              user: currentUserName,
              changeSummary: replaceLatestRecord
                ? isDrawingReviewPendingStage(order.stage)
                  ? "Rubber requirement updated while drawing review is pending."
                  : `Rubber draft updated to ${values.status}.`
                : `Rubber ${values.requirementType} updated to ${values.status}.`,
              remark: values.remark.trim(),
            },
          );
          if (isInitialQueueTask && isParallelPreparationPending(order)) {
            const ready = isReadyToContinueRequirement(values.status);
            const prepared = { ...updated, workflow: {
              ...updated.workflow, rubberReady: ready,
              rubberForwarded: ready && (canContinueWorkflow || Boolean(order.workflow.rubberForwarded)),
            } };
            return canContinueWorkflow && isParallelPreparationComplete(prepared)
              ? moveToStage(prepared, "sample-progress")
              : prepared;
          }
          if (isDrawingReviewPendingStage(order.stage)) return updated;
          if (canContinueWorkflow) {
            const forwarded = {
              ...updated,
              workflow: { ...updated.workflow, rubberReady: isReadyToContinueRequirement(values.status), rubberForwarded: true },
            };
            if (!isInitialQueueTask || !isConvertingRequirementStage(order.stage)) {
              return forwarded;
            }
            if (order.requirementBranch) return moveToStage(forwarded, "material-request");
            if (forwarded.workflow.materialRequested) return moveToStage(forwarded, "material-request");
            return hasUnforwardedPreparationOrder(forwarded)
              ? withRequirementDetailsStatus(forwarded, "rubber")
              : moveToStage(forwarded, "sample-progress");
          }
          return isInitialQueueTask && isConvertingRequirementStage(order.stage)
            ? withRequirementDetailsStatus(updated, "rubber")
            : updated;
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const saveMaterialRequest = useCallback(
    (orderNo: string, values: MaterialRequestValues, continueWorkflow: boolean) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          const isMaterialQueue = Boolean(
            materialRequestQueueEntries(order).some((entry) => entry.id === order.id),
          );
          if (
            !matchesOrder(order, orderNo) ||
            !isMaterialQueue ||
            order.workflow.currentStatus === "cancelled" ||
            (order.workflow.preparationType === "offset" && (!isLegacyOffsetPreparation(order) || !canEditOffsetPreparation(order, "material")))
          ) {
            return order;
          }

          // Offset MI always retains the project master Material. Its form is
          // intentionally read-only, and this guard also protects callers
          // outside the form from overwriting it.
          const savedValues = order.workflow.preparationType === "offset"
            ? {
              ...values,
              material: order.mainData.boardQua || (order.material === "-" ? "" : order.material) || order.materialRequests.at(-1)?.material || "",
              unit: values.unit || "sheet",
            }
            : values;
          if (order.workflow.preparationType === "offset" && validateOffsetMaterialValues(savedValues, "draft")) return order;
          const replacesOffsetRecord = order.workflow.preparationType === "offset" && order.materialRequests.length > 0;
          const record = {
            ...savedValues,
            sequence: replacesOffsetRecord ? order.materialRequests.at(-1)!.sequence : order.materialRequests.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              materialRequests: replacesOffsetRecord ? [...order.materialRequests.slice(0, -1), record] : [...order.materialRequests, record],
              workflow: {
                ...order.workflow,
                materialRequested: true,
                materialReady: order.workflow.preparationType === "offset"
                  ? savedValues.status === "released" || savedValues.status === "received"
                  : order.workflow.materialReady,
                materialForwarded: continueWorkflow && savedValues.source
                  ? { ...order.workflow.materialForwarded, [savedValues.source]: true }
                  : order.workflow.materialForwarded,
              },
            },
            {
              source: savedValues.source,
              process: "material_request",
              status: savedValues.status,
              user: currentUserName,
              changeSummary: `Material request ${savedValues.miNumber} updated to ${savedValues.status}.${order.workflow.preparationType !== "offset" && savedValues.offsetNextStep ? ` Next step: ${savedValues.offsetNextStep === "tooling_plate" ? "Tooling / Plate" : "Block / Spot Varnish"}.` : ""}`,
              remark: savedValues.remark.trim(),
            },
          );

          // Legacy Offset MI is a draft-only adapter to its existing queue.
          if (order.workflow.preparationType === "offset") return updated;

          if (isParallelPreparationPending(order)) {
            const ready = savedValues.status === "released" || savedValues.status === "received";
            const prepared = { ...updated, workflow: {
              ...updated.workflow,
              materialReady: ready && (continueWorkflow || Boolean(order.workflow.materialReady)),
            } };
            return isParallelPreparationComplete(prepared) ? moveToStage(prepared, "sample-progress") : prepared;
          }

          const canMoveToNextStage =
            ["converting-design", "converting-production", "material-request", "offset-material-request"].includes(order.stage) ||
            savedValues.status === "released" ||
            savedValues.status === "received";

          const nextStage = continueWorkflow && canMoveToNextStage
            ? (["converting-design", "converting-production"].includes(order.stage)
                ? "sample-progress"
                : order.stage === "material-request" || order.stage === "offset-material-request"
                  ? nextStageForOrder(updated)
                  : undefined)
            : undefined;

          return nextStage ? moveToStage(updated, nextStage) : updated;

        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const commitOffsetPreparation = useCallback((projectId: string, label: string, change: OffsetPreparationChange, checkPrinting = false) => {
    let updated: Order | undefined;
    const error = commitOrders((current) => {
      const order = current.find((item) => item.id === projectId);
      if (!order) return "Offset project could not be found.";
      const timestamp = new Date().toISOString();
      const saved = change(order, timestamp);
      if (typeof saved === "string") return saved;
      const next = checkPrinting ? routeReadyOffsetToPrinting(saved, timestamp) : saved;
      updated = next;
      return current.map((item) => item.id === projectId ? next : item);
    }, label, projectId);
    return error || updated || "Offset project could not be found.";
  }, [commitOrders]);

  const saveOffsetStep = useCallback((
    projectId: string,
    step: OffsetCompletionStep,
    action: OffsetPreparationSaveAction,
    expectedSnapshot: string,
    validationError: string,
    ready: boolean,
    apply: (order: Order, timestamp: string) => Order | string,
  ) => {
    const { label, process, stage } = offsetPreparationHistory[step];
    if (validationError) return validationError;
    if (action !== "draft" && action !== "continue") return "Select a save action.";

    return offsetPreparationError(commitOffsetPreparation(projectId, label, (order, timestamp) => {
      if (!canEditOffsetPreparation(order, step)) return label + " cannot be edited at this stage.";
      if (action === "continue" && !canContinueOffsetPreparation(order, step)) return label + " has no submitted preparation branch.";
      if (offsetPreparationSnapshot(order, step) !== expectedSnapshot) return label + " data changed. Reopen the editor and try again.";

      const next = apply(order, timestamp);
      if (typeof next === "string") return next;
      const fingerprint = offsetPreparationFingerprint(next, step);
      const previous = order.offsetPreparationProgress?.[step];
      const record = offsetPreparationRecord(next, step)!;
      const dataChanged = fingerprint !== offsetPreparationFingerprint(order, step);
      if (action === "draft" && !dataChanged && record.remark === offsetPreparationRecord(order, step)?.remark) return order;

      return appendHistory({
        ...next,
        offsetPreparationProgress: {
          ...order.offsetPreparationProgress,
          [step]: {
            revision: (previous?.revision ?? 0) + 1,
            completion: action === "continue" ? { actor: currentUserName, timestamp, fingerprint } : undefined,
          },
        },
      }, {
        process,
        stage,
        status: "status" in record ? record.status : ready ? "Ready" : "Waiting",
        user: currentUserName,
        changeSummary: label + (action === "continue" ? ": Save & Continue." : step === "material" ? ": Save MI." : ": Save Draft."),
        remark: record.remark,
      }, timestamp);
    }, action === "continue"));
  }, [commitOffsetPreparation, currentUserName]);

  const saveOffsetPrepress = useCallback<OffsetPreparationSave<OffsetPrepressValues>>(
    (projectId, values, action, snapshot) => saveOffsetStep(
      projectId, "prepress", action, snapshot, validateOffsetPrepressValues(values, action), isOffsetPrepressReady(values),
      (order, timestamp) => ({
        ...order,
        offsetPrepress: {
          ...values,
          noJoPnCode: order.mainData.mcNo || order.offsetPrepress?.noJoPnCode || "",
          remark: values.remark.trim(),
          recordedAt: timestamp,
          updatedBy: currentUserName,
        },
      }),
    ),
    [currentUserName, saveOffsetStep],
  );

  const saveOffsetMaterial = useCallback<OffsetPreparationSave<MaterialRequestValues>>(
    (projectId, values, action, snapshot) => saveOffsetStep(
      projectId, "material", action, snapshot, validateOffsetMaterialValues(values, action), isOffsetMaterialReady(values),
      (order) => {
        const previous = order.materialRequests.at(-1);
        return {
          ...order,
          materialRequests: [...order.materialRequests.slice(0, -1), {
            sequence: previous?.sequence ?? 1,
            ...(previous?.offsetNextStep ? { offsetNextStep: previous.offsetNextStep } : {}),
            miNumber: previous?.miNumber ?? "OMI-" + order.no.replace("#", "-") + "-1",
            requestedBy: previous?.requestedBy ?? (order.pic === "-" ? "" : order.pic),
            status: values.status,
            requestDate: values.requestDate,
            material: offsetMaterialName(order),
            quantity: values.quantity.trim(),
            unit: values.unit,
            remark: values.remark.trim(),
          }],
          workflow: { ...order.workflow, materialRequested: true, materialReady: !validateOffsetMaterialValues(values, "continue") },
        };
      },
    ),
    [saveOffsetStep],
  );

  const saveOffsetTooling = useCallback<OffsetPreparationSave<OffsetToolingValues>>(
    (projectId, values, action, snapshot) => {
      const status = values.status;
      if (!isOffsetPreparationStatus(status)) return "Select a Tooling Status.";
      return saveOffsetStep(
        projectId, "tooling", action, snapshot, "", isOffsetToolingReady(values),
        (order) => {
          const record = activeOffsetTooling(order)!;
          const input = {
            ...values,
            mcNo: record.mcNo || values.mcNo,
            grammage: record.grammage || values.grammage,
            priority: record.priority || values.priority,
            machine: record.machine || values.machine,
            orderDate: record.orderDate ?? "",
          };
          const error = validateOffsetToolingValues(input, action);
          if (error) return error;
          return {
            ...order,
            offsetToolingRecords: order.offsetToolingRecords?.map((item) => item.id === record.id ? {
              ...record,
              ...input,
              id: record.id,
              recordedAt: record.recordedAt,
              updatedBy: currentUserName,
              remark: values.remark.trim(),
            } : item),
          };
        },
      );
    },
    [currentUserName, saveOffsetStep],
  );

  const saveOffsetVarnish = useCallback<OffsetPreparationSave<OffsetVarnishValues>>(
    (projectId, values, action, expectedSnapshot) => {
      const validationError = validateOffsetVarnishValues(values, action);
      const status = values.status;
      if (validationError || !status) return validationError;
      if (action !== "draft" && action !== "continue") return "Select a Varnish save action.";

      return offsetPreparationError(commitOffsetPreparation(projectId, "Varnish", (order, timestamp) => {
        if (hasValidOffsetVarnishCompletion(order)) return "Varnish has been completed and cannot be edited.";
        if (!canEditOffsetVarnish(order)) return "Varnish can only be edited for an active project with submitted Varnish before Printing.";
        if (offsetVarnishSnapshot(order) !== expectedSnapshot) return "Varnish data changed. Reopen the editor and try again.";
        const previous = order.offsetVarnish;
        const remark = values.remark.trim();
        const statusChanged = status !== (previous?.status ?? defaultOffsetPreparationStatus);
        if (action === "draft" && previous && !statusChanged && remark === previous.remark) return order;

        const varnish: OffsetVarnishRecord = {
          status,
          remark,
          updatedAt: timestamp,
          updatedBy: currentUserName,
          revision: (previous?.revision ?? 0) + 1,
          completion: action === "continue"
            ? { actor: currentUserName, timestamp, fingerprint: offsetVarnishFingerprint(order, status) }
            : undefined,
        };
        return appendHistory({ ...order, offsetVarnish: varnish }, {
          process: "offset_varnish",
          stage: "offset-varnish",
          status,
          user: currentUserName,
          changeSummary: action === "continue"
            ? "Offset Block / Spot Varnish: Save & Continue."
            : "Offset Block / Spot Varnish: Save Draft.",
          remark,
        }, timestamp);
      }, action === "continue"));
    },
    [commitOffsetPreparation, currentUserName],
  );

  const completeOffsetPrinting = useCallback((projectId: string, notes: string, expectedUpdatedAt: string) => {
    if (typeof notes !== "string") return "Enter valid Process Notes.";
    return offsetPreparationError(commitOffsetPreparation(projectId, "Press / Printing", (order, timestamp) => {
      if (order.stage === "offset-press" && !evaluateOffsetReadiness(order).ready) {
        return "Press / Printing requires valid completion for all selected preparations before QC.";
      }
      if (!canEditOffsetPrinting(order)) return "Press / Printing cannot be edited at this stage.";
      if (order.updatedAt !== expectedUpdatedAt) return "Printing data changed. Reopen the editor and try again.";
      const values = { description: notes.trim() };
      const handedOff = appendHistory(applyOffsetHandoffValues(order, values), {
        process: "handoff_details_updated", stage: "offset-press", status: "updated", user: currentUserName,
        pic: order.pic, deadline: order.deadline, changeSummary: "Task handoff details updated.", remark: values.description,
      }, timestamp);
      const qc = moveToStageWithActor(handedOff, "quality-control", { actor: currentUserName, timestamp });
      return qc === handedOff ? "Press / Printing completion could not be verified." : qc;
    }));
  }, [commitOffsetPreparation, currentUserName]);

  const saveOffsetPreparationPlan = useCallback(
    (projectId: string, values: OffsetPreparationPlanValues, expectedSnapshot: string) => {
      if (!draftOffsetPlan(values)) return "Use Update to submit the preparation plan.";
      const draft = values.tooling?.draft;
      const validationError = draft ? validateOffsetToolingValues({ ...draft, status: offsetToolingStatus(draft.status) }, "draft") : "";
      if (validationError) return validationError;
      return commitOffsetPreparation(projectId, "Preparation plan", (order, timestamp) => {
        if (!canChangeOffsetPreparationPlan(order)) return "This preparation plan can no longer be changed.";
        if (offsetPlanSnapshot(order) !== expectedSnapshot) return "Preparation plan changed. Reopen Details and try again.";
        const existing = order.offsetPreparationPlan;
        const plan = createOffsetPreparationPlan(order.id, values, currentUserName, timestamp, existing?.tooling);
        if (existing && JSON.stringify({ ...existing, updatedAt: timestamp, updatedBy: currentUserName }) === JSON.stringify(plan)) return order;
        return appendHistory({
          ...order,
          offsetPreparationPlan: plan,
          offsetPreparationRecords: order.offsetPreparationRecords ?? [],
        }, {
          process: "offset_preparation_plan",
          stage: "offset-prepress",
          status: "draft",
          user: currentUserName,
          changeSummary: "Offset preparation plan saved as draft.",
          remark: plan.remark ?? "",
        }, timestamp);
      });
    },
    [commitOffsetPreparation, currentUserName],
  );

  const submitOffsetMaterialPreparation = useCallback(
    (projectId: string, values: OffsetPreparationSubmission, expectedSnapshot: string) => {
      const validationError = validateOffsetPreparationSubmission(values);
      if (validationError) return validationError;
      return offsetPreparationError(commitOffsetPreparation(projectId, "Preparation plan", (order, timestamp) => {
        if (!canChangeOffsetPreparationPlan(order)) return "This preparation plan can no longer be changed.";
        if (offsetPlanSnapshot(order) !== expectedSnapshot) return "Preparation plan changed. Reopen Details and try again.";
        const plan = createOffsetPreparationPlan(order.id, {
          material: { state: "submitted" },
          ...(values.rows.includes("tooling") ? { tooling: { state: "submitted", draft: values.toolingDraft } } : {}),
          ...(values.rows.includes("varnish") ? { varnish: { state: "submitted" } } : {}),
          remark: values.remark,
        }, currentUserName, timestamp, order.offsetPreparationPlan?.tooling);
        const records = appendOffsetPreparationRecords(order.offsetPreparationRecords, plan, currentUserName, timestamp);
        const tooling = plan.tooling?.draft ? {
          ...plan.tooling.draft,
          id: "offset-tooling-" + order.id + "-" + timestamp,
          recordedAt: timestamp,
          updatedBy: currentUserName,
        } : undefined;
        let submitted = appendHistory({
          ...order,
          offsetPreparationPlan: plan,
          offsetPreparationRecords: records,
          ...(plan.varnish && !order.offsetVarnish ? {
            offsetVarnish: { status: defaultOffsetPreparationStatus, remark: "", updatedAt: timestamp, updatedBy: currentUserName },
          } : {}),
          ...(tooling ? {
            offsetToolingRecords: [...(order.offsetToolingRecords ?? []), tooling],
            offsetToolingId: tooling.id,
          } : {}),
        }, {
          process: "offset_preparation_plan",
          stage: "offset-prepress",
          status: "submitted",
          user: currentUserName,
          changeSummary: "Offset Material preparation submitted: " + submittedOffsetPreparationKinds(plan).join(", ") + ".",
          remark: plan.remark ?? "",
        }, timestamp);
        if (tooling) submitted = appendHistory(submitted, {
          process: "offset_tooling",
          stage: "offset-plate",
          status: "submitted",
          user: currentUserName,
          changeSummary: `Offset Tooling / Plate ${tooling.mcNo.trim() || "record"} submitted from Prepress.`,
          remark: plan.remark ?? "",
        }, timestamp);
        if (plan.varnish) submitted = appendHistory(submitted, {
          process: "offset_varnish",
          stage: "offset-varnish",
          status: "submitted",
          user: currentUserName,
          changeSummary: "Offset Block / Spot Varnish monitoring submitted from Prepress.",
          remark: plan.remark ?? "",
        }, timestamp);

        return moveToStage({
          ...submitted,
          workflow: { ...submitted.workflow, offsetHandoffRemark: plan.remark ?? "" },
        }, "offset-material-request");
      }, true));
    },
    [commitOffsetPreparation, currentUserName, moveToStage],
  );

  const createOffsetTooling = useCallback((orderNo: string, values: OffsetToolingValues) => {
    const status = values.status;
    if (!isOffsetPreparationStatus(status) || validateOffsetToolingValues(values, "draft")) return;
    setOrders((currentOrders) => currentOrders.map((order) => {
      if (!matchesOrder(order, orderNo) || !canAddLegacyOffsetTooling(order)) return order;
      const record = {
        ...values,
        status,
        id: `offset-tooling-${Date.now()}-${(order.offsetToolingRecords ?? []).length + 1}`,
        recordedAt: new Date().toISOString(),
        updatedBy: currentUserName,
      };
      return appendHistory({
        ...order,
        offsetToolingRecords: [...(order.offsetToolingRecords ?? []), record],
        offsetToolingId: record.id,
      }, {
        process: "offset_tooling",
        stage: "offset-plate",
        status: "created",
        user: currentUserName,
        changeSummary: `Offset Tooling / Plate ${values.mcNo.trim() || "record"} created.`,
        remark: values.remark.trim(),
      });
    }));
  }, [currentUserName, setOrders]);

  const updateOffsetTooling = useCallback((orderNo: string, toolingId: string, values: OffsetToolingValues) => {
    const status = values.status;
    if (!isOffsetPreparationStatus(status) || validateOffsetToolingValues(values, "draft")) return;
    setOrders((currentOrders) => {
      const source = currentOrders.find((order) => matchesOrder(order, orderNo));
      const existing = source?.offsetToolingRecords?.find((record) => record.id === toolingId);
      if (!source || !existing || !isLegacyOffsetPreparation(source) || !canEditOffsetPreparation(source, "tooling") ||
          toolingId !== source.offsetToolingId) return currentOrders;
      const record = { ...existing, ...values, status, id: toolingId, recordedAt: existing.recordedAt, updatedBy: currentUserName };
      const received = !existing.receivedDate && values.receivedDate;
      const changeSummary = received
        ? `Offset Tooling / Plate ${values.mcNo.trim() || "record"} received on ${values.receivedDate}.`
        : `Offset Tooling / Plate ${values.mcNo.trim() || "record"} updated.`;
      return currentOrders.map((order) => {
        if (order.id !== source.id) return order;
        return appendHistory({ ...order, offsetToolingRecords: order.offsetToolingRecords?.map((item) => item.id === toolingId ? record : item) }, {
          process: "offset_tooling",
          stage: "offset-plate",
          status: values.status,
          user: currentUserName,
          changeSummary,
          remark: values.remark.trim(),
        });
      });
    });
  }, [currentUserName, setOrders]);

  const createManualOffsetTooling = useCallback((values: ManualOffsetToolingValues) => {
    const status = values.status;
    if (!isOffsetPreparationStatus(status)) return;
    commitManualTooling((current) => [
      ...current,
      {
        ...values,
        status,
        id: `offset-manual-tooling-${Date.now()}-${current.length + 1}`,
        recordedAt: new Date().toISOString(),
        updatedBy: currentUserName,
      },
    ]);
  }, [currentUserName, commitManualTooling]);

  const updateManualOffsetTooling = useCallback((toolingId: string, values: ManualOffsetToolingValues) => {
    const status = values.status;
    if (!isOffsetPreparationStatus(status)) return;
    const existing = latestManualTooling.current.find((record) => record.id === toolingId);
    if (!existing) return;
    const received = !existing.receivedDate && values.receivedDate;
    const changeSummary = received
      ? `Offset Tooling / Plate ${values.mcNo.trim() || "record"} received on ${values.receivedDate}.`
      : `Offset Tooling / Plate ${values.mcNo.trim() || "record"} updated.`;
    const saved = commitManualTooling((current) => current.map((record) => record.id === toolingId
      ? { ...record, ...values, status, id: toolingId, recordedAt: record.recordedAt, updatedBy: currentUserName }
      : record));
    if (!saved) return;
    setOrders((current) => current.map((order) => order.offsetToolingId === toolingId
      ? appendHistory(order, {
        process: "offset_tooling",
        stage: "offset-plate",
        status: received ? "received" : "updated",
        user: currentUserName,
        changeSummary,
        remark: values.remark.trim(),
      })
      : order));
  }, [currentUserName, commitManualTooling, setOrders]);

  const saveOffsetSpk = useCallback(
    (orderNo: string, values: OffsetSpkValues, continueWorkflow: boolean) => {
      if (values.status !== "design_offset" ||
          ![values.fgQuantity, values.paperType, values.grammage, values.planoSize, values.up, values.planoSheets,
            values.colors, values.machine, values.finishing, values.deadline].every((value) => typeof value === "string" && value.trim())) return;
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            order.workflow.preparationType !== "offset" ||
            order.stage !== "offset-design" ||
            order.workflow.currentStatus === "cancelled" || order.workflow.currentStatus === "completed"
          ) {
            return order;
          }

          const updated = appendHistory(
            {
              ...order,
              offsetSpks: [
                ...order.offsetSpks,
                {
                  ...values,
                  id: nextSpkNumber(order),
                  createdAt: new Date().toISOString(),
                },
              ],
            },
            {
              process: "offset_spk",
              status: values.status,
              user: currentUserName,
              changeSummary: `Offset SPK created for ${values.productName}.`,
              remark: values.remark.trim(),
            },
          );
          return continueWorkflow ? moveToStage(updated, "offset-prepress") : updated;
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const completeSampleDecision = useCallback((orderNo: string, decision: "approve" | "revision" | "cancel", pic: string, notes: string) => {
    setOrders((current) => current.map((order) => {
      if (!matchesOrder(order, orderNo) || order.stage !== "sample-completed" || order.workflow.currentStatus === "cancelled") return order;
      const updated = appendHistory({ ...order, pic }, {
        process: "sample_decision", pic, status: decision, user: currentUserName,
        changeSummary: "Sample decision: " + decision, remark: notes.trim(),
      });
      if (decision === "cancel") {
        return { ...updated, stage: "completed", process: "Cancelled Project", status: "Cancelled", tone: "danger",
          workflow: { ...updated.workflow, currentStage: "completed", currentProcess: "project_cancelled", currentStatus: "cancelled" } };
      }
      return decision === "approve" ? moveToStage(updated, "completed")
        : moveToStage({ ...updated, status: "Revision", tone: "warning", workflow: { ...updated.workflow, designDecision: null } }, "design-progress", { preserveStatus: true });
    }));
  }, [currentUserName, moveToStage, setOrders]);

  const submitSample = useCallback((orderNo: string, submittedDate: string) => {
    const parsed = new Date(submittedDate + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(submittedDate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== submittedDate) return;
    setOrders((current) => current.map((order) => {
      if (!matchesOrder(order, orderNo) || order.stage !== "submit-sample" || order.workflow.currentStatus === "cancelled") return order;
      return moveToStage(appendHistory({
        ...order,
        sampleSubmissions: [...(order.sampleSubmissions ?? []), { submittedDate, recordedAt: new Date().toISOString() }],
      }, {
        process: "sample_submitted", status: "submitted", user: currentUserName,
        changeSummary: "Sample submitted on " + displayDate(submittedDate) + ".",
        remark: "Submission date: " + submittedDate,
      }), "sample-completed");
    }));
  }, [currentUserName, moveToStage, setOrders]);

  const advanceOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues> = {}, sample?: SampleProgressValues) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (!matchesOrder(order, orderNo) || order.workflow.currentStatus === "cancelled" ||
              (order.workflow.preparationType === "offset" &&
                (order.workflow.currentStatus === "completed" || !["quality-control", "fa-report", "order-production"].includes(order.stage)))) {
            return order;
          }

          let updatedOrder = hasOrderValues(values)
            ? appendHistory(applyOrderValues(order, values), {
              process: "handoff_details_updated",
              stage: order.stage,
              pic: values.pic ?? order.pic,
              deadline: values.deadline || order.deadline,
              status: "updated",
              user: currentUserName,
              changeSummary: "Task handoff details updated.",
              remark: values.description?.trim() ?? "",
            })
            : applyOrderValues(order, values);
          const nextStage = nextStageForOrder(order);

          if (sample && order.stage === "sample-progress") {
            updatedOrder = appendHistory({
              ...updatedOrder,
              sampleProgress: [...(order.sampleProgress ?? []), {
                ...sample, sequence: (order.sampleProgress?.length ?? 0) + 1,
                recordedAt: new Date().toISOString(),
              }],
            }, {
              process: "sample_progress", status: "completed", user: currentUserName,
              changeSummary: `Sample ${sample.sampleNumber} completed and sent to QC.`,
              remark: sample.notes.trim(),
            });
          }

          return nextStage ? moveToStage(updatedOrder, nextStage) : updatedOrder;
        }),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const moveOrderToStage = useCallback(
    (
      orderNo: string,
      stage: WorkflowStage,
      values: Partial<OrderFormValues> = {},
    ) => {
      if (isOffsetWorkflowStage(stage)) return;
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          matchesOrder(order, orderNo) && order.workflow.currentStatus !== "cancelled" &&
            order.workflow.preparationType !== "offset"
            ? moveToStage(
              hasOrderValues(values)
                ? appendHistory(applyOrderValues(order, values), {
                  process: "project_details_updated",
                  status: "updated",
                  user: currentUserName,
                  changeSummary: "Project details updated with stage decision.",
                  remark: values.description?.trim() ?? "",
                })
                : applyOrderValues(order, values),
              stage,
            )
            : order,
        ),
      );
    },
    [currentUserName, moveToStage, setOrders],
  );

  const value = useMemo(
    () => ({
      currentUserRole,
      updateDrawingStatus,
      orders,
      manualOffsetToolingRecords,
      nextProjectCode: nextOrderCode(orders),
      addProject,
      editProject,
      createStandaloneRequirementOrder,
      completeIncomingPreparation,
      updateIncomingRequirementDetails,
      submitDrawing,
      completeDesignDecision,
      cancelIncomingProject,
      cancelProject: cancelIncomingProject,
      updateOrder,
      saveToolingRequirement,
      saveRubberRequirement,
      saveMaterialRequest,
      saveOffsetPrepress,
      saveOffsetMaterial,
      saveOffsetVarnish,
      completeOffsetPrinting,
      saveOffsetPreparationPlan,
      submitOffsetMaterialPreparation,
      saveOffsetTooling,
      createOffsetTooling,
      updateOffsetTooling,
      createManualOffsetTooling,
      updateManualOffsetTooling,
      saveOffsetSpk,
      completeSampleDecision,
      submitSample,
      advanceOrder,
      moveOrderToStage,
    }),
    [
      currentUserRole,
      updateDrawingStatus,
      addProject,
      editProject,
      completeSampleDecision,
      submitSample,
      advanceOrder,
      cancelIncomingProject,
      completeDesignDecision,
      completeIncomingPreparation,
      createStandaloneRequirementOrder,
      moveOrderToStage,
      orders,
      manualOffsetToolingRecords,
      saveMaterialRequest,
      saveOffsetPrepress,
      saveOffsetMaterial,
      saveOffsetVarnish,
      completeOffsetPrinting,
      saveOffsetPreparationPlan,
      submitOffsetMaterialPreparation,
      saveOffsetTooling,
      createOffsetTooling,
      updateOffsetTooling,
      createManualOffsetTooling,
      updateManualOffsetTooling,
      saveOffsetSpk,
      saveRubberRequirement,
      saveToolingRequirement,
      submitDrawing,
      updateIncomingRequirementDetails,
      updateOrder,
    ],
  );

  return (
    <WorkflowOrdersContext.Provider value={value}>
      {children}
    </WorkflowOrdersContext.Provider>
  );
}

export function useWorkflowOrders() {
  const context = useContext(WorkflowOrdersContext);

  if (!context) {
    throw new Error("useWorkflowOrders must be used inside WorkflowOrdersProvider.");
  }

  return context;
}

/** Read-only Details can use this when rendered without the application provider. */
export function useOptionalWorkflowOrders() {
  return useContext(WorkflowOrdersContext);
}
