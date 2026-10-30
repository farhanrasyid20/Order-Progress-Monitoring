import { UsersProvider } from "@/components/users/users-provider";
import type { Metadata } from "next";
import AppFrame from "@/components/layout/app-frame";
import { IssuesProvider } from "@/components/issues/issue-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthenticatedWorkflowProvider } from "@/components/auth/authenticated-workflow-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "COTS — Customer Order Tracking System",
  description: "Live monitoring for design, preparation, sample, and closing orders",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <UsersProvider>
          <AuthProvider>
            <AuthenticatedWorkflowProvider>
              <IssuesProvider>
                <AppFrame>{children}</AppFrame>
              </IssuesProvider>
            </AuthenticatedWorkflowProvider>
          </AuthProvider>
        </UsersProvider>
      </body>
    </html>
  );
}
