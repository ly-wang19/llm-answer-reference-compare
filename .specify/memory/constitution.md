<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> I. Collection And Comparison Only
- [PRINCIPLE_2_NAME] -> II. Provider Adapters Are Replaceable
- [PRINCIPLE_3_NAME] -> III. Reproducible Artifacts
- [PRINCIPLE_4_NAME] -> IV. User-Controlled Sessions And Safety
- [PRINCIPLE_5_NAME] -> V. CLI-First, Report-First
Added sections:
- Scope Boundaries
- Development Workflow
Removed sections: none
Templates requiring updates:
- .specify/templates/plan-template.md: no update required
- .specify/templates/spec-template.md: no update required
- .specify/templates/tasks-template.md: no update required
Follow-up TODOs: none
-->
# LLM Answer Reference Compare Constitution

## Core Principles

### I. Collection And Comparison Only

The project MUST collect and compare AI product answers and cited references. It
MUST NOT produce factual verdicts, truth scores, credibility ratings, or platform
rankings. Any later product that performs fact-checking conclusions MUST remain a
separate layer built on exported artifacts, not part of this tool.

### II. Provider Adapters Are Replaceable

The system MUST support unknown chat products through a generic adapter and MUST
allow high-value platforms to be stabilized with dedicated adapters. Provider
logic MUST be isolated behind a common result contract so adding or repairing one
platform does not change report generation or other providers.

### III. Reproducible Artifacts

Every successful or failed run MUST produce inspectable artifacts: structured
JSON, a human-readable report, screenshots when browser automation ran, and enough
diagnostic detail to understand failures. Reports MUST preserve platform-specific
answers and references without silently rewriting their meaning.

### IV. User-Controlled Sessions And Safety

The project MUST use user-controlled browser sessions for platforms requiring
login. It MUST NOT bypass access controls, CAPTCHA, paywalls, rate limits, or
platform safety mechanisms. Secrets, cookies, profiles, traces, and local run
outputs MUST be ignored by default and never committed intentionally.

### V. CLI-First, Report-First

The first-class interface MUST be a local command that accepts a question and one
or more platform targets, then writes a report directory. The default report MUST
be understandable without running a server. JSON and CSV outputs MUST remain
stable enough for downstream analysis.

## Scope Boundaries

The v1 scope is answer capture, reference extraction, and visual comparison. The
project may validate whether a reference URL is syntactically valid or reachable
when this supports display, but it MUST NOT infer whether a source supports an
answer. The project MUST avoid platform-specific claims that cannot be validated
from the captured browser page or configured adapter.

## Development Workflow

Changes MUST start from a Spec Kit feature spec and preserve the shared result
contract. New provider adapters MUST include a fixture or documented manual test
path. Report changes MUST be reviewed against sample data so answer text,
reference matrices, and failure states remain readable.

## Governance

This constitution supersedes local conventions when they conflict. Amendments
require updating this file, explaining the version change in the Sync Impact
Report, and checking whether active specs, plans, tasks, and templates need
updates. Versioning follows semantic versioning: MAJOR for scope or governance
breaks, MINOR for new principles or materially expanded requirements, and PATCH
for clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-06-29 | **Last Amended**: 2026-06-29
