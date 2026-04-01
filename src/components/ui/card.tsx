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
        "rounded-xl bg-white",
        bordered && "border border-gray-200",
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

/** Optional header section — renders with a bottom divider. */
function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-b border-gray-100 pb-4 mb-4", className)}>
      {children}
    </div>
  );
}

/** Optional footer section — renders with a top divider. */
function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-t border-gray-100 pt-4 mt-4", className)}>
      {children}
    </div>
  );
}

/** Semantic content wrapper — no extra styling, just a semantic landmark. */
function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn(className)}>{children}</div>;
}

/** Card title — large, bold heading. */
function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}

/** Muted subtitle / description beneath a CardTitle. */
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
