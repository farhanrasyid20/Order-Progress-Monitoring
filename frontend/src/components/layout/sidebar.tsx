"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  isNavigationItemActive,
  systemNavigationItems,
  workflowNavigationGroups,
  workspaceNavigationItems,
} from "@/lib/navigation";

export type SidebarProps = {
  open: boolean;
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

function NavigationLink({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: (typeof workspaceNavigationItems)[number];
  pathname: string;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const active = isNavigationItemActive(item, pathname);

  return (
    <Link
      className={`nav-item ${nested ? "nav-sub-item" : ""} ${active ? "active" : ""}`.trim()}
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {item.count ? <b>{item.count}</b> : null}
    </Link>
  );
}

function WorkflowNavigationGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: (typeof workflowNavigationGroups)[number];
  pathname: string;
  onNavigate: () => void;
}) {
  const active = group.items.some((item) => isNavigationItemActive(item, pathname));
  const [expanded, setExpanded] = useState(active);

  return (
    <section className={`nav-flow ${active ? "active" : ""}`.trim()}>
      <button
        type="button"
        className={`nav-flow-toggle ${active ? "active" : ""}`.trim()}
        aria-expanded={expanded}
        aria-controls={`nav-flow-${group.id}`}
        onClick={() => setExpanded((current) => !current)}
      >
        <Icon name={group.icon} />
        <span>{group.label}</span>
        <Icon className="nav-flow-chevron" name="chevron" size={16} />
      </button>

      {expanded ? (
        <div className="nav-flow-items" id={`nav-flow-${group.id}`}>
          {group.items.length > 0 ? (
            group.items.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
                nested
              />
            ))
          ) : (
            <p className="nav-flow-empty">{group.emptyCopy}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

/** Persistent navigation for every authenticated application page. */
export function Sidebar({ open, visible, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const sharedDesignItems = workspaceNavigationItems.filter(
    (item) =>
      item.flow === undefined &&
      ["/dashboard", "/orders", "/design-drawing", "/issue-log"].includes(item.href),
  );
  const downstreamItems = workspaceNavigationItems.filter(
    (item) => item.flow === undefined && !sharedDesignItems.includes(item),
  );

  return (
    <>
      {open ? <div className="overlay" onClick={onClose} aria-hidden="true" /> : null}
      <aside
        id="main-navigation"
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>DESIGN WORKLOAD</strong>
            <small>SYSTEM</small>
          </div>
          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          {sharedDesignItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}

          {workflowNavigationGroups.map((group) => (
            <WorkflowNavigationGroup
              key={group.id}
              group={group}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}

          {downstreamItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}

          <p className="nav-label nav-label-settings">SYSTEM</p>
          {systemNavigationItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="support-card">
            <span className="support-icon">
              <Icon name="alert" size={17} />
            </span>
            <div>
              <strong>Need help?</strong>
              <small>Contact IT Support</small>
            </div>
            <Icon name="chevron" size={15} />
          </div>
          <Link
            href="/"
            className="nav-item logout"
            onClick={onLogout}
          >
            <Icon name="logout" />
            <span>Log out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
