# ARISE SYSTEM — Personal Strength Quest

> **Private. Made for one Hunter only (me). Not for sharing, not for distribution.**
> This app was designed and customised for my own use. Please do not share, post or redistribute it.

Solo Leveling themed whole-body bodyweight strength + isometric holds, daily.
South Indian budget diet. Level/rank/XP system. Works offline. No videos, no Drive links.

## What's inside
- System-window UI (blue/violet glow), E → S rank Hunter progression.
- Synthesized Solo Leveling style sound effects (System chime, quest complete, level-up "arise"). Toggle in **Vault → Sound effects**. No audio files, so it works offline.
- 7 motivation speeches (Asta / Yami spirit, one per weekday). Shown once each morning and as a card on the Quest tab. Edit them in `SPEECHES` in `js/data.js`.

## Run / host (privately)
Serve the folder from a **private** location. Opening `index.html` directly works for the UI; install + offline need http(s).
Keep any GitHub repo **private** (Settings → Danger zone → Change visibility). Do not enable public Pages.

## Install on phone
Open the URL once → Chrome ⋮ → *Install app*, or Safari Share → *Add to Home Screen*.

## Editing
- Exercises, weekly split, diets, speeches: `js/data.js`
- Look & feel: `css/solo.css` (palette on top), `css/style.css`
- After changing any file, bump `VERSION` in `sw.js` so the phone refreshes its cache.
