# Readability, Spaces page & enquiry form — design

**Date:** 2026-09-23
**Status:** Approved in brainstorming. Awaiting implementation plan.
**Site:** medulla.city (static HTML/CSS/JS on Netlify, no build step)

## Goals

1. Make body text easy to read. Visitors reported the body font is hard to read.
2. Show the organisations that work in the space.
3. Make Medulla's offerings (memberships, spaces for hire, hosting events) easy to understand, **without publishing prices**.
4. Give visitors one low-friction way to get in touch, replacing the split between the email link and the Typeform.

## Non-goals

Published prices, booking calendars or availability, organisation logos, analytics, a German-language version of the site, and changes to how the scroll-deck works.

## Decisions (made with the site owner)

| Question | Decision |
|---|---|
| Body typeface | **Instrument Sans** (the companion to Instrument Serif) |
| Where the offerings live | Home deck stays as the story. A new **`/spaces` page** holds the details |
| Organisation roster | **Typeset names** with links, no logos |
| Typeform | **Replaced** by the on-site form. The team can send the Typeform link in their reply if a longer application is needed |
| Prices | **Not published.** Every offering says "Rates on request" |

## 1. Typography

- Load Instrument Sans (400, 500) in the same Google Fonts request as Instrument Serif, on every page.
- Split the single `--font` token into two:
  - `--font-display: 'Instrument Serif', Georgia, serif`
  - `--font-text: 'Instrument Sans', system-ui, sans-serif`
- **Display serif** is used for section labels, event titles, the sidebar tagline, room and membership names, the Impressum and privacy headings, and `<em>Medulla</em>` in the intro, which stays serif italic as a brand accent.
- **Text sans** is used for all paragraphs, event dates, subtitles and body copy, sidebar links and the address, buttons, form controls, and legal body text.
- Body line-height goes from 1.3 to about 1.5. Sizes are set slightly smaller than today, because Instrument Sans has a larger x-height (roughly `--b1` 17–21px, `--b2` 15–18px, final values tuned during the fit check below).
- **Fit constraint:** deck cards have fixed heights. Every card must fit with no clipping at 1440×900, 1280×720 and 390px-wide mobile. If a card overflows, trim its copy before shrinking the text further.

## 2. Home page (`index.html`)

The deck engine is unchanged: 9 cards, same staircase and parking.

**Members card (data-card 4)**
- Keep the copy, trimmed so it fits with the roster.
- Add an "In the space" roster: nextlearning · Dark Matter Labs · One Resilient Earth · VVSSL · WissDem · CommunAid, followed by *and independent practitioners*.
- Each name links to its website (`target=_blank rel=noopener`). URLs are to be looked up and confirmed with the owner. Any name that isn't confirmed stays unlinked.
- The CTA "Join" becomes "Become a member" and opens the enquiry form with interest set to Membership.

**Contacts card (data-card 6) becomes "work with us"**
- Label: `work with us`.
- One sentence carrying the current collaboration message.
- Three options, each linking to its anchor on `/spaces`:
  - **Work here:** flexible, dedicated and team desks, day passes → `/spaces#work`
  - **Hire a space:** full ground floor (120 m²), half ground floor (46 m²), meeting room (16.5 m²) → `/spaces#hire`
  - **Host an event:** evenings 18:00–21:30, for work that fits Medulla's purpose → `/spaces#host`
- A "Get in touch" button, which opens the form.

**Sidebar (all pages)**
- Order: Spaces · Events · Get in touch · LinkedIn · Instagram · hello@medulla.city · address · Impressum · Datenschutz.
- "Join" (Typeform) is removed.
- On the home page, "Get in touch" opens the form as an overlay (`<dialog>`), so the visitor keeps their place in the deck. On other pages it links to `/spaces#enquire`.

**Screen-reader content:** update the hidden `#main-content` sections so they match (the roster, work with us, a link to Spaces).

## 3. Spaces page (`spaces.html`, served at `/spaces`)

A normal scrolling page in the same visual language: grey background, off-white cards with the existing shadow and radius, the same sidebar with "Spaces" marked current. On mobile the sidebar collapses the way it does on the home page, and the grids stack. `index, follow`, with its own title, description and OG tags aimed at searches like "coworking / event space Kreuzberg".

Sections (each a card with an anchor):

1. **Intro:** the `spaces` label, a one-line description, and jump links (Work here · Hire a space · Host an event · Get in touch).
2. **Work here (`#work`)**, as rows with name, description, access tags and an Enquire button:
   - Flexible desk: 8, 10 or 14 days a month. Ground floor, phone booth, first floor when free.
   - Dedicated desk: your own seat on the first floor, any day. First floor, phone booth, event space evenings and weekends when free.
   - Team desks: a dedicated table for your organisation or group. Same access as the dedicated desk.
   - Day pass: 10 days to use across 3 months. Ground floor, phone booth.
   - Virtual: part of the community and programme, without a desk. **Wording to be confirmed by the owner.**
   - Footer line: "Rates on request. We'll send them with our reply."
   - Meeting-room access for members is **left out** until the open `???` cells in the sheet are resolved.
3. **Hire a space (`#hire`)**, as three cards with photo, name, size, minimum booking, what it's good for, and an Enquire button:
   - Ground floor: 120 m², from 3 hours or full day. Events, salons, screenings, gatherings.
   - Ground floor, half: 46 m², from 4 hours or full day. Workshops, trainings, smaller groups.
   - Meeting room: 16.5 m², from 4 hours or full day. Meetings, interviews, focused sessions.
   - Photos reuse the existing deck images where they fit (the conference photo for the meeting room). Capacities are added only if the owner supplies them.
   - "Rates on request."
4. **Host an event (`#host`):** the public-facing summary of the Event Protocol v1. It covers the purpose principle, the 18:00–21:30 standard window, residential-courtyard care (no loud music, doors closed), one named Event Lead, shoes off, and leaving the space as you found it. It then shows three steps: tell us → we confirm → promote once confirmed, and mentions that Medulla can list the event. Internal details (named staff, the draft-calendar step) are excluded.
5. **Get in touch (`#enquire`):** the enquiry form.

## 4. Enquiry form

**Fields**
1. Interest (required, single choice): Membership · Hiring a space · Hosting an event · Visiting / saying hello.
2. Option (optional, only shown for Membership or Hiring). Membership: Flexible desk · Dedicated desk · Team desks · Day pass · Virtual · Not sure yet. Hiring: Ground floor · Half · Meeting room · Not sure yet.
3. Date or timeframe, and group size (optional, only shown for Hiring or Hosting).
4. Name (required), Email (required, `type=email`), Organisation (optional).
5. Message (optional). The placeholder changes with the interest.
6. A privacy line linking to `/datenschutz`.

**Behaviour**
- Choice controls are real radio inputs styled as pills, so keyboard and screen-reader use works natively.
- Fields that are hidden for the current choice are also disabled, so they aren't submitted.
- **Prefill:** any element with `data-enquire="<interest>[:<option>]"` opens or focuses the form with those values set. `/spaces?interest=…&option=…#enquire` does the same, so the form can be linked from anywhere.
- Validation uses native `required` and `type=email`, plus inline error text tied to each field with `aria-describedby`. The first invalid field gets focus.
- Submission uses `fetch` POST (url-encoded) to `/` for Netlify.
  - **Success:** the form is replaced by "Thanks, {name}, we've got it. We'll reply to {email} within a few days." Focus moves to that message.
  - **Failure** (network or a non-2xx response): the input is kept, an error is shown, and there's a `mailto:hello@medulla.city` link prefilled with subject and body built from the form. The button is enabled again.
- **Without JavaScript:** the static form posts normally to Netlify with `action="/thanks"` and lands on a simple `thanks.html`.

**Implementation shape**
- One module, `scripts/enquiry.js`, holds the field config and pure helpers (`parsePrefill`, `encodeBody`, `buildMailto`, `visibleFieldsFor`) plus the DOM wiring. The same static form markup exists on `/spaces` and inside the home-page dialog. Both use `name="enquiry"` with identical field names, so Netlify's build-time detection sees them.
- Netlify attributes: `data-netlify="true"`, `netlify-honeypot="bot-field"`, a hidden `form-name=enquiry`, and a visually hidden honeypot field. No CAPTCHA.
- The home-page overlay is a native `<dialog>` (`showModal`), which provides the focus trap and Esc-to-close. Focus returns to the button that opened it. With reduced motion, it opens without the fade and scale.
- Duplicated markup is kept identical by a small test that compares the two forms' field names.

**Destination:** the Netlify Forms dashboard, plus email notifications to hello@medulla.city.

**Owner setup before launch:** in Netlify, Site configuration → Forms → **Enable form detection**, then add an email notification for the `enquiry` form. Exact steps go in the PR.

## 5. Privacy notice (`datenschutz.html`)

A German Datenschutzerklärung in the same format and styles as `impressum.html`. It covers the controller (nextlearning e. V., contact details as in the Impressum), hosting and server logs (Netlify), the enquiry form (purpose, legal basis Art. 6(1)(b)/(f) GDPR, processor Netlify, retention), Google Fonts, external links (Luma, LinkedIn, Instagram), and data-subject rights, including the right to complain to the Berlin data protection authority. It's linked from the sidebar and the form. **It must be reviewed by the organisation or legal counsel before the PR is merged.** It is drafted content, not legal advice.

## 6. Testing & verification

- **Unit tests** (Node built-in `node --test`, no dependencies) for the pure helpers in `enquiry.js` (prefill parsing, body encoding, mailto building, visible fields per interest) and a check that the forms on `index.html` and `spaces.html` have identical field names.
- **Fit check** at 1440×900, 1280×720 and 390×844: no clipping in any deck card, and the Spaces page is readable. Measured through the DOM, since screenshots of the moved deck cards come out blank in headless capture.
- **Manual browser checks:** every interest switch, required-field errors, success and failure states (failure simulated by stubbing `fetch`), the dialog opening and closing with focus handling, keyboard-only use, label and contrast checks.
- **End to end:** one real submission on the Netlify deploy preview, confirmed in the dashboard, with the test entry reported to the owner.

## 7. Rollout

- **PR A: typography only.** Can merge right away.
- **PR B: roster, work with us, sidebar, `/spaces`, enquiry form, `thanks.html`, `datenschutz.html`.** Merge checklist: privacy notice reviewed · Netlify form detection on and email notification set · Virtual wording confirmed · organisation URLs confirmed.

## Open items for the owner (they don't block the build)

- What Virtual membership includes.
- Room capacities (seated and standing).
- Which photo shows the ground floor.
- Organisation website URLs (to be looked up and confirmed).
- The `???` cells for member meeting-room and event access (kept off the site until resolved).
