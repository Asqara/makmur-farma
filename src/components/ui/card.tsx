import type { ComponentPropsWithoutRef } from "react";

import { CARD_CLASS_NAMES } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Props for dashboard card containers.
 */
export type CardProps = ComponentPropsWithoutRef<"article">;

/**
 * Bordered dashboard card container.
 */
export function Card({ className, ...props }: CardProps) {
  return <article className={mc(CARD_CLASS_NAMES.root, className)} {...props} />;
}

/**
 * Props for dashboard card headers.
 */
export type CardHeaderProps = ComponentPropsWithoutRef<"header">;

/**
 * Header area for dashboard cards.
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <header className={mc(CARD_CLASS_NAMES.header, className)} {...props} />
  );
}

/**
 * Props for dashboard card titles.
 */
export type CardTitleProps = ComponentPropsWithoutRef<"h2">;

/**
 * Title text for dashboard cards.
 */
export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h2 className={mc(CARD_CLASS_NAMES.title, className)} {...props} />;
}

/**
 * Props for dashboard card descriptions.
 */
export type CardDescriptionProps = ComponentPropsWithoutRef<"p">;

/**
 * Description text for dashboard cards.
 */
export function CardDescription({
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={mc(CARD_CLASS_NAMES.description, className)} {...props} />
  );
}

/**
 * Props for dashboard card content.
 */
export type CardContentProps = ComponentPropsWithoutRef<"section"> & {
  dense?: boolean;
};

/**
 * Main content area for dashboard cards.
 */
export function CardContent({
  className,
  dense = false,
  ...props
}: CardContentProps) {
  const contentClassName = dense
    ? CARD_CLASS_NAMES.denseContent
    : CARD_CLASS_NAMES.content;

  return <section className={mc(contentClassName, className)} {...props} />;
}

/**
 * Props for dashboard card footers.
 */
export type CardFooterProps = ComponentPropsWithoutRef<"footer">;

/**
 * Footer area for dashboard card actions.
 */
export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <footer className={mc(CARD_CLASS_NAMES.footer, className)} {...props} />
  );
}
