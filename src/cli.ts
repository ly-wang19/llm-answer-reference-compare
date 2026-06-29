#!/usr/bin/env node
import { Command } from "commander";
import { chromium } from "@playwright/test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { captureGenericChat } from "./capture/generic-chat.js";
import { captureDknowcChat } from "./capture/providers/dknowc-chat.js";
import {
  listPlatformConfigs,
  resolvePlatformTarget,
  type PlatformConfig
} from "./capture/platform-registry.js";
import { renderHtmlReport } from "./report/html-report.js";
import { renderMarkdownReport } from "./report/markdown-report.js";
import { parseRunResult, type RunResult } from "./schema/result.js";
import { ensureDir, readJsonFile, writeJsonFile, writeTextFile } from "./utils/filesystem.js";

export async function generateReportFiles(run: RunResult, outDir: string): Promise<void> {
  await ensureDir(outDir);
  await writeJsonFile(join(outDir, "results.json"), run);
  await writeTextFile(join(outDir, "report.html"), renderHtmlReport(run));
  await writeTextFile(join(outDir, "report.md"), renderMarkdownReport(run));
}

async function reportCommand(input: string, outDir: string): Promise<void> {
  const run = parseRunResult(await readJsonFile(input));
  await generateReportFiles(run, outDir);
  console.log(`Report written to ${outDir}`);
}

async function loginCommand(platformTarget: string): Promise<void> {
  const config = resolvePlatformTarget(platformTarget);
  const profileDir = join(process.cwd(), "profiles", config.profile);
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: false
  });
  const page = await context.newPage();
  await page.goto(config.url, { waitUntil: "domcontentloaded" });
  console.log(`Opened ${config.label} login window.`);
  console.log("Complete login in Chrome, then press Enter here to close the session.");

  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => resolve());
  });

  await context.close();
  console.log(`Saved browser profile for ${config.label}: profiles/${config.profile}`);
}

async function runCommand(options: {
  question: string;
  platform: string[];
  out: string;
  headed?: boolean;
  interactive?: boolean;
  timeout?: string;
}): Promise<void> {
  const timeoutMs = Number(options.timeout || 30000);
  const configs = options.platform.map(resolvePlatformTarget);
  const platforms = [];

  for (const config of configs) {
    console.log(`Capturing ${config.label} (${config.url})`);
    const result = await withPlatformTimeout(
      config,
      capturePlatform(config, {
        question: options.question,
        outDir: options.out,
        headed: Boolean(options.headed),
        interactive: Boolean(options.interactive),
        timeoutMs
      }),
      timeoutMs + 10000
    );
    platforms.push(result);
  }

  const run: RunResult = parseRunResult({
    schemaVersion: "1",
    question: options.question,
    createdAt: new Date().toISOString(),
    platforms
  });
  await generateReportFiles(run, options.out);
  console.log(`Report written to ${options.out}`);
}

async function capturePlatform(
  config: PlatformConfig,
  options: Parameters<typeof captureGenericChat>[1]
) {
  if (config.adapter === "dknowc-chat") {
    return captureDknowcChat(config, options);
  }
  return captureGenericChat(config, options);
}

async function withPlatformTimeout(
  config: PlatformConfig,
  promise: Promise<Awaited<ReturnType<typeof captureGenericChat>>>,
  timeoutMs: number
) {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<Awaited<ReturnType<typeof captureGenericChat>>>(
    (resolve) => {
      timeout = setTimeout(() => {
        resolve({
          platform: config.name,
          label: config.label,
          url: config.url,
          status: "timeout",
          answerMarkdown: "",
          references: [],
          error: `Platform capture exceeded ${timeoutMs}ms.`
        });
      }, timeoutMs);
    }
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function createProgram(): Command {
  const program = new Command();
  program
    .name("llm-compare")
    .description("Collect and compare AI answers and cited references.")
    .version("0.1.0");

  program
    .command("report")
    .description("Generate report artifacts from an existing results.json file.")
    .requiredOption("--input <path>", "Path to results JSON")
    .requiredOption("--out <dir>", "Output run directory")
    .action(async (options) => {
      await reportCommand(options.input, options.out);
    });

  program
    .command("run")
    .description("Capture answers from platform websites and generate a report.")
    .requiredOption("--question <question>", "Question to submit")
    .requiredOption("--platform <target>", "Platform name or name=url target", collect, [])
    .requiredOption("--out <dir>", "Output run directory")
    .option("--headed", "Open visible browser windows")
    .option("--interactive", "Pause for manual login, QR, captcha, or verification handling")
    .option("--timeout <ms>", "Per-page timeout in milliseconds", "30000")
    .action(async (options) => {
      await runCommand(options);
    });

  program
    .command("login")
    .description("Open a persistent headed browser session for manual platform login.")
    .requiredOption("--platform <target>", "Platform name or name=url target")
    .action(async (options) => {
      await loginCommand(options.platform);
    });

  program
    .command("platforms")
    .description("List built-in platform targets.")
    .action(() => {
      for (const platform of listPlatformConfigs()) {
        console.log(`${platform.name}\t${platform.label}\t${platform.url || "(custom URL)"}`);
      }
    });

  return program;
}

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  createProgram().parseAsync(process.argv).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
