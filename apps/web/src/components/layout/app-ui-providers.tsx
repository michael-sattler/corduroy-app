"use client";

import { AppProgressProvider } from "@/lib/app-progress";
import { ToastProvider } from "@/lib/toast";
import { ToastHost } from "@/components/ui/toast-host";
import type { ReactNode } from "react";

export function AppUiProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppProgressProvider>
        {children}
        <ToastHost />
      </AppProgressProvider>
    </ToastProvider>
  );
}
