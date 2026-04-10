// ===============================
// TREAD — collage.js
// Walk completion collage:
// - Route outline SVG from breadcrumb coords
// - Draggable elements: photos, drawings, audio waveforms, writing cards
// - Export to image download or save to journal
// ===============================

const COLLAGE_W = window.innerWidth;
const COLLAGE_H = window.innerHeight;

// ── OPEN COLLAGE ──────────────────────────────────────────────────────────────

function openCollage(breadcrumbCoords, journalEntries) {
  document.getElementById("tread-collage")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "tread-collage";
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: white;
    z-index: 199999;
    overflow: hidden;
    font-family: sans-serif;
  `;

  // ── Header
  const header = document.createElement("div");
  header.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0;
    height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px;
    z-index: 10;
    border-bottom: 1px solid #eee;
    background: white;
  `;
  const now = new Date();
  const dateStr = `${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}.${now.getFullYear()}`;

  header.innerHTML = `
    <span style="font-size:13px;letter-spacing:0.2em;color:rgb(0,0,0);font-family:var(--font-display,serif);">${dateStr}</span>
    <div style="display:flex;gap:5px;align-items:center;">
      <button id="collage-save-journal" style="
        padding:5px 16px;border-radius:999px;border:1.5px solid black;
        background:rgb(255,255,255, 0.5);color:black;font-size:12px;letter-spacing:0.1em;cursor:pointer;
        font-family:var(--font-body,sans-serif);font-weight:300;
      ">SAVE</button>
      <button id="collage-export" style="
        padding:5px 16px;border-radius:999px;border:1.5px solid black;
        background:rgb(255,255,255, 0.5);color:black;font-size:12px;letter-spacing:0.1em;cursor:pointer;
        font-family:var(--font-body,sans-serif);font-weight:300;
      ">EXPORT</button>
      <button id="collage-home" style="
        padding:5px 16px;border-radius:999px;border:1.5px solid black;
        background:rgb(255,255,255, 0.5);color:black;font-size:12px;letter-spacing:0.1em;cursor:pointer;
        font-family:var(--font-body,sans-serif);font-weight:300;
      ">HOME</button>
    </div>
  `;
  overlay.appendChild(header);

  // ── Canvas area
  const canvas = document.createElement("div");
  canvas.id = "collage-canvas";
  canvas.style.cssText = `
    position: absolute;
    top: 56px; left: 0; right: 0; bottom: 0;
    overflow: hidden;
    background: white;
  `;
  overlay.appendChild(canvas);

  document.body.appendChild(overlay);

  // ── Build elements
  const elements = [];

  // Route outline
  if (breadcrumbCoords && breadcrumbCoords.length > 1) {
    const routeEl = makeRouteElement(breadcrumbCoords);
    placeElement(canvas, routeEl, "route");
    elements.push(routeEl);
  }

  // Journal entries from this walk
  journalEntries.forEach((entry, i) => {
    let el = null;
    // Skip action entries - they don't produce visual content for the collage
    if (entry.type === "action") {
      return;
    }
    
    if (entry.type === "photo" && entry.response) {
      el = makePhotoElement(entry.response);
    } else if (entry.type === "draw" && entry.response) {
      el = makeDrawElement(entry.response);
    } else if (entry.type === "record" && entry.response) {
      el = makeAudioElement(entry.response);
    } else if (entry.type === "write" && entry.response) {
      el = makeWriteElement(entry.response);
    }
    
    if (el) {
      placeElement(canvas, el, entry.type, i);
      elements.push(el);
    }
  });

  // ── Wire buttons

  // Home — close collage, close start overlay, return to entrance
  overlay.querySelector("#collage-home").onclick = () => {
    // Clear temporary walk data (user didn't save)
    clearCurrentWalk();
    
    overlay.remove();
    // Close the start overlay (quiz/map panel) so entrance is visible
    const startPanel = document.getElementById("start");
    if (startPanel) startPanel.classList.remove("active");
    window.navigateTo(0); // Navigate to entrance (was 1)
  };

  // Export — download image, show SAVED ✓ until layout changes
  const exportBtn = overlay.querySelector("#collage-export");

  const resetExportBtn = () => {
    exportBtn.textContent = "EXPORT";
    exportBtn.style.background = "black";
    exportBtn.disabled = false;
  };

  const markExportSaved = () => {
    exportBtn.textContent = "SAVED ✓";
    exportBtn.style.background = "#555";
    exportBtn.disabled = false;
  };

  exportBtn.onclick = async () => {
    exportBtn.textContent = "SAVING…";
    exportBtn.disabled = true;
    await exportCollage(canvas, "tread_walk");
    markExportSaved();
  };

  // Reset export button whenever user drags any element
  canvas.addEventListener("pointerdown", () => {
    if (exportBtn.textContent === "SAVED ✓") resetExportBtn();
  }, { capture: true });

  // Save to journal — snapshot, save, navigate to journal panel
  overlay.querySelector("#collage-save-journal").onclick = () => {
    const saveBtn = overlay.querySelector("#collage-save-journal");
    saveBtn.textContent = "SAVING…";
    saveBtn.disabled = true;

    exportCollage(canvas, null, (dataURL) => {
      // Save ONLY the collage image to journal
      saveJournalEntry({
        id: Date.now(),
        date: new Date().toISOString(),
        location: lastUserPos ? { lat: lastUserPos[0], lng: lastUserPos[1] } : null,
        type: "photo",
        response: dataURL,
        isCollage: true,
      });

      // Clear temporary walk data
      clearCurrentWalk();

      overlay.remove();
      window.navigateTo(1); // Navigate to journal (was 2)
    });
  };
}


// ── ELEMENT FACTORIES ─────────────────────────────────────────────────────────

function makeRouteElement(coords) {
  const size = Math.min(COLLAGE_W * 0.55, 320);

  // Normalize coords to fit SVG viewBox
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;
  const pad = 20;
  const vw = size - pad * 2, vh = size - pad * 2;

  const pts = coords.map(([lat, lng]) => {
    const x = pad + ((lng - minLng) / lngRange) * vw;
    const y = pad + ((maxLat - lat) / latRange) * vh; // flip Y
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const wrap = document.createElement("div");
  wrap.dataset.colType = "route";
  wrap.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"
         xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <polyline points="${pts}"
        fill="none" stroke="black" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    </svg>`;
  return wrap;
}

function makePhotoElement(dataURL) {
  const wrap = document.createElement("div");
  wrap.dataset.colType = "photo";
  const img = document.createElement("img");
  img.src = dataURL;
  img.style.cssText = "width:180px;height:180px;object-fit:cover;display:block;";
  wrap.appendChild(img);
  return wrap;
}

function makeDrawElement(dataURL) {
  const wrap = document.createElement("div");
  wrap.dataset.colType = "draw";
  const img = document.createElement("img");
  img.src = dataURL;
  img.style.cssText = "width:160px;height:80px;object-fit:contain;display:block;";
  wrap.appendChild(img);
  return wrap;
}

function makeAudioElement(blobURL) {
  const wrap = document.createElement("div");
  wrap.dataset.colType = "audio";
  wrap.style.cssText = "width:160px;";

  // Draw a fake waveform SVG (visual representation only)
  const bars = Array.from({ length: 28 }, () => 8 + Math.random() * 32);
  const svgH = 48;
  const barW = 4, gap = 2;
  const totalW = bars.length * (barW + gap);
  const barsSVG = bars.map((h, i) => {
    const x = i * (barW + gap);
    const y = (svgH - h) / 2;
    return `<rect x="${x}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}"
      rx="2" fill="black" opacity="0.8"/>`;
  }).join("");

  wrap.innerHTML = `
    <svg viewBox="0 0 ${totalW} ${svgH}" width="${totalW}" height="${svgH}"
         xmlns="http://www.w3.org/2000/svg" style="display:block;">
      ${barsSVG}
    </svg>
  `;
  return wrap;
}

function makeWriteElement(text) {
  const wrap = document.createElement("div");
  wrap.dataset.colType = "write";
  wrap.style.cssText = "width:160px;";
  wrap.innerHTML = `
    <p style="font-size:14px;color:#111;margin:0;line-height:1.55;">${text}</p>
  `;
  return wrap;
}


// ── PLACEMENT & DRAG ──────────────────────────────────────────────────────────

function placeElement(canvas, el, type, index = 0) {
  const cw = canvas.offsetWidth || COLLAGE_W;
  const ch = canvas.offsetHeight || (COLLAGE_H - 56);

  // Random scatter with slight bias by type
  const margin = 40;
  const x = margin + Math.random() * (cw - margin * 2 - 200);
  const y = margin + Math.random() * (ch - margin * 2 - 200);
  const rotate = (Math.random() - 0.5) * 10; // ±5 degrees

  el.style.cssText += `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    transform: rotate(${rotate}deg);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  `;

  makeDraggable(el);
  canvas.appendChild(el);
}

function makeDraggable(el) {
  let startX, startY, origX, origY, isDragging = false;
  
  // Pinch-to-zoom variables
  let initialScale = 1;
  let currentScale = 1;
  let initialDistance = 0;
  let isPinching = false;

  const onDown = (e) => {
    // Handle pinch zoom (2 fingers)
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      isPinching = true;
      isDragging = false;
      
      // Calculate initial distance between fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Store current scale from transform
      const transform = el.style.transform || '';
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      initialScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      el.style.zIndex = nextZ();
      
      document.addEventListener("touchmove", onPinchMove, { passive: false });
      document.addEventListener("touchend", onPinchEnd);
      return;
    }
    
    // Handle single-finger drag
    if (isPinching) return;
    
    e.preventDefault();
    isDragging = true;
    el.style.cursor = "grabbing";
    el.style.zIndex = nextZ();

    const src = e.touches ? e.touches[0] : e;
    startX = src.clientX;
    startY = src.clientY;
    origX = parseFloat(el.style.left) || 0;
    origY = parseFloat(el.style.top) || 0;

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const onPinchMove = (e) => {
    if (!isPinching || e.touches.length !== 2) return;
    e.preventDefault();
    
    // Calculate current distance between fingers
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    // Calculate scale change
    const scaleChange = currentDistance / initialDistance;
    currentScale = initialScale * scaleChange;
    
    // Limit scale between 0.3x and 3x
    currentScale = Math.max(0.3, Math.min(3, currentScale));
    
    // Extract rotation from current transform
    const transform = el.style.transform || '';
    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    const rotation = rotateMatch ? rotateMatch[1] : '0deg';
    
    // Apply new scale while preserving rotation
    el.style.transform = `rotate(${rotation}) scale(${currentScale})`;
  };

  const onPinchEnd = () => {
    isPinching = false;
    document.removeEventListener("touchmove", onPinchMove);
    document.removeEventListener("touchend", onPinchEnd);
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const src = e.touches ? e.touches[0] : e;
    const dx = src.clientX - startX;
    const dy = src.clientY - startY;
    el.style.left = `${origX + dx}px`;
    el.style.top = `${origY + dy}px`;
  };

  const onUp = () => {
    isDragging = false;
    el.style.cursor = "grab";
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  };

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("touchstart", onDown, { passive: false });
}

let zCounter = 1;
const nextZ = () => ++zCounter;


// ── EXPORT ────────────────────────────────────────────────────────────────────

async function exportCollage(canvas, filename, callback) {
  // Use html2canvas if available, otherwise fall back to SVG snapshot
  if (typeof html2canvas !== "undefined") {
    const shot = await html2canvas(canvas, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    const dataURL = shot.toDataURL("image/png");
    if (callback) { callback(dataURL); return; }
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `${filename || "tread_collage"}.png`;
    a.click();
  } else {
    // Fallback: export as SVG snapshot of just the route
    alert("Export library not loaded. Add html2canvas to your index.html to enable full collage export.");
  }
}


// ── FINISH BUTTON ─────────────────────────────────────────────────────────────
// Shows on the map when user is within 80m of start point

const FINISH_RADIUS_M = 50;
let finishBtnShown = false;

function checkFinishProximity(userLat, userLng) {
  if (!routePoints.length || finishBtnShown) return;

  const startPoint = routePoints[0];
  const dist = distanceBetween([userLat, userLng], startPoint);

  if (dist <= FINISH_RADIUS_M) {
    showFinishButton();
  }
}

function showFinishButton() {
  if (document.getElementById("tread-finish-btn")) return;
  finishBtnShown = true;

  const btn = document.createElement("button");
  btn.id = "tread-finish-btn";
  btn.textContent = "FINISH WALK";
  btn.style.cssText = `
    position: fixed;
    bottom: 36px;
    left: 50%;
    transform: translateX(-50%);
    padding: 14px 32px;
    background: black;
    color: white;
    border: none;
    border-radius: 999px;
    font-size: 14px;
    letter-spacing: 0.2em;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 6px 24px rgba(0,0,0,0.3);
    animation: tread-rise 400ms cubic-bezier(0.34,1.56,0.64,1) forwards;
  `;

  if (!document.getElementById("tread-finish-style")) {
    const style = document.createElement("style");
    style.id = "tread-finish-style";
    style.textContent = `
      @keyframes tread-rise {
        from { opacity:0; transform:translateX(-50%) translateY(20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  btn.onclick = () => {
    btn.remove();
    finishBtnShown = false;
    stopLiveTracking();
    hideDirectionArrow();

    // Use the temporary walk entries (not from journal)
    openCollage(breadcrumbCoords, currentWalkEntries);
  };

  document.body.appendChild(btn);
}