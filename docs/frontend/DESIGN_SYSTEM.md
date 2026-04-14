# Botanical Apothecary Design System

**Version 1.0** | Verscienta Health

A comprehensive design language that bridges ancient healing wisdom with modern digital experience. This system creates a warm, trustworthy, and sophisticated aesthetic inspired by traditional apothecaries, botanical illustrations, and natural medicine.

---

## Table of Contents

1. [Get Started](#get-started)
2. [Foundations](#foundations)
3. [Components](#components)
4. [Patterns](#patterns)
5. [Develop](#develop)
6. [Accessibility](#accessibility)

---

# Get Started

## Overview

The Botanical Apothecary Design System provides a unified visual language for Verscienta Health's digital products. It ensures consistency across all touchpoints while honoring the tradition and trustworthiness essential to health and wellness information.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Warmth Over Sterility** | Avoid clinical, cold aesthetics. Use earth tones and organic shapes to create an inviting, approachable feel. |
| **Wisdom Through Craft** | Honor traditional healing knowledge with design elements that evoke handcrafted quality, botanical illustrations, and apothecary heritage. |
| **Clarity With Depth** | Information should be accessible and scannable, but with layered visual depth that rewards exploration. |
| **Nature as Foundation** | Let natural forms, colors, and textures guide design decisions. Embrace organic curves, leaf motifs, and earth-inspired palettes. |
| **Trust Through Consistency** | Medical and wellness information requires trust. Consistent, polished design builds credibility. |

### For Designers

- Reference the [Foundations](#foundations) section for core design tokens
- Use [Components](#components) as building blocks for interfaces
- Follow [Patterns](#patterns) for common user flows
- Test against [Accessibility](#accessibility) guidelines

### For Developers

- Import components from `@/components/ui/DesignSystem`
- Use Tailwind classes documented in [Develop](#develop)
- Reference component code examples throughout

---

# Foundations

Core design elements that form the visual foundation of all interfaces.

## Color

### Color System Overview

The palette draws from nature: rich earth tones, sage greens, and warm creams create a grounded, organic feel that evokes traditional apothecaries and botanical gardens.

### Primary Palette

#### Earth (Primary)

The dominant color family for text, backgrounds, and primary actions.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `earth-50` | #faf8f5 | 250, 248, 245 | Light backgrounds |
| `earth-100` | #f0ebe3 | 240, 235, 227 | Subtle backgrounds |
| `earth-200` | #e1d5c7 | 225, 213, 199 | Borders, dividers |
| `earth-300` | #c9b8a5 | 201, 184, 165 | Disabled states |
| `earth-400` | #a89580 | 168, 149, 128 | Placeholder text |
| `earth-500` | #8b7355 | 139, 115, 85 | Secondary text |
| `earth-600` | #6d5a43 | 109, 90, 67 | Primary buttons, links |
| `earth-700` | #564834 | 86, 72, 52 | Hover states |
| `earth-800` | #3d3426 | 61, 52, 38 | Headings, primary text |
| `earth-900` | #2a241a | 42, 36, 26 | High contrast text |

#### Sage (Secondary)

Accent color for interactive elements, success states, and botanical theming.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `sage-50` | #f4f7f4 | 244, 247, 244 | Light tinted backgrounds |
| `sage-100` | #e6ede6 | 230, 237, 230 | Tag backgrounds |
| `sage-200` | #c9dbc9 | 201, 219, 201 | Borders |
| `sage-300` | #a5c4a5 | 165, 196, 165 | Decorative elements |
| `sage-400` | #7ba87b | 123, 168, 123 | Icons |
| `sage-500` | #5a8f5a | 90, 143, 90 | Accent color |
| `sage-600` | #4a7c59 | 74, 124, 89 | Links, interactive |
| `sage-700` | #3d6347 | 61, 99, 71 | Hover states |
| `sage-800` | #2f4a35 | 47, 74, 53 | Dark accents |
| `sage-900` | #1f3123 | 31, 49, 35 | Darkest accent |

### Extended Palette

#### Cream

Warm white tones for page backgrounds.

| Token | Hex | Usage |
|-------|-----|-------|
| `cream-50` | #fffef9 | Primary background |
| `cream-100` | #fefcf3 | Card backgrounds |
| `cream-200` | #faf6e8 | Elevated surfaces |

#### Gold

Warm highlights, TCM "warm" energy, and attention states.

| Token | Hex | Usage |
|-------|-----|-------|
| `gold-100` | #fef3c7 | Disclaimer backgrounds |
| `gold-200` | #fde68a | Highlight backgrounds |
| `gold-500` | #d4a017 | Accent icons |
| `gold-700` | #a16207 | Warning text |

#### Warm

Alerts, TCM "hot" energy, and error states.

| Token | Hex | Usage |
|-------|-----|-------|
| `warm-100` | #fee2e2 | Error backgrounds |
| `warm-500` | #c25b56 | Severity indicators |
| `warm-700` | #991b1b | Error text |

### Semantic Color Usage

| Purpose | Light Mode | Notes |
|---------|-----------|-------|
| Page Background | `cream-50` to white gradient | `bg-gradient-to-b from-cream-50 to-white` |
| Surface/Card | `white` | With `border-earth-100` |
| Primary Text | `earth-800` | Main content |
| Secondary Text | `earth-600` | Supporting content |
| Muted Text | `sage-500` | Captions, timestamps |
| Link Default | `sage-600` | Interactive text |
| Link Hover | `earth-700` | Hover state |
| Primary Action | `earth-600` to `sage-600` | Gradient buttons |
| Success | `sage-600` | Positive feedback |
| Warning | `gold-600` | Caution states |
| Error | `warm-600` | Error states |

### Gradient Definitions

```css
/* Hero Section Background */
bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100

/* CTA Section Background */
bg-gradient-to-r from-earth-600 via-earth-700 to-sage-700

/* Primary Button */
bg-gradient-to-r from-earth-600 to-sage-600

/* Card Header */
bg-gradient-to-br from-cream-50 via-sage-50/30 to-earth-50/20

/* Icon Container */
bg-gradient-to-br from-sage-100 to-earth-100
```

---

## Typography

### Font Families

| Category | Font | Fallback Stack | Usage |
|----------|------|----------------|-------|
| Serif | Crimson Pro | Georgia, Times New Roman, serif | Headings, display text |
| Sans-serif | Inter | -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif | Body text, UI elements |
| Monospace | JetBrains Mono | Fira Code, monospace | Code, data |

### Type Scale

| Level | Size | Weight | Line Height | Class |
|-------|------|--------|-------------|-------|
| Display 1 | 60px (3.75rem) | Bold | 1.1 | `text-6xl font-serif font-bold leading-tight` |
| Display 2 | 48px (3rem) | Bold | 1.1 | `text-5xl font-serif font-bold leading-tight` |
| Heading 1 | 36px (2.25rem) | Bold | 1.2 | `text-4xl font-serif font-bold` |
| Heading 2 | 30px (1.875rem) | Bold | 1.25 | `text-3xl font-serif font-bold` |
| Heading 3 | 24px (1.5rem) | Bold | 1.3 | `text-2xl font-serif font-bold` |
| Heading 4 | 20px (1.25rem) | Semibold | 1.4 | `text-xl font-serif font-semibold` |
| Heading 5 | 18px (1.125rem) | Semibold | 1.4 | `text-lg font-serif font-semibold` |
| Body Large | 20px (1.25rem) | Normal | 1.6 | `text-xl leading-relaxed` |
| Body | 16px (1rem) | Normal | 1.6 | `text-base leading-relaxed` |
| Body Small | 14px (0.875rem) | Normal | 1.5 | `text-sm leading-relaxed` |
| Caption | 12px (0.75rem) | Medium | 1.4 | `text-xs font-medium` |
| Overline | 12px (0.75rem) | Medium | 1.2 | `text-xs font-medium uppercase tracking-wide` |

### Typography Guidelines

1. **Headings**: Always use `font-serif` (Crimson Pro) for headings to evoke traditional, scholarly feel
2. **Scientific names**: Use italic styling with `italic text-sage-600`
3. **Chinese characters**: Display at larger sizes (2xl+) with appropriate spacing for TCM content
4. **Paragraphs**: Use `leading-relaxed` for comfortable reading
5. **Maximum line width**: Keep body text under 70 characters for readability

---

## Spacing & Sizing

### Spacing Scale

Based on 4px base unit (Tailwind default).

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `1` | 0.25rem | 4px | Micro gaps |
| `2` | 0.5rem | 8px | Icon gaps, tight spacing |
| `3` | 0.75rem | 12px | Small padding |
| `4` | 1rem | 16px | Standard padding |
| `5` | 1.25rem | 20px | Medium spacing |
| `6` | 1.5rem | 24px | Section gaps |
| `8` | 2rem | 32px | Large spacing |
| `10` | 2.5rem | 40px | Component gaps |
| `12` | 3rem | 48px | Section padding |
| `16` | 4rem | 64px | Major sections |
| `20` | 5rem | 80px | Hero spacing |
| `24` | 6rem | 96px | Page margins |

### Container Widths

| Name | Width | Class | Usage |
|------|-------|-------|-------|
| Narrow | 448px | `max-w-md` | Forms, modals |
| Medium | 672px | `max-w-2xl` | Article content |
| Wide | 896px | `max-w-4xl` | Page content |
| Full | 1280px | `max-w-7xl` | Full layouts |

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

---

## Borders & Radius

### Border Radius Scale

| Token | Value | Class | Usage |
|-------|-------|-------|-------|
| None | 0 | `rounded-none` | Tables, some inputs |
| Small | 0.25rem | `rounded` | Badges, small elements |
| Medium | 0.5rem | `rounded-lg` | Buttons, inputs |
| Large | 0.75rem | `rounded-xl` | Cards, containers |
| XLarge | 1rem | `rounded-2xl` | Hero elements, modals |
| Full | 9999px | `rounded-full` | Pills, avatars, icons |

### Border Widths

| Token | Value | Class | Usage |
|-------|-------|-------|-------|
| Default | 1px | `border` | Standard borders |
| Medium | 2px | `border-2` | Focus rings, emphasis |

### Border Colors

| Usage | Class |
|-------|-------|
| Default | `border-earth-100` |
| Subtle | `border-earth-200/50` |
| Interactive hover | `border-sage-300` |
| Focus | `ring-sage-500` |

---

## Shadows

### Shadow Scale

| Level | Class | Usage |
|-------|-------|-------|
| None | `shadow-none` | Flat elements |
| Small | `shadow-sm` | Subtle elevation |
| Default | `shadow` | Cards at rest |
| Medium | `shadow-md` | Dropdowns |
| Large | `shadow-lg` | Modals, elevated cards |
| XLarge | `shadow-xl` | Cards on hover |

### Decorative Shadows

```css
/* Blurred background circles */
.blur-3xl {
  filter: blur(64px);
}

/* Usage: Decorative depth in hero sections */
<div className="absolute w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
```

---

## Icons

### Icon Guidelines

| Property | Value |
|----------|-------|
| Default Size | 20px (w-5 h-5) |
| Small Size | 16px (w-4 h-4) |
| Large Size | 24px (w-6 h-6) |
| Stroke Width | 1.5-2px |
| Style | Outline/stroke (not filled) |
| Color | `currentColor` or `text-sage-600` |

### Icon Containers

```jsx
/* Small icon container */
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-100 to-earth-100 flex items-center justify-center">
  <Icon className="w-4 h-4 text-sage-600" />
</div>

/* Medium icon container */
<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-500 to-earth-600 flex items-center justify-center shadow-lg">
  <Icon className="w-5 h-5 text-white" />
</div>

/* Large icon container (cards) */
<div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center">
  <CustomSVGIcon />
</div>
```

### Custom SVG Icons

Each content type has a unique decorative icon with gradient fills:

**Herb Icon**
- Shape: Leaf/droplet with stem details
- Gradient: Sage green (#4a7c59 → #6b8f71)

**Formula Icon**
- Shape: Mortar and pestle with herb dots
- Gradient: Contextual based on formula type

**Modality Icon**
- Shape: Energy/healing symbol with radiating lines
- Gradient: Varies by modality type

**Condition Icon**
- Shape: Abstract healing symbol
- Gradient: Contextual (purple for mental, red for cardiac, etc.)

---

## Illustrations

### Decorative Elements

#### Leaf Pattern
Repeating botanical pattern for backgrounds.

```jsx
<LeafPattern opacity={0.04} />
```

- Use in: Hero sections, CTA backgrounds
- Opacity: 0.03-0.05 (subtle)
- Colors: `sage-600`, `earth-600`

#### Blurred Circles
Soft, organic depth elements.

```jsx
<div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
<div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />
```

- Position: Absolute, outside main content flow
- Size: 48-64 (192-256px)
- Opacity: 15-20%
- Blur: `blur-3xl` (64px)

#### Corner Accents
Reveal on card hover for depth.

```jsx
<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sage-100/50 to-transparent rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
```

---

# Components

Reusable interface building blocks.

## Layout Components

### PageWrapper

Foundation wrapper for all pages.

**Usage**
```jsx
import { PageWrapper } from '@/components/ui/DesignSystem';

<PageWrapper>
  {/* Page content */}
</PageWrapper>
```

**Specifications**
| Property | Value |
|----------|-------|
| Background | Gradient: `cream-50` to `white` |
| Min Height | `100vh` |

---

### Section

Content section with optional header styling.

**Variants**

| Variant | Description | Class |
|---------|-------------|-------|
| `default` | Transparent, no border | `bg-transparent` |
| `card` | White card with shadow | `bg-white rounded-2xl shadow-lg border p-8` |
| `botanical` | Gradient with border | `bg-gradient-to-br from-earth-50 to-sage-50 rounded-2xl border p-8` |

**Usage**
```jsx
<Section
  icon={<SVGIcon />}
  title="Section Title"
  variant="card"
>
  {children}
</Section>
```

---

## Navigation Components

### Breadcrumbs

Hierarchical navigation indicator.

**Structure**
```jsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Herbs', href: '/herbs' },
    { label: 'Current Page' },
  ]}
/>
```

---

### BackLink

Return navigation link.

**Usage**
```jsx
<BackLink href="/" label="Return to Home" />
```

**Specifications**
| Property | Value |
|----------|-------|
| Color | `sage-600` |
| Hover | `earth-700` |
| Icon | Arrow left, 16px |
| Gap | 8px |

---

## Data Display Components

### Tag

Multi-variant label component for categorization.

**Variants**

| Variant | Background | Text | Border | Use Case |
|---------|------------|------|--------|----------|
| `earth` | `earth-100` | `earth-700` | `earth-200` | Primary actions, use cases |
| `sage` | `sage-100` | `sage-700` | `sage-200` | Benefits, TCM Cool |
| `gold` | `gold-100` | `gold-700` | `gold-200` | Highlights, TCM Warm |
| `warm` | `warm-100` | `warm-700` | `warm-200` | Warnings, TCM Hot |
| `muted` | `gray-100` | `gray-600` | `gray-200` | Neutral labels |

**Sizes**

| Size | Font | Padding |
|------|------|---------|
| `sm` | 12px | 8px × 2px |
| `md` | 14px | 12px × 4px |

**Usage**
```jsx
<Tag variant="sage" size="sm">Cool Energy</Tag>
```

---

### Card

Interactive content card with hover effects.

**Anatomy**
1. Container with rounded corners and border
2. Decorative corner accent (shows on hover)
3. Header section with gradient background
4. Body section with content
5. Footer with action link

**States**

| State | Shadow | Border |
|-------|--------|--------|
| Default | `shadow-sm` | `border-earth-100` |
| Hover | `shadow-xl` | `border-sage-300` |

**Usage**
```jsx
<Link className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 hover:border-sage-300 transition-all duration-300 overflow-hidden">
  {/* Corner accent */}
  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sage-100/50 to-transparent rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />

  {/* Header */}
  <div className="bg-gradient-to-br from-cream-50 via-sage-50/30 to-earth-50/20 p-6 border-b border-earth-100/50">
    {/* Icon and metadata */}
  </div>

  {/* Body */}
  <div className="p-5">
    <h3 className="font-serif text-lg font-bold text-earth-800 group-hover:text-sage-700 transition-colors">
      {title}
    </h3>
    {/* Content */}
  </div>
</Link>
```

---

### EmptyState

Graceful display when no content is available.

**Anatomy**
1. Gradient background container
2. Icon (64px, centered)
3. Heading (serif, earth-800)
4. Description text
5. Optional action button

**Usage**
```jsx
<EmptyState
  icon={<SVGIcon className="w-16 h-16 text-sage-400" />}
  title="No Herbs Found"
  description="Our botanical library is being cultivated."
  action={<Button>Add Herbs</Button>}
/>
```

---

## Feedback Components

### DisclaimerBox

Medical and educational disclaimers.

**Specifications**
| Property | Value |
|----------|-------|
| Background | Gradient: `gold-50` to `amber-50` |
| Border | `gold-200` |
| Border Radius | `xl` (12px) |
| Padding | 24px |
| Icon | Warning symbol in `gold-100` circle |
| Heading | `font-serif font-semibold text-gold-800` |
| Body | `text-sm text-gold-700` |

**Usage**
```jsx
<DisclaimerBox className="mb-8" />
```

---

## Form Components

### Input

Text input field styling.

**States**

| State | Border | Background |
|-------|--------|------------|
| Default | `border-earth-200` | `bg-cream-50/50` |
| Focus | `ring-sage-500 border-sage-500` | `bg-cream-50/50` |
| Error | `border-red-300` | `bg-red-50` |
| Disabled | `border-earth-200` | `bg-earth-100` |

**Specifications**
```jsx
<input
  className="w-full px-4 py-3 border border-earth-200 rounded-xl
             bg-cream-50/50
             focus:ring-2 focus:ring-sage-500 focus:border-sage-500
             transition"
/>
```

---

### Button

Primary interactive element.

**Variants**

| Variant | Style |
|---------|-------|
| Primary | Gradient background, white text, shadow |
| Secondary | Transparent, border, colored text |
| Ghost | No background or border |

**Primary Button**
```jsx
<button className="bg-gradient-to-r from-earth-600 to-sage-600 hover:from-earth-700 hover:to-sage-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
  Button Text
  <ArrowIcon />
</button>
```

**Secondary Button**
```jsx
<button className="bg-transparent border-2 border-earth-300 hover:border-sage-500 text-earth-700 hover:text-sage-700 px-6 py-3 rounded-xl font-semibold transition-all">
  Button Text
</button>
```

**Loading State**
```jsx
<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
```

---

## Decorative Components

### BotanicalDivider

Section separator with botanical motif.

**Usage**
```jsx
<BotanicalDivider className="my-12" />
```

**Structure**
```jsx
<div className="flex items-center justify-center gap-4">
  <div className="h-px bg-gradient-to-r from-transparent via-earth-300 to-transparent flex-1 max-w-32" />
  <LeafSVG className="w-6 h-6 text-sage-400" />
  <div className="h-px bg-gradient-to-r from-transparent via-earth-300 to-transparent flex-1 max-w-32" />
</div>
```

---

### LeafPattern

Repeating botanical background pattern.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `opacity` | number | 0.05 | Pattern visibility |

**Usage**
```jsx
<LeafPattern opacity={0.04} />
```

---

# Patterns

Common design patterns for specific use cases.

## Page Layouts

### Listing Page Pattern

Standard pattern for collection pages (herbs, modalities, conditions, formulas).

**Structure**
1. Hero section with gradient background and LeafPattern
2. Breadcrumbs
3. Page title with icon badge
4. Description text
5. Filter/sort tags
6. Controls bar (sort dropdown, pagination info)
7. Featured items grid (2 columns)
8. Full items grid (4 columns)
9. Pagination
10. BotanicalDivider
11. CTA section
12. DisclaimerBox
13. BackLink

```jsx
<PageWrapper>
  {/* Hero */}
  <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-earth-200/50">
    <LeafPattern opacity={0.04} />
    <div className="absolute ..." /> {/* Blurred circles */}

    <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
      <Breadcrumbs items={[...]} />

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="max-w-2xl">
          {/* Icon badge */}
          {/* Title */}
          {/* Description */}
          {/* Tags */}
        </div>
        {/* Controls */}
      </div>
    </div>
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto px-4 py-12">
    {/* Featured grid */}
    {/* All items grid */}
    {/* Pagination */}
    <BotanicalDivider />
    {/* CTA */}
    <DisclaimerBox />
    <BackLink />
  </div>
</PageWrapper>
```

---

### Detail Page Pattern

Standard pattern for single item pages.

**Structure**
1. Hero with item title and key metadata
2. Table of contents (sticky sidebar on desktop)
3. Content sections
4. Related items
5. DisclaimerBox
6. BackLink

---

### Form Page Pattern

Standard pattern for contact, login, and registration pages.

**Structure**
1. Centered hero section
2. Form card with white background
3. Supporting information sidebar (optional)
4. Success/error states
5. BackLink

---

## Data Visualization

### TCM Temperature Display

Displaying Traditional Chinese Medicine temperature/energy properties.

| Temperature | Tag Variant | Icon Color |
|-------------|-------------|------------|
| Hot | `warm` | Red/terracotta |
| Warm | `gold` | Amber/gold |
| Neutral | `muted` | Gray |
| Cool | `sage` | Sage green |
| Cold | `earth` | Deep earth/blue |

---

## User Feedback

### Loading States

**Inline Spinner**
```jsx
<span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
```

**Button Loading**
```jsx
<button disabled className="opacity-50">
  <Spinner /> Loading...
</button>
```

### Success States

Use sage-themed feedback:
```jsx
<div className="bg-gradient-to-br from-sage-50 to-earth-50 border border-sage-200 rounded-xl p-8 text-center">
  <CheckIcon className="w-16 h-16 text-sage-600 mx-auto mb-4" />
  <h3 className="font-serif text-xl font-semibold text-earth-800">Success!</h3>
</div>
```

### Error States

Use warm/red-themed feedback:
```jsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
  <ErrorIcon /> {message}
</div>
```

---

# Develop

Implementation details for developers.

## Utility Classes

### Alignment

| Class | Usage |
|-------|-------|
| `text-center` | Center-aligned text |
| `items-center` | Vertical center in flex |
| `justify-between` | Space between in flex |
| `mx-auto` | Horizontal centering |

### Layout

| Pattern | Classes |
|---------|---------|
| Page container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Card grid | `grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6` |
| Flex row | `flex items-center gap-4` |
| Stack | `flex flex-col gap-4` |

### Text

| Pattern | Classes |
|---------|---------|
| Heading | `font-serif text-2xl font-bold text-earth-800` |
| Body | `text-base text-earth-600 leading-relaxed` |
| Link | `text-sage-600 hover:text-earth-700 font-medium transition-colors` |
| Caption | `text-xs text-sage-500 font-medium uppercase tracking-wide` |

### Transitions

| Usage | Classes |
|-------|---------|
| Standard | `transition-all duration-300` |
| Quick | `transition-all duration-150` |
| Color only | `transition-colors` |
| Transform | `transition-transform` |

---

## Component Import

All shared components are available from the DesignSystem module:

```jsx
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Section,
  Tag,
  EmptyState,
  DisclaimerBox,
  BackLink,
  FeatureCard,
  HeroSection,
  StatsBar,
  CardGrid,
  IconBox,
  TableOfContents,
} from '@/components/ui/DesignSystem';
```

---

## Tailwind Configuration

Ensure these custom colors are in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      earth: { /* 50-900 scale */ },
      sage: { /* 50-900 scale */ },
      cream: { /* 50-200 scale */ },
      gold: { /* 100-700 scale */ },
      warm: { /* 100-700 scale */ },
    },
    fontFamily: {
      serif: ['Crimson Pro', 'Georgia', 'serif'],
      sans: ['Inter', 'sans-serif'],
    },
  },
}
```

---

# Accessibility

Guidelines for ensuring accessible experiences.

## Color Contrast

All text combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text):

| Combination | Ratio | Status |
|-------------|-------|--------|
| `earth-800` on white | 7.5:1 | AAA |
| `earth-600` on white | 5.2:1 | AA |
| `sage-600` on white | 4.6:1 | AA |
| White on `earth-600` | 5.2:1 | AA |
| White on `sage-700` | 5.8:1 | AA |

## Focus States

All interactive elements have visible focus indicators:

```jsx
className="focus:ring-2 focus:ring-sage-500 focus:outline-none"
```

Focus ring specifications:
- Width: 2px
- Color: `sage-500`
- Offset: 2px (where applicable)

## Keyboard Navigation

- All interactive elements are focusable
- Tab order follows visual order
- Skip links provided for main content
- Dropdown menus support arrow key navigation

## Screen Reader Support

- Use semantic HTML (`<nav>`, `<main>`, `<article>`, `<aside>`)
- Provide `aria-label` on icon-only buttons
- Use `aria-current="page"` for current navigation items
- Decorative images use `aria-hidden="true"` or empty `alt=""`

## Motion Preferences

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# Appendix

## Glossary

| Term | Definition |
|------|------------|
| **TCM** | Traditional Chinese Medicine |
| **Earth tones** | Warm brown color family from earth-50 to earth-900 |
| **Sage** | Green-gray color family inspired by sage leaves |
| **Botanical** | Plant-inspired decorative elements |
| **Apothecary** | Traditional pharmacy aesthetic reference |

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/) - Icon library
- [Google Fonts - Crimson Pro](https://fonts.google.com/specimen/Crimson+Pro)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | February 2024 | Initial design system release |
| 1.1.0 | February 2026 | Enhanced header, footer, new components (GlowCard, TestimonialCard, Accordion, etc.), improved animations |

---

# New Components (v1.1)

## GlowCard

Animated gradient border card with hover glow effect.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Card content |
| `className` | string | '' | Additional classes |
| `glowColor` | 'sage' \| 'earth' \| 'gold' \| 'tcm' | 'sage' | Glow color on hover |

**Usage**
```jsx
<GlowCard glowColor="sage">
  <div className="p-8">Content here</div>
</GlowCard>
```

---

## TestimonialCard

Quote/testimonial display with decorative elements.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `quote` | string | required | The testimonial text |
| `author` | string | required | Author name |
| `role` | string | optional | Author's role/title |
| `avatarInitials` | string | optional | 2-letter initials for avatar |
| `variant` | 'default' \| 'featured' | 'default' | Style variant |

**Usage**
```jsx
<TestimonialCard
  quote="Amazing platform for natural wellness!"
  author="Jane Doe"
  role="Wellness Coach"
  avatarInitials="JD"
  variant="featured"
/>
```

---

## Accordion

Collapsible FAQ/content sections.

**Props**
| Prop | Type | Description |
|------|------|-------------|
| `items` | `{ title: string; content: ReactNode }[]` | Accordion items |
| `className` | string | Additional classes |

**Usage**
```jsx
<Accordion
  items={[
    { title: 'Question 1', content: 'Answer 1' },
    { title: 'Question 2', content: 'Answer 2' },
  ]}
/>
```

---

## GradientText

Text with gradient color effect.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Text content |
| `variant` | 'earth' \| 'sage' \| 'tcm' \| 'gold' | 'earth' | Gradient colors |
| `className` | string | '' | Additional classes |

**Usage**
```jsx
<h2>Welcome to <GradientText variant="sage">Verscienta</GradientText></h2>
```

---

## BotanicalSeparator

Decorative section separator with pattern options.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pattern` | 'dots' \| 'leaves' \| 'wave' | 'dots' | Separator pattern |
| `className` | string | '' | Additional classes |

**Usage**
```jsx
<BotanicalSeparator pattern="leaves" />
```

---

## BotanicalProgress

Progress bar with botanical styling.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | required | Current value |
| `max` | number | 100 | Maximum value |
| `label` | string | optional | Label text |
| `showValue` | boolean | true | Show percentage |
| `variant` | 'sage' \| 'earth' \| 'gold' | 'sage' | Color variant |

**Usage**
```jsx
<BotanicalProgress value={75} label="Profile Completion" variant="sage" />
```

---

## ScrollIndicator

Animated scroll indicator for hero sections.

**Usage**
```jsx
<ScrollIndicator className="absolute bottom-8" />
```

---

## NumberedList

Ordered list with botanical number styling.

**Props**
| Prop | Type | Description |
|------|------|-------------|
| `items` | `{ title: string; description: string }[]` | List items |
| `className` | string | Additional classes |

**Usage**
```jsx
<NumberedList
  items={[
    { title: 'Step One', description: 'Description of step one' },
    { title: 'Step Two', description: 'Description of step two' },
  ]}
/>
```

---

## PillNav

Pill-style navigation/tabs.

**Props**
| Prop | Type | Description |
|------|------|-------------|
| `items` | `{ label: string; icon?: string }[]` | Navigation items |
| `activeIndex` | number | Currently active index |
| `onChange` | `(index: number) => void` | Change handler |
| `className` | string | Additional classes |

**Usage**
```jsx
<PillNav
  items={[
    { label: 'Overview', icon: '📋' },
    { label: 'Details', icon: '🔍' },
  ]}
  activeIndex={0}
  onChange={setActiveIndex}
/>
```

---

## InfoTooltip

Hover tooltip with botanical styling.

**Usage**
```jsx
<InfoTooltip content="Helpful information here">
  <span className="underline cursor-help">Hover me</span>
</InfoTooltip>
```

---

## PulseBadge

Badge with optional pulse animation for notifications.

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Badge content |
| `variant` | 'sage' \| 'earth' \| 'gold' \| 'red' | 'sage' | Color variant |
| `pulse` | boolean | true | Enable pulse animation |

**Usage**
```jsx
<PulseBadge variant="red">3</PulseBadge>
```

---

# Enhanced CSS Classes (v1.1)

## Animation Utilities

| Class | Description |
|-------|-------------|
| `float` | Floating animation (6s cycle) |
| `breathe` | Breathing scale animation (4s cycle) |
| `stagger-1` through `stagger-8` | Animation delay utilities |
| `shimmer` | Shimmer loading effect |
| `pulse-glow` | Pulsing glow effect |

## Card Classes

| Class | Description |
|-------|-------------|
| `card-botanical` | Enhanced botanical card with corner accent |
| `card-featured` | Featured card with dark gradient |
| `card-tcm` | TCM-themed card with warm colors |
| `card-shine` | Card with shine effect on hover |
| `gradient-border` | Card with gradient border |

## Hover Effects

| Class | Description |
|-------|-------------|
| `hover-leaf` | Reveals leaf decoration on hover |
| `underline-grow` | Growing underline on hover |
| `fade-in-up` | Fade in with upward motion (requires `.visible` to trigger) |

## Input Styling

| Class | Description |
|-------|-------------|
| `input-botanical` | Styled input with botanical theme |

## Button Styles

| Class | Description |
|-------|-------------|
| `btn-pill` | Base pill button style |
| `btn-pill-primary` | Primary gradient pill button |
| `btn-pill-secondary` | Secondary outline pill button |

## Scrollbar

| Class | Description |
|-------|-------------|
| `scrollbar-botanical` | Custom scrollbar with earth tones |
| `scrollbar-hide` | Hidden scrollbar (keeps functionality) |

## Text Effects

| Class | Description |
|-------|-------------|
| `text-shadow-sm` | Subtle text shadow |
| `text-shadow-md` | Medium text shadow |
| `text-shadow-lg` | Large text shadow |
| `grain-overlay` | Adds subtle grain texture |
| `line-clamp-1/2/3` | Truncate text to N lines |

---

*This design system is a living document maintained by the Verscienta Health team.*
