import type { ComponentPropsWithoutRef } from "react";

import { APP_NAME } from "@/constants/app";
import { LOGO_ASSETS } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Logo variants available for app surfaces.
 */
export type BrandLogoVariant = keyof typeof LOGO_ASSETS;

/**
 * Props for the SmartStock Pro logo.
 */
export type BrandLogoProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "alt" | "loading" | "src"
> & {
  alt?: string;
  variant?: BrandLogoVariant;
};

/**
 * SmartStock Pro logo using public assets.
 */
export function BrandLogo({
  alt,
  className,
  variant = "horizontal",
  ...props
}: BrandLogoProps) {
  const logoClassName =
    variant === "compact" ? "h-8 w-auto" : "h-9 w-auto max-w-44";
  const altText = alt ?? (variant === "compact" ? `${APP_NAME} logo` : APP_NAME);

  return (
    <img
      alt={altText}
      className={mc(logoClassName, className)}
      loading="lazy"
      src={LOGO_ASSETS[variant]}
      {...props}
    />
  );
}
