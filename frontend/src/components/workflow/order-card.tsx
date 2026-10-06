import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";

export type OrderCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Card shell for an order table and its supporting controls. */
export function OrderCard({
  title,
  subtitle,
  action,
  children,
  className = "full-orders",
}: OrderCardProps) {
  return (
    <section className={`card ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </section>
  );
}
