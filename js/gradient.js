// ── TREAD — gradient.js
// Fluid orb-based gradient animation for the entrance screen.
// Five colour orbs drift independently using sine/cosine paths,
// blended via radial gradients on a canvas.

(function () {
  const canvas = document.getElementById("gradient-canvas");
  const quizCanvas = document.getElementById("quiz-gradient-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const qctx = quizCanvas ? quizCanvas.getContext("2d") : null;

  // Palette — the five brand colours
  const COLORS = [
    { r: 0x82, g: 0xd1, b: 0xe1 }, // #82d1e1 teal
    { r: 0x45, g: 0x50, b: 0x3b }, // #45503b dark green
    { r: 0xbb, g: 0xbe, b: 0x64 }, // #bbbe64 yellow-green
    { r: 0x98, g: 0x91, b: 0xc6 }, // #9891c6 lavender
    { r: 0x7a, g: 0x30, b: 0x6c }, // #7a306c plum
  ];

  // Each orb has its own drift path defined by speed + phase offsets
  const orbs = COLORS.map((color, i) => ({
    color,
    // Starting positions spread around the canvas
    cx: 0.2 + (i * 0.15),
    cy: 0.2 + (i * 0.18),
    // Drift parameters — each orb moves on an independent Lissajous-ish path
    ax: 0.28 + i * 0.04,   // x amplitude (fraction of canvas width)
    ay: 0.22 + i * 0.05,   // y amplitude
    fx: 0.00018 + i * 0.000025, // x frequency
    fy: 0.00021 + i * 0.000019, // y frequency
    px: i * 1.3,            // x phase offset
    py: i * 0.9,            // y phase offset
    radius: 0.48 + i * 0.04, // orb size (fraction of canvas diagonal)
  }));

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // FIX 4: quiz canvas may be inside a panel that's hidden or transformed off-screen.
    // We force it to measure against the window instead of its own offsetWidth
    // (which returns 0 when the parent has display:none or is off-screen).
    if (quizCanvas) {
      const w = quizCanvas.offsetWidth || window.innerWidth;
      const h = quizCanvas.offsetHeight || window.innerHeight;
      quizCanvas.width  = w;
      quizCanvas.height = h;
    }
  }

  function drawOnCtx(context, w, h, t) {
    const diag = Math.sqrt(w * w + h * h);
    context.clearRect(0, 0, w, h);
    orbs.forEach(orb => {
      const x = (orb.cx + Math.sin(t * orb.fx + orb.px) * orb.ax) * w;
      const y = (orb.cy + Math.cos(t * orb.fy + orb.py) * orb.ay) * h;
      const r = orb.radius * diag;
      const { r: cr, g: cg, b: cb } = orb.color;
      const grad = context.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,   `rgba(${cr},${cg},${cb},0.82)`);
      grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.35)`);
      grad.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
      context.globalCompositeOperation = "screen";
      context.fillStyle = grad;
      context.fillRect(0, 0, w, h);
    });
  }

  function draw(t) {
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    drawOnCtx(ctx, w, h, t);

    // FIX 4: re-measure quiz canvas each frame in case it became visible since last resize
    if (qctx && quizCanvas) {
      const qw = quizCanvas.offsetWidth || window.innerWidth;
      const qh = quizCanvas.offsetHeight || window.innerHeight;
      if (quizCanvas.width !== qw || quizCanvas.height !== qh) {
        quizCanvas.width  = qw;
        quizCanvas.height = qh;
      }
      drawOnCtx(qctx, quizCanvas.width, quizCanvas.height, t);
    }
  }

  let raf = null;
  function loop(t) {
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  // Run whenever the entrance panel is in view (covers entrance + quiz both)
  // Pause when user is on map or journal to save battery
  const entrancePanel = document.getElementById("entrance");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        resize();
        if (!raf) raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
  }, { threshold: 0.05 });

  if (entrancePanel) observer.observe(entrancePanel);

  window.addEventListener("resize", () => {
    resize();
  });

  // Initial size
  resize();
})();