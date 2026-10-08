# Bounce Base UI

Bounce Base is a proof-of-concept React catalog for browsing extracted bounce-house rental inventory from Supabase. The UI loads inventory records, displays responsive cards, supports client-side filters, and opens product details in a modal with a link back to the original company listing.

## Supabase configuration

The frontend uses Supabase's publishable key and reads these Vite environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Create a local `.env`:

```bash
cp .env
```

Example local values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the project URL and publishable key belong in this frontend configuration. Never expose or commit a Supabase secret key (or legacy service-role key) in a browser app; keep it on a trusted server. The Supabase table must allow read access through an appropriate Row Level Security policy for the publishable client.

Inventory is read from the `candidate_extractions` table. Change the table name in `src/lib/supabase.ts` by updating `INVENTORY_TABLE_NAME`. The proof-of-concept query currently loads up to `500` records, configured as `INVENTORY_RESULT_LIMIT` in the same file.

The UI selects `id`, `name`, `company`, `category`, `use_type`, `price`, `size`, `image_url`, and `product_url`, then orders by `company` and `name`.

## Local setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production build

```bash
npm run build
```

## Preview the production build

```bash
npm run preview
```

## GitHub Pages deployment

Pushing to `main` runs the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`. The workflow installs dependencies, builds the Vite static site, uploads `dist`, and deploys it to GitHub Pages.

The workflow derives the Pages base path from the repository name at build time, so the repository can be renamed without changing `vite.config.ts`. The Vite `base` option remains configurable through `VITE_BASE_PATH`, which keeps the app working under `/<repository-name>/` on GitHub Pages.

### One-time repository setting

After pushing this repository to GitHub, go to:

```text
Settings → Pages → Build and deployment → Source
```

Select:

```text
GitHub Actions
```
