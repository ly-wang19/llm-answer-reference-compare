import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../src/utils/urls.js";
import { parseRunResult } from "../src/schema/result.js";
import sample from "./fixtures/sample-results.json";

describe("result schema", () => {
  it("accepts bundled sample results", () => {
    const result = parseRunResult(sample);
    expect(result.platforms).toHaveLength(3);
  });

  it("rejects successful platform results without an answer", () => {
    expect(() =>
      parseRunResult({
        schemaVersion: "1",
        question: "q",
        createdAt: "2026-06-29T10:00:00+08:00",
        platforms: [
          {
            platform: "empty",
            label: "Empty",
            url: "https://example.com",
            status: "success",
            answerMarkdown: "",
            references: []
          }
        ]
      })
    ).toThrow();
  });
});

describe("normalizeUrl", () => {
  it("normalizes fragments, host casing, and trailing slashes", () => {
    expect(normalizeUrl("HTTPS://Example.COM/path/#section")).toBe(
      "https://example.com/path"
    );
  });

  it("unwraps known answer-platform tracking links", () => {
    expect(
      normalizeUrl(
        "https://link.wtturl.cn/?target=https%3A%2F%2Fgjj.gz.gov.cn%2Fbsfw%2Fqtfw%2Fcontent%2Fpost_5748060.html&scene=im"
      )
    ).toBe("https://gjj.gz.gov.cn/bsfw/qtfw/content/post_5748060.html");
  });
});
