# Electron Trading — Website

Marketing & enrolment site for **Electron Trading**, a swing trading
mentorship programme. Static, dependency-free — open `index.html` in any
browser, or serve with any static host.

## Brand

> *Master the mind. Master the market.*

Built to match the 2026 Programme Guide (navy + gold, serif headlines with
italic accents).

## Sections

1. **Hero** — atomic logo, animated ambient candle stream, primary CTA
2. **Philosophy** — the three-step framework: Psychology → Setups → Execution
3. **Programme** — the six deliverables included in every tier
4. **Trajectory** — the 12-month sequence (Foundations → Pattern fluency → Live execution → Personal playbook)
5. **Tools** (interactive)
   - **Position Sizer & R-Multiple** — fixed-fractional sizing calculator with live KPIs
   - **Setup Spotter** — canvas-rendered animated patterns for the 4 high-revenue swing setups
6. **Tiers** — Foundations ₹7,999 · Practitioner ₹14,999 · Mastery ₹21,999
7. **Testimonials** — cohort voices
8. **FAQ** — accordion
9. **Inquire** — front-end-only contact form

## Files

```
website/
├── index.html      semantic markup, no framework
├── styles.css      brand system (navy + gold, Cormorant + Inter + JetBrains Mono)
└── app.js          hero canvas, position sizer, setup spotter, FAQ, form, scroll reveal
```

## Run locally

```bash
# Option 1 — just open in browser
open website/index.html

# Option 2 — serve (recommended; fonts load over the network)
cd website && python3 -m http.server 8000
# then visit http://127.0.0.1:8000
```

No build step. No dependencies. Pure HTML + CSS + vanilla JS.

## Notes

- The contact form is **front-end only** — wire it to an email service,
  Telegram bot, or your CRM of choice when ready.
- All copy in the Programme / Tiers / Philosophy sections is taken directly
  from the 2026 Programme Guide PDF.
- The site is fully responsive (1024 / 640 / smaller breakpoints).
