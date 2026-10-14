"use strict";

// ---------- Constants ----------
const WALK_KMH = 4.8;
const DRIVE_KMH = 40;          // average incl. town traffic and mountain roads
const ROUTE_FACTOR = 1.3;      // straight line -> real path
const EASY_WALK_KM = 2;        // straight-line km
const MAX_WALK_KM = 4.5;
const MUST_SEE = 4.6;

const PRESETS = [
  { name: "Old Town", lat: 36.4445, lng: 28.2265 },
  { name: "New Town / Mandraki", lat: 36.4530, lng: 28.2215 },
  { name: "Ixia", lat: 36.4285, lng: 28.1830 },
  { name: "Ialysos", lat: 36.4130, lng: 28.1600 },
  { name: "Faliraki", lat: 36.3390, lng: 28.2040 },
  { name: "Kolymbia", lat: 36.2550, lng: 28.1600 },
  { name: "Lindos", lat: 36.0920, lng: 28.0860 },
  { name: "Pefkos", lat: 36.0630, lng: 28.0650 },
];

// ---------- State (persisted on this device) ----------
const KEY = "rhodes-day-planner:v1";
const state = load();

function load() {
  const def = { lang: null, loop: true, base: null, status: {}, today: [], range: 2, mustSee: true, cats: [], sort: "dist", cost: "any" };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? Object.assign(def, JSON.parse(raw)) : def;
  } catch { return def; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

// ---------- Language ----------
const T = () => STRINGS[state.lang] || STRINGS.en;
const phoneIsEstonian = /^et\b/i.test(navigator.language || "");
function t(key, ...args) {
  const v = T()[key] ?? STRINGS.en[key];
  return typeof v === "function" ? v(...args) : v;
}
// Place text in the current language, falling back to English.
function loc(p, field) {
  const tr = state.lang === "et" ? POIS_ET[p.id] : null;
  return (tr && tr[field]) || p[field];
}
const catLabel = c => T().cats[c] || STRINGS.en.cats[c];
const eraLabel = e => T().eras[e] || STRINGS.en.eras[e];
const dec = s => state.lang === "et" ? s.replace(/(\d)\.(\d)/g, "$1,$2") : s;

// Built-in names (GPS default, preset areas) follow the language; typed names stay as typed.
function baseLabel(name) {
  for (const L of Object.values(STRINGS)) {
    if (name === L.myStay) return t("myStay");
    const k = Object.keys(L.presets).find(k => L.presets[k] === name);
    if (k) return T().presets[k] || k;
  }
  return name;
}

function applyStaticText() {
  document.documentElement.lang = state.lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll(".flags [data-lang]").forEach(b => b.classList.toggle("on", b.dataset.lang === (state.lang || "en")));
  $("#presets").innerHTML = PRESETS.map((p, i) => `<button type="button" data-i="${i}">${esc(T().presets[p.name] || p.name)}</button>`).join("");
}

// ---------- Geo helpers ----------
function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtKm(d) { return d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : dec(`${d.toFixed(d < 10 ? 1 : 0)} km`); }
function fmtMin(m) {
  m = Math.max(1, Math.round(m));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r}` : `${h} h`;
}
function walkMin(d) { return d * ROUTE_FACTOR / WALK_KMH * 60; }
function driveMin(d) { return d * ROUTE_FACTOR / DRIVE_KMH * 60 + 5; }

function travel(d) {
  if (d <= EASY_WALK_KM) return { kind: "walk", label: t("walk", fmtMin(walkMin(d))), cls: "walk" };
  if (d <= MAX_WALK_KM) return { kind: "longwalk", label: t("longWalk", fmtMin(walkMin(d)), fmtMin(driveMin(d))), cls: "longwalk" };
  return { kind: "ride", label: t("ride", fmtMin(driveMin(d))), cls: "ride" };
}

function mapsLink(dest, mode, origin) {
  const p = new URLSearchParams({ api: "1", destination: `${dest.lat},${dest.lng}`, travelmode: mode });
  if (origin) p.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${p}`;
}

// ---------- Derived data ----------
function withDistance(p) {
  const d = state.base ? km(state.base, p) : NaN;
  return { ...p, d };
}
function costOk(p) {
  if (state.cost === "free") return p.cost === 0;
  if (state.cost === "cheap") return p.cost <= 1;
  return true;
}
function exploreItems() {
  const items = POIS.map(withDistance).filter(p =>
    !state.status[p.id] &&
    (state.cats.length === 0 || state.cats.includes(p.cat)) &&
    costOk(p) &&
    (isNaN(p.d) || p.d <= state.range || (state.mustSee && p.rating >= MUST_SEE))
  );
  const by = {
    dist: (a, b) => a.d - b.d,
    rating: (a, b) => b.rating - a.rating || a.d - b.d,
    value: (a, b) => b.rating / (a.d + 0.5) - a.rating / (b.d + 0.5) || 0,
  }[state.sort];
  // Keep everything within range first, must-sees beyond it after.
  return items.sort((a, b) => {
    const ia = a.d <= state.range ? 0 : 1, ib = b.d <= state.range ? 0 : 1;
    return ia - ib || (isNaN(a.d) ? b.rating - a.rating : by(a, b));
  });
}

// ---------- Rendering ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function stars(r) { return `<span class="stars">★ ${dec(r.toFixed(1))}</span>`; }
function costPill(p) {
  if (p.cost === 0) return `<span class="pill free">${t("free")}</span>`;
  return `<span class="pill paid">${"€".repeat(p.cost)}</span>`;
}

function card(p, opts = {}) {
  const cat = CATEGORIES[p.cat];
  const st = state.status[p.id];
  const inToday = state.today.includes(p.id);
  const tr = isNaN(p.d) ? null : travel(p.d);
  const beyond = !isNaN(p.d) && p.d > state.range;
  const mode = tr && tr.kind !== "ride" ? "walking" : "driving";
  return `
  <article class="card ${opts.collapsed ? "collapsed" : ""} ${st || ""}" data-id="${p.id}" data-open>
    <div class="card-head">
      <div class="card-icon">${cat.icon}</div>
      <div class="card-title">
        <h3>${esc(loc(p, "name"))} <span class="more">›</span></h3>
        <div class="meta">
          ${stars(p.rating)} · ${catLabel(p.cat)} ${costPill(p)}
          <span class="pill era">${eraLabel(p.era)}</span>
          ${beyond && p.rating >= MUST_SEE ? `<span class="pill must">${t("mustSeePill")}</span>` : ""}
        </div>
      </div>
      ${isNaN(p.d) ? "" : `<div class="dist"><b>${fmtKm(p.d)}</b>${t("fromStay")}</div>`}
    </div>
    ${tr ? `<div class="travel"><span class="pill ${tr.cls}">${tr.label}</span><span class="muted">${t("allow", fmtMin(p.mins))}</span></div>` : ""}
    <p class="desc">${esc(loc(p, "desc"))}</p>
    <p class="extra"><b>${t("cost")}:</b> ${esc(loc(p, "price"))}${p.tip ? `<br><b>${t("tip")}:</b> ${esc(loc(p, "tip"))}` : ""}${p.how ? `<br><b>${t("how")}:</b> ${esc(loc(p, "how"))}` : ""}</p>
    <div class="actions">
      <button data-act="today" class="${inToday ? "on-today" : ""}">${t(inToday ? "onToday" : "todayBtn")}</button>
      <button data-act="done" class="${st === "done" ? "on-done" : ""}">${t("done")}</button>
      <button data-act="ignored" class="${st === "ignored" ? "on-ignored" : ""}">${t(st === "ignored" ? "ignored" : "ignore")}</button>
      <a href="${mapsLink(p, mode, opts.from)}" target="_blank" rel="noopener">${t("go")}</a>
    </div>
  </article>`;
}

function renderExplore() {
  document.querySelectorAll("#rangeSeg button").forEach(b => b.classList.toggle("on", +b.dataset.range === state.range));
  $("#mustSee").checked = state.mustSee;
  $("#sortSel").value = state.sort;
  $("#costSel").value = state.cost;
  $("#catChips").innerHTML =
    `<button class="chip ${state.cats.length ? "" : "on"}" data-cat="">${t("all")}</button>` +
    Object.entries(CATEGORIES).map(([k, c]) =>
      `<button class="chip ${state.cats.includes(k) ? "on" : ""}" data-cat="${k}">${c.icon} ${catLabel(k)}</button>`).join("");

  const items = exploreItems();
  const inRange = items.filter(p => !(p.d > state.range)).length;
  const hidden = Object.keys(state.status).length;
  $("#exploreCount").innerHTML = (state.base
    ? t("withinRange", inRange) + (items.length > inRange ? t("mustFurther", items.length - inRange) : "") + (hidden ? t("hiddenCount", hidden) : "")
    : t("setStayHint")) + `<br><span class="small">${t("tapHint")}</span>`;
  $("#exploreList").innerHTML = items.length
    ? items.map(p => card(p, { collapsed: true })).join("")
    : `<div class="empty">${t("emptyExplore")}</div>`;
}

function renderMine() {
  const which = document.querySelector("#mineSeg .on").dataset.status;
  const items = POIS.filter(p => state.status[p.id] === which).map(withDistance).sort((a, b) => a.d - b.d);
  const done = POIS.filter(p => state.status[p.id] === "done").length;
  $("#mineCount").textContent = t("visited", done, POIS.length);
  $("#mineList").innerHTML = items.length
    ? items.map(p => card(p, { collapsed: true })).join("")
    : `<div class="empty">${t(which === "done" ? "noneDone" : "noneIgnored")}</div>`;
}

// Order today's stops as a nearest-neighbour loop from the base.
function orderedToday() {
  let pts = state.today.map(id => POIS.find(p => p.id === id)).filter(Boolean);
  if (!state.base) return pts.map(p => ({ ...p, d: NaN, leg: NaN }));
  // Start with nearest-neighbour from the base…
  const route = [];
  let cur = state.base;
  while (pts.length) {
    let bi = 0;
    pts.forEach((p, i) => { if (km(cur, p) < km(cur, pts[bi])) bi = i; });
    cur = pts.splice(bi, 1)[0];
    route.push(cur);
  }
  // …then untangle crossings with 2-opt. For a round trip the walk home counts too.
  const length = r => r.reduce((sum, p, i) => sum + km(i ? r[i - 1] : state.base, p), 0)
    + (state.loop && r.length ? km(r[r.length - 1], state.base) : 0);
  let best = length(route), improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const cand = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
        const len = length(cand);
        if (len < best - 1e-9) { route.splice(0, route.length, ...cand); best = len; improved = true; }
      }
    }
  }
  return route.map((p, i) => {
    const prev = i ? route[i - 1] : state.base;
    return { ...p, d: km(state.base, p), leg: km(prev, p), prev };
  });
}

function renderToday() {
  const stops = orderedToday();
  $("#loopChk").checked = state.loop;
  $("#todaySub").textContent = t(state.loop ? "todaySubLoop" : "todaySub");
  const badge = $("#todayBadge");
  badge.hidden = !state.today.length;
  badge.textContent = state.today.length;

  if (!stops.length) {
    $("#todaySummary").innerHTML = "";
    $("#todayList").innerHTML = `<div class="empty">${t("todayEmpty")}</div>`;
    return;
  }
  let html = "", walkKm = 0, rideKm = 0, visit = 0;
  stops.forEach((p, i) => {
    visit += p.mins;
    if (!isNaN(p.leg)) {
      const tr = travel(p.leg);
      if (tr.kind === "ride") rideKm += p.leg; else walkKm += p.leg;
      html += `<div class="leg">${t(i === 0 ? "legFirst" : "legThen")}: ${fmtKm(p.leg)} · ${tr.label}</div>`;
    }
    html += card(p, { collapsed: false, from: p.prev });
  });
  let travelMin = walkMin(walkKm) + (rideKm ? driveMin(rideKm) : 0);
  const last = stops[stops.length - 1];
  if (state.base && state.loop) {
    const back = km(last, state.base);
    html += `<div class="leg">${t("legBack")}: ${fmtKm(back)} · ${travel(back).label}</div>`;
    if (travel(back).kind === "ride") { rideKm += back; travelMin += driveMin(back); }
    else { walkKm += back; travelMin += walkMin(back); }
  }

  const allWalk = rideKm === 0;
  const mode = allWalk ? "walking" : "driving";
  // Google Maps allows up to 9 waypoints in a URL.
  const roundTrip = state.loop && state.base;
  const way = (roundTrip ? stops : stops.slice(0, -1)).slice(0, 9).map(p => `${p.lat},${p.lng}`).join("|");
  const end = roundTrip ? state.base : last;
  const params = new URLSearchParams({ api: "1", destination: `${end.lat},${end.lng}`, travelmode: mode });
  if (state.base) params.set("origin", `${state.base.lat},${state.base.lng}`);
  if (way) params.set("waypoints", way);

  $("#todaySummary").innerHTML = `
    <div class="summary">
      <div><b>${t("stops", stops.length)}</b> · ${t("aboutTotal", fmtMin(visit + travelMin))}${roundTrip ? ` · ${t("loopDone")}` : ""}</div>
      <div class="muted small">
        🚶 ${fmtKm(walkKm * ROUTE_FACTOR)} ${t("onFoot")}${rideKm ? ` · 🚌 ${fmtKm(rideKm * ROUTE_FACTOR)} ${t("byTransport")}` : ""}
        · ${fmtMin(visit)} ${t("sightseeing")}
        · ${t("entryCosts")}: ${stops.every(p => p.cost === 0) ? t("allFree") : stops.filter(p => p.cost > 0).map(p => esc(loc(p, "price").split(" (")[0])).join(", ")}
      </div>
      <a class="btn primary" href="https://www.google.com/maps/dir/?${params}" target="_blank" rel="noopener">${t("openRoute", allWalk)}</a>
      <button class="btn ghost" id="clearToday" type="button">${t("clearToday")}</button>
    </div>`;
  $("#todayList").innerHTML = html;
}

function suggest(kind) {
  if (!state.base) { openBase(); return; }
  const pool = POIS.map(withDistance).filter(p => !state.status[p.id]);
  let pick;
  if (kind === "walk") {
    // Best-rated places within walking distance, up to ~6 hours of sightseeing.
    const cand = pool.filter(p => p.d <= MAX_WALK_KM && p.cat !== "beach").sort((a, b) => b.rating - a.rating || a.d - b.d);
    pick = []; let mins = 0;
    for (const p of cand) { if (mins + p.mins > 360) continue; pick.push(p); mins += p.mins; if (pick.length >= 7) break; }
  } else {
    // Highest-rated far-away place plus its best-rated neighbours (≤12 km from it).
    const far = pool.filter(p => p.d > MAX_WALK_KM).sort((a, b) => b.rating - a.rating || a.d - b.d);
    if (!far.length) { pick = []; }
    else {
      const anchor = far[0];
      pick = [anchor, ...far.slice(1).filter(p => km(anchor, p) <= 12).slice(0, 3)];
    }
  }
  if (!pick.length) { alert(t("noMore")); return; }
  if (state.today.length && !confirm(t("replaceConfirm"))) return;
  state.today = pick.map(p => p.id);
  save(); renderAll();
}

// ---------- Place sheet + Wikipedia ----------
let openId = null;
const wikiCache = {};

function openPlace(id) {
  openId = id;
  renderPlace(id);
  const dlg = $("#placeDialog");
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  loadWiki(id);
}

function renderPlace(id) {
  const p = withDistance(POIS.find(x => x.id === id));
  const w = wikiCache[`${state.lang}:${id}`];
  // Reuse the card for meta, cost, tips and buttons; show it expanded and not clickable.
  const cardHtml = card(p).replace(" data-open>", ">").replace(' <span class="more">›</span>', "");
  $("#placeBody").innerHTML = `
    <div class="sheet-top">
      <h2>${CATEGORIES[p.cat].icon} ${esc(loc(p, "name"))}</h2>
      <button type="button" id="closePlace" aria-label="${t("close")}">✕</button>
    </div>
    <div class="sheet-wrap">
      ${w && w.img ? `<img class="photo" src="${esc(w.img)}" alt="">` : ""}
      ${cardHtml}
      <section class="wiki">${wikiHtml(p, w)}</section>
    </div>`;
}

function wikiHtml(p, w) {
  const web = `https://www.google.com/search?q=${encodeURIComponent(`"${p.name}" Rhodes`)}&hl=${state.lang}`;
  const webLink = `<a class="btn" href="${web}" target="_blank" rel="noopener">🔎 ${t("webSearch")}</a>`;
  if (!w) return `<p class="muted">📖 ${t("wikiLoading")}</p>`;
  if (w.error) return `<p class="muted">${t("wikiOffline")}</p>${webLink}`;
  if (!w.title) return `<p class="muted">📖 ${t("wikiNone")}</p>${webLink}`;
  return `
    <h3>📖 ${esc(w.title)}</h3>
    ${w.fallback ? `<p class="muted small">${t("wikiEnOnly")}</p>` : ""}
    <p>${esc(w.extract)}</p>
    <a class="btn primary" href="${esc(w.url)}" target="_blank" rel="noopener">${t("wikiMore")}</a>
    ${webLink}`;
}

// ----- Finding the right article -----
// Only accept an article that is geotagged near the place (or clearly about Rhodes)
// AND whose title shares a distinctive word with the place. Otherwise show nothing.
const GENERIC = new Set(("the of and in on at de la tou tis ton our lady saint agios agia panagia holy rhodes rhodos rodos island greece greek " +
  "church chapel mosque street square museum castle fort fortress beach bay park village town city old new " +
  "ancient medieval monastery temple palace tomb gate harbour harbor hill mount mountain viewpoint " +
  "springs spring valley lake walk walls collection art modern italian ottoman").split(" "));
const words = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .split(/[^a-z0-9]+/).filter(w => w.length > 2 && !GENERIC.has(w));
const NEAR_KM = 3, ABOUT_RHODES = /rhod|lindos|dodecanese/i;

// Words an article title must contain to count as "about this place".
function placeWords(p) {
  const ref = WIKI[p.id] || "";
  return ref.startsWith("?") ? ref.slice(1).split(/\s+/).map(w => norm(w)) : words(p.name);
}
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const titleScore = (title, ws) => ws.filter(w => w.length > 2 && norm(title).includes(w)).length;

async function api(lang, params) {
  const q = new URLSearchParams({ action: "query", format: "json", origin: "*", redirects: "1", ...params });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${q}`);
  if (!res.ok) throw new Error(res.status);
  return (await res.json()).query || {};
}

const PAGE_PROPS = {
  prop: "extracts|pageimages|langlinks|info|coordinates", exintro: "1", explaintext: "1", exsentences: "8",
  piprop: "thumbnail", pithumbsize: "800", lllang: "et", inprop: "url", colimit: "1",
};
function toPage(pg) {
  return {
    title: pg.title, extract: pg.extract || "", url: pg.fullurl, img: pg.thumbnail?.source,
    et: pg.langlinks?.[0]?.["*"], coord: pg.coordinates?.[0] && { lat: pg.coordinates[0].lat, lng: pg.coordinates[0].lon },
  };
}
async function pageByTitle(lang, title) {
  const pg = Object.values((await api(lang, { titles: title, ...PAGE_PROPS })).pages || {}).find(x => !("missing" in x));
  return pg ? toPage(pg) : null;
}
// Is this article plausibly about this place's location?
const nearby = (pg, p) => pg.coord ? km(pg.coord, p) <= NEAR_KM : ABOUT_RHODES.test(pg.title + " " + pg.extract);

async function findEnglish(p) {
  const ref = WIKI[p.id] || "";
  const ws = placeWords(p);

  // 1. A title chosen by hand — still double-checked.
  if (ref && !ref.startsWith("?")) {
    const pg = await pageByTitle("en", ref);
    if (pg && (pg.coord ? km(pg.coord, p) <= 15 : ABOUT_RHODES.test(pg.title + " " + pg.extract))) return pg;
  }

  // 2. Geotagged articles around the place whose title matches its name.
  const geo = (await api("en", { list: "geosearch", gscoord: `${p.lat}|${p.lng}`, gsradius: "3000", gslimit: "50" })).geosearch || [];
  const hit = geo.map(g => ({ ...g, score: titleScore(g.title, ws) }))
    .filter(g => g.score > 0)
    .sort((a, b) => b.score - a.score || a.dist - b.dist)[0];
  if (hit) return pageByTitle("en", hit.title);

  // 3. Text search, but only results located near the place with a matching title.
  const q = `${p.name} Rhodes`;
  const found = Object.values((await api("en", { generator: "search", gsrsearch: q, gsrlimit: "5", ...PAGE_PROPS })).pages || {})
    .sort((a, b) => a.index - b.index).map(toPage)
    .find(pg => titleScore(pg.title, ws) > 0 && nearby(pg, p));
  return found || null;
}

async function loadWiki(id) {
  const key = `${state.lang}:${id}`;
  if (wikiCache[key] && !wikiCache[key].error) return;
  const p = POIS.find(x => x.id === id);
  try {
    const en = await findEnglish(p);
    let w = en || {};
    if (state.lang === "et" && en) {
      const et = en.et ? await pageByTitle("et", en.et) : null;
      // Estonian articles are often short and photo-less; borrow the English photo.
      w = et ? { ...et, img: et.img || en.img } : { ...en, fallback: true };
    }
    wikiCache[key] = w;
  } catch {
    wikiCache[key] = { error: true };
  }
  if (openId === id && $("#placeDialog").open) renderPlace(id);
}

$("#placeDialog").addEventListener("click", e => {
  if (e.target.id === "closePlace" || e.target === e.currentTarget) e.currentTarget.close();
});
$("#placeDialog").addEventListener("close", () => { openId = null; });

// ---------- Map ----------
let map, layer;
function renderMap() {
  if (!window.L) { $("#map").innerHTML = `<div class="empty">${t("mapOffline")}</div>`; return; }
  if (!map) {
    map = L.map("map", { zoomControl: true }).setView(state.base ? [state.base.lat, state.base.lng] : [36.44, 28.22], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap",
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }
  layer.clearLayers();
  const color = p => state.status[p.id] === "done" ? "#1b8a4b" : state.status[p.id] === "ignored" ? "#9aa0a6"
    : state.today.includes(p.id) ? "#d93025" : "#0b5ea8";
  POIS.forEach(p => {
    if (state.cats.length && !state.cats.includes(p.cat)) return;
    const size = state.today.includes(p.id) ? 30 : 24;
    const icon = L.divIcon({
      className: "", iconSize: [size, size],
      html: `<div class="mk" style="width:${size}px;height:${size}px;background:${color(p)}">${CATEGORIES[p.cat].icon}</div>`,
    });
    const d = state.base ? km(state.base, p) : NaN;
    L.marker([p.lat, p.lng], { icon }).addTo(layer).bindPopup(
      `<b>${esc(loc(p, "name"))}</b>★ ${dec(p.rating.toFixed(1))} · ${p.cost ? "€".repeat(p.cost) : t("free")}${isNaN(d) ? "" : ` · ${fmtKm(d)}<br>${travel(d).label}`}<br><button type="button" class="btn" data-pop="${p.id}" style="margin-top:6px;padding:6px 10px">📖 ${t("details")}</button>`
    );
  });
  if (state.base) {
    L.marker([state.base.lat, state.base.lng], {
      icon: L.divIcon({ className: "", iconSize: [30, 30], html: `<div class="mk" style="width:30px;height:30px;background:#111">🏨</div>` }),
      zIndexOffset: 1000,
    }).addTo(layer).bindPopup(`<b>${esc(baseLabel(state.base.name))}</b>${t("yourStay")}`);
    L.circle([state.base.lat, state.base.lng], { radius: EASY_WALK_KM * 1000, color: "#1b8a4b", weight: 1, fillOpacity: .05 }).addTo(layer);
  }
  setTimeout(() => map.invalidateSize(), 50);
}

// ---------- Base location ----------
function setBase(lat, lng, name) {
  const label = $("#baseLabel").value.trim();
  state.base = { lat, lng, name: label || name };
  save();
  $("#baseDialog").close();
  if (map) map.setView([lat, lng], 13);
  renderAll();
}
function openBase() {
  $("#gpsMsg").textContent = "";
  $("#coordMsg").textContent = "";
  $("#baseLabel").value = state.base ? baseLabel(state.base.name) : "";
  $("#baseDialog").showModal();
}
function parseCoords(s) {
  // Accepts "36.44, 28.22", ".../@36.44,28.22,15z", "?q=36.44,28.22", "!3d36.44!4d28.22"
  let m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

// ---------- Events ----------
function renderAll() {
  applyStaticText();
  $("#baseName").textContent = state.base ? baseLabel(state.base.name) : t("setStay");
  renderExplore();
  renderToday();
  renderMine();
  if (map && $("#view-map").classList.contains("active")) renderMap();
}

function act(id, what) {
  if (what === "today") {
    const i = state.today.indexOf(id);
    i >= 0 ? state.today.splice(i, 1) : state.today.push(id);
  } else {
    state.status[id] === what ? delete state.status[id] : (state.status[id] = what);
    if (what === "ignored" && state.status[id]) state.today = state.today.filter(x => x !== id);
  }
  save(); renderAll();
  if ($("#placeDialog").open) renderPlace(openId);
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (btn) { act(btn.closest("[data-id]").dataset.id, btn.dataset.act); return; }
  const pop = e.target.closest("[data-pop]");
  if (pop) { openPlace(pop.dataset.pop); return; }
  if (e.target.closest("a")) return;
  const c = e.target.closest(".card[data-open]");
  if (c) openPlace(c.dataset.id);
});

$("#tabbar").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  document.querySelectorAll("#tabbar button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${b.dataset.view}`));
  if (b.dataset.view === "map") renderMap();
  window.scrollTo(0, 0);
});

$("#rangeSeg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.range = +b.dataset.range; save(); renderExplore();
});
$("#mustSee").addEventListener("change", e => { state.mustSee = e.target.checked; save(); renderExplore(); });
$("#sortSel").addEventListener("change", e => { state.sort = e.target.value; save(); renderExplore(); });
$("#costSel").addEventListener("change", e => { state.cost = e.target.value; save(); renderExplore(); });
$("#catChips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  const c = b.dataset.cat;
  if (!c) state.cats = [];
  else state.cats = state.cats.includes(c) ? state.cats.filter(x => x !== c) : [...state.cats, c];
  save(); renderExplore();
  if (map) renderMap();
});
$("#mineSeg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  document.querySelectorAll("#mineSeg button").forEach(x => x.classList.toggle("on", x === b));
  renderMine();
});
$("#resetBtn").addEventListener("click", () => {
  if (confirm(t("resetConfirm"))) { state.status = {}; save(); renderAll(); }
});
$("#todaySummary").addEventListener("click", e => {
  if (e.target.id === "clearToday") { state.today = []; save(); renderAll(); }
});
$("#suggestWalk").addEventListener("click", () => suggest("walk"));
$("#loopChk").addEventListener("change", e => { state.loop = e.target.checked; save(); renderToday(); });
$("#suggestFar").addEventListener("click", () => suggest("far"));

$("#baseBtn").addEventListener("click", openBase);
function setLang(lang) {
  const first = !state.lang;
  state.lang = lang; save(); renderAll();
  if (map) renderMap();
  if (openId) { renderPlace(openId); loadWiki(openId); }
  const dlg = $("#langDialog");
  if (dlg.open) dlg.close();
  if (first && !state.base) openBase();
}
document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
// The language screen must be answered, not dismissed.
$("#langDialog").addEventListener("cancel", e => e.preventDefault());
$("#presets").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const p = PRESETS[+b.dataset.i];
  setBase(p.lat, p.lng, T().presets[p.name] || p.name);
});
$("#gpsBtn").addEventListener("click", () => {
  const msg = $("#gpsMsg");
  if (!navigator.geolocation) { msg.textContent = t("noGeo"); return; }
  msg.textContent = t("finding");
  navigator.geolocation.getCurrentPosition(
    pos => setBase(pos.coords.latitude, pos.coords.longitude, t("myStay")),
    err => {
      msg.textContent = t(err.code === 1 ? "geoDenied" : "geoFail");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
});
$("#coordBtn").addEventListener("click", () => {
  const c = parseCoords($("#coordInput").value);
  if (!c) { $("#coordMsg").textContent = t("coordErr"); return; }
  setBase(c.lat, c.lng, t("myStay"));
});

// ---------- Boot ----------
renderAll();
if (!state.lang) {
  // Put the phone's own language on top.
  const pick = $(".lang-pick");
  if (!phoneIsEstonian) pick.appendChild(pick.querySelector('[data-lang="et"]'));
  $("#langDialog").showModal();
} else if (!state.base) openBase();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
