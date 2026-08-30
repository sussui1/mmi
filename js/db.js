const db = new Dexie("mmi机Database");

db.version(2).stores({
  settings: "key",

  chars: "id, createdAt, updatedAt",

  sessions: "id, charId, updatedAt",

  // sessionId 必须有索引，供分页查询使用
  messages: "++id, sessionId, createdAt, senderType",

  thoughts: "++id, charId, createdAt",

  worldbookEntries: "++id, enabled, updatedAt",

  apiPresets: "id, kind, updatedAt",

  images: "++id, createdAt",

  fanExtras: "++id, createdAt",

  events: "++id, charId, createdAt"
});

const TABLE_REGISTRY = [
  { name: "settings", label: "界面设置", order: 1, export: true },
  { name: "chars", label: "角色档案", order: 2, export: true },
  { name: "sessions", label: "会话", order: 3, export: true },
  { name: "messages", label: "消息", order: 4, export: true },
  { name: "thoughts", label: "心声", order: 5, export: true },
  { name: "worldbookEntries", label: "世界书", order: 6, export: true },
  { name: "apiPresets", label: "API 预设", order: 7, export: true },
  { name: "images", label: "图片", order: 8, export: true },
  { name: "fanExtras", label: "番外", order: 9, export: true },
  { name: "events", label: "事件流", order: 10, export: true }
];

async function seedDatabase(defaultState) {
  const welcome = await db.settings.get("welcomeText");

  if (!welcome) {
    await db.settings.put({
      key: "welcomeText",
      value: defaultState.welcomeText
    });
  }

  const globalSettings = await db.settings.get("globalSettings");

  if (!globalSettings) {
    await db.settings.put({
      key: "globalSettings",
      value: defaultState.globalSettings
    });
  }

  const desktopOrder = await db.settings.get("desktopOrder");

  if (!desktopOrder) {
    await db.settings.put({
      key: "desktopOrder",
      value: defaultState.desktopOrder
    });
  }

  const assistant = await db.settings.get("assistant");

  if (!assistant) {
    await db.settings.put({
      key: "assistant",
      value: defaultState.assistant
    });
  }

  // 这里没有 bulkAdd 默认 char。
  // 用户创建或导入后才写入 chars 表。
}

async function getSetting(key, fallback = null) {
  const record = await db.settings.get(key);
  return record?.value ?? fallback;
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

async function deleteCharacter(id) {
  await db.transaction(
    "rw",
    [db.chars, db.sessions, db.messages, db.thoughts],
    async () => {
      await db.chars.delete(id);

      const sessions = await db.sessions
        .where("charId")
        .equals(id)
        .toArray();

      for (const session of sessions) {
        await db.messages
          .where("sessionId")
          .equals(session.id)
          .delete();
      }

      await db.sessions.where("charId").equals(id).delete();
      await db.thoughts.where("charId").equals(id).delete();
    }
  );
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
 * 首次只查最近 50 条。
 * 禁止整表读取后再 slice。
 */
async function getMessagePage(sessionId, offset = 0, limit = 50) {
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

async function getApiPresets() {
  return db.apiPresets.orderBy("updatedAt").reverse().toArray();
}

async function getApiPresetByKind(kind) {
  return db.apiPresets
    .where("kind")
    .equals(kind)
    .first();
}

export {
  db,
  TABLE_REGISTRY,
  seedDatabase,
  getSetting,
  saveSetting,
  getCharacters,
  createCharacter,
  deleteCharacter,
  getOrCreateSession,
  getMessagePage,
  addMessage,
  saveApiPreset,
  getApiPresets,
  getApiPresetByKind
};
