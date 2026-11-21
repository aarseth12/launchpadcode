// Canvas renderer for the Python `draw` module. A running program streams {type:"draw", op, ...}
// messages (see server/py-runtime/draw.py) and DrawCanvas paints them on a 300×300 picture with
// (0, 0) at the top-left and y growing DOWN. Used by console.html and by lesson.html's code steps.
// Extras for learning coordinates: an optional x/y grid and a live "x, y" readout under the mouse.
(function () {
  const SIZE = 300;
  const HINT = "point to see x, y";
  const CSS = `
    .draw-box { width:100%; max-width:360px; aspect-ratio:1; margin:0 auto; background:#fff; border-radius:6px; overflow:hidden; }
    .draw-box canvas { display:block; width:100%; height:100%; cursor:crosshair; }
    .draw-bar { display:flex; justify-content:space-between; align-items:center; gap:10px; max-width:360px; margin:6px auto 0; font-size:12px; color:var(--muted, #8b93a3); }
    .draw-bar label { display:flex; align-items:center; gap:5px; cursor:pointer; user-select:none; -webkit-user-select:none; white-space:nowrap; }
    .draw-xy { font-family:var(--mono, monospace); white-space:nowrap; }`;
  let styled = false;

  function DrawCanvas(host) {
    if (!styled) { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); styled = true; }
    host.innerHTML = `<div class="draw-box"><canvas></canvas></div>
      <div class="draw-bar"><label><input type="checkbox"> x/y grid</label><span class="draw-xy">${HINT}</span></div>`;
    const box = host.querySelector(".draw-box");
    const cv = host.querySelector("canvas");
    const ctx = cv.getContext("2d");
    const gridBox = host.querySelector("input");
    const xy = host.querySelector(".draw-xy");
    let cmds = []; // everything since the last clear()/background(), to repaint on resize or grid toggle

    // Match the backing store to the displayed size (crisp on retina). 0 = hidden, 1 = ready, 2 = resized (wiped).
    function fit() {
      const w = box.clientWidth;
      if (!w) return 0;
      const px = Math.round(w * (window.devicePixelRatio || 1));
      let resized = false;
      if (cv.width !== px) { cv.width = px; cv.height = px; resized = true; }
      ctx.setTransform(px / SIZE, 0, 0, px / SIZE, 0, 0);
      return resized ? 2 : 1;
    }

    function grid() {
      ctx.save();
      ctx.strokeStyle = "#e3e6ec"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let v = 50; v < SIZE; v += 50) { ctx.moveTo(v, 0); ctx.lineTo(v, SIZE); ctx.moveTo(0, v); ctx.lineTo(SIZE, v); }
      ctx.stroke();
      ctx.fillStyle = "#9aa1af"; ctx.font = "9px system-ui, sans-serif";
      for (let v = 50; v < SIZE; v += 50) {
        ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(String(v), v, 2);
        ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(String(v), 2, v);
      }
      ctx.restore();
    }

    // Set a color, falling back when the name is unknown (the canvas silently ignores bad colors).
    function paintColor(prop, value, fallback) { ctx[prop] = fallback; if (value) ctx[prop] = value; }

    function paint(c) {
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const w = c.width != null ? c.width : 2;
      if (w > 0) ctx.lineWidth = w;
      paintColor("strokeStyle", c.color, "#000");
      if (c.op === "line") {
        ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2);
        if (w > 0) ctx.stroke();
      } else if (c.op === "circle" || c.op === "rect") {
        ctx.beginPath();
        if (c.op === "circle") ctx.arc(c.x, c.y, Math.max(0, c.r), 0, Math.PI * 2);
        else ctx.rect(c.x, c.y, c.w, c.h);
        if (c.fill) { paintColor("fillStyle", c.fill, "#000"); ctx.fill(); }
        if (w > 0) ctx.stroke();
      } else if (c.op === "text") {
        paintColor("fillStyle", c.color, "#000");
        ctx.font = `${c.size || 16}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(c.text), c.x, c.y);
      } else if (c.op === "background") {
        paintColor("fillStyle", c.color, "#fff");
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
      ctx.restore();
    }

    function redraw() {
      if (!fit()) return;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, SIZE, SIZE);
      let from = 0;
      if (cmds[0] && cmds[0].op === "background") { paint(cmds[0]); from = 1; }
      if (gridBox.checked) grid();
      for (let i = from; i < cmds.length; i++) paint(cmds[i]);
    }

    function add(c) {
      if (c.op === "clear") { cmds = []; redraw(); return; }
      if (c.op === "background") { cmds = [c]; redraw(); return; }
      cmds.push(c);
      const f = fit();
      if (f === 2) redraw(); else if (f === 1) paint(c);
    }

    function reset() { cmds = []; redraw(); }

    gridBox.onchange = redraw;
    cv.addEventListener("mousemove", (e) => {
      const r = cv.getBoundingClientRect();
      xy.textContent = `x: ${Math.round(((e.clientX - r.left) / r.width) * SIZE)}, y: ${Math.round(((e.clientY - r.top) / r.height) * SIZE)}`;
    });
    cv.addEventListener("mouseleave", () => { xy.textContent = HINT; });
    if (window.ResizeObserver) new ResizeObserver(redraw).observe(box); // also repaints when a hidden panel appears
    redraw();
    return { add, reset, redraw };
  }

  window.DrawCanvas = DrawCanvas;
})();
