# Weekly System Report - Design System

## Creative North Star: The Sovereign Ledger
This is not a standard dashboard; it is an authoritative, high-density technical document. It draws inspiration from archival military reports and high-end horology—where every millimeter of space is intentional, and precision is the ultimate luxury. We are moving away from the "web app" feel and toward a "system interface" feel. 

The aesthetic identity is defined by **Hard-Edged Brutalism** meets **Editorial Sophistication**. We achieve this through:
*   **Absolute Geometry:** A strict 0px radius policy that conveys uncompromising structural integrity.
*   **Asymmetric Technical Data:** Using mono-spaced labels to "anchor" fluid headings.
*   **Intentional Negative Space:** Utilizing a centered document-style layout to create a sense of focus and importance, contrasting with the high-density technical data within.

---

## Typography

Typography is the primary vehicle for the "System Report" aesthetic. We pair a high-impact sans-serif with a functional mono-space.

- **Primary Font / Headlines:** Inter
- **Body Font:** Inter
- **Labels / Technical Data:** Space Grotesk (Mono)

*   **Display & Headlines (Inter):** These must feel heavy and urgent. Set with **bold weight** and **tight tracking (-0.02em to -0.04em)**. This creates a "block" of text that feels like a stamped seal.
*   **Technical Labels (Space Grotesk/Mono):** All `label-md` and `label-sm` tokens must use the mono-spaced font. This is for metadata, timestamps, and system readouts. It should be set in **All Caps** with **letter-spacing (+0.05em)** to ensure legibility at small scales.

---

## Color Palette

The palette is rooted in a deep, void-like atmosphere, punctuated by high-contrast metallic accents.

### Primary Colors
- `primary`: `#f2ca50`
- `on_primary`: `#3c2f00`
- `primary_container`: `#d4af37`
- `on_primary_container`: `#554300`

### Secondary Colors
- `secondary`: `#dac58d`
- `on_secondary`: `#3c2f05`
- `secondary_container`: `#544519`
- `on_secondary_container`: `#c8b37d`

### Tertiary Colors
- `tertiary`: `#bfcdff`
- `on_tertiary`: `#082b72`
- `tertiary_container`: `#97b0ff`
- `on_tertiary_container`: `#254188`

### Surfaces & Backgrounds
- `background`: `#131313`
- `on_background`: `#e5e2e1`
- `surface`: `#131313`
- `on_surface`: `#e5e2e1`
- `surface_variant`: `#353534`
- `on_surface_variant`: `#d0c5af`
- `surface_container_lowest`: `#0e0e0e`
- `surface_container_low`: `#1c1b1b`
- `surface_container`: `#201f1f`
- `surface_container_high`: `#2a2a2a`
- `surface_container_highest`: `#353534`
- `surface_dim`: `#131313`
- `surface_bright`: `#3a3939`
- `surface_tint`: `#e9c349`

### Outlines & Accents
- `outline`: `#99907c`
- `outline_variant`: `#4d4635`

### Error States
- `error`: `#ffb4ab`
- `on_error`: `#690005`
- `error_container`: `#93000a`
- `on_error_container`: `#ffdad6`

### Extended Primary Fixed Colors
- `primary_fixed`: `#ffe088`
- `on_primary_fixed`: `#241a00`
- `primary_fixed_dim`: `#e9c349`
- `on_primary_fixed_variant`: `#574500`

### Extended Secondary Fixed Colors
- `secondary_fixed`: `#f7e1a6`
- `on_secondary_fixed`: `#241a00`
- `secondary_fixed_dim`: `#dac58d`
- `on_secondary_fixed_variant`: `#544519`

### Extended Tertiary Fixed Colors
- `tertiary_fixed`: `#dbe1ff`
- `on_tertiary_fixed`: `#00174b`
- `tertiary_fixed_dim`: `#b4c5ff`
- `on_tertiary_fixed_variant`: `#27438a`

### Inverse Colors
- `inverse_surface`: `#e5e2e1`
- `inverse_on_surface`: `#313030`
- `inverse_primary`: `#735c00`

---

## Architectural Principles

### The "No-Line" Rule
Traditional UI relies on borders to separate content. This design system prohibits standard 1px solid borders for sectioning. Boundaries must be defined through **Tonal Shifts**. 
*   Use `surface_container_low` for the main body area.
*   Transition to `surface_container_highest` for interactive or highlighted sections.
*   If a visual break is required, use a 4px vertical block of `primary` gold rather than a horizontal line.

### Elevation & Depth
In a system with 0px rounding, traditional shadows can feel "muddy." We use **Tonal Layering** as the primary source of depth.
*   **The Layering Principle:** Place a `surface_container_high` card on top of a `surface_container_low` background. The contrast in luminescence creates a sharper, more modern "lift" than a drop shadow.
*   **Ambient Shadows:** If an element must float, use a high-displacement shadow: `box-shadow: 0 20px 40px rgba(0,0,0,0.6)`. The shadow must be nearly black to blend into the `background`, creating a "void" rather than a grey smudge.
*   **The "Ghost Border" Fallback:** For secondary buttons or subtle containers, use the `outline_variant` token at **15% opacity**.
*   **Glassmorphism:** For overlays, use `surface_container` with a `backdrop-filter: blur(12px)`.

### Signature Textures
To avoid a "flat" digital feel, apply a subtle linear gradient to the `primary_container` (`#d4af37`). 
*   **The "Metal" Gradient:** `linear-gradient(180deg, #f2ca50 0%, #d4af37 100%)`. Use this for Primary CTAs and critical status indicators to give the gold a tactile, forged quality.
