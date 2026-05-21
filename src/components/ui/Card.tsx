import { HTMLAttributes, ElementType } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType;
  interactive?: boolean;
};

export function Card({
  as: Tag = "div",
  interactive = false,
  className = "",
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`bg-surface rounded-card shadow-card ${
        interactive ? "transition-shadow hover:shadow-card-hover" : ""
      } ${className}`}
      {...rest}
    />
  );
}
