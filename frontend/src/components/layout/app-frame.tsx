"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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
    setMobileSidebarOpen(false);

    if (onLogout) {
      onLogout();
    }
  };

  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

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
