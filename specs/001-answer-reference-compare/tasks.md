# Tasks: Answer Reference Compare

**Input**: Design documents from `specs/001-answer-reference-compare/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include focused tests for schema validation, reference matrix
deduplication, and report generation from sample data.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Node/TypeScript project files in `package.json`, `tsconfig.json`, `vitest.config.ts`, and `.gitignore`
- [x] T002 Create source and test directory structure under `src/` and `tests/`
- [x] T003 [P] Add sample fixture data in `tests/fixtures/sample-results.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema and utilities required by all user stories

- [x] T004 Implement result schema validation in `src/schema/result.ts`
- [x] T005 [P] Implement URL normalization utilities in `src/utils/urls.ts`
- [x] T006 [P] Implement filesystem helpers in `src/utils/filesystem.ts`
- [x] T007 [P] Add schema validation tests in `tests/schema.test.ts`

**Checkpoint**: Foundation ready - report and capture work can begin.

---

## Phase 3: User Story 1 - Generate a Comparison Report (Priority: P1) MVP

**Goal**: Generate a static report from existing result JSON with side-by-side
answers and platform statuses.

**Independent Test**: Run the report command with sample data and open the
generated HTML/Markdown artifacts.

### Tests for User Story 1

- [x] T008 [P] [US1] Add report generation test for sample answers in `tests/report.test.ts`

### Implementation for User Story 1

- [x] T009 [US1] Implement Markdown report generation in `src/report/markdown-report.ts`
- [x] T010 [US1] Implement HTML answer comparison layout in `src/report/html-report.ts`
- [x] T011 [US1] Implement `report` CLI command in `src/cli.ts`
- [x] T012 [US1] Wire executable entrypoint and npm scripts in `package.json`

**Checkpoint**: User Story 1 can generate `report.html`, `report.md`, and
`results.json` from sample data.

---

## Phase 4: User Story 2 - Compare References Across Platforms (Priority: P2)

**Goal**: Add normalized reference matrix and per-platform reference lists.

**Independent Test**: Run the report command with overlapping references and
verify one row per normalized URL with platform marks.

### Tests for User Story 2

- [x] T013 [P] [US2] Add reference matrix deduplication tests in `tests/report.test.ts`

### Implementation for User Story 2

- [x] T014 [US2] Implement reference matrix builder in `src/report/reference-matrix.ts`
- [x] T015 [US2] Add reference matrix and per-platform lists to HTML report in `src/report/html-report.ts`
- [x] T016 [US2] Add reference matrix and per-platform lists to Markdown report in `src/report/markdown-report.ts`

**Checkpoint**: User Stories 1 and 2 work from sample data.

---

## Phase 5: User Story 3 - Capture From Arbitrary Chat Products (Priority: P3)

**Goal**: Add best-effort browser capture for generic websites and DKnowC Chat.

**Independent Test**: Run a headed capture against a local or manually accessible
chat target and verify a PlatformResult plus screenshot/HTML artifacts are saved.

### Implementation for User Story 3

- [x] T017 [P] [US3] Implement platform registry in `src/capture/platform-registry.ts`
- [x] T018 [US3] Implement generic chat capture adapter in `src/capture/generic-chat.ts`
- [x] T019 [US3] Implement DKnowC Chat provider wrapper in `src/capture/providers/dknowc-chat.ts`
- [x] T020 [US3] Implement `platforms` and `run` CLI commands in `src/cli.ts`

**Checkpoint**: User Story 3 can attempt browser capture and still produce a
report when platforms fail or require login.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and open-source readiness

- [x] T021 [P] Add README usage and project positioning in `README.md`
- [x] T022 [P] Add environment and artifact guidance in `.gitignore`
- [x] T023 Run `npm test` and `npm run build`
- [x] T024 Run quickstart sample report command from `specs/001-answer-reference-compare/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion
- User Story 1 (Phase 3): Depends on Foundational
- User Story 2 (Phase 4): Depends on User Story 1 report structure
- User Story 3 (Phase 5): Depends on Foundational and report command
- Polish (Phase 6): Depends on desired user stories

### Parallel Opportunities

- T003 can run after T001 creates test structure.
- T005, T006, and T007 touch separate files once schema shape is known.
- T008 and T013 can be developed independently from implementation files.
- T017 can run before generic and DKnowC adapter details.
- T021 and T022 can run in parallel during polish.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1.
3. Validate sample report generation before browser automation.

### Incremental Delivery

1. Add reference matrix as User Story 2.
2. Add browser capture as User Story 3.
3. Keep capture failures visible in reports instead of blocking report output.
