"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { orders as initialOrders } from "@/data/orders";
import type {
  DesignDecision,
  DrawingSubmission,
  Order,
  OrderFormValues,
  OrderStatusTone,
  ProjectCurrentStage,
  ProjectFormValues,
  ProjectLineage,
  ProjectMainData,
  ProjectWorkflow,
  PreparationWorkflowUpdate,
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
    process: "Tooling Progress",
    status: "Waiting for Tooling",
    tone: "info",
    progress: 56,
  },
  "rubber-order-setting": {
    process: "Rubber Order & Setting",
    status: "Waiting for Rubber",
    tone: "warning",
    progress: 70,
  },
  "sample-progress": {
    process: "Sample Progress",
    status: "Sample In Progress",
    tone: "info",
    progress: 85,
  },
  "sample-completed": {
    process: "Sample Completed",
    status: "Ready to Finalize",
    tone: "success",
    progress: 100,
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
  "review-approval": "tooling-progress",
  "tooling-progress": "rubber-order-setting",
  "rubber-order-setting": "sample-progress",
  "sample-progress": "sample-completed",
  "sample-completed": "completed",
  "order-production": "completed",
};

export type WorkflowOrdersContextValue = {
  orders: Order[];
  addProject: (values: ProjectFormValues) => void;
  completeIncomingPreparation: (
    orderNo: string,
    values: PreparationWorkflowUpdate,
  ) => void;
  submitDrawing: (orderNo: string, values: DrawingSubmission) => void;
  completeDesignDecision: (orderNo: string, decision: DesignDecision) => void;
  cancelIncomingProject: (orderNo: string, reason: string) => void;
  updateOrder: (orderNo: string, values: Partial<OrderFormValues>) => void;
  advanceOrder: (orderNo: string, values?: Partial<OrderFormValues>) => void;
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

function currentStageForQueue(stage: WorkflowStage): ProjectCurrentStage {
  if (stage === "order" || stage === "design-incoming") return "order";
  if (stage === "design-progress") return "drawing";
  if (
    stage === "review-approval" ||
    stage === "tooling-progress" ||
    stage === "rubber-order-setting"
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

function moveToStage(
  order: Order,
  stage: WorkflowStage,
  options: { preserveStatus?: boolean } = {},
): Order {
  const details = workflowStageDetails[stage];
  const updatedAt = new Date().toISOString();
  const status = options.preserveStatus ? order.status : details.status;
  const tone = options.preserveStatus ? order.tone : details.tone;
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
 * Local state only. New records use the nested Project model, while the flat
 * display fields keep the existing dashboard and queue UI working unchanged.
 */
export function WorkflowOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const addProject = useCallback((values: ProjectFormValues) => {
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
      const drawingLink = normalizeDrawingLink(values.drawingLink);

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
            designDecision: null,
            progress: 0,
          },
          toolingOrders: [],
          rubberOrders: [],
          processHistory: [
            {
              process: isVersionUp ? "version_up" : "new_project",
              status: "new",
              date: createdAt,
              user: prototypeActor,
              changeSummary: isVersionUp
                ? `Version Up ${lineage.versionNumber} created from ${lineage.sourceProjectNo}.`
                : drawingLink
                  ? "New project created with a design link."
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
          projectDate: displayDate(values.projectDate),
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

  const completeIncomingPreparation = useCallback(
    (orderNo: string, values: PreparationWorkflowUpdate) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (order.no !== orderNo) return order;
          if (
            order.stage !== "order" ||
            order.workflow.currentStatus === "cancelled" ||
            !isCompleteIncomingPreparation(values)
          ) {
            return order;
          }

          return moveToStage(
            applyIncomingPreparation(order, values),
            "design-progress",
            { preserveStatus: true },
          );
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
            order.no !== orderNo ||
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
            order.no !== orderNo ||
            order.stage !== "review-approval" ||
            order.workflow.currentStatus === "cancelled" ||
            !order.workflow.drawingLink
          ) {
            return order;
          }

          return moveToStage(
            applyDesignDecision(order, decision),
            decision === "approve" ? "tooling-progress" : "design-progress",
            { preserveStatus: true },
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
          order.no !== orderNo ||
          order.stage !== "order" ||
          order.workflow.currentStatus === "cancelled"
        ) {
          return order;
        }

        const updatedAt = new Date().toISOString();

        return {
          ...order,
          status: "Cancelled",
          tone: "danger",
          workflow: {
            ...order.workflow,
            currentStage: "order",
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

  const updateOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues>) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.no === orderNo && order.workflow.currentStatus !== "cancelled"
            ? applyOrderValues(order, values)
            : order,
        ),
      );
    },
    [],
  );

  const advanceOrder = useCallback(
    (orderNo: string, values: Partial<OrderFormValues> = {}) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => {
          if (order.no !== orderNo || order.workflow.currentStatus === "cancelled") {
            return order;
          }

          const updatedOrder = applyOrderValues(order, values);
          const nextStage = nextWorkflowStage[order.stage];

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
          order.no === orderNo && order.workflow.currentStatus !== "cancelled"
            ? moveToStage(applyOrderValues(order, values), stage)
            : order,
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      orders,
      addProject,
      completeIncomingPreparation,
      submitDrawing,
      completeDesignDecision,
      cancelIncomingProject,
      updateOrder,
      advanceOrder,
      moveOrderToStage,
    }),
    [
      addProject,
      advanceOrder,
      cancelIncomingProject,
      completeDesignDecision,
      completeIncomingPreparation,
      moveOrderToStage,
      orders,
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
