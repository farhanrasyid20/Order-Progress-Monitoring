"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // A selected route should never leave the mobile drawer over the new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setSidebarOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    router.push("/login");
  };

  if (pathname === "/login") {
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
