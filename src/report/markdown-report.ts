import type { RunResult } from "../schema/result.js";
import { buildReferenceMatrix } from "./reference-matrix.js";

export function renderMarkdownReport(run: RunResult): string {
  const lines: string[] = [
    "# Answer & References Compare",
    "",
    `**Question**: ${run.question}`,
    "",
    `**Run time**: ${run.createdAt}`,
    "",
    "## Platform Status",
    "",
    "| Platform | Status | Answer Length | References |",
    "|---|---:|---:|---:|"
  ];

  for (const platform of run.platforms) {
    lines.push(
      `| ${platform.label} | ${platform.status} | ${platform.answerMarkdown.length} | ${platform.references.length} |`
    );
  }

  lines.push("", "## Answer Comparison", "");
  for (const platform of run.platforms) {
    lines.push(`### ${platform.label}`, "");
    if (platform.status === "success") {
      lines.push(platform.answerMarkdown || "_No answer captured._");
    } else {
      lines.push(`_${platform.status}: ${platform.error || "No details"}_`);
    }
    lines.push("");
  }

  lines.push("## Reference Comparison", "");
  const platformHeaders = run.platforms.map((platform) => platform.label);
  lines.push(`| Reference | ${platformHeaders.join(" | ")} |`);
  lines.push(`|---|${platformHeaders.map(() => "---:").join("|")}|`);

  for (const row of buildReferenceMatrix(run)) {
    const marks = run.platforms.map((platform) =>
      row.platforms[platform.platform] ? "yes" : ""
    );
    lines.push(`| [${escapePipe(row.title)}](${row.url}) | ${marks.join(" | ")} |`);
  }

  if (buildReferenceMatrix(run).length === 0) {
    lines.push("| No references captured |  |");
  }

  lines.push("", "## Per-Platform References", "");
  for (const platform of run.platforms) {
    lines.push(`### ${platform.label}`, "");
    if (platform.references.length === 0) {
      lines.push("_No references captured._", "");
      continue;
    }
    platform.references.forEach((reference, index) => {
      const title = reference.title || reference.text || reference.url;
      const marker = reference.marker ? `[${reference.marker}] ` : "";
      const snippet = reference.snippet ? ` — ${reference.snippet}` : "";
      lines.push(`${index + 1}. ${marker}[${title}](${reference.url})${snippet}`);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, "\\|");
}
