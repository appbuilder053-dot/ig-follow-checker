# Instagram Follow‑Back Checker (Client‑Only)

Paste your **Following** and **Followers** lists and instantly see:
- Who you follow that doesn’t follow you back
- Who follows you that you don’t follow
- Mutuals

Everything runs **locally in your browser** — nothing is uploaded.

## Run locally
```bash
npm install
npm run dev
```

## Build for production
```bash
npm run build
npm run preview
```

## Deploy options
- **Vercel**: Import this repo → Deploy (zero config).
- **Netlify**: New site from Git → Build command: `npm run build`, Publish dir: `dist/`.
- **GitHub Pages**: Build locally, then push `dist/` to `gh-pages` branch or use an action.

## Legal / compliance
- This app processes pasted text or your official Instagram “Download Your Information” export.
- No scraping, automated login, or server storage. Not affiliated with Instagram.
