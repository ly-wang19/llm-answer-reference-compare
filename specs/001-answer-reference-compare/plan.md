# Implementation Plan: Answer Reference Compare

**Branch**: `001-answer-reference-compare` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-answer-reference-compare/spec.md`

## Summary

Build a local CLI that captures or imports AI chat product answers and references,
then writes a static comparison report. The MVP prioritizes sample-data report
generation, a stable result contract, and a Playwright-based generic web capture
path with DKnowC Chat as a named target.

## Technical Context

**Language/Version**: TypeScript on Node.js 20+

**Primary Dependencies**: Playwright for browser automation, Commander for CLI
parsing, Zod for result validation, markdown-it for answer rendering

**Storage**: Local filesystem run directories

**Testing**: Vitest for unit tests and sample report regression checks

**Target Platform**: Local developer machines and CI runners that can run Node.js

**Project Type**: CLI application with static report artifacts

**Performance Goals**: Generate a report from sample data in under 5 seconds;
avoid memory-heavy processing for typical runs under 20 platforms

**Constraints**: Do not bypass platform access controls; keep reports static and
openable without a server; keep JSON contract stable

**Scale/Scope**: MVP supports sample import, generic browser capture, DKnowC Chat
named target, static HTML report, Markdown report, JSON output, and screenshots

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Collection And Comparison Only: PASS. Plan excludes verdicts, credibility
  ratings, source support judgments, and fact-check conclusions.
- Provider Adapters Are Replaceable: PASS. Capture logic is isolated in provider
  modules behind a common result schema.
- Reproducible Artifacts: PASS. Runs write JSON, HTML, Markdown, screenshots, and
  HTML snapshots when available.
- User-Controlled Sessions And Safety: PASS. Browser sessions are local profiles;
  no CAPTCHA bypass or hidden anti-detection behavior is planned.
- CLI-First, Report-First: PASS. Primary interface is a local command that writes
  a static report directory.

## Project Structure

### Documentation (this feature)

```text
specs/001-answer-reference-compare/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── cli.ts
├── capture/
│   ├── generic-chat.ts
│   ├── platform-registry.ts
│   └── providers/
│       └── dknowc-chat.ts
├── report/
│   ├── html-report.ts
│   ├── markdown-report.ts
│   └── reference-matrix.ts
├── schema/
│   └── result.ts
└── utils/
    ├── filesystem.ts
    └── urls.ts

tests/
├── fixtures/
│   └── sample-results.json
├── report.test.ts
└── schema.test.ts
```

**Structure Decision**: Use a single TypeScript CLI project. Report generation,
capture, schemas, and utilities are separated so users can contribute provider
adapters without touching report layout or result validation.

## Complexity Tracking

No constitution violations.
