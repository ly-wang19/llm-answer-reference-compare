# Research: Answer Reference Compare

## Decision: Use TypeScript and Node.js for the CLI

**Rationale**: Playwright has first-class Node.js support, TypeScript gives a
stable result contract for open-source contributors, and generated reports can be
written with ordinary filesystem APIs.

**Alternatives considered**: Python with Playwright was considered, but the Node
ecosystem is more natural for Playwright examples and frontend-oriented report
templates.

## Decision: Make report generation work from sample JSON before browser capture

**Rationale**: Users can validate the project without platform accounts, and CI
can test the most important user-visible output deterministically.

**Alternatives considered**: Starting with live browser capture would make early
tests depend on third-party websites, login state, and UI changes.

## Decision: Use a generic chat adapter plus named adapters

**Rationale**: The user wants arbitrary websites, but stable high-value platforms
need custom selectors and waiting behavior. The generic adapter covers discovery;
named adapters improve reliability without changing the result contract.

**Alternatives considered**: A provider-only design would fail the "any website"
goal. A generic-only design would be too brittle for important platforms.

## Decision: Keep browser profiles and run outputs out of version control

**Rationale**: Profiles may contain login cookies or identifying data. Run outputs
can include screenshots and captured page HTML from third-party products.

**Alternatives considered**: Committing sample captures from real services was
rejected because they may contain account-specific state or copyrighted output.

## Decision: Static HTML is the primary report

**Rationale**: HTML supports answer columns, collapsible long text, screenshot
links, and reference matrices more clearly than Markdown tables. Markdown remains
useful for GitHub preview and text-only sharing.

**Alternatives considered**: A hosted app was rejected for v1 because it adds
deployment, auth, and storage concerns outside the tool's comparison scope.
