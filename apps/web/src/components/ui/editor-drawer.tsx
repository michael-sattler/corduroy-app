"use client";

import { useEffect, useId } from "react";

type EditorDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Drawer width. Accepts any CSS length (e.g. "640px", "40rem") or a number
   * treated as a viewport-width percentage. Defaults to half the viewport.
   */
  width?: string | number;
  footer?: React.ReactNode;
  /** Extra class on the drawer root (e.g. editor-drawer-tasks). */
  className?: string;
};

function resolveWidth(width: string | number | undefined): string {
  if (width === undefined) {
    return "50vw";
  }
  if (typeof width === "number") {
    return `${width}vw`;
  }
  return width;
}

/**
 * Standard sliding editor surface. Enters from the right edge of the viewport,
 * spans the full height, and floats above all other chrome. Intended to be the
 * reusable shell for most staff editing interactions — pass in a title and the
 * editor body as children.
 */
export function EditorDrawer({
  open,
  onClose,
  title,
  eyebrow,
  subtitle,
  children,
  width,
  footer,
  className,
}: EditorDrawerProps) {
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

    document.body.classList.add("editor-drawer-open");
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("editor-drawer-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`editor-drawer-backdrop${open ? " show" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`editor-drawer${open ? " show" : ""}${className ? ` ${className}` : ""}`}
        style={{ width: resolveWidth(width) }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className="editor-drawer-header">
          <div className="min-w-0">
            {eyebrow ? (
              <div className="staff-section-heading text-uppercase small mb-1">
                {eyebrow}
              </div>
            ) : null}
            <h2 className="h5 mb-0 text-truncate" id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className="small text-body-secondary mb-0 mt-1">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-close editor-drawer-close"
            aria-label="Close editor"
            onClick={onClose}
          />
        </div>
        <div className="editor-drawer-body">{children}</div>
        {footer ? <div className="editor-drawer-footer">{footer}</div> : null}
      </aside>
    </>
  );
}
