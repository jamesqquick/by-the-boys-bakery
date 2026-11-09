# By the Boys Bakery brand

This folder versions the selected brand direction with the website. Start with [standards.md](standards.md) and the [12-page guide](brand-guidelines-v1.0.pdf). The guide is the v1.0 review edition: working size limits and production advice still need a supplier proof on the actual stock.

## Source of truth

| What | Canonical location | How to use it |
| --- | --- | --- |
| Palette, type, shape and semantic UI tokens | `src/styles/tokens.css` | Change values here; CSS and Tailwind both consume them. |
| Tailwind mappings | `src/styles/app.css` | Alias tokens; never repeat brand HEX values here. |
| Outlined logo and graphic masters | `public/brand/*.svg` | Use these exact paths on the site and share vectors with suppliers. |
| Shared web logo | `src/components/BrandLogo.astro` | Use horizontal brand artwork on cream and cream artwork on chocolate. |
| Written usage rules | `docs/brand/standards.md` | Update alongside changes to the identity. |
| Printable reference | `docs/brand/brand-guidelines-v1.0.pdf` | Share with vendors; update when the written standards change. |
| Booth menu and order/follow signs | `docs/brand/booth-templates/` | Editable HTML and PDF, with clearly marked placeholders. |
| Packaging concepts | `docs/brand/packaging-references/` | Placement and material references, never logo masters. |

`assets.json` records hashes of the unchanged SVG masters copied from the selected identity release. The website serves these small vectors from `public/brand`; PDFs, print templates, packaging references and fonts in this folder are not published as site assets.

## Token usage

Use role-based tokens for new code:

```css
.panel { background: var(--color-bg); color: var(--color-fg); }
.button { background: var(--action-primary-bg); color: var(--action-primary-text); }
.button:hover { background: var(--action-primary-hover-bg); color: var(--action-primary-hover-text); }
```

Tailwind equivalents are `bg-background text-foreground` and `bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-hover-foreground`. Existing `strawberry`, `butter`, `sky` and `mint` aliases remain temporarily so older components still render coherently. Prefer semantic roles in new components. Functional status colors are separate; seasonal campaign palettes remain scoped.

The runtime CSS is authoritative. The earlier brand kit's proposed JSON and CSS token files are not copied here, avoiding a competing palette. The PDF retains its original pre-integration description; this README describes the repository's current integration.

## Changing the brand

1. Update `tokens.css` for runtime values and the written standards for usage rules.
2. Edit the SVG master first when lettering or geometry changes. Preserve aspect ratio, then regenerate required print or raster exports outside `public/`.
3. Update `assets.json` after an intentional master change. Re-export the PDF guide if its rules or artwork changed, and record the revision below.
4. Run `pnpm test`, `pnpm typecheck` and `pnpm build`; inspect home, inquiry and a seasonal page on desktop and mobile.
5. Review the feature branch before merging into main. Use the repository's existing deployment workflow after review.

## Initial website migration

This branch applies the selected palette, Nunito hierarchy, 1.5px borders and removal of hard offset shadows to the shared base-brand styles. It replaces navigation/footer text logos with outlined artwork. Existing content, pricing, inquiries, CMS data and campaign-specific colors are preserved. Further page composition and photography updates can follow in separate changes.

The clear-bag sticker remains cream with brown lettering and coral accents. The cookie illustration remains omitted. Booth files need real flavors, prices, contact information and a working QR code before display.

## Revision log

- 2026-11-09: v1.0 identity imported; shared runtime tokens consolidated; first site foundation migration prepared.
