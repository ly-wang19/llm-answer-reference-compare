export type PlatformConfig = {
  name: string;
  label: string;
  url: string;
  adapter: "generic-chat" | "dknowc-chat";
  profile: string;
  sendFallback?: "input-container-bottom-right";
  selectors?: {
    input?: string[];
    send?: string[];
    answer?: string[];
    references?: string[];
  };
};

export const builtInPlatforms: PlatformConfig[] = [
  {
    name: "doubao",
    label: "豆包",
    url: "https://www.doubao.com/chat/",
    adapter: "generic-chat",
    profile: "doubao",
    selectors: {
      input: ["textarea.semi-input-textarea", ".semi-input-textarea", "textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: ["#flow-end-msg-send", ".send-btn-wrapper button", "[class*='send-btn-wrapper'] button", "button:has-text('发送')", "button[type='submit']"],
      answer: [
        "[data-plugin-identifier='block_type:10000'] .md-box-root",
        ".md-box-root",
        "[data-testid*='message']",
        "[class*='message-content']",
        "[class*='answer']",
        "[class*='chat-message']",
        "[class*='markdown']"
      ],
      references: [
        "[data-plugin-identifier='block_type:10000'] .md-box-root a[href]",
        ".md-box-root a[href]"
      ]
    },
    sendFallback: "input-container-bottom-right"
  },
  {
    name: "yuanbao",
    label: "元宝",
    url: "https://yuanbao.tencent.com/",
    adapter: "generic-chat",
    profile: "yuanbao",
    selectors: {
      input: ["#search-bar .ql-editor[contenteditable='true']", ".ql-editor[contenteditable='true']", "textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: ["#yuanbao-send-btn", "a[id*='send']", "[class*='send-btn']", "button:has-text('发送')", "button[type='submit']", "button"],
      answer: [
        ".agent-chat__list__item--ai .hyc-common-markdown",
        ".agent-chat__list__item--ai [class*='markdown']",
        "[class*='hyc-component-markdown']",
        "[class*='message']",
        "[class*='answer']",
        "#chat-content"
      ],
      references: ["#chat-content a[href]", "[class*='source'] a[href]", "[class*='reference'] a[href]"]
    }
  },
  {
    name: "deepseek",
    label: "DeepSeek",
    url: "https://chat.deepseek.com/",
    adapter: "generic-chat",
    profile: "deepseek",
    selectors: {
      input: ["textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: ["button:has-text('Send')", "button:has-text('发送')", "button[type='submit']", "button"],
      answer: [
        ".ds-markdown.ds-assistant-message-main-content",
        ".ds-assistant-message-main-content",
        "[class*='assistant'][class*='message']",
        "[class*='message']",
        "main"
      ],
      references: [
        ".ds-assistant-message-main-content a[href]",
        ".ds-markdown.ds-assistant-message-main-content a[href]"
      ]
    }
  },
  {
    name: "qianwen",
    label: "千问",
    url: "https://tongyi.aliyun.com/qianwen/",
    adapter: "generic-chat",
    profile: "qianwen",
    selectors: {
      input: [
        "[data-slate-editor='true'][contenteditable='true'][role='textbox']",
        "[data-placeholder='向千问提问'][contenteditable='true']",
        "[data-chat-input-shell='true'] [contenteditable='true']",
        "textarea",
        "[contenteditable='true']",
        "div[role='textbox']"
      ],
      send: ["button[aria-label='发送消息']", "button:has-text('发送')", "button[type='submit']"],
      answer: [
        ".qk-markdown.qk-markdown-react",
        "#qk-markdown-react",
        ".markdown-pc-special-class .qk-markdown",
        "[data-message-author-role='assistant']",
        "[class*='message']",
        "[class*='answer']",
        "main"
      ],
      references: [
        "[class*='reference'] a[href]",
        "[class*='source'] a[href]",
        "[class*='search'] a[href]",
        ".qk-md a[href]"
      ]
    }
  },
  {
    name: "zhipu",
    label: "智谱清言",
    url: "https://chatglm.cn/main/alltoolsdetail",
    adapter: "generic-chat",
    profile: "zhipu",
    selectors: {
      input: ["textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: ["button:has-text('发送')", "button[type='submit']", "button"],
      answer: ["[class*='message']", "[class*='answer']", "main"],
      references: ["a[href]", "[class*='source'] a[href]", "[class*='reference'] a[href]"]
    }
  },
  {
    name: "kimi",
    label: "Kimi",
    url: "https://kimi.moonshot.cn/",
    adapter: "generic-chat",
    profile: "kimi",
    selectors: {
      input: [".chat-input-editor[contenteditable='true']", "[data-lexical-editor='true'][contenteditable='true']", "textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: [".send-button-container:not(.disabled)", "button:has-text('发送')", "button[type='submit']", "button"],
      answer: [".chat-content-item-assistant .segment-assistant", ".segment-assistant", "[class*='answer']", "main"],
      references: [".chat-content-item-assistant a[href]", "[class*='source'] a[href]", "[class*='reference'] a[href]"]
    }
  },
  {
    name: "chatgpt",
    label: "ChatGPT",
    url: "https://chatgpt.com/",
    adapter: "generic-chat",
    profile: "chatgpt",
    selectors: {
      input: ["#prompt-textarea", "textarea", "[contenteditable='true']", "div[role='textbox']"],
      send: ["button[data-testid='send-button']", "button:has-text('Send')", "button[type='submit']", "button"],
      answer: ["[data-message-author-role='assistant']", "[class*='message']", "main"],
      references: ["a[href]", "[class*='source'] a[href]", "[class*='citation'] a[href]"]
    }
  },
  {
    name: "claude",
    label: "Claude",
    url: "https://claude.ai/new",
    adapter: "generic-chat",
    profile: "claude",
    selectors: {
      input: ["div[contenteditable='true']", "textarea", "div[role='textbox']"],
      send: ["button[aria-label*='Send']", "button:has-text('Send')", "button[type='submit']", "button"],
      answer: ["[data-testid*='message']", "[class*='message']", "main"],
      references: ["a[href]", "[class*='source'] a[href]", "[class*='citation'] a[href]"]
    }
  },
  {
    name: "gemini",
    label: "Gemini",
    url: "https://gemini.google.com/app",
    adapter: "generic-chat",
    profile: "gemini",
    selectors: {
      input: ["rich-textarea div[contenteditable='true']", "div[contenteditable='true']", "textarea", "div[role='textbox']"],
      send: ["button[aria-label*='Send']", "button:has-text('Send')", "button[type='submit']", "button"],
      answer: ["message-content", "[class*='model-response']", "[class*='response']", "main"],
      references: ["a[href]", "[class*='source'] a[href]", "[class*='citation'] a[href]"]
    }
  },
  {
    name: "dknowc-chat",
    label: "深知晓",
    url: "https://yun.dknowc.cn/wlcb/dknowc-chat/",
    adapter: "dknowc-chat",
    profile: "dknowc-chat",
    selectors: {
      input: ["textarea", "[contenteditable='true']", "input[type='text']"],
      send: ["button:has-text('发送')", "button[type='submit']", "button"],
      answer: [
        ".czkj-robot:not(.chat-load-text) .czkj-msg",
        ".czkj-robot .czkj-msg",
        ".czkj-chat-center .czkj-msg",
        "[class*='assistant']",
        "[class*='answer']",
        "[class*='message']",
        ".chat-content",
        "main",
        "body"
      ],
      references: [
        "a[href]",
        ".czkj-robot [data-url]",
        ".chatsse-note-item [data-url]",
        ".chat-jb [data-url]",
        ".czkj-robot a[href]",
        "[class*='source'] a[href]",
        "[class*='citation'] a[href]",
        "[class*='reference'] a[href]"
      ]
    }
  },
  {
    name: "generic",
    label: "Generic Chat",
    url: "",
    adapter: "generic-chat",
    profile: "generic"
  }
];

export function listPlatformConfigs(): PlatformConfig[] {
  return builtInPlatforms;
}

export function resolvePlatformTarget(raw: string): PlatformConfig {
  const [nameOrUrl, explicitUrl] = raw.includes("=")
    ? (raw.split(/=(.*)/s).filter(Boolean) as [string, string])
    : [raw, ""];
  const builtIn = builtInPlatforms.find((platform) => platform.name === nameOrUrl);

  if (builtIn) {
    return {
      ...builtIn,
      url: explicitUrl || builtIn.url
    };
  }

  const url = explicitUrl || nameOrUrl;
  return {
    name: hostNameFor(url),
    label: hostNameFor(url),
    url,
    adapter: "generic-chat",
    profile: hostNameFor(url)
  };
}

function hostNameFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "generic";
  }
}
