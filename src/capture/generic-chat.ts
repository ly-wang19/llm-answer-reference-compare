import { chromium } from "@playwright/test";
import { join } from "node:path";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import type { PlatformResult, Reference } from "../schema/result.js";
import { ensureDir, writeTextFile } from "../utils/filesystem.js";
import { normalizeUrl } from "../utils/urls.js";
import type { PlatformConfig } from "./platform-registry.js";

export type CaptureOptions = {
  question: string;
  outDir: string;
  headed: boolean;
  interactive: boolean;
  timeoutMs: number;
};

export async function captureGenericChat(
  config: PlatformConfig,
  options: CaptureOptions
): Promise<PlatformResult> {
  const started = Date.now();
  const profileDir = join(process.cwd(), "profiles", config.profile);
  const artifactDir = join(options.outDir, "artifacts", config.name);
  await ensureDir(artifactDir);

  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: "chrome",
      headless: !options.headed
    });
    page = await context.newPage();
    const activePage = page;
    page.setDefaultTimeout(options.timeoutMs);
    page.setDefaultNavigationTimeout(options.timeoutMs);
    await page.goto(config.url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs
    });
    const inputSelectors = config.selectors?.input || [
      "textarea",
      "[contenteditable='true']",
      "input[type='text']"
    ];
    const input = await waitForFirstVisible(page, inputSelectors, Math.min(options.timeoutMs, 20000));
    if ((await pageLooksLikeGate(page)) && !input) {
      return failure(
        config,
        "login_required",
        started,
        "Page appears to require login, verification, or human interaction.",
        await saveArtifacts(page, artifactDir, options.outDir)
      );
    }

    if (!input) {
      return failure(
        config,
        "login_required",
        started,
        "No visible chat input found.",
        await saveArtifacts(page, artifactDir, options.outDir)
      );
    }

    const previousAnswer = await extractAnswer(config, page);

    await input.click();
    await fillPrompt(input, options.question);

    const send = await firstVisible(page, config.selectors?.send || [
      "button[type='submit']",
      "button:has-text('Send')",
      "button:has-text('发送')",
      "button"
    ]);
    let sent = false;
    if (send) {
      sent = await send.click().then(() => true).catch(() => false);
    }
    if (!sent && config.sendFallback === "input-container-bottom-right") {
      sent = await clickInputContainerBottomRight(activePage, input);
    }
    if (!sent) {
      await activePage.keyboard.press("Enter");
    }

    const verificationHandled = await handleVerificationIfNeeded(config, page, options);
    if (!verificationHandled) {
      return failure(
        config,
        "verification_required",
        started,
        "Page requires captcha, image verification, or other human verification.",
        await saveArtifacts(page, artifactDir, options.outDir)
      );
    }

    const answerMarkdown = await waitForAnswer(config, page, options.timeoutMs, previousAnswer, options.question);
    const references = await extractReferences(config, page);
    const artifacts = await saveArtifacts(page, artifactDir, options.outDir);

    if (looksLikeLoginText(answerMarkdown)) {
      return {
        ...failure(
          config,
          "login_required",
          started,
          "Captured text appears to be a login or verification prompt.",
          artifacts
        ),
        artifacts
      };
    }

    if (!answerMarkdown.trim()) {
      return {
        ...failure(config, "failed", started, "No answer text detected.", artifacts),
        artifacts
      };
    }

    return {
      platform: config.name,
      label: config.label,
      url: config.url,
      status: "success",
      answerMarkdown,
      references,
      artifacts,
      durationMs: Date.now() - started
    };
  } catch (error) {
    return failure(
      config,
      "failed",
      started,
      error instanceof Error ? error.message : String(error),
      page ? await saveArtifacts(page, artifactDir, options.outDir).catch(() => undefined) : undefined
    );
  } finally {
    await context?.close();
  }
}

async function firstVisible(page: import("@playwright/test").Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    for (let index = count - 1; index >= 0; index -= 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible().catch(() => false)) {
        return candidate;
      }
    }
  }
  return null;
}

async function waitForFirstVisible(page: Page, selectors: string[], timeoutMs: number): Promise<Locator | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const visible = await firstVisible(page, selectors);
    if (visible) {
      return visible;
    }
    await page.waitForTimeout(500);
  }
  return firstVisible(page, selectors);
}

async function fillPrompt(
  locator: Locator,
  question: string
): Promise<void> {
  await locator.fill(question).catch(async () => {
    await locator.evaluate((node, value) => {
      if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
        node.value = value;
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        node.textContent = value;
        node.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
        node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
        node.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
      }
    }, question);
  });

  const currentValue = await locator.evaluate((node) => {
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
      return node.value;
    }
    return node.textContent || "";
  }).catch(() => "");

  if (!currentValue.includes(question.slice(0, Math.min(10, question.length)))) {
    await locator.click();
    await locator.type(question, { delay: 5 });
  }
}

async function clickInputContainerBottomRight(page: Page, input: Locator): Promise<boolean> {
  const point = await input.evaluate((node) => {
    const element = node as HTMLElement;
    const container = element.closest("#input-engine-container")
      || element.closest("[class*='input-content-container']")
      || element.parentElement?.parentElement?.parentElement
      || element;
    const rect = container.getBoundingClientRect();
    return {
      x: rect.left + rect.width - 28,
      y: rect.top + rect.height - 28
    };
  }).catch(() => null);

  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return false;
  }

  await page.mouse.click(point.x, point.y).catch(() => undefined);
  return true;
}

async function extractAnswer(
  config: PlatformConfig,
  page: import("@playwright/test").Page
): Promise<string> {
  if (config.name === "deepseek") {
    const answer = await extractDeepSeekAnswer(page);
    if (answer) {
      return answer;
    }
  }

  if (config.name === "doubao") {
    const answer = await extractDoubaoAnswer(page);
    if (answer) {
      return answer;
    }
  }

  if (config.name === "yuanbao") {
    const answer = await extractYuanbaoAnswer(page);
    if (answer) {
      return answer;
    }
  }

  if (config.name === "dknowc-chat") {
    return extractDknowcAnswer(page);
  }

  if (config.name === "kimi") {
    return extractKimiAnswer(page);
  }

  const selectors = config.selectors?.answer || [
    "[data-message-author-role='assistant']",
    "[class*='assistant']",
    "[class*='answer']",
    "[class*='message']",
    "main"
  ];
  for (const selector of selectors) {
    const locator = page.locator(selector).last();
    if ((await locator.count()) > 0) {
      const text = (await locator.innerText().catch(() => "")).trim();
      if (text && !looksLikeLoadingText(text)) {
        return normalizeAnswerText(text);
      }
    }
  }
  return "";
}

function normalizeAnswerText(text: string): string {
  return text.replace(/(https?:\/\/[^\s\u4e00-\u9fff]+)/g, "$1 ");
}

async function extractDeepSeekAnswer(page: Page): Promise<string> {
  const locator = page.locator(".ds-assistant-message-main-content").last();
  if ((await locator.count().catch(() => 0)) === 0) {
    return "";
  }

  const text = await locator.evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    for (const anchor of Array.from(clone.querySelectorAll("a[href]"))) {
      const marker = anchor.querySelector(".ds-markdown-cite")?.textContent?.replace(/\D+/g, "");
      anchor.replaceWith(document.createTextNode(marker ? `[${marker}]` : ""));
    }
    return clone.innerText.trim();
  }).catch(() => "");

  if (!text || looksLikeLoadingText(text)) {
    return "";
  }
  return normalizeAnswerText(text);
}

async function extractDoubaoAnswer(page: Page): Promise<string> {
  const locator = page.locator(".md-box-root").last();
  if ((await locator.count().catch(() => 0)) === 0) {
    return "";
  }

  const text = await locator.evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    const sourceMarkers = new Map<string, string>();
    for (const source of Array.from(clone.querySelectorAll(".container-DEV3jt"))) {
      const label = source.textContent?.trim().replace(/\s+/g, " ");
      if (!label) {
        source.remove();
        continue;
      }
      if (!sourceMarkers.has(label)) {
        sourceMarkers.set(label, String(sourceMarkers.size + 1));
      }
      source.replaceWith(document.createTextNode(`【${sourceMarkers.get(label)}】`));
    }
    clone.querySelectorAll(".spacing-ANk22f").forEach((element) => element.remove());
    return clone.innerText.trim();
  }).catch(() => "");

  if (!text || looksLikeLoadingText(text)) {
    return "";
  }
  return normalizeAnswerText(text);
}

async function extractYuanbaoAnswer(page: Page): Promise<string> {
  const locator = page.locator(".agent-chat__list__item--ai .hyc-common-markdown").last();
  if ((await locator.count().catch(() => 0)) === 0) {
    return "";
  }

  const text = await locator.evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    for (const refList of Array.from(clone.querySelectorAll(".hyc-common-markdown__ref-list"))) {
      const idxList = refList.querySelector("[data-idx-list]")?.getAttribute("data-idx-list") || "";
      const markers = idxList
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `【${item}】`)
        .join("");
      refList.replaceWith(document.createTextNode(markers));
    }
    return clone.innerText.trim();
  }).catch(() => "");

  if (!text || looksLikeLoadingText(text)) {
    return "";
  }
  return normalizeAnswerText(text);
}

async function extractKimiAnswer(page: Page): Promise<string> {
  const locator = page.locator(".chat-content-item-assistant .segment-assistant").last();
  if ((await locator.count().catch(() => 0)) === 0) {
    return "";
  }

  const text = await locator.evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    for (const selector of [
      ".toolcall-container",
      ".segment-assistant-actions",
      ".segment-429-tip",
      ".okc-cards-container"
    ]) {
      clone.querySelectorAll(selector).forEach((element) => element.remove());
    }
    return clone.innerText.trim();
  }).catch(() => "");

  if (!text || looksLikeLoadingText(text)) {
    return "";
  }
  return normalizeAnswerText(text);
}

async function extractDknowcAnswer(page: Page): Promise<string> {
  if (await isDknowcStillLoading(page)) {
    return "";
  }

  return page.locator(".czkj-robot:not(.chat-load-text) .czkj-msg").evaluateAll((nodes) => {
    const texts = nodes
      .map((node) => (node as HTMLElement).innerText?.trim() || "")
      .filter((text) =>
        text
        && !/您好，我是深知晓|很高兴为您服务|您可以试试/.test(text)
        && !/AI正在分析|AI 正在分析|AI 正翻阅|请稍等|正在研究/.test(text)
      );
    return texts.at(-1) || "";
  }).then((text) => normalizeAnswerText(text)).catch(() => "");
}

async function isDknowcStillLoading(page: Page): Promise<boolean> {
  const loading = page.locator(".czkj-robot.chat-load-text, .chat-load-text, .loading-header").last();
  if (await loading.isVisible().catch(() => false)) {
    const text = await loading.innerText().catch(() => "");
    return !text || looksLikeLoadingText(text) || text.includes("正在研究");
  }
  return false;
}

async function waitForAnswer(
  config: PlatformConfig,
  page: import("@playwright/test").Page,
  timeoutMs: number,
  previousAnswer = "",
  question = ""
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastText = "";
  let stableCount = 0;

  while (Date.now() < deadline) {
    if (config.name === "dknowc-chat" && await isDknowcStillLoading(page)) {
      await page.waitForTimeout(1500);
      continue;
    }

    const platformFailure = await detectPlatformFailure(config, page);
    if (platformFailure) {
      throw new Error(platformFailure);
    }

    const text = await extractAnswer(config, page);
    if (previousAnswer && text === previousAnswer) {
      await page.waitForTimeout(1500);
      continue;
    }
    if (question && looksLikeQuestionEcho(text, question)) {
      await page.waitForTimeout(1500);
      continue;
    }
    if (text && text === lastText) {
      stableCount += 1;
      if (stableCount >= 2) {
        return text;
      }
    } else if (text) {
      lastText = text;
      stableCount = 0;
    }
    await page.waitForTimeout(1500);
  }

  return lastText;
}

async function detectPlatformFailure(
  config: PlatformConfig,
  page: import("@playwright/test").Page
): Promise<string | undefined> {
  if (config.name !== "kimi") {
    return undefined;
  }

  const bodyText = await page.locator("body").innerText({ timeout: 2000 }).catch(() => "");
  const kimiBusyMarkers = [
    "聊的人太多",
    "Kimi有点累了",
    "高峰期算力不足",
    "请耐心等待",
    "429"
  ];
  if (kimiBusyMarkers.some((marker) => bodyText.includes(marker))) {
    return "Kimi returned a busy/429 response instead of an answer. Please retry later or switch model/account capacity.";
  }

  return undefined;
}

function looksLikeQuestionEcho(text: string, question: string): boolean {
  const normalizedText = normalizeComparableText(text);
  const normalizedQuestion = normalizeComparableText(question);
  if (!normalizedText || !normalizedQuestion) {
    return false;
  }
  return normalizedText === normalizedQuestion
    || (normalizedText.length <= normalizedQuestion.length * 1.2
      && (normalizedText.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedText)));
}

function normalizeComparableText(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

async function extractReferences(
  config: PlatformConfig,
  page: import("@playwright/test").Page
): Promise<Reference[]> {
  const selectors = config.selectors?.references || ["a[href]"];
  const seen = new Set<string>();
  const references: Reference[] = [];

  if (config.name === "dknowc-chat") {
    references.push(...(await extractDknowcReferences(page, config.url)));
    for (const reference of references) {
      seen.add(reference.normalizedUrl);
    }
  }

  if (config.name === "doubao") {
    references.push(...(await extractDoubaoReferences(page, config.url)));
    for (const reference of references) {
      seen.add(reference.normalizedUrl);
    }
  }

  if (config.name === "yuanbao") {
    references.push(...(await extractYuanbaoReferences(page, config.url)));
    for (const reference of references) {
      seen.add(reference.normalizedUrl);
    }
  }

  if (config.name === "deepseek") {
    references.push(...(await extractDeepSeekReferences(page, config.url)));
    for (const reference of references) {
      seen.add(reference.normalizedUrl);
    }
  }

  if (config.name === "qianwen") {
    references.push(...(await extractQianwenReferences(page, config.url)));
    for (const reference of references) {
      seen.add(reference.normalizedUrl);
    }
  }

  for (const selector of selectors) {
    const anchors = await page.locator(selector).evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const element = node as HTMLElement;
          const anchor = node as HTMLAnchorElement;
          const href = anchor.href || element.getAttribute("data-url") || element.getAttribute("href") || "";
          return {
            href,
            text: (element.textContent || "").trim()
          };
        })
        .filter((item) => item.href)
    );

    for (const anchor of anchors) {
      const normalizedUrl = normalizeUrl(anchor.href, config.url);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);
      references.push({
        title: anchor.text || normalizedUrl,
        url: normalizedUrl,
        normalizedUrl,
        text: anchor.text || undefined
      });
    }
  }

  return references;
}

async function extractQianwenReferences(
  page: Page,
  baseUrl: string
): Promise<Reference[]> {
  const sourceButton = page.locator("text=/\\d+篇来源/").last();
  if (await sourceButton.isVisible().catch(() => false)) {
    await sourceButton.click().catch(async () => {
      await page.locator("[class*='reference-wrap']").last().click().catch(() => undefined);
    });
    await page.waitForTimeout(1200);
  }

  const linked = await page.locator(
    "[role='dialog'] a[href], [data-radix-popper-content-wrapper] a[href], [class*='reference'] a[href], [class*='source'] a[href], [class*='search'] a[href]"
  ).evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const items: Reference[] = [];
    for (const node of nodes) {
      const anchor = node as HTMLAnchorElement;
      const rawUrl = anchor.href || anchor.getAttribute("href") || "";
      const text = anchor.textContent?.trim().replace(/\s+/g, " ") || "";
      if (!rawUrl || shouldIgnore(rawUrl, text)) {
        continue;
      }
      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);
      items.push({
        title: text || readableUrlTitle(normalizedUrl),
        url: normalizedUrl,
        normalizedUrl,
        marker: String(items.length + 1),
        text: text || undefined,
        snippet: anchor.closest("li, article, div")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 500) || undefined
      });
    }
    return items;

    function shouldIgnore(rawUrl: string, text: string): boolean {
      const lowerUrl = rawUrl.toLowerCase();
      return lowerUrl.includes("alicdn.com")
        || lowerUrl.includes("qianwen.com")
        || lowerUrl.includes("tongyi.aliyun.com")
        || lowerUrl.includes("terms.alicdn.com")
        || rawUrl.startsWith("#")
        || text === "用户协议"
        || text === "隐私政策";
    }

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const url = new URL(rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }

    function readableUrlTitle(rawUrl: string): string {
      try {
        const url = new URL(rawUrl);
        const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
        return path ? `${url.hostname}/${path}` : url.hostname;
      } catch {
        return rawUrl;
      }
    }
  }, baseUrl);

  if (linked.length > 0) {
    return linked;
  }

  const sourceCards = await page.locator("[data-c='refer_panel'][data-d='card'], [id^='deep-think-source-card']").evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const items: Reference[] = [];
    for (const node of nodes) {
      const element = node as HTMLElement;
      const rawPayload = element.getAttribute("data-click-extra")
        || element.getAttribute("data-exposure-extra")
        || element.getAttribute("data-log-params")
        || "";
      const payload = parsePayload(rawPayload);
      const rawUrl = payload.ref_url || payload.url || "";
      if (!rawUrl || shouldIgnore(rawUrl)) {
        continue;
      }
      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      const marker = payload.refer_num || element.querySelector("[class*='index']")?.textContent?.trim() || String(items.length + 1);
      const key = `${normalizedUrl}#${marker}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const title = payload.title
        || element.querySelector("[class*='title']")?.textContent?.trim()
        || readableUrlTitle(normalizedUrl);
      const source = element.querySelector("[class*='source'], [class*='name']")?.textContent?.trim().replace(/\s+/g, " ");
      const snippet = element.querySelector("[class*='content']")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 500);
      items.push({
        title,
        url: normalizedUrl,
        normalizedUrl,
        marker,
        text: source || title,
        snippet
      });
    }
    return items;

    function parsePayload(raw: string): Record<string, string> {
      if (!raw) {
        return {};
      }
      try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed ? parsed as Record<string, string> : {};
      } catch {
        return {};
      }
    }

    function shouldIgnore(rawUrl: string): boolean {
      const lowerUrl = rawUrl.toLowerCase();
      return lowerUrl.includes("alicdn.com")
        || lowerUrl.includes("qianwen.com")
        || lowerUrl.includes("tongyi.aliyun.com")
        || lowerUrl.includes("terms.alicdn.com")
        || rawUrl.startsWith("#");
    }

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const url = new URL(rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }

    function readableUrlTitle(rawUrl: string): string {
      try {
        const url = new URL(rawUrl);
        const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
        return path ? `${url.hostname}/${path}` : url.hostname;
      } catch {
        return rawUrl;
      }
    }
  }, baseUrl);

  if (sourceCards.length > 0) {
    return sourceCards;
  }

  return page.locator(".qk-markdown.qk-markdown-react, #qk-markdown-react").last().evaluate((node, base) => {
    const root = node as HTMLElement;
    const items: Reference[] = [];
    const text = root.innerText || "";
    const sourceHeading = Array.from(root.querySelectorAll("strong, h3, h2, h4, p, div"))
      .find((element) => /参考文献|政策来源|资料来源|来源/.test(element.textContent || ""));
    const candidates = sourceHeading
      ? Array.from(root.querySelectorAll("ol li, ul li")).filter((element) => {
        const rect = element.getBoundingClientRect();
        const headingRect = sourceHeading.getBoundingClientRect();
        return rect.top >= headingRect.top;
      })
      : [];

    for (const candidate of candidates) {
      const title = candidate.textContent?.trim().replace(/\s+/g, " ");
      if (!title || title.length < 4) {
        continue;
      }
      const marker = String(items.length + 1);
      const url = `${base}#qianwen-source-${marker}`;
      items.push({
        title,
        url,
        normalizedUrl: url,
        marker,
        text: title,
        snippet: title
      });
    }

    if (items.length === 0) {
      const sourceLines = text.split(/\n+/).filter((line) =>
        /《.+》|政策解读|发布(?:日期)?|来源/.test(line)
      );
      for (const line of sourceLines.slice(0, 12)) {
        const marker = String(items.length + 1);
        const url = `${base}#qianwen-source-${marker}`;
        items.push({
          title: line.trim(),
          url,
          normalizedUrl: url,
          marker,
          text: line.trim(),
          snippet: line.trim()
        });
      }
    }

    return items;
  }, baseUrl).catch(() => []);
}

async function extractDoubaoReferences(
  page: Page,
  baseUrl: string
): Promise<Reference[]> {
  return page.locator(".md-box-root a[href]").evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const sourceMarkers = new Map<string, string>();
    const items: Reference[] = [];

    for (const node of nodes) {
      const anchor = node as HTMLAnchorElement;
      const rawUrl = anchor.href || anchor.getAttribute("href") || "";
      if (!rawUrl) {
        continue;
      }

      const sourceLabel = findSourceLabel(anchor);
      const markerKey = sourceLabel || rawUrl;
      const isFirstMarkerUse = !sourceMarkers.has(markerKey);
      if (isFirstMarkerUse) {
        sourceMarkers.set(markerKey, String(sourceMarkers.size + 1));
      }

      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);

      const title = anchor.textContent?.trim() || sourceLabel || readableUrlTitle(normalizedUrl);
      items.push({
        title,
        url: normalizedUrl,
        normalizedUrl,
        marker: isFirstMarkerUse ? sourceMarkers.get(markerKey) : undefined,
        text: sourceLabel || title,
        snippet: anchor.closest("li, p, div")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 500) || undefined
      });
    }

    return items;

    function findSourceLabel(anchor: HTMLAnchorElement): string | undefined {
      let element: Element | null = anchor;
      for (let depth = 0; depth < 4 && element; depth += 1) {
        let sibling = element.nextElementSibling;
        while (sibling) {
          if (sibling.className.toString().includes("container-DEV3jt")) {
            const label = sibling.textContent?.trim().replace(/\s+/g, " ");
            if (label) {
              return label;
            }
          }
          sibling = sibling.nextElementSibling;
        }
        const nested = element.querySelector(".container-DEV3jt");
        const label = nested?.textContent?.trim().replace(/\s+/g, " ");
        if (label) {
          return label;
        }
        element = element.parentElement;
      }
      return undefined;
    }

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const wrapped = new URL(rawUrl, baseUrl);
        const target = wrapped.searchParams.get("target");
        const url = new URL(target || rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }

    function readableUrlTitle(rawUrl: string): string {
      try {
        const url = new URL(rawUrl);
        const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
        return path ? `${url.hostname}/${path}` : url.hostname;
      } catch {
        return rawUrl;
      }
    }
  }, baseUrl);
}

async function extractDeepSeekReferences(
  page: Page,
  baseUrl: string
): Promise<Reference[]> {
  return page.locator(".ds-assistant-message-main-content a[href]").evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const items: Reference[] = [];
    for (const node of nodes) {
      const anchor = node as HTMLAnchorElement;
      const rawUrl = anchor.href || anchor.getAttribute("href") || "";
      if (!rawUrl) {
        continue;
      }

      const marker = anchor.querySelector(".ds-markdown-cite")?.textContent?.replace(/\D+/g, "") || undefined;
      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);

      const title = anchor.getAttribute("title") || readableUrlTitle(normalizedUrl);
      const containerText = cleanDeepSeekCitationText(
        anchor.closest("p, li, div")?.textContent?.trim().replace(/\s+/g, " ") || ""
      );
      items.push({
        title,
        url: normalizedUrl,
        normalizedUrl,
        marker,
        text: marker ? `[${marker}]` : undefined,
        snippet: containerText ? containerText.slice(0, 500) : undefined
      });
    }
    return items;

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const url = new URL(rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }

    function cleanDeepSeekCitationText(text: string): string {
      return text.replace(/-(\d{1,4})/g, "[$1]");
    }

    function readableUrlTitle(rawUrl: string): string {
      try {
        const url = new URL(rawUrl);
        const path = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
        return path ? `${url.hostname}/${path}` : url.hostname;
      } catch {
        return rawUrl;
      }
    }
  }, baseUrl);
}

async function extractYuanbaoReferences(
  page: Page,
  baseUrl: string
): Promise<Reference[]> {
  const sourceTool = page.locator("#search-guide-tool, [aria-label*='引用']").last();
  if (await sourceTool.isVisible().catch(() => false)) {
    await sourceTool.click().catch(() => undefined);
    await page.waitForTimeout(1000);
  }

  return page.locator(".hyc-common-markdown__ref_card").evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const items: Reference[] = [];
    for (const node of nodes) {
      const element = node as HTMLElement;
      const marker = element.getAttribute("data-idx") || undefined;
      const rawUrl = element.getAttribute("data-url") || `${base}#source-${marker || items.length + 1}`;
      const title = element.querySelector(".hyc-common-markdown__ref_card-title")?.textContent?.trim()
        || element.textContent?.trim()
        || rawUrl;
      const source = element.querySelector(".hyc-common-markdown__ref_card-foot__source_txt")?.textContent?.trim();
      const snippet = element.textContent?.trim().replace(/\s+/g, " ");
      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);
      items.push({
        title,
        url: normalizedUrl,
        normalizedUrl,
        marker,
        text: source || title,
        snippet: snippet && snippet !== title ? snippet.slice(0, 500) : undefined
      });
    }
    return items;

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const url = new URL(rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }
  }, baseUrl);
}

async function extractDknowcReferences(
  page: import("@playwright/test").Page,
  baseUrl: string
): Promise<Reference[]> {
  return page.locator(".chat-jb, .chatsse-note-item").evaluateAll((nodes, base) => {
    const seen = new Set<string>();
    const items: Reference[] = [];
    for (const node of nodes) {
      const element = node as HTMLElement;
      const titleElement = element.querySelector(".chat-jb-title-info, .czkjTitle");
      const urlElement = element.querySelector("[data-url]") as HTMLElement | null;
      const scoreElement = element.querySelector("[data-id], .chatsse-note-score-id, .hasColor") as HTMLElement | null;
      const snippetElement = element.querySelector(".scoresText, .jb-original-item") as HTMLElement | null;
      const rawUrl = urlElement?.getAttribute("data-url") || "";
      if (!rawUrl) {
        continue;
      }
      const normalizedUrl = normalizeInBrowser(rawUrl, base as string);
      const marker = scoreElement?.getAttribute("data-id") || scoreElement?.textContent?.trim() || undefined;
      const key = `${normalizedUrl}#${marker || ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({
        title: titleElement?.textContent?.trim() || rawUrl,
        url: rawUrl,
        normalizedUrl,
        marker,
        text: titleElement?.textContent?.trim() || undefined,
        snippet: snippetElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 500) || undefined
      });
    }
    return items;

    function normalizeInBrowser(rawUrl: string, baseUrl: string): string {
      try {
        const url = new URL(rawUrl, baseUrl);
        url.hash = "";
        url.hostname = url.hostname.toLowerCase();
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        if (url.pathname === "/") {
          url.pathname = "";
        }
        return url.toString().replace(/\/$/, "");
      } catch {
        return rawUrl.trim();
      }
    }
  }, baseUrl);
}

async function pageLooksLikeGate(page: import("@playwright/test").Page): Promise<boolean> {
  const title = (await page.title().catch(() => "")).toLowerCase();
  if (looksLikeLoginText(title)) {
    return true;
  }
  const bodyText = (await page.locator("body").innerText({ timeout: 2000 }).catch(() => "")).slice(0, 2000);
  return looksLikeLoginText(bodyText);
}

function looksLikeLoginText(value: string): boolean {
  const text = value.toLowerCase();
  const markers = [
    "登录",
    "登陆",
    "手机号",
    "验证码",
    "滑动验证",
    "人机验证",
    "just a moment",
    "sign in",
    "log in",
    "verify you are human"
  ];
  return markers.some((marker) => text.includes(marker));
}

async function handleVerificationIfNeeded(
  config: PlatformConfig,
  page: import("@playwright/test").Page,
  options: CaptureOptions
): Promise<boolean> {
  if (!(await pageLooksLikeVerification(page))) {
    return true;
  }
  if (!options.headed || !options.interactive) {
    return false;
  }
  console.log(`${config.label} requires verification. Complete it in Chrome, then press Enter here to continue.`);
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => resolve());
  });
  await page.waitForTimeout(1000);
  return !(await pageLooksLikeVerification(page));
}

async function pageLooksLikeVerification(page: import("@playwright/test").Page): Promise<boolean> {
  const bodyText = await page.locator("body").innerText({ timeout: 2000 }).catch(() => "");
  const markers = [
    "请选择所有符合",
    "拖拽到这里",
    "验证码",
    "滑动验证",
    "人机验证",
    "captcha",
    "verify"
  ];
  return markers.some((marker) => bodyText.toLowerCase().includes(marker.toLowerCase()));
}

function looksLikeLoadingText(value: string): boolean {
  const markers = [
    "AI正在分析",
    "AI 正在分析",
    "AI 正翻阅",
    "AI正在溯源",
    "正在搜索网页",
    "再等一下",
    "请稍等",
    "loading"
  ];
  return markers.some((marker) => value.includes(marker));
}

function failure(
  config: PlatformConfig,
  status: "failed" | "timeout" | "login_required" | "verification_required",
  started: number,
  error: string,
  artifacts?: PlatformResult["artifacts"]
): PlatformResult {
  return {
    platform: config.name,
    label: config.label,
    url: config.url,
    status,
    answerMarkdown: "",
    references: [],
    artifacts,
    durationMs: Date.now() - started,
    error
  };
}

async function saveArtifacts(
  page: import("@playwright/test").Page,
  artifactDir: string,
  outDir: string
): Promise<NonNullable<PlatformResult["artifacts"]>> {
  const screenshotPath = join(artifactDir, "screenshot.png");
  const htmlPath = join(artifactDir, "page.html");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeTextFile(htmlPath, await page.content());
  return {
    screenshot: relativeArtifact(screenshotPath, outDir),
    html: relativeArtifact(htmlPath, outDir)
  };
}

function relativeArtifact(path: string, outDir: string): string {
  return path.replace(`${outDir}/`, "");
}
