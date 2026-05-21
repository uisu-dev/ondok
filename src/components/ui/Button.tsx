import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-accent-500 text-fg-inverse hover:bg-accent-600 active:bg-accent-700",
  secondary:
    "bg-surface text-fg-strong border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-fg hover:bg-surface-muted",
};

const base =
  "inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 text-base font-semibold rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none";

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps & { children: ReactNode }) {
  return (
    <button className={buttonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
};

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: LinkButtonProps & { children: ReactNode }) {
  return (
    <a className={buttonClass(variant, className)} {...rest}>
      {children}
    </a>
  );
}
