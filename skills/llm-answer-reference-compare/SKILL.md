---
name: llm-answer-reference-compare
description: Capture, compare, and package answer/reference reports from multiple AI chat websites with Playwright. Use when Codex needs to run or improve this repository, add adapters for platforms such as Doubao, Yuanbao, DeepSeek, Qianwen, Zhipu, Kimi, ChatGPT, Claude, Gemini, or private chat products, handle login/CAPTCHA handoffs, extract answers and citations, generate comparison reports, or prepare the project for open-source release.
---

# LLM Answer Reference Compare

## Core Workflow

1. Inspect the current repository state before relying on memory.
2. Run platform captures one at a time when debugging adapters:

```bash
npm run compare -- run --question "<question>" --platform <platform> --out runs/<platform>-single --timeout 180000 --headed --interactive
```

3. If a page requires login, QR scan, slider CAPTCHA, or human verification, stop automation at the visible browser and tell the user exactly which platform needs action. Never bypass access controls.
4. After the user confirms completion, save the profile with:

```bash
npm run compare -- login --platform <platform>
```

5. Re-run the capture, inspect `runs/<name>/results.json`, `report.html`, screenshots, and captured HTML.
6. Treat a platform as adapted only when it returns a non-empty answer, captures available references or explicit text-only sources, and the report renders cleanly.

## Adapter Guidance

- Prefer platform-specific selectors in `src/capture/platform-registry.ts` before adding generic behavior.
- Add special extraction in `src/capture/generic-chat.ts` when a platform uses custom citation components, folded source panels, tracking URLs, or Slate/ProseMirror editors.
- Keep selectors narrow enough to avoid sidebars, history lists, terms links, and app chrome.
- Normalize citation markers so answers can link to per-platform references in `report.html`.
- For pages that expose only textual source lists, create stable pseudo-source anchors rather than reporting zero references.

## Report Expectations

- The report is answer/reference comparison, not a fact-checking verdict product.
- Preserve side-by-side answers, per-platform references, and a reference matrix.
- Keep citations visible and clickable when markers are available.
- Make failures explicit: `login_required`, `verification_required`, or `failed`.

## Verification

Run these after code changes:

```bash
npm run build
npm test
```

For adapter changes, also run the affected platform in headed mode and inspect:

- `results.json`: `status`, `answerMarkdown.length`, `references.length`
- `report.html`: answer boundaries, citation links, reference cards
- screenshot and page HTML for missed selectors or noisy captures

## Open-Source Packaging

- Do not commit `profiles/`, `runs/`, cookies, traces, screenshots, or captured private HTML.
- Keep README bilingual and clear about safety boundaries.
- Include setup, login, platform list, custom URL usage, troubleshooting, and contribution guidance.
- Use Spec Kit artifacts under `specs/` as planning context, but keep the CLI and report behavior authoritative.
