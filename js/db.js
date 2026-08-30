const db = new Dexie("mmi机Database");

db.version(1).stores({
  settings: "key",
  chars: "id",
  messages: "++id, conversationId, createdAt",
  thoughts: "++id, charId, createdAt",
  worldbookEntries: "++id, enabled, updatedAt",
  images: "++id, createdAt",
  fanExtras: "++id, createdAt",
  events: "++id, charId, createdAt"
});

export async function seedDatabase(defaultState) {
  const existingCharCount = await db.chars.count();

  if (existingCharCount === 0) {
    await db.chars.bulkAdd(defaultState.chars);
  }

  const savedTheme = await db.settings.get("theme");
  if (!savedTheme) {
    await db.settings.put({
      key: "theme",
      value: defaultState.theme
    });
  }

  const savedGlobal = await db.settings.get("globalSettings");
  if (!savedGlobal) {
    await db.settings.put({
      key: "globalSettings",
      value: defaultState.globalSettings
    });
  }
}

export async function getCharacters() {
  return db.chars.toArray();
}

export async function getSetting(key, fallback) {
  const value = await db.settings.get(key);
  return value?.value ?? fallback;
}

export async function saveSetting(key, value) {
  return db.settings.put({ key, value });
}

export async function saveThought(charId, text) {
  return db.thoughts.add({
    charId,
    text,
    createdAt: Date.now()
  });
}

export { db };
