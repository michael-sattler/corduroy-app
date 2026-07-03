"use client";

import { useEffect, useId, useRef, useState } from "react";
import { resizeImageToMaxHeight } from "@/lib/resize-image";
import { withImageCacheBuster } from "@/lib/platform-images-client";

type UserAvatarEditorProps = {
  displayName: string;
  avatarPath: string | null;
  avatarVersion: string | null;
  onUpload: (formData: FormData) => Promise<{ path: string; version: string }>;
  onUploaded?: (result: { path: string; version: string }) => void;
};

export function UserAvatarEditor({
  displayName,
  avatarPath: initialPath,
  avatarVersion: initialVersion,
  onUpload,
  onUploaded,
}: UserAvatarEditorProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPath, setAvatarPath] = useState(initialPath);
  const [avatarVersion, setAvatarVersion] = useState(initialVersion);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cacheBuster, setCacheBuster] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAvatarPath(initialPath);
    setAvatarVersion(initialVersion);
  }, [initialPath, initialVersion]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const resized = await resizeImageToMaxHeight(selectedFile);
      const formData = new FormData();
      formData.set("file", resized);
      const result = await onUpload(formData);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setAvatarPath(result.path);
      setAvatarVersion(result.version);
      setCacheBuster(Date.now());
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploaded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload avatar");
    } finally {
      setUploading(false);
    }
  }

  const storedSrc =
    cacheBuster !== null && avatarPath
      ? `${avatarPath}?v=${cacheBuster}`
      : withImageCacheBuster(avatarPath, avatarVersion);
  const displaySrc = previewUrl ?? storedSrc;
  const initial = displayName.slice(0, 1).toUpperCase() || "?";

  return (
    <div className="user-avatar-editor text-center mb-4">
      <div className="user-avatar-editor-circle user-avatar-preview mx-auto">
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt="" />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
        <button
          type="button"
          className="user-avatar-edit-btn"
          onClick={openFilePicker}
          disabled={uploading}
          aria-label="Change avatar"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        className="visually-hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={uploading}
        onChange={handleFileChange}
      />

      {selectedFile ? (
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      ) : null}

      {error ? (
        <div className="form-text text-danger mt-2">{error}</div>
      ) : (
        <div className="form-text mt-2">
          JPEG, PNG, WebP, or GIF. Resized to 512px height on upload.
        </div>
      )}
    </div>
  );
}
