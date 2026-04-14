const path = require('path');

/** @type { import('@storybook/react-vite').StorybookConfig } */
module.exports = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [path.join(__dirname, '../public')],
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const tailwindPostcss = (await import('@tailwindcss/postcss')).default;
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '..'),
        },
      },
      css: {
        postcss: {
          plugins: [tailwindPostcss()],
        },
      },
    });
  },
};
