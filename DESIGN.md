# By the Boys Bakery design system

## Visual direction

Warm cream surfaces, chocolate typography, coral accents and restrained optional gold. The physical reference is the selected cream shipping label, cream badge on a clear cookie bag, and matching cream booth sheets. Preserve their warmth and readable hierarchy on screen.

## Source of truth

- Runtime tokens: src/styles/tokens.css. Tailwind aliases in src/styles/app.css reference those variables.
- Outlined logo and graphic masters: public/brand/.
- Written standards, review PDF and editable booth sheets: docs/brand/.

## Color

Coral #EF7858, cream #FFF3E3, chocolate #4B2418, optional gold #F4B775. Brown on cream is the default. Buttons use brown on coral and cream on brown when hovered. Functional error, success and stock states have separate tokens. Seasonal campaign palettes remain scoped to their campaigns.

## Typography

Nunito 400 for body copy, 700 for labels and buttons, 900 for headings. Optional 600 emphasis is supported. Logo lettering is outlined artwork, never retyped in a script font. Keep existing responsive text sizes and spacing during this foundation migration.

## Components and shapes

Buttons have a 12px radius; cards 20px; default borders 1.5px. No decorative hard offset shadows. Reuse BrandLogo.astro for the horizontal navigation and reversed footer marks. Preserve logo aspect ratio and clear space. Keep body paragraphs below 75ch where practical.

## Migration boundaries

This branch establishes tokens, logos and shared styling. Homepage content, CMS data, ordering behavior, seasonal campaign content and metadata-card artwork are outside this change. Future page layout changes should consume the canonical tokens and use the same SVG masters.
