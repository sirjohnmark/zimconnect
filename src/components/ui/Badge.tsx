// TODO: implement
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return null;
}
