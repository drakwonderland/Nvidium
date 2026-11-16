# Benchline Compute & IT — 8-Page Digital Business Proposal

* **Author:** CCS10 Student Proposal Team
* **Date:** 2026-11-14

## Overview

This project delivers an 8-page responsive web proposal built with HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript for **Benchline Compute & IT**, a proposed custom PC build and managed IT services studio in the Katipunan–Diliman university and SME corridor (Quezon City, Philippines). The business pairs a **build-to-order hardware deposit model** (70% client deposit upon purchase order to eliminate shelf-stock GPU/CPU depreciation) with **recurring monthly B2B IT maintenance retainers** priced in Philippine Peso (`₱`).

The site maps 1:1 across the 8 required assignment sections (`index.html`, `about.html`, `services.html`, `market.html`, `marketing.html`, `operations.html`, `financials.html`, `contact.html`). Pages share resilient client-side state via a versioned `localStorage` wrapper so a customer quote assembled on `services.html` can be previewed inside the `financials.html` deal-impact simulator and attached as a locked quote slip on `contact.html`.

## Analysis

Six parallel Goldfish reviews (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`) surfaced seven critical structural and economic risks:

1. **Client Quote vs. Studio Break-Even Conflation:** Wiring one configured customer order on `services.html` directly over the studio's monthly break-even parameters on `financials.html` mixes retail/B2B ticket pricing with company-wide fixed overhead. Each page must work independently on cold load: `financials.html` anchors on fixed studio assumptions (startup CapEx, monthly fixed OpEx, build throughput, active B2B retainer seats) and imports the `services.html` quote only as an optional "Benchmark Deal Preview" without mutating baseline company math.
2. **Hardware Pass-Through Revenue vs. BIR ₱3M VAT Cliff:** In custom PC assembly, 82%–88% of a rig's price is pass-through component COGS. Counting gross ticket revenue as operating profit exaggerates viability, and ~50 builds/year at ₱60,000 exceeds the Philippine BIR ₱3,000,000 gross-sales VAT threshold. `financials.html` must separate parts COGS, build/assembly fee margin, a 3% RMA reserve, recurring SLA margin, step-fixed technician labor thresholds, and an explicit Philippine Tax Regime toggle (Non-VAT 8% / 3% OPT vs. 12% VAT).
3. **Dual-Audience Friction & Segment Separation:** Mixing B2C student buyers (who rarely buy recurring IT retainers) with B2B creative studios and SMEs obscures the value proposition and creates grading dissonance between an academic proposal and a live storefront. `index.html` must frame `services.html` and `contact.html` as a "Live Client Experience Prototype" within the proposal, while separating B2C build tiers + walk-in diagnostics from B2B Managed IT SLA retainers (with explicit workmanship warranty vs. distributor RMA rules and a bounded corridor service radius).
4. **Cross-Page `localStorage` & Static-Host Fragility:** Unversioned `localStorage` breaks on cold starts, private browsing (`SecurityError`), `file://` local inspection, corrupted JSON, or `bfcache` navigation. State must live in a single `ProposalStore` adapter with `schemaVersion: 1`, `try/catch` in-memory + `URLSearchParams` link fallback, `.textContent`/`.value` DOM rendering (no raw `.innerHTML` from storage), numeric clamping, zero/negative contribution-margin guards (no `Infinity`/`NaN`), and a visible state provenance banner with a Reset action.
5. **Static Contact Form & Hosting Constraints:** Static hosts (GitHub Pages, Netlify, Vercel) reject `<form method="POST">` with HTTP 404/405, and `mailto:` fails silently for users without desktop mail apps. `contact.html` must perform Bootstrap 5 + PH mobile validation (`09xxxxxxxxx` / `+639xxxxxxxxx`) + RA 10173 privacy consent and output an honest client-side **Proposal Dossier Confirmation Slip** (printable via `@media print`, copyable to clipboard, with an optional `mailto:` draft), explicitly marked as a static demo submission. Deployment guidance must note Netlify Free / GitHub Pages static academic demo usage and keep per-page payloads light.
6. **8-Page Shell Duplication & Path Portability:** Root-relative paths (`/css/styles.css`) break on GitHub Pages project subpaths (`/<repo>/`), and `fetch()` header/footer loaders fail under `file://` with CORS errors. All 8 HTML files must keep static `<header>`/`<nav>`/`<footer>` markup using strictly relative `./` paths, explicit `.html` extensions, sequential Section 1–8 progress wayfinding, and a non-overlapping Rubric Ownership Matrix.
7. **Currency Glyph Coverage & Responsive Tables:** Financial tables overflow narrow screens unless wrapped in `.table-responsive`, and webfont stacks must verify `U+20B1` (`₱`) glyph rendering with `tabular-nums` alignment and pinned CDN + SRI hashes (or guarded runtime fallbacks).

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Implement 8 distinct, responsive HTML5 pages mapped 1:1 to all 8 rubric sections (`index.html` through `contact.html`) using Bootstrap 5.3, custom CSS3 tokens, and Vanilla JS.
  * Provide genuine interactive JavaScript across the proposal: live PC Build + B2B SLA Quote Builder (`services.html`), Target Corridor TAM/SAM/SOM & Segment Filter (`market.html`), Channel Allocation & CAC/LTV Calculator (`marketing.html`), Build QA & SLA Triage Simulator (`operations.html`), Break-Even / Tax Regime / Cash-Flow Simulator (`financials.html`), and Auto-Populated Printable Proposal Dossier (`contact.html`).
  * Isolate single-deal state (`activeQuote`) from studio-level financial baselines (`financialAssumptions`) with cold-start defaults, error guards, and `@media print` stylesheets.
* **Out-of-Scope Non-Goals:**
  * Backend APIs, payment gateways, real-time distributor API scraping, or unrequested user accounts/authentication.
  * Unconstrained part-by-part PC compatibility engine (curated build tiers + verified add-ons prevent invalid socket/wattage mixes).
  * Unverified financial or customer claims (all figures in the proposal are labeled clearly as baseline planning assumptions for the proposed venture).

## Alternatives Weighed

* **Single-Page Scroll Application vs. 8 Separate HTML Files:** A single page eliminates header/footer duplication, but the student explicitly selected the 8-file multi-page architecture so every rubric section stands as its own navigable route. Static semantic shells with relative links and a Section 1–8 stepper address the duplication and wayfinding risk.
* **URL Query Strings Only vs. Versioned `localStorage` + `URLSearchParams` Fallback:** Pure query strings get dropped if a user browses `services.html` -> `market.html` -> `contact.html`. Using `ProposalStore` (`localStorage` + `schemaVersion: 1` + query-string / in-memory fallback) preserves quote state across non-linear exploration while staying safe under `file://` or restricted storage.
* **External Charting Library Dependency vs. Native Canvas/SVG + Accessible Table:** Adding a heavy external chart CDN creates an offline single point of failure. Using lightweight Vanilla JS SVG/Canvas visualization backed by a responsive Bootstrap table avoids CDN failure states while remaining readable in print and offline grading.

## Key Decisions & Staging for Next Steps

1. **Brand & Operating Baseline:** Name the venture **Benchline Compute & IT**, sited in **Katipunan–Diliman Corridor, Quezon City**, operating on a **70% hardware procurement deposit + 30% upon 24-hour QA burn-in completion** for builds, paired with tiered **B2B Managed IT Retainers** (`₱`).
2. **Strict Rubric-to-File Ownership:**
   * `index.html`: Section 1 — Home Page (Logo, Tagline, Introduction, Proposal Framing & Navigation Hub)
   * `about.html`: Section 2 — About the Business (Background, Mission, Vision, Objectives, Legal Roadmap, Team)
   * `services.html`: Section 3 — Products and Services (B2C Builds, B2B SLA Retainers, Live Quote Configurator, Warranty vs. RMA Policy)
   * `market.html`: Section 4 — Target Market (Corridor Personas, TAM/SAM/SOM Estimator, Competitor Comparison)
   * `marketing.html`: Section 5 — Marketing Strategy (4Ps Mix, Pricing Strategy, Corridor Channels, CAC vs. LTV Calculator)
   * `operations.html`: Section 6 — Business Operations (7-Stage Build & Burn-In Workflow, Tools/Equipment, Capacity & SLA Triage Simulator)
   * `financials.html`: Section 7 — Financial Proposal (Startup CapEx, Monthly OpEx, BIR Tax Mode, Break-Even & 12-Month Projection Simulator)
   * `contact.html`: Section 8 — Contact Information (Proposed Address, Hours, Phone/Email/Socials, RA 10173 Notice & Printable Quote Slip)
3. **Next Step:** Present key Goldfish objections alongside Impeccable visual design directions (`concept-seed`), obtain user direction selection, record surface brief, and build the 8-page site.
