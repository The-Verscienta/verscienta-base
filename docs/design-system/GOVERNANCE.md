# Design system governance

**Token & DS version:** `1.0.0` (see `frontend/design-tokens/tokens/$metadata.json`)

## Single sources of truth

| Layer | Location | Consumed by |
| ----- | -------- | ----------- |
| **Color primitives + semantic theme** | `frontend/design-tokens/tokens/**/*.json` | Style Dictionary |
| **Generated CSS variables** | `frontend/styles/generated/primitives.css`, `semantic.css` | `app/globals.css` (imported first) |
| **Tailwind color utilities** | `frontend/styles/generated/tailwind-color-refs.json` | `tailwind.config.ts` |
| **Interactive components (reference)** | `frontend/components/ui/*.tsx` + `*.stories.tsx` | Storybook |

Do **not** hand-edit generated files under `styles/generated/`. Run `npm run tokens:build` (or `npm run build`, which runs it via `prebuild`).

## Naming

- **JSON token paths** follow `category.group.scale` (e.g. `color.earth.600`, `semantic.light.surface`).
- **CSS variables** from primitives: `--color-{palette}-{scale}` (e.g. `--color-earth-600`).
- **Semantic variables** (light/dark): `--surface`, `--text-primary`, `--border-default`, etc. Defined in `semantic/theme.json` and emitted to `semantic.css`.

## When to add a new token vs. reuse

1. **Prefer an existing primitive** (earth, sage, tcm, gold, cream, warm, status) before adding a new hex.
2. **Add a new primitive shade** only if it is used in multiple places or represents a distinct brand meaning.
3. **Add a semantic token** when the role is stable across themes (e.g. “default border”) and should swap in dark mode — put it in `semantic/theme.json` under `light` / `dark`.
4. **Use Tailwind arbitrary values** (`bg-[...]`) only for one-off experiments; promote to tokens if repeated.

## Versioning & change control

- Bump **`$metadata.json` `version`** when you change token *names* or remove tokens (breaking for consumers).
- Add a line to the PR description: **“Tokens: patch / minor / major”** so reviewers know if `tokens:build` output should be reviewed carefully.
- **Contrast:** new text/background pairs should meet WCAG AA minimum (4.5:1 body, 3:1 large). Use Storybook **Accessibility** addon on DS stories.

## Storybook

- Stories live next to components: `ComponentName.stories.tsx`.
- **DS/Button** and **DS/Input** are the initial reference stories; add stories when adding or significantly changing shared UI.
- Use the **theme toolbar** (addon-themes) to validate light/dark for each story.

## Related docs

- `docs/DESIGN-SYSTEM.md` — visual principles and patterns (prose).
- `frontend/design-tokens/README.md` — build commands.
