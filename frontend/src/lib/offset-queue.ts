import { evaluateOffsetReadiness, hasSubmittedOffsetBranch, isOffsetPrintingHandoff } from "./offset-readiness";
import type { OffsetPreparationStep, Order, WorkflowStage } from "@/types/order";

const offsetQueueSteps = {
  "offset-prepress": "prepress",
  "offset-material-request": "material",
  "offset-plate": "tooling",
  "offset-varnish": "varnish",
  "offset-press": "printing",
} as const satisfies Partial<Record<WorkflowStage, OffsetPreparationStep | "printing">>;

export type OffsetQueueStage = keyof typeof offsetQueueSteps;

export function isOffsetQueueStage(stage: WorkflowStage): stage is OffsetQueueStage {
  return Object.hasOwn(offsetQueueSteps, stage);
}

const stageEntryProcesses: Record<OffsetQueueStage, readonly string[]> = {
  "offset-prepress": ["Prepress", "Prepress / Pra-Cetak"],
  "offset-material-request": ["Offset Material / Create MI", "Offset Material Request", "Material Request / MI"],
  "offset-plate": ["Tooling / Plate"],
  "offset-varnish": ["Block / Spot Varnish"],
  "offset-press": ["offset_printing_routed", "Press / Printing", "Press / Cetak"],
};
const qcEntryProcesses = ["QC Checking", "Quality Control"];
const knownStageEntries = new Set([...Object.values(stageEntryProcesses).flat(), ...qcEntryProcesses,
  "FA Report", "Submit Sample", "Ready to Submit", "Sample Decision", "Closed Project", "Completed"]);

export function isInOffsetQueue(order: Order, stage: OffsetQueueStage): boolean {
  if (order.workflow.preparationType !== "offset") return false;
  const step = offsetQueueSteps[stage];
  const plan = order.offsetPreparationPlan;
  if ((step === "tooling" || step === "varnish") && plan?.projectId === order.id &&
      plan.material?.state === "submitted" && !plan[step]) return false;

  if (order.stage === stage || order.processHistory.some((event) =>
    event.stage === stage || (!event.stage && stageEntryProcesses[stage].includes(event.process)))) return true;

  if (step === "prepress") return Boolean(order.offsetPrepress);
  if (step === "printing") return false;
  if (hasSubmittedOffsetBranch(order, step)) return true;

  // Only stage-specific legacy data is admission evidence when no branch was submitted.
  if (order.offsetPreparationPlan || order.offsetPreparationRecords?.length) return false;
  if (step === "tooling") return Boolean(order.offsetTooling || order.offsetToolingRecords?.length);
  if (step === "varnish") return Boolean(order.offsetVarnish);
  return order.materialRequests.some((record) => !record.source && (record.offsetNextStep ||
    (typeof record.miNumber === "string" && record.miNumber.startsWith("OMI-"))));
}

function hasCompletedPrinting(order: Order) {
  // The Printing action writes a handoff immediately followed by entry into QC.
  let enteredPrinting = false;
  return order.processHistory.some((event, index, history) => {
    if (knownStageEntries.has(event.process)) enteredPrinting = stageEntryProcesses["offset-press"].includes(event.process);
    const next = history[index + 1];
    return isOffsetPrintingHandoff(event, enteredPrinting) &&
      Boolean(next && qcEntryProcesses.includes(next.process) && Date.parse(next.date) >= Date.parse(event.date));
  });
}

export function isOffsetQueueCompleted(order: Order, stage: OffsetQueueStage): boolean {
  if (order.workflow.preparationType !== "offset") return false;
  const step = offsetQueueSteps[stage];
  return step === "printing" ? hasCompletedPrinting(order) : evaluateOffsetReadiness(order).branches[step] === "ready";
}
