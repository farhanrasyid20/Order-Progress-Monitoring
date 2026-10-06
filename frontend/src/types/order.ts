/** Status presentation remains separate from the workflow state. */
export type OrderStatusTone = "info" | "success" | "warning" | "danger" | "neutral";
export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectRole = "admin" | "manager" | "design";
export type ProjectEntryType = "new" | "version_up";

/**
 * Keeps a version-up project linked to its original project without reusing
 * the generated project ID. New projects always begin at version zero.
 */
export type NewProjectLineage = {
  entryType: "new";
  rootProjectNo: string;
  sourceProjectNo: null;
  versionNumber: 0;
};

export type VersionUpProjectLineage = {
  entryType: "version_up";
  rootProjectNo: string;
  sourceProjectNo: string;
  versionNumber: number;
};

export type ProjectLineage = NewProjectLineage | VersionUpProjectLineage;

export type ProjectMainDataKey =
  | "mcNo"
  | "component"
  | "custName"
  | "partNo"
  | "partNo2"
  | "set"
  | "sub"
  | "singDoub"
  | "width"
  | "length"
  | "dieCutSht"
  | "boardQua"
  | "corFlut"
  | "creaseL"
  | "creaseW"
  | "slotting"
  | "remark"
  | "iSizeL"
  | "iSizeW"
  | "iSizeH"
  | "printing"
  | "colours"
  | "dispFlag"
  | "unit"
  | "manfJoin1"
  | "manfJoin2"
  | "weight"
  | "assembly"
  | "colour2"
  | "colour3"
  | "colour4"
  | "colour5"
  | "finishing"
  | "fgWeight";

export type ProjectMainData = Record<ProjectMainDataKey, string>;
export type PreparationType = "converting" | "offset";
export type ConvertingRoute = "by_design" | "by_production";
export type PreparationRoute = ConvertingRoute | "offset";
export type PreparationOrderSelection =
  | "tooling"
  | "rubber"
  | "tooling_and_rubber";
export type DesignDecision = "approve" | "revision";
export type PreparationWorkflowUpdate = {
  route: PreparationRoute;
  productionOrder: PreparationOrderSelection | null;
  materialRequested: boolean;
  remark: string;
};
export type DrawingSubmission = {
  pic: string;
  deadline: string;
  drawingLink: string;
  notes: string;
};
export type ProjectCurrentStage =
  | "order"
  | "drawing"
  | "preparation"
  | "sample"
  | "closing"
  | "completed";
export type ProjectCurrentStatus =
  | "new"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ProjectWorkflow = {
  preparationType: PreparationType;
  convertingRoute: ConvertingRoute | null;
  productionOrder: PreparationOrderSelection | null;
  materialRequested: boolean;
  currentStage: ProjectCurrentStage;
  currentProcess: string;
  currentStatus: ProjectCurrentStatus;
  drawingLink: string | null;
  designDecision: DesignDecision | null;
  progress: number;
};

export type ToolingOrderRecord = {
  sequence: number;
  orderDate: string | null;
  arrivalDate: string | null;
  status: "ordered" | "arrived" | "rejected";
};

export type RubberOrderRecord = ToolingOrderRecord;

export type ProcessHistoryRecord = {
  process: string;
  status: string;
  date: string;
  user: string;
  changeSummary?: string;
  remark: string;
};

/**
 * A project has a scalable source of truth (`mainData`, `workflow`, and
 * histories). The flat fields below are temporary display adapters for the
 * existing dashboard and queue components while those screens are migrated.
 */
export type WorkflowStage =
  | "order"
  | "design-incoming"
  | "design-progress"
  | "review-approval"
  | "tooling-progress"
  | "rubber-order-setting"
  | "sample-progress"
  | "sample-completed"
  | "order-production"
  | "completed";

export type Order = {
  id: string;
  lineage: ProjectLineage;
  mainData: ProjectMainData;
  workflow: ProjectWorkflow;
  toolingOrders: ToolingOrderRecord[];
  rubberOrders: RubberOrderRecord[];
  processHistory: ProcessHistoryRecord[];
  createdAt: string;
  updatedAt: string;
  no: string;
  customer: string;
  product: string;
  description: string;
  material: string;
  priority: ProjectPriority;
  process: string;
  pic: string;
  projectDate: string;
  deadline: string;
  status: string;
  tone: OrderStatusTone;
  stage: WorkflowStage;
  progress: number;
};

/** Existing stage forms update only their relevant display fields for now. */
export type OrderFormValues = Pick<
  Order,
  | "customer"
  | "product"
  | "description"
  | "material"
  | "priority"
  | "pic"
  | "projectDate"
  | "deadline"
>;

/** Configuration-driven values submitted by the Incoming Design project modal. */
export type ProjectFormDraft = {
  mainData: ProjectMainData;
  entryType: ProjectEntryType | "";
  previousProjectCode: string;
  preparationType: PreparationType | "";
  convertingRoute: ConvertingRoute | "";
  pic: string;
  projectDate: string;
  deadline: string;
  drawingLink: string;
};

type ProjectFormBaseValues = Omit<
  ProjectFormDraft,
  "entryType" | "previousProjectCode" | "preparationType"
> & {
  preparationType: PreparationType;
};

export type ProjectFormValues =
  | (ProjectFormBaseValues & {
      entryType: "new";
      previousProjectCode: "";
    })
  | (ProjectFormBaseValues & {
      entryType: "version_up";
      previousProjectCode: string;
    });

/** Kept as an alias while the existing provider API is migrated incrementally. */
export type NewOrderFormValues = ProjectFormValues;
