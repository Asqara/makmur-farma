import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { STEPPER_STATUS_LABELS } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Import step state.
 */
export type ImportStepStatus = keyof typeof STEPPER_STATUS_LABELS;

/**
 * Single import flow step.
 */
export type ImportStep = {
  description?: string;
  status: ImportStepStatus;
  title: string;
};

/**
 * Props for import steppers.
 */
export type ImportStepperProps = ComponentPropsWithoutRef<"ol"> & {
  steps: ImportStep[];
};

function getStepIcon(status: ImportStepStatus) {
  if (status === "completed") {
    return <CheckCircle2 aria-hidden="true" className="size-4" />;
  }

  if (status === "error") {
    return <AlertCircle aria-hidden="true" className="size-4" />;
  }

  return <Circle aria-hidden="true" className="size-4" />;
}

/**
 * Stepper for the sensitive import flow: upload, preview, validation, execution, and result.
 */
export function ImportStepper({
  className,
  steps,
  ...props
}: ImportStepperProps) {
  return (
    <ol
      className={mc(
        "grid gap-3 rounded-xl border border-border-default bg-card-surface p-4 md:grid-cols-3 xl:grid-cols-6",
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const iconNode = getStepIcon(step.status);
        const isActive = step.status === "current";
        const itemClassName = mc(
          "grid gap-2 rounded-lg border border-transparent p-3",
          isActive && "border-info-border bg-info-bg",
          step.status === "error" && "border-danger-border bg-danger-bg",
        );

        let descriptionNode: ReactNode = null;

        if (step.description) {
          descriptionNode = (
            <p className="ts-xs text-text-muted">{step.description}</p>
          );
        }

        return (
          <li className={itemClassName} key={step.title}>
            <header className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted-surface text-text-muted">
                {iconNode}
              </span>
              <span className="ts-xs text-text-muted">
                {index + 1}. {STEPPER_STATUS_LABELS[step.status]}
              </span>
            </header>
            <strong className="ts-sm text-text-strong">{step.title}</strong>
            {descriptionNode}
          </li>
        );
      })}
    </ol>
  );
}
