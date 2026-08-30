const OUTPUT_PROTOCOL = `
请遵守以下输出协议：

1. 只输出角色应该说给 user 听的内容。
2. 线上聊天默认不写动作、环境、心理旁白。
3. 如果当前角色人设允许，可以自然拆成多条消息。
4. 不要为了凑条数切断完整句子。
5. 回复末尾可以附加以下状态块：

<status>
{"affection":0,"mood":"一句话","attire":"一句话","event":""}
</status>

状态块不会显示给 user。
affection 是相对变化值，不是最终值。
如果没有变化请填写 0。
`;

function buildChatMessages({
  char,
  recentMessages = [],
  userText,
  globalSettings
}) {
  const narrative = char.replyStyle?.narrative ||
    globalSettings.narrativeMode ||
    "dialogue";

  const narrativeText = {
    dialogue: "只进行自然对话，不添加动作、环境或心理旁白。",
    light: "可以添加少量动作或神态，但不要大段环境描写。",
    strong: "允许使用较完整的动作、环境和心理描写。"
  }[narrative] || "只进行自然对话。";

  const minMessages = char.replyStyle?.minMessages || 1;
  const maxMessages = char.replyStyle?.maxMessages || 4;

  const system = [
    `你正在扮演 char「${char.name}」。`,
    "你不是客服，也不要解释自己是语言模型。",
    "",
    "【完整角色人设】",
    char.profile || "暂无角色人设。",
    "",
    "【外貌描述】",
    char.appearance || "暂无外貌描述。",
    "",
    "【说话方式】",
    char.speechStyle || "按照角色当前状态自然说话。",
    "",
    "【表达设置】",
    narrativeText,
    `用户要求本次至少 ${minMessages} 条、最多 ${maxMessages} 条消息。`,
    "回复长度主要遵循 char 人设，不要机械凑字。",
    "",
    OUTPUT_PROTOCOL
  ].join("\n");

  const messages = [
    {
      role: "system",
      content: system
    }
  ];

  for (const message of recentMessages) {
    messages.push({
      role: message.senderType === "user" ? "user" : "assistant",
      content: message.content
    });
  }

  messages.push({
    role: "user",
    content: userText
  });

  return {
    messages,
    tokenReport: {
      characterChars: system.length,
      historyChars: recentMessages.reduce(
        (sum, item) => sum + String(item.content).length,
        0
      ),
      userChars: userText.length,
      estimatedTokens: Math.ceil(
        (system.length +
          recentMessages.reduce(
            (sum, item) => sum + String(item.content).length,
            0
          ) +
          userText.length) * 0.6
      )
    }
  };
}

function parseAssistantOutput(rawText) {
  const text = String(rawText || "");

  let visibleText = text;
  let status = null;

  const match = text.match(
    /<status>\s*([\s\S]*?)\s*<\/status>/i
  );

  if (match) {
    try {
      status = JSON.parse(match[1]);
    } catch {
      status = null;
    }

    visibleText = text.replace(match[0], "").trim();
  }

  const parts = visibleText
    .split(/\n{2,}|\n(?=[“"「])/)
    .map(item => item.trim())
    .filter(Boolean);

  return {
    text: visibleText,
    parts: parts.length ? parts : [visibleText],
    status
  };
}

export {
  buildChatMessages,
  parseAssistantOutput
};
