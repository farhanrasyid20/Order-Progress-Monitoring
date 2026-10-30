"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { canAccessPath } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export type AppFrameProps = {
  children: ReactNode;
  onLogout?: () => void;
};

/**
 * Shared authenticated-page frame. Feature routes provide their own page body,
 * while this component owns responsive navigation and the global header.
 */
export default function AppFrame({ children, onLogout }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const publicPage = pathname === "/" || pathname === "/login";
  const allowed = Boolean(user && canAccessPath(user.role, pathname));

  useEffect(() => {
    if (!ready || publicPage) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace("/dashboard");
  }, [ready, publicPage, user, allowed, router]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 860px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileSidebarOpen(false);

    if (onLogout) {
      onLogout();
    }
  };

  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  if (!ready || !user || !allowed) return <main><p role="status">Memuat akses pengguna...</p></main>;

  return (
    <div className={`app-shell ${desktopSidebarCollapsed ? "sidebar-collapsed" : ""}`.trim()}>
      <Sidebar
        open={mobileSidebarOpen}
        visible={isMobileViewport ? mobileSidebarOpen : !desktopSidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="main-shell">
        <Header
          onOpenMenu={() => setMobileSidebarOpen(true)}
          onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((current) => !current)}
          desktopSidebarCollapsed={desktopSidebarCollapsed}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}

export { AppFrame };
