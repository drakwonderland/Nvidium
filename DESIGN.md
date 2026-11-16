---
name: "Benchline Compute & IT"
version: "1.0.0"
updated: "2026-11-14"
tokens:
  colors:
    ground: "#F2F4F2"
    surface: "#FFFFFF"
    surfaceMuted: "#E6ECEB"
    brandPrimary: "#0D3A40"
    brandSurface: "#13484F"
    brandMid: "#1B5E67"
    brandTint: "#D4E1E2"
    brandSubtle: "#9FC2C5"
    accent: "#B94417"
    accentHover: "#993711"
    accentLight: "#FFB38A"
    ink: "#131B1E"
    inkMuted: "#3A4649"
    rule: "#1E2C30"
    ruleSoft: "rgba(19, 27, 30, 0.16)"
  typography:
    displayFont: "'Archivo', system-ui, -apple-system, sans-serif"
    bodyFont: "'Noto Sans', 'Segoe UI', system-ui, -apple-system, sans-serif"
    monoFont: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    scale:
      heroDisplay: "clamp(2.2rem, 4.3vw, 3.75rem)"
      h1: "clamp(2.15rem, 4.2vw, 3.65rem)"
      h2: "1.75rem"
      h3: "1.32rem"
      h4: "1.12rem"
      body: "1rem"
      wayfinding: "0.84rem"
      chip: "0.76rem"
  spacing:
    baseUnit: "4px"
    panelPadding: "1.5rem"
    bandPaddingHero: "3rem 1.25rem"
    bandPaddingSection: "2.75rem 1.25rem"
    rowGap: "0.72rem"
  radii:
    none: "0px"
    focusRingBlur: "0.2rem"
---

# Benchline Compute & IT — Design System Specification

## Overview
Benchline Compute & IT presents a digital business proposal and client-ready workstation configurator styled around ESD workbench calibration sheets and technical engineering ledgers. Across all eight HTML sections (`index.html` through `contact.html`), the interface relies on disciplined rectilinear geometry (`0px` corners), deep ESD teal anchoring (`#0D3A40`), crisp copper action highlights (`#B94417`), and tabular Philippine Peso (`₱`) numerals (`JetBrains Mono`) built over Bootstrap 5.3.3 grids (`css/styles.css`).

## Colors
- **Static-Safe Neutral Grounds**: `#F2F4F2` (`--esd-ground`) page backdrop paired with `#FFFFFF` (`--esd-surface`) ledger cards and `#E6ECEB` (`--esd-surface-muted`) secondary chips and scrollbar tracks.
- **Deep ESD Teal Family**: `#0D3A40` (`--esd-teal-900`) anchors navigation bars, full-bleed hero/section bands, table headers, and footers; `#13484F` (`--esd-teal-800`) defines inset calibration sheets (`.ledger-panel-dark`) and hover button fills; `#D4E1E2` (`--esd-teal-tint`) and `#9FC2C5` (`--esd-teal-subtle`) provide accessible secondary copy on dark surfaces.
- **Copper Trace Accents**: `#B94417` (`--esd-copper`) marks primary action buttons, active nav indicators, focus outlines, wayfinding progress bars, and `2px` perimeter callout panels (`.ledger-panel-copper`). Hover shifts cleanly to `#993711` (`--esd-copper-hover`). `#FFB38A` (`--esd-copper-light`) highlights key financial numbers and active indicators on dark `#0D3A40`/`#13484F` backgrounds.
- **Ink & Hairlines**: `#131B1E` (`--esd-ink`) body copy (17.5:1 on white), `#3A4649` (`--esd-ink-muted`) secondary labels, `#1E2C30` (`--esd-rule`) solid `1px` panel hairlines, and `rgba(19, 27, 30, 0.16)` (`--esd-rule-soft`) dashed intra-panel row rules.

## Typography
- **Display (`Archivo`, 600–800)**: Tight `-0.02em` to `-0.025em` tracking across `h1` (`clamp(2.15rem, 4.2vw, 3.65rem)`), `.hero-display` (`clamp(2.2rem, 4.3vw, 3.75rem)`), `h2` (`1.75rem`), `h3` (`1.32rem`), `h4` (`1.12rem`), button labels, and table headers.
- **Body (`Noto Sans`, 400–700)**: `1rem` base size (`1.62` line height), constrained to `max-width: 68ch` (`.prose-measure`) in long-form proposal narrative blocks (`58ch` for `.hero-lead`).
- **Tabular Financial Data (`JetBrains Mono`, 500–700)**: Applied via `.num-php` and `.font-mono-data` with `font-variant-numeric: tabular-nums` so Philippine Peso (`₱`) totals, deposits, percentages, timestamps, and reference slips align vertically across tables, calibration sheets, and sliders.

## Layout
- **Multi-Page Sequence**: Eight dedicated Bootstrap `container-xxl` pages wired with a persistent `sticky-top` header containing the `.esd-navbar` (`navbar-expand-xl`) and `.wayfinding-bar` progress indicator (`width` and `aria-valuenow` proportional to section 1–8), ending with `.stepper-band` Previous/Next controls and `.esd-footer`.
- **Responsive Grids**: Desktop (`1440px`) pairs asymmetric `7/5` columns on hero and configurator splits (`col-lg-7` + `col-lg-5`), 4-column executive summary strips (`col-md-6 col-xl-3`), and 50/50 comparative tables/diagrams. At mobile (`<=575.98px`), `@media (max-width: 575.98px)` tightens `.esd-navbar` padding (`0.6rem 0.5rem`) and brand scale (`0.88rem`) so brand SVG and `.navbar-toggler` stay on one horizontal row with zero overflow.

## Elevation & Depth
- **Flat Hardware Depth (No Drop Shadows)**: Cards, buttons, calibration panels, tables, and diagrams rely on background contrast transitions (`#F2F4F2` -> `#FFFFFF`, `#0D3A40` -> `#13484F`) and solid `1px`–`2px` perimeter borders rather than blurred shadows.
- **Focus Indicator**: Keyboard navigation applies a crisp `2px solid #B94417` focus-visible outline (`outline-offset: 2px`), with form controls adding `0 0 0 0.2rem rgba(185, 68, 23, 0.2)` on `:focus`.

## Shapes
- **Zero Border Radius (`0px`)**: Every structural box—`.ledger-panel`, `.ledger-panel-copper`, `.ledger-panel-dark`, `.btn-*`, `.status-chip`, `.stage-btn`, `.form-control`, `.form-select`, `.wayfinding-progress`, and `.chart-frame`—uses `border-radius: 0` for clean ledger sheet precision.
- **Equal-Perimeter Ruled Borders**: Panels use uniform `1px solid #1E2C30` or full-perimeter `2px solid #B94417` rules (never thick left/top accent bars). Rows inside ledgers separate via bottom `1px dashed` dividers (`rgba(19, 27, 30, 0.16)` light / `rgba(212, 225, 226, 0.24)` dark).

## Components
- **Calibration Panels**: `.ledger-panel` (`#FFFFFF`, `1px solid #1E2C30`, `1.5rem` padding), `.ledger-panel-copper` (`2px solid #B94417`), and `.ledger-panel-dark` (`#13484F`, `1px solid rgba(242, 244, 242, 0.28)` border).
- **Buttons**: Square `0px` Bootstrap-compatible buttons defining explicit `--bs-btn-*` CSS variables: `.btn-copper` (`#B94417` primary), `.btn-teal` (`#0D3A40` secondary), `.btn-esd-outline` (dark-surface outline), and `.btn-ink-outline` (light-surface outline).
- **Interactive Stage & Segment Pickers**: `.stage-btn` toggles between neutral `#FFFFFF` (`#E6ECEB` hover) and active `#0D3A40` state with `#FFB38A` `.stage-code` labels for Market segment profiles, Services build tiers, and 7-stage Operations SOP inspection.
- **Tabular Ledgers & Forms**: `.table-esd` with `#0D3A40` header bar (`border-bottom: 1px solid #B94417`), `#F6F8F7` striped rows, crisp `.form-range` sliders with `#B94417` thumbs, and custom inline SVG cash-flow curves inside `.chart-frame`.

## Do's and Don'ts
- **Do** format all financial currencies, percentages, dates, and quantities with `.num-php` (`tabular-nums`) and crisp Philippine Peso (`₱`) formatting via `Intl.NumberFormat('en-PH')`.
- **Do** maintain full `>=4.5:1` contrast (use `#FFFFFF`/`#F2F4F2`/`#FFB38A`/`#D4E1E2` strictly on `#0D3A40`/`#13484F`/`#B94417`, and `#131B1E`/`#3A4649` on `#FFFFFF`/`#F2F4F2`).
- **Do** keep `0px` corners and uniform borders across all custom components.
- **Don't** add thick `border-left` / `border-top` accent stripes on rounded/square cards, drop shadows, rounded pill badges, emoji icons, or non-PHP baseline estimates.
- **Don't** couple transient quote selections directly into the studio P&L assumptions unless the user explicitly imports the quote as a benchmark deal on `financials.html`.
