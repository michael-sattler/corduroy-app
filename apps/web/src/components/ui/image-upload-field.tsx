"use client";

import { useEffect, useId, useRef, useState } from "react";
import { withImageCacheBuster } from "@/lib/platform-images-client";

type ImageUploadFieldProps = {
  label: string;
  imagePath: string | null;
  imageVersion: string | null;
  fallbackLabel?: string;
  shape?: "avatar" | "logo";
  disabled?: boolean;
  onUpload: (formData: FormData) => Promise<{ path: string; version: string }>;
};

export function ImageUploadField({
  label,
  imagePath: initialPath,
  imageVersion: initialVersion,
  fallbackLabel = "?",
  shape = "avatar",
  disabled = false,
  onUpload,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePath, setImagePath] = useState(initialPath);
  const [imageVersion, setImageVersion] = useState(initialVersion);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState<number | null>(null);

  useEffect(() => {
    setImagePath(initialPath);
    setImageVersion(initialVersion);
    setCacheBuster(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialPath, initialVersion]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    if (!selectedFile || disabled) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", selectedFile);

    try {
      const result = await onUpload(formData);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setImagePath(result.path);
      setImageVersion(result.version);
      setCacheBuster(Date.now());
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  const storedSrc =
    cacheBuster !== null && imagePath
      ? `${imagePath}?v=${cacheBuster}`
      : withImageCacheBuster(imagePath, imageVersion);
  const displaySrc = previewUrl ?? storedSrc;

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>

      <div
        className={`image-upload-preview image-upload-preview-${shape}${
          displaySrc ? " has-image" : ""
        }`}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt="" />
        ) : (
          <span aria-hidden>{fallbackLabel.slice(0, 1).toUpperCase()}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        className="form-control"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled || uploading}
        onChange={handleFileChange}
      />

      {error ? (
        <div className="form-text text-danger">{error}</div>
      ) : (
        <div className="form-text">JPEG, PNG, WebP, or GIF. Max 2 MB.</div>
      )}

      <button
        type="button"
        className="btn btn-outline-primary btn-sm mt-2"
        disabled={disabled || uploading || !selectedFile}
        onClick={handleUpload}
      >
        {uploading ? "Uploading…" : "Upload image"}
      </button>
    </div>
  );
}
