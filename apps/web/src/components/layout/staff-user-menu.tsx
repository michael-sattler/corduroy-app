"use client";

import { useEffect, useRef, useState } from "react";
import { uploadMyStaffAvatarAction } from "@/app/actions/profile";
import { signOut } from "@/app/actions/auth";
import { UserAccountFields } from "@/components/management/user-account-fields";
import { MenuAvatar } from "@/components/ui/menu-avatar";
import { SlidePanel } from "@/components/ui/slide-panel";

type StaffUserMenuProps = {
  displayName: string;
  email: string;
  role: string;
  avatarPath: string | null;
  avatarVersion: string | null;
};

export function StaffUserMenu({
  displayName,
  email,
  role,
  avatarPath: initialAvatarPath,
  avatarVersion: initialAvatarVersion,
}: StaffUserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarVersion, setAvatarVersion] = useState(initialAvatarVersion);
  const [cacheBuster, setCacheBuster] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarPath(initialAvatarPath);
    setAvatarVersion(initialAvatarVersion);
  }, [initialAvatarPath, initialAvatarVersion]);

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

  function handleAvatarUploaded(result: { path: string; version: string }) {
    setAvatarPath(result.path);
    setAvatarVersion(result.version);
    setCacheBuster(Date.now());
  }

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
          <MenuAvatar
            displayName={displayName}
            avatarPath={avatarPath}
            avatarVersion={avatarVersion}
            cacheBuster={cacheBuster}
            className="staff-user-avatar"
          />
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
          avatarPath={avatarPath}
          avatarVersion={avatarVersion}
          onAvatarUpload={uploadMyStaffAvatarAction}
          onAvatarUploaded={handleAvatarUploaded}
        />
        <div className="slide-panel-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setAccountOpen(false)}
          >
            Close
          </button>
        </div>
      </SlidePanel>
    </>
  );
}
