export const defaultState = {
  route: "home",

  user: {
    displayName: "",
    avatarDataUrl: "",
    profile: ""
  },

  theme: {
    wallpaper: "crystal-blue",
    glassStrength: 1,
    darkMode: false
  },

  globalSettings: {
    narrativeMode: "dialogue",
    replyPace: "realistic",
    memoryStrength: "balanced",
    proactiveMessages: false,
    voiceInput: true,
    tts: true,
    contextRounds: 20,
    autoSummary: false
  },

  welcomeText: {
    eyebrow: "WELCOME BACK",
    title: "今天也来看看你的世界吧。",
    description: "这里可以放你的 char、记忆、故事和还没有发生的事情。"
  },

  // 正式版默认没有普通 char
  chars: [],

  assistant: {
    enabled: false,
    name: "mmi助手",
    avatarText: "M",
    profile: "负责管理 mmi机、解答使用问题和协助配置接口。",
    mood: "待机",
    affection: 0,
    thoughts: "我还没有被启用。"
  },

  homePage: 0
};
