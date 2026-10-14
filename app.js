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
  const def = { base: null, status: {}, today: [], range: 2, mustSee: true, cats: [], sort: "dist", cost: "any" };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? Object.assign(def, JSON.parse(raw)) : def;
  } catch { return def; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

// ---------- Geo helpers ----------
function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtKm(d) { return d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`; }
function fmtMin(m) {
  m = Math.max(1, Math.round(m));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r}` : `${h} h`;
}
function walkMin(d) { return d * ROUTE_FACTOR / WALK_KMH * 60; }
function driveMin(d) { return d * ROUTE_FACTOR / DRIVE_KMH * 60 + 5; }

function travel(d) {
  if (d <= EASY_WALK_KM) return { kind: "walk", label: `🚶 ${fmtMin(walkMin(d))} walk`, cls: "walk" };
  if (d <= MAX_WALK_KM) return { kind: "longwalk", label: `🚶 ${fmtMin(walkMin(d))} walk · or 🚕 ${fmtMin(driveMin(d))}`, cls: "longwalk" };
  return { kind: "ride", label: `🚌 Transport needed · ~${fmtMin(driveMin(d))} by car`, cls: "ride" };
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

function stars(r) { return `<span class="stars">★ ${r.toFixed(1)}</span>`; }
function costPill(p) {
  if (p.cost === 0) return `<span class="pill free">Free</span>`;
  return `<span class="pill paid">${"€".repeat(p.cost)}</span>`;
}

function card(p, opts = {}) {
  const cat = CATEGORIES[p.cat];
  const st = state.status[p.id];
  const inToday = state.today.includes(p.id);
  const t = isNaN(p.d) ? null : travel(p.d);
  const beyond = !isNaN(p.d) && p.d > state.range;
  const mode = t && t.kind !== "ride" ? "walking" : "driving";
  return `
  <article class="card ${opts.collapsed ? "collapsed" : ""} ${st || ""}" data-id="${p.id}">
    <div class="card-head" data-toggle>
      <div class="card-icon">${cat.icon}</div>
      <div class="card-title">
        <h3>${esc(p.name)}</h3>
        <div class="meta">
          ${stars(p.rating)} · ${cat.label} ${costPill(p)}
          <span class="pill era">${ERAS[p.era]}</span>
          ${beyond && p.rating >= MUST_SEE ? `<span class="pill must">Must-see</span>` : ""}
        </div>
      </div>
      ${isNaN(p.d) ? "" : `<div class="dist"><b>${fmtKm(p.d)}</b>from stay</div>`}
    </div>
    ${t ? `<div class="travel"><span class="pill ${t.cls}">${t.label}</span><span class="muted">· allow ${fmtMin(p.mins)} there</span></div>` : ""}
    <p class="desc">${esc(p.desc)}</p>
    <p class="extra"><b>Cost:</b> ${esc(p.price)}${p.tip ? `<br><b>Tip:</b> ${esc(p.tip)}` : ""}${p.how ? `<br><b>Getting there:</b> ${esc(p.how)}` : ""}</p>
    <div class="actions">
      <button data-act="today" class="${inToday ? "on-today" : ""}">${inToday ? "★ Today" : "☆ Today"}</button>
      <button data-act="done" class="${st === "done" ? "on-done" : ""}">✓ Done</button>
      <button data-act="ignored" class="${st === "ignored" ? "on-ignored" : ""}">${st === "ignored" ? "✕ Ignored" : "✕ Ignore"}</button>
      <a href="${mapsLink(p, mode, opts.from)}" target="_blank" rel="noopener">🧭 Go</a>
    </div>
  </article>`;
}

function renderExplore() {
  document.querySelectorAll("#rangeSeg button").forEach(b => b.classList.toggle("on", +b.dataset.range === state.range));
  $("#mustSee").checked = state.mustSee;
  $("#sortSel").value = state.sort;
  $("#costSel").value = state.cost;
  $("#catChips").innerHTML =
    `<button class="chip ${state.cats.length ? "" : "on"}" data-cat="">All</button>` +
    Object.entries(CATEGORIES).map(([k, c]) =>
      `<button class="chip ${state.cats.includes(k) ? "on" : ""}" data-cat="${k}">${c.icon} ${c.label}</button>`).join("");

  const items = exploreItems();
  const inRange = items.filter(p => !(p.d > state.range)).length;
  const hidden = Object.keys(state.status).length;
  $("#exploreCount").textContent = state.base
    ? `${inRange} within range${items.length > inRange ? ` + ${items.length - inRange} must-see further away` : ""}${hidden ? ` · ${hidden} done/ignored hidden` : ""}`
    : "Set where you're staying to see distances.";
  $("#exploreList").innerHTML = items.length
    ? items.map(p => card(p, { collapsed: true })).join("")
    : `<div class="empty">Nothing matches. Try a wider range or another category.</div>`;
}

function renderMine() {
  const which = document.querySelector("#mineSeg .on").dataset.status;
  const items = POIS.filter(p => state.status[p.id] === which).map(withDistance).sort((a, b) => a.d - b.d);
  const done = POIS.filter(p => state.status[p.id] === "done").length;
  $("#mineCount").textContent = `Visited ${done} of ${POIS.length} places`;
  $("#mineList").innerHTML = items.length
    ? items.map(p => card(p, { collapsed: true })).join("")
    : `<div class="empty">${which === "done" ? "Nothing marked done yet." : "Nothing ignored."}</div>`;
}

// Order today's stops as a nearest-neighbour loop from the base.
function orderedToday() {
  let pts = state.today.map(id => POIS.find(p => p.id === id)).filter(Boolean);
  if (!state.base) return pts.map(p => ({ ...p, d: NaN, leg: NaN }));
  const out = [];
  let cur = state.base;
  while (pts.length) {
    let bi = 0;
    pts.forEach((p, i) => { if (km(cur, p) < km(cur, pts[bi])) bi = i; });
    const p = pts.splice(bi, 1)[0];
    out.push({ ...p, d: km(state.base, p), leg: km(cur, p), prev: cur });
    cur = p;
  }
  return out;
}

function renderToday() {
  const stops = orderedToday();
  const badge = $("#todayBadge");
  badge.hidden = !state.today.length;
  badge.textContent = state.today.length;

  if (!stops.length) {
    $("#todaySummary").innerHTML = "";
    $("#todayList").innerHTML = `<div class="empty">Tap <b>☆ Today</b> on any place, or let the app suggest a day.</div>`;
    return;
  }
  let html = "", walkKm = 0, rideKm = 0, visit = 0;
  stops.forEach((p, i) => {
    visit += p.mins;
    if (!isNaN(p.leg)) {
      const t = travel(p.leg);
      if (t.kind === "ride") rideKm += p.leg; else walkKm += p.leg;
      html += `<div class="leg">${i === 0 ? "From your stay" : "Then"}: ${fmtKm(p.leg)} · ${t.label}</div>`;
    }
    html += card(p, { collapsed: false, from: p.prev });
  });
  let travelMin = walkMin(walkKm) + (rideKm ? driveMin(rideKm) : 0);
  const last = stops[stops.length - 1];
  if (state.base) {
    const back = km(last, state.base);
    html += `<div class="leg">Back to your stay: ${fmtKm(back)} · ${travel(back).label}</div>`;
    if (travel(back).kind === "ride") { rideKm += back; travelMin += driveMin(back); }
    else { walkKm += back; travelMin += walkMin(back); }
  }

  const allWalk = rideKm === 0;
  const mode = allWalk ? "walking" : "driving";
  // Google Maps allows up to 9 waypoints in a URL.
  const way = stops.slice(0, -1).slice(0, 9).map(p => `${p.lat},${p.lng}`).join("|");
  const params = new URLSearchParams({ api: "1", destination: `${last.lat},${last.lng}`, travelmode: mode });
  if (state.base) params.set("origin", `${state.base.lat},${state.base.lng}`);
  if (way) params.set("waypoints", way);

  $("#todaySummary").innerHTML = `
    <div class="summary">
      <div><b>${stops.length} stops</b> · about ${fmtMin(visit + travelMin)} including travel</div>
      <div class="muted small">
        🚶 ${fmtKm(walkKm * ROUTE_FACTOR)} on foot${rideKm ? ` · 🚌 ${fmtKm(rideKm * ROUTE_FACTOR)} by transport` : ""}
        · ${fmtMin(visit)} sightseeing
        · entry costs: ${stops.every(p => p.cost === 0) ? "all free 🎉" : stops.filter(p => p.cost > 0).map(p => esc(p.price.split(" (")[0])).join(", ")}
      </div>
      <a class="btn primary" href="https://www.google.com/maps/dir/?${params}" target="_blank" rel="noopener">Open route in Google Maps (${allWalk ? "walking" : "driving"})</a>
      <button class="btn ghost" id="clearToday" type="button">Clear today</button>
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
  if (!pick.length) { alert("Nothing left to suggest — you've seen it all!"); return; }
  if (state.today.length && !confirm("Replace today's plan with a suggestion?")) return;
  state.today = pick.map(p => p.id);
  save(); renderAll();
}

// ---------- Map ----------
let map, layer;
function renderMap() {
  if (!window.L) { $("#map").innerHTML = `<div class="empty">Map needs an internet connection.</div>`; return; }
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
      `<b>${esc(p.name)}</b>★ ${p.rating.toFixed(1)} · ${p.cost ? "€".repeat(p.cost) : "Free"}${isNaN(d) ? "" : ` · ${fmtKm(d)}<br>${travel(d).label}`}`
    );
  });
  if (state.base) {
    L.marker([state.base.lat, state.base.lng], {
      icon: L.divIcon({ className: "", iconSize: [30, 30], html: `<div class="mk" style="width:30px;height:30px;background:#111">🏨</div>` }),
      zIndexOffset: 1000,
    }).addTo(layer).bindPopup(`<b>${esc(state.base.name)}</b>Your stay`);
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
  $("#baseLabel").value = state.base?.name || "";
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
  $("#baseName").textContent = state.base ? state.base.name : "Set your stay";
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
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (btn) { act(btn.closest(".card").dataset.id, btn.dataset.act); return; }
  const head = e.target.closest("[data-toggle]");
  if (head) head.closest(".card").classList.toggle("collapsed");
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
  if (confirm("Clear all Done and Ignored marks?")) { state.status = {}; save(); renderAll(); }
});
$("#todaySummary").addEventListener("click", e => {
  if (e.target.id === "clearToday") { state.today = []; save(); renderAll(); }
});
$("#suggestWalk").addEventListener("click", () => suggest("walk"));
$("#suggestFar").addEventListener("click", () => suggest("far"));

$("#baseBtn").addEventListener("click", openBase);
$("#presets").innerHTML = PRESETS.map((p, i) => `<button type="button" data-i="${i}">${p.name}</button>`).join("");
$("#presets").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const p = PRESETS[+b.dataset.i];
  setBase(p.lat, p.lng, p.name);
});
$("#gpsBtn").addEventListener("click", () => {
  const msg = $("#gpsMsg");
  if (!navigator.geolocation) { msg.textContent = "Location isn't available in this browser."; return; }
  msg.textContent = "Finding you…";
  navigator.geolocation.getCurrentPosition(
    pos => setBase(pos.coords.latitude, pos.coords.longitude, "My stay"),
    err => {
      msg.textContent = err.code === 1
        ? "Location permission denied. On iPhone: Settings → Privacy → Location Services → Safari Websites → While Using. Or pick an area below."
        : "Couldn't get your location. Try again outdoors, or pick an area below.";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
});
$("#coordBtn").addEventListener("click", () => {
  const c = parseCoords($("#coordInput").value);
  if (!c) { $("#coordMsg").textContent = "Couldn't read coordinates — try the format 36.4445, 28.2265"; return; }
  setBase(c.lat, c.lng, "My stay");
});

// ---------- Boot ----------
renderAll();
if (!state.base) openBase();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
