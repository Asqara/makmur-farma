"use client";

import { AlertTriangle, Check, Info, X } from "lucide-react";
import reactToast, { type Toast, type ToastOptions } from "react-hot-toast";

import { mc } from "@/utils/mc";

type ToastType = "success" | "error" | "warning" | "info";

type ToastMessageProps = {
    t: Toast;
    type: ToastType;
    message: string;
};

const toastStyles: Record<
    ToastType,
    {
        container: string;
        iconBg: string;
        iconColor: string;
        textColor: string;
        closeColor: string;
    }
> = {
    success: {
        container: "border-success-border bg-success-bg text-success",
        iconBg: "bg-success",
        iconColor: "text-text-inverse",
        textColor: "text-success",
        closeColor: "text-success/60 hover:text-success",
    },
    error: {
        container: "border-danger-border bg-danger-bg text-danger",
        iconBg: "bg-danger",
        iconColor: "text-text-inverse",
        textColor: "text-danger",
        closeColor: "text-danger/60 hover:text-danger",
    },
    warning: {
        container: "border-warning-border bg-warning-bg text-warning",
        iconBg: "bg-warning",
        iconColor: "text-text-inverse",
        textColor: "text-warning",
        closeColor: "text-warning/60 hover:text-warning",
    },
    info: {
        container: "border-info-border bg-info-bg text-info",
        iconBg: "bg-info",
        iconColor: "text-text-inverse",
        textColor: "text-info",
        closeColor: "text-info/60 hover:text-info",
    },
};

const iconMap = {
    success: Check,
    error: X,
    warning: AlertTriangle,
    info: Info,
};

function ToastMessage({ t, type, message }: ToastMessageProps) {
    const styles = toastStyles[type];
    const IconComponent = iconMap[type];

    return (
        <div
            className={mc(
                "pointer-events-auto flex w-full max-w-lg items-center justify-between overflow-hidden rounded-xl border px-4 py-2 shadow-sm transition-all duration-500 ease-in-out",
                styles.container,
                t.visible ? "animate-enter" : "animate-leave",
            )}
        >
            <div className="flex min-w-0 items-center justify-center gap-2">
                <div className="shrink-0">
                    <div
                        className={mc(
                            "flex h-6 w-6 items-center justify-center rounded-full",
                            styles.iconBg,
                        )}
                    >
                        <IconComponent
                            className={mc("h-4 w-4", styles.iconColor)}
                            strokeWidth={3}
                        />
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <p className={mc("ts-sm font-medium", styles.textColor)}>
                        {message}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => reactToast.dismiss(t.id)}
                className={mc(
                    "ml-3 inline-flex shrink-0 rounded-md bg-transparent transition duration-200 focus:outline-none",
                    styles.closeColor,
                )}
                aria-label="Tutup notifikasi"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function showToast(type: ToastType, message: string, options?: ToastOptions) {
    reactToast.custom((t) => <ToastMessage t={t} type={type} message={message} />, {
        duration: type === "success" ? 2000 : 4000,
        ...options,
    });
}

/**
 * Toast helpers for status notifications.
 */
export const toast = {
    success: (message: string, options?: ToastOptions) => showToast("success", message, options),
    error: (message: string, options?: ToastOptions) => showToast("error", message, options),
    warning: (message: string, options?: ToastOptions) => showToast("warning", message, options),
    info: (message: string, options?: ToastOptions) => showToast("info", message, options),
};
