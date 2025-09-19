# Fitness Tracker PWA (v3.11c)

Personal progressive web app (PWA) fitness tracker.

## Features
- Calendar-first startup (no popups)
- Day 1/2/3 schedule (Day 1 alternates Tue→Mon starting 2025‑09‑23; Day 2 Wed; Day 3 Sun)
- Color-coded days (Day1 blue, Day2 green, Day3 yellow) with labels like “23 TUE”
- Workouts: main supersets with 5/3/1 % for barbell lifts; fixed prescriptions for RDL, Goblet Squat, BFESS
- Accessory inputs with weight logging
- Extras logging (+ badge on calendar, detail popup)
- Stats: adherence %, last accessory weights, AMAP bests, extras mini + history
- 1RM chart (Back Squat, Deadlift, Front Squat)
- Preloaded 1RMs: Back Squat 110, Deadlift 180, Front Squat 95
- PWA manifest + service worker (offline)

## Deploy with GitHub + Cloudflare Pages
1) Create a public GitHub repo (e.g., `fitness-tracker`).  
2) Upload the contents of this folder (index.html, app.js, style.css, manifest.json, service-worker.js, icons/).  
3) Cloudflare Pages → Create project → Connect to GitHub → select repo.  
   - Framework preset: **None**  
   - Build command: *(leave blank)*  
   - Publish directory: `/`  
4) Deploy. Your site will be available at `https://<project>.pages.dev`.  
5) On iPhone Safari: open your URL → Share → Add to Home Screen.
