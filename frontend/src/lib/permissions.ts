import type { ProjectRole } from "@/types/order";

export type ProjectPermissions = {
  canCreateProject: boolean;
  canEditProject: boolean;
  canUpdateWorkflow: boolean;
};

/** Central placeholder for the current prototype roles. */
export const permissions: Record<ProjectRole, ProjectPermissions> = {
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
