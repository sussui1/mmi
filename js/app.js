import { defaultState } from "./state.js";

import {
  seedDatabase,
  getSetting,
  saveSetting,
  getCharacters,
  createCharacter,
  getOrCreateSession,
  getMessagePage,
  addMessage,
  getApiPresets,
  saveApiPreset
} from "./db.js";

import {
  buildChatMessages,
  parseAssistantOutput
} from "./prompt.js";

import { collectChat } from "./llm.js";

const app = {
  state: structuredClone(defaultState),
  chars: [],
  apiPresets: [],
  viewport: document.querySelector("#appViewport"),
  title: document.querySelector("#pageTitle"),
  backButton: document.querySelector("#backButton"),
  modal: document.querySelector("#charModal"),
  routeStack: [],
  editingDesktop: false,
  touchDrag: null
};

const appInfo = {
  messages: { icon: "◌", label: "消息", page: 0 },
  worldbook: { icon: "✧", label: "世界书", page: 0 },
  characters: { icon: "♢", label: "档案", page: 0 },
  settings: { icon: "⚙", label: "设置", page: 0 },
  appearance: { icon: "◈", label: "外观", page: 0 },

  // 按照用户要求：群聊和相册换位
  group: { icon: "◎", label: "群聊", page: 0 },
  offline: { icon: "⌁", label: "线下", page: 0 },
  gallery: { icon: "▧", label: "相册", page: 0 },

  forum: { icon: "☷", label: "论坛", page: 1 },
  "fan-extra": { icon: "✦", label: "番外", page: 1 },
  tools: { icon: "◇", label: "工具", page: 1 },
  shop: { icon: "♧", label: "商店", page: 1 },
  backup: { icon: "↥", label: "备份", page: 1 }
};

async function init() {
  await seedDatabase(defaultState);

  app.state.welcomeText = await getSetting(
    "welcomeText",
    defaultState.welcomeText
  );

  app.state.globalSettings = await getSetting(
    "globalSettings",
    defaultState.globalSettings
  );

  app.state.desktopOrder = await getSetting(
    "desktopOrder",
    defaultState.desktopOrder
  );

  app.state.assistant = await getSetting(
    "assistant",
    defaultState.assistant
  );

  app.chars = await getCharacters();
  app.apiPresets = await getApiPresets();

  bindGlobalEvents();
  updateClock();
  setInterval(updateClock, 30_000);

  renderRoute("home", false);
}

function bindGlobalEvents() {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        renderRoute(button.dataset.route);
      });
    });

  app.backButton.addEventListener("click", goBack);

  document
    .querySelector("#closeCharModal")
    .addEventListener("click", closeCharModal);

  app.modal.addEventListener("click", event => {
    if (event.target === app.modal) {
      closeCharModal();
    }
  });

  document
    .querySelector("#openCharChat")
    .addEventListener("click", () => {
      const charId = app.modal.dataset.charId;
      closeCharModal();
      openChat(charId);
    });

  document
    .querySelector("#openCharProfile")
    .addEventListener("click", () => {
      closeCharModal();
      renderRoute("characters");
    });

  window.addEventListener("popstate", () => {
    if (app.routeStack.length > 1) {
      app.routeStack.pop();
      renderRoute(app.routeStack.at(-1), false);
    }
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  updateNetworkStatus();
}

function updateClock() {
  const now = new Date();

  document.querySelector("#statusTime").textContent =
    now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
}

function updateNetworkStatus() {
  const element = document.querySelector("#networkStatus");

  if (!element) return;

  element.textContent = navigator.onLine ? "●" : "○";
  element.title = navigator.onLine ? "已联网" : "离线";
}

function setTitle(title) {
  app.title.textContent = title;
}

function renderRoute(route, push = true) {
  if (push) {
    if (app.routeStack.at(-1) !== route) {
      app.routeStack.push(route);
    }

    history.pushState({ route }, "", `#${route}`);
  } else if (!app.routeStack.length) {
    app.routeStack.push(route);
  }

  const renderers = {
    home: renderHome,
    messages: renderMessages,
    gallery: renderGallery,
    settings: renderSettings,
    worldbook: () => renderPlaceholder(
      "世界书",
      "WORLD BOOK",
      "管理常驻设定和关键词触发条目。"
    ),
    characters: renderCharacters,
    appearance: renderAppearance,
    offline: () => renderPlaceholder(
      "线下",
      "OFFLINE",
      "创建面对面场景和叙事互动。"
    ),
    group: () => renderPlaceholder(
      "群聊",
      "GROUP CHAT",
      "让多个 char 进入同一会话。"
    ),
    forum: () => renderPlaceholder(
      "论坛",
      "FORUM",
      "角色和 NPC 在这里发帖、评论与互动。"
    ),
    "fan-extra": () => renderPlaceholder(
      "番外",
      "EXTRA STORIES",
      "选择人物、事件、记忆、视角和文风生成番外。"
    ),
    tools: renderTools,
    shop: () => renderPlaceholder(
      "商店",
      "SHOP",
      "礼物、订单、钱包和关系事件。"
    ),
    backup: () => renderPlaceholder(
      "备份",
      "DATA",
      "导入酒馆卡、世界书和分片备份。"
    )
  };

  const render = renderers[route] || renderHome;
  render();

  updateBackButton();
}

function goBack() {
  if (app.routeStack.length <= 1) {
    renderRoute("home");
    return;
  }

  app.routeStack.pop();
  history.back();
}

function updateBackButton() {
  app.backButton.classList.toggle(
    "hidden",
    app.routeStack.length <= 1 || app.state.route === "home"
  );
}

function setRouteState(route) {
  app.state.route = route;

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.route === route
    );
  });
}

function renderHome() {
  setRouteState("home");
  setTitle("mmi机");

  const order = app.state.desktopOrder
    .map(id => ({ id, ...appInfo[id] }))
    .filter(item => item.label);

  const pageItems = order.filter(
    item => item.page === app.state.homePage
  );

  const frequentlyUsed = pageItems.filter(item => item.page === 0);
  const rarelyUsed = pageItems.filter(item => item.page === 1);

  app.viewport.innerHTML = `
    <section class="welcome-card glass-card">
      <p
        class="eyebrow editable-text"
        contenteditable="true"
        data-welcome-key="eyebrow"
      >${escapeHtml(app.state.welcomeText.eyebrow)}</p>

      <h2
        class="editable-text"
        contenteditable="true"
        data-welcome-key="title"
      >${escapeHtml(app.state.welcomeText.title)}</h2>

      <p
        class="editable-text"
        contenteditable="true"
        data-welcome-key="description"
      >${escapeHtml(app.state.welcomeText.description)}</p>

      <button class="edit-card-button" id="saveWelcomeText">
        保存文字
      </button>
    </section>

    <div class="page-indicator">
      <button class="page-arrow" id="previousPage">‹</button>
      <span>${app.state.homePage + 1} / 2</span>
      <button class="page-arrow" id="nextPage">›</button>
    </div>

    <div class="section-heading">
      <h3>
        ${app.state.homePage === 0 ? "常用应用" : "更多功能"}
      </h3>

      <button class="text-button" id="toggleArrange">
        ${app.editingDesktop ? "完成" : "整理"}
      </button>
    </div>

    <div class="app-grid ${app.editingDesktop ? "arranging" : ""}">
      ${pageItems.map(renderAppItem).join("")}
    </div>

    ${
      app.state.homePage === 0
        ? renderIncomingMessages()
        : ""
    }

    ${
      app.state.homePage === 0
        ? renderCharactersPreview()
        : ""
    }
  `;

  bindHomeEvents();
}

function renderAppItem(item) {
  return `
    <button
      class="app-item"
      data-open-app="${item.id}"
      data-app-id="${item.id}"
      draggable="${app.editingDesktop}"
      aria-label="${item.label}"
    >
      <span class="app-icon">${item.icon}</span>
      <span class="app-label">${item.label}</span>
    </button>
  `;
}

function renderIncomingMessages() {
  const incoming = app.chars.filter(
    char => char.proactive?.enabled
  );

  if (!incoming.length) return "";

  return `
    <div class="section-heading incoming-heading">
      <h3>来自 char 的消息</h3>
      <span>主动来信由你控制</span>
    </div>

    <div class="incoming-list">
      ${incoming.map(char => `
        <button
          class="incoming-card glass-card"
          data-char-id="${char.id}"
        >
          <span class="char-avatar">
            ${escapeHtml(char.avatarText)}
          </span>

          <span class="char-main">
            <h3>${escapeHtml(char.name)}</h3>
            <p>${escapeHtml(
              char.latestIncoming || "有一条新的消息。"
            )}</p>
          </span>

          <span class="char-arrow">›</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderCharactersPreview() {
  if (!app.chars.length && !app.state.assistant.enabled) {
    return `
      <section class="empty-home-card glass-card">
        <span class="empty-icon">♢</span>
        <p>还没有 char</p>
        <button class="capsule-button primary" id="createFirstChar">
          创建 char
        </button>
      </section>
    `;
  }

  return `
    <div class="section-heading">
      <h3>我的 char</h3>
      <span>点击头像查看心声</span>
    </div>

    <div class="char-preview-list">
      ${app.chars.map(renderCharCard).join("")}
      ${app.state.assistant.enabled
        ? renderAssistantCard()
        : ""}
    </div>
  `;
}

function renderAssistantCard() {
  const assistant = app.state.assistant;

  return `
    <button class="char-card glass-card" data-assistant-card>
      <span class="char-avatar">${assistant.avatarText}</span>
      <span class="char-main">
        <h3>${escapeHtml(assistant.name)}</h3>
        <p>${escapeHtml(assistant.thoughts)}</p>
      </span>
      <span class="char-arrow">›</span>
    </button>
  `;
}

function renderCharCard(char) {
  return `
    <button class="char-card glass-card" data-char-id="${char.id}">
      <span class="char-avatar">${escapeHtml(char.avatarText)}</span>
      <span class="char-main">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.thoughts || "暂无心声记录。")}</p>
      </span>
      <span class="char-arrow">›</span>
    </button>
  `;
}

function bindHomeEvents() {
  document
    .querySelector("#previousPage")
    .addEventListener("click", () => {
      app.state.homePage = 0;
      renderHome();
    });

  document
    .querySelector("#nextPage")
    .addEventListener("click", () => {
      app.state.homePage = 1;
      renderHome();
    });

  document
    .querySelector("#toggleArrange")
    .addEventListener("click", () => {
      app.editingDesktop = !app.editingDesktop;
      renderHome();
    });

  document
    .querySelector("#saveWelcomeText")
    .addEventListener("click", saveWelcomeText);

  document
    .querySelector("#createFirstChar")
    ?.addEventListener("click", () => {
      renderRoute("characters");
    });

  document
    .querySelectorAll("[data-open-app]")
    .forEach(button => {
      button.addEventListener("click", () => {
        if (app.editingDesktop) return;
        renderRoute(button.dataset.openApp);
      });
    });

  document
    .querySelectorAll("[data-char-id]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const char = app.chars.find(
          item => item.id === button.dataset.charId
        );

        if (char) openCharModal(char);
      });
    });

  document
    .querySelector("[data-assistant-card]")
    ?.addEventListener("click", () => {
      openAssistantModal();
    });

  bindDragEvents();
}

async function saveWelcomeText() {
  const next = { ...app.state.welcomeText };

  document
    .querySelectorAll("[data-welcome-key]")
    .forEach(element => {
      next[element.dataset.welcomeKey] =
        element.textContent.trim();
    });

  app.state.welcomeText = next;
  await saveSetting("welcomeText", next);

  const button = document.querySelector("#saveWelcomeText");
  button.textContent = "已保存";

  setTimeout(() => {
    if (button) button.textContent = "保存文字";
  }, 1200);
}

function bindDragEvents() {
  const items = document.querySelectorAll("[data-app-id]");

  items.forEach(item => {
    item.addEventListener("dragstart", event => {
      event.dataTransfer.setData(
        "text/plain",
        item.dataset.appId
      );
    });

    item.addEventListener("dragover", event => {
      if (app.editingDesktop) event.preventDefault();
    });

    item.addEventListener("drop", async event => {
      event.preventDefault();

      const sourceId =
        event.dataTransfer.getData("text/plain");

      const targetId = item.dataset.appId;

      if (!sourceId || sourceId === targetId) return;

      const order = [...app.state.desktopOrder];
      const sourceIndex = order.indexOf(sourceId);
      const targetIndex = order.indexOf(targetId);

      if (sourceIndex < 0 || targetIndex < 0) return;

      order.splice(sourceIndex, 1);
      order.splice(targetIndex, 0, sourceId);

      // 页码归属仍由 appInfo 控制
      app.state.desktopOrder = order;
      await saveSetting("desktopOrder", order);

      renderHome();
    });
  });
}

function renderMessages() {
  setRouteState("messages");
  setTitle("消息");

  if (!app.chars.length) {
    app.viewport.innerHTML = `
      <section class="empty-state glass-card">
        <div class="empty-icon">◌</div>
        <p>还没有会话</p>
        <button class="capsule-button primary" id="goCreateChar">
          创建 char
        </button>
      </section>
    `;

    document
      .querySelector("#goCreateChar")
      .addEventListener("click", () => {
        renderRoute("characters");
      });

    return;
  }

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">MESSAGES</p>
      <h2>消息</h2>
      <p class="muted-text">
        选择一个 char 开始聊天。
      </p>
    </section>

    <div class="char-preview-list">
      ${app.chars.map(renderCharCard).join("")}
    </div>
  `;

  bindCharCards();
}

function bindCharCards() {
  document
    .querySelectorAll("[data-char-id]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const char = app.chars.find(
          item => item.id === button.dataset.charId
        );

        if (char) openCharModal(char);
      });
    });
}

function openCharModal(char) {
  app.modal.dataset.charId = char.id;

  document.querySelector("#modalCharAvatar").textContent =
    char.avatarText;

  document.querySelector("#modalCharName").textContent =
    char.name;

  document.querySelector("#modalCharSubtitle").textContent =
    char.subtitle || "你的 char";

  document.querySelector("#modalMood").textContent =
    char.mood || "未知";

  document.querySelector("#modalAffection").textContent =
    char.affection ?? 0;

  document.querySelector("#modalThoughts").textContent =
    char.thoughts || "暂无心声记录。";

  app.modal.classList.remove("hidden");
}

function openAssistantModal() {
  const assistant = app.state.assistant;

  app.modal.dataset.charId = "";

  document.querySelector("#modalCharAvatar").textContent =
    assistant.avatarText;

  document.querySelector("#modalCharName").textContent =
    assistant.name;

  document.querySelector("#modalCharSubtitle").textContent =
    "mmi机本地助手";

  document.querySelector("#modalMood").textContent =
    assistant.mood;

  document.querySelector("#modalAffection").textContent =
    assistant.affection;

  document.querySelector("#modalThoughts").textContent =
    assistant.thoughts;

  app.modal.classList.remove("hidden");
}

function closeCharModal() {
  app.modal.classList.add("hidden");
}

async function openChat(charId) {
  const char = app.chars.find(item => item.id === charId);

  if (!char) return;

  renderRoute("chat", true);

  setTitle(char.name);

  const session = await getOrCreateSession(char.id);
  const messages = await getMessagePage(session.id, 0, 50);

  app.viewport.innerHTML = `
    <section class="chat-page">
      <div class="chat-top-card glass-card">
        <button class="chat-avatar-button" id="chatCharAvatar">
          ${escapeHtml(char.avatarText)}
        </button>

        <div>
          <p class="eyebrow">CHAT</p>
          <h2>${escapeHtml(char.name)}</h2>
          <span class="muted-text">
            ${escapeHtml(char.subtitle || "")}
          </span>
        </div>
      </div>

      <div class="message-list" id="messageList">
        ${
          messages.reverse().map(renderMessage).join("")
          || `<p class="empty-chat">还没有消息</p>`
        }
      </div>

      <form class="chat-composer" id="chatComposer">
        <textarea
          id="chatInput"
          rows="1"
          placeholder="输入消息"
          required
        ></textarea>

        <button class="send-button" type="submit">↑</button>
      </form>
    </section>
  `;

  document
    .querySelector("#chatCharAvatar")
    .addEventListener("click", () => {
      openCharModal(char);
    });

  document
    .querySelector("#chatComposer")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const input = document.querySelector("#chatInput");
      const text = input.value.trim();

      if (!text) return;

      input.value = "";
      await sendChatMessage(char, session, text);
    });
}

function renderMessage(message) {
  const own = message.senderType === "user";

  return `
    <div class="message-row ${own ? "own" : "other"}">
      <div class="message-bubble">
        ${escapeHtml(message.content)}
      </div>
    </div>
  `;
}

async function sendChatMessage(char, session, userText) {
  const list = document.querySelector("#messageList");

  const userMessage = await addMessage({
    sessionId: session.id,
    senderType: "user",
    senderId: "user",
    content: userText
  });

  list.insertAdjacentHTML(
    "beforeend",
    renderMessage(userMessage)
  );

  const typing = document.createElement("p");
  typing.className = "typing-indicator";
  typing.textContent = "正在输入……";
  list.append(typing);

  const recent = await getMessagePage(
    session.id,
    0,
    app.state.globalSettings.contextRounds * 2
  );

  const preset =
    app.apiPresets.find(item => item.kind === "chat")
    || app.apiPresets[0];

  if (!preset) {
    typing.remove();

    showInlineError(
      "未配置聊天 API",
      "去设置",
      () => renderRoute("settings")
    );

    return;
  }

  const built = buildChatMessages({
    char,
    recentMessages: recent.reverse(),
    userText,
    globalSettings: app.state.globalSettings
  });

  try {
    let streamed = "";

    const reply = await collectChat(
      preset,
      built.messages,
      {},
      (_delta, fullText) => {
        streamed = fullText;
        typing.textContent = streamed || "正在输入……";
      }
    );

    typing.remove();

    const parsed = parseAssistantOutput(reply);

    for (const part of parsed.parts) {
      const assistantMessage = await addMessage({
        sessionId: session.id,
        senderType: "char",
        senderId: char.id,
        content: part
      });

      list.insertAdjacentHTML(
        "beforeend",
        renderMessage(assistantMessage)
      );

      await wait(180 + Math.random() * 360);
    }

    if (parsed.status) {
      await applyStatus(char, parsed.status);
    }

    list.scrollTop = list.scrollHeight;
  } catch (error) {
    typing.remove();

    showInlineError(
      error.message,
      "去设置",
      () => renderRoute("settings")
    );
  }
}

async function applyStatus(char, status) {
  const index = app.chars.findIndex(
    item => item.id === char.id
  );

  if (index < 0) return;

  const current = app.chars[index];

  current.affection = Math.max(
    0,
    Math.min(
      100,
      Number(current.affection || 0) +
        Number(status.affection || 0)
    )
  );

  if (status.mood) current.mood = status.mood;
  if (status.attire) current.attire = status.attire;
  if (status.event) current.latestEvent = status.event;

  current.thoughts =
    status.thoughts ||
    current.thoughts ||
    "暂无心声记录。";

  current.updatedAt = Date.now();

  await createCharacter(current);
  app.chars = await getCharacters();
}

function renderCharacters() {
  setRouteState("characters");
  setTitle("档案");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">CHAR ARCHIVE</p>
      <h2>档案</h2>
      <p class="muted-text">
        这里不会预置普通 char。
      </p>

      <div class="button-row">
        <button class="capsule-button primary" id="createCharButton">
          ＋ 创建 char
        </button>

        <button class="capsule-button secondary" id="importCharButton">
          导入酒馆卡
        </button>
      </div>

      <input
        id="charFileInput"
        type="file"
        accept=".json,.png,.txt"
        hidden
      >
    </section>

    ${
      app.chars.length
        ? app.chars.map(renderProfileCard).join("")
        : `
          <section class="empty-state">
            <div class="empty-icon">♢</div>
            <p>还没有 char</p>
          </section>
        `
    }
  `;

  document
    .querySelector("#createCharButton")
    .addEventListener("click", showCreateCharForm);

  document
    .querySelector("#importCharButton")
    .addEventListener("click", () => {
      document.querySelector("#charFileInput").click();
    });

  document
    .querySelector("#charFileInput")
    .addEventListener("change", importCharFile);

  document
    .querySelectorAll("[data-profile-char]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const char = app.chars.find(
          item => item.id === button.dataset.profileChar
        );

        if (char) openCharModal(char);
      });
    });
}

function renderProfileCard(char) {
  return `
    <button
      class="char-card glass-card"
      data-profile-char="${char.id}"
    >
      <span class="char-avatar">${escapeHtml(char.avatarText)}</span>

      <span class="char-main">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.profile || "暂无人设")}</p>
      </span>

      <span class="char-arrow">›</span>
    </button>
  `;
}

function showCreateCharForm() {
  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">NEW CHAR</p>
      <h2>创建 char</h2>

      <form class="form-list" id="charForm">
        <label>
          名称
          <input name="name" placeholder="例如：某某" required>
        </label>

        <label>
          头像文字
          <input name="avatarText" maxlength="2" placeholder="可填一个字">
        </label>

        <label>
          简介
          <input name="subtitle" placeholder="一句话介绍">
        </label>

        <label>
          完整人设
          <textarea
            name="profile"
            rows="8"
            placeholder="完整输入，不会自动截断"
          ></textarea>
        </label>

        <label>
          外貌描述
          <textarea name="appearance" rows="4"></textarea>
        </label>

        <label>
          说话方式
          <textarea name="speechStyle" rows="4"></textarea>
        </label>

        <label>
          最少输出条数
          <input
            name="minMessages"
            type="number"
            min="1"
            max="20"
            value="1"
          >
        </label>

        <label>
          最多输出条数
          <input
            name="maxMessages"
            type="number"
            min="1"
            max="20"
            value="4"
          >
        </label>

        <label>
          线上叙事
          <select name="narrative">
            <option value="dialogue">纯对话</option>
            <option value="light">对话 + 轻动作</option>
            <option value="strong">强叙事</option>
          </select>
        </label>

        <button class="capsule-button primary" type="submit">
          保存 char
        </button>
      </form>
    </section>
  `;

  document
    .querySelector("#charForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      await createCharacter({
        name: form.get("name"),
        avatarText: form.get("avatarText"),
        subtitle: form.get("subtitle"),
        profile: form.get("profile"),
        appearance: form.get("appearance"),
        speechStyle: form.get("speechStyle"),

        replyStyle: {
          minMessages: Number(form.get("minMessages")),
          maxMessages: Number(form.get("maxMessages")),
          length: "character",
          narrative: form.get("narrative")
        }
      });

      app.chars = await getCharacters();
      renderCharacters();
    });
}

async function importCharFile(event) {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const imported = await parseCharacterFile(file);

    const confirmed = confirm(
      `导入角色「${imported.name || "未命名 char"}」？`
    );

    if (!confirmed) return;

    await createCharacter(imported);
    app.chars = await getCharacters();
    renderCharacters();
  } catch (error) {
    showInlineError(error.message, "返回档案", renderCharacters);
  }
}

async function parseCharacterFile(file) {
  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (extension === "json") {
    const text = await file.text();
    const data = JSON.parse(text);

    const card = data.data || data;

    return {
      name: card.name || card.char_name || "未命名 char",
      avatarText: String(
        card.name || "?"
      ).slice(0, 1),
      subtitle: card.description
        ? String(card.description).slice(0, 80)
        : "",
      profile: [
        card.description,
        card.personality,
        card.scenario,
        card.first_mes,
        card.mes_example
      ]
        .filter(Boolean)
        .join("\n\n"),
      appearance: card.appearance || "",
      speechStyle: card.style || card.system_prompt || ""
    };
  }

  if (extension === "txt") {
    const text = await readTextWithFallback(file);

    return {
      name: file.name.replace(/\.txt$/i, ""),
      avatarText: "?",
      profile: text
    };
  }

  if (extension === "png") {
    throw new Error(
      "PNG 角色卡解析将在下一批接入；当前可先导出为 JSON 导入。"
    );
  }

  throw new Error("暂不支持这种文件格式");
}

async function readTextWithFallback(file) {
  const buffer = await file.arrayBuffer();

  const utf8 = new TextDecoder("utf-8").decode(buffer);

  if (!utf8.includes("�")) {
    return utf8;
  }

  return new TextDecoder("gb18030").decode(buffer);
}

function renderSettings() {
  setRouteState("settings");
  setTitle("设置");

  const settings = app.state.globalSettings;
  const chatPreset =
    app.apiPresets.find(item => item.kind === "chat");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">SETTINGS</p>
      <h2>设置</h2>

      <div class="setting-list">
        ${settingRow(
          "主动来信",
          "默认关闭",
          "proactiveMessages",
          settings.proactiveMessages
        )}

        ${settingRow(
          "语音朗读",
          "TTS API / 浏览器合成",
          "tts",
          settings.tts
        )}

        ${settingRow(
          "语音输入",
          "浏览器语音识别",
          "voiceInput",
          settings.voiceInput
        )}

        ${settingRow(
          "自动总结",
          "单独总结时才会增加请求",
          "autoSummary",
          settings.autoSummary
        )}

        <div class="setting-item">
          <div>
            <strong>聊天 API</strong>
            <small>${chatPreset
              ? escapeHtml(chatPreset.name)
              : "未配置"}</small>
          </div>

          <button
            class="capsule-button secondary"
            id="editChatApi"
          >
            配置
          </button>
        </div>

        <div class="setting-item">
          <div>
            <strong>mmi助手</strong>
            <small>${app.state.assistant.enabled
              ? "已启用"
              : "未启用"}</small>
          </div>

          <button
            class="toggle ${
              app.state.assistant.enabled ? "on" : ""
            }"
            id="toggleAssistant"
          ></button>
        </div>
      </div>
    </section>
  `;

  bindSettingToggles();

  document
    .querySelector("#editChatApi")
    .addEventListener("click", renderApiSettings);

  document
    .querySelector("#toggleAssistant")
    .addEventListener("click", async () => {
      app.state.assistant.enabled =
        !app.state.assistant.enabled;

      await saveSetting("assistant", app.state.assistant);
      renderSettings();
    });
}

function settingRow(title, description, key, enabled) {
  return `
    <div class="setting-item">
      <div>
        <strong>${title}</strong>
        <small>${description}</small>
      </div>

      <button
        class="toggle ${enabled ? "on" : ""}"
        data-setting-key="${key}"
        aria-label="${title}"
      ></button>
    </div>
  `;
}

function bindSettingToggles() {
  document
    .querySelectorAll("[data-setting-key]")
    .forEach(button => {
      button.addEventListener("click", async () => {
        const key = button.dataset.settingKey;

        app.state.globalSettings[key] =
          !app.state.globalSettings[key];

        await saveSetting(
          "globalSettings",
          app.state.globalSettings
        );

        renderSettings();
      });
    });
}

function renderApiSettings() {
  setTitle("聊天 API");

  const preset =
    app.apiPresets.find(item => item.kind === "chat")
    || {
      name: "我的聊天 API",
      kind: "chat",
      protocol: "openai-compatible",
      baseUrl: "",
      apiKey: "",
      model: "",
      temperature: 0.8,
      maxTokens: 2048
    };

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">API PRESET</p>
      <h2>聊天 API</h2>

      <form class="form-list" id="apiForm">
        <label>
          预设名称
          <input name="name" value="${escapeAttr(preset.name)}">
        </label>

        <label>
          类型
          <select name="protocol">
            <option value="openai-compatible">
              OpenAI 兼容
            </option>
          </select>
        </label>

        <label>
          Base URL
          <input
            name="baseUrl"
            value="${escapeAttr(preset.baseUrl)}"
            placeholder="https://api.openai.com"
            required
          >
        </label>

        <label>
          API Key
          <input
            name="apiKey"
            type="password"
            value="${escapeAttr(preset.apiKey)}"
            required
          >
        </label>

        <label>
          模型名
          <input
            name="model"
            value="${escapeAttr(preset.model)}"
            placeholder="例如 gpt-4o-mini"
            required
          >
        </label>

        <label>
          Temperature
          <input
            name="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value="${preset.temperature}"
          >
        </label>

        <label>
          最大输出 Token
          <input
            name="maxTokens"
            type="number"
            min="1"
            value="${preset.maxTokens}"
          >
        </label>

        <button class="capsule-button primary" type="submit">
          保存 API
        </button>
      </form>
    </section>
  `;

  document
    .querySelector("#apiForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const data = new FormData(event.currentTarget);

      const saved = await saveApiPreset({
        id: preset.id,
        name: data.get("name"),
        kind: "chat",
        protocol: data.get("protocol"),
        baseUrl: data.get("baseUrl"),
        apiKey: data.get("apiKey"),
        model: data.get("model"),
        temperature: data.get("temperature"),
        maxTokens: data.get("maxTokens")
      });

      app.apiPresets = await getApiPresets();

      event.currentTarget
        .querySelector("button")
        .textContent = "已保存";

      setTimeout(() => renderSettings(), 700);
    });
}

function renderAppearance() {
  setRouteState("appearance");
  setTitle("外观");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">APPEARANCE</p>
      <h2>外观界面</h2>

      <div class="setting-list">
        <div class="setting-item">
          <div>
            <strong>视觉主题</strong>
            <small>晶蓝磨砂玻璃</small>
          </div>
          <span class="capsule">当前</span>
        </div>

        <div class="setting-item">
          <div>
            <strong>桌面图标</strong>
            <small>可整理顺序</small>
          </div>
          <span class="capsule">支持拖动</span>
        </div>

        <div class="setting-item">
          <div>
            <strong>欢迎卡片</strong>
            <small>回到桌面直接编辑文字</small>
          </div>
          <span class="capsule">可编辑</span>
        </div>
      </div>
    </section>
  `;
}

function renderGallery() {
  setRouteState("gallery");
  setTitle("相册");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">IMAGE STUDIO</p>
      <h2>相册</h2>
      <p class="muted-text">
        NovelAI、OpenAI Images 和其他生图接口将在这里配置。
      </p>

      <button class="capsule-button primary">
        ＋ 创建生图任务
      </button>
    </section>

    <section class="empty-state">
      <div class="empty-icon">▧</div>
      <p>还没有生成图片</p>
    </section>
  `;
}

function renderTools() {
  setRouteState("tools");
  setTitle("工具");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">TOOLS</p>
      <h2>工具</h2>

      <div class="setting-list">
        <div class="setting-item">
          <div>
            <strong>联网搜索</strong>
            <small>作为工具接入聊天</small>
          </div>
          <button class="capsule-button secondary">
            配置
          </button>
        </div>

        <div class="setting-item">
          <div>
            <strong>MCP</strong>
            <small>默认关闭</small>
          </div>
          <button class="capsule-button secondary">
            配置
          </button>
        </div>

        <div class="setting-item">
          <div>
            <strong>总结 API</strong>
            <small>可绑定单独的低价模型</small>
          </div>
          <button class="capsule-button secondary">
            配置
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderPlaceholder(title, eyebrow, description) {
  setRouteState(title === "外观" ? "appearance" : app.state.route);
  setTitle(title);

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p class="muted-text">${description}</p>
    </section>

    <section class="empty-state">
      <div class="empty-icon">✦</div>
      <p>还没有内容</p>
    </section>
  `;
}

function showInlineError(message, actionText, action) {
  const element = document.createElement("div");

  element.className = "inline-error glass-card";
  element.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="capsule-button secondary">
      ${escapeHtml(actionText)}
    </button>
  `;

  element.querySelector("button").addEventListener("click", action);
  app.viewport.prepend(element);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

init().catch(error => {
  console.error(error);

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <h2>mmi机启动失败</h2>
      <p class="muted-text">${escapeHtml(error.message)}</p>
    </section>
  `;
});
