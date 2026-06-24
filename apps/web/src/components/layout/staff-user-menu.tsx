"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { UserAccountFields } from "@/components/management/user-account-fields";
import { SlidePanel } from "@/components/ui/slide-panel";

type StaffUserMenuProps = {
  displayName: string;
  email: string;
  role: string;
};

export function StaffUserMenu({ displayName, email, role }: StaffUserMenuProps) {
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
      <div className="logged-in-user staff-user-menu ms-auto" ref={menuRef}>
        <button
          type="button"
          className="staff-user-menu-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="staff-user-avatar" aria-hidden>
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="staff-user-menu-text">
            <span className="staff-user-name">{displayName}</span>
            <span className="staff-user-role text-capitalize">{role}</span>
          </span>
          <span className="staff-user-chevron" aria-hidden>
            ▾
          </span>
        </button>

        {menuOpen ? (
          <div className="staff-user-dropdown" role="menu">
            <button
              type="button"
              className="staff-user-dropdown-item"
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
              className="staff-user-dropdown-item"
              role="menuitem"
              disabled
            >
              Preferences
            </button>
            <hr className="dropdown-divider my-1" />
            <form action={signOut.bind(null, "staff")}>
              <button type="submit" className="staff-user-dropdown-item" role="menuitem">
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
        <UserAccountFields
          surface="staff"
          displayName={displayName}
          email={email}
        />
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
