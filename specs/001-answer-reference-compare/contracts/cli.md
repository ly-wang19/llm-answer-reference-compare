# CLI Contract: Answer Reference Compare

## Command: Generate a report from existing JSON

```bash
npm run compare -- report --input tests/fixtures/sample-results.json --out runs/sample
```

Expected output files:

- `runs/sample/report.html`
- `runs/sample/report.md`
- `runs/sample/results.json`

Behavior:

- Validate the input against schema version `1`.
- Deduplicate references by `normalizedUrl`.
- Render answer columns and the reference matrix.
- Exit non-zero if the input is invalid.

## Command: Capture from platforms and generate a report

```bash
npm run compare -- run \
  --question "What did each product answer?" \
  --platform dknowc-chat=https://yun.dknowc.cn/wlcb/dknowc-chat/ \
  --platform generic=https://example.com/chat \
  --out runs/manual \
  --headed
```

Behavior:

- Open each platform target with its configured or generic adapter.
- Submit the question.
- Save PlatformResult records, screenshots, and HTML snapshots when available.
- Generate the same report outputs as the `report` command.
- Continue reporting remaining platforms if one platform fails.

## Command: List built-in platform targets

```bash
npm run compare -- platforms
```

Expected output:

- `dknowc-chat`
- `generic`

## Output Contract

All commands that produce report artifacts write `results.json` with:

```json
{
  "schemaVersion": "1",
  "question": "string",
  "createdAt": "ISO timestamp",
  "platforms": [
    {
      "platform": "string",
      "label": "string",
      "url": "string",
      "status": "success",
      "answerMarkdown": "string",
      "references": [
        {
          "title": "string",
          "url": "string",
          "normalizedUrl": "string",
          "text": "string",
          "snippet": "string"
        }
      ],
      "artifacts": {
        "screenshot": "string",
        "html": "string",
        "trace": "string"
      },
      "durationMs": 1000
    }
  ]
}
```
