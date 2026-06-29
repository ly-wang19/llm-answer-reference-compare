# Data Model: Answer Reference Compare

## RunResult

- `schemaVersion`: string. Current value `1`.
- `question`: string. The submitted user question.
- `createdAt`: ISO timestamp.
- `platforms`: array of PlatformResult.

Validation:
- `question` must be non-empty.
- `platforms` must contain at least one result.

## PlatformResult

- `platform`: stable platform id, such as `dknowc-chat` or `generic`.
- `label`: user-facing display name.
- `url`: target website URL.
- `status`: `success`, `failed`, `timeout`, or `login_required`.
- `answerMarkdown`: captured answer text, markdown allowed.
- `references`: array of Reference.
- `artifacts`: optional ArtifactPaths.
- `durationMs`: optional capture duration.
- `error`: optional error message for non-success states.

Validation:
- Successful results must include non-empty `answerMarkdown`.
- Failed results should include `error`.
- Results may have zero references.

## Reference

- `title`: optional title from anchor text, citation card, or page metadata.
- `url`: original captured URL.
- `normalizedUrl`: canonical comparison key.
- `text`: optional link text or citation label.
- `snippet`: optional nearby text.

Validation:
- `url` must be non-empty.
- `normalizedUrl` is computed by lowercasing host, removing URL fragments, and
  trimming trailing slashes where safe.

## ArtifactPaths

- `screenshot`: optional path to PNG screenshot.
- `html`: optional path to captured HTML.
- `trace`: optional path to browser trace archive.

Validation:
- Paths are stored relative to the run directory when possible.

## PlatformConfig

- `name`: stable platform id.
- `label`: display name.
- `url`: default target URL.
- `adapter`: `generic-chat` or a named adapter.
- `profile`: optional persistent browser profile name.
- `selectors`: optional selector hints for input, send button, answer, and
  references.

Validation:
- Unknown platform URLs use the generic adapter.
- Named adapters may provide defaults but still output the same PlatformResult.
