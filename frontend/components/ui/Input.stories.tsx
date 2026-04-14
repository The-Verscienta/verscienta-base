import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'DS/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    type: 'text',
    disabled: false,
    required: false,
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <Input
        {...args}
        name="story"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const WithHelper: Story = {
  args: { helperText: 'Short hint for the field.' },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <Input
        {...args}
        name="story"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Error: Story = {
  args: { error: 'This field is required.', label: 'Email' },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <Input
        {...args}
        name="story"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Read only value' },
  render: function Render(args) {
    return <Input {...args} name="story" onChange={() => {}} />;
  },
};
