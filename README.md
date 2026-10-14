# Rhodes Day Planner

A phone-friendly web app for planning a day on Rhodes, Greece. It works on both iPhone and Android.

- **Your base:** set it with GPS, pick an area such as Old Town or Faliraki, or paste coordinates or a Google Maps link. All distances are measured from there.
- **48 places**, old and new: ancient ruins, Knights-era castles, Ottoman mosques, Italian-era architecture, modern art, beaches, villages and viewpoints.
- **Filters:** category (museum, vista, ruins, castle, beach…), range (≤2 km walk, ≤5 km, ≤15 km, whole island) and cost (free, cheap). Must-see places further away can still show up, so you don't miss them just because they're far.
- **Each place shows:** rating, cost (Free / € / €€ / €€€ with an approximate price), distance, walking time or "transport needed", how long to allow there, tips, and how to get there.
- **Marks:** ✓ Done, ✕ Ignore (hidden from now on) and ☆ Today. Everything is saved on your phone.
- **Search:** the box at the top of Explore finds any place by name in English or Estonian, ignoring the range and other filters. If a place isn't listed, *Search the map* looks it up on OpenStreetMap and **+ Add** saves it as your own place. You can also add your current location. Your own places always show in Explore, work with Today, Done and Ignore, appear on the map, and can be removed from their details view. Short `maps.app.goo.gl` links can't be read, so type the name instead.
- **Tap a place** to see a photo and the Wikipedia summary, in Estonian when an Estonian article exists. There's also a link to the full article. Map pins have a *Details* button that opens the same view.
- **Today tab:** orders your picked stops into the shortest route from your stay. The *🔁 Finish where I started* switch (on by default) makes it a round trip back to your stay, with leg distances, total time and entry costs. One tap opens the whole route in Google Maps. You can also ask it to suggest a walking day or a day trip.
- **Languages:** English and Estonian (eesti keel). Use the picker in the top bar. It starts in Estonian on phones set to Estonian.
- **Map tab:** OpenStreetMap with colour-coded pins and a 2 km walking circle.

## Use it on your phone

1. Open the GitHub Pages URL in Safari (iPhone) or Chrome (Android).
2. iPhone: Share → **Add to Home Screen**. Android: ⋮ → **Add to Home screen** / **Install app**.
3. When asked, allow location access, or pick your area from the list.

## Hosting (GitHub Pages)

Settings → Pages → *Build and deployment* → Source: **Deploy from a branch**, Branch: `main` / `(root)` → Save.
After about a minute, the app is live at `https://<your-username>.github.io/travel-check/`.

## Editing places

Estonian text for each place is in `pois-et.js`, and the interface text is in `i18n.js`. If a translation is missing, the app shows the English text instead. The `WIKI` map at the end of `pois.js` sets which Wikipedia article each place opens. An exact title is used only if the article is located on Rhodes or mentions it. An entry starting with `?` lists keywords: the app looks for a Wikipedia article located near the place whose title contains one of them. If nothing matches, no article is shown and the app offers a web search instead.


All places are in `pois.js`. Each one has coordinates, a category, an era, a rating from 1 to 5, a cost level (0 means free, up to 3), a price note, the suggested minutes to spend there, a description, a tip, and optionally `how` (getting there).

Prices are approximate for 2025–26. Greek state sites are about half price from November to March, so check on the day.

No build step and no dependencies apart from Leaflet, which loads from a CDN.
