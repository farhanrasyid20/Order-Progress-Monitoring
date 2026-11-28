import type {
  OffsetPreparationBranchKind,
  OffsetPreparationBranchRecord,
  OffsetPreparationPlan,
  OffsetPreparationPlanValues,
  OffsetPreparationCompletion,
  OffsetPreparationSaveAction,
  OffsetVarnishValues,
  Order,
  ProjectMainData,
} from "@/types/order";
import { defaultOffsetPreparationStatus, isOffsetPreparationStatus } from "./offset-preparation-status";

const preparationKinds: readonly OffsetPreparationBranchKind[] = ["material", "tooling", "varnish"];

/** Keeps the project identity authoritative when a draft is saved repeatedly. */
export function createOffsetPreparationPlan(
  projectId: string,
  values: OffsetPreparationPlanValues,
  actor: string,
  timestamp: string,
  previousTooling?: OffsetPreparationPlanValues["tooling"],
): OffsetPreparationPlan {
  return {
    projectId,
    material: { state: values.material.state },
    ...(values.tooling ? {
      tooling: {
        state: values.tooling.state,
        ...(values.tooling.draft ? { draft: {
          ...previousTooling?.draft,
          ...values.tooling.draft,
          status: values.tooling.draft.status === "needed" ? defaultOffsetPreparationStatus : values.tooling.draft.status,
        } } : {}),
      },
    } : {}),
    ...(values.varnish ? { varnish: { state: values.varnish.state } } : {}),
    remark: values.remark?.trim() ?? "",
    updatedAt: timestamp,
    updatedBy: actor,
  };
}

/** Returns only explicit submissions; Varnish is never inferred from master data. */
export function submittedOffsetPreparationKinds(plan: OffsetPreparationPlan): OffsetPreparationBranchKind[] {
  return preparationKinds.filter((kind) => plan[kind]?.state === "submitted");
}

/**
 * Creates at most one submission record per branch/project and retains all
 * records already saved for legacy or later-stage consumers.
 */
export function appendOffsetPreparationRecords(
  existing: readonly OffsetPreparationBranchRecord[] | undefined,
  plan: OffsetPreparationPlan,
  actor: string,
  timestamp: string,
): OffsetPreparationBranchRecord[] {
  const records = [...(existing ?? [])];
  for (const kind of submittedOffsetPreparationKinds(plan)) {
    if (records.some((record) => record.projectId === plan.projectId && record.kind === kind)) continue;
    records.push({
      id: `offset-preparation-${plan.projectId}-${kind}`,
      projectId: plan.projectId,
      kind,
      state: "submitted",
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: actor,
    });
  }
  return records;
}

/**
 * Queue projection for the independent Offset Varnish branch. It deliberately
 * does not inspect the linear project stage or Material/Tooling readiness:
 * the submitted project-owned branch record is the sole admission evidence.
 */
export function isOffsetVarnishQueueOrder(order: Order) {
  return order.workflow.preparationType === "offset" &&
    order.workflow.currentStatus !== "cancelled" &&
    Boolean(submittedVarnishRecord(order));
}

function submittedVarnishRecord(order: Order) {
  if (!Array.isArray(order.offsetPreparationRecords)) return undefined;
  return order.offsetPreparationRecords.find((record) =>
    record?.projectId === order.id && record.kind === "varnish" && record.state === "submitted",
  );
}

export function canEditOffsetVarnish(order: Order) {
  const plan = order.offsetPreparationPlan;
  return plan?.projectId === order.id && plan.material?.state === "submitted" && plan.varnish?.state === "submitted" &&
    isOffsetVarnishQueueOrder(order) && isActiveOffsetPreparation(order) && !hasValidOffsetVarnishCompletion(order);
}

export function isActiveOffsetPreparation(order: Order) {
  return order.workflow.preparationType === "offset" &&
    order.workflow.currentStatus !== "completed" && order.workflow.currentStatus !== "cancelled" &&
    ["offset-prepress", "offset-material-request", "offset-plate", "offset-varnish"].includes(order.stage);
}

export const varnishSpecificationFields = ["varnish", "lamination", "coatingSide"] as const;

export function varnishSpecification(data: ProjectMainData) {
  return varnishSpecificationFields.map((field) => data[field]?.trim() ?? "");
}

export function offsetVarnishFingerprint(order: Order, status = order.offsetVarnish?.status ?? defaultOffsetPreparationStatus) {
  const submission = submittedVarnishRecord(order);
  return JSON.stringify([order.id, submission?.id, submission?.createdAt, status, ...varnishSpecification(order.mainData)]);
}

export function offsetVarnishSnapshot(order: Order) {
  return JSON.stringify([offsetVarnishFingerprint(order), order.offsetVarnish]);
}

export function hasValidOffsetVarnishCompletion(order: Order) {
  const record = order.offsetVarnish;
  // Historical Ready is accepted only with its original, still-current completion evidence.
  return order.workflow.preparationType === "offset" && Boolean(submittedVarnishRecord(order)) &&
    (record?.status === "received" || record?.status === "Ready") &&
    isCurrentOffsetCompletion(record.completion, offsetVarnishFingerprint(order));
}

export function isCurrentOffsetCompletion(completion: OffsetPreparationCompletion | undefined, fingerprint: string) {
  return Boolean(typeof completion?.actor === "string" && completion.actor.trim() &&
    Number.isFinite(Date.parse(completion.timestamp)) && completion.fingerprint === fingerprint);
}

export function validateOffsetVarnishValues(values: OffsetVarnishValues, action: OffsetPreparationSaveAction) {
  if (!isOffsetPreparationStatus(values.status)) return "Select a Varnish Status.";
  if (typeof values.remark !== "string") return "Enter a valid Varnish remark.";
  if (action === "continue" && values.status !== "received") return "Varnish Status must be Received to continue.";
  return "";
}
