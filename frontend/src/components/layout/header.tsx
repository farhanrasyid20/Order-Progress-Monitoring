"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChangePasswordModal } from "./change-password-modal";
import { Icon } from "@/components/ui/icon";
import { getNavigationItem } from "@/lib/navigation";

const sampleNotifications = [
  { id: 1, title: "Drawing Awaiting Review", message: "A new drawing has been submitted for review and approval.", time: "5 minutes ago", href: "/review-approval" },
  { id: 2, title: "Sample Completed", message: "The sample is complete. Choose the next step for this project.", time: "20 minutes ago", href: "/after-sample" },
  { id: 3, title: "Deadline Reminder", message: "Check the order list for projects approaching their deadlines.", time: "1 hour ago", href: "/orders" },
];

export type HeaderProps = {
  onOpenMenu: () => void;
  onToggleDesktopSidebar: () => void;
  desktopSidebarCollapsed: boolean;
};

/** Top bar whose breadcrumb follows the active App Router route. */
export function Header({
  onOpenMenu,
  onToggleDesktopSidebar,
  desktopSidebarCollapsed,
}: HeaderProps) {
  const pathname = usePathname();
  const activeItem = getNavigationItem(pathname);
  const activeLabel = activeItem?.label ?? "Workspace";
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<number[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const unreadCount = sampleNotifications.length - readNotifications.length;

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        notificationTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button desktop-sidebar-toggle"
          aria-label={desktopSidebarCollapsed ? "Buka navigasi" : "Tutup navigasi"}
          title={desktopSidebarCollapsed ? "Buka navigasi" : "Tutup navigasi"}
          aria-controls="main-navigation"
          aria-expanded={!desktopSidebarCollapsed}
          onClick={onToggleDesktopSidebar}
        >
          <Icon name="chevron" />
        </button>
        <button
          type="button"
          className="icon-button menu-button"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <Icon name="menu" />
        </button>
      </div>

      <div className="header-actions">
        <div className="notification-menu" ref={notificationRef}>
        <button
          type="button"
          className="icon-button notification"
          ref={notificationTriggerRef}
          aria-label={`Notifications, ${unreadCount} unread`}
          aria-expanded={notificationsOpen}
          aria-controls="notification-options"
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setProfileOpen(false);
          }}
        >
          <Icon name="bell" />
          {unreadCount > 0 && <span />}
        </button>
        {notificationsOpen && (
          <section className="notification-dropdown" id="notification-options" aria-label="Notifications">
            <div className="notification-heading">
              <strong>Notifications <small>{unreadCount} unread</small></strong>
              <button type="button" disabled={unreadCount === 0}
                onClick={() => setReadNotifications(sampleNotifications.map((item) => item.id))}>
                Mark all as read
              </button>
            </div>
            <ul className="notification-list">
              {sampleNotifications.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={`notification-item ${readNotifications.includes(item.id) ? "" : "unread"}`}
                    onClick={() => {
                      setReadNotifications((current) => current.includes(item.id) ? current : [...current, item.id]);
                      setNotificationsOpen(false);
                    }}>
                    <span className="notification-item-icon"><Icon name="bell" size={16} /></span>
                    <span className="notification-item-copy">
                      <strong>{item.title}</strong><span>{item.message}</span><small>{item.time}</small>
                    </span>
                    {!readNotifications.includes(item.id) && <span className="notification-unread-dot" aria-label="Unread" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
        <div className="profile-menu" ref={profileRef}>
        <button type="button" className="profile profile-trigger" ref={triggerRef}
          aria-label="Open profile options" aria-expanded={profileOpen}
          aria-controls="profile-options" onClick={() => {
            setProfileOpen((open) => !open);
            setNotificationsOpen(false);
          }}>
          <div className="avatar">FR</div>
          <div className="profile-copy">
            <strong>Farhan Rasyid</strong>
            <small>Graphic Designer</small>
          </div>
          <Icon name="chevron" size={14} />
        </button>
        {profileOpen && (
          <div className="profile-dropdown" id="profile-options">
            <button type="button" onClick={() => {
              setProfileOpen(false);
              setPasswordOpen(true);
            }}>
              <Icon name="shield" size={16} /> Change Password
            </button>
          </div>
        )}
        </div>
      </div>
      {passwordOpen && <ChangePasswordModal onClose={() => {
        setPasswordOpen(false);
        triggerRef.current?.focus();
      }} />}
    </header>
  );
}

export default Header;
