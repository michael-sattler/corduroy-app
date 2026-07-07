"use client";

import { useToast, type ToastVariant } from "@/lib/toast";

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: "app-toast-success",
  danger: "app-toast-danger",
  warning: "app-toast-warning",
  info: "app-toast-info",
};

export function ToastHost() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="app-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast ${VARIANT_CLASS[toast.variant]}`}
          role="status"
        >
          <span className="app-toast-message">{toast.message}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            aria-label="Dismiss"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
