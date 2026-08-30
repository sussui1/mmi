import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../../types/models";
import { compressAvatar } from "../../services/imageService";

interface UserProfilePageProps {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => Promise<void>;
}

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <linearGradient id="profile-avatar-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7bdcff" />
          <stop offset="1" stopColor="#6c77ef" />
        </linearGradient>
      </defs>

      <circle
        cx="40"
        cy="40"
        r="39"
        fill="url(#profile-avatar-gradient)"
      />

      <circle
        cx="40"
        cy="30"
        r="11"
        fill="none"
        stroke="white"
        strokeWidth="4"
      />

      <path
        d="M20 65c2.8-11 9.5-16 20-16s17.2 5 20 16"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileAvatar({
  blob,
  previewUrl,
}: {
  blob?: Blob;
  previewUrl: string | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  const source = previewUrl ?? imageUrl;

  if (!source) {
    return (
      <div className="profile-avatar">
        <DefaultAvatar />
      </div>
    );
  }

  return (
    <div className="profile-avatar">
      <img
        src={source}
        alt=""
        onError={() => setImageUrl(null)}
      />
    </div>
  );
}

export function UserProfilePage({
  profile,
  onSaved,
}: UserProfilePageProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [tags, setTags] = useState(profile.tags.join("、"));
  const [avatarBlob, setAvatarBlob] = useState<Blob | undefined>(
    profile.avatarBlob,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setTags(profile.tags.join("、"));
    setAvatarBlob(profile.avatarBlob);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    try {
      const compressed = await compressAvatar(file);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setAvatarBlob(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "头像处理失败";

      setError(message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = displayName.trim() || "user";

    const nextProfile: UserProfile = {
      id: "local-user",
      displayName: cleanName,
      bio,
      tags: tags
        .split(/[、,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      avatarBlob,
      updatedAt: Date.now(),
    };

    setIsSaving(true);
    setError("");

    try {
      await onSaved(nextProfile);
    } catch {
      setError("保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="profile-page">
      <form className="profile-form" onSubmit={handleSave}>
        <div className="profile-card profile-card-main">
          <button
            className="profile-avatar-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="更换头像"
          >
            <ProfileAvatar
              blob={avatarBlob}
              previewUrl={previewUrl}
            />

            <span className="avatar-edit-badge">+</span>
          </button>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
          />

          <div className="profile-name-block">
            <span className="profile-kicker">USER MASK</span>
            <strong>{displayName.trim() || "user"}</strong>
            <span>点击头像更换图片</span>
          </div>
        </div>

        <label className="form-field">
          <span>显示名称</span>
          <input
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="user"
          />
        </label>

        <label className="form-field">
          <span>个人简介</span>
          <textarea
            value={bio}
            rows={5}
            onChange={(event) => setBio(event.target.value)}
            placeholder="写下你的资料"
          />
        </label>

        <label className="form-field">
          <span>标签</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="例如：夜猫子、音乐、旅行"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button
          className="primary-button profile-save-button"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "保存中…" : "保存"}
        </button>
      </form>
    </section>
  );
}
