import { z } from "zod";

export const ReferenceSchema = z.object({
  title: z.string().optional(),
  url: z.string().min(1),
  normalizedUrl: z.string().min(1),
  marker: z.string().optional(),
  text: z.string().optional(),
  snippet: z.string().optional()
});

export const ArtifactPathsSchema = z.object({
  screenshot: z.string().optional(),
  html: z.string().optional(),
  trace: z.string().optional()
});

export const PlatformStatusSchema = z.enum([
  "success",
  "failed",
  "timeout",
  "login_required",
  "verification_required"
]);

export const PlatformResultSchema = z
  .object({
    platform: z.string().min(1),
    label: z.string().min(1),
    url: z.string().min(1),
    status: PlatformStatusSchema,
    answerMarkdown: z.string(),
    references: z.array(ReferenceSchema).default([]),
    artifacts: ArtifactPathsSchema.optional(),
    durationMs: z.number().int().nonnegative().optional(),
    error: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === "success" && value.answerMarkdown.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerMarkdown"],
        message: "Successful platform results must include answerMarkdown."
      });
    }
    if (value.status !== "success" && !value.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["error"],
        message: "Failed platform results should include an error message."
      });
    }
  });

export const RunResultSchema = z.object({
  schemaVersion: z.literal("1"),
  question: z.string().min(1),
  createdAt: z.string().min(1),
  platforms: z.array(PlatformResultSchema).min(1)
});

export type Reference = z.infer<typeof ReferenceSchema>;
export type ArtifactPaths = z.infer<typeof ArtifactPathsSchema>;
export type PlatformStatus = z.infer<typeof PlatformStatusSchema>;
export type PlatformResult = z.infer<typeof PlatformResultSchema>;
export type RunResult = z.infer<typeof RunResultSchema>;

export function parseRunResult(input: unknown): RunResult {
  return RunResultSchema.parse(input);
}
