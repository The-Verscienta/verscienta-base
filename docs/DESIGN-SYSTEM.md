# Verscienta Health - World-Class Design System

## Design Philosophy

**Mission:** Bridge ancient herbal wisdom with modern science through intuitive, beautiful, and accessible design.

**Core Principles:**
1. **Natural & Organic** - Inspired by nature, earth tones, botanical imagery
2. **Trust & Authority** - Scientific credibility meets traditional wisdom
3. **Clarity & Accessibility** - Information-dense content made digestible
4. **Cultural Harmony** - Respectfully blend Eastern and Western aesthetics

---

## Color System

### Primary Palette

**Earth Tones (Primary Brand)**
```css
--earth-950: #1a2e1a;  /* Deep forest */
--earth-900: #2d4a2d;  /* Dark moss */
--earth-800: #3d5a3d;  /* Forest green */
--earth-700: #4d6a4d;  /* Sage dark */
--earth-600: #5d7a5d;  /* Primary green */
--earth-500: #6d8a6d;  /* Medium sage */
--earth-400: #8da58d;  /* Light sage */
--earth-300: #adbfad;  /* Pale sage */
--earth-200: #cdd9cd;  /* Very light */
--earth-100: #e6ede6;  /* Almost white */
--earth-50:  #f5f8f5;  /* Off-white green */
```

**Sage (Secondary)**
```css
--sage-950: #1e2d20;
--sage-900: #2a4030;
--sage-800: #365340;
--sage-700: #426650;
--sage-600: #527a5f;  /* Primary sage */
--sage-500: #6b9279;
--sage-400: #8aaa95;
--sage-300: #a9c2b1;
--sage-200: #c8dbcd;
--sage-100: #e7f3e9;
--sage-50:  #f3f9f4;
```

**Accent Colors**

**TCM Red (for Traditional Chinese Medicine elements)**
```css
--tcm-red-600: #c1272d;    /* Traditional Chinese red */
--tcm-red-500: #d63031;
--tcm-red-100: #ffe5e6;
```

**Gold (for premium/verified content)**
```css
--gold-600: #d4a574;
--gold-500: #e0b589;
--gold-100: #faf4ed;
```

**Status Colors**
```css
--success: #10b981;   /* Green - safe, verified */
--warning: #f59e0b;   /* Amber - caution */
--danger: #ef4444;    /* Red - contraindicated */
--info: #3b82f6;      /* Blue - informational */
```

### Background System

```css
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-tertiary: #f3f4f6;
--bg-earth: #f5f8f5;      /* Subtle earth tone */
--bg-sage: #f3f9f4;       /* Subtle sage tone */
--bg-overlay: rgba(0,0,0,0.5);
```

### Text Colors

```css
--text-primary: #111827;    /* Almost black */
--text-secondary: #4b5563;  /* Gray 600 */
--text-tertiary: #9ca3af;   /* Gray 400 */
--text-muted: #d1d5db;      /* Gray 300 */
--text-inverse: #ffffff;
```

---

## Typography

### Font Families

**Primary (Headings & Body)**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Secondary (Elegant headers)**
```css
--font-serif: 'Crimson Pro', Georgia, serif;
```

**Monospace (Code, IDs)**
```css
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

**Chinese (For TCM content)**
```css
--font-chinese: 'Noto Serif SC', serif;
```

### Type Scale

**Desktop**
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
--text-7xl:  4.5rem;    /* 72px */
```

**Mobile (scale down)**
```css
--text-4xl-mobile: 1.875rem;  /* 30px */
--text-5xl-mobile: 2.25rem;   /* 36px */
--text-6xl-mobile: 3rem;      /* 48px */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Spacing System

**Based on 4px grid**

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-base: 0.25rem;   /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

/* Colored shadows for emphasis */
--shadow-earth: 0 10px 15px -3px rgba(93, 122, 93, 0.15);
--shadow-sage: 0 10px 15px -3px rgba(82, 122, 95, 0.15);
```

---

## Component Patterns

### Cards

**Standard Card**
- Background: white
- Border: 1px solid gray-200
- Border radius: lg (8px)
- Shadow: md on hover → lg
- Padding: 6 (24px)
- Transition: all 200ms

**Feature Card**
- Background: gradient (earth-50 to sage-50)
- Border: 2px solid earth-200
- Border radius: xl (12px)
- Shadow: lg
- Padding: 8 (32px)

**Elevated Card** (for important content)
- Background: white
- Border: none
- Border radius: 2xl (16px)
- Shadow: xl
- Padding: 8 (32px)

### Buttons

**Primary**
- Background: earth-600
- Hover: earth-700
- Text: white
- Font weight: 600
- Padding: 3 6 (12px 24px)
- Border radius: lg
- Shadow: sm → md on hover
- Transition: all 150ms

**Secondary**
- Background: sage-100
- Hover: sage-200
- Text: sage-900
- Border: 2px sage-300

**Outline**
- Background: transparent
- Border: 2px earth-600
- Text: earth-600
- Hover: background earth-50

**Ghost**
- Background: transparent
- Hover: background earth-50
- Text: earth-700

### Badges

**Small pills for tags**
- Padding: 1 3 (4px 12px)
- Border radius: full
- Font size: xs
- Font weight: 600
- Letter spacing: 0.05em

**Status indicators**
- Dot + text
- Dot size: 8px
- Gap: 8px

### Input Fields

**Standard**
- Border: 1px gray-300
- Focus: 2px earth-600 ring
- Padding: 2.5 4 (10px 16px)
- Border radius: md
- Font size: base
- Background: white

**With Label**
- Label: text-sm, font-medium, gray-700
- Helper text: text-xs, gray-500
- Error text: text-xs, danger

### Navigation

**Top Navigation**
- Sticky header
- Background: white with backdrop blur
- Border bottom: 1px gray-200
- Shadow: sm
- Height: 72px desktop, 64px mobile
- Logo height: 40px
- Max width: 1280px centered

**Sidebar Navigation** (for detail pages)
- Sticky position
- Background: earth-50
- Border: 1px earth-200
- Width: 280px
- Padding: 6

---

## Layout Principles

### Grid System

**12-column grid**
- Container max-width: 1280px (xl)
- Gutter: 24px (space-6)
- Margin: 16px mobile, 24px tablet, 32px desktop

### Breakpoints

```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Responsive Patterns

**Mobile-first**
- Stack vertically by default
- 2-column at md
- 3-column at lg
- 4-column at xl

**Container Sizes**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px
- Full: 100%

---

## Iconography

### Icon Style

**Phosphor Icons** (recommended) or **Heroicons**
- Stroke width: 2px
- Size: 16px (sm), 20px (base), 24px (lg), 32px (xl)
- Color: inherits from parent

### Icon Usage

**In Buttons**
- Left icon: 16px, margin-right 8px
- Right icon: 16px, margin-left 8px

**In Cards**
- 32px - 48px for feature icons
- Colored backgrounds with icon contrast

**In Lists**
- 20px, aligned with first line of text

---

## Animation & Transitions

### Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Common Animations

**Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up**
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Scale In**
```css
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## Accessibility

### Color Contrast

- Text: Minimum AA (4.5:1 for normal, 3:1 for large)
- Interactive elements: AAA preferred (7:1)
- All status indicators: Include icons, not just color

### Focus States

```css
--focus-ring: 2px solid earth-600;
--focus-offset: 2px;
```

### Motion

- Respect `prefers-reduced-motion`
- Provide alternative static states

### Text

- Minimum font size: 14px (text-sm)
- Line height: 1.5 minimum for body text
- Max line length: 65-75 characters

---

## Content Patterns

### Hero Sections

**Homepage Hero**
- Height: 60vh minimum
- Background: gradient (earth-50 to sage-50)
- Image overlay: 20% opacity earth pattern
- Centered content
- CTA buttons: Primary + Secondary

### Section Headers

**Pattern:**
```
[Icon] Section Title (text-3xl, bold)
Subtitle/Description (text-lg, text-secondary)
---
Content
```

### Information Cards

**Herb/Modality Card Structure:**
```
[Large Icon or Image]
Title (text-xl, bold)
Scientific name (text-base, italic, text-secondary)
Short description (text-sm, 3 lines max)
[Badges: Tags/Properties]
[CTA: View Details →]
```

### Detail Pages

**Sticky Table of Contents**
- Left sidebar on desktop
- Collapsed menu on mobile
- Jump links to sections
- Progress indicator

**Content Sections**
- Clear visual hierarchy
- Icon + heading per section
- Collapsible on mobile
- Background variation (white/earth-50/sage-50)

---

## Special Elements

### TCM-Specific Design

**Yin-Yang Symbol**
- Use sparingly as decorative element
- Size: 40px - 80px
- Colors: earth-600 / sage-600

**Meridian Graphics**
- Line illustrations
- Color: tcm-red-600
- Background: cream/beige

**Chinese Characters**
- Font: Noto Serif SC
- Size: 1em - 1.2em
- Weight: normal
- Often paired with Pinyin (smaller, above)

### Conservation Warnings

**Endangered Species Alert**
```
[⚠️ Icon]
Background: amber-50
Border-left: 4px amber-500
Text: amber-900
Font weight: 600
```

### Safety Warnings

**Hierarchy:**
1. Critical (red) - Toxicity, severe interactions
2. High (orange) - Drug interactions, contraindications
3. Moderate (yellow) - Side effects, precautions
4. Low (blue) - General information

---

## Best Practices

### Do's ✓
- Use generous white space
- Group related information
- Progressive disclosure (show more/less)
- Consistent icon usage
- Clear visual hierarchy
- Mobile-first responsive design
- Optimize images (WebP format)
- Use semantic HTML
- Lazy load images
- Implement skeleton loaders

### Don'ts ✗
- Don't use more than 3 font families
- Don't use pure black (#000)
- Don't ignore loading states
- Don't hide critical information
- Don't use complex jargon without explanation
- Don't sacrifice accessibility for aesthetics
- Don't auto-play media
- Don't use tiny font sizes (<14px)

---

## Implementation Notes

### Tailwind CSS Configuration

Update `tailwind.config.ts` with this design system:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        earth: { /* earth palette */ },
        sage: { /* sage palette */ },
        tcm: { /* tcm red palette */ },
        gold: { /* gold palette */ },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Crimson Pro', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        chinese: ['Noto Serif SC', 'serif'],
      },
      boxShadow: {
        earth: '0 10px 15px -3px rgba(93, 122, 93, 0.15)',
        sage: '0 10px 15px -3px rgba(82, 122, 95, 0.15)',
      },
    },
  },
}
```

### Next Steps

1. Update Tailwind config with design tokens
2. Create reusable component library
3. Implement design system in Storybook (optional)
4. Create page templates
5. Add animations and micro-interactions
6. Optimize for performance
7. Test accessibility
8. Create dark mode variant (optional)

---

This design system creates a professional, trustworthy, and beautiful interface that honors both traditional herbal wisdom and modern scientific rigor.
