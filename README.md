# By the Boys Bakery

Astro / EmDash site for By the Boys Bakery in Germantown, Tennessee.

## Brand and design

The selected identity is versioned in [docs/brand](docs/brand/README.md). Read [DESIGN.md](DESIGN.md) before changing interface styling and [PRODUCT.md](PRODUCT.md) for audience and brand context.

- Runtime values: `src/styles/tokens.css`
- Tailwind aliases: `src/styles/app.css`
- Outlined logo masters: `public/brand/`
- Guide, booth sheets and packaging references: `docs/brand/`

## What's Included

- Posts with category and tag archives
- Static pages via slug routing
- Seed data with demo content
- D1 database and R2 storage pre-configured
- Dark/light mode support

## Pages

| Page | Route |
|---|---|
| Homepage | `/` |
| All posts | `/posts` |
| Single post | `/posts/:slug` |
| Category archive | `/category/:slug` |
| Tag archive | `/tag/:slug` |
| Static pages | `/:slug` |
| 404 | fallback |

## Infrastructure

- **Runtime:** Cloudflare Workers
- **Database:** D1
- **Storage:** R2
- **Framework:** Astro with `@astrojs/cloudflare`

## Local Development

```bash
pnpm install
pnpm dev
```

## Deploying

```bash
pnpm deploy
```

Or click the deploy button above to set up the project in your Cloudflare account.

## See Also

- [Node.js variant](../starter) -- same template using SQLite and local file storage
- [All templates](../)
- [EmDash documentation](https://github.com/emdash-cms/emdash/tree/main/docs)
