# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Separate Multi-Page Static Website (8 HTML5 files: `index.html`, `about.html`, `services.html`, `market.html`, `marketing.html`, `operations.html`, `financials.html`, `contact.html`) built with Bootstrap 5.3, custom CSS3, and Vanilla JavaScript (`localStorage` + `URLSearchParams` fallback), deployed to a free static web host (GitHub Pages / Netlify / Vercel academic demo).

## Users

- **Primary Evaluator:** College/university instructor grading an 8-section digital business proposal assignment on technical execution, responsive Bootstrap grid usage, JavaScript interactivity, and business viability.
- **Simulated Customers (Prototype Audience):**
  - **B2C Corridor Buyers:** Architecture, engineering, and multimedia university students needing verified custom workstations without retail markup.
  - **B2B Corridor Clients:** Local creative studios, dental/medical clinics, and small-to-medium offices (5–25 endpoints) needing build-to-order hardware and predictable monthly IT SLA retainers.

## Product Purpose

Benchline Compute & IT is a digital business proposal website presenting a Katipunan–Diliman (Quezon City, Philippines) Custom PC Build and Managed IT Studio. The site explains the business model across all 8 required proposal sections while providing live JavaScript tools—a PC & SLA Quote Configurator, Market TAM/SAM/SOM Estimator, Marketing CAC/LTV Planner, Operations QA/SLA Simulator, Financial Break-Even & Tax Regime Simulator, and a Printable Proposal Dossier form—so evaluators can inspect both the written business plan and a working client experience prototype.

## Positioning

Unlike Gilmore-style hardware assemblers that compete solely on thin retail component margins and unlike enterprise MSPs priced out of reach for small Philippine offices, Benchline pairs **build-to-order hardware procurement (70% client deposit, zero shelf-stock depreciation)** with **local-corridor monthly B2B Managed IT retainers** backed by a 24-hour thermal/stress burn-in protocol and clear SLA response tiers.

## Operating Context

- **Currency & Locale:** Philippine Peso (`₱` / PHP) with `en-PH` formatting (`tabular-nums`) and Philippine business assumptions (DTI/Mayor's/BIR registration, statutory payroll benefits, and Non-VAT vs. ₱3M 12% VAT threshold).
- **Multi-Page Navigation:** Evaluators may jump directly to any of the 8 files or read sequentially from Section 1 (`index.html`) to Section 8 (`contact.html`). Every page must work on cold load (including `file://` and subpath hosting like GitHub Pages) without assuming prior pages were visited.
- **Print & Static Evaluation:** Evaluators frequently export sections to PDF (`@media print`) and test forms without a backend server.

## Capabilities and Constraints

- **Required Stack:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript. No backend servers, databases, or framework build tools.
- **Cross-Page State Isolation:** `ProposalStore` manages `activeQuote` (configured on `services.html`, attached read-only on `contact.html`, and optionally previewed on `financials.html`) separately from `financialAssumptions` so tweaking simulator sliders never corrupts a client quote.
- **Static Form Honesty:** `contact.html` validates client fields (including PH mobile format and RA 10173 privacy notice) and produces a printable/copyable Proposal Confirmation Slip plus optional `mailto:` draft, explicitly labeled as a static prototype (no server email transmission).
- **Relative Paths & Resilience:** All links and assets use relative `./` paths with `.html` extensions; storage calls use `try/catch` and schema versioning (`ccs10_proposal_state_v1`); financial math clamps inputs and handles `<= 0` contribution margin without `NaN` or `Infinity`.

## Evidence on Hand

- Currently a greenfield workspace containing only an empty `index.html`.
- Financial figures (CapEx, OpEx, build pricing, SLA rates, and corridor TAM/SAM/SOM counts) are structured academic business-proposal assumptions and must be labeled transparently in the proposal UI as illustrative planning baselines. No invented customer testimonials, press mentions, or live production telemetry may be claimed as real historical proof.

## Product Principles

1. **Cold-Start Independence:** Every one of the 8 pages renders complete, accurate baseline figures on first load even if `localStorage` is empty, disabled, or running under `file://`.
2. **Honest Unit Economics:** Separate pass-through hardware parts COGS from assembly fee margin, warranty reserve, and high-margin recurring SLA retainers; show assumptions openly.
3. **Interactive Substance Over Decoration:** Every page's JavaScript tool performs real proposal math or operational walkthroughs tied to the business model rather than decorative widgets.
4. **Clear Framing Between Proposal and Prototype:** Explicitly distinguish formal business-plan analysis from the interactive customer quote/dossier prototype so neither readers nor graders confuse internal company projections with customer invoices.
