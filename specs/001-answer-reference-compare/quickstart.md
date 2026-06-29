# Quickstart: Answer Reference Compare

## Prerequisites

- Node.js 20 or newer
- npm

## Install

```bash
npm install
npx playwright install chromium
```

## Generate a sample report

```bash
npm run compare -- report --input tests/fixtures/sample-results.json --out runs/sample
```

Expected result:

- `runs/sample/report.html` opens directly in a browser.
- `runs/sample/report.md` previews in GitHub.
- `runs/sample/results.json` contains the exact data rendered in the report.

## List built-in platforms

```bash
npm run compare -- platforms
```

Expected result:

- The command lists `dknowc-chat` and `generic`.

## Try browser capture with DKnowC Chat

```bash
npm run compare -- run \
  --question "请简要说明这个问题，并列出参考文献" \
  --platform dknowc-chat=https://yun.dknowc.cn/wlcb/dknowc-chat/ \
  --out runs/dknowc-manual \
  --headed
```

If the site asks for login, complete login in the opened browser. The tool uses a
local profile so later runs can reuse the user-controlled session.

## Validate

```bash
npm test
npm run build
```
