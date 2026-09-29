"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getNavigationItem } from "@/lib/navigation";

export type HeaderProps = {
  onOpenMenu: () => void;
};

/** Top bar whose breadcrumb follows the active App Router route. */
export function Header({ onOpenMenu }: HeaderProps) {
  const pathname = usePathname();
  const activeItem = getNavigationItem(pathname);
  const activeLabel = activeItem?.label ?? "Workspace";

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button menu-button"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <Icon name="menu" />
        </button>
        <div className="breadcrumbs">
          <span>Workspace</span>
          <Icon name="chevron" size={14} />
          <strong>{activeLabel}</strong>
        </div>
      </div>

      <div className="header-actions">
        <label className="global-search">
          <Icon name="search" size={17} />
          <input type="search" placeholder="Search order..." />
          <kbd>Ctrl K</kbd>
        </label>
        <button
          type="button"
          className="icon-button notification"
          aria-label="Notifications"
        >
          <Icon name="bell" />
          <span />
        </button>
        <div className="profile">
          <div className="avatar">AP</div>
          <div className="profile-copy">
            <strong>Aditya Pranoto</strong>
            <small>Administrator</small>
          </div>
          <Icon name="chevron" size={14} />
        </div>
      </div>
    </header>
  );
}

export default Header;
