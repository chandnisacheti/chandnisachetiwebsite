# chandni-site

Chandni Sacheti's personal site. Plain HTML, CSS and a little JavaScript, no build step.

## Files

- `index.html`: all the words. Edit text here directly.
- `styles.css`: the design. Colors and spacing live in the `:root` block at the top.
- `main.js`: the Mentally / Physically / Consciously tabs and the copy-email button.
- `fonts/`: Archivo variable font, self-hosted (SIL Open Font License, see `fonts/OFL.txt`).
- `assets/`: put photos here.
- `DESIGN.md`, `PRODUCT.md`, `.impeccable/`: design decisions, so future edits stay consistent.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Replace placeholders

Anything on a yellow highlight (`class="ph"`) is a placeholder. Search `index.html` for `class="ph"`.

- Headshot: save as `assets/headshot.jpg` (4:5 portrait, at least 1200 × 1500) and swap the `portrait-empty` block for the `<img>` line in the comment above it.
- Links marked `link-ph` or `is-ph`: set the real `href`, and remove the `ph` span, the `link-ph` / `is-ph` class and `aria-disabled`.

## Deploy on Cloudflare Pages (free)

1. Push this folder to a GitHub repo.
2. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: Framework preset **None**, build command empty, output directory `/`.
4. Save and deploy. The site goes live at `<project>.pages.dev`, and every push redeploys it. Add a custom domain under the project's Custom domains tab.

## Adding tile photos
Put the image in `assets/`, then in `index.html` replace the yellow `<span class="ph">Photo: ...</span>` inside that tile's `<figure class="t-photo">` with `<img src="assets/NAME.jpg" alt="short description">`. Any shape works because it is cropped to fit. Landscape, around 1200px wide, under 300 KB, is best.
