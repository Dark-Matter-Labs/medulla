# medulla Website Design

**Date:** 2026-03-09
**Project:** medulla — shared resilience node, Berlin
**Initiated by:** Politics for Tomorrow / nextLearning / Dark Matter Labs

---

## Overview

A single-page static HTML/CSS/JS website for medulla, a shared office and resilience-practice space at Dresdener Str. 113b, Berlin. The site informs visitors about the space and invites them to apply for membership. The application form is handled via Typeform (paid account), embedded as a popup overlay.

---

## Tech Stack

- **Static HTML/CSS/JS** — no framework, no build step
- **Typeform popup embed** — for the application form
- **Deployment:** Netlify or Vercel (drag and drop / git deploy)

---

## Design Language

### Typography
- **DM Serif Display** — large wordmarks and section labels ("medulla", "resilience")
- **DM Sans** — all body text, card headings, navigation
- Both loaded from Google Fonts

### Colour Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--color-dark` | `#111111` | Hero + Apply section backgrounds |
| `--color-light` | `#F5F3EE` | Body background |
| `--color-text` | `#1A1A1A` | Primary text on light |
| `--color-text-light` | `#F5F3EE` | Text on dark sections |
| `--color-accent` | `#C0392B` | "apply" CTA only |
| `--color-muted` | `#888880` | Labels, meta text |

### Layout
- Max content width: 1200px, centred
- Generous padding: 80px vertical section padding on desktop, 48px mobile
- Left-aligned text throughout
- Thin horizontal rules (`1px solid rgba(0,0,0,0.12)`) between cards
- Subtle fade-in-up on scroll (IntersectionObserver, no library needed)

---

## Page Structure

### 1. Hero (dark background `#111`)
- Full viewport height
- Left column: large "medulla" wordmark (DM Serif Display, ~120px), sub-label "initiated by Politics for Tomorrow / nextLearning and Dark Matter Labs"
- Right column: intro text (overlapping crises paragraphs) + bold "medulla is a shared resilience node..." summary
- Bottom strip: practical info — address, pricing, dates, deadline
- Large red "apply →" anchor link scrolls to Apply section

### 2. medulla (light background)
- Section label: small caps "medulla" top-left
- 3-column grid of 6 cards:
  1. purpose
  2. function
  3. architecture
  4. members
  5. convergence
  6. planetary
- Each card: bold DM Serif heading + DM Sans body text
- No card borders — whitespace and thin top rules only

### 3. resilience (light background, slight warm tint)
- Section label: small caps "resilience" top-left
- 3-column grid of 6 cards:
  1. urban
  2. infrastructural
  3. technological
  4. creative
  5. economic
  6. organisational

### 4. Apply (dark background `#111`)
- Large "apply" wordmark in accent red
- One-line invitation sentence
- Button: "Begin application →" — triggers Typeform popup overlay
- Practical deadlines reiterated in small type

### 5. Footer (dark, minimal)
- Logos: Politics for Tomorrow, nextLearning, Dark Matter Labs (SVG/PNG, white versions)
- Address: Dresdener Str. 113b, Berlin
- © medulla 2026

---

## Typeform Integration

- Typeform created with all application form questions (12 fields)
- Embed mode: **Popup** triggered by button click
- Typeform built-in integrations:
  - Email notification to medulla team on submission
  - Google Sheets connection via Typeform native integration
- Confirmation screen configured with the "We received your application!" thank-you text

---

## Application Form Questions (Typeform)

1. Name / Organisation name
2. WHO — What kind of work are you currently engaged in?
3. CONNECTION — How did you hear about medulla? Have we met before?
4. CURRENT CHALLENGE — Concrete challenge related to urban systems
5. WHY — Why interested in medulla? What role do you imagine it playing?
6. CONTRIBUTION — How do you imagine contributing?
7. DESKS — How many desks would you like to reserve?
8. TIMING — When would you move in? Permanent or temporary?
9. FINANCIAL CONTRIBUTION — 500 EUR/desk baseline; open to proposals
10. USE OF SPACE — How do you imagine using the space?

---

## Files Structure

```
medulla/
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
├── assets/
│   ├── fonts/          (if self-hosted)
│   └── logos/          (partner org logos)
└── docs/
    └── plans/
        └── 2026-03-09-medulla-website-design.md
```

---

## Success Criteria

- [ ] All content sections rendered correctly on desktop and mobile
- [ ] Typeform popup opens on "apply" button click
- [ ] Smooth scroll between sections
- [ ] Fade-in animations on scroll
- [ ] Loads in under 2 seconds (no heavy dependencies)
- [ ] Accessible: semantic HTML, sufficient colour contrast
