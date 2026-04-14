/**
 * Style Dictionary — single source for CSS variables + Tailwind color refs.
 * @see docs/design-system/GOVERNANCE.md
 */
import StyleDictionary from 'style-dictionary';

StyleDictionary.registerFormat({
  name: 'json/tailwind-color-refs',
  format: ({ dictionary }) => {
    const colors = {};
    for (const token of dictionary.allTokens) {
      if (token.path[0] !== 'color') continue;
      const palette = token.path[1];
      const shade = token.path[2];
      if (!palette || shade === undefined) continue;
      if (!colors[palette]) colors[palette] = {};
      const cssName = token.path.join('-');
      colors[palette][shade] = `var(--${cssName})`;
    }
    return `${JSON.stringify(colors, null, 2)}\n`;
  },
});

StyleDictionary.registerFormat({
  name: 'css/semantic-theme',
  format: ({ dictionary }) => {
    const light = {};
    const dark = {};
    for (const token of dictionary.allTokens) {
      if (token.path[0] !== 'semantic') continue;
      const mode = token.path[1];
      const key = token.path[2];
      if (!key) continue;
      const cssName = toSemanticCssVar(key);
      const val = token.$value ?? token.value;
      if (mode === 'light') light[cssName] = val;
      if (mode === 'dark') dark[cssName] = val;
    }
    const lightRules = Object.entries(light)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const darkRules = Object.entries(dark)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    return `/**
 * AUTO-GENERATED — semantic theme tokens (light / dark).
 */
:root {
${lightRules}
}

.dark {
${darkRules}
}
`;
  },
});

function toSemanticCssVar(key) {
  const map = {
    surface: '--surface',
    surfaceElevated: '--surface-elevated',
    surfaceSunken: '--surface-sunken',
    textPrimary: '--text-primary',
    textSecondary: '--text-secondary',
    textTertiary: '--text-tertiary',
    textBrand: '--text-brand',
    borderDefault: '--border-default',
    borderSubtle: '--border-subtle',
  };
  return map[key] || `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

/** @type {import('style-dictionary').Config} */
export default {
  log: {
    verbosity: 'verbose',
  },
  source: [
    'design-tokens/tokens/**/*.json',
    '!design-tokens/tokens/**/$metadata.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'styles/generated/',
      files: [
        {
          destination: 'primitives.css',
          format: 'css/variables',
          filter: (token) => token.path[0] === 'color',
          options: {
            outputReferences: true,
          },
        },
        {
          destination: 'semantic.css',
          format: 'css/semantic-theme',
          filter: (token) => token.path[0] === 'semantic',
        },
      ],
    },
    json: {
      transformGroup: 'js',
      buildPath: 'styles/generated/',
      files: [
        {
          destination: 'tailwind-color-refs.json',
          format: 'json/tailwind-color-refs',
          filter: (token) => token.path[0] === 'color',
        },
      ],
    },
  },
};
