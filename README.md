# LLM Answer & References Compare

[English](README.en.md)

本地 Playwright 工具，用来自动访问多个 AI 聊天网站，采集同一个问题的回答与参考来源，并生成直观的横向对比报告。

> 本项目只做“答案与参考来源对比”，不做事实核验结论判定。

Claude Code 用户可以直接阅读 [CLAUDE.md](CLAUDE.md) 获取运行说明。

## 功能特点

- 支持多平台采集，使用本地持久化浏览器 profile 保留登录状态
- 支持人工登录、扫码、滑块验证码和验证交接
- 采集回答、参考来源、逐句引用标记，以及纯文本来源兜底
- 生成 HTML 横向对比报告、Markdown 报告和机器可读 JSON
- 内置多个平台适配器，也支持自定义 URL
- 包含 Spec Kit 产物和可复用的 Codex Skill

## 已内置平台

| Target | 平台 | 状态 |
| --- | --- | --- |
| `doubao` | 豆包 | 已本地验证 |
| `yuanbao` | 元宝 | 已本地验证 |
| `deepseek` | DeepSeek | 已本地验证 |
| `qianwen` | 千问 | 已本地验证，支持纯文本来源兜底 |
| `dknowc-chat` | 深知晓 / DKnowC Chat | 已本地验证 |
| `zhipu` | 智谱清言 | 已有适配器，可能需要验证码或登录 |
| `kimi` | Kimi | 已有适配器，可能遇到繁忙或容量限制 |
| `chatgpt` | ChatGPT | 已有适配器，通常需要登录 |
| `claude` | Claude | 已有适配器，通常需要登录 |
| `gemini` | Gemini | 已有适配器，通常需要登录 |
| `generic` | 任意 URL | 尽力采集 |

“已本地验证”表示该适配器已经在本工作区成功生成过答案和来源报告。这不保证平台永远暴露引用、允许自动化访问，或运行时一定有容量。

## 安装

```bash
npm install
npx playwright install chromium
```

工具会使用本地 Chrome channel 来保存持久化会话。

## 快速开始

生成示例报告：

```bash
npm run compare -- report --input tests/fixtures/sample-results.json --out runs/sample
```

打开：

```text
runs/sample/report.html
```

查看内置平台：

```bash
npm run compare -- platforms
```

运行单个平台：

```bash
npm run compare -- run \
  --question "请简要回答：广州公积金贷款政策有哪些最新要点？如果页面支持参考文献，请列出参考文献。" \
  --platform deepseek \
  --out runs/deepseek-single \
  --timeout 180000 \
  --headed \
  --interactive
```

运行多个平台：

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

使用自定义网站：

```bash
npm run compare -- run \
  --question "请回答这个问题并列出引用来源" \
  --platform my-chat=https://example.com/chat \
  --out runs/my-chat \
  --headed \
  --interactive
```

## 作为 Codex Skill 使用

如果你使用 Codex，可以把仓库内置的 Skill 复制到 Codex skills 目录：

```bash
mkdir -p ~/.codex/skills
cp -R skills/llm-answer-reference-compare ~/.codex/skills/
```

然后在本仓库目录启动 Codex，并用自然语言调用：

```text
Use $llm-answer-reference-compare to compare Doubao, Yuanbao, DeepSeek, Qianwen, and DKnowC Chat for this question:
请简要回答：广州公积金贷款政策有哪些最新要点？如果页面支持参考文献，请列出参考文献。
```

Skill 会指导 Codex 调用本项目 CLI、遇到登录或验证码时暂停交接、检查采集结果，并重新生成报告。Skill 不是替代 CLI 的独立服务，而是 Codex 使用本仓库的操作说明。

## 登录与验证

打开某个平台的持久化浏览器 profile：

```bash
npm run compare -- login --platform qianwen
```

在可见浏览器里完成登录、扫码、滑块验证码或其他人工验证。完成后回到终端按 Enter。profile 会保存在 `profiles/`，并被 git 忽略。

如果采集结果显示 `login_required` 或 `verification_required`，先运行对应平台的 `login` 命令，完成验证后再重新采集。

## 输出文件

每次运行目录会包含：

- `report.html`：可视化横向对比报告
- `report.md`：适合 GitHub 阅读的 Markdown 报告
- `results.json`：稳定的机器可读数据
- `artifacts/<platform>/screenshot.png`：用于调试的截图
- `artifacts/<platform>/page.html`：用于调试选择器的页面 HTML

`runs/` 已被 git 忽略，因为它可能包含私有问题、回答、截图和会话数据。

HTML 报告会把 `[1]`、`【1】` 等逐句引用标记链接到对应平台的参考来源列表。如果平台只提供纯文本来源，工具会保留这些文本来源，让它们仍然出现在对比报告里。

## 安全边界

- 使用你自己的账号和正常访问权限
- 不绕过验证码、付费墙、访问控制或限流
- 不提交 `profiles/`、`runs/`、cookies、trace、截图或私有页面 HTML
- 遵守各平台服务条款和当地法律

## 开发

```bash
npm run build
npm test
```

平台适配代码：

- `src/capture/platform-registry.ts`
- `src/capture/generic-chat.ts`
- `src/capture/providers/dknowc-chat.ts`

报告代码：

- `src/report/html-report.ts`
- `src/report/markdown-report.ts`
- `src/report/reference-matrix.ts`

Spec Kit 产物：

- `specs/001-answer-reference-compare/`

Codex Skill：

- `skills/llm-answer-reference-compare/`

## 贡献

1. 一次只新增或改进一个平台适配器。
2. 使用 headed interactive 模式运行平台采集。
3. 检查 `results.json`、`report.html`、截图和页面 HTML。
4. 选择器要尽量窄，避免采集侧边栏、历史记录和页面外壳。
5. 只有通用选择器无法干净采集时，再添加平台专用提取逻辑。
6. 提交前运行 `npm run build` 和 `npm test`。
