/* Prozedurale liminale Mandalas. Seed, symmetrisches Einfärben, Galerie. */
(function (global) {
  const PALETTES = [
    { id: "daemmerung", name: "Dämmerung", colors: ["#e4c37a", "#8c5a2e", "#4d8f88", "#c48a8a", "#2a1d4a", "#f0e2c4"] },
    { id: "nebel", name: "Nebel", colors: ["#c9b8d4", "#8a8e9a", "#d4c28a", "#5e7a78", "#3d3550", "#e8e4ef"] },
    { id: "glut", name: "Glut", colors: ["#c8713a", "#e8a04a", "#7a1e1e", "#d4b48a", "#3a1c12", "#f3d7b0"] },
    { id: "tide", name: "Tide", colors: ["#7eb8b0", "#e8f0ea", "#1d4a4a", "#c2a06a", "#14303a", "#9ad0c8"] }
  ];

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function generate(seed) {
    const r = rng(seed);
    const fold = pick(r, [6, 8, 10, 12]);
    const rings = 4 + Math.floor(r() * 3);
    const shapes = [];
    let id = 0;
    for (let i = 0; i < rings; i++) {
      const t0 = i / rings, t1 = (i + 1) / rings;
      const r0 = 0.08 + t0 * 0.86;
      const r1 = 0.08 + t1 * 0.86 - 0.012;
      const kind = pick(r, ["petal", "diamond", "lens", "arc", "teardrop", "star", "scale"]);
      const count = kind === "arc" ? 1 : (r() < 0.35 ? 2 : 1);
      for (let c = 0; c < count; c++) {
        const a0 = (c / count) * (Math.PI * 2 / fold);
        const a1 = ((c + 1) / count) * (Math.PI * 2 / fold);
        const mid = (a0 + a1) / 2;
        shapes.push({
          id: id++, kind, r0: r0 + r() * 0.02, r1: r1, a0, a1, mid,
          bulge: 0.35 + r() * 0.5,
          fill: null, anim: 0
        });
      }
      if (r() < 0.55) {
        shapes.push({
          id: id++, kind: "dots", r0: r1 - 0.015, r1: r1 + 0.01,
          a0: 0, a1: Math.PI * 2 / fold, mid: Math.PI / fold,
          n: 2 + Math.floor(r() * 3), fill: null, anim: 0
        });
      }
    }
    shapes.push({
      id: id++, kind: "core", r0: 0, r1: 0.08 + r() * 0.05,
      a0: 0, a1: Math.PI * 2 / fold, mid: 0, fill: null, anim: 0
    });
    return { seed, fold, shapes };
  }

  function wedgePath(ctx, sh, rot) {
    const a0 = sh.a0 + rot, a1 = sh.a1 + rot, mid = sh.mid + rot;
    if (ctx.beginPath) ctx.beginPath();
    if (sh.kind === "core") {
      ctx.arc(0, 0, sh.r1, 0, Math.PI * 2);
      return;
    }
    if (sh.kind === "dots") {
      const n = sh.n || 3;
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * ((i + 0.5) / n);
        const rr = (sh.r0 + sh.r1) / 2;
        ctx.moveTo(Math.cos(a) * rr + 0.01, Math.sin(a) * rr);
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, (sh.r1 - sh.r0) * 0.7, 0, Math.PI * 2);
      }
      return;
    }
    if (sh.kind === "arc") {
      ctx.arc(0, 0, sh.r1, a0, a1);
      ctx.arc(0, 0, sh.r0, a1, a0, true);
      ctx.closePath();
      return;
    }
    if (sh.kind === "diamond" || sh.kind === "star") {
      const rm = (sh.r0 + sh.r1) / 2;
      const tip = sh.kind === "star" ? sh.r1 * 1.02 : sh.r1;
      ctx.moveTo(Math.cos(mid) * sh.r0, Math.sin(mid) * sh.r0);
      ctx.lineTo(Math.cos(a0) * rm, Math.sin(a0) * rm);
      ctx.lineTo(Math.cos(mid) * tip, Math.sin(mid) * tip);
      ctx.lineTo(Math.cos(a1) * rm, Math.sin(a1) * rm);
      ctx.closePath();
      return;
    }
    if (sh.kind === "teardrop" || sh.kind === "petal" || sh.kind === "lens" || sh.kind === "scale") {
      const rm = lerp(sh.r0, sh.r1, 0.45);
      const flare = (a1 - a0) * (sh.bulge || 0.5);
      ctx.moveTo(Math.cos(mid) * sh.r0, Math.sin(mid) * sh.r0);
      ctx.quadraticCurveTo(
        Math.cos(mid - flare) * rm, Math.sin(mid - flare) * rm,
        Math.cos(mid) * sh.r1, Math.sin(mid) * sh.r1
      );
      ctx.quadraticCurveTo(
        Math.cos(mid + flare) * rm, Math.sin(mid + flare) * rm,
        Math.cos(mid) * sh.r0, Math.sin(mid) * sh.r0
      );
      ctx.closePath();
    }
  }

  function drawShape(ctx, sh, rot, R, outline) {
    wedgePath(ctx, sh, rot);
    ctx.save();
    if (sh.fill) {
      const a = 0.18 + 0.62 * (sh.anim || 0);
      ctx.fillStyle = hexAlpha(sh.fill, a);
      ctx.fill();
    }
    ctx.strokeStyle = outline;
    ctx.lineWidth = sh.kind === "dots" ? 0.007 : 0.01;
    ctx.shadowColor = "rgba(255,230,170,0.28)";
    ctx.shadowBlur = R * 0.012;
    ctx.stroke();
    ctx.restore();
  }

  function hexAlpha(hex, a) {
    const n = hex.replace("#", "");
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function drawMandala(ctx, model, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.46;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(R, R);
    const spin = (t || 0) * 0.015;
    /* faint halo */
    const g = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
    g.addColorStop(0, "rgba(228,195,122,0.07)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 1.05, 0, Math.PI * 2); ctx.fill();

    for (let k = 0; k < model.fold; k++) {
      const rot = k * (Math.PI * 2 / model.fold) + spin * 0;
      for (let i = 0; i < model.shapes.length; i++) {
        drawShape(ctx, model.shapes[i], rot, R, "rgba(228,195,122,0.72)");
      }
    }
    ctx.restore();
  }

  function hit(model, x, y, w, h) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.46;
    const dx = (x - cx) / R, dy = (y - cy) / R;
    const tctx = hit.ctx || (hit.ctx = document.createElement("canvas").getContext("2d"));
    for (let i = model.shapes.length - 1; i >= 0; i--) {
      const sh = model.shapes[i];
      for (let k = 0; k < model.fold; k++) {
        const rot = k * (Math.PI * 2 / model.fold);
        const path = new Path2D();
        wedgePath(path, sh, rot);
        if (tctx.isPointInPath(path, dx, dy)) return sh;
      }
    }
    return null;
  }

  function paint(model, shape, color) {
    if (!shape) return;
    shape.fill = color;
    shape.anim = 0;
  }

  function tickAnims(model, dt) {
    let busy = false;
    for (let i = 0; i < model.shapes.length; i++) {
      const sh = model.shapes[i];
      if (sh.fill && sh.anim < 1) {
        sh.anim = Math.min(1, sh.anim + dt / 280);
        busy = true;
      }
    }
    return busy;
  }

  function allFilled(model) {
    return model.shapes.every(function (s) { return !!s.fill; });
  }

  function loadGallery() {
    try { return JSON.parse(localStorage.getItem("chronos.gallery") || "[]"); } catch (e) { return []; }
  }
  function saveGallery(list) {
    try { localStorage.setItem("chronos.gallery", JSON.stringify(list.slice(0, 8))); } catch (e) {}
  }

  function snapshot(canvas) {
    const out = document.createElement("canvas");
    out.width = 400; out.height = 400;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#080604";
    ctx.fillRect(0, 0, 400, 400);
    ctx.drawImage(canvas, 0, 0, 400, 400);
    return out.toDataURL("image/jpeg", 0.82);
  }

  global.ChronosMandala = {
    PALETTES, generate, drawMandala, hit, paint, tickAnims, allFilled,
    loadGallery, saveGallery, snapshot, rng
  };
})(window);
