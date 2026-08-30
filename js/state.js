export const defaultState = {
  route: "home",
  homePage: 0,

  theme: {
    wallpaper: "crystal-blue",
    glassStrength: 1,
    darkMode: false
  },

  globalSettings: {
    narrativeMode: "dialogue",
    replyPace: "realistic",
    memoryStrength: "balanced",

    // 主动来信默认关闭
    proactiveMessages: false,

    voiceInput: true,
    tts: true,

    // 最近消息上下文轮数
    contextRounds: 20,

    // 总结开关
    autoSummary: false
  },

  // 欢迎卡片可由用户自行修改
  welcomeText: {
    eyebrow: "WELCOME BACK",
    title: "今天也来看看你的世界吧。",
    description: "这里可以放你的 char、记忆、故事和还没有发生的事情。"
  },

  // 正式启动时为空，不内置普通 char
  chars: [],

  // mmi助手不是默认 char。
  // 用户在设置页开启后才创建。
  assistant: {
    enabled: false,
    name: "mmi助手",
    avatarText: "M",
    profile: "负责管理 mmi机、解答使用问题和协助配置接口。",
    mood: "待机",
    affection: 0,
    thoughts: "我还没有被启用。"
  },

  // 用户自定义桌面顺序
  desktopOrder: [
    "messages",
    "worldbook",
    "characters",
    "settings",
    "appearance",
    "group",
    "offline",
    "gallery",
    "forum",
    "fan-extra",
    "tools",
    "shop",
    "backup"
  ]
};
