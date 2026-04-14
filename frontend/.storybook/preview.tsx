import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: 'var(--surface)' },
        { name: 'sunken', value: 'var(--surface-sunken)' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <div className="min-h-[120px] min-w-[280px] p-6 font-sans text-[var(--text-primary)] bg-[var(--surface)]">
        <Story />
      </div>
    ),
  ],
};

export default preview;
