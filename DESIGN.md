## v20–v28 (3 Nov 2026)

- **Font:** Noto Serif Display → Prata → Fraunces → Cormorant SC → **Fraunces** (final). Fraunces is set
  with `font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 0` on every `--title` rule. A comparison
  sheet of four candidates lives at `/mnt/project-files/website/font-options.png`.
- **Glow:** single fixed hue (`--glow-h: 62`), `blur(70px)`, lower opacities. The hue-rotation line was
  removed from main.js so the glow never changes colour.
- **My story:** replaced the old About section. Bold general lead, 11-therapies detail below,
  "it's what drives me" as the turn, then Hong Kong → UCLA → Columbia → the bridge she's building.
  Health details are hers verbatim; never invent more.
- **Headshot:** uncropped UCLA graduation photo, `width: 85%`, right-aligned so its bottom lands with
  the text column. Do not crop it.
- **Tile photos:** every tile opens with `<figure class="t-photo">`. On a wide/full tile the photo is
  absolutely positioned to the left half and the tile gets `padding-left: calc(50% + 1.4rem)`.
- **Mentally sub-groups:** Industry / Research / Community, each a `.group` with a hairline `.group-label`.
- **NEUROHACK NYC** tile added under Community.
- **Photos placed (v28):** CruX ← Future of Focus panel at UCLA; Refuel ← TEDxManhattanBeach booth;
  Panelist ← panel with mic; Lives Without Knives ← Conscious Fest booth (the Daily Bruin shot is still
  in `assets/` and unused). The Asian Hall of Fame line now reads "Heritage Gala 2026".
- **Do not publish** the Asian Hall of Fame press shot: it is a watermarked Getty image (Olivia Wong /
  Getty Images) and needs a licence.
- **Preview bug (fixed):** `mkpreview.py` used to copy only index.html, so the published artifact served
  a stale stylesheet for many versions. It now copies styles.css, main.js, favicon.svg, fonts/ and assets/.

> **Update 2026-11-03 (v19): headshot shown uncropped (her ask). Every Work tile now has a photo slot (.t-photo): it sits on top in single tiles and fills the left half of wide tiles, stacking on top below 560px. To fill one, swap the .ph span for <img src="assets/NAME.jpg" alt="...">. Images zoom slightly on hover.**

> **Update 2026-11-03 (v17): "About" was renamed "My story" in the nav and the section label. The story opens with her health journey (grew up with health issues; root-cause, stacked, personalized therapies changed her life), then Hong Kong → UCLA → Columbia, then bridging Eastern and Western healthcare.**

> **Update 2026-11-03 (v16): the Contact block was removed from About (her call: contact belongs in Book a chat); the email + copy button now sit under the Book a chat buttons. About is now a broad "who I am" in her own words: from Hong Kong, UCLA → Columbia M.S. BME, bridging Eastern and Western healthcare. A placeholder is waiting for her personal health story.**

> **Update 2026-11-03 (v15): removed "I'm a" from the hero (it now reads just Neurotech Builder & Founder). The About block is labelled "About" and leads with "Currently pursuing an MS in Biomedical Engineering at Columbia University..." in the large serif. No internship ask on the site, at her request.**

> **Update 2026-11-03 (v14): she picked the headline "I'm a Neurotech Builder & Founder" and the tagline "My mission is to empower people to unlock their full potential." The glow was turned up again (85% saturation, full opacity), and the hero has a soft text-shadow so it stays readable.**

> **Update 2026-11-03 (v12): glow made stronger on her ask (saturation 70%, opacity 0.95, blur 60px; tile spotlights at 0.5; hue sweeps about 140° across the screen and shifts with height).**

> **Update 2026-11-03 (v11): font is now Fraunces.** Best guess for the Amal font is IvyPresto Display (paid, Adobe Fonts; unconfirmed). She asked for a close free second. Fraunces (variable, OFL) at "opsz" 144, "SOFT" 0, "WONK" 0 matches it best: the flag ear on "g", the teardrops, the classic "&", the tall lowercase. Hero weight 440, letter-spacing -0.035em; other serif text weight 400, letter-spacing -0.02em. Every var(--title) rule also sets font-variation-settings. Prata and the Libre Caslon "&"/digit fallbacks are retired. If she gets an Adobe Fonts embed for IvyPresto, put it first in --title.

> **Update 2026-11-03 (v10): font swapped to Prata.** She said Noto Serif Display was the wrong font and sent a sharper Amal screenshot. After comparing 42 free serifs side by side, Prata (OFL, weight 400 only) is the closest match: wide, high-contrast, large x-height, ball terminals. Set it at letter-spacing about -0.035em (hero -0.05em, line-height 0.9). Prata's "&" is ornate and its digits are old-style ("1" reads as "l"), so "&", digits and "+" come from Libre Caslon Display via unicode-range faces "Amp" and "Nums" in the --title stack. The real Amal font is still unconfirmed (probably a paid Squarespace/Adobe font). Everything else from v9 below still applies.

> **Update 2026-11-03 (v9): matched her Amal screenshot.** Display serif is now Noto Serif Display (variable, OFL), set at font-stretch 85%, weight ~350–380, letter-spacing about -0.035 to -0.045em, mixed case. It is the closest free match to the Amal hero serif after comparing 35+ free fonts; the original looks like a commercial high-contrast display serif (likely a Squarespace-licensed face), unconfirmed. Colors from her screenshot: background #383E24, text lavender #E4DFF3, muted #BCB7C9. Sans (nav, "I'm a", subline) is Hanken Grotesk at regular weight, Helvetica-like. "Book a chat" nav item is an ellipse outline (border-radius 50%), like Amal's "Contact Me". Hero: small sans "I'm a", then Neural / Engineer & / Founder staggered right, subline in sans under the last line. Cormorant SC is retired.

# Design: Chandni Sacheti

> 2026-11-03 update (latest, wins over anything below): display type is **Cormorant SC** (300/400/500, self-hosted) as the free stand-in for Perpetua Titling Light, which she named; Hanken Grotesk stays for body/UI. Menu: About · Work · Speaking & Features · Book a chat (pill). Work = three pillars, each a full-width title row (name left, one-liner right) over a 4-column **tile board** (2 columns ≤1000px, 1 ≤560px): each tile has a small caps tag, a big titling 'hook' (a fact like 8 → 1, 100+, 150+, 1st place), one short caption, and an org/role footer. No paragraphs; wide tiles span 2. Tiles and speaking circles get a cursor spotlight; the page glow follows the cursor and shifts hue (olive → gold → rose, `--hue` set in main.js). Speaking & Features = three circles + a 'Featured in' list. The accordion described below is retired.

Updated 2026-11-03. Chandni asked to copy the Squarespace **Amal** template's layout and fonts (she rejected the bold fuchsia "comp card" and the cream/serif version). The demo site was blocked from this sandbox, so this follows Amal's text structure and published reviews (dark olive background, animated glowing orb, bold modern sans, big split role headline, mission, contact, large portrait, specialities accordion, speaking events in circles). Match exact font/spacing once she sends screenshots.

## Layout (top to bottom)
1. Bar: name left; About · Work · Book a chat right. Transparent, gains a blurred olive fill on scroll.
2. Hero: split headline "I'm a / Neural / Engineer / & Founder" (small "I'm a" and "&"), lines offset; her line "Empower to unlock full potential." right-aligned below.
3. Intro (#about): left = MISSION (large lead + paragraphs) and CONTACT (email + copy, New York, LinkedIn); right = 4:5 portrait.
4. Work (#work): "Three ways I unlock potential." then an accordion (native <details>): Mentally (open by default), Physically, Consciously; each opens to a 2-column grid of entries with small pill tags. #mentally / #physically / #consciously deep-link and open the item.
5. Speaking & Hosting: three circles (Future of Focus panel, LA Climate Week, Hashtag Impact podcast) + an "Also" line.
6. "Let's chat." with Email me (solid cream pill) and LinkedIn (outline pill).
7. Footer with LinkedIn, GitHub and Résumé (placeholders).

## Tokens
- --olive #2E3322 (background), --olive-2 #3A402B
- --cream #F1EEE3 (text, buttons), --cream-2 #CFCBB8 (secondary text), --line rgba(241,238,227,.22)
- Orb glows: --glow-1 #9AA86A, --glow-2 #C9B98A (blurred radial gradients, slow drift, off with reduced motion)
- Placeholders: --ph-bg #F3E7A8 / --ph-ink #3A3000

## Type
Hanken Grotesk variable (self-hosted). Headlines 700 with tight tracking (-0.045em): hero clamp(3.4rem, 11.5vw, 11rem), accordion titles up to 4.6rem, "Let's chat." up to 8rem. Leads 500 at 1.45–2.1rem. Body 400, 16–18px, line-height 1.65. Section labels: 0.85rem, 700, uppercase, 0.14em tracking (Amal style).

## Rules
- One dark olive world; only cream text on it.
- Content never hidden except inside the accordion, and Mentally starts open.
- Pills for buttons and tags; 1px translucent lines for dividers; no cards or shadows.
- Breakpoints: 860 (single column, accordion entries stack, circles stack), 520 (compact bar, hero lines unindented), 400 (brand above menu).
