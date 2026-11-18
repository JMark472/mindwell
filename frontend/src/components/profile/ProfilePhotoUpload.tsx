import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { useAuth } from "@/context/AuthContext";
import { updateMyProfile, uploadAvatar } from "@/api/auth";
import { errorMessage } from "@/api/client";

function getInitials(name?: string | null) {
  if (!name) return "MW";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:") || avatarUrl.startsWith("blob:")) {
    return avatarUrl;
  }
  let base = ((import.meta as any).env?.VITE_EXPRESS_API_URL || "http://localhost:3000").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const hostIsLocalPage = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const baseIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
    if (!hostIsLocalPage && baseIsLocalhost) {
      base = base.replace(/localhost|127\.0\.0\.1/i, window.location.hostname);
    }
  }
  return `${base}${avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`}`;
}

interface ProfilePhotoUploadProps {
  size?: "sm" | "md" | "lg";
  showActions?: boolean;
  onChange?: (avatarUrl: string | null) => void;
}

export default function ProfilePhotoUpload({
  size = "lg",
  showActions = true,
  onChange,
}: ProfilePhotoUploadProps) {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-28 w-28",
  };

  const currentAvatar = preview || user?.avatarUrl || null;
  const resolvedUrl = resolveAvatarUrl(currentAvatar);

  useEffect(() => {
    setPreviewFailed(false);
  }, [resolvedUrl]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, WebP, or GIF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewFailed(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      setError("Could not preview this photo. Please try another file.");
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadAvatar(selectedFile);
      setUser(result.user);
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChange?.(result.avatarUrl);
    } catch (err) {
      setError(errorMessage(err, "Could not upload photo."));
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemove() {
    setUploading(true);
    setError(null);
    try {
      const result = await updateMyProfile({ avatarUrl: null });
      setUser(result.user);
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChange?.(null);
    } catch (err) {
      setError(errorMessage(err, "Could not remove photo."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {resolvedUrl && !previewFailed ? (
          <img
            src={resolvedUrl}
            alt={user?.fullName || "Profile"}
            className={`${sizeClasses[size]} rounded-full object-cover ring-4 ring-white shadow-card`}
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-teal to-mint text-white ring-4 ring-white shadow-card`}
          >
            <span className={size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"}>
              {getInitials(user?.fullName)}
            </span>
          </div>
        )}
        {showActions ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-600 shadow-card ring-1 ring-line/70 transition-colors hover:bg-navy-050 disabled:opacity-50"
            aria-label="Change profile photo"
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {selectedFile ? (
        <p className="max-w-[240px] truncate text-xs text-ink-400" title={selectedFile.name}>
          Selected: {selectedFile.name}
        </p>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {selectedFile && preview ? (
            <>
              <Button size="sm" onClick={() => void handleUpload()} disabled={uploading}>
                <Upload aria-hidden="true" className="h-4 w-4" />
                {uploading ? "Uploading…" : "Save Photo"}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancel} disabled={uploading}>
                <X aria-hidden="true" className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Camera aria-hidden="true" className="h-4 w-4" />
                {user?.avatarUrl || preview ? "Change Photo" : "Upload Photo"}
              </Button>
              {(user?.avatarUrl || preview) && !selectedFile ? (
                <Button size="sm" variant="ghost" onClick={() => void handleRemove()} disabled={uploading}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
    </div>
  );
}
