/** Status presentation remains separate from the workflow state. */
export type OrderStatusTone = "info" | "success" | "warning" | "danger" | "neutral";
export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectRole = "superadmin" | "admin" | "manager" | "design" | "qc" | "intern";
export type DrawingStatus = "no_drawing" | "drawing_available" | "reviewed_by_superior";
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

export type BoardMaterialLayerKey =
  | "liner1" | "fluting1" | "liner2" | "middleLiner" | "fluting2" | "liner3"
  | "paperboardType" | "paperboardGsm";

export type OffsetProjectDataKey =
  | "fgQuantity" | "imposition" | "grammage" | "printingSide" | "printingMachine"
  | "varnish" | "lamination" | "coatingSide"
  /** Retained to display projects created by the earlier single-effect form. */
  | "specialEffect"
  | "pantoneCount" | "specialColourCount"
  | "emboss" | "deboss" | "hotprint" | "spotUv";
export type ProjectMainData = Record<ProjectMainDataKey, string> &
  Partial<Record<OffsetProjectDataKey | BoardMaterialLayerKey, string>>;
export type PreparationType = "converting" | "offset";
export type ConvertingRoute = "by_design" | "by_production";
export type PreparationRoute = ConvertingRoute | "offset";
/** A selectable preparation task. A new Incoming Design project can have at most one of each. */
export type PreparationOrderKind = "tooling" | "rubber";
/**
 * `tooling_and_rubber` is retained only to read browser data saved by older
 * prototype versions. New UI must use `PreparationOrderKind[]` instead.
 */
export type PreparationOrderSelection =
  | PreparationOrderKind
  | "tooling_and_rubber";
export type DesignDecision = "approve" | "revision";
export type PreparationWorkflowUpdate = {
  route: PreparationRoute;
  /** Retained only for Offset projects created before automatic Prepress routing. */
  offsetNextPreparation?: "prepress";
  /** Legacy single value consumed by older screens. */
  productionOrder: PreparationOrderSelection | null;
  /** Canonical selection for new Incoming Design. Never contains duplicates. */
  preparationOrders?: PreparationOrderKind[];
  materialRequested: boolean;
  remark: string;
  toolingRequirement?: RequirementUpdateValues;
  rubberRequirement?: RequirementUpdateValues;
};
export type DrawingSubmission = {
  pic: string;
  deadline: string;
  drawingLink: string;
  /** Original UNC path when the drawing is referenced from the company file server. */
  drawingNetworkPath?: string;
  /** File name selected by the designer, retained even when the server path is added later. */
  drawingFileName?: string;
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

export type RequirementStatus =
  | "needed"
  | "ordered"
  | "received"
  | "available"
  | "on_hold"
  | "cancelled"
  | "repair"
  | "issue";

export type RequirementRecord = {
  sequence: number;
  requirementType: string;
  status: RequirementStatus;
  requestedBy: string;
  supplier: string;
  orderDate: string | null;
  expectedDate: string | null;
  arrivalDate: string | null;
  invoiceNumber: string;
  price: string;
  remark: string;
};

export type RequirementUpdateValues = Omit<RequirementRecord, "sequence">;

/**
 * Identifies a requirement order that starts directly from its operational
 * queue, without first creating an Incoming Design project.
 */
export type StandaloneRequirementKind = "tooling" | "rubber";

/**
 * The minimum project context required when Tooling or Rubber is ordered as a
 * standalone request. The first requirement is saved atomically with it.
 */
export type StandaloneRequirementOrderValues = {
  customer: string;
  product: string;
  partNo: string;
  material: string;
  priority: ProjectPriority;
  pic: string;
  projectDate: string;
  deadline: string;
  description: string;
  requirement: RequirementUpdateValues;
};

export type MaterialRequestStatus =
  | "draft"
  | "requested"
  | "released"
  | "received"
  | "on_hold";

/** The destination selected after saving an Offset Material / MI record. */
export type OffsetMaterialNextStep = "tooling_plate" | "varnish";

export type MaterialRequestRecord = {
  sequence: number;
  source?: StandaloneRequirementKind;
  /** Present only for Offset MI records; omitted by Converting and legacy data. */
  offsetNextStep?: OffsetMaterialNextStep;
  miNumber: string;
  status: MaterialRequestStatus;
  requestedBy: string;
  requestDate: string;
  material: string;
  quantity: string;
  unit: string;
  remark: string;
};

export type MaterialRequestValues = Omit<MaterialRequestRecord, "sequence">;

export type SampleProgressValues = {
  pic: string;
  deadline: string;
  sampleNumber: string;
  notes: string;
};

export type SampleProgressRecord = SampleProgressValues & { sequence: number; recordedAt: string };

export type OffsetSpkStatus =
  | "design_offset"
  | "prepress"
  | "material"
  | "plate"
  | "varnish"
  | "press"
  | "finishing"
  | "qc";

export type OffsetSpkRecord = {
  id: string;
  customer: string;
  productName: string;
  fgQuantity: string;
  paperType: string;
  grammage: string;
  planoSize: string;
  up: string;
  waste: string;
  planoSheets: string;
  colors: string;
  machine: string;
  finishing: string;
  deadline: string;
  remark: string;
  status: OffsetSpkStatus;
  createdAt: string;
};

export type OffsetSpkValues = Omit<OffsetSpkRecord, "id" | "createdAt">;

export type OffsetPlateType = "" | "GTO54" | "CD102" | "SM102" | "SUMITOMO";
export type OffsetPrepressStatus = "" | "Ready" | "Waiting";

export type OffsetPrepressValues = {
  /** Legacy snapshot retained for existing search/history records; new input derives this from mainData.mcNo. */
  noJoPnCode: string;
  idPlate: string;
  plateType: OffsetPlateType;
  /** Finished-good quantity confirmed by Prepress, separate from master FG Qty (SHT). */
  fgQuantity: string;
  proofColor: OffsetPrepressStatus;
  plot: OffsetPrepressStatus;
  plate: OffsetPrepressStatus;
  ink: OffsetPrepressStatus;
  remark: string;
};

export type OffsetPrepressRecord = OffsetPrepressValues & {
  recordedAt: string;
  updatedBy: string;
};

/**
 * Offset preparation is planned independently from the legacy linear route.
 * These values deliberately describe only draft/submitted state; business
 * readiness and Varnish requirement rules remain pending product decisions.
 */
export type OffsetPreparationBranchKind = "material" | "tooling" | "varnish";
export type OffsetPreparationSubmissionState = "draft" | "submitted";

export type OffsetPreparationPlanBranch = {
  state: OffsetPreparationSubmissionState;
};

export type OffsetToolingPreparationPlanBranch = OffsetPreparationPlanBranch & {
  /** Offset Tooling input held by Prepress until its parent plan is updated. */
  draft?: OffsetToolingValues;
};

export type OffsetPreparationPlanValues = {
  material: OffsetPreparationPlanBranch;
  /** A single property intentionally permits at most one active Tooling draft. */
  tooling?: OffsetToolingPreparationPlanBranch;
  /** Set only by a later approved Varnish-need decision; never inferred here. */
  varnish?: OffsetPreparationPlanBranch;
  /** Preparation note; kept separate from the project master remark. */
  remark?: string;
};

export type OffsetPreparationPlan = OffsetPreparationPlanValues & {
  projectId: string;
  updatedAt: string;
  updatedBy: string;
};

/**
 * Submission/audit record for an Offset preparation branch. This is not a
 * readiness, purchase-order, or production-process record.
 */
export type OffsetPreparationBranchRecord = {
  id: string;
  projectId: string;
  kind: OffsetPreparationBranchKind;
  state: "submitted";
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

/** Monitoring state for the submitted Offset Varnish branch only. */
export type OffsetVarnishStatus = "Waiting" | "In Progress" | "Ready" | "Revision Required";
export type OffsetVarnishValues = {
  status: OffsetVarnishStatus | "";
  remark: string;
};
export type OffsetVarnishRecord = Omit<OffsetVarnishValues, "status"> & {
  status: OffsetVarnishStatus;
  updatedAt: string;
  updatedBy: string;
};

/** Dedicated Tooling / Plate input for Offset; it does not reuse Converting tooling records. */
export type OffsetToolingPriority = "Low" | "Medium" | "Hard";
export type OffsetToolingMachine = "Auto Haido" | "Auto Jingya" | "Baozika" | "DC Manual" | "DC TMZ" | "DC Flat";

export type OffsetToolingValues = {
  mcNo: string;
  /** Uses the same operational states as the Converting tooling queue. */
  status: RequirementStatus;
  grammage: string;
  openWidth: string;
  openLength: string;
  priority: OffsetToolingPriority | "";
  machine: OffsetToolingMachine | "";
  orderDate: string;
  receivedDate: string;
  supplier: string;
  invoiceNumber: string;
  price: string;
  remark: string;
};

export type OffsetToolingLegacyRecord = OffsetToolingValues & {
  recordedAt: string;
  updatedBy: string;
};

export type OffsetToolingRecord = OffsetToolingLegacyRecord & {
  id: string;
};

/** A projectless Offset tooling record, retained for later project selection. */
export type ManualOffsetToolingValues = OffsetToolingValues & {
  customer: string;
  description: string;
  material: string;
  imposition: string;
  pic: string;
};

export type ManualOffsetToolingRecord = ManualOffsetToolingValues & {
  id: string;
  recordedAt: string;
  updatedBy: string;
};

/** Read-only catalog projection built from manual records and project-owned records. */
export type OffsetToolingCatalogRecord = OffsetToolingValues & {
  id: string;
  customer: string;
  description: string;
  material: string;
  imposition: string;
  pic: string;
  recordedAt: string;
  updatedBy: string;
  sourceProjectId?: string;
};

export type ProjectWorkflow = {
  drawingStatus?: DrawingStatus;
  toolingReady?: boolean;
  rubberReady?: boolean;
  toolingForwarded?: boolean;
  rubberForwarded?: boolean;
  /** Completed Material / MI task in the shared Converting preparation plan. */
  materialReady?: boolean;
  materialForwarded?: Partial<Record<StandaloneRequirementKind, boolean>>;
  preparationType: PreparationType;
  convertingRoute: ConvertingRoute | null;
  /** New independent selections; existing `productionOrder` remains a display adapter. */
  preparationOrders?: PreparationOrderKind[];
  productionOrder: PreparationOrderSelection | null;
  materialRequested: boolean;
  /** Latest Offset handoff note, displayed as the status for its destination stage. */
  offsetHandoffRemark?: string;
  currentStage: ProjectCurrentStage;
  currentProcess: string;
  currentStatus: ProjectCurrentStatus;
  drawingLink: string | null;
  drawingNetworkPath?: string;
  drawingFileName?: string;
  designDecision: DesignDecision | null;
  progress: number;
};

export type ToolingOrderRecord = RequirementRecord;

export type RubberOrderRecord = RequirementRecord;

export type ProcessHistoryRecord = {
  source?: StandaloneRequirementKind;
  stage?: WorkflowStage;
  pic?: string;
  deadline?: string;
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
  | "converting-design"
  | "converting-production"
  | "tooling-progress"
  | "rubber-order-setting"
  | "material-request"
  | "offset-design"
  | "offset-prepress"
  | "offset-material-request"
  | "offset-plate"
  | "offset-varnish"
  | "offset-press"
  | "sample-progress"
  | "quality-control"
  | "fa-report"
  | "submit-sample"
  | "sample-completed"
  | "order-production"
  | "completed";

export type Order = {
  requirementBranch?: StandaloneRequirementKind;
  sourceProjectId?: string;
  sampleSubmissions?: { submittedDate: string; recordedAt: string }[];
  sampleProgress?: SampleProgressRecord[];
  materialRequestSource?: StandaloneRequirementKind;
  id: string;
  lineage: ProjectLineage;
  mainData: ProjectMainData;
  workflow: ProjectWorkflow;
  toolingOrders: ToolingOrderRecord[];
  rubberOrders: RubberOrderRecord[];
  materialRequests: MaterialRequestRecord[];
  offsetSpks: OffsetSpkRecord[];
  /** Optional so projects created before the Offset Prepress form remain compatible. */
  offsetPrepress?: OffsetPrepressRecord;
  /** Optional so projects created before the Offset Tooling / Plate form remain compatible. */
  offsetTooling?: OffsetToolingLegacyRecord;
  /** Offset-only tooling records belong to this project; they are not a global tooling master. */
  offsetToolingRecords?: OffsetToolingRecord[];
  /** The record currently selected for this project's Tooling / Plate work. */
  offsetToolingId?: string;
  /** Optional for legacy projects created before parallel Offset preparation planning. */
  offsetPreparationPlan?: OffsetPreparationPlan;
  /** Immutable-per-kind submission records for the future parallel Offset queues. */
  offsetPreparationRecords?: OffsetPreparationBranchRecord[];
  /** Kept independently from the master remark and every other preparation branch. */
  offsetVarnish?: OffsetVarnishRecord;
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
  designFile?: File;
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
