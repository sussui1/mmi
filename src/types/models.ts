export interface UserProfile {
  id: "local-user";
  displayName: string;
  bio: string;
  tags: string[];
  avatarBlob?: Blob;
  updatedAt: number;
}
