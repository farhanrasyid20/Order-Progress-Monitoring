import type { ProjectRole } from "@/types/order";

export type ProjectPermissions = {
  canCreateProject: boolean;
  canEditProject: boolean;
  canUpdateWorkflow: boolean;
};

/** Central placeholder for the current prototype roles. */
export const permissions: Record<ProjectRole, ProjectPermissions> = {
  qc: { canCreateProject: false, canEditProject: false, canUpdateWorkflow: true },
  intern: { canCreateProject: false, canEditProject: false, canUpdateWorkflow: true },
  superadmin: {
    canCreateProject: true,
    canEditProject: true,
    canUpdateWorkflow: true,
  },
  admin: {
    canCreateProject: true,
    canEditProject: true,
    canUpdateWorkflow: true,
  },
  manager: {
    canCreateProject: true,
    canEditProject: true,
    canUpdateWorkflow: true,
  },
  design: {
    canCreateProject: true,
    canEditProject: false,
    canUpdateWorkflow: false,
  },
};

export function canUpdateDrawingStatus(role: ProjectRole) {
  // Drawing progress is maintained by the Design team during Incoming Design;
  // supervisory roles retain the same access for review and correction.
  return ["superadmin", "admin", "manager", "design"].includes(role);
}
