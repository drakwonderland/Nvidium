# Nvidium

Static multi-page business proposal and interactive custom PC quote configurator for **Nvidium**, a Loyola Heights (Katipunan–Diliman, Quezon City) workstation build workshop and local IT support service.

Live site: https://ccs10.l-ala.studio

## Pages & Routes

Served with clean extensionless URLs via [vercel.json](./vercel.json):

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Business overview, live saved spec sheet, and section directory |
| `/about` | `about.html` | Origin story, mission/vision, 3-year goals, DTI/BIR permits, and team |
| `/services` | `services.html` | Custom PC configurator with part compatibility checking and SLA care plans |
| `/market` | `market.html` | Customer segment selector, 8 km corridor coverage, and competitor comparison |
| `/marketing` | `marketing.html` | Monthly promo budget and lead/LTV planner |
| `/operations` | `operations.html` | 7-step build workflow, 24-hour stress test, and IT support SLA simulator |
| `/financials` | `financials.html` | Buyer installment calculator, ₱345,000 startup budget, and break-even model |
| `/contact` | `contact.html` | Workshop details, attached quote summary, and printable inquiry slip |
| `/checkout` | `checkout.html` | Order confirmation flow with `<dotlottie-wc>` animation and receipt output |

## Stack & Structure

- **Markup**: Semantic static HTML5 + Bootstrap 5.3.3 (CDN)
- **Styling**: [css/styles.css](./css/styles.css) using `IBM Plex Sans`, `Noto Sans`, and `IBM Plex Mono`
- **Client Logic**: Vanilla JS ([js/app.js](./js/app.js)) managing state (`localStorage` + query params), part compatibility rules, calculators, and checkout choreography
- **Visual Assets**: Custom technical diagrams under `assets/img/` and Lottie animation at [assets/lottie/payment-success.lottie](./assets/lottie/payment-success.lottie) rendered via `@lottiefiles/dotlottie-wc`
- **Hosting**: Static deployment on Vercel (`cleanUrls: true`, `trailingSlash: false`)

## Local Preview

Since this is a pure static site with no build step, serve the repository root with any static HTTP server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser. Note that extensionless route redirects (`/about` -> `about.html`) are handled in production by Vercel via `vercel.json`.

## Deployment

Pushes to the default GitHub branch automatically trigger production deployments on Vercel (`nvidium` project -> https://ccs10.l-ala.studio).
