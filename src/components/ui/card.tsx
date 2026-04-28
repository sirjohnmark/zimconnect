import { cn } from "@/lib/utils";

export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardShadow = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
  shadow?: CardShadow;
  bordered?: boolean;
  hoverable?: boolean;
  as?: React.ElementType;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

const shadowClasses: Record<CardShadow, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

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
        bordered && "border border-border-base",
        shadowClasses[shadow],
        paddingClasses[padding],
        hoverable && "cursor-pointer transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("mb-5 border-b border-border-base pb-4", className)}>
      {children}
    </div>
  );
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn("mt-5 border-t border-border-base pt-4", className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className }: CardSectionProps) {
  return <div className={className}>{children}</div>;
}

function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn("text-base font-semibold text-near-black", className)}>
      {children}
    </h3>
  );
}

function CardDescription({ children, className }: CardSectionProps) {
  return <p className={cn("mt-1 text-sm text-gray-500", className)}>{children}</p>;
}

Card.Header = CardHeader;
Card.Footer = CardFooter;
Card.Content = CardContent;
Card.Title = CardTitle;
Card.Description = CardDescription;