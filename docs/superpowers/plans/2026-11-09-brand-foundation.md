# Brand foundation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Version the selected identity with the site and make its shared styles consume one canonical token source.

**Architecture:** Store written and print references in docs/brand, outlined SVG masters in public/brand, and runtime values in src/styles/tokens.css. Keep CSS and Tailwind consumers mapped to those variables; use one logo component in the site shell. Preserve CMS queries, content, pricing and seasonal themes.

**Tech Stack:** Astro 7, Tailwind 4, React 19, CSS custom properties.

## 1. Capture the identity

- [x] Copy the current 12-page review PDF and written standards to docs/brand; copy editable booth sources and font license. Document their review status and placeholder content.
- [x] Copy the 14 SVG masters unchanged to public/brand, with SHA-256 provenance in docs/brand/assets.json. Exclude redundant PNG/PDF logo exports and the superseded guide.
- [x] Link the brand source of truth from README, PRODUCT.md and DESIGN.md.

## 2. Consolidate runtime styles

- [x] Move shared token declarations from global.css into tokens.css. Define coral #EF7858, cream #FFF3E3, chocolate #4B2418 and optional gold #F4B775 exactly once.
- [x] Map existing decorative aliases to the new palette while keeping functional status tokens distinct. Set Nunito headings to 900, buttons to 700, borders to 1.5px and hard shadows to none.
- [x] Map app.css @theme inline values to canonical variables. Do not create a second JSON palette or copy proposed token files unchanged.
- [x] Replace text logos in SiteNav and SiteFooter with one BrandLogo component using the supplied outlined horizontal masters. Load Nunito in both site layouts and remove Pacifico.
- [x] Migrate existing base-brand section and inquiry colors, borders and hard shadows to shared tokens. Ensure coral surfaces use brown text. Preserve seasonal campaign palettes and all form behavior.

## 3. Verify and hand off

- [x] Run npm run test, npm run typecheck and npm run build. npm runs the repository scripts without pnpm trying to reinstall the locally cloned dependency tree.
- [x] Inspect the homepage and inquiry page at desktop and mobile widths. Check logo sizing, focus, button hover contrast, horizontal overflow and generated CSS aliases.
- [x] Check SVG hashes, git diff --check, and confirm main checkout's two existing local changes remain untouched.
- [ ] Commit the isolated branch and prepare a reviewable pull request. Do not deploy or merge to main without the owner's review.

## Verification evidence

- Existing suite: 12 tests passed.
- Astro check: 0 errors, 0 warnings, 1 existing Zod deprecation hint in src/actions/index.ts.
- Production build: successful; large-chunk notice remains.
- Browser: home and inquiry at 1280px and 320px; desktop navigation breakpoint at 861px; no horizontal overflow, both SVG logos loaded, exact palette values and Nunito 900 confirmed, visible input focus and coral/brown submit button confirmed.
- Independent review: fixed header offsets and hover/focus visibility; canonical aliases and all 14 master hashes verified.
- Original main checkout: public/metadata-card.png and .vscode/settings.json remain untouched.
- Local verification used an isolated copy of D1/R2 state, not remote data; no migrations or seeds ran.
