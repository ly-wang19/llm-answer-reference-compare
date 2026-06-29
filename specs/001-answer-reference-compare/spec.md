# Feature Specification: Answer Reference Compare

**Feature Branch**: `001-answer-reference-compare`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "Build a local open-source tool that collects answers
and references from multiple AI chat product websites, including DKnowC Chat, and
generates an intuitive answer and reference comparison report without producing
fact-checking conclusions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a Comparison Report (Priority: P1)

An evaluator provides one question and a list of AI chat product targets, then
receives a local report that shows each platform's answer side by side.

**Why this priority**: This is the minimum useful product: users can compare the
answers they collected without reading separate browser tabs or raw logs.

**Independent Test**: Use a sample result file with at least two platforms and
verify the generated report presents the question, platform status, and each
answer in a side-by-side answer comparison.

**Acceptance Scenarios**:

1. **Given** sample results for ChatGPT and DKnowC Chat, **When** the user
   generates a report, **Then** the report shows the original question and both
   answers in separate platform columns.
2. **Given** one platform failed and one platform succeeded, **When** the report
   is generated, **Then** the successful answer is shown and the failed platform
   displays its failure status without hiding the rest of the report.

---

### User Story 2 - Compare References Across Platforms (Priority: P2)

An evaluator reviews which references each platform cited and sees shared or
platform-specific sources in a single reference comparison matrix.

**Why this priority**: Reference comparison is the second core value. It lets
users inspect source overlap without turning the tool into a fact-checking
verdict engine.

**Independent Test**: Use sample results containing overlapping and unique
references, then verify the report includes one row per normalized reference and
one column per platform indicating whether that platform cited it.

**Acceptance Scenarios**:

1. **Given** two platforms cite the same URL, **When** the report is generated,
   **Then** the reference matrix contains one row for that URL and marks both
   platforms.
2. **Given** a platform answer contains no references, **When** the report is
   generated, **Then** the platform is still shown and its reference count is
   clearly zero.

---

### User Story 3 - Capture From Arbitrary Chat Products (Priority: P3)

An evaluator provides a website URL for a supported or unknown AI chat product,
including DKnowC Chat, and the tool attempts to collect the answer, references,
and evidence artifacts for the report.

**Why this priority**: Capture automation is essential for real use, but the
report can be developed and validated independently from browser sessions.

**Independent Test**: Run a capture against a locally controlled test chat page
and verify that the result contains answer text, extracted links, a screenshot
path, and a status value.

**Acceptance Scenarios**:

1. **Given** an accessible chat page with a text input and a send action,
   **When** the user submits a question through the tool, **Then** the tool saves
   a platform result containing the answer text and cited links.
2. **Given** a chat page requires login, **When** the user opens a headed session
   and completes login manually, **Then** the tool can reuse that user-controlled
   session for later captures.

### Edge Cases

- A platform times out, blocks automation, or requires manual login.
- A platform returns an answer but no references.
- Multiple references have the same URL with different titles.
- A reference link is relative, redirected, or duplicated within one answer.
- The user supplies an unknown site whose chat controls cannot be detected.
- A run contains mixed languages or long answers that exceed one screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a user question and one or more platform targets.
- **FR-002**: System MUST support DKnowC Chat as a named platform target.
- **FR-003**: System MUST support arbitrary website targets through a generic
  target path when no named platform adapter exists.
- **FR-004**: System MUST record each platform result with platform name, target
  URL, status, answer text, references, and artifact paths when available.
- **FR-005**: System MUST generate a human-readable report that places platform
  answers side by side.
- **FR-006**: System MUST generate a reference comparison matrix with one row per
  normalized reference and one column per platform.
- **FR-007**: System MUST preserve per-platform reference lists in the report so
  users can inspect title, URL, and captured link text when available.
- **FR-008**: System MUST write a machine-readable result file for downstream
  tools.
- **FR-009**: System MUST save screenshot or diagnostic artifacts when browser
  capture is attempted.
- **FR-010**: System MUST show platform failures in the report without failing the
  entire report when at least one platform result exists.
- **FR-011**: System MUST NOT state factual verdicts, truth labels, credibility
  ratings, or source-support judgments.
- **FR-012**: System MUST provide sample data that lets users generate a report
  without logging into any third-party platform.

### Key Entities

- **Run**: A single comparison attempt for one question across multiple platform
  targets. Key attributes include run identifier, question, creation time, and
  output paths.
- **Platform Target**: A configured website or named AI product to capture. Key
  attributes include name, URL, adapter type, and optional session profile name.
- **Platform Result**: The captured output for one platform in one run. Key
  attributes include status, answer text, references, screenshots, HTML snapshot,
  duration, and error message.
- **Reference**: A cited source extracted from an answer or page. Key attributes
  include title, URL, normalized URL, link text, snippet, and source platform.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can generate a sample comparison report in under
  5 minutes using only the repository instructions and bundled sample data.
- **SC-002**: A report with three platforms and ten total references displays
  answer comparison and reference comparison without horizontal content overlap
  on a standard laptop viewport.
- **SC-003**: The reference matrix deduplicates identical normalized URLs across
  platforms with 100% accuracy for bundled sample data.
- **SC-004**: If one platform fails and at least one platform succeeds, the report
  still renders and clearly shows the failed platform status.
- **SC-005**: The exported machine-readable result includes every platform answer
  and reference visible in the report.

## Assumptions

- Users run the tool locally and control any browser sessions used for login.
- The v1 report is a static local artifact, not a hosted web application.
- Sample data is sufficient for automated report validation when real platform
  sessions are unavailable.
- Source reachability and factual support checks are out of scope for this tool.
- Browser capture is best-effort for unknown websites and may require later
  adapter improvements.
