import type { PlatformResult, Reference, RunResult } from "../schema/result.js";

export type ReferenceMatrixRow = {
  key: string;
  title: string;
  url: string;
  platforms: Record<string, boolean>;
  referencesByPlatform: Record<string, Reference[]>;
};

export function buildReferenceMatrix(run: RunResult): ReferenceMatrixRow[] {
  const rows = new Map<string, ReferenceMatrixRow>();

  for (const platform of run.platforms) {
    for (const reference of platform.references) {
      const key = reference.normalizedUrl || reference.url;
      const existing = rows.get(key);
      if (!existing) {
        rows.set(key, {
          key,
          title: reference.title || reference.text || reference.url,
          url: reference.url,
          platforms: { [platform.platform]: true },
          referencesByPlatform: { [platform.platform]: [reference] }
        });
        continue;
      }

      existing.platforms[platform.platform] = true;
      existing.referencesByPlatform[platform.platform] = [
        ...(existing.referencesByPlatform[platform.platform] || []),
        reference
      ];
      if (!existing.title && reference.title) {
        existing.title = reference.title;
      }
    }
  }

  return [...rows.values()].sort((a, b) => {
    const countDelta = countPlatforms(b.platforms) - countPlatforms(a.platforms);
    return countDelta || a.url.localeCompare(b.url);
  });
}

export function referenceCount(platform: PlatformResult): number {
  return platform.references.length;
}

function countPlatforms(platforms: Record<string, boolean>): number {
  return Object.values(platforms).filter(Boolean).length;
}
