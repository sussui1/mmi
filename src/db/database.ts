import Dexie, { type Table } from "dexie";
import type { UserProfile } from "../types/models";

export class MmiDatabase extends Dexie {
  userProfiles!: Table<UserProfile, string>;

  constructor() {
    super("mmi-phone-database");

    this.version(1).stores({
      userProfiles: "id, updatedAt",
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
