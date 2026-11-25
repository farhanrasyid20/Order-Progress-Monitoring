import type {
  OffsetPreparationBranchKind,
  OffsetPreparationBranchRecord,
  OffsetPreparationPlan,
  OffsetPreparationPlanValues,
} from "@/types/order";

const preparationKinds: readonly OffsetPreparationBranchKind[] = ["material", "tooling", "varnish"];

/** Keeps the project identity authoritative when a draft is saved repeatedly. */
export function createOffsetPreparationPlan(
  projectId: string,
  values: OffsetPreparationPlanValues,
  actor: string,
  timestamp: string,
): OffsetPreparationPlan {
  return {
    projectId,
    material: { state: values.material.state },
    ...(values.tooling ? {
      tooling: {
        state: values.tooling.state,
        ...(values.tooling.draft ? { draft: { ...values.tooling.draft } } : {}),
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
