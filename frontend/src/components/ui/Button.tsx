
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
  "transition-all duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: 'bg-brand-red text-white hover:bg-brand-dark',
  secondary: 'border border-line bg-card text-fg hover:bg-hover',
  ghost: 'text-fg-muted hover:bg-hover hover:text-fg',
  danger:'border border-danger-line bg-card text-danger hover:bg-danger-bg' 
}

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

type Options = {
  variant?: Variant;
  size?: Size;
};

export function buttonStyles({
  variant = "primary",
  size = "md",
}: Options = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  Options & {
    loading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
  };

export default function Button({
  variant,
  size,
  loading = false,
  loadingText,
  fullWidth = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${buttonStyles({ variant, size })} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      )}

      {loading && loadingText ? loadingText : children}
    </button>
  );
}
