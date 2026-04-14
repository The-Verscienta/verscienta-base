# Design tokens (Style Dictionary)

## Commands

```bash
npm run tokens:build
```

Regenerates:

- `styles/generated/primitives.css` — `:root` color variables
- `styles/generated/semantic.css` — light + `.dark` semantic variables
- `styles/generated/tailwind-color-refs.json` — Tailwind `theme.extend.colors` references (`var(--color-…)`)

`npm run build` runs `tokens:build` first (`prebuild`).

## Editing

1. Change JSON under `tokens/` (see `color/primitives.json`, `semantic/theme.json`).
2. Run `npm run tokens:build`.
3. Commit both the JSON **and** the generated files.

## W3C-style fields

Token leaves use `value` and `type` (and optional `description`) compatible with design-token tooling; metadata lives in `$metadata.json`.

## Governance

See **[`docs/design-system/GOVERNANCE.md`](../../docs/design-system/GOVERNANCE.md)**.
