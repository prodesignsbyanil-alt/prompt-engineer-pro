# Prompt Engineer Pro — GitHub & Vercel Ready

This repo contains a Next.js (App Router) app with TailwindCSS.  
**One prompt == one design**, bundle layout options included, Excel export, Gmail login gate, API Key manager.

## Local Development
```bash
npm install
npm run dev
# open http://localhost:3010
```

## Deploy to GitHub
1. Create a **new repository** on GitHub (public or private).
2. Upload these files (or run `git init`, `git add -A`, `git commit -m "init"`, `git branch -M main`, `git remote add origin <repo-url>`, `git push -u origin main`).

## Deploy to Vercel
**Option A — Import from GitHub (recommended):**
1. Go to https://vercel.com/new and **Import Git Repository**.
2. Select this repo, keep defaults (Framework: Next.js).  
3. Click **Deploy**. Done.

**Option B — Upload ZIP directly:**
1. Go to https://vercel.com/new, choose **Import Project → From a Template → Other**.
2. Click **Upload**, select this ZIP, then **Deploy**.

### Environment / Node
- Node >= 18.17 (declared in `package.json`).  
- `vercel.json` included with `buildCommand: npm run build`. No extra config necessary.

---

© Developed By **Anil Chandra Barman**
