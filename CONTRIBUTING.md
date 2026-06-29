# Contributing

Thanks for helping improve LLM Answer & References Compare.

## Add A Platform

1. Add the target in `src/capture/platform-registry.ts`.
2. Start with narrow input, send, answer, and reference selectors.
3. Run the platform in headed interactive mode.
4. Inspect `results.json`, `report.html`, `artifacts/<platform>/screenshot.png`, and `artifacts/<platform>/page.html`.
5. If generic extraction captures sidebars, history, or app chrome, add a platform-specific extractor in `src/capture/generic-chat.ts`.

## Verify

```bash
npm run build
npm test
npm pack --dry-run
```

## Privacy

Do not commit:

- `profiles/`
- `runs/`
- screenshots, traces, cookies, or captured HTML with private data
- API keys, account identifiers, or session tokens

## Boundaries

This project compares answers and references. It does not bypass CAPTCHA, paywalls, rate limits, or access controls, and it does not produce fact-checking verdicts.
