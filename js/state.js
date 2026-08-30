export const defaultState = {
  route: "home",

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
    tts: true
  },

  chars: [
    {
      id: "char_shen_che",
      name: "沈澈",
      avatarText: "澈",
      subtitle: "安静、敏感，偶尔会说很长的话",
      mood: "平静",
      affection: 12,
      thoughts:
        "他刚刚看见你上线了，但还在犹豫要不要主动发消息。",
      profile:
        "沈澈不太擅长直接表达情绪。平时说话克制，回复长度由当下心情和事件决定。真正在意的时候，反而会装作若无其事。",
      replyStyle: {
        minMessages: 1,
        maxMessages: 3,
        length: "character",
        narrative: "dialogue"
      },
      proactive: {
        enabled: false,
        mode: "character",
        frequency: "sometimes",
        activeStart: "08:00",
        activeEnd: "23:00"
      }
    }
  ]
};
