# Claude Code Guide

This repository is a local Playwright tool for comparing AI chat answers and cited references across platforms. It compares answers and references only; it does not produce fact-checking verdicts.

## Start Here

1. Read `README.md` first. Use `README.en.md` if English is preferred.
2. Install dependencies if needed:

```bash
npm install
npx playwright install chromium
```

3. Verify the project:

```bash
npm run build
npm test
```

## Run A Multi-Platform Capture

Use headed interactive mode so the user can handle login, QR codes, sliders, CAPTCHA, or other verification steps.

```bash
npm run compare -- run \
  --question "请结合2026年湖北高考招生信息，简要回答：湖北考生高考700分大概能上什么学校？请说明需要区分物理类/历史类、位次和志愿批次，并尽量列出参考来源。" \
  --platform doubao \
  --platform yuanbao \
  --platform deepseek \
  --platform qianwen \
  --platform dknowc-chat \
  --out runs/hubei-gaokao-700 \
  --timeout 180000 \
  --headed \
  --interactive
```

The report will be written to:

```text
runs/<run-name>/report.html
```

## Login And Verification

If a platform requires login or verification, do not bypass it. Pause and ask the user to complete the step in the visible browser.

To pre-login a platform:

```bash
npm run compare -- login --platform qianwen
```

After the user finishes login in Chrome, they should press Enter in the terminal. Profiles are stored under `profiles/`.

## Inspect Results

After a run, check:

- `runs/<run-name>/results.json`
- `runs/<run-name>/report.html`
- `runs/<run-name>/artifacts/<platform>/screenshot.png`
- `runs/<run-name>/artifacts/<platform>/page.html`

For each platform, confirm:

- `status` is `success`
- `answerMarkdown` is non-empty
- references are captured when the platform exposes them
- inline citation markers in the answer link to the per-platform reference list

## Safety Rules

- Do not bypass CAPTCHA, paywalls, access controls, or rate limits.
- Do not commit `profiles/`, `runs/`, screenshots, traces, cookies, captured private HTML, or `.env` files.
- Use the user's own accounts and normal access.
- Keep this project scoped to answer/reference comparison, not fact-checking conclusions.

## Useful Commands

```bash
npm run compare -- platforms
npm run compare -- report --input tests/fixtures/sample-results.json --out runs/sample
npm run build
npm test
npm pack --dry-run
```
