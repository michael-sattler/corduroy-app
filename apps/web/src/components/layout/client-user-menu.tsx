"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  updateMyClientProfileAction,
  uploadMyClientAvatarAction,
} from "@/app/actions/profile";
import { signOut } from "@/app/actions/auth";
import {
  USER_ACCOUNT_FORM_ID,
  UserAccountFields,
} from "@/components/management/user-account-fields";
import { MenuAvatar } from "@/components/ui/menu-avatar";
import { SlidePanel } from "@/components/ui/slide-panel";

type ClientUserMenuProps = {
  displayName: string;
  email: string;
  avatarPath: string | null;
  avatarVersion: string | null;
};

export function ClientUserMenu({
  displayName: initialDisplayName,
  email: initialEmail,
  avatarPath: initialAvatarPath,
  avatarVersion: initialAvatarVersion,
}: ClientUserMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState(initialEmail);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarVersion, setAvatarVersion] = useState(initialAvatarVersion);
  const [cacheBuster, setCacheBuster] = useState<number | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountPending, startAccountTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setEmail(initialEmail);
    setAvatarPath(initialAvatarPath);
    setAvatarVersion(initialAvatarVersion);
  }, [initialDisplayName, initialEmail, initialAvatarPath, initialAvatarVersion]);

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

  function handleAccountSave(form: HTMLFormElement) {
    const formData = new FormData(form);

    setAccountError(null);
    startAccountTransition(async () => {
      try {
        const updated = await updateMyClientProfileAction({
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
        });
        setDisplayName(updated.displayName);
        setEmail(updated.email);
        setAccountOpen(false);
        router.refresh();
      } catch (err) {
        setAccountError(
          err instanceof Error ? err.message : "Could not save account",
        );
      }
    });
  }

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
          <MenuAvatar
            displayName={displayName}
            avatarPath={avatarPath}
            avatarVersion={avatarVersion}
            cacheBuster={cacheBuster}
            className="client-user-avatar"
          />
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
                setAccountError(null);
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
        <UserAccountFields
          displayName={displayName}
          email={email}
          avatarPath={avatarPath}
          avatarVersion={avatarVersion}
          error={accountError}
          pending={accountPending}
          onAvatarUpload={uploadMyClientAvatarAction}
          onAvatarUploaded={handleAvatarUploaded}
          onSave={handleAccountSave}
        />
        <div className="slide-panel-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setAccountOpen(false)}
            disabled={accountPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={USER_ACCOUNT_FORM_ID}
            className="btn btn-primary"
            disabled={accountPending}
          >
            {accountPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </SlidePanel>
    </>
  );
}
