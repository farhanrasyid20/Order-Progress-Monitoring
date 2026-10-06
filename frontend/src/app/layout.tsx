import type { Metadata } from "next";
import AppFrame from "@/components/layout/app-frame";
import { WorkflowOrdersProvider } from "@/components/workflow/workflow-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "COTS — Customer Order Tracking System",
  description: "Live monitoring for design, preparation, sample, and closing orders",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <WorkflowOrdersProvider>
          <AppFrame>{children}</AppFrame>
        </WorkflowOrdersProvider>
      </body>
    </html>
  );
}
