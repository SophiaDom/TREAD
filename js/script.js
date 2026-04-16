// ===============================
// TREAD — script.js (FULL FILE)
// - Swipe panels (map | entrance | journal)
// - Quiz → route calculation via OSRM
// - Numbered prompt waypoints, 50m trigger, 50m auto-dismiss
// - Prompt cards: action / write / photo / record / draw (pen + eraser)
// - Responses saved to localStorage + rendered into journal panel
// ===============================


// ── JOURNAL STORAGE ───────────────────────────────────────────────────────────

const STORAGE_KEY = "tread_journal";

// Temporary storage for current walk - cleared when walk ends
let currentWalkEntries = [];

function loadJournalEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveJournalEntry(entry) {
  const all = loadJournalEntries();
  all.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  renderJournal();
}

// Save to temporary walk storage instead of journal
function saveToCurrentWalk(entry) {
  currentWalkEntries.push(entry);
}

// Clear temporary walk data
function clearCurrentWalk() {
  currentWalkEntries = [];
}

function renderJournal() {
  const container = document.getElementById("entries");
  if (!container) return;
  const all = loadJournalEntries();

  if (!all.length) {
    container.innerHTML = `<p style="
      text-align:center;color:#aaa;margin-top:30vh;
      font-family:sans-serif;font-size:14px;padding:0 24px;line-height:1.6;
    ">Your walk collages will appear here.</p>`;
    return;
  }

  const typeIcons = { photo:"", draw:"", write:"", record:"", action:"" };

  container.innerHTML = `<div class="entries-wrapper">${all.reverse().map((e, i) => {
    const date = new Date(e.date).toLocaleDateString("en-US",
      { month:"short", day:"numeric", year:"numeric" });
    const time = new Date(e.date).toLocaleTimeString("en-US",
      { hour:"2-digit", minute:"2-digit" });
    const loc = e.location
      ? `${e.location.lat.toFixed(4)}, ${e.location.lng.toFixed(4)}`
      : "location unknown";

    let responseHTML = "";
    if ((e.type === "photo" || e.type === "draw") && e.response) {
      responseHTML = `<img src="${e.response}" style="width:100%;border-radius:10px;margin-top:10px;"/>`;
    } else if (e.type === "record" && e.response) {
      responseHTML = `<audio controls src="${e.response}" style="width:100%;margin-top:10px;"></audio>`;
    } else if (e.response) {
      responseHTML = `<p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#333;">${e.response}</p>`;
    }

    return `
      <div class="entry" data-index="${i}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:13px;letter-spacing:0.2em;color:#000;font-family:var(--font-display,serif);">
              ${date} · ${time}
            </div>
            <div style="font-size:10px;color:#bbb;font-family:sans-serif;margin-top:2px;">
              ${loc}
            </div>
          </div>
          <button onclick="exportEntry(${i})" style="
            border:1.5px solid black;
            background:rgba(255,255,255,0.25);
            border-radius:999px;
            padding:4px 12px;
            font-size:11px;
            font-weight:300;
            letter-spacing:0.1em;
            cursor:pointer;
            color:black;
            font-family:var(--font-body,sans-serif);
            transition:background 180ms ease, transform 120ms ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.5)'" onmouseout="this.style.background='rgba(255,255,255,0.25)'">EXPORT</button>
        </div>
        ${responseHTML}
      </div>`;
  }).join("")}</div>`;

  // Add click handlers for z-index management
  let topZ = 100;
  container.querySelectorAll(".entry").forEach(el => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      
      // Remove active class from all entries
      container.querySelectorAll(".entry").forEach(e => {
        e.classList.remove("activeEntry");
      });
      
      // Add active class and bring to front
      el.classList.add("activeEntry");
      el.style.zIndex = topZ++;
    });
  });
}

// Click outside to deactivate
document.addEventListener("click", (e) => {
  if (!e.target.closest(".entry") && !e.target.closest("#entries")) {
    document.querySelectorAll(".entry").forEach(el => {
      el.classList.remove("activeEntry");
    });
  }
});

function exportEntry(index) {
  const e = loadJournalEntries()[index];
  if (!e) return;
  if ((e.type === "photo" || e.type === "draw") && e.response?.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = e.response;
    a.download = `tread_${e.type}_${e.id}.png`;
    a.click();
  } else if (e.type === "record" && e.response) {
    const a = document.createElement("a");
    a.href = e.response;
    a.download = `tread_audio_${e.id}.webm`;
    a.click();
  } else {
    const blob = new Blob([
      `TREAD ENTRY\nDate: ${new Date(e.date).toLocaleString()}\n` +
      `Location: ${e.location ? `${e.location.lat}, ${e.location.lng}` : "unknown"}\n` +
      `Prompt: ${e.promptText}\n\nResponse:\n${e.response || "(completed)"}`
    ], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tread_entry_${e.id}.txt`;
    a.click();
  }
}


// ── SWIPE PANELS ──────────────────────────────────────────────────────────────

const area = document.getElementById("swipeArea");
const startPanel = document.getElementById("start");
let x0 = null, idx = 0; // Start at 0 (entrance) instead of 1
const move = () => (area.style.transform = `translateX(${-idx * 100}vw)`);
move();

// Global nav helper so collage.js and other modules can navigate panels
// 0 = entrance, 1 = journal (map removed)
window.navigateTo = (panel) => {
  idx = Math.max(0, Math.min(1, panel));
  move();
  if (idx === 1) renderJournal();
};

area.onpointerdown = (e) => (x0 = e.clientX);
area.onpointerup = (e) => {
  if (startPanel.classList.contains("active") || x0 == null) return;
  const dx = e.clientX - x0;
  x0 = null;
  if (Math.abs(dx) < 70) return;
  idx += dx < 0 ? 1 : -1;
  idx = Math.max(0, Math.min(1, idx));
  move();
  if (idx === 1) renderJournal();
};


// ── LEAFLET MAPS ──────────────────────────────────────────────────────────────

let startMap = null;
let routeLayer = null;
let routePoints = []; // full street-snapped route coordinates

const addTiles = (m) =>
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors", maxZoom: 19,
  }).addTo(m);

const DEFAULT_VIEW = [40.7306, -73.9866];
const DEFAULT_ZOOM = 13;

function ensureStartMap() {
  if (startMap) return;
  startMap = L.map("startMap").setView(DEFAULT_VIEW, DEFAULT_ZOOM);
  addTiles(startMap);
}


// ── QUIZ ──────────────────────────────────────────────────────────────────────

const steps = [...document.querySelectorAll("#quiz .qstep")];
let s = 0;
const answers = {};
const show = (i) => steps.forEach((el, n) => el.classList.toggle("active", n === i));

const slider = document.getElementById("timeSlider");
const timeVal = document.getElementById("timeValue");
if (slider && timeVal) {
  const render = () => (timeVal.textContent = `${slider.value} minutes`);
  render();
  slider.oninput = render;
}

function openQuiz() {
  idx = 0; move(); // Navigate to entrance (was 1)
  setTimeout(() => {
    startPanel.classList.add("active");
    const quiz = document.getElementById("quiz");
    const startMapDiv = document.getElementById("startMap");
    if (quiz) quiz.hidden = false;
    if (startMapDiv) startMapDiv.hidden = true;
    s = 0; show(s);
    document.querySelectorAll("#quiz input[type='radio']").forEach(i => (i.checked = false));
    if (slider && timeVal) timeVal.textContent = `${slider.value} minutes`;
  }, 320);
}

function showMapInStartPanel() {
  document.getElementById("quiz").hidden = true;
  document.getElementById("startMap").hidden = false;
  ensureStartMap();
  setTimeout(() => startMap.invalidateSize(), 150);
}

// Custom vertical sliders
// thumbOffset controls how much of the thumb height factors into the fill calculation.
// beginSlider uses 45 (full thumb height — preserves its original working behaviour).
// calculateSlider uses 22.5 (half thumb height) so fill tracks the thumb centre, not its top.
function initVerticalSlider(sliderId, callback, thumbOffset) {
  const slider = document.getElementById(sliderId) || document.querySelector(sliderId);
  if (!slider) return;
  const thumb = slider.querySelector('.thumb');
  const track = slider.querySelector('.track');
  let isDragging = false;
  let startY = 0;
  let startBottom = 0;

  // Measure the actual rendered track height instead of hardcoding
  const trackHeight = track.getBoundingClientRect().height || 200;

  // Default to 45 so beginSlider is completely unchanged
  const offset = thumbOffset !== undefined ? thumbOffset : 45;

  const onStart = (e) => {
    isDragging = true;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startY = clientY;
    startBottom = parseFloat(thumb.style.bottom) || 0;
    slider.classList.add('dragging');
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    let newBottom = startBottom + deltaY;
    newBottom = Math.max(0, Math.min(trackHeight, newBottom));
    thumb.style.bottom = newBottom + 'px';

    const fillPercent = ((newBottom + offset) / trackHeight) * 100;
    track.style.setProperty('--fill-percent', fillPercent + '%');

    if (newBottom >= trackHeight) {
      callback();
      isDragging = false;
      slider.classList.remove('dragging');
      slider.classList.add('completed');

      setTimeout(() => {
        thumb.style.bottom = '0px';
        track.style.setProperty('--fill-percent', (offset / trackHeight * 100) + '%');
        slider.classList.remove('completed');
      }, 600);
    }
  };

  const onEnd = () => {
    if (isDragging) {
      const currentBottom = parseFloat(thumb.style.bottom) || 0;

      if (currentBottom < trackHeight) {
        thumb.style.transition = 'bottom 400ms ease-out';
        track.style.transition = 'bottom 400ms ease-out';
        thumb.style.bottom = '0px';
        track.style.setProperty('--fill-percent', (offset / trackHeight * 100) + '%');

        setTimeout(() => {
          thumb.style.transition = '';
          track.style.transition = '';
        }, 400);
      }

      slider.classList.remove('dragging');
      isDragging = false;
    }
  };

  // Mouse events
  thumb.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);

  // Touch events for mobile
  thumb.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('touchcancel', onEnd);
}

// beginSlider: no thumbOffset passed → defaults to 45, exactly as before
initVerticalSlider('beginSlider', openQuiz);
// calculateSlider: 22.5 (half of 45px thumb) so fill tracks thumb centre
initVerticalSlider('.calculateSlider', requestLocationThenShowMap, 22.5);

// Step 1: next button advances manually
document.getElementById("quiz").onclick = (e) => {
  const btn = e.target.closest(".nextBtn");
  if (!btn) return;
  answers.q1_time = +slider.value;
  s = Math.min(s + 1, steps.length - 1);
  show(s);
};

// Steps 2-4: auto-advance when a choice is selected
document.getElementById("quiz").addEventListener("change", (e) => {
  const input = e.target;
  if (input.type !== "radio") return;
  const stepEl = steps[s];
  const stepNum = stepEl.dataset.step;
  // Only handle steps 2, 3, 4
  if (!["2","3","4"].includes(stepNum)) return;
  const wrap = stepEl.querySelector(".choices");
  const key = wrap?.dataset.name;
  if (key) answers[key] = input.value;
  // Small delay so the selected style flashes before advancing
  setTimeout(() => {
    s = Math.min(s + 1, steps.length - 1);
    show(s);
  }, 320);
});


// ── ROUTE CALCULATION ─────────────────────────────────────────────────────────

function minutesToRadius(minutes) {
  return (minutes * 80) / (2 * Math.PI);
}

function generateWindingWaypoints(lat, lng, radiusMetres, numPoints) {
  const R = 6371000;
  const waypoints = [];

  const baseRotation = Math.random() * 360;

  for (let i = 0; i < numPoints; i++) {
    const segment = 360 / numPoints;

    const bearingDeg =
      baseRotation +
      i * segment +
      (Math.random() - 0.5) * segment * 0.9;

    const r = radiusMetres * (0.45 + Math.random() * 0.75);

    const bRad = (bearingDeg * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const d = r / R;

    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
      Math.cos(latRad) * Math.sin(d) * Math.cos(bRad)
    );

    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(bRad) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLat)
      );

    waypoints.push([(newLat * 180) / Math.PI, (newLng * 180) / Math.PI]);
  }

  return waypoints;
}

async function fetchOSRMRoute(coords) {
  const coordStr = coords.map(([lat,lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson&steps=false`;
  
  console.log("🗺️ Attempting route fetch...");
  console.log("URL:", url);
  console.log("Waypoints:", coords);
  
  try {
    const res = await fetch(url);
    console.log("✅ Response received, status:", res.status);
    
    if (!res.ok) {
      console.error("❌ Bad response:", res.status, res.statusText);
      throw new Error(`OSRM ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📦 Data received:", data);
    
    if (data.code !== "Ok" || !data.routes.length) {
      console.error("❌ OSRM error:", data.code, data.message);
      throw new Error(`OSRM error: ${data.code}`);
    }
    
    console.log("✅ Route calculated successfully!");
    return data.routes[0].geometry.coordinates.map(([lng,lat]) => [lat,lng]);
    
  } catch (err) {
    console.error("💥 Fetch failed:", err);
    throw err;
  }
}


// ── PROMPT WAYPOINTS ──────────────────────────────────────────────────────────

const TRIGGER_RADIUS_M = 50;
const DISMISS_RADIUS_M = 100; // waypoint centre + 50m = 50m past edge
let activeWaypoints = [];
let currentPromptIndex = 0;
let lastUserPos = null;

function distanceBetween(a, b) {
  const R = 6371000;
  const dLat = ((b[0]-a[0])*Math.PI)/180;
  const dLng = ((b[1]-a[1])*Math.PI)/180;
  const lat1 = (a[0]*Math.PI)/180, lat2 = (b[0]*Math.PI)/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

const WAYPOINT_COLORS = ["#82d1e1","#45503b","#bbbe64","#9891c6","#7a306c"];

function makeWaypointMarker(latlng, number, state, color) {
  color = color || WAYPOINT_COLORS[Math.floor(Math.random() * WAYPOINT_COLORS.length)];
  const styles = {
    pending: `width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);opacity:0.85;`,
    active:  `width:26px;height:26px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35);opacity:1;`,
    done:    `width:20px;height:20px;border-radius:50%;background:white;border:2.5px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,0.15);opacity:0.9;`,
    skipped: `width:12px;height:12px;border-radius:50%;background:#ccc;border:2px solid white;box-shadow:none;opacity:0.35;`,
  };
  const s = styles[state] || styles.pending;
  const size = state === "active" ? 26 : state === "skipped" ? 12 : 20;
  const icon = L.divIcon({
    className: "",
    html: `<div style="${s}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
  return L.marker(latlng, { icon, zIndexOffset: 500 });
}

function updateWaypointMarker(index, state) {
  const wp = activeWaypoints[index];
  if (!wp) return;
  
  // Remove existing marker
  if (wp.marker) {
    startMap.removeLayer(wp.marker);
  }
  
  // If done, just remove it completely - don't create a new marker
  if (state === "done") {
    wp.marker = null;
    return;
  }
  
  // For other states (pending, active, skipped), create the marker
  wp.marker = makeWaypointMarker(wp.latlng, index+1, state, wp.color).addTo(startMap);
  
  // Re-attach click handler to show prompt preview
  wp.marker.on('click', () => {
    showPromptCard(wp.prompt, index + 1, activeWaypoints.length);
  });
  
  wp.marker.bindPopup(`<b>${index+1}.</b> ${wp.prompt.text}`, { maxWidth:220 });
}


// ── PROMPT CARD ───────────────────────────────────────────────────────────────

function showPromptCard(prompt, waypointIndex, total) {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  document.getElementById("tread-prompt-card")?.remove();

  const typeIcons = { photo:"", draw:"", write:"", record:"", action:"" };

  const responseHTMLMap = {
    action: `<button id="prompt-complete" style="width:100%;padding:14px;border-radius:999px;background:black;color:white;border:none;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:20px;">COMPLETED</button>`,

    write: `
      <textarea id="prompt-response" placeholder="Write here…" style="width:100%;min-height:110px;margin-top:16px;padding:12px;border:1.5px solid #ddd;border-radius:12px;font-size:15px;resize:none;box-sizing:border-box;font-family:sans-serif;"></textarea>
      <button id="prompt-complete" style="width:100%;padding:14px;border-radius:999px;background:black;color:white;border:none;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:12px;">SAVE & CONTINUE</button>`,

    photo: `
      <input type="file" id="prompt-photo" accept="image/*" capture="environment" style="display:none"/>
      <button id="open-camera-btn" style="width:100%;padding:14px;border-radius:999px;background:white;color:black;border:2px solid black;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:20px;">OPEN CAMERA</button>
      <img id="photo-preview" style="display:none;width:100%;border-radius:12px;margin-top:10px;"/>
      <button id="prompt-complete" style="width:100%;padding:14px;border-radius:999px;background:black;color:white;border:none;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:10px;display:none;">SAVE & CONTINUE</button>`,

    record: `
      <div id="record-timer" style="text-align:center;font-size:28px;letter-spacing:0.1em;font-family:sans-serif;color:#000;margin-top:16px;display:none;">0:00</div>
      <button id="prompt-record-btn" style="width:100%;padding:14px;border-radius:999px;background:white;color:black;border:2px solid black;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:20px;">START RECORDING</button>
      <button id="prompt-complete" style="width:100%;padding:14px;border-radius:999px;background:black;color:white;border:none;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:10px;display:none;">SAVE & CONTINUE</button>`,

    draw: `
      <div style="display:flex;gap:8px;margin-top:16px;margin-bottom:8px;">
        <button id="draw-pen" style="flex:1;padding:8px;border-radius:999px;border:2px solid black;background:black;color:white;font-size:13px;letter-spacing:0.1em;cursor:pointer;">PEN</button>
        <button id="draw-eraser" style="flex:1;padding:8px;border-radius:999px;border:2px solid #ccc;background:white;color:#666;font-size:13px;letter-spacing:0.1em;cursor:pointer;">ERASER</button>
        <button id="draw-clear" style="padding:8px 14px;border-radius:999px;border:1.5px solid #ddd;background:white;color:#aaa;font-size:12px;cursor:pointer;">CLEAR</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;align-items:center;">
        <span style="font-size:12px;color:#666;margin-right:4px;">COLOR:</span>
        <button class="color-btn" data-color="#000000" style="width:28px;height:28px;border-radius:50%;background:#000000;border:2px solid #000;cursor:pointer;"></button>
        <button class="color-btn" data-color="#82d1e1" style="width:28px;height:28px;border-radius:50%;background:#82d1e1;border:2px solid #ddd;cursor:pointer;"></button>
        <button class="color-btn" data-color="#45503b" style="width:28px;height:28px;border-radius:50%;background:#45503b;border:2px solid #ddd;cursor:pointer;"></button>
        <button class="color-btn" data-color="#bbbe64" style="width:28px;height:28px;border-radius:50%;background:#bbbe64;border:2px solid #ddd;cursor:pointer;"></button>
        <button class="color-btn" data-color="#9891c6" style="width:28px;height:28px;border-radius:50%;background:#9891c6;border:2px solid #ddd;cursor:pointer;"></button>
        <button class="color-btn" data-color="#7a306c" style="width:28px;height:28px;border-radius:50%;background:#7a306c;border:2px solid #ddd;cursor:pointer;"></button>
      </div>
      <canvas id="prompt-canvas" width="600" height="300" style="width:100%;border:1.5px solid #eee;border-radius:12px;touch-action:none;display:block;"></canvas>
      <button id="prompt-complete" style="width:100%;padding:14px;border-radius:999px;background:black;color:white;border:none;font-size:15px;letter-spacing:0.1em;cursor:pointer;margin-top:12px;">SAVE & CONTINUE</button>`,
  };

  const card = document.createElement("div");
  card.id = "tread-prompt-card";
  card.style.cssText = `position:fixed;bottom:0;left:0;right:0;background:white;border-radius:20px 20px 0 0;padding:24px 20px 44px;z-index:99999;box-shadow:0 -4px 30px rgba(0,0,0,0.15);transform:translateY(100%);transition:transform 350ms cubic-bezier(0.34,1.56,0.64,1);font-family:sans-serif;max-height:90vh;overflow-y:auto;`;

  card.innerHTML = `
    <div id="swipe-handle" style="width:40px;height:4px;background:#ccc;border-radius:2px;margin:0 auto 18px;cursor:grab;"></div>
    <div style="font-size:11px;letter-spacing:0.2em;color:#999;margin-bottom:8px;">${typeIcons[prompt.type]} PROMPT ${waypointIndex} OF ${total}</div>
    <p style="font-size:17px;line-height:1.55;margin:0 0 4px;font-weight:500;">${prompt.text}</p>
    ${responseHTMLMap[prompt.type] || responseHTMLMap.action}
  `;

  document.body.appendChild(card);
  requestAnimationFrame(() => { card.style.transform = "translateY(0)"; });
  card._waypointIndex = waypointIndex - 1;

  // ── Swipe to dismiss ──
  const handleBar = card.querySelector('#swipe-handle');
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const onStart = (e) => {
    isDragging = true;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    currentY = startY;
    card.style.transition = 'none';
    if (handleBar) handleBar.style.cursor = 'grabbing';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      card.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const onEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;

    const deltaY = currentY - startY;
    card.style.transition = 'transform 350ms cubic-bezier(0.34,1.56,0.64,1)';
    if (handleBar) handleBar.style.cursor = 'grab';

    // If dragged down more than 100px, dismiss
    if (deltaY > 100) {
      dismissCard();
    } else {
      // Snap back to open position
      card.style.transform = 'translateY(0)';
    }
  };

  // Attach both touch and mouse events
  if (handleBar) {
    // Touch events for mobile
    handleBar.addEventListener('touchstart', onStart, { passive: true });
    handleBar.addEventListener('touchmove', onMove, { passive: false });
    handleBar.addEventListener('touchend', onEnd, { passive: true });
    handleBar.addEventListener('touchcancel', onEnd, { passive: true });
    
    // Mouse events for desktop
    handleBar.addEventListener('mousedown', onStart);
  }

  // Global mouse events (only active when dragging)
  document.addEventListener('mousemove', (e) => {
    if (isDragging && !e.touches) onMove(e);
  });
  document.addEventListener('mouseup', (e) => {
    if (isDragging && !e.touches) onEnd(e);
  });

  // Also allow dragging from the top padding area of the card
  const topPadding = document.createElement('div');
  topPadding.style.cssText = 'position:absolute;top:0;left:0;right:0;height:60px;z-index:1;cursor:grab;';
  card.insertBefore(topPadding, card.firstChild);
  
  // Touch events for mobile
  topPadding.addEventListener('touchstart', onStart, { passive: true });
  topPadding.addEventListener('touchmove', onMove, { passive: false });
  topPadding.addEventListener('touchend', onEnd, { passive: true });
  topPadding.addEventListener('touchcancel', onEnd, { passive: true });
  
  // Mouse events for desktop
  topPadding.addEventListener('mousedown', onStart);

  // ── Photo
  const photoInput = card.querySelector("#prompt-photo");
  const cameraBtn = card.querySelector("#open-camera-btn");
  if (photoInput && cameraBtn) {
    cameraBtn.addEventListener("click", () => {
      photoInput.click();
    });
    
    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = card.querySelector("#photo-preview");
        preview.src = ev.target.result;
        preview.style.display = "block";
        card.querySelector("#prompt-complete").style.display = "block";
        card._photoDataURL = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Drawing
  const canvas = card.querySelector("#prompt-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let drawing = false, tool = "pen", currentColor = "#000000";
    const penBtn = card.querySelector("#draw-pen");
    const eraserBtn = card.querySelector("#draw-eraser");
    const colorBtns = card.querySelectorAll(".color-btn");

    const setTool = (t) => {
      tool = t;
      penBtn.style.cssText += `background:${t==="pen"?"black":"white"};color:${t==="pen"?"white":"black"};border:2px solid ${t==="pen"?"black":"#ccc"};`;
      eraserBtn.style.cssText += `background:${t==="eraser"?"black":"white"};color:${t==="eraser"?"white":"#666"};border:2px solid ${t==="eraser"?"black":"#ccc"};`;
    };
    
    const setColor = (color) => {
      currentColor = color;
      colorBtns.forEach(btn => {
        if (btn.dataset.color === color) {
          btn.style.border = "2px solid #000";
          btn.style.transform = "scale(1.15)";
        } else {
          btn.style.border = "2px solid #ddd";
          btn.style.transform = "scale(1)";
        }
      });
    };
    
    penBtn.addEventListener("click", () => setTool("pen"));
    eraserBtn.addEventListener("click", () => setTool("eraser"));
    colorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        setColor(btn.dataset.color);
        setTool("pen"); // Switch to pen when selecting color
      });
    });
    card.querySelector("#draw-clear").addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return [(src.clientX-r.left)*(canvas.width/r.width), (src.clientY-r.top)*(canvas.height/r.height)];
    };

    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); drawing=true; ctx.beginPath(); ctx.moveTo(...pos(e)); });
    canvas.addEventListener("pointermove", (e) => {
      e.preventDefault();
      if (!drawing) return;
      ctx.lineTo(...pos(e));
      ctx.globalCompositeOperation = tool==="eraser" ? "destination-out" : "source-over";
      ctx.lineWidth = tool==="eraser" ? 24 : 2.5;
      ctx.strokeStyle = currentColor;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.stroke(); ctx.beginPath(); ctx.moveTo(...pos(e));
    });
    canvas.addEventListener("pointerup", () => { drawing=false; });
    canvas.addEventListener("pointerleave", () => { drawing=false; });
    
    // Set initial color
    setColor("#000000");
  }

  // ── Recording
  const recordBtn = card.querySelector("#prompt-record-btn");
  let mediaRecorder=null, recordedChunks=[], timerInterval=null;
  if (recordBtn) {
    recordBtn.addEventListener("click", async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        clearInterval(timerInterval);
        recordBtn.textContent = "RECORDING SAVED ✓";
        recordBtn.disabled = true;
        card.querySelector("#prompt-complete").style.display = "block";
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recordedChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "audio/webm" });
            card._audioBlobURL = URL.createObjectURL(blob);
          };
          mediaRecorder.start();
          const timer = card.querySelector("#record-timer");
          timer.style.display = "block";
          const start = Date.now();
          timerInterval = setInterval(() => {
            const sec = Math.floor((Date.now()-start)/1000);
            timer.textContent = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
          }, 500);
          recordBtn.textContent = "STOP RECORDING";
          recordBtn.style.background = "#000";
          recordBtn.style.color = "#fff";
        } catch { alert("Microphone access denied."); }
      }
    });
  }

  // ── Save & complete
  card.querySelector("#prompt-complete")?.addEventListener("click", () => {
    let response = null;
    if (prompt.type === "write") response = card.querySelector("#prompt-response")?.value?.trim() || null;
    else if (prompt.type === "photo") response = card._photoDataURL || null;
    else if (prompt.type === "draw") response = card.querySelector("#prompt-canvas")?.toDataURL("image/png") || null;
    else if (prompt.type === "record") response = card._audioBlobURL || null;

    // Save to temporary walk storage (not journal yet)
    saveToCurrentWalk({
      id: Date.now(),
      date: new Date().toISOString(),
      location: lastUserPos ? { lat: lastUserPos[0], lng: lastUserPos[1] } : null,
      promptText: prompt.text,
      type: prompt.type,
      response,
    });

    dismissCard();
    markWaypointComplete(waypointIndex - 1);
  });
}

function dismissCard() {
  const card = document.getElementById("tread-prompt-card");
  if (!card) return;
  card.style.transform = "translateY(100%)";
  setTimeout(() => card.remove(), 350);
}

function markWaypointComplete(index) {
  const wp = activeWaypoints[index];
  if (!wp) return;
  wp.state = "done";
  updateWaypointMarker(index, "done");
  currentPromptIndex = index + 1;
  
  // Reveal the next segment of the route
  updateRouteDisplay(index);
}


// ── PROXIMITY CHECK ───────────────────────────────────────────────────────────

function checkProximity(userLat, userLng) {
  lastUserPos = [userLat, userLng];

  for (let i = 0; i < activeWaypoints.length; i++) {
    const wp = activeWaypoints[i];
    const dist = distanceBetween([userLat, userLng], wp.latlng);

    // Auto-dismiss open card if user walks 50m past this waypoint
    const card = document.getElementById("tread-prompt-card");
    if (card && card._waypointIndex === i && wp.state === "shown") {
      if (dist > DISMISS_RADIUS_M) {
        dismissCard();
        wp.state = "skipped";
        updateWaypointMarker(i, "skipped");
        currentPromptIndex = Math.max(currentPromptIndex, i + 1);
      }
    }

    // Trigger next pending waypoint
    if (wp.state === "pending" && dist <= TRIGGER_RADIUS_M) {
      wp.state = "shown";
      updateWaypointMarker(i, "active");
      showPromptCard(wp.prompt, i + 1, activeWaypoints.length);
      break;
    }
  }
}


function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


// ── CALCULATE & DRAW ROUTE ────────────────────────────────────────────────────

async function calculateAndDrawRoute(lat, lng, minutes) {
  // Clear any previous walk data
  clearCurrentWalk();

  const basePoints = Math.max(1, Math.floor(minutes / 7));
  const variation = Math.floor(Math.random() * 3) - 1;
  const numPoints = Math.min(12, Math.max(1, basePoints + variation));

  const radius = minutesToRadius(minutes);
  const waypoints = generateWindingWaypoints(lat, lng, radius, numPoints);
  const loopCoords = [[lat, lng], ...waypoints, [lat, lng]];
  const selectedPrompts = shuffleArray(selectPrompts(answers, numPoints));

  showMapInStartPanel();
  startMap.setView([lat, lng], 15);

  const mapDiv = document.getElementById("startMap");
  const loadingEl = document.createElement("div");
  loadingEl.textContent = "Calculating your route…";
  loadingEl.style.cssText =
    "position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:white;padding:6px 14px;border-radius:8px;font-size:13px;z-index:9999;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.2);";
  mapDiv.style.position = "relative";
  mapDiv.appendChild(loadingEl);

  try {
    const fetchedPoints = await fetchOSRMRoute(loopCoords);
    routePoints = fetchedPoints;

    // Store waypoint indices in the route for segment calculation
    waypointRouteIndices = findWaypointIndicesInRoute(waypoints, fetchedPoints);

    if (routeLayer) startMap.removeLayer(routeLayer);
    if (completedRouteLayer) startMap.removeLayer(completedRouteLayer);

    // Initialize: show only the segment from start to first waypoint
    updateRouteDisplay(0);

    // Fit bounds using waypoints + start so the full walk area is visible
    const allPoints = [[lat, lng], ...waypoints];
    startMap.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] });

    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: "#000",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(startMap).bindPopup("You start here").openPopup();

    activeWaypoints.forEach(wp => {
      if (wp.marker) startMap.removeLayer(wp.marker);
    });
    activeWaypoints = [];
    currentPromptIndex = 0;
    finishBtnShown = false;
    document.getElementById("tread-finish-btn")?.remove();

    ensureArrow();

    waypoints.forEach((latlng, i) => {
      const prompt = selectedPrompts[i] || selectedPrompts[i % selectedPrompts.length];
      const wpColor = WAYPOINT_COLORS[Math.floor(Math.random() * WAYPOINT_COLORS.length)];
      const marker = makeWaypointMarker(latlng, i + 1, "pending", wpColor).addTo(startMap);

      marker.on("click", () => {
        showPromptCard(prompt, i + 1, waypoints.length);
      });

      activeWaypoints.push({
        latlng,
        prompt,
        marker,
        state: "pending",
        color: wpColor
      });
    });

  } catch (err) {
    console.error("Route calculation failed:", err);
    alert("Couldn't calculate a route. Check your connection and try again.");
  } finally {
    loadingEl.remove();
  }
}


// ── PROGRESSIVE ROUTE REVEAL ──────────────────────────────────────────────────

let completedRouteLayer = null;
let waypointRouteIndices = [];

// Find the closest route point index for each waypoint
function findWaypointIndicesInRoute(waypoints, routePoints) {
  return waypoints.map(wp => {
    let minDist = Infinity;
    let closestIdx = 0;
    routePoints.forEach((pt, i) => {
      const dist = distanceBetween(wp, pt);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
    return closestIdx;
  });
}

// Update the visible route based on current progress
// completedUpTo: index of the last completed waypoint (-1 for none, 0 for first, etc.)
function updateRouteDisplay(completedUpTo) {
  if (!routePoints.length) return;
  
  // Remove existing layers
  if (routeLayer) startMap.removeLayer(routeLayer);
  if (completedRouteLayer) startMap.removeLayer(completedRouteLayer);
  
  // Calculate which segment to show
  const nextWaypointIdx = completedUpTo + 1;
  
  if (nextWaypointIdx < waypointRouteIndices.length) {
    // Show dotted line from start (or last waypoint) to next waypoint
    const startIdx = completedUpTo < 0 ? 0 : waypointRouteIndices[completedUpTo];
    const endIdx = waypointRouteIndices[nextWaypointIdx];
    const activeSegment = routePoints.slice(startIdx, endIdx + 1);
    
    routeLayer = L.polyline(activeSegment, {
      color:"#000", weight:3, opacity:0.55, lineJoin:"round", lineCap:"round",
      dashArray: "6, 10",
    }).addTo(startMap);
  } else {
    // Final segment back to start
    const startIdx = waypointRouteIndices[waypointRouteIndices.length - 1];
    const finalSegment = routePoints.slice(startIdx);
    
    routeLayer = L.polyline(finalSegment, {
      color:"#000", weight:3, opacity:0.55, lineJoin:"round", lineCap:"round",
      dashArray: "6, 10",
    }).addTo(startMap);
  }
  
  // Show completed path as solid line
  if (completedUpTo >= 0) {
    const completedIdx = waypointRouteIndices[completedUpTo];
    const completedSegment = routePoints.slice(0, completedIdx + 1);
    
    completedRouteLayer = L.polyline(completedSegment, {
      color:"#000", weight:4, opacity:0.85, lineJoin:"round", lineCap:"round",
    }).addTo(startMap);
  }
}


// ── DIRECTION ARROW ───────────────────────────────────────────────────────────
// Floating arrow overlay on the map that points toward the route.
// Phase 1 — points to nearest upcoming route segment (following the path)
// Phase 2 — within 150m of next waypoint, switches to point directly at it
// Pulses gently to feel alive.

let arrowEl = null;
const WAYPOINT_NEAR_M = 150; // switch from route-following to waypoint-pointing

function ensureArrow() {
  if (arrowEl) return;

  // Inject pulse keyframes once
  if (!document.getElementById("tread-arrow-style")) {
    const style = document.createElement("style");
    style.id = "tread-arrow-style";
    style.textContent = `
      @keyframes tread-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
        50%       { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
      }
      #tread-direction-arrow { animation: tread-pulse 2.4s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }

  arrowEl = document.createElement("div");
  arrowEl.id = "tread-direction-arrow";
  arrowEl.style.cssText = [
    "position:absolute",
    "top:20px",
    "right:20px",
    "width:52px",
    "height:52px",
    "background:black",
    "border-radius:50%",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    // z-index must beat Leaflet's panes (650+) but sit below popups (700+)
    "z-index:650",
    "pointer-events:none",
    "box-shadow:0 4px 14px rgba(0,0,0,0.3)",
    "transition:opacity 400ms ease",
    "opacity:0",
  ].join(";");

  arrowEl.innerHTML = `
    <svg id="tread-arrow-svg" width="22" height="22" viewBox="0 0 22 22" fill="none"
         xmlns="http://www.w3.org/2000/svg" style="transition:transform 300ms ease;">
      <path d="M11 2L11 18M11 2L5 9M11 2L17 9"
            stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Attach to Leaflet map container — sits above all panes, position:relative already set by Leaflet
  const mapContainer = startMap.getContainer();
  if (mapContainer) mapContainer.appendChild(arrowEl);
}

// Bearing in degrees from point a → point b ([lat,lng] pairs)
function bearingTo(a, b) {
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Find the index of the closest point on the route ahead of the user
function nearestRoutePointAhead(userLat, userLng) {
  if (!routePoints.length) return -1;
  let minDist = Infinity;
  let minIdx = 0;
  routePoints.forEach((pt, i) => {
    const d = distanceBetween([userLat, userLng], pt);
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  // Step a few points ahead so the arrow leads, not just tracks
  const lookahead = Math.min(minIdx + 5, routePoints.length - 1);
  return lookahead;
}

function updateDirectionArrow(userLat, userLng) {
  if (!routePoints.length) { console.warn("Arrow: no route points yet"); return; }
  ensureArrow();
  arrowEl.style.opacity = "1";

  // Find next uncompleted waypoint
  const nextWP = activeWaypoints.find(wp => wp.state === "pending" || wp.state === "shown");

  let targetBearing;

  if (nextWP) {
    const distToWP = distanceBetween([userLat, userLng], nextWP.latlng);
    if (distToWP <= WAYPOINT_NEAR_M) {
      // Phase 2: close to waypoint — point straight at it
      targetBearing = bearingTo([userLat, userLng], nextWP.latlng);
    } else {
      // Phase 1: follow the route line
      const aheadIdx = nearestRoutePointAhead(userLat, userLng);
      targetBearing = bearingTo([userLat, userLng], routePoints[aheadIdx]);
    }
  } else {
    // All waypoints done — point back toward start
    const start = routePoints[0];
    targetBearing = bearingTo([userLat, userLng], start);
  }

  // Rotate only the SVG so the pulse animation on the circle isn't disrupted
  const svg = document.getElementById("tread-arrow-svg");
  if (svg) svg.style.transform = `rotate(${targetBearing}deg)`;
}

function hideDirectionArrow() {
  if (arrowEl) arrowEl.style.opacity = "0";
}

// ── LIVE TRACKING ─────────────────────────────────────────────────────────────

let watchId = null;
let userDot = null;
let breadcrumbLayer = null;
let breadcrumbCoords = [];
let isFollowing = true;

function startLiveTracking() {
  if (!navigator.geolocation) return;
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  breadcrumbCoords = [];

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;

      if (userDot) { userDot.setLatLng([lat, lng]); }
      else {
        userDot = L.circleMarker([lat, lng], {
          radius:9, fillColor:"#fff", color:"#000", weight:3, fillOpacity:1, zIndexOffset:1000,
        }).addTo(startMap);
      }

      breadcrumbCoords.push([lat, lng]);
      if (breadcrumbLayer) startMap.removeLayer(breadcrumbLayer);
      if (breadcrumbCoords.length > 1) {
        breadcrumbLayer = L.polyline(breadcrumbCoords, {
          color:"#000", weight:4, opacity:0.75, lineJoin:"round", lineCap:"round",
        }).addTo(startMap);
      }

      if (isFollowing) startMap.panTo([lat, lng], { animate:true, duration:0.5 });
      checkProximity(lat, lng);
      updateDirectionArrow(lat, lng);
      checkFinishProximity(lat, lng);
    },
    (err) => console.warn("Tracking:", err.message),
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );

  startMap.on("dragstart", () => { isFollowing = false; });
}

function stopLiveTracking() {
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}

function requestLocationThenShowMap() {
  if (!navigator.geolocation) { alert("Geolocation not supported."); showMapInStartPanel(); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      answers.latitude = pos.coords.latitude;
      answers.longitude = pos.coords.longitude;
      calculateAndDrawRoute(answers.latitude, answers.longitude, answers.q1_time || 55)
        .then(() => startLiveTracking());
    },
    (err) => { console.error(err); alert("Location permission denied."); showMapInStartPanel(); }
  );
}

// Init
renderJournal();

// Wire up the "Start New Walk" button
document.getElementById("startNewBtn")?.addEventListener("click", () => {
  openQuiz();
});