import { useEffect, useState } from "react";
import type { Character } from "../../types/character";
import {
  deleteCharacter,
  listCharacters,
  saveCharacter,
} from "../../db/database";

interface CharactersPageProps {
  onOpenChat?: (character: Character) => void;
}

const EMPTY_CHARACTER: Character = {
  id: "",
  name: "",
  systemPrompt: "",
  greeting: "",
  createdAt: 0,
  updatedAt: 0,
};

export function CharactersPage({
  onOpenChat,
}: CharactersPageProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCharacters() {
    setIsLoading(true);
    setError("");

    try {
      const result = await listCharacters();
      setCharacters(result);
    } catch {
      setError("读取 char 档案失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCharacters();
  }, []);

  function startCreating() {
    setError("");
    setEditing({
      ...EMPTY_CHARACTER,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  function startEditing(character: Character) {
    setError("");
    setEditing({ ...character });
  }

  function closeEditor() {
    if (isSaving) return;
    setEditing(null);
    setError("");
  }

  function updateEditing(
    field: "name" | "systemPrompt" | "greeting",
    value: string,
  ) {
    setEditing((current) => {
      if (!current) return current;
      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSave() {
    if (!editing) return;

    const name = editing.name.trim();

    if (!name) {
      setError("请填写 char 名称");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const saved = await saveCharacter({
        ...editing,
        name,
      });

      setCharacters((current) => {
        const exists = current.some((item) => item.id === saved.id);

        const next = exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];

        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });

      setEditing(null);
    } catch {
      setError("保存 char 失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(character: Character) {
    const confirmed = window.confirm(
      `确定要删除「${character.name}」吗？`,
    );

    if (!confirmed) return;

    try {
      await deleteCharacter(character.id);
      setCharacters((current) =>
        current.filter((item) => item.id !== character.id),
      );

      if (editing?.id === character.id) {
        setEditing(null);
      }
    } catch {
      setError("删除 char 失败");
    }
  }

  if (editing) {
    return (
      <section className="characters-page">
        <div className="character-editor">
          <div className="character-editor-heading">
            <div>
              <span className="profile-kicker">CHARACTER</span>
              <h2>{editing.id ? "编辑 char" : "创建 char"}</h2>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={closeEditor}
              disabled={isSaving}
            >
              取消
            </button>
          </div>

          <label className="character-field">
            <span>名称</span>
            <input
              value={editing.name}
              maxLength={100}
              onChange={(event) =>
                updateEditing("name", event.target.value)
              }
              placeholder="例如：林檎"
              autoFocus
            />
          </label>

          <label className="character-field">
            <span>人设 / System Prompt</span>
            <textarea
              value={editing.systemPrompt}
              rows={10}
              onChange={(event) =>
                updateEditing("systemPrompt", event.target.value)
              }
              placeholder={
                "例如：你是一个温柔但嘴硬的人。请保持角色口吻，不要自称 AI。"
              }
            />
          </label>

          <label className="character-field">
            <span>初始问候</span>
            <textarea
              value={editing.greeting}
              rows={5}
              onChange={(event) =>
                updateEditing("greeting", event.target.value)
              }
              placeholder="创建会话时显示的第一句话，可留空"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "保存中…" : "保存 char"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="characters-page">
      <div className="characters-heading">
        <div>
          <span className="profile-kicker">CHARACTERS</span>
          <h2>char 档案</h2>
        </div>

        <button
          type="button"
          className="primary-button character-add-button"
          onClick={startCreating}
        >
          + 新建
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {isLoading ? (
        <div className="empty-characters">
          <p>读取中…</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="empty-characters">
          <div className="empty-character-icon">✦</div>
          <h3>还没有 char</h3>
          <p>先创建一个角色，再进入聊天。</p>
          <button
            type="button"
            className="primary-button"
            onClick={startCreating}
          >
            创建第一个 char
          </button>
        </div>
      ) : (
        <div className="character-list">
          {characters.map((character) => (
            <article className="character-card" key={character.id}>
              <div className="character-card-main">
                <div className="character-avatar">
                  {character.name.slice(0, 1) || "?"}
                </div>

                <div className="character-card-text">
                  <h3>{character.name}</h3>
                  <p>
                    {character.systemPrompt.trim() ||
                      "还没有填写人设"}
                  </p>
                </div>
              </div>

              <div className="character-card-actions">
                {onOpenChat && (
                  <button
                    type="button"
                    className="small-button small-button-primary"
                    onClick={() => onOpenChat(character)}
                  >
                    聊天
                  </button>
                )}

                <button
                  type="button"
                  className="small-button"
                  onClick={() => startEditing(character)}
                >
                  编辑
                </button>

                <button
                  type="button"
                  className="small-button small-button-danger"
                  onClick={() => void handleDelete(character)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
