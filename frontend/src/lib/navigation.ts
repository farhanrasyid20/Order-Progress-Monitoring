import type { IconName } from "@/components/ui/icon";

export type NavigationItem = {
  label: string;
  href: string;
  icon: IconName;
  count?: number;
  group: "workspace" | "system";
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
    label: "Tooling Progress",
    href: "/tooling-progress",
    icon: "settings",
    group: "workspace",
  },
  {
    label: "Rubber Order & Setting",
    href: "/rubber-order-setting",
    icon: "box",
    group: "workspace",
  },
  { label: "Sample Progress", href: "/sample", icon: "flask", group: "workspace" },
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
