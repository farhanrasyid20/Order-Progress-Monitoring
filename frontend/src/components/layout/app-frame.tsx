"use client";

import { useState, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    setSidebarOpen(false);

    if (onLogout) {
      onLogout();
    }
  };

  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="main-shell">
        <Header onOpenMenu={() => setSidebarOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}

export { AppFrame };
