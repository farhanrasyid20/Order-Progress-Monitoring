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
import { matchesOrder, splitRequirementBranches } from "@/lib/requirement-branches";
import { orders as initialOrders } from "@/data/orders";
import { canUpdateDrawingStatus } from "@/lib/permissions";
import { drawingStatusOptions, getDrawingStatus } from "@/lib/drawing-status";
import { isInRequirementQueue, shouldAdvanceRequirementStage, isCombinedRequirement, materialRequestQueueEntries } from "@/lib/requirement-queue";
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
  ProjectCurrentStage,
  ProjectFormValues,
  ProjectLineage,
  ProjectMainData,
  ProjectWorkflow,
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

// Placeholder until authentication supplies the active user to the provider.
const prototypeActor = "Farhan Rasyid";

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
    process: "Design Process",
    status: "In Progress",
    tone: "info",
    progress: 28,
  },
  "review-approval": {
    process: "Incoming Design",
    status: "Waiting for Design Decision",
    tone: "warning",
    progress: 42,
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
    process: "Material Request / Create MI",
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
    process: "Sample Progress",
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
  "tooling-progress": "material-request",
  "rubber-order-setting": "material-request",
  "material-request": "sample-progress",
  "offset-design": "offset-prepress",
  "offset-prepress": "offset-material-request",
  "offset-material-request": "offset-plate",
  "offset-plate": "offset-varnish",
  "offset-varnish": "offset-press",
  "offset-press": "quality-control",
  "sample-progress": "quality-control",
  "quality-control": "fa-report",
  "fa-report": "submit-sample",

  "order-production": "completed",
};

export type WorkflowOrdersContextValue = {
  currentUserRole: ProjectRole;
  updateDrawingStatus: (projectId: string, status: DrawingStatus) => void;
  orders: Order[];
  nextProjectCode: string;
  addProject: (values: ProjectFormValues) => void;
  editProject: (orderNo: string, values: ProjectFormValues) => void;
  createStandaloneRequirementOrder: (
    kind: StandaloneRequirementKind,
    values: StandaloneRequirementOrderValues,
    continueWorkflow: boolean,
  ) => void;
  completeIncomingPreparation: (
    orderNo: string,
    values: PreparationWorkflowUpdate,
  ) => void;
  submitDrawing: (orderNo: string, values: DrawingSubmission) => void;
  completeDesignDecision: (orderNo: string, decision: DesignDecision) => void;
  cancelIncomingProject: (orderNo: string, reason: string) => void;
  cancelProject: (orderNo: string, reason: string) => void;
  updateOrder: (orderNo: string, values: Partial<OrderFormValues>) => void;
  saveToolingRequirement: (
    orderNo: string,
    values: RequirementUpdateValues,
    continueWorkflow: boolean,
  ) => void;
  saveRubberRequirement: (
    orderNo: string,
    values: RequirementUpdateValues,
    continueWorkflow: boolean,
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

function nextOrderNumber(currentOrders: Order[]) {
  const highestSequence = currentOrders.reduce((highest, order) => {
    const sequence = Number(/^PSR#(\d+)/i.exec(order.no.trim())?.[1]);
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);

  return `PSR#${highestSequence + 1}`;
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

function applyOrderValues(order: Order, values: Partial<OrderFormValues>): Order {
  return {
    ...order,
    ...values,
    mainData: mergeMainData(order, values),
    updatedAt: new Date().toISOString(),
  };
}

function hasOrderValues(values: Partial<OrderFormValues>) {
  return Object.values(values).some((value) => value !== undefined && value !== "");
}

function appendHistory(
  order: Order,
  entry: Pick<Order["processHistory"][number], "process" | "status" | "user" | "changeSummary" | "remark" | "stage" | "pic" | "deadline" | "source">,
): Order {
  const updatedAt = new Date().toISOString();

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

function firstStageAfterDesignApproval(order: Order): WorkflowStage {
  if (order.workflow.preparationType === "offset") return "offset-design";

  if (order.workflow.convertingRoute === "by_design") {
    return "material-request";
  }

  return order.workflow.productionOrder === "rubber"
    ? "rubber-order-setting"
    : "tooling-progress";
}

function nextStageForOrder(order: Order): WorkflowStage | undefined {
  if (order.stage === "review-approval") {
    return firstStageAfterDesignApproval(order);
  }

  if (
    order.stage === "tooling-progress" &&
    order.workflow.productionOrder === "tooling_and_rubber"
  ) {
    return "rubber-order-setting";
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

  const productionLabel =
    values.productionOrder === "tooling"
      ? "Preparation: Order Tooling"
      : values.productionOrder === "rubber"
        ? "Preparation: Order Rubber"
        : values.productionOrder === "tooling_and_rubber"
          ? "Preparation: Order Tooling & Rubber"
          : null;

  return [
    routeLabel,
    values.materialRequested ? "Preparation: Request Material" : null,
    productionLabel,
  ]
    .filter(Boolean)
    .join(" -> ");
}

function finalPreparationStatus(values: PreparationWorkflowUpdate) {
  if (values.route === "by_production") {
    if (values.productionOrder === "tooling") return "Preparation: Order Tooling";
    if (values.productionOrder === "rubber") return "Preparation: Order Rubber";
    if (values.productionOrder === "tooling_and_rubber") {
      return "Preparation: Order Tooling & Rubber";
    }
  }

  return "Preparation: Request Material";
}

function isCompleteIncomingPreparation(values: PreparationWorkflowUpdate) {
  return Boolean(
    values.materialRequested &&
    values.remark.trim() &&
    (values.route !== "by_production" || values.productionOrder),
  );
}

function applyIncomingPreparation(
  order: Order,
  values: PreparationWorkflowUpdate,
): Order {
  const updatedAt = new Date().toISOString();
  const productionOrder =
    values.route === "by_production" && values.materialRequested
      ? values.productionOrder
      : null;
  const materialRequested = Boolean(values.materialRequested);
  const normalizedValues = {
    ...values,
    productionOrder,
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
      productionOrder,
      materialRequested,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: "incoming_preparation",
        status: "updated",
        date: updatedAt,
        user: prototypeActor,
        changeSummary: incomingPreparationLabel(normalizedValues),
        remark: values.remark.trim(),
      },
    ],
    updatedAt,
  };
}

function normalizeDrawingLink(value: string) {
  const drawingLink = value.trim();

  try {
    const url = new URL(drawingLink);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function applyDrawingSubmission(
  order: Order,
  values: DrawingSubmission,
  drawingLink: string,
): Order {
  const updatedAt = new Date().toISOString();

  return {
    ...applyOrderValues(order, { pic: values.pic, deadline: values.deadline }),
    workflow: {
      ...order.workflow,
      drawingLink,
      designDecision: null,
    },
    processHistory: [
      ...order.processHistory,
      {
        process: "drawing_submitted",
        status: "waiting",
        date: updatedAt,
        user: prototypeActor,
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

function applyDesignDecision(order: Order, decision: DesignDecision): Order {
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
        user: prototypeActor,
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

function moveToStage(
  order: Order,
  stage: WorkflowStage,
  options: { preserveStatus?: boolean } = {},
): Order {
  const details = workflowStageDetails[stage];
  const updatedAt = new Date().toISOString();
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
        process: stageProcess,
        status,
        date: updatedAt,
        user: "System",
        changeSummary: `Moved to ${details.process}.`,
        remark: "",
      },
    ],
    updatedAt,
  };
}

/**
 * Browser-persisted prototype state. New records use the nested Project model, while the flat
 * display fields keep the existing dashboard and queue UI working unchanged.
 */
export function WorkflowOrdersProvider({ children, currentUserRole = "design" }: { children: ReactNode; currentUserRole?: ProjectRole }) {
  const [orders, setOrders] = useState<Order[]>(() => initialOrders.flatMap(order => splitRequirementBranches(order, moveToStage)));
  const [storageReady, setStorageReady] = useState(false);
  const designFileUrls = useRef<string[]>([]);

  useEffect(() => {
    // Restore browser data after hydration so the server and initial client render agree.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = window.localStorage.getItem("cots-workflow-orders-v1");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((order) =>
          order && typeof order.id === "string" && typeof order.projectDate === "string" &&
          order.workflow && order.mainData && order.lineage && Array.isArray(order.processHistory),
        )) {
          setOrders((parsed as Order[]).flatMap(order => splitRequirementBranches(order, moveToStage)));
        }
      }
    } catch {
      // Keep the initial data if storage is unavailable or invalid.
    }
    setStorageReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem("cots-workflow-orders-v1", JSON.stringify(orders));
    } catch {
      // In-memory updates still work when browser storage is unavailable or full.
    }
  }, [orders, storageReady]);

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
        user: prototypeActor,
        changeSummary: `Drawing status changed to ${drawingStatusOptions.find((option) => option.value === status)?.label}.`,
        remark: "Updated by superadmin.",
      });
    }));
  }, [currentUserRole]);

  const addProject = useCallback((values: ProjectFormValues) => {
    const drawingLink = values.designFile
      ? URL.createObjectURL(values.designFile)
      : normalizeDrawingLink(values.drawingLink);
    if (values.designFile && drawingLink) {
      designFileUrls.current.push(drawingLink);
    }
    setOrders((currentOrders) => {
      const createdAt = new Date().toISOString();
      const code = nextOrderNumber(currentOrders);
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
        ...values.mainData,
        mcNo: values.mainData.mcNo.trim() || code,
      };
      const stage = "order" as const;
      const details = workflowStageDetails[stage];
      const isVersionUp = lineage.entryType === "version_up";
      const process = isVersionUp
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
            productionOrder: null,
            materialRequested: false,
            currentStage: "order",
            currentProcess: isVersionUp
              ? `version_up_${lineage.versionNumber}`
              : "new_project",
            currentStatus: "new",
            drawingLink,
            drawingFileName: values.designFile?.name,
            designDecision: null,
            progress: 0,
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
              user: prototypeActor,
              changeSummary: isVersionUp
                ? `Version Up ${lineage.versionNumber} created from ${lineage.sourceProjectNo}.`
                : drawingLink
                  ? values.designFile
                    ? `New project created with design file: ${values.designFile.name}.`
                    : "New project created with a design link."
                  : "New project created.",
              remark: mainData.remark.trim(),
            },
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
  }, []);

  const createStandaloneRequirementOrder = useCallback(
    (
      kind: StandaloneRequirementKind,
      values: StandaloneRequirementOrderValues,
      continueWorkflow: boolean,
    ) => {
      setOrders((currentOrders) => {
        const createdAt = new Date().toISOString();
        const code = nextOrderNumber(currentOrders);
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
              user: prototypeActor,
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
    [],
  );

  const completeIncomingPreparation = useCallback(
    (orderNo: string, values: PreparationWorkflowUpdate) => {
      setOrders((currentOrders) =>
        currentOrders.flatMap((order): Order[] => {
          if (!matchesOrder(order, orderNo)) return [order];
          if (
            order.stage !== "order" ||
            order.workflow.currentStatus === "cancelled" ||
            !isCompleteIncomingPreparation(values)
          ) {
            return [order];
          }

          const isCombined = values.route === "by_production" && values.productionOrder === "tooling_and_rubber";
          const isToolingOrder = values.route === "by_production" && (values.productionOrder === "tooling" || isCombined);
          const isRubberOrder = values.route === "by_production" && (values.productionOrder === "rubber" || isCombined);
          let prepared = applyIncomingPreparation(order, values);
          if (isToolingOrder && values.toolingRequirement) {
            prepared = appendHistory({
              ...prepared,
              toolingOrders: [...prepared.toolingOrders, {
                ...values.toolingRequirement,
                sequence: prepared.toolingOrders.length + 1,
              }],
            }, {
              process: "tooling_requirement",
              status: values.toolingRequirement.status,
              user: prototypeActor,
              changeSummary: "Tooling requirement added from Incoming Design.",
              remark: values.toolingRequirement.remark,
            });
          }
          if (isRubberOrder && values.rubberRequirement) {
            prepared = appendHistory({
              ...prepared,
              rubberOrders: [...prepared.rubberOrders, { ...values.rubberRequirement, sequence: prepared.rubberOrders.length + 1 }],
            }, {
              process: "rubber_requirement",
              status: values.rubberRequirement.status,
              user: prototypeActor,
              changeSummary: "Rubber requirement added from Incoming Design.",
              remark: values.rubberRequirement.remark,
            });
          }

          const targetStage =
            values.route === "offset"
              ? "offset-prepress"
              : isToolingOrder
                ? "tooling-progress"
                : isRubberOrder
                  ? "rubber-order-setting"
                  : "material-request";

          const moved = moveToStage(prepared, targetStage, {
            preserveStatus:
              values.route !== "offset" &&
              !isToolingOrder &&
              !isRubberOrder,
          });

          const result = isToolingOrder
            ? withToolingDetailsStatus(moved)
            : isRubberOrder ? withRequirementDetailsStatus(moved, "rubber") : moved;
          return splitRequirementBranches(result, moveToStage);

        }),
      );
    },
    [],
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
            applyDrawingSubmission(order, values, drawingLink),
            "review-approval",
          );
        }),
      );
    },
    [],
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
            applyDesignDecision(order, decision),
            decision === "approve"
              ? firstStageAfterDesignApproval(order)
              : "design-progress",
            { preserveStatus: decision === "revision" },
          );
        }),
      );
    },
    [],
  );

  const cancelIncomingProject = useCallback((orderNo: string, reason: string) => {
    const cancellationReason = reason.trim();

    if (!cancellationReason) return;

    setOrders((currentOrders) =>
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
              user: prototypeActor,
              changeSummary: "Project cancelled.",
              remark: cancellationReason,
            },
          ],
          updatedAt,
        };
      }),
    );
  }, []);

  const editProject = useCallback((orderNo: string, values: ProjectFormValues) => {
    const fileUrl = values.designFile ? URL.createObjectURL(values.designFile) : null;
    if (fileUrl) designFileUrls.current.push(fileUrl);
    setOrders((currentOrders) => currentOrders.map((order) => {
      if (!matchesOrder(order, orderNo) || order.workflow.currentStatus === "cancelled") return order;
      return appendHistory({
        ...order,
        mainData: { ...values.mainData },
        customer: values.mainData.custName || "-",
        product: values.mainData.component || "-",
        description: values.mainData.remark || "-",
        material: [values.mainData.boardQua, values.mainData.corFlut].filter(Boolean).join(" / ") || "-",
        pic: values.pic || "-",
        projectDate: displayDate(values.projectDate),
        deadline: displayDate(values.deadline),
        workflow: {
          ...order.workflow,
          preparationType: values.preparationType,
          convertingRoute: values.preparationType === "converting" ? values.convertingRoute || null : null,
          productionOrder: values.preparationType === "converting" && values.convertingRoute === "by_production" ? order.workflow.productionOrder : null,
          drawingLink: fileUrl ?? order.workflow.drawingLink,
          drawingFileName: values.designFile?.name ?? order.workflow.drawingFileName,
        },
      }, {
        process: "project_updated",
        status: "updated",
        user: prototypeActor,
        changeSummary: "Project data edited from Incoming Design details.",
        remark: values.mainData.remark.trim(),
      });
    }));
  }, []);

  const updateOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues>) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          matchesOrder(order, orderNo) && order.workflow.currentStatus !== "cancelled"
            ? appendHistory(applyOrderValues(order, values), {
              process: "project_updated",
              status: "updated",
              user: prototypeActor,
              changeSummary: "Project information updated.",
              remark: values.description?.trim() ?? "",
            })
            : order,
        ),
      );
    },
    [],
  );

  const saveToolingRequirement = useCallback(
    (
      orderNo: string,
      values: RequirementUpdateValues,
      continueWorkflow: boolean,
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            !isInRequirementQueue(order, "tooling") ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const record = {
            ...values,
            sequence: order.toolingOrders.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              toolingOrders: [...order.toolingOrders, record],
            },
            {
              process: "tooling_requirement",
              status: values.status,
              user: prototypeActor,
              changeSummary: `Tooling ${values.requirementType} updated to ${values.status}.`,
              remark: values.remark.trim(),
            },
          );
          if (continueWorkflow) {
            const forwarded = {
              ...updated,
              workflow: { ...updated.workflow, toolingReady: isReadyToContinueRequirement(values.status), toolingForwarded: true },
            };
            return shouldAdvanceRequirementStage(updated)
              ? moveToStage(forwarded, "material-request")
              : forwarded;
          }
          return shouldAdvanceRequirementStage(updated) ? withToolingDetailsStatus(updated) : updated;
        }),
      );
    },
    [],
  );

  const saveRubberRequirement = useCallback(
    (
      orderNo: string,
      values: RequirementUpdateValues,
      continueWorkflow: boolean,
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            !isInRequirementQueue(order, "rubber") ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const record = {
            ...values,
            sequence: order.rubberOrders.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              rubberOrders: [...order.rubberOrders, record],
            },
            {
              process: "rubber_requirement",
              status: values.status,
              user: prototypeActor,
              changeSummary: `Rubber ${values.requirementType} updated to ${values.status}.`,
              remark: values.remark.trim(),
            },
          );
          if (continueWorkflow) {
            const forwarded = {
              ...updated,
              workflow: { ...updated.workflow, rubberReady: isReadyToContinueRequirement(values.status), rubberForwarded: true },
            };
            return shouldAdvanceRequirementStage(updated)
              ? moveToStage(forwarded, "material-request")
              : forwarded;
          }
          return shouldAdvanceRequirementStage(updated) ? withRequirementDetailsStatus(updated, "rubber") : updated;
        }),
      );
    },
    [],
  );

  const saveMaterialRequest = useCallback(
    (orderNo: string, values: MaterialRequestValues, continueWorkflow: boolean) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          const isMaterialQueue =
            isCombinedRequirement(order)
              ? Boolean(values.source && materialRequestQueueEntries(order).some((entry) => entry.materialRequestSource === values.source))
              : order.stage === "material-request" || order.stage === "offset-material-request";
          if (
            !matchesOrder(order, orderNo) ||
            !isMaterialQueue ||
            Boolean(order.requirementBranch && values.source !== order.requirementBranch) ||
            order.workflow.currentStatus === "cancelled"
          ) {
            return order;
          }

          const record = {
            ...values,
            sequence: order.materialRequests.length + 1,
          };
          const updated = appendHistory(
            {
              ...order,
              materialRequests: [...order.materialRequests, record],
              workflow: {
                ...order.workflow,
                materialRequested: true,
                materialForwarded: continueWorkflow && values.source
                  ? { ...order.workflow.materialForwarded, [values.source]: true }
                  : order.workflow.materialForwarded,
              },
            },
            {
              source: values.source,
              process: "material_request",
              status: values.status,
              user: prototypeActor,
              changeSummary: `Material request ${values.miNumber} updated to ${values.status}.`,
              remark: values.remark.trim(),
            },
          );

          const canMoveToNextStage =
            order.stage === "material-request" ||
            order.stage === "offset-material-request" ||
            values.status === "released" ||
            values.status === "received";

          const nextStage =
            continueWorkflow && canMoveToNextStage &&
              (order.stage === "material-request" || order.stage === "offset-material-request")
              ? nextStageForOrder(updated)
              : undefined;

          return nextStage ? moveToStage(updated, nextStage) : updated;

        }),
      );
    },
    [],
  );

  const saveOffsetSpk = useCallback(
    (orderNo: string, values: OffsetSpkValues, continueWorkflow: boolean) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (
            !matchesOrder(order, orderNo) ||
            order.workflow.preparationType !== "offset" ||
            order.workflow.currentStatus === "cancelled"
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
              user: prototypeActor,
              changeSummary: `Offset SPK created for ${values.productName}.`,
              remark: values.remark.trim(),
            },
          );
          const nextStage = continueWorkflow ? nextStageForOrder(updated) : undefined;

          return nextStage ? moveToStage(updated, nextStage) : updated;
        }),
      );
    },
    [],
  );

  const completeSampleDecision = useCallback((orderNo: string, decision: "approve" | "revision" | "cancel", pic: string, notes: string) => {
    setOrders((current) => current.map((order) => {
      if (!matchesOrder(order, orderNo) || order.stage !== "sample-completed" || order.workflow.currentStatus === "cancelled") return order;
      const updated = appendHistory({ ...order, pic }, {
        process: "sample_decision", pic, status: decision, user: prototypeActor,
        changeSummary: "Sample decision: " + decision, remark: notes.trim(),
      });
      if (decision === "cancel") {
        return { ...updated, stage: "completed", process: "Cancelled Project", status: "Cancelled", tone: "danger",
          workflow: { ...updated.workflow, currentStage: "completed", currentProcess: "project_cancelled", currentStatus: "cancelled" } };
      }
      return decision === "approve" ? moveToStage(updated, "completed")
        : moveToStage({ ...updated, status: "Revision", tone: "warning", workflow: { ...updated.workflow, designDecision: null } }, "design-progress", { preserveStatus: true });
    }));
  }, []);

  const submitSample = useCallback((orderNo: string, submittedDate: string) => {
    const parsed = new Date(submittedDate + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(submittedDate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== submittedDate) return;
    setOrders((current) => current.map((order) => {
      if (!matchesOrder(order, orderNo) || order.stage !== "submit-sample" || order.workflow.currentStatus === "cancelled") return order;
      return moveToStage(appendHistory({
        ...order,
        sampleSubmissions: [...(order.sampleSubmissions ?? []), { submittedDate, recordedAt: new Date().toISOString() }],
      }, {
        process: "sample_submitted", status: "submitted", user: prototypeActor,
        changeSummary: "Sample submitted on " + displayDate(submittedDate) + ".",
        remark: "Submission date: " + submittedDate,
      }), "sample-completed");
    }));
  }, []);

  const advanceOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues> = {}, sample?: SampleProgressValues) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (!matchesOrder(order, orderNo) || order.workflow.currentStatus === "cancelled") {
            return order;
          }

          let updatedOrder = hasOrderValues(values)
            ? appendHistory(applyOrderValues(order, values), {
              process: "handoff_details_updated",
              stage: order.stage,
              pic: values.pic ?? order.pic,
              deadline: values.deadline || order.deadline,
              status: "updated",
              user: prototypeActor,
              changeSummary: order.stage === "offset-prepress" ? "Move to Material Request / MI." : "Task handoff details updated.",
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
              process: "sample_progress", status: "completed", user: prototypeActor,
              changeSummary: `Sample ${sample.sampleNumber} completed and sent to QC.`,
              remark: sample.notes.trim(),
            });
          }

          return nextStage ? moveToStage(updatedOrder, nextStage) : updatedOrder;
        }),
      );
    },
    [],
  );

  const moveOrderToStage = useCallback(
    (
      orderNo: string,
      stage: WorkflowStage,
      values: Partial<OrderFormValues> = {},
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          matchesOrder(order, orderNo) && order.workflow.currentStatus !== "cancelled"
            ? moveToStage(
              hasOrderValues(values)
                ? appendHistory(applyOrderValues(order, values), {
                  process: "project_details_updated",
                  status: "updated",
                  user: prototypeActor,
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
    [],
  );

  const value = useMemo(
    () => ({
      currentUserRole,
      updateDrawingStatus,
      orders,
      nextProjectCode: nextOrderNumber(orders),
      addProject,
      editProject,
      createStandaloneRequirementOrder,
      completeIncomingPreparation,
      submitDrawing,
      completeDesignDecision,
      cancelIncomingProject,
      cancelProject: cancelIncomingProject,
      updateOrder,
      saveToolingRequirement,
      saveRubberRequirement,
      saveMaterialRequest,
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
      saveMaterialRequest,
      saveOffsetSpk,
      saveRubberRequirement,
      saveToolingRequirement,
      submitDrawing,
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
