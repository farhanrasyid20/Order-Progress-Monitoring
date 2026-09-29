"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: IconName;
};

/** Shared button with the existing `button button-{variant}` CSS contract. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", icon, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`button button-${variant} ${className}`.trim()}
      {...props}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
