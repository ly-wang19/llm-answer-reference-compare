# LLM Answer & References Compare

[中文](README.md)

This is a local Playwright-based tool for collecting answers and cited references from multiple AI chat products, then rendering a side-by-side comparison report.

> This project compares answers and references only. It is not a fact-checking verdict engine.

## Features

- Multi-platform capture with persistent local browser profiles
- Manual login, QR code, slider CAPTCHA, and verification handoff
- Answer extraction, reference extraction, sentence-level citation markers, and text-only source fallback
- HTML side-by-side report, Markdown report, and machine-readable JSON
- Built-in adapters plus generic URL support
- Spec Kit artifacts and a reusable Codex Skill

## Supported Built-In Targets

| Target | Platform | Status |
| --- | --- | --- |
| `doubao` | Doubao | Locally verified |
| `yuanbao` | Yuanbao | Locally verified |
| `deepseek` | DeepSeek | Locally verified |
| `qianwen` | Qianwen | Locally verified, text-source fallback supported |
| `dknowc-chat` | DKnowC Chat | Locally verified |
| `zhipu` | Zhipu Qingyan | Adapter available, may require CAPTCHA or login |
| `kimi` | Kimi | Adapter available, may return busy or capacity responses |
| `chatgpt` | ChatGPT | Adapter available, login usually required |
| `claude` | Claude | Adapter available, login usually required |
| `gemini` | Gemini | Adapter available, login usually required |
| `generic` | Any URL | Best-effort capture |

“Locally verified” means the adapter has produced an answer/reference report in this workspace. It does not guarantee that the provider will always expose citations, allow automation, or have capacity at runtime.

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
  --question "What are the latest key points of Guangzhou housing provident fund loan policies? If references are available, list them." \
  --platform deepseek \
  --out runs/deepseek-single \
  --timeout 180000 \
  --headed \
  --interactive
```

Run multiple platforms:

```bash
npm run compare -- run \
  --question "Your question" \
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

## Use As A Codex Skill

If you use Codex, install the bundled skill by copying it into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R skills/llm-answer-reference-compare ~/.codex/skills/
```

Then start a Codex session in this repository and call the skill in natural language:

```text
Use $llm-answer-reference-compare to compare Doubao, Yuanbao, DeepSeek, Qianwen, and DKnowC Chat for this question:
What are the latest key points of Guangzhou housing provident fund loan policies? If references are available, list them.
```

Codex will use the skill instructions to run the local CLI, pause for manual login or verification when needed, inspect the captured artifacts, and regenerate the report. The skill is not a standalone service. It is an operating guide for Codex to use this repository.

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

The HTML report links inline citation markers like `[1]` or `【1】` to the captured per-platform reference list whenever the platform exposes markers. If a platform only renders plain-text sources, the tool preserves those as text-only references so they still appear in the comparison.

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
