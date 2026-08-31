export interface Character {
  id: string;
  name: string;
  avatarUrl?: string;
  systemPrompt: string;
  greeting: string;
  createdAt: number;
  updatedAt: number;
}
