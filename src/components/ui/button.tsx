import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button */
  loading?: boolean;
  /** Stretches to 100% width */
  fullWidth?: boolean;
}

// ─── Variant maps ─────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-emerald-600 text-white",
    "hover:bg-emerald-700 active:bg-emerald-800",
    "focus-visible:ring-emerald-500",
    "disabled:bg-emerald-300",
  ].join(" "),

  secondary: [
    "bg-gray-100 text-gray-800",
    "hover:bg-gray-200 active:bg-gray-300",
    "focus-visible:ring-gray-400",
    "disabled:bg-gray-50 disabled:text-gray-400",
  ].join(" "),

  outline: [
    "border border-emerald-600 text-emerald-700 bg-transparent",
    "hover:bg-emerald-50 active:bg-emerald-100",
    "focus-visible:ring-emerald-500",
    "disabled:border-emerald-200 disabled:text-emerald-300",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        // Base
        "inline-flex items-center justify-center rounded-md font-semibold",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        // Variant + size
        variantClasses[variant],
        sizeClasses[size],
        // Modifiers
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

Button.displayName = "Button";
export { Button };
