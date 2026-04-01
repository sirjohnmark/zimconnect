import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ContainerProps {
  children: React.ReactNode;
  /** Max-width breakpoint. Defaults to "xl" (1280px). */
  size?: ContainerSize;
  /** Horizontal padding. Defaults to true. */
  padded?: boolean;
  className?: string;
  as?: React.ElementType;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-screen-2xl",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Container({
  children,
  size = "xl",
  padded = true,
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        sizeClasses[size],
        padded && "px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
