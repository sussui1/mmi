import Dexie, { type Table } from "dexie";
import type { Character } from "../types/character";
import type { UserProfile } from "../types/models";

export class MmiDatabase extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  characters!: Table<Character, string>;

  constructor() {
    super("mmi-phone-database");

    this.version(1).stores({
      userProfiles: "id, updatedAt",
    });

    this.version(2).stores({
      userProfiles: "id, updatedAt",
      characters: "id, name, updatedAt",
    });
  }
}

export const db = new MmiDatabase();

const DEFAULT_USER_PROFILE: UserProfile = {
  id: "local-user",
  displayName: "user",
  bio: "",
  tags: [],
  updatedAt: Date.now(),
};

export async function getUserProfile(): Promise<UserProfile> {
  const existing = await db.userProfiles.get("local-user");

  if (existing) {
    return existing;
  }

  await db.userProfiles.put(DEFAULT_USER_PROFILE);
  return DEFAULT_USER_PROFILE;
}

export async function saveUserProfile(
  profile: UserProfile,
): Promise<UserProfile> {
  const nextProfile: UserProfile = {
    ...profile,
    id: "local-user",
    updatedAt: Date.now(),
  };

  await db.userProfiles.put(nextProfile);
  return nextProfile;
}

export async function listCharacters(): Promise<Character[]> {
  return db.characters.orderBy("updatedAt").reverse().toArray();
}

export async function getCharacter(
  id: string,
): Promise<Character | undefined> {
  return db.characters.get(id);
}

export async function saveCharacter(
  character: Character,
): Promise<Character> {
  const now = Date.now();

  const nextCharacter: Character = {
    ...character,
    id: character.id || crypto.randomUUID(),
    name: character.name.trim(),
    systemPrompt: character.systemPrompt,
    greeting: character.greeting,
    createdAt: character.createdAt || now,
    updatedAt: now,
  };

  await db.characters.put(nextCharacter);
  return nextCharacter;
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}
