"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  isNavigationItemActive,
  systemNavigationItems,
  workspaceNavigationItems,
} from "@/lib/navigation";

export type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

function NavigationLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof workspaceNavigationItems)[number];
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isNavigationItemActive(item, pathname);

  return (
    <Link
      className={`nav-item ${active ? "active" : ""}`.trim()}
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

/** Persistent navigation for every authenticated application page. */
export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open ? <div className="overlay" onClick={onClose} aria-hidden="true" /> : null}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>COTS</strong>
            <small>Order Tracking</small>
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
          {workspaceNavigationItems.map((item) => (
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
          <button
            type="button"
            className="nav-item logout"
            onClick={onLogout}
          >
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
