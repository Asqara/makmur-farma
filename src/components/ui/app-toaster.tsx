"use client";

import { Toaster } from "react-hot-toast";

/**
 * Root toast viewport styled for SmartStock Pro feedback.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
    />
  );
}
