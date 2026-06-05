"use client";

import { cva, type VariantProps } from "class-variance-authority";
import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import {
  BUTTON_SIZE_CLASS_NAMES,
  BUTTON_VARIANT_CLASS_NAMES,
} from "@/constants/design";
import { mc } from "@/utils/mc";

const buttonClassNames = cva(
  "ts-sm inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card-surface disabled:pointer-events-none disabled:opacity-60 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: BUTTON_SIZE_CLASS_NAMES,
      variant: BUTTON_VARIANT_CLASS_NAMES,
    },
  },
);

type ButtonContentProps = {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

function ButtonContent({ children, leftIcon, rightIcon }: ButtonContentProps) {
  let leftIconNode: ReactNode = null;

  if (leftIcon) {
    leftIconNode = (
      <span aria-hidden="true" className="inline-flex shrink-0">
        {leftIcon}
      </span>
    );
  }

  let rightIconNode: ReactNode = null;

  if (rightIcon) {
    rightIconNode = (
      <span aria-hidden="true" className="inline-flex shrink-0">
        {rightIcon}
      </span>
    );
  }

  return (
    <>
      {leftIconNode}
      {children}
      {rightIconNode}
    </>
  );
}

/**
 * Props for SmartStock Pro button actions.
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonClassNames> & {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

/**
 * Dashboard action button with primary, secondary, danger, and ghost variants.
 */
export function Button({
  children,
  className,
  leftIcon,
  rightIcon,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={mc(buttonClassNames({ size, variant }), className)}
      type={type}
      {...props}
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </button>
  );
}

/**
 * Props for internal SmartStock Pro button links.
 */
export type ButtonLinkProps = Omit<LinkProps, "href"> &
  VariantProps<typeof buttonClassNames> & {
    children: ReactNode;
    className?: string;
    href: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

/**
 * Internal link styled like a dashboard button.
 */
export function ButtonLink({
  children,
  className,
  href,
  leftIcon,
  rightIcon,
  size,
  variant,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={mc(buttonClassNames({ size, variant }), className)}
      href={href}
      {...props}
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </Link>
  );
}

/**
 * Props for external SmartStock Pro button links.
 */
export type ButtonExternalLinkProps =
  AnchorHTMLAttributes<HTMLAnchorElement> &
    VariantProps<typeof buttonClassNames> & {
      leftIcon?: ReactNode;
      rightIcon?: ReactNode;
    };

/**
 * External link styled like a dashboard button.
 */
export function ButtonExternalLink({
  children,
  className,
  leftIcon,
  rel = "noreferrer",
  rightIcon,
  size,
  target = "_blank",
  variant,
  ...props
}: ButtonExternalLinkProps) {
  return (
    <a
      className={mc(buttonClassNames({ size, variant }), className)}
      rel={rel}
      target={target}
      {...props}
    >
      <ButtonContent leftIcon={leftIcon} rightIcon={rightIcon}>
        {children}
      </ButtonContent>
    </a>
  );
}
