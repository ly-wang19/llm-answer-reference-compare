# LLM Answer & References Compare

本地 Playwright 工具，用来自动访问多个 AI 聊天网站，采集同一个问题的回答与参考来源，并生成直观的横向对比报告。

This is a local Playwright-based tool for collecting answers and cited references from multiple AI chat products, then rendering a side-by-side comparison report.

> This project compares **answers and references only**. It is not a fact-checking verdict engine.
> 本项目只做“答案与参考来源对比”，不做事实核验结论判定。

## Features

- Multi-platform capture with persistent local browser profiles
- Manual login, QR code, slider CAPTCHA, and verification handoff
- Answer extraction, reference extraction, and text-only source fallback
- HTML report, Markdown report, and machine-readable JSON
- Built-in adapters plus generic URL support
- Spec Kit artifacts and a reusable Codex Skill under `skills/`

## Supported Built-In Targets

| Target | Platform | Status |
| --- | --- | --- |
| `doubao` | 豆包 | Locally verified |
| `yuanbao` | 元宝 | Locally verified |
| `deepseek` | DeepSeek | Locally verified |
| `qianwen` | 千问 | Locally verified, text-source fallback supported |
| `dknowc-chat` | 深知晓 / DKnowC Chat | Locally verified |
| `zhipu` | 智谱清言 | Adapter available, may require CAPTCHA/login |
| `kimi` | Kimi | Adapter available, may return busy/capacity responses |
| `chatgpt` | ChatGPT | Adapter available, login usually required |
| `claude` | Claude | Adapter available, login usually required |
| `gemini` | Gemini | Adapter available, login usually required |
| `generic` | Any URL | Best-effort capture |

Verified means the adapter has produced a local answer/reference report in this workspace. It does not guarantee that the provider will always expose citations, allow automation, or have capacity at runtime.

## Install

```bash
npm install
npx playwright install chromium
```

The tool uses your local Chrome channel for persistent sessions.

## Quick Start

Generate a sample report:

```bash
npm run compare -- report --input tests/fixtures/sample-results.json --out runs/sample
```

Open:

```text
runs/sample/report.html
```

List built-in platforms:

```bash
npm run compare -- platforms
```

Run a single platform:

```bash
npm run compare -- run \
  --question "请简要回答：广州公积金贷款政策有哪些最新要点？如果页面支持参考文献，请列出参考文献。" \
  --platform deepseek \
  --out runs/deepseek-single \
  --timeout 180000 \
  --headed \
  --interactive
```

Run multiple platforms:

```bash
npm run compare -- run \
  --question "你的问题" \
  --platform doubao \
  --platform yuanbao \
  --platform deepseek \
  --platform qianwen \
  --platform dknowc-chat \
  --out runs/full-sweep \
  --timeout 180000 \
  --headed \
  --interactive
```

Use a custom website:

```bash
npm run compare -- run \
  --question "What sources does this answer cite?" \
  --platform my-chat=https://example.com/chat \
  --out runs/my-chat \
  --headed \
  --interactive
```

## Login And Verification

Open a persistent browser profile:

```bash
npm run compare -- login --platform qianwen
```

Complete login, QR scan, slider CAPTCHA, or other verification in the visible browser. Press Enter in the terminal when done. Profiles are stored under `profiles/` and ignored by git.

If a capture reports `login_required` or `verification_required`, run the login command for that platform, complete the human step, and re-run capture.

## Outputs

Each run directory contains:

- `report.html`: visual side-by-side report
- `report.md`: GitHub-friendly report
- `results.json`: stable machine-readable data
- `artifacts/<platform>/screenshot.png`: screenshot for debugging
- `artifacts/<platform>/page.html`: captured page HTML for selector debugging

`runs/` is ignored by git because it may contain private prompts, answers, screenshots, and session data.

The HTML report links inline citation markers like `[1]` to the captured per-platform reference list whenever the platform exposes markers. If a platform only renders plain-text sources, the tool preserves those as text-only references so they still appear in the comparison.

## Safety

- Use your own accounts and normal access.
- Do not bypass CAPTCHA, paywalls, access controls, or rate limits.
- Do not commit `profiles/`, `runs/`, cookies, traces, screenshots, or private captured HTML.
- Respect each platform's terms and local laws.

## Development

```bash
npm run build
npm test
```

Adapter code lives in:

- `src/capture/platform-registry.ts`
- `src/capture/generic-chat.ts`
- `src/capture/providers/dknowc-chat.ts`

Report code lives in:

- `src/report/html-report.ts`
- `src/report/markdown-report.ts`
- `src/report/reference-matrix.ts`

Spec Kit artifacts live in:

- `specs/001-answer-reference-compare/`

Codex Skill packaging lives in:

- `skills/llm-answer-reference-compare/`

## Contributing

1. Add or improve one platform adapter at a time.
2. Run a headed capture and inspect `results.json`, `report.html`, screenshot, and page HTML.
3. Keep selectors narrow enough to avoid sidebars, history lists, and app chrome.
4. Add special extraction only when generic selectors cannot capture clean answers or sources.
5. Run `npm run build` and `npm test`.

## 中文说明

这个项目适合做 AI 回答评测、引用来源展示、竞品观察和内部产品对比。它不会判断哪个平台“事实正确”，只负责把各平台回答和它们给出的参考来源尽量完整地抓下来，并生成可视化报告。

如果平台需要登录、扫码或验证码，工具会打开可见浏览器让人手动完成。自动化不会绕过任何验证。
