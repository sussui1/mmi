import type { RouteName } from "../constants/apps";

interface BottomDockProps {
  activeRoute: RouteName;
  onNavigate: (route: RouteName) => void;
}

function DockIcon({ type }: { type: "message" | "group" | "book" | "gear" }) {
  if (type === "message") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h-.5A2.5 2.5 0 0 1 3 12.5v-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "group") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="9"
          cy="8"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="17"
          cy="10"
          r="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M3 20c.8-4 2.8-6 6-6s5.2 2 6 6M15 15c3 0 5 1.6 6 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "book") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 4h14v16H7a2 2 0 0 0-2 2V4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M5 20h14M9 8h6M9 12h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m12 2 1.2 2.5 2.4.7 2.3-1.3 2.2 2.2-1.3 2.3.7 2.4L22 12l-2.5 1.2-.7 2.4 1.3 2.3-2.2 2.2-2.3-1.3-2.4.7L12 22l-1.2-2.5-2.4-.7-2.3 1.3-2.2-2.2 1.3-2.3-.7-2.4L2 12l2.5-1.2.7-2.4-1.3-2.3 2.2-2.2 2.3 1.3 2.4-.7L12 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottomDock({ activeRoute, onNavigate }: BottomDockProps) {
  const items: Array<{
    route: RouteName;
    label: string;
    icon: "message" | "group" | "book" | "gear";
  }> = [
    { route: "messages", label: "消息", icon: "message" },
    { route: "groups", label: "群聊", icon: "group" },
    { route: "worldbook", label: "世界书", icon: "book" },
    { route: "settings", label: "设置", icon: "gear" },
  ];

  return (
    <nav className="bottom-dock" aria-label="底部导航">
      {items.map((item) => {
        const active = activeRoute === item.route;

        return (
          <button
            key={item.route}
            type="button"
            className={`dock-item ${active ? "is-active" : ""}`}
            onClick={() => onNavigate(item.route)}
          >
            <span className="dock-icon">
              <DockIcon type={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
