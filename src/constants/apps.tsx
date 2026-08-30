import type { ReactNode } from "react";

export type RouteName =
  | "home"
  | "messages"
  | "groups"
  | "worldbook"
  | "settings"
  | "profiles"
  | "appearance"
  | "offline"
  | "gallery"
  | "forum"
  | "extras"
  | "tools"
  | "shop"
  | "backup";

export interface AppDefinition {
  id: RouteName;
  label: string;
  subtitle: string;
  color: string;
  icon: ReactNode;
  page: 1 | 2;
}

function AppIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="app-svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const bubble = (
  <AppIcon>
    <path
      d="M9 11.5A6.5 6.5 0 0 1 15.5 5h17A6.5 6.5 0 0 1 39 11.5v12a6.5 6.5 0 0 1-6.5 6.5H22l-8.5 7v-7h-1A6.5 6.5 0 0 1 6 23.5v-12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M15 16h18M15 22h11"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </AppIcon>
);

const book = (
  <AppIcon>
    <path
      d="M9 8.5A4.5 4.5 0 0 1 13.5 4H38v31H13.5A4.5 4.5 0 0 0 9 39.5v-31Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M9 39.5A4.5 4.5 0 0 1 13.5 35H38M16 11h15M16 17h11"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </AppIcon>
);

const user = (
  <AppIcon>
    <circle
      cx="24"
      cy="16"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M10 40c1.7-7.1 6.3-10.5 14-10.5S36.3 32.9 38 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </AppIcon>
);

const gear = (
  <AppIcon>
    <circle
      cx="24"
      cy="24"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="m24 5 2 4.2 4.6 1 3.6-2.1 5.7 5.7-2.1 3.6 1 4.6L43 24l-4.2 2-1 4.6 2.1 3.6-5.7 5.7-3.6-2.1-4.6 1L24 43l-2-4.2-4.6-1-3.6 2.1-5.7-5.7 2.1-3.6-1-4.6L5 24l4.2-2 1-4.6-2.1-3.6 5.7-5.7 3.6 2.1 4.6-1L24 5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </AppIcon>
);

const image = (
  <AppIcon>
    <rect
      x="7"
      y="8"
      width="34"
      height="31"
      rx="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <circle cx="17" cy="18" r="3" fill="currentColor" />
    <path
      d="m10 34 9-9 6 6 5-5 8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </AppIcon>
);

const people = (
  <AppIcon>
    <circle
      cx="18"
      cy="16"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <circle
      cx="33"
      cy="19"
      r="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M7 39c1.5-7 5.2-10 11-10s9.5 3 11 10M29 30c5.2 0 8.7 2.7 10 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </AppIcon>
);

const moon = (
  <AppIcon>
    <path
      d="M36.5 31A14 14 0 0 1 17 11.5 14.5 14.5 0 1 0 36.5 31Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </AppIcon>
);

const apps: AppDefinition[] = [
  {
    id: "messages",
    label: "消息",
    subtitle: "和 char 聊天",
    color: "blue",
    icon: bubble,
    page: 1,
  },
  {
    id: "worldbook",
    label: "世界书",
    subtitle: "保存你的设定",
    color: "violet",
    icon: book,
    page: 1,
  },
  {
    id: "profiles",
    label: "档案",
    subtitle: "管理 char",
    color: "pink",
    icon: user,
    page: 1,
  },
  {
    id: "settings",
    label: "设置",
    subtitle: "系统与 API",
    color: "slate",
    icon: gear,
    page: 1,
  },
  {
    id: "appearance",
    label: "外观",
    subtitle: "调整手机风格",
    color: "cyan",
    icon: image,
    page: 1,
  },
  {
    id: "groups",
    label: "群聊",
    subtitle: "多人对话",
    color: "green",
    icon: people,
    page: 1,
  },
  {
    id: "offline",
    label: "线下",
    subtitle: "面对面互动",
    color: "orange",
    icon: moon,
    page: 1,
  },
  {
    id: "gallery",
    label: "相册",
    subtitle: "保存图片",
    color: "yellow",
    icon: image,
    page: 1,
  },
  {
    id: "forum",
    label: "论坛",
    subtitle: "看看大家在聊什么",
    color: "indigo",
    icon: people,
    page: 2,
  },
  {
    id: "extras",
    label: "番外",
    subtitle: "额外故事",
    color: "rose",
    icon: book,
    page: 2,
  },
  {
    id: "tools",
    label: "工具",
    subtitle: "联网与 MCP",
    color: "teal",
    icon: gear,
    page: 2,
  },
  {
    id: "shop",
    label: "商店",
    subtitle: "商品与钱包",
    color: "amber",
    icon: image,
    page: 2,
  },
  {
    id: "backup",
    label: "备份",
    subtitle: "导入与导出",
    color: "purple",
    icon: book,
    page: 2,
  },
];

export const homeApps = apps;

export const routeTitles: Record<RouteName, string> = {
  home: "mmi机",
  messages: "消息",
  groups: "群聊",
  worldbook: "世界书",
  settings: "设置",
  profiles: "档案",
  appearance: "外观",
  offline: "线下",
  gallery: "相册",
  forum: "论坛",
  extras: "番外",
  tools: "工具",
  shop: "商店",
  backup: "备份",
};
