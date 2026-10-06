import type {
  Order,
  ProjectCurrentStage,
  ProjectMainData,
  ProjectWorkflow,
  WorkflowStage,
} from "@/types/order";

type LegacyOrder = Omit<
  Order,
  | "id"
  | "lineage"
  | "mainData"
  | "workflow"
  | "toolingOrders"
  | "rubberOrders"
  | "processHistory"
  | "createdAt"
  | "updatedAt"
>;

function projectStageForQueue(stage: WorkflowStage): ProjectCurrentStage {
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

function mainDataFromLegacyOrder(order: LegacyOrder): ProjectMainData {
  return {
    mcNo: order.no,
    component: order.product,
    custName: order.customer,
    partNo: "",
    partNo2: "",
    set: "",
    sub: "",
    singDoub: "",
    width: "",
    length: "",
    dieCutSht: "",
    boardQua: order.material,
    corFlut: "",
    creaseL: "",
    creaseW: "",
    slotting: "",
    remark: order.description === "-" ? "" : order.description,
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

function createSeedProject(order: LegacyOrder): Order {
  const stage = order.stage === "design-incoming" ? "order" : order.stage;
  const isNewProject = stage === "order";
  const createdAt = "2026-07-01T00:00:00.000Z";
  const mainData = mainDataFromLegacyOrder(order);
  const currentProcess = isNewProject ? "new_project" : order.process;
  const displayProcess = isNewProject ? "New Project" : order.process;

  return {
    ...order,
    id: `seed-${order.no}`,
    lineage: {
      entryType: "new",
      rootProjectNo: order.no,
      sourceProjectNo: null,
      versionNumber: 0,
    },
    mainData,
    workflow: {
      preparationType: "converting",
      convertingRoute: "by_design",
      productionOrder: null,
      materialRequested: false,
      currentStage: projectStageForQueue(stage),
      currentProcess,
      currentStatus: currentStatusForQueue(stage, order.status),
      drawingLink: null,
      designDecision: null,
      progress: isNewProject ? 0 : order.progress,
    },
    toolingOrders: [],
    rubberOrders: [],
    processHistory: [
      {
        process: currentProcess,
        status: isNewProject ? "new" : order.status,
        date: createdAt,
        user: "System",
        remark: "Seed project",
      },
    ],
    createdAt,
    updatedAt: createdAt,
    stage,
    process: displayProcess,
    progress: isNewProject ? 0 : order.progress,
  };
}

/**
 * Temporary project data based on the supplied Design Workload System
 * reference. Every project belongs to exactly one workflow stage.
 */
const legacyOrders: LegacyOrder[] = [
  {
    no: "PSR#260842",
    customer: "Rubycon",
    product: "Komponen Kapasitor",
    description: "Desain awal komponen kapasitor",
    material: "NBR",
    priority: "High",
    process: "Incoming Design",
    pic: "Ihsan",
    projectDate: "20 Jul 2026",
    deadline: "28 Jul 2026",
    status: "New",
    tone: "info",
    stage: "design-incoming",
    progress: 15,
  },
  {
    no: "PSR#260849",
    customer: "Mitsubishi",
    product: "Gasket",
    description: "Gambar teknik terlampir",
    material: "EPDM",
    priority: "Medium",
    process: "Incoming Design",
    pic: "Aldo",
    projectDate: "18 Jul 2026",
    deadline: "27 Jul 2026",
    status: "New",
    tone: "info",
    stage: "design-incoming",
    progress: 10,
  },
  {
    no: "PSR#260850",
    customer: "Bosch",
    product: "Seal",
    description: "-",
    material: "FKM",
    priority: "High",
    process: "Incoming Design",
    pic: "Ihsan",
    projectDate: "18 Jul 2026",
    deadline: "28 Jul 2026",
    status: "New",
    tone: "info",
    stage: "design-incoming",
    progress: 10,
  },
  {
    no: "PSR#260851",
    customer: "Hitachi",
    product: "Custom Moulding",
    description: "Menunggu spec sheet dari klien",
    material: "Silicone",
    priority: "Medium",
    process: "Incoming Design",
    pic: "Dimas",
    projectDate: "19 Jul 2026",
    deadline: "29 Jul 2026",
    status: "Waiting for Information",
    tone: "warning",
    stage: "design-incoming",
    progress: 10,
  },
  {
    no: "PSR#260852",
    customer: "Toshiba",
    product: "O-Ring",
    description: "-",
    material: "NBR",
    priority: "Low",
    process: "Incoming Design",
    pic: "Aldo",
    projectDate: "20 Jul 2026",
    deadline: "30 Jul 2026",
    status: "New",
    tone: "info",
    stage: "design-incoming",
    progress: 5,
  },
  {
    no: "PSR#260843",
    customer: "Rubycon",
    product: "PCB Modul Daya",
    description: "Revisi layout PCB modul daya",
    material: "Silicone",
    priority: "Medium",
    process: "Design Process",
    pic: "Aldo",
    projectDate: "15 Jul 2026",
    deadline: "27 Jul 2026",
    status: "In Progress",
    tone: "info",
    stage: "design-progress",
    progress: 40,
  },
  {
    no: "PSR#260844",
    customer: "Hisense",
    product: "Casing TV LED 55 inci",
    description: "Desain casing TV LED 55 inci",
    material: "EPDM",
    priority: "Medium",
    process: "Incoming Design",
    pic: "Dimas",
    projectDate: "25 Jul 2026",
    deadline: "12 Aug 2026",
    status: "Waiting for Design Decision",
    tone: "warning",
    stage: "review-approval",
    progress: 60,
  },
  {
    no: "PSR#260845",
    customer: "NGK",
    product: "Gasket",
    description: "Tooling busi tipe iridium generasi baru",
    material: "FKM",
    priority: "Medium",
    process: "Tooling Progress",
    pic: "Ihsan",
    projectDate: "17 Jul 2026",
    deadline: "30 Jul 2026",
    status: "In Progress",
    tone: "info",
    stage: "tooling-progress",
    progress: 65,
  },
  {
    no: "PSR#260846",
    customer: "Denso",
    product: "Diaphragm",
    description: "Urgent - line stop risk",
    material: "NBR",
    priority: "High",
    process: "Rubber Order & Setting",
    pic: "Aldo",
    projectDate: "18 Jul 2026",
    deadline: "31 Jul 2026",
    status: "Waiting for KTP",
    tone: "warning",
    stage: "rubber-order-setting",
    progress: 70,
  },
  {
    no: "PSR#260847",
    customer: "Panasonic",
    product: "Vibration Damper",
    description: "Komponen motor brushless",
    material: "CR",
    priority: "Low",
    process: "Sample Progress",
    pic: "Dimas",
    projectDate: "11 Jul 2026",
    deadline: "25 Jul 2026",
    status: "Sample In Progress",
    tone: "info",
    stage: "sample-progress",
    progress: 80,
  },
  {
    no: "PSR#260848",
    customer: "Sharp",
    product: "O-Ring",
    description: "Modul display LCD panel kontrol",
    material: "SBR",
    priority: "Low",
    process: "Sample Completed",
    pic: "Ihsan",
    projectDate: "12 Jul 2026",
    deadline: "26 Jul 2026",
    status: "Sample Completed",
    tone: "success",
    stage: "sample-completed",
    progress: 100,
  },
];

export const orders: Order[] = legacyOrders.map(createSeedProject);

export default orders;
