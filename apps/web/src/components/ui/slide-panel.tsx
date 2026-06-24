"use client";

import { useEffect, useId } from "react";

type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizeClass = {
  md: "slide-panel-md",
  lg: "slide-panel-lg",
  xl: "slide-panel-xl",
};

export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
}: SlidePanelProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("slide-panel-open");
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("slide-panel-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`slide-panel-backdrop${open ? " show" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`slide-panel ${sizeClass[size]}${open ? " show" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className="slide-panel-header">
          <div className="min-w-0">
            <h2 className="h5 mb-0" id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className="small text-body-secondary mb-0 mt-1">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close panel"
            onClick={onClose}
          />
        </div>
        <div className="slide-panel-body">{children}</div>
      </aside>
    </>
  );
}
