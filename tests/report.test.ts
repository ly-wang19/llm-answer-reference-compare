import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReferenceMatrix } from "../src/report/reference-matrix.js";
import { renderHtmlReport } from "../src/report/html-report.js";
import { renderMarkdownReport } from "../src/report/markdown-report.js";
import { parseRunResult } from "../src/schema/result.js";
import { generateReportFiles } from "../src/cli.js";
import sample from "./fixtures/sample-results.json";

describe("report generation", () => {
  const run = parseRunResult(sample);

  it("renders sample answers in HTML and Markdown", () => {
    const html = renderHtmlReport(run);
    const markdown = renderMarkdownReport(run);

    expect(html).toContain("Answer Comparison");
    expect(html).toContain("深知晓");
    expect(html).toContain("Reference Comparison");
    expect(markdown).toContain("## Answer Comparison");
    expect(markdown).toContain("### ChatGPT");
  });

  it("splits compact reference tails into readable list items", () => {
    const deepseekRun = parseRunResult({
      ...sample,
      platforms: [
        {
          platform: "deepseek",
          label: "DeepSeek",
          url: "https://chat.deepseek.com/",
          status: "success",
          answerMarkdown:
            "政策要点包括额度提高[1]。参考文献：广东省住房和城乡建设厅，《广州拓展住房公积金贷款类型》，2026-06-15[1]广东省人民政府，《广州住房公积金个人住房贷款实施办法》，2026-06-09[2]",
          references: [
            {
              marker: "1",
              title: "广州拓展住房公积金贷款类型",
              url: "https://example.com/one",
              normalizedUrl: "https://example.com/one",
              text: "广州拓展住房公积金贷款类型"
            },
            {
              marker: "2",
              title: "广州住房公积金个人住房贷款实施办法",
              url: "https://example.com/two",
              normalizedUrl: "https://example.com/two",
              text: "广州住房公积金个人住房贷款实施办法"
            }
          ]
        }
      ]
    });

    const html = renderHtmlReport(deepseekRun);

    expect(html).toContain("<li>广东省住房和城乡建设厅");
    expect(html).toContain("<li>广东省人民政府");
  });

  it("deduplicates references by normalized URL", () => {
    const matrix = buildReferenceMatrix(run);
    const shared = matrix.find((row) => row.key === "https://gjj.gz.gov.cn");

    expect(shared).toBeDefined();
    expect(shared?.platforms.chatgpt).toBe(true);
    expect(shared?.platforms["dknowc-chat"]).toBe(true);
  });

  it("writes report artifacts", async () => {
    const outDir = join(process.cwd(), "tmp-test-run");
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    await generateReportFiles(run, outDir);

    await expect(readFile(join(outDir, "report.html"), "utf8")).resolves.toContain(
      "Reference Comparison"
    );
    await expect(readFile(join(outDir, "report.md"), "utf8")).resolves.toContain(
      "Answer & References Compare"
    );
    await expect(readFile(join(outDir, "results.json"), "utf8")).resolves.toContain(
      "dknowc-chat"
    );

    await rm(outDir, { recursive: true, force: true });
  });
});
