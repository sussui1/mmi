import { defaultState } from "./state.js";

import {
  seedDatabase,
  getSetting,
  saveSetting,
  getCharacters,
  getWorldbookEntries,
  saveWorldbookEntry,
  getApiPresets,
  saveApiPreset
} from "./db.js";

const app = {
  state: structuredClone(defaultState),
  chars: [],
  worldbookEntries: [],
  apiPresets: [],
  routeStack: [],
  homePage: 0,
  startX: 0,
  currentChatChar: null
};

const viewport = document.querySelector("#appViewport");

const apps = [
  { id: "messages", icon: "◌", label: "消息" },
  { id: "worldbook", icon: "✧", label: "世界书" },
  { id: "characters", icon: "♢", label: "档案" },
  { id: "settings", icon: "⚙", label: "设置" },
  { id: "appearance", icon: "◈", label: "外观" },
  { id: "group", icon: "◎", label: "群聊" },
  { id: "offline", icon: "⌁", label: "线下" },
  { id: "gallery", icon: "▧", label: "相册" },
  { id: "forum", icon: "☷", label: "论坛" },
  { id: "fan-extra", icon: "✦", label: "番外" },
  { id: "tools", icon: "◇", label: "工具" },
  { id: "shop", icon: "♧", label: "商店" },
  { id: "backup", icon: "↥", label: "备份" }
];

async function init() {
  await seedDatabase(defaultState);

  app.state.user = await getSetting(
    "user",
    defaultState.user
  );

  app.state.welcomeText = await getSetting(
    "welcomeText",
    defaultState.welcomeText
  );

  app.state.globalSettings = await getSetting(
    "globalSettings",
    defaultState.globalSettings
  );

  app.state.assistant = await getSetting(
    "assistant",
    defaultState.assistant
  );

  app.chars = await getCharacters();
  app.worldbookEntries = await getWorldbookEntries();
  app.apiPresets = await getApiPresets();

  bindGlobalEvents();
  renderRoute("home", false);
  updateClock();

  setInterval(updateClock, 30_000);
}

function bindGlobalEvents() {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        renderRoute(button.dataset.route);
      });
    });

  document
    .querySelector("#backButton")
    .addEventListener("click", goBack);

  document
    .querySelector("#userAvatarButton")
    .addEventListener("click", openUserModal);

  document
    .querySelector("#closeUserModal")
    .addEventListener("click", closeUserModal);

  document
    .querySelector("#closeCharModal")
    .addEventListener("click", closeCharModal);

  document
    .querySelector("#userForm")
    .addEventListener("submit", saveUserProfile);

  document
    .querySelector("#userAvatarFile")
    .addEventListener("change", previewUserAvatar);

  document
    .querySelector("#openCharChat")
    .addEventListener("click", () => {
      const charId =
        document.querySelector("#charModal").dataset.charId;

      closeCharModal();
      renderChat(charId);
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
}

function updateClock() {
  document.querySelector("#statusTime").textContent =
    new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
}

function renderRoute(route, push = true) {
  if (push && app.routeStack.at(-1) !== route) {
    app.routeStack.push(route);
    history.pushState({ route }, "", `#${route}`);
  }

  if (!app.routeStack.length) {
    app.routeStack.push(route);
  }

  const renderers = {
    home: renderHome,
    messages: renderMessages,
    group: () => renderPlaceholder(
      "群聊",
      "GROUP CHAT",
      "群聊会在这里显示。"
    ),
    worldbook: renderWorldbook,
    settings: renderSettings,
    characters: renderCharacters,
    appearance: () => renderPlaceholder(
      "外观",
      "APPEARANCE",
      "壁纸、图标和胶囊样式设置。"
    ),
    gallery: () => renderPlaceholder(
      "相册",
      "IMAGE STUDIO",
      "NovelAI 和 OpenAI Images 生图结果会保存在这里。"
    ),
    offline: () => renderPlaceholder(
      "线下",
      "OFFLINE",
      "创建面对面互动场景。"
    ),
    forum: () => renderPlaceholder(
      "论坛",
      "FORUM",
      "论坛和 NPC 功能。"
    ),
    "fan-extra": () => renderPlaceholder(
      "番外",
      "EXTRA STORIES",
      "根据你选择的要求生成番外。"
    ),
    tools: renderTools,
    shop: () => renderPlaceholder(
      "商店",
      "SHOP",
      "礼物、订单和钱包功能。"
    ),
    backup: () => renderPlaceholder(
      "备份",
      "BACKUP",
      "酒馆卡、世界书和完整数据备份。"
    )
  };

  const render = renderers[route] || renderHome;
  render();

  document
    .querySelector("#backButton")
    .classList.toggle(
      "hidden",
      route === "home" || app.routeStack.length <= 1
    );
}

function goBack() {
  if (app.routeStack.length <= 1) {
    renderRoute("home");
    return;
  }

  app.routeStack.pop();
  history.back();
}

function setTitle(title) {
  document.querySelector("#pageTitle").textContent = title;
}

function setActiveNav(route) {
  document
    .querySelectorAll(".nav-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.route === route
      );
    });
}

function renderHome() {
  setTitle("mmi机");
  setActiveNav("");

  const pageOne = apps.slice(0, 8);
  const pageTwo = apps.slice(8);

  viewport.innerHTML = `
    <section class="welcome-card glass-card">
      <p class="eyebrow">${escapeHtml(
        app.state.welcomeText.eyebrow
      )}</p>

      <h2>${escapeHtml(
        app.state.welcomeText.title
      )}</h2>

      <p>${escapeHtml(
        app.state.welcomeText.description
      )}</p>
    </section>

    <section
      class="home-pager"
      id="homePager"
    >
      <div
        class="home-track"
        id="homeTrack"
      >
        <div class="home-page">
          <div class="page-label">常用应用</div>
          <div class="app-grid">
            ${pageOne.map(renderApp).join("")}
          </div>

          ${renderIncomingMessages()}
          ${renderCharPreview()}
        </div>

        <div class="home-page">
          <div class="page-label">更多功能</div>
          <div class="app-grid">
            ${pageTwo.map(renderApp).join("")}
          </div>
        </div>
      </div>
    </section>

    <div class="swipe-hint">
      <span class="page-dot active" data-page-dot="0"></span>
      <span class="page-dot" data-page-dot="1"></span>
      <span>左右滑动翻页</span>
    </div>
  `;

  bindHomeEvents();
  updatePagerPosition();
}

function renderApp(item) {
  return `
    <button
      class="app-item"
      data-open-app="${item.id}"
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
    <div class="section-heading">
      <h3>来自 char 的消息</h3>
      <span>主动来信已开启</span>
    </div>

    <div class="incoming-list">
      ${incoming.map(char => `
        <button
          class="incoming-card glass-card"
          data-char-id="${char.id}"
        >
          ${renderAvatar(char)}

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

function renderCharPreview() {
  if (!app.chars.length && !app.state.assistant.enabled) {
    return `
      <section class="empty-home-card glass-card">
        <div class="empty-icon">♢</div>
        <p>还没有 char</p>

        <button
          class="capsule-button primary"
          id="createFirstChar"
        >
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
    </div>
  `;
}

function renderCharCard(char) {
  return `
    <button
      class="char-card glass-card"
      data-char-id="${char.id}"
    >
      ${renderAvatar(char)}

      <span class="char-main">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(
          char.thoughts || "暂无心声记录。"
        )}</p>
      </span>

      <span class="char-arrow">›</span>
    </button>
  `;
}

function renderAvatar(char) {
  if (char.avatarDataUrl) {
    return `
      <span class="char-avatar image-avatar">
        <img
          src="${char.avatarDataUrl}"
          alt="${escapeAttr(char.name)}"
        >
      </span>
    `;
  }

  return `
    <span class="char-avatar">
      ${escapeHtml(char.avatarText || "?")}
    </span>
  `;
}

function bindHomeEvents() {
  document
    .querySelectorAll("[data-open-app]")
    .forEach(button => {
      button.addEventListener("click", () => {
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
    .querySelector("#createFirstChar")
    ?.addEventListener("click", () => {
      renderRoute("characters");
    });

  const pager = document.querySelector("#homePager");

  pager.addEventListener("pointerdown", event => {
    app.startX = event.clientX;
    pager.setPointerCapture?.(event.pointerId);
  });

  pager.addEventListener("pointerup", event => {
    const distance = event.clientX - app.startX;

    if (Math.abs(distance) < 55) return;

    if (distance < 0) {
      app.homePage = 1;
    } else {
      app.homePage = 0;
    }

    updatePagerPosition();
  });
}

function updatePagerPosition() {
  const track = document.querySelector("#homeTrack");

  if (!track) return;

  track.style.transform =
    `translate3d(-${app.homePage * 50}%, 0, 0)`;

  document
    .querySelectorAll("[data-page-dot]")
    .forEach(dot => {
      dot.classList.toggle(
        "active",
        Number(dot.dataset.pageDot) === app.homePage
      );
    });
}

function openCharModal(char) {
  const modal = document.querySelector("#charModal");

  modal.dataset.charId = char.id;

  document.querySelector("#modalCharAvatar").textContent =
    char.avatarText || "?";

  document.querySelector("#modalCharName").textContent =
    char.name;

  document.querySelector("#modalCharSubtitle").textContent =
    char.subtitle || "你的 char";

  document.querySelector("#modalMood").textContent =
    char.mood || "未知";

  document.querySelector("#modalAffection").textContent =
    char.affection || 0;

  document.querySelector("#modalThoughts").textContent =
    char.thoughts || "暂无心声记录。";

  modal.classList.remove("hidden");
}

function closeCharModal() {
  document
    .querySelector("#charModal")
    .classList.add("hidden");
}

function openUserModal() {
  const user = app.state.user;

  document.querySelector("#userDisplayName").value =
    user.displayName || "";

  document.querySelector("#userProfile").value =
    user.profile || "";

  const preview = document.querySelector("#userPreviewAvatar");

  if (user.avatarDataUrl) {
    preview.innerHTML = `
      <img
        src="${user.avatarDataUrl}"
        alt="user头像"
      >
    `;
  } else {
    preview.textContent = "你";
  }

  document
    .querySelector("#userModal")
    .classList.remove("hidden");
}

function closeUserModal() {
  document
    .querySelector("#userModal")
    .classList.add("hidden");
}

function previewUserAvatar(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    document.querySelector("#userPreviewAvatar").innerHTML = `
      <img
        src="${reader.result}"
        alt="头像预览"
      >
    `;

    document.querySelector("#userPreviewAvatar")
      .dataset.pendingAvatar = reader.result;
  };

  reader.readAsDataURL(file);
}

async function saveUserProfile(event) {
  event.preventDefault();

  const form = new FormData(event.currentTarget);
  const preview = document.querySelector("#userPreviewAvatar");

  const user = {
    displayName: form.get("displayName") || "",
    profile: form.get("profile") || "",
    avatarDataUrl:
      preview.dataset.pendingAvatar ||
      app.state.user.avatarDataUrl ||
      ""
  };

  app.state.user = user;
  await saveSetting("user", user);

  const headerImage =
    document.querySelector("#userAvatarImage");

  const headerText =
    document.querySelector("#userAvatarText");

  if (user.avatarDataUrl) {
    headerImage.src = user.avatarDataUrl;
    headerImage.classList.add("visible");
    headerText.classList.add("hidden");
  } else {
    headerImage.classList.remove("visible");
    headerText.textContent = "你";
    headerText.classList.remove("hidden");
  }

  closeUserModal();
}

function renderMessages() {
  setTitle("消息");
  setActiveNav("messages");

  if (!app.chars.length) {
    viewport.innerHTML = `
      <section class="empty-state glass-card">
        <div class="empty-icon">◌</div>
        <p>还没有会话</p>

        <button
          class="capsule-button primary"
          id="goCharacters"
        >
          创建或导入 char
        </button>
      </section>
    `;

    document
      .querySelector("#goCharacters")
      .addEventListener("click", () => {
        renderRoute("characters");
      });

    return;
  }

  viewport.innerHTML = `
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

  document
    .querySelectorAll("[data-char-id]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const char = app.chars.find(
          item => item.id === button.dataset.charId
        );

        if (char) renderChat(char.id);
      });
    });
}

function renderWorldbook() {
  setTitle("世界书");
  setActiveNav("worldbook");

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">WORLD BOOK</p>
      <h2>世界书</h2>

      <div class="button-row">
        <button
          class="capsule-button primary"
          id="createWorldbook"
        >
          ＋ 创建条目
        </button>

        <button
          class="capsule-button secondary"
          id="importWorldbook"
        >
          导入
        </button>

        <input
          id="worldbookFile"
          type="file"
          accept=".json,.txt"
          hidden
        >
      </div>
    </section>

    <div class="section-heading">
      <h3>条目</h3>
      <span>${app.worldbookEntries.length} 条</span>
    </div>

    ${
      app.worldbookEntries.length
        ? app.worldbookEntries
          .map(renderWorldbookCard)
          .join("")
        : `
          <section class="empty-state">
            <div class="empty-icon">✧</div>
            <p>还没有世界书条目</p>
          </section>
        `
    }
  `;

  document
    .querySelector("#createWorldbook")
    .addEventListener("click", showWorldbookForm);

  document
    .querySelector("#importWorldbook")
    .addEventListener("click", () => {
      document.querySelector("#worldbookFile").click();
    });

  document
    .querySelector("#worldbookFile")
    .addEventListener("change", importWorldbook);
}

function renderWorldbookCard(entry) {
  return `
    <article class="worldbook-card glass-card">
      <div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.content)}</p>
      </div>

      <span class="capsule">
        ${entry.enabled ? "启用" : "停用"}
      </span>
    </article>
  `;
}

function showWorldbookForm() {
  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">NEW ENTRY</p>
      <h2>创建世界书条目</h2>

      <form
        class="form-list"
        id="worldbookForm"
      >
        <label>
          标题
          <input
            name="title"
            required
            placeholder="例如：城市设定"
          >
        </label>

        <label>
          关键词
          <input
            name="keywords"
            placeholder="用逗号分隔"
          >
        </label>

        <label>
          条目内容
          <textarea
            name="content"
            rows="10"
            placeholder="完整输入，不会自动截断"
            required
          ></textarea>
        </label>

        <label class="check-row">
          <input
            type="checkbox"
            name="constant"
          >
          常驻注入
        </label>

        <button
          class="capsule-button primary"
          type="submit"
        >
          保存条目
        </button>
      </form>
    </section>
  `;

  document
    .querySelector("#worldbookForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      await saveWorldbookEntry({
        title: form.get("title"),
        content: form.get("content"),
        keywords: String(form.get("keywords") || "")
          .split(",")
          .map(item => item.trim())
          .filter(Boolean),
        constant: form.get("constant") === "on"
      });

      app.worldbookEntries = await getWorldbookEntries();
      renderWorldbook();
    });
}

async function importWorldbook(event) {
  const file = event.target.files[0];

  if (!file) return;

  const text = await file.text();
  let entries = [];

  if (file.name.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(text);
    entries = Array.isArray(data)
      ? data
      : data.entries || [];
  } else {
    entries = [{
      title: file.name.replace(/\.txt$/i, ""),
      content: text,
      keywords: [],
      constant: false
    }];
  }

  for (const entry of entries) {
    await saveWorldbookEntry({
      title: entry.title || entry.name,
      content: entry.content || entry.text || "",
      keywords: entry.keywords || [],
      constant: entry.constant || false
    });
  }

  app.worldbookEntries = await getWorldbookEntries();
  renderWorldbook();
}

function renderSettings() {
  setTitle("设置");
  setActiveNav("settings");

  const chatApi = app.apiPresets.find(
    item => item.kind === "chat"
  );

  const subApi = app.apiPresets.find(
    item => item.kind === "sub"
  );

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">SETTINGS</p>
      <h2>设置</h2>

      <div class="settings-section-title">
        API 接口
      </div>

      <div class="setting-list">
        <button
          class="setting-item clickable"
          id="openChatApi"
        >
          <span>
            <strong>聊天 API</strong>
            <small>${chatApi
              ? escapeHtml(chatApi.name)
              : "未配置"}</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="openSubApi"
        >
          <span>
            <strong>副 API</strong>
            <small>${subApi
              ? escapeHtml(subApi.name)
              : "负责总结、论坛、番外等"}</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="openImageApi"
        >
          <span>
            <strong>生图 API</strong>
            <small>NovelAI / OpenAI Images</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="openVoiceApi"
        >
          <span>
            <strong>语音 API</strong>
            <small>TTS / STT</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="openToolsApi"
        >
          <span>
            <strong>搜索与 MCP</strong>
            <small>统一放在工具接口</small>
          </span>
          <span>›</span>
        </button>
      </div>

      <div class="settings-section-title">
        基础行为
      </div>

      <div class="setting-list">
        ${settingRow(
          "主动来信",
          "默认关闭",
          "proactiveMessages",
          app.state.globalSettings.proactiveMessages
        )}

        ${settingRow(
          "自动总结",
          "使用副 API",
          "autoSummary",
          app.state.globalSettings.autoSummary
        )}

        <button
          class="setting-item clickable"
          id="openAssistantSetting"
        >
          <span>
            <strong>mmi助手</strong>
            <small>${
              app.state.assistant.enabled
                ? "已启用"
                : "未启用"
            }</small>
          </span>
          <span>›</span>
        </button>
      </div>
    </section>
  `;

  bindSettingToggles();

  document
    .querySelector("#openChatApi")
    .addEventListener("click", () => {
      renderApiForm("chat", "聊天 API");
    });

  document
    .querySelector("#openSubApi")
    .addEventListener("click", () => {
      renderApiForm("sub", "副 API");
    });

  document
    .querySelector("#openImageApi")
    .addEventListener("click", () => {
      renderApiForm("image", "生图 API");
    });

  document
    .querySelector("#openVoiceApi")
    .addEventListener("click", () => {
      renderApiForm("voice", "语音 API");
    });

  document
    .querySelector("#openToolsApi")
    .addEventListener("click", () => {
      renderApiForm("tools", "搜索与 MCP");
    });

  document
    .querySelector("#openAssistantSetting")
    .addEventListener("click", async () => {
      app.state.assistant.enabled =
        !app.state.assistant.enabled;

      await saveSetting(
        "assistant",
        app.state.assistant
      );

      renderSettings();
    });
}

function settingRow(title, description, key, value) {
  return `
    <button
      class="setting-item clickable"
      data-setting-key="${key}"
    >
      <span>
        <strong>${title}</strong>
        <small>${description}</small>
      </span>

      <span
        class="switch ${value ? "on" : ""}"
      ></span>
    </button>
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

function renderApiForm(kind, title) {
  setTitle(title);

  const preset = app.apiPresets.find(
    item => item.kind === kind
  ) || {
    name: "",
    kind,
    protocol: "openai-compatible",
    baseUrl: "",
    apiKey: "",
    model: "",
    temperature: 0.8,
    maxTokens: 2048
  };

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">API PRESET</p>
      <h2>${title}</h2>

      <form
        class="form-list"
        id="apiForm"
      >
        <label>
          预设名称
          <input
            name="name"
            value="${escapeAttr(preset.name)}"
            placeholder="例如：我的聊天模型"
          >
        </label>

        <label>
          协议
          <select name="protocol">
            <option value="openai-compatible">
              OpenAI 兼容协议
            </option>
            <option value="gemini">
              Gemini
            </option>
            <option value="custom">
              自定义
            </option>
          </select>
        </label>

        <label>
          Base URL
          <input
            name="baseUrl"
            value="${escapeAttr(preset.baseUrl)}"
            placeholder="https://api.openai.com"
          >
        </label>

        <label>
          API Key
          <input
            name="apiKey"
            type="password"
            value="${escapeAttr(preset.apiKey)}"
          >
        </label>

        <label>
          模型名
          <input
            name="model"
            value="${escapeAttr(preset.model)}"
            placeholder="例如 gpt-4o-mini"
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

        <button
          class="capsule-button primary"
          type="submit"
        >
          保存接口
        </button>
      </form>
    </section>
  `;

  document
    .querySelector("#apiForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      await saveApiPreset({
        id: preset.id,
        name: form.get("name"),
        kind,
        protocol: form.get("protocol"),
        baseUrl: form.get("baseUrl"),
        apiKey: form.get("apiKey"),
        model: form.get("model"),
        temperature: form.get("temperature"),
        maxTokens: form.get("maxTokens")
      });

      app.apiPresets = await getApiPresets();
      renderSettings();
    });
}

function renderTools() {
  setTitle("工具");

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">TOOLS</p>
      <h2>工具</h2>

      <div class="setting-list">
        <button
          class="setting-item clickable"
          id="searchToolButton"
        >
          <span>
            <strong>联网搜索</strong>
            <small>作为聊天工具调用</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="mcpToolButton"
        >
          <span>
            <strong>MCP</strong>
            <small>HTTP / SSE Server</small>
          </span>
          <span>›</span>
        </button>

        <button
          class="setting-item clickable"
          id="subApiToolButton"
        >
          <span>
            <strong>副 API</strong>
            <small>总结、番外、论坛生成</small>
          </span>
          <span>›</span>
        </button>
      </div>
    </section>
  `;

  document
    .querySelector("#searchToolButton")
    .addEventListener("click", () => {
      renderApiForm("tools", "搜索接口");
    });

  document
    .querySelector("#mcpToolButton")
    .addEventListener("click", () => {
      renderApiForm("mcp", "MCP 接口");
    });

  document
    .querySelector("#subApiToolButton")
    .addEventListener("click", () => {
      renderApiForm("sub", "副 API");
    });
}

function renderCharacters() {
  setTitle("档案");

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">CHAR ARCHIVE</p>
      <h2>档案</h2>

      <div class="button-row">
        <button
          class="capsule-button primary"
          id="createChar"
        >
          ＋ 创建 char
        </button>

        <button
          class="capsule-button secondary"
          id="importChar"
        >
          导入酒馆卡
        </button>
      </div>
    </section>

    <div class="section-heading">
      <h3>我的 char</h3>
      <span>${app.chars.length} 位</span>
    </div>

    ${
      app.chars.length
        ? app.chars.map(renderCharCard).join("")
        : `
          <section class="empty-state">
            <div class="empty-icon">♢</div>
            <p>还没有 char</p>
          </section>
        `
    }
  `;

  document
    .querySelector("#createChar")
    .addEventListener("click", () => {
      alert("创建 char 页面将在下一批接入。");
    });

  document
    .querySelector("#importChar")
    .addEventListener("click", () => {
      alert("酒馆卡导入入口已建立，PNG 解析将在导入模块中接入。");
    });
}

function renderChat(charId) {
  const char = app.chars.find(
    item => item.id === charId
  );

  if (!char) return;

  app.currentChatChar = char;
  renderRoute("messages");
  setTitle(char.name);

  viewport.innerHTML = `
    <section class="chat-page">
      <div class="chat-top-card glass-card">
        <button
          class="chat-avatar-button"
          id="chatAvatar"
        >
          ${escapeHtml(char.avatarText || "?")}
        </button>

        <div>
          <p class="eyebrow">CHAT</p>
          <h2>${escapeHtml(char.name)}</h2>
          <span class="muted-text">
            ${escapeHtml(char.subtitle || "")}
          </span>
        </div>
      </div>

      <section class="empty-chat glass-card">
        <div class="empty-icon">◌</div>
        <p>聊天界面基础框架已建立</p>
        <small>
          配置聊天 API 后，这里接入真实消息请求。
        </small>
      </section>

      <form
        class="chat-composer"
        id="chatComposer"
      >
        <textarea
          rows="1"
          placeholder="输入消息"
          required
        ></textarea>

        <button
          class="send-button"
          type="submit"
        >
          ↑
        </button>
      </form>
    </section>
  `;

  document
    .querySelector("#chatAvatar")
    .addEventListener("click", () => {
      openCharModal(char);
    });

  document
    .querySelector("#chatComposer")
    .addEventListener("submit", event => {
      event.preventDefault();

      alert(
        "聊天发送按钮已接通界面。下一步接入真正的 LLM 请求与消息落库。"
      );
    });
}

function renderPlaceholder(title, eyebrow, description) {
  setTitle(title);

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p class="muted-text">${description}</p>
    </section>

    <section class="empty-state">
      <div class="empty-icon">✦</div>
      <p>功能入口已建立</p>
    </section>
  `;
}

function openCharModal(char) {
  const modal = document.querySelector("#charModal");

  modal.dataset.charId = char.id;

  document.querySelector("#modalCharAvatar").textContent =
    char.avatarText || "?";

  document.querySelector("#modalCharName").textContent =
    char.name;

  document.querySelector("#modalCharSubtitle").textContent =
    char.subtitle || "你的 char";

  document.querySelector("#modalMood").textContent =
    char.mood || "未知";

  document.querySelector("#modalAffection").textContent =
    char.affection || 0;

  document.querySelector("#modalThoughts").textContent =
    char.thoughts || "暂无心声记录。";

  modal.classList.remove("hidden");
}

function closeCharModal() {
  document
    .querySelector("#charModal")
    .classList.add("hidden");
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

  viewport.innerHTML = `
    <section class="page-card glass-card">
      <h2>mmi机启动失败</h2>
      <p class="muted-text">
        ${escapeHtml(error.message)}
      </p>
    </section>
  `;
});
