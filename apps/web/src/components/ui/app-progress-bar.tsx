"use client";

import { useAppProgress } from "@/lib/app-progress";

export function AppProgressBar() {
  const { active } = useAppProgress();

  if (!active) {
    return null;
  }

  return (
    <div className="app-topbar-progress" role="progressbar" aria-label="Working">
      <div className="app-topbar-progress-indeterminate" />
    </div>
  );
}
