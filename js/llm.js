function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function getChatUrl(preset) {
  const base = normalizeBaseUrl(preset.baseUrl);

  if (base.endsWith("/chat/completions")) {
    return base;
  }

  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }

  return `${base}/v1/chat/completions`;
}

async function* streamOpenAICompatible(preset, messages, options = {}) {
  if (!preset?.baseUrl || !preset?.apiKey || !preset?.model) {
    throw new Error("未配置聊天 API");
  }

  const response = await fetch(getChatUrl(preset), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${preset.apiKey}`
    },
    body: JSON.stringify({
      model: preset.model,
      messages,
      temperature: Number(
        options.temperature ?? preset.temperature ?? 0.8
      ),
      max_tokens: Number(
        options.maxTokens ?? preset.maxTokens ?? 2048
      ),
      stream: true
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `API 请求失败 ${response.status}: ${detail.slice(0, 300)}`
    );
  }

  if (!response.body) {
    throw new Error("API 没有返回可读取的数据流");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (let line of lines) {
      line = line.trim();

      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();

      if (data === "[DONE]") return;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;

        if (delta) {
          yield {
            text: delta
          };
        }
      } catch {
        // 流式分片不完整时等待下一段，不中断
      }
    }
  }
}

async function collectChat(preset, messages, options = {}, onDelta) {
  let fullText = "";

  for await (const delta of streamOpenAICompatible(
    preset,
    messages,
    options
  )) {
    fullText += delta.text;

    if (onDelta) {
      onDelta(delta.text, fullText);
    }
  }

  return fullText;
}

export {
  streamOpenAICompatible,
  collectChat
};
