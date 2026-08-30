import { useEffect, useState } from "react";

interface TopBarProps {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  onOpenProfile: () => void;
  avatarUrl: string | null;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m15 5-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 18h2M9 15h2M13 12h2M17 9h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="7"
        width="16"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M21 10v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path d="M6 10h8v4H6Z" fill="currentColor" />
    </svg>
  );
}

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="top-avatar-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#75d9ff" />
          <stop offset="1" stopColor="#6e75ff" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill="url(#top-avatar-gradient)" />

      <circle
        cx="24"
        cy="19"
        r="7"
        fill="none"
        stroke="white"
        strokeWidth="3"
      />

      <path
        d="M12 38c2-7 6-10 12-10s10 3 12 10"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  if (!avatarUrl || failed) {
    return <DefaultAvatar />;
  }

  return (
    <img
      src={avatarUrl}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

export function TopBar({
  title,
  canGoBack,
  onBack,
  onOpenProfile,
  avatarUrl,
}: TopBarProps) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <header className="top-area">
      <div className="status-bar">
        <span>{time}</span>

        <div className="status-icons">
          <SignalIcon />
          <span className="status-wifi">●</span>
          <BatteryIcon />
        </div>
      </div>

      <div className="top-bar">
        <button
          className={`icon-button back-button ${canGoBack ? "" : "is-hidden"}`}
          type="button"
          aria-label="返回"
          onClick={onBack}
          disabled={!canGoBack}
        >
          <BackIcon />
        </button>

        <h1>{title}</h1>

        <button
          className="avatar-button"
          type="button"
          aria-label="打开 user 面具"
          onClick={onOpenProfile}
        >
          <UserAvatar avatarUrl={avatarUrl} />
        </button>
      </div>
    </header>
  );
}
