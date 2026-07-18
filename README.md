# Bounce Base UI

Bounce Base is a placeholder landing page for a future marketplace that helps people find and compare bounce house rentals near them.

This repository contains only the React frontend. It does not include the Python data-pipeline project or any backend/API integration.

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

The workflow derives the Pages base path from the repository name at build time, so the repository can be renamed without changing `vite.config.ts`.

### One-time repository setting

After pushing this repository to GitHub, go to:

```text
Settings → Pages → Build and deployment → Source
```

Select:

```text
GitHub Actions
```
