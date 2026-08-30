import { defaultState } from "./state.js";
import {
  seedDatabase,
  getCharacters,
  getSetting,
  saveSetting
} from "./db.js";

const app = {
  state: structuredClone(defaultState),
  chars: [],
  viewport: document.querySelector("#appViewport"),
  title: document.querySelector("#pageTitle"),
  modal: document.querySelector("#charModal")
};

const apps = [
  { id: "messages", icon: "◌", label: "消息" },
  { id: "worldbook", icon: "✧", label: "世界书" },
  { id: "characters", icon: "♢", label: "档案" },
  { id: "settings", icon: "⚙", label: "设置" },
  { id: "appearance", icon: "◈", label: "外观" },
  { id: "gallery", icon: "▧", label: "相册" },
  { id: "offline", icon: "⌁", label: "线下" },
  { id: "forum", icon: "☷", label: "论坛" },
  { id: "group", icon: "◎", label: "群聊" },
  { id: "fan-extra", icon: "✦", label: "番外" },
  { id: "search", icon: "⌕", label: "搜索" },
  { id: "mcp", icon: "◇", label: "MCP" },
  { id: "shop", icon: "♧", label: "商店" },
  { id: "backup", icon: "↥", label: "备份" }
];

async function init() {
  await seedDatabase(defaultState);

  app.state.theme = await getSetting(
    "theme",
    defaultState.theme
  );

  app.state.globalSettings = await getSetting(
    "globalSettings",
    defaultState.globalSettings
  );

  app.chars = await getCharacters();

  bindNavigation();
  bindModal();
  renderRoute("home");
}

function bindNavigation() {
  document.querySelectorAll("[data-route]").forEach(button => {
    button.addEventListener("click", () => {
      renderRoute(button.dataset.route);
    });
  });
}

function bindModal() {
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
      closeCharModal();
      renderRoute("messages");
    });

  document
    .querySelector("#openCharProfile")
    .addEventListener("click", () => {
      closeCharModal();
      renderRoute("characters");
    });
}

function renderRoute(route) {
  app.state.route = route;

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.route === route
    );
  });

  const renderers = {
    home: renderHome,
    messages: renderMessages,
    gallery: renderGallery,
    settings: renderSettings,
    worldbook: renderWorldbook,
    characters: renderCharacters,
    appearance: renderAppearance,
    offline: renderOffline,
    forum: renderForum,
    group: renderGroup,
    "fan-extra": renderFanExtra,
    search: renderSearch,
    mcp: renderMcp,
    shop: renderShop,
    backup: renderBackup
  };

  const renderer = renderers[route] || renderHome;
  renderer();
}

function setTitle(title) {
  app.title.textContent = title;
}

function iconButton(item) {
  return `
    <button class="app-item" data-open-app="${item.id}">
      <span class="app-icon">${item.icon}</span>
      <span class="app-label">${item.label}</span>
    </button>
  `;
}

function bindAppButtons() {
  document.querySelectorAll("[data-open-app]").forEach(button => {
    button.addEventListener("click", () => {
      renderRoute(button.dataset.openApp);
    });
  });
}

function renderHome() {
  setTitle("mmi机");

  const firstApps = apps.slice(0, 7);
  const extraApps = apps.slice(7);

  app.viewport.innerHTML = `
    <section class="welcome-card glass-card">
      <p class="eyebrow">WELCOME BACK</p>
      <h2>今天也和你的世界见面吧。</h2>
      <p>
        这里住着你的 char、记忆、故事和还没有发生的事情。
      </p>
    </section>

    <div class="capsule-row">
      <div class="capsule">
        <span class="capsule-dot"></span>
        <span>晶蓝模式</span>
      </div>
      <div class="capsule">
        <span class="capsule-dot"></span>
        <span>主动来信已关闭</span>
      </div>
      <div class="capsule">
        <span class="capsule-dot"></span>
        <span>纯对话</span>
      </div>
    </div>

    <div class="section-heading">
      <h3>我的应用</h3>
      <span>第一屏</span>
    </div>

    <div class="app-grid">
      ${firstApps.map(iconButton).join("")}
    </div>

    <div class="section-heading">
      <h3>更多功能</h3>
      <span>全部模块</span>
    </div>

    <div class="app-grid">
      ${extraApps.map(iconButton).join("")}
    </div>

    <div class="section-heading">
      <h3>我的 char</h3>
      <span>点击头像查看心声</span>
    </div>

    ${app.chars.map(renderCharCard).join("")}
  `;

  bindAppButtons();
  bindCharCards();
}

function renderCharCard(char) {
  return `
    <button class="char-card glass-card" data-char-id="${char.id}">
      <span class="char-avatar">${escapeHtml(char.avatarText)}</span>
      <span class="char-main">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.thoughts)}</p>
      </span>
      <span class="char-arrow">›</span>
    </button>
  `;
}

function bindCharCards() {
  document.querySelectorAll("[data-char-id]").forEach(card => {
    card.addEventListener("click", () => {
      const char = app.chars.find(
        item => item.id === card.dataset.charId
      );

      if (char) openCharModal(char);
    });
  });
}

function openCharModal(char) {
  document.querySelector("#modalCharAvatar").textContent =
    char.avatarText;

  document.querySelector("#modalCharName").textContent =
    char.name;

  document.querySelector("#modalCharSubtitle").textContent =
    char.subtitle;

  document.querySelector("#modalMood").textContent =
    char.mood;

  document.querySelector("#modalAffection").textContent =
    char.affection;

  document.querySelector("#modalThoughts").textContent =
    char.thoughts;

  app.modal.classList.remove("hidden");
}

function closeCharModal() {
  app.modal.classList.add("hidden");
}

function renderMessages() {
  setTitle("消息");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">MESSAGES</p>
      <h2>消息</h2>
      <p class="muted-text">
        这里将显示单聊、群聊、语音消息、图片消息和 char 的主动来信。
        当前主动来信默认关闭。
      </p>
    </section>

    <div class="section-heading">
      <h3>最近会话</h3>
      <span>0 条未读</span>
    </div>

    ${app.chars.map(renderCharCard).join("")}
  `;

  bindCharCards();
}

function renderCharacters() {
  setTitle("档案");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">CHAR ARCHIVE</p>
      <h2>档案</h2>
      <p class="muted-text">
        创建、编辑和导入你的 char。完整人设、外貌、说话方式、
        记忆规则和主动来信偏好都会保存在本机。
      </p>
      <button class="capsule-button primary" id="createCharButton">
        ＋ 创建 char
      </button>
    </section>

    <div class="section-heading">
      <h3>已有角色</h3>
      <span>${app.chars.length} 位</span>
    </div>

    ${app.chars.map(renderProfileCard).join("")}
  `;

  document
    .querySelector("#createCharButton")
    .addEventListener("click", () => {
      alert("char 创建页将在下一阶段接入。");
    });

  document.querySelectorAll("[data-profile-char]").forEach(card => {
    card.addEventListener("click", () => {
      const char = app.chars.find(
        item => item.id === card.dataset.profileChar
      );

      if (char) openCharModal(char);
    });
  });
}

function renderProfileCard(char) {
  return `
    <button class="char-card glass-card" data-profile-char="${char.id}">
      <span class="char-avatar">${escapeHtml(char.avatarText)}</span>
      <span class="char-main">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.profile)}</p>
      </span>
      <span class="char-arrow">›</span>
    </button>
  `;
}

function renderSettings() {
  setTitle("设置");

  const settings = app.state.globalSettings;

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">SETTINGS</p>
      <h2>设置</h2>
      <p class="muted-text">
        控制回复、记忆、语音和主动来信。主动来信默认不会运行。
      </p>

      <div class="setting-list">
        ${settingRow(
          "主动来信",
          "全局默认关闭，可按 char 单独开启",
          "proactiveMessages",
          settings.proactiveMessages
        )}

        ${settingRow(
          "语音朗读",
          "TTS API，不可用时使用浏览器语音",
          "tts",
          settings.tts
        )}

        ${settingRow(
          "语音输入",
          "使用浏览器语音识别输入文字",
          "voiceInput",
          settings.voiceInput
        )}

        <div class="setting-item">
          <div>
            <strong>记忆强度</strong>
            <small>当前采用手册推荐：平衡</small>
          </div>
          <span class="capsule">平衡</span>
        </div>

        <div class="setting-item">
          <div>
            <strong>线上叙事</strong>
            <small>默认不生成动作、环境和旁白</small>
          </div>
          <span class="capsule">纯对话</span>
        </div>
      </div>
    </section>
  `;

  bindSettingToggles();
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
        aria-label="${title}">
      </button>
    </div>
  `;
}

function bindSettingToggles() {
  document.querySelectorAll("[data-setting-key]").forEach(button => {
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

function renderAppearance() {
  setTitle("外观");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">APPEARANCE</p>
      <h2>外观界面</h2>
      <p class="muted-text">
        当前主题：晶蓝磨砂玻璃。后续可替换壁纸、图标、胶囊样式、
        强调色和状态栏。
      </p>

      <div class="setting-list">
        <div class="setting-item">
          <div>
            <strong>主视觉</strong>
            <small>晶蓝磨砂玻璃</small>
          </div>
          <span class="capsule">已启用</span>
        </div>

        <div class="setting-item">
          <div>
            <strong>气泡样式</strong>
            <small>圆润胶囊 / 半透明高光</small>
          </div>
          <span class="capsule">胶囊</span>
        </div>

        <div class="setting-item">
          <div>
            <strong>桌面壁纸</strong>
            <small>支持图片和渐变壁纸</small>
          </div>
          <button class="capsule-button secondary">更换</button>
        </div>

        <div class="setting-item">
          <div>
            <strong>App 图标</strong>
            <small>支持图案、颜色和圆角调整</small>
          </div>
          <button class="capsule-button secondary">编辑</button>
        </div>
      </div>
    </section>
  `;
}

function renderGallery() {
  setTitle("相册");

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">IMAGE STUDIO</p>
      <h2>相册</h2>
      <p class="muted-text">
        NovelAI、OpenAI Images 和兼容生图接口都会从这里进入。
        生成图片、角色头像、聊天图片和番外封面会统一保存在这里。
      </p>
      <button class="capsule-button primary">
        ＋ 创建生图任务
      </button>
    </section>

    <section class="empty-state">
      <div class="empty-icon">▧</div>
      <p>还没有生成图片。<br>下一阶段接入 NovelAI 与 OpenAI Images。</p>
    </section>
  `;
}

function renderWorldbook() {
  renderPlaceholder(
    "世界书",
    "WORLD BOOK",
    "管理常驻设定、关键词触发条目、分组、插入深度和角色绑定。"
  );
}

function renderOffline() {
  renderPlaceholder(
    "线下",
    "OFFLINE",
    "创建地点、时间、天气和氛围，进行叙事体面对面互动。线下心声会显示在叙事卡中。"
  );
}

function renderForum() {
  renderPlaceholder(
    "论坛",
    "FORUM",
    "角色和 NPC 会在这里发帖、评论、点赞，并为番外提供世界素材。"
  );
}

function renderGroup() {
  renderPlaceholder(
    "群聊",
    "GROUP CHAT",
    "支持多个 char 同时参与的群聊。"
  );
}

function renderFanExtra() {
  renderPlaceholder(
    "番外",
    "EXTRA STORIES",
    "用户可以选择剧情、记忆、事件、人物、视角和文风来生成番外。自动生成默认关闭。"
  );
}

function renderSearch() {
  renderPlaceholder(
    "搜索",
    "WEB SEARCH",
    "支持联网搜索，并可将搜索能力作为聊天工具或 MCP 工具使用。"
  );
}

function renderMcp() {
  renderPlaceholder(
    "MCP",
    "MCP TOOLS",
    "配置 MCP Server、查看工具、启用工具并让 char 在聊天中调用。"
  );
}

function renderShop() {
  renderPlaceholder(
    "商店",
    "SHOP",
    "本地商品、礼物、订单、钱包和关系事件。"
  );
}

function renderBackup() {
  renderPlaceholder(
    "备份",
    "DATA",
    "导入酒馆卡、世界书和完整备份，支持分片导出与恢复。"
  );
}

function renderPlaceholder(title, eyebrow, description) {
  setTitle(title);

  app.viewport.innerHTML = `
    <section class="page-card glass-card">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p class="muted-text">${description}</p>
    </section>

    <section class="empty-state">
      <div class="empty-icon">✦</div>
      <p>功能入口已建立。<br>具体业务模块将在后续代码批次接入。</p>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init().catch(error => {
  console.error(error);
  document.querySelector("#appViewport").innerHTML = `
    <section class="page-card glass-card">
      <h2>mmi机启动失败</h2>
      <p class="muted-text">
        ${escapeHtml(error.message)}
      </p>
    </section>
  `;
});
