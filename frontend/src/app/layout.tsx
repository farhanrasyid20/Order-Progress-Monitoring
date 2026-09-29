import type { Metadata } from "next";
import AppFrame from "@/components/layout/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "COTS | Customer Order Tracking System",
  description: "Customer Order Tracking System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
