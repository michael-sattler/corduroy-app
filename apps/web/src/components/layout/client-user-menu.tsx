"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { UserAccountFields } from "@/components/management/user-account-fields";
import { SlidePanel } from "@/components/ui/slide-panel";

type ClientUserMenuProps = {
  displayName: string;
  email: string;
};

export function ClientUserMenu({ displayName, email }: ClientUserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <>
      <div className="logged-in-user client-user-menu ms-auto" ref={menuRef}>
        <button
          type="button"
          className="client-user-menu-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="client-user-avatar" aria-hidden>
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="client-user-name">{displayName}</span>
          <span className="client-user-chevron" aria-hidden>
            ▾
          </span>
        </button>

        {menuOpen ? (
          <div className="client-user-dropdown" role="menu">
            <button
              type="button"
              className="client-user-dropdown-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setAccountOpen(true);
              }}
            >
              Account
            </button>
            <button
              type="button"
              className="client-user-dropdown-item"
              role="menuitem"
              disabled
            >
              Preferences
            </button>
            <hr className="dropdown-divider my-1" />
            <form action={signOut.bind(null, "client")}>
              <button type="submit" className="client-user-dropdown-item" role="menuitem">
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <SlidePanel
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Your account"
        subtitle={email}
        size="md"
      >
        <UserAccountFields displayName={displayName} email={email} />
        <div className="slide-panel-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setAccountOpen(false)}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-primary">
            Save changes
          </button>
        </div>
      </SlidePanel>
    </>
  );
}
