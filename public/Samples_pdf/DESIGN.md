---
name: Neo-Minimalist Mono
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#b71511'
  on-secondary: '#ffffff'
  secondary-container: '#db3327'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001551'
  on-tertiary-container: '#537aff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930004'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b6c4ff'
  on-tertiary-fixed: '#001551'
  on-tertiary-fixed-variant: '#0039b3'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-sm: 16px
  margin-md: 32px
  margin-lg: 48px
---

# Design System: Neo-Minimalist Mono

## Brand & Style
The brand identity has shifted from a warm, organic personality to a high-contrast, "Neo-Minimalist" aesthetic. It prioritizes clarity, technical precision, and a modern digital edge. The target audience is professional and tech-forward, valuing efficiency and structural integrity over decorative warmth.

The design style is a blend of **Minimalism** and **Modern Brutalism**. It utilizes a stark monochromatic base with aggressive accent pops, heavy structural lines, and generous whitespace to create a sense of organized power and sophisticated simplicity.

## Colors
The palette is anchored by a deep charcoal primary (#1a1a1a), replacing the previous orange tones with a commanding, neutral foundation. 

- **Primary (#1a1a1a):** Used for core branding, headlines, and high-emphasis UI elements.
- **Secondary (#e63b2e):** A vibrant red used for critical actions, highlights, and alerts.
- **Tertiary (#0055ff):** A technical blue used for secondary actions and data visualization.
- **Neutral (#4a4a4a):** Applied to supporting text and borders to maintain high legibility without the harshness of pure black.

The color strategy uses "semantic" derivation to ensure that interactive states and backgrounds maintain a cohesive, high-contrast relationship.

## Typography
The typography system pairs **Space Grotesk** for headlines and labels with **Inter** for body text. 

Space Grotesk provides a geometric, slightly quirky technical feel that reinforces the brand's modern edge. Inter is utilized for body copy to ensure maximum readability and a clean, neutral tone in dense information blocks. Headlines use tight line heights and bold weights to create a strong visual hierarchy. Labels are set in Space Grotesk with slight tracking to improve scannability in navigation and UI controls.

## Layout & Spacing
The system employs a **Fluid Grid** model based on an 8px spacing rhythm. Layouts should feel architectural and intentional.

- **Mobile:** 4-column grid with 16px margins.
- **Tablet:** 8-column grid with 24px margins.
- **Desktop:** 12-column grid with 32px to 48px margins.

Spacing is used to group related elements tightly while using large "macro-white-space" to separate major sections. This reinforces the minimalist aesthetic and prevents the high-contrast elements from feeling cluttered.

## Elevation & Depth
Depth is conveyed primarily through **Bold Borders** and **Tonal Layers** rather than soft shadows. 

The UI is intentionally flat. Structural hierarchy is established by 1px or 2px borders using the Neutral or Primary colors. When depth is required (such as in modals), a "hard shadow" approach or a simple high-contrast overlay is preferred. This maintains the "Neo-Minimalist" look and avoids the softness of traditional material design.

## Shapes
The shape language is **Soft (0.25rem)**. While the overall aesthetic is sharp and geometric, a subtle corner radius is applied to buttons and input fields to ensure the UI feels modern and engineered rather than aggressive. 

- **Standard Elements:** 4px (0.25rem) radius.
- **Containers/Cards:** 8px (0.5rem) radius.
- **Large Sections:** 12px (0.75rem) radius.

## Components
- **Buttons:** Primary buttons are solid #1a1a1a with white text. Secondary buttons use a #1a1a1a 1px border. All buttons use the 4px roundedness.
- **Inputs:** Clean, 1px border (#4a4a4a) that thickens or changes to #0055ff on focus. Labels use Space Grotesk.
- **Cards:** Defined by 1px borders rather than shadows. Card headers should use a light neutral background to separate them from the body.
- **Chips:** High-contrast tags using Tertiary (#0055ff) or Secondary (#e63b2e) colors for categorization and status.
- **Checkboxes/Radios:** Sharp, geometric appearance with #1a1a1a fill when selected.