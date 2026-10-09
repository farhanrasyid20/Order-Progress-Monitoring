import type { IconName } from "@/components/ui/icon";

export type WorkflowFlow = "converting" | "offset";

export type NavigationItem = {
  label: string;
  href: string;
  icon: IconName;
  count?: number;
  group: "workspace" | "system";
  /** A route-specific workflow group shown after the shared design flow. */
  flow?: WorkflowFlow;
};

export type WorkflowNavigationGroup = {
  id: WorkflowFlow;
  label: string;
  icon: IconName;
  items: readonly NavigationItem[];
  emptyCopy: string;
};

/** Sidebar items and their actual App Router destinations. */
export const navigationItems: readonly NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid", group: "workspace" },
  {
    label: "Incoming Design",
    href: "/orders",
    icon: "box",
    count: 12,
    group: "workspace",
  },
  {
    label: "Design Process",
    href: "/design-drawing",
    icon: "pen",
    group: "workspace",
  },
  {
    label: "Issue Log",
    href: "/issue-log",
    icon: "alert",
    group: "workspace",
  },
  {
    label: "Tooling Progress",
    href: "/converting/tooling-progress",
    icon: "settings",
    group: "workspace",
    flow: "converting",
  },
  {
    label: "Rubber Order & Setting",
    href: "/converting/rubber-order-setting",
    icon: "box",
    group: "workspace",
    flow: "converting",
  },
  {
    label: "Material Request / MI",
    href: "/converting/material-request",
    icon: "box",
    group: "workspace",
    flow: "converting",
  },
  {
    label: "Sample Progress",
    href: "/converting/sample",
    icon: "flask",
    group: "workspace",
    flow: "converting",
  },
  {
    label: "Offset SPK Jobs",
    href: "/offset",
    icon: "file",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Design Offset",
    href: "/offset/design",
    icon: "pen",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Prepress / Pra-Cetak",
    href: "/offset/prepress",
    icon: "pen",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Material / MI",
    href: "/offset/material",
    icon: "box",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Tooling / Plate",
    href: "/offset/plate",
    icon: "settings",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Block / Spot Varnish",
    href: "/offset/varnish",
    icon: "settings",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "Press / Cetak",
    href: "/offset/press",
    icon: "box",
    group: "workspace",
    flow: "offset",
  },
  {
    label: "QC Checking",
    href: "/quality-control",
    icon: "shield",
    group: "workspace",
  },
  {
    label: "FA Report",
    href: "/fa-report",
    icon: "file",
    group: "workspace",
  },
  {
    label: "Submit Sample",
    href: "/submit-sample",
    icon: "check",
    group: "workspace",
  },
  {
    label: "After Sample / Decision",
    href: "/after-sample",
    icon: "check",
    count: 3,
    group: "workspace",
  },
  {
    label: "Order / Production",
    href: "/order-production",
    icon: "box",
    group: "workspace",
  },
  {
    label: "History & Archive",
    href: "/history-archive",
    icon: "file",
    group: "workspace",
  },
  { label: "Reports", href: "/reports", icon: "report", group: "workspace" },
  { label: "Master Data", href: "/users", icon: "users", group: "workspace" },
  { label: "Settings", href: "/settings", icon: "settings", group: "system" },
];

export const workspaceNavigationItems = navigationItems.filter(
  (item) => item.group === "workspace",
);

export const systemNavigationItems = navigationItems.filter(
  (item) => item.group === "system",
);

/**
 * Converting and Offset deliberately have separate navigation groups so their
 * tasks cannot be confused after a drawing is approved.
 */
export const workflowNavigationGroups: readonly WorkflowNavigationGroup[] = [
  {
    id: "converting",
    label: "Converting",
    icon: "settings",
    items: workspaceNavigationItems.filter((item) => item.flow === "converting"),
    emptyCopy: "Tahap Converting belum tersedia.",
  },
  {
    id: "offset",
    label: "Offset",
    icon: "box",
    items: workspaceNavigationItems.filter((item) => item.flow === "offset"),
    emptyCopy: "Tahap Offset belum tersedia.",
  },
];

/**
 * Returns the best sidebar item for a pathname, including nested feature pages.
 * The longest matching href wins so this remains correct when nested routes grow.
 */
export function getNavigationItem(pathname: string) {
  return [...navigationItems]
    .sort((first, second) => second.href.length - first.href.length)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
    );
}

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return getNavigationItem(pathname)?.href === item.href;
}
