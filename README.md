<div align="center">

<img src="assets/logos/medulla-wordmark-wide.svg" alt="Medulla" width="360" />

**A physical space in Berlin for turning shared urgency into collective resilience.**

[medulla.city](https://medulla.city) · [Events](https://luma.com/medulla) · [Join](https://form.typeform.com/to/aBO8faXO) · [hello@medulla.city](mailto:hello@medulla.city)

</div>

---

This repository is the website for **Medulla**, a community of practice at Dresdener Str. 113B, Berlin, building the capacities, relationships and infrastructures needed to navigate crisis and create more liveable futures.

It is a single-page static site: plain HTML, CSS and JavaScript, with no framework and no build step. Scrolling drives a 3D card deck. Each card lifts and parks at the top as a thin cascading stack, and the Events card stays as the base.

## Quick start

```bash
npx serve . --listen 3456 --no-clipboard
```

Then open <http://localhost:3456>. The same server is configured in [.claude/launch.json](.claude/launch.json).

## Project layout

```
index.html        The page: cards, structured data, an accessible text mirror
impressum.html    Legal notice
styles/main.css   All styling, including card geometry
scripts/main.js   Scroll-driven card deck, progress bar, copy fitting
scripts/lib/      Vendored Lenis (smooth scroll)
assets/           Self-hosted fonts, icons, logos, and images (assets/images/figma)
docs/             Design notes and implementation plans
netlify.toml      Cache headers
```

CSS owns the card geometry and JS only measures it, so desktop and mobile share one engine. The deck falls back to a static stacked layout under `prefers-reduced-motion` and on very short landscape screens.

## Adding an event

Events live in the `.events` list inside the Events card in [index.html](index.html), most recent first. Copy an existing `<a class="event">` block and update:

1. The Luma link and `aria-label`
2. The date, title, subtitle and body copy
3. The image: add a WebP to `assets/images/figma/` and point `<img src>` at it

## Notes

- **Typography:** Instrument Serif and Instrument Sans, self-hosted in `assets/fonts` under the SIL OFL (licences included).
- **Caching:** HTML, CSS and site JS revalidate on every visit so deploys show up immediately. Fonts and vendored libraries are cached long-term, and file names are not content-hashed. To replace a font or library, give the new file a new name instead of overwriting it. See [netlify.toml](netlify.toml).
- **Membership:** the Join link goes to a Typeform application form, and events are listed on Luma.

## Contact

[hello@medulla.city](mailto:hello@medulla.city) · Dresdener Str. 113B, Berlin
