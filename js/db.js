const db = new Dexie("mmi机Database");

db.version(3).stores({
  settings: "key",

  chars: "id, createdAt, updatedAt",

  sessions: "id, charId, updatedAt",

  messages: "++id, sessionId, createdAt, senderType",

  thoughts: "++id, charId, createdAt",

  worldbookEntries: "++id, enabled, updatedAt",

  apiPresets: "id, kind, updatedAt",

  images: "++id, createdAt",

  fanExtras: "++id, createdAt",

  events: "++id, charId, createdAt"
});

async function seedDatabase(defaultState) {
  const initialValues = [
    ["user", defaultState.user],
    ["theme", defaultState.theme],
    ["globalSettings", defaultState.globalSettings],
    ["welcomeText", defaultState.welcomeText],
    ["assistant", defaultState.assistant]
  ];

  for (const [key, value] of initialValues) {
    const exists = await db.settings.get(key);

    if (!exists) {
      await db.settings.put({ key, value });
    }
  }

  // 注意：这里故意没有写入默认 char
}

async function getSetting(key, fallback = null) {
  const value = await db.settings.get(key);
  return value?.value ?? fallback;
}

async function saveSetting(key, value) {
  return db.settings.put({ key, value });
}

async function getCharacters() {
  return db.chars.orderBy("createdAt").toArray();
}

async function createCharacter(data) {
  const now = Date.now();

  const char = {
    id: data.id || crypto.randomUUID(),
    name: data.name || "未命名 char",
    avatarText: data.avatarText || "?",
    avatarDataUrl: data.avatarDataUrl || "",
    subtitle: data.subtitle || "",
    profile: data.profile || "",
    appearance: data.appearance || "",
    speechStyle: data.speechStyle || "",
    thoughts: data.thoughts || "暂无心声记录。",
    mood: data.mood || "平静",
    affection: Number(data.affection || 0),

    replyStyle: {
      minMessages: 1,
      maxMessages: 4,
      length: "character",
      narrative: "dialogue",
      ...(data.replyStyle || {})
    },

    proactive: {
      enabled: false,
      mode: "character",
      frequency: "sometimes",
      ...(data.proactive || {})
    },

    createdAt: data.createdAt || now,
    updatedAt: now
  };

  await db.chars.put(char);
  return char;
}

async function getWorldbookEntries() {
  return db.worldbookEntries
    .orderBy("updatedAt")
    .reverse()
    .toArray();
}

async function saveWorldbookEntry(entry) {
  const record = {
    id: entry.id || crypto.randomUUID(),
    title: entry.title || "未命名条目",
    content: entry.content || "",
    keywords: entry.keywords || [],
    enabled: entry.enabled !== false,
    constant: Boolean(entry.constant),
    depth: Number(entry.depth || 0),
    updatedAt: Date.now()
  };

  await db.worldbookEntries.put(record);
  return record;
}

async function getApiPresets() {
  return db.apiPresets
    .orderBy("updatedAt")
    .reverse()
    .toArray();
}

async function saveApiPreset(preset) {
  const record = {
    id: preset.id || crypto.randomUUID(),
    name: preset.name || "未命名 API",
    kind: preset.kind || "chat",
    protocol: preset.protocol || "openai-compatible",
    baseUrl: preset.baseUrl || "",
    apiKey: preset.apiKey || "",
    model: preset.model || "",
    temperature: Number(preset.temperature ?? 0.8),
    maxTokens: Number(preset.maxTokens ?? 2048),
    updatedAt: Date.now()
  };

  await db.apiPresets.put(record);
  return record;
}

async function getOrCreateSession(charId) {
  let session = await db.sessions
    .where("charId")
    .equals(charId)
    .first();

  if (!session) {
    session = {
      id: crypto.randomUUID(),
      charId,
      updatedAt: Date.now()
    };

    await db.sessions.put(session);
  }

  return session;
}

/**
 * 消息分页：
 * 首屏只加载最近 50 条，不把整个会话一次性读进内存。
 */
async function getMessagePage(
  sessionId,
  offset = 0,
  limit = 50
) {
  return db.messages
    .where("sessionId")
    .equals(sessionId)
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

async function addMessage(message) {
  const record = {
    sessionId: message.sessionId,
    senderType: message.senderType,
    senderId: message.senderId || null,
    content: message.content,
    contentType: message.contentType || "text",
    createdAt: message.createdAt || Date.now()
  };

  const id = await db.messages.add(record);

  await db.sessions.update(message.sessionId, {
    updatedAt: Date.now()
  });

  return { ...record, id };
}

export {
  db,
  seedDatabase,
  getSetting,
  saveSetting,
  getCharacters,
  createCharacter,
  getWorldbookEntries,
  saveWorldbookEntry,
  getApiPresets,
  saveApiPreset,
  getOrCreateSession,
  getMessagePage,
  addMessage
};
