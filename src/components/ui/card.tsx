import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardShadow = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Inner padding. Defaults to "md". */
  padding?: CardPadding;
  /** Drop shadow depth. Defaults to "sm". */
  shadow?: CardShadow;
  /** Shows a subtle border. Defaults to true. */
  bordered?: boolean;
  /** Makes the card visually interactive (hover lift). */
  hoverable?: boolean;
  as?: React.ElementType;
}

// ─── Sub-component types ──────────────────────────────────────────────────────

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const shadowClasses: Record<CardShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  padding = "md",
  shadow = "sm",
  bordered = true,
  hoverable = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg bg-white",
        bordered && "border border-border-base",
        shadowClasses[shadow],
        paddingClasses[padding],
        hoverable && "transition-shadow duration-200 hover:shadow-md cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-b border-border-base pb-4 mb-4", className)}>
      {children}
    </div>
  );
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-t border-border-base pt-4 mt-4", className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn(className)}>{children}</div>;
}

function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn("text-base font-semibold text-near-black", className)}>
      {children}
    </h3>
  );
}

function CardDescription({ children, className }: CardSectionProps) {
  return (
    <p className={cn("mt-0.5 text-sm text-gray-500", className)}>
      {children}
    </p>
  );
}

Card.Header = CardHeader;
Card.Footer = CardFooter;
Card.Content = CardContent;
Card.Title = CardTitle;
Card.Description = CardDescription;
