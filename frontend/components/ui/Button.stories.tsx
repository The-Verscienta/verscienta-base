import type { Meta, StoryObj } from '@storybook/react';
import { Button, BUTTON_VARIANTS, BUTTON_SIZES } from './Button';

const meta: Meta<typeof Button> = {
  title: 'DS/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [...BUTTON_VARIANTS],
      description: 'Visual style — maps to design system button patterns.',
    },
    size: { control: 'select', options: [...BUTTON_SIZES] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    fullWidth: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } };

export const Outline: Story = { args: { variant: 'outline', children: 'Outline' } };

export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } };

export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } };

export const Small: Story = { args: { size: 'sm', children: 'Small' } };

export const Large: Story = { args: { size: 'lg', children: 'Large' } };

export const Loading: Story = {
  args: { loading: true, children: 'Saving…' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Unavailable' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Full width' },
  parameters: { layout: 'padded' },
};

/** All variants on one canvas — use for visual regression / contrast checks. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {BUTTON_VARIANTS.map((v) => (
        <div key={v} className="flex items-center gap-4">
          <span className="w-24 text-sm text-[var(--text-secondary)]">{v}</span>
          <Button variant={v}>{v}</Button>
          <Button variant={v} disabled>
            disabled
          </Button>
          <Button variant={v} loading>
            loading
          </Button>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
