import type { ReactNode } from "react";
import type { OrderStatusTone } from "@/types/order";

export type BadgeProps = {
  children: ReactNode;
  tone?: OrderStatusTone;
  className?: string;
};

/** Status marker using the existing `badge badge-{tone}` CSS contract. */
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
