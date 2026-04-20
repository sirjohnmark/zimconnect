import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Shown below the input in red — also sets aria-invalid */
  error?: string;
  /** Subtle hint shown below the input when there is no error */
  hint?: string;
  /** Optional icon/element rendered on the left inside the input */
  leftAddon?: React.ReactNode;
  /** Optional icon/element rendered on the right inside the input */
  rightAddon?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftAddon, rightAddon, className, id: externalId, ...props },
  ref,
) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-near-black"
        >
          {label}
          {props.required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {leftAddon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-gray-400">
            {leftAddon}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={
            [hasError && errorId, !hasError && hint && hintId]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-near-black",
            "placeholder:text-gray-400",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            !hasError && "border-border-base focus:border-apple-blue focus:ring-apple-blue/20",
            hasError && "border-red-400 focus:border-red-500 focus:ring-red-400/20",
            "disabled:cursor-not-allowed disabled:bg-light-gray disabled:text-gray-400",
            leftAddon && "pl-9",
            rightAddon && "pr-9",
            className,
          )}
          {...props}
        />

        {rightAddon && (
          <div className="pointer-events-none absolute right-3 flex items-center text-gray-400">
            {rightAddon}
          </div>
        )}
      </div>

      {hasError && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-red-600">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
          {error}
        </p>
      )}

      {!hasError && hint && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export { Input };
