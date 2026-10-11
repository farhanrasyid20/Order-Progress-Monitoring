import type { ProjectRole } from "@/types/order";

export type ProjectPermissions = {
  canCreateProject: boolean;
  canEditProject: boolean;
  canUpdateWorkflow: boolean;
};

/** Central placeholder for the current prototype roles. */
export const permissions: Record<ProjectRole, ProjectPermissions> = {
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
  return role === "superadmin";
}
