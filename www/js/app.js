(function () {
  const FRAGMENTS = [
    {
      id: "flut",
      code: "F-10500 · SCHICHT 7",
      title: "Die Flut von 10.500 v. Chr.",
      teaser: "Eine Wasserlinie, höher als jeder bekannte Tempel.",
      body: "In den jüngsten Schichten des Archivs taucht immer wieder dieselbe Markierung auf: eine Linie aus Schaum um die Berge. Darunter, so heißt es in den Bruchstücken, lagen die alten Höfe.\n\nEine Nacht lang soll der Himmel gesprungen sein – nicht Regen, sondern ein zweites Meer, das aus dem Norden kam. In unsere Zählung übertragen weist das Datum ins elfte Jahrtausend vor der gewöhnlichen Zeitrechnung.\n\nDie Tafeln nennen keine Könige, nur das Wort für „zurückgeholt vom Wasser“. Ob Erinnerung, Mythos oder Karte, bleibt unentschlüsselt. Dies ist ein Fragment, kein Beweis. Bewahre es als Spur, nicht als Urteil."
    },
    {
      id: "maya",
      code: "M-GLYPH · PALENQUE-REST",
      title: "Die Geheimnisse der Maya",
      teaser: "Zwei Kalender, die sich nach zweiundfünfzig Jahren wieder treffen.",
      body: "Sie maßen den Himmel, als wäre er ein Tempel, und den Tempel, als wäre er ein Himmel. Zwei Zählungen liefen ineinander, bis sich alle Wege nach zweiundfünfzig Sonnenjahren wieder trafen.\n\nZwischen den Zahlen liegen Lücken: Bücher, die brannten, Zeichen, die nur bei bestimmtem Licht lesbar sind, Gänge unter den Stufen. Manche Glyphen scheinen mehr zu tragen, als sie zeigen – als wäre Wissen absichtlich in Rhythmus und Stein gelegt worden, nicht in eine einzige Zeile.\n\nWer hier liest, hält nicht die Wahrheit in der Hand, nur das, was der Stein noch preisgibt. Das Archiv sammelt Spuren. Es behauptet sie nicht."
    },
    {
      id: "zensur",
      code: "D-NULL · NETZ-ABSCHRIFT",
      title: "Die moderne digitale Zensur",
      teaser: "Zeilen, die verschwinden, während man sie liest.",
      body: "Nicht jedes Schweigen ist Staub und Zeit. Manche Zeilen verschwinden, während man sie liest. Türen fallen ins Schloss, Verzeichnisse werden „bereinigt“, Namen fehlen am nächsten Morgen.\n\nDas alte Wissen kannte Feuer und Eroberung. Das neue kennt ein Löschen ohne Asche: still, vollständig, oft ohne dass jemand den Rauch riecht. Darum bewahrt diese Kammer Kopien in der Dunkelheit – nicht als Anklage, sondern als Gedächtnis.\n\nEin Archivar urteilt nicht zuerst. Ein Archivar sorgt dafür, dass die Spur bleibt, auch wenn draußen das Licht gewechselt hat."
    }
  ];

  const TARGETS = [
    { id: "pyramide", file: "img/targets/pyramide.jpg", label: "Eine steinerne Stufenpyramide" },
    { id: "wasserfall", file: "img/targets/wasserfall.jpg", label: "Ein hoher Wasserfall" },
    { id: "leuchtturm", file: "img/targets/leuchtturm.jpg", label: "Ein Leuchtturm an felsiger Küste" },
    { id: "wald", file: "img/targets/wald.jpg", label: "Ein dicht bemooster Wald" },
    { id: "bruecke", file: "img/targets/bruecke.jpg", label: "Eine antike Steinbrücke" },
    { id: "vulkan", file: "img/targets/vulkan.jpg", label: "Ein schneebedeckter Vulkan im Abendlicht" },
    { id: "tempel", file: "img/targets/tempel.jpg", label: "Ein Tempel im Dschungel" },
    { id: "wueste", file: "img/targets/wueste.jpg", label: "Rote Sanddünen in der Wüste" },
    { id: "see", file: "img/targets/see.jpg", label: "Ein türkiser Bergsee" },
    { id: "canyon", file: "img/targets/canyon.jpg", label: "Eine weite Felsschlucht im Abendrot" },
    { id: "statue", file: "img/targets/statue.jpg", label: "Große Steinstatuen in einer Landschaft" },
    { id: "hoehle", file: "img/targets/hoehle.jpg", label: "Eine Meereshöhle mit Basaltsäulen" }
  ];

  const SESSION_MS = 5 * 60 * 1000;
  const state = {
    screen: "seal",
    calDate: new Date(),
    unlocked: loadUnlocked(),
    rv: null,
    intention: loadIntention(),
    intentTarget: null,
    intentAsked: false,
    atem: { running: false, start: 0, cycles: 0, raf: 0 },
    traum: { timer: 0, endAt: 0, start: 0 }
  };

  function loadUnlocked() {
    try { return JSON.parse(localStorage.getItem("chronos.unlocked") || "[]"); } catch (e) { return []; }
  }
  function saveUnlocked() {
    try { localStorage.setItem("chronos.unlocked", JSON.stringify(state.unlocked)); } catch (e) {}
  }
  function loadLog() {
    try { return JSON.parse(localStorage.getItem("chronos.rvlog") || "[]"); } catch (e) { return []; }
  }
  function saveLog(list) {
    try { localStorage.setItem("chronos.rvlog", JSON.stringify(list.slice(0, 20))); } catch (e) {}
  }
  function loadIntention() {
    try {
      const o = JSON.parse(localStorage.getItem("chronos.intention") || "null");
      return (o && o.text) ? String(o.text).slice(0, 90) : "";
    } catch (e) { return ""; }
  }
  function setIntention(text) {
    state.intention = (text || "").trim().slice(0, 90);
    try { localStorage.setItem("chronos.intention", JSON.stringify({ text: state.intention, at: Date.now() })); } catch (e) {}
    paintWatermark();
  }
  function paintWatermark() {
    const el = document.getElementById("watermark");
    if (el) el.textContent = state.intention || "";
  }
  function loadDreams() {
    try { return JSON.parse(localStorage.getItem("chronos.dreams") || "[]"); } catch (e) { return []; }
  }
  function saveDreams(list) {
    try { localStorage.setItem("chronos.dreams", JSON.stringify(list.slice(0, 20))); } catch (e) {}
  }

  function vibrate(ms) {
    try {
      if (window.ChronosNative && ChronosNative.vibrate) ChronosNative.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }

  let current = "seal";
  function activate(el) {
    if (!el) return;
    el.classList.add("is-active");
    el.classList.remove("is-hidden", "is-leave");
  }
  function show(name) {
    if (name === current) {
      onEnter(name);
      return;
    }
    const prev = document.querySelector('.screen[data-screen="' + current + '"]');
    const next = document.querySelector('.screen[data-screen="' + name + '"]');
    if (prev) {
      prev.classList.add("is-leave");
      prev.classList.remove("is-active");
      setTimeout(function () {
        if (prev.getAttribute("data-screen") !== current) {
          prev.classList.add("is-hidden");
          prev.classList.remove("is-leave");
        }
      }, 480);
    }
    activate(next);
    current = name;
    state.screen = name;
    if (window.ChronosAudio) {
      const room = name === "fragment" ? "archiv" : name;
      ChronosAudio.setRoom(room);
    }
    onEnter(name);
  }

  function onEnter(name) {
    if (name === "menu") renderMenu();
    if (name === "kalender") renderCalendar();
    if (name === "archiv") renderArchive();
    if (name === "rv") renderRvIdle();
    if (name === "mandala") enterMandala();
    if (name === "intention") enterIntention();
    if (name === "atem") enterAtem();
    if (name === "traum") enterTraum();
  }

  /* ---------- Siegel / Boot ---------- */
  const BOOT_LINES = [
    { t: 200, s: "> CHRONOS · KERN 0.1" },
    { t: 700, s: "> Prüfung der Siegel ………… " },
    { t: 1150, s: "OK", ok: true, same: true },
    { t: 1500, s: "> Tzolkin-Modul ………… gebunden" },
    { t: 2000, s: "> Archiv-Schacht 3 ………… zugänglich" },
    { t: 2500, s: "> Begrüßung: ARCHIVAR" },
    { t: 3100, s: "> Zugang gewährt." }
  ];

  let bootTimer = [];
  function runBoot() {
    const log = $("boot-log");
    log.innerHTML = "";
    log.classList.add("cursor-blink");
    $("boot-skip").classList.remove("hidden");
    bootTimer.forEach(clearTimeout);
    bootTimer = [];
    BOOT_LINES.forEach(function (line) {
      bootTimer.push(setTimeout(function () {
        const span = document.createElement("span");
        if (line.ok) span.className = "ok";
        span.textContent = (line.same ? "" : (log.textContent ? "\n" : "")) + line.s;
        log.appendChild(span);
        ChronosAudio.glitch();
      }, line.t));
    });
    bootTimer.push(setTimeout(function () {
      log.classList.remove("cursor-blink");
      ChronosAudio.bell(392, 1.4, 0.1);
      vibrate(30);
    }, 3600));
    bootTimer.push(setTimeout(function () { show("menu"); }, 4500));
  }
  function skipBoot() {
    bootTimer.forEach(clearTimeout);
    bootTimer = [];
    show("menu");
  }

  /* ---------- Menü ---------- */
  function paintMenuIcons() {
    const tz = Tzolkin.tzolkinFromDate(new Date());
    const g = $("menu-glyph").getContext("2d");
    g.clearRect(0, 0, 108, 108);
    ChronosGfx.drawGlyph(g, tz.signIndex, 54, 54, 84, { width: 2.2, blur: 6 });

    const a = $("menu-arch").getContext("2d");
    a.clearRect(0, 0, 108, 108);
    a.strokeStyle = "#e4c37a"; a.lineWidth = 1.6; a.strokeRect(28, 24, 52, 64);
    a.beginPath(); a.moveTo(28, 38); a.lineTo(80, 38); a.stroke();
    a.font = "9px Share Tech Mono, monospace"; a.fillStyle = "#e4c37a";
    a.fillText("☰", 48, 62);

    const r = $("menu-rv").getContext("2d");
    r.clearRect(0, 0, 108, 108);
    r.strokeStyle = "#e4c37a"; r.lineWidth = 1.6;
    r.beginPath(); r.arc(54, 54, 28, 0, Math.PI * 2); r.stroke();
    r.beginPath(); r.ellipse(54, 54, 28, 12, 0, 0, Math.PI * 2); r.stroke();
    r.beginPath(); r.arc(54, 54, 6, 0, Math.PI * 2); r.stroke();

    const md = $("menu-mandala");
    if (md) {
      const m = md.getContext("2d");
      m.clearRect(0, 0, 108, 108);
      m.strokeStyle = "#e4c37a"; m.lineWidth = 1.3;
      for (let i = 1; i <= 3; i++) { m.beginPath(); m.arc(54, 54, 8 + i * 9, 0, Math.PI * 2); m.stroke(); }
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        m.beginPath();
        m.moveTo(54 + Math.cos(a) * 12, 54 + Math.sin(a) * 12);
        m.lineTo(54 + Math.cos(a) * 34, 54 + Math.sin(a) * 34);
        m.stroke();
      }
    }

    const at = $("menu-atem");
    if (at) {
      const ac = at.getContext("2d");
      ac.clearRect(0, 0, 108, 108);
      ac.strokeStyle = "#e4c37a"; ac.lineWidth = 1.5;
      ac.beginPath(); ac.arc(54, 54, 26, 0, Math.PI * 2); ac.stroke();
      ac.beginPath(); ac.arc(54, 54, 16, -Math.PI / 2, Math.PI); ac.stroke();
    }
    const tr = $("menu-traum");
    if (tr) {
      const d = tr.getContext("2d");
      d.clearRect(0, 0, 108, 108);
      d.strokeStyle = "#e4c37a"; d.lineWidth = 1.5;
      d.beginPath(); d.arc(54, 48, 22, 0.2 * Math.PI, 1.7 * Math.PI); d.stroke();
      d.beginPath(); d.arc(70, 42, 10, 0, Math.PI * 2); d.stroke();
    }
  }

  function renderMenu() {
    const tz = Tzolkin.tzolkinFromDate(new Date());
    $("menu-today").textContent = "Heute · " + tz.label;
    const n = state.unlocked.length;
    $("menu-foot").textContent = n === 0
      ? "Noch kein Fragment entschlüsselt"
      : "Fragment " + n + "/3 entschlüsselt";
    paintMenuIcons();
  }

  /* ---------- Kalender ---------- */
  let wheelAnim = 0;
  function renderCalendar() {
    const tz = Tzolkin.tzolkinFromDate(state.calDate);
    $("cal-date").textContent = Tzolkin.formatDate(state.calDate);
    $("cal-num").textContent = String(tz.number);
    $("cal-name").textContent = tz.sign.name;
    $("cal-tone").textContent = "Ton " + tz.number + " · " + tz.tone;
    $("cal-meaning").textContent = tz.sign.name + ": " + tz.sign.meaning;
    $("cal-blurb").textContent = tz.sign.text;
    $("cal-kin").textContent = "Kin " + tz.kin + " von 260  ·  GMT 584283";

    const cg = $("cal-glyph");
    const g = cg.getContext("2d");
    g.clearRect(0, 0, cg.width, cg.height);
    ChronosGfx.drawGlyph(g, tz.signIndex, cg.width / 2, cg.height / 2, 280, { width: 5, blur: 16 });

    const bars = $("cal-bars");
    const b = bars.getContext("2d");
    b.clearRect(0, 0, bars.width, bars.height);
    ChronosGfx.drawBarsDots(b, tz.number, bars.width / 2, 16, 1.5);

    if (wheelAnim) cancelAnimationFrame(wheelAnim);
    drawWheelFrame();
  }

  function drawWheelFrame() {
    if (current !== "kalender") { wheelAnim = 0; return; }
    const tz = Tzolkin.tzolkinFromDate(state.calDate);
    ChronosGfx.drawWheel($("cal-wheel"), tz, performance.now() * 0.001);
    wheelAnim = requestAnimationFrame(drawWheelFrame);
  }

  /* ---------- Archiv ---------- */
  function renderArchive() {
    $("arch-progress").textContent = "Fragment " + state.unlocked.length + "/3 entschlüsselt";
    const box = $("arch-files");
    box.innerHTML = "";
    FRAGMENTS.forEach(function (f, i) {
      const open = state.unlocked.indexOf(f.id) !== -1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "file" + (open ? " is-open" : "");
      btn.innerHTML = '<span class="state">' + (open ? "ENTSCHLÜSSELT" : "VERSIEgelt") + "</span>"
        + '<p class="code">' + f.code + "</p><h3>" + f.title + "</h3><p>" + f.teaser + "</p>";
      // typo VERSIEgelt - fix
      btn.querySelector(".state").textContent = open ? "ENTSCHLÜSSELT" : "VERSIEGELT";
      btn.addEventListener("click", function () { openFragment(f); });
      box.appendChild(btn);
    });
  }

  let decodeTimer = 0;
  function openFragment(f) {
    show("fragment");
    $("frag-head").textContent = f.code;
    $("frag-title").textContent = f.title;
    const body = $("frag-body");
    const bar = $("frag-bar").firstElementChild;
    body.className = "frag-body decoding";
    body.textContent = "";
    bar.style.width = "0%";
    ChronosAudio.glitch();
    vibrate(18);

    const target = f.body;
    const glyphs = "ᚠᚢ⌬⎔⏣ motlix●◌⬡▲▴⨁✶⚒⚙⌬01ABCDEFGHKLMNXYZ";
    const total = 42;
    let step = 0;
    clearInterval(decodeTimer);
    decodeTimer = setInterval(function () {
      step++;
      const p = step / total;
      bar.style.width = Math.round(p * 100) + "%";
      const keep = Math.floor(target.length * p);
      let out = target.slice(0, keep);
      const remain = Math.min(40, target.length - keep);
      for (let i = 0; i < remain; i++) {
        const ch = target[keep + i];
        out += (ch === "\n" ? "\n" : glyphs[Math.floor(Math.random() * glyphs.length)]);
      }
      body.textContent = out;
      if (step % 4 === 0) ChronosAudio.glitch();
      if (step >= total) {
        clearInterval(decodeTimer);
        body.className = "frag-body";
        body.textContent = target;
        bar.style.width = "100%";
        ChronosAudio.bell(524, 1.2, 0.09);
        vibrate(28);
        if (state.unlocked.indexOf(f.id) === -1) {
          state.unlocked.push(f.id);
          saveUnlocked();
        }
      }
    }, 55);
  }

  /* ---------- Remote Viewing ---------- */
  function pickTarget() {
    const last = (loadLog()[0] || {}).targetId;
    let pool = TARGETS.filter(function (t) { return t.id !== last; });
    if (!pool.length) pool = TARGETS.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function fmtMs(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }

  function setRvView(which) {
    $("rv-idle").classList.toggle("hidden", which !== "idle");
    $("rv-session").classList.toggle("hidden", which !== "session");
    $("rv-reveal").classList.toggle("hidden", which !== "reveal");
  }

  function renderRvIdle() {
    if (state.rv && state.rv.timer) {
      setRvView("session");
      return;
    }
    setRvView("idle");
    const log = loadLog();
    const box = $("rv-log");
    if (!log.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = "<h3>Sitzungsprotokoll</h3>" + log.map(function (e) {
      const notes = e.notes ? '<p class="notes">„' + escapeHtml(e.notes) + '“</p>' : "";
      const intent = e.intention ? '<p class="notes">Intention: ' + escapeHtml(e.intention) + "</p>" : "";
      return '<div class="log-item"><strong>' + escapeHtml(e.targetLabel) + "</strong> · "
        + escapeHtml(e.when) + " · " + escapeHtml(e.duration)
        + (e.drew ? " · mit Zeichnung" : "") + intent + notes + "</div>";
    }).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function startSession() {
    const rv = {
      target: pickTarget(),
      start: Date.now(),
      endAt: Date.now() + SESSION_MS,
      timer: null,
      ended: false
    };
    state.rv = rv;
    $("rv-notes").value = "";
    clearCanvas();
    setRvView("session");
    $("rv-timer").classList.remove("is-low");
    tickSession();
    rv.timer = setInterval(tickSession, 200);
    ChronosAudio.bell(330, 0.8, 0.08);
    vibrate(20);
  }

  function tickSession() {
    const rv = state.rv;
    if (!rv || rv.ended) return;
    const left = rv.endAt - Date.now();
    $("rv-timer").textContent = fmtMs(left);
    $("rv-timer").classList.toggle("is-low", left < 30000);
    if (left <= 0) revealTarget(false);
  }

  function abortSession() {
    const rv = state.rv;
    if (!rv) return;
    if (rv.timer) clearInterval(rv.timer);
    state.rv = null;
    setRvView("idle");
    renderRvIdle();
    ChronosAudio.click();
  }

  function revealTarget(manual) {
    const rv = state.rv;
    if (!rv || rv.ended) return;
    rv.ended = true;
    if (rv.timer) clearInterval(rv.timer);
    const elapsed = Date.now() - rv.start;
    const notes = ($("rv-notes").value || "").trim();
    const drew = canvasHasInk();
    const entry = {
      targetId: rv.target.id,
      targetLabel: rv.target.label,
      when: Tzolkin.formatDateShort(new Date()) + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      duration: fmtMs(elapsed),
      notes: notes.slice(0, 400),
      drew: !!drew,
      intention: state.intention || ""
    };
    const log = loadLog();
    log.unshift(entry);
    saveLog(log);
    $("rv-image").src = rv.target.file;
    $("rv-caption").textContent = rv.target.label;
    const bits = [];
    if (notes) bits.push("Deine Notizen bleiben im Protokoll.");
    if (drew) bits.push("Die Zeichnung bleibt auf diesem Gerät ungespeichert, die Sitzung ist festgehalten.");
    if (!notes && !drew) bits.push("Auch ein leerer Blick ist ein Blick. Beim nächsten Mal kannst du Spuren hinterlassen.");
    $("rv-compare").textContent = bits.join(" ");
    setRvView("reveal");
    ChronosAudio.reveal();
    vibrate([20, 40, 35]);
    state.rv = null;
  }

  /* drawing */
  const draw = { mode: "pen", drawing: false };
  function drawCtx() {
    const c = $("rv-canvas");
    const ctx = c.getContext("2d");
    return { c, ctx };
  }
  function fitCanvas() {
    const { c, ctx } = drawCtx();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== w * dpr || c.height !== h * dpr) {
      const prev = document.createElement("canvas");
      prev.width = c.width; prev.height = c.height;
      prev.getContext("2d").drawImage(c, 0, 0);
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(prev, 0, 0, c.width, c.height);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function clearCanvas() {
    const { c, ctx } = drawCtx();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 400, h = c.clientHeight || 180;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(8,6,4,0.01)";
    ctx.fillRect(0, 0, w, h);
    c.dataset.ink = "0";
  }
  function canvasHasInk() { return $("rv-canvas").dataset.ink === "1"; }
  function pos(ev, c) {
    const rect = c.getBoundingClientRect();
    const t = ev.touches ? ev.touches[0] : ev;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function startDraw(ev) {
    ev.preventDefault();
    fitCanvas();
    draw.drawing = true;
    const { c, ctx } = drawCtx();
    const p = pos(ev, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = draw.mode === "eraser" ? "rgba(8,6,4,1)" : "#e4c37a";
    ctx.lineWidth = draw.mode === "eraser" ? 16 : 2.2;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (draw.mode === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      c.dataset.ink = "1";
    }
  }
  function moveDraw(ev) {
    if (!draw.drawing) return;
    ev.preventDefault();
    const { c, ctx } = drawCtx();
    const p = pos(ev, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function endDraw() { draw.drawing = false; }

  /* ---------- Intention, Atem, Traum ---------- */
  const NAP_MS = 20 * 60 * 1000;
  const BREATH_PHASES = [
    { id: "in", label: "Einatmen", cue: "in", to: 1 },
    { id: "hold", label: "Halten", cue: "hold", to: 1 },
    { id: "out", label: "Ausatmen", cue: "out", to: 0 },
    { id: "hold2", label: "Halten", cue: "hold2", to: 0 }
  ];

  function requestScreen(name) {
    if (window.ChronosProgress && !ChronosProgress.canEnter(name)) {
      ChronosAudio.glitch();
      vibrate(8);
      return;
    }
    if ((name === "archiv" || name === "rv") && !state.intentAsked) {
      state.intentTarget = name;
      show("intention");
      return;
    }
    show(name);
  }

  function enterIntention() {
    $("intent-field").value = state.intention || "";
  }

  function enterAtem() {
    $("atem-cycles").textContent = "Zyklen: " + state.atem.cycles;
    $("atem-toggle").textContent = state.atem.running ? "Anhalten" : "Beginnen";
    if (!state.atem.running) {
      $("atem-phase").textContent = "Bereit";
      $("atem-sub").textContent = "Berühre Beginnen";
      $("atem-wheel").style.setProperty("--breath", "0.82");
      ChronosGfx.setPulse(0);
    }
  }

  function startAtem() {
    state.atem.running = true;
    state.atem.start = performance.now();
    state.atem._phase = -1;
    $("atem-toggle").textContent = "Anhalten";
    if (state.atem.raf) cancelAnimationFrame(state.atem.raf);
    tickAtem();
  }

  function stopAtem(silent) {
    state.atem.running = false;
    if (state.atem.raf) cancelAnimationFrame(state.atem.raf);
    state.atem.raf = 0;
    ChronosGfx.setPulse(0);
    $("atem-toggle").textContent = "Beginnen";
    $("atem-phase").textContent = "Bereit";
    $("atem-sub").textContent = "Zyklen bisher: " + state.atem.cycles;
    $("atem-wheel").style.setProperty("--breath", "0.82");
    if (!silent) ChronosAudio.click();
  }

  function tickAtem(now) {
    if (!state.atem.running || current !== "atem") return;
    now = now || performance.now();
    const elapsed = now - state.atem.start;
    const phaseLen = 4000;
    const cycleLen = phaseLen * 4;
    const cyclesDone = Math.floor(elapsed / cycleLen);
    if (cyclesDone !== state.atem.cycles) {
      state.atem.cycles = cyclesDone;
      $("atem-cycles").textContent = "Zyklen: " + state.atem.cycles;
    }
    const inCycle = elapsed % cycleLen;
    const idx = Math.min(3, Math.floor(inCycle / phaseLen));
    const ph = BREATH_PHASES[idx];
    const local = (inCycle % phaseLen) / phaseLen;
    const prev = idx === 0 ? 0 : BREATH_PHASES[idx - 1].to;
    const pulse = prev + (ph.to - prev) * easeInOut(local);
    ChronosGfx.setPulse(pulse);
    $("atem-wheel").style.setProperty("--breath", String(0.78 + pulse * 0.34));
    $("atem-phase").textContent = ph.label;
    $("atem-sub").textContent = Math.ceil((1 - local) * 4) + " Sekunden";
    const phaseKey = idx + cyclesDone * 4;
    if (state.atem._phase !== phaseKey) {
      state.atem._phase = phaseKey;
      ChronosAudio.breathCue(ph.cue);
      vibrate(8);
    }
    state.atem.raf = requestAnimationFrame(tickAtem);
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function enterTraum() {
    if (state.traum.timer) setTraumView("nap");
    else setTraumView("idle");
    renderDreamLog();
  }

  function setTraumView(which) {
    $("traum-idle").classList.toggle("hidden", which !== "idle");
    $("traum-nap").classList.toggle("hidden", which !== "nap");
    $("traum-wake").classList.toggle("hidden", which !== "wake");
    document.body.classList.toggle("is-nap", which === "nap");
  }

  function napLock(on) {
    try {
      if (on && navigator.wakeLock) {
        navigator.wakeLock.request("screen").then(function (s) { state.traum.wake = s; }).catch(function () {});
      } else if (!on && state.traum.wake) {
        try { state.traum.wake.release(); } catch (e) {}
        state.traum.wake = null;
      }
    } catch (e) {}
    if (window.ChronosNative) {
      try { if (ChronosNative.keepAwake) ChronosNative.keepAwake(!!on); } catch (e) {}
      try { if (ChronosNative.setDim) ChronosNative.setDim(on ? 0.07 : 1); } catch (e) {}
    }
  }

  function startNap(ms) {
    const dur = ms || NAP_MS;
    state.traum.start = Date.now();
    state.traum.endAt = Date.now() + dur;
    setTraumView("nap");
    napLock(true);
    ChronosAudio.bell(216, 1.2, 0.07);
    tickNap();
    if (state.traum.timer) clearInterval(state.traum.timer);
    state.traum.timer = setInterval(tickNap, 200);
  }

  function tickNap() {
    const left = state.traum.endAt - Date.now();
    $("traum-timer").textContent = fmtMs(left);
    if (left <= 0) wakeNap();
  }

  function abortNap(silent) {
    if (!state.traum.timer && !state.traum.endAt) {
      setTraumView("idle");
      napLock(false);
      return;
    }
    if (state.traum.timer) clearInterval(state.traum.timer);
    state.traum.timer = 0;
    state.traum.endAt = 0;
    napLock(false);
    setTraumView("idle");
    document.body.classList.remove("is-nap");
    if (!silent) ChronosAudio.click();
  }

  function wakeNap() {
    if (state.traum.timer) clearInterval(state.traum.timer);
    state.traum.timer = 0;
    state.traum.endAt = 0;
    napLock(false);
    setTraumView("wake");
    $("traum-notes").value = "";
    ChronosAudio.gong();
    vibrate([40, 80, 40, 80, 60]);
  }

  function saveDream() {
    const text = ($("traum-notes").value || "").trim();
    const list = loadDreams();
    list.unshift({
      when: Tzolkin.formatDateShort(new Date()) + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      text: text.slice(0, 600),
      duration: fmtMs(Date.now() - (state.traum.start || Date.now())),
      intention: state.intention || ""
    });
    saveDreams(list);
    ChronosAudio.bell(392, 1.2, 0.09);
    vibrate(20);
    setTraumView("idle");
    renderDreamLog();
  }

  function renderDreamLog() {
    const box = $("traum-log");
    if (!box) return;
    const list = loadDreams();
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = "<h3>Journal</h3>" + list.map(function (e) {
      const notes = e.text ? '<p class="notes">„' + escapeHtml(e.text) + '“</p>' : "";
      const intent = e.intention ? '<p class="notes">Intention: ' + escapeHtml(e.intention) + "</p>" : "";
      return '<div class="log-item"><strong>' + escapeHtml(e.when) + "</strong> · " + escapeHtml(e.duration) + intent + notes + "</div>";
    }).join("");
  }


  /* ---------- Mandala ---------- */
  const mandala = {
    model: null,
    palette: 0,
    color: "#e4c37a",
    raf: 0,
    warmup: false
  };

  function fitMandala() {
    const c = $("mandala-cv");
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 320, h = c.clientHeight || w;
    if (c.width !== w * dpr || c.height !== h * dpr) {
      c.width = w * dpr; c.height = h * dpr;
    }
    return { c, ctx: c.getContext("2d"), w, h, dpr };
  }

  function paintMandalaFrame() {
    if (current !== "mandala") { mandala.raf = 0; return; }
    const f = fitMandala();
    if (f && mandala.model) {
      f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      ChronosMandala.drawMandala(f.ctx, mandala.model, f.w, f.h);
      if (ChronosMandala.tickAnims(mandala.model, 16)) {
        mandala.raf = requestAnimationFrame(paintMandalaFrame);
        return;
      }
    }
    mandala.raf = 0;
  }

  function newMandala(seed) {
    mandala.model = ChronosMandala.generate(seed || (Date.now() ^ (Math.random() * 0x7fffffff | 0)));
    paintMandalaFrame();
  }

  function renderPalettes() {
    const box = $("mandala-palettes");
    const sw = $("mandala-swatches");
    if (!box || !sw) return;
    box.innerHTML = "";
    ChronosMandala.PALETTES.forEach(function (p, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pal-btn" + (i === mandala.palette ? " is-on" : "");
      b.textContent = p.name;
      b.addEventListener("click", function () {
        mandala.palette = i;
        mandala.color = p.colors[0];
        ChronosAudio.click();
        renderPalettes();
      });
      box.appendChild(b);
    });
    sw.innerHTML = "";
    ChronosMandala.PALETTES[mandala.palette].colors.forEach(function (col) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (col === mandala.color ? " is-on" : "");
      b.style.background = col;
      b.setAttribute("aria-label", col);
      b.addEventListener("click", function () {
        mandala.color = col;
        ChronosAudio.click();
        renderPalettes();
      });
      sw.appendChild(b);
    });
  }

  function renderGallery() {
    const box = $("mandala-gallery");
    if (!box) return;
    const list = ChronosMandala.loadGallery();
    if (!list.length) {
      box.innerHTML = '<span class="empty">Die Galerie ist noch leer.</span>';
      return;
    }
    box.innerHTML = list.map(function (e) {
      return '<img src="' + e.src + '" alt="Mandala vom ' + escapeHtml(e.when) + '">';
    }).join("");
  }

  function enterMandala() {
    renderPalettes();
    renderGallery();
    if (!mandala.model) newMandala();
    else paintMandalaFrame();
  }

  function onMandalaTap(ev) {
    ev.preventDefault();
    const f = fitMandala();
    if (!f || !mandala.model) return;
    const rect = f.c.getBoundingClientRect();
    const t = ev.touches ? ev.touches[0] : ev;
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    const sh = ChronosMandala.hit(mandala.model, x, y, f.w, f.h);
    if (!sh) return;
    ChronosMandala.paint(mandala.model, sh, mandala.color);
    ChronosAudio.click();
    vibrate(14);
    if (mandala.raf) cancelAnimationFrame(mandala.raf);
    paintMandalaFrame();
  }

  function saveMandala() {
    const f = fitMandala();
    if (!f || !mandala.model) return;
    f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    ChronosMandala.drawMandala(f.ctx, mandala.model, f.w, f.h);
    const src = ChronosMandala.snapshot(f.c);
    const list = ChronosMandala.loadGallery();
    list.unshift({
      id: Date.now(),
      src: src,
      seed: mandala.model.seed,
      when: Tzolkin.formatDateShort(new Date())
    });
    ChronosMandala.saveGallery(list);
    renderGallery();
    ChronosAudio.bell(432, 1.1, 0.08);
    vibrate(24);
  }

  /* ---------- Navigation ---------- */
  function goBack() {
    if (current === "fragment") {
      clearInterval(decodeTimer);
      show("archiv");
      return true;
    }
    if (current === "intention") {
      show("menu");
      return true;
    }
    if (current === "kalender" || current === "archiv" || current === "rv" || current === "mandala" || current === "atem" || current === "traum") {
      if (current === "rv" && state.rv && !state.rv.ended) {
        abortSession();
      }
      if (current === "mandala" && mandala.warmup) {
        mandala.warmup = false;
        show("rv");
        return true;
      }
      if (current === "atem") stopAtem(true);
      if (current === "traum") abortNap(true);
      show("menu");
      return true;
    }
    if (current === "boot") {
      skipBoot();
      return true;
    }
    if (current === "menu") return false;
    return false;
  }
  window.goBack = function () { return goBack(); };

  function bind() {
    $("screen-seal").addEventListener("click", function () {
      ChronosAudio.unlock();
      ChronosAudio.click();
      vibrate(25);
      show("boot");
      runBoot();
    });
    $("boot-skip").addEventListener("click", function (e) {
      e.stopPropagation();
      skipBoot();
    });
    document.querySelectorAll("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        ChronosAudio.unlock();
        ChronosAudio.click();
        vibrate(12);
        requestScreen(btn.getAttribute("data-go"));
      });
    });
    $("intent-enter").addEventListener("click", function () {
      setIntention($("intent-field").value);
      state.intentAsked = true;
      ChronosAudio.bell(392, 0.8, 0.08);
      const dest = state.intentTarget || "menu";
      state.intentTarget = null;
      show(dest);
    });
    $("intent-skip").addEventListener("click", function () {
      state.intentAsked = true;
      ChronosAudio.click();
      const dest = state.intentTarget || "menu";
      state.intentTarget = null;
      show(dest);
    });
    $("atem-toggle").addEventListener("click", function () {
      if (state.atem.running) stopAtem(false);
      else startAtem();
    });
    $("traum-start").addEventListener("click", function () { startNap(); });
    $("traum-abort").addEventListener("click", function () { abortNap(false); });
    $("traum-save").addEventListener("click", saveDream);
    document.querySelectorAll("[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        ChronosAudio.click();
        goBack();
      });
    });
    document.querySelectorAll("[data-mute]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        ChronosAudio.unlock();
        ChronosAudio.toggleMute();
      });
    });
    $("cal-prev").addEventListener("click", function () {
      state.calDate = Tzolkin.addDays(state.calDate, -1);
      ChronosAudio.click();
      vibrate(8);
      renderCalendar();
    });
    $("cal-next").addEventListener("click", function () {
      state.calDate = Tzolkin.addDays(state.calDate, 1);
      ChronosAudio.click();
      vibrate(8);
      renderCalendar();
    });
    $("cal-today").addEventListener("click", function () {
      state.calDate = new Date();
      ChronosAudio.click();
      renderCalendar();
    });
    $("rv-start").addEventListener("click", startSession);
    $("rv-warmup").addEventListener("click", function () {
      mandala.warmup = true;
      ChronosAudio.click();
      show("mandala");
    });
    $("mandala-new").addEventListener("click", function () {
      ChronosAudio.click();
      vibrate(10);
      newMandala();
    });
    $("mandala-save").addEventListener("click", saveMandala);
    $("mandala-cv").addEventListener("pointerdown", onMandalaTap);
    $("mandala-cv").addEventListener("touchstart", onMandalaTap, { passive: false });
    $("rv-abort").addEventListener("click", abortSession);
    $("rv-end").addEventListener("click", function () { revealTarget(true); });
    $("rv-again").addEventListener("click", function () {
      setRvView("idle");
      startSession();
    });
    $("rv-pen").addEventListener("click", function () { draw.mode = "pen"; ChronosAudio.click(); });
    $("rv-eraser").addEventListener("click", function () { draw.mode = "eraser"; ChronosAudio.click(); });
    $("rv-clear").addEventListener("click", function () { clearCanvas(); ChronosAudio.click(); });
    const cv = $("rv-canvas");
    cv.addEventListener("pointerdown", startDraw);
    cv.addEventListener("pointermove", moveDraw);
    window.addEventListener("pointerup", endDraw);
    cv.addEventListener("touchstart", startDraw, { passive: false });
    cv.addEventListener("touchmove", moveDraw, { passive: false });
    cv.addEventListener("touchend", endDraw);
  }

  function init() {
    const ok = Tzolkin.selfTest();
    if (!ok) console.warn("Tzolkin-Prüfung fehlgeschlagen");
    ChronosGfx.startBackground($("bg"));
    ChronosAudio.initMuteState();
    paintWatermark();
    document.getElementById("screen-seal").classList.add("is-active");
    bind();
    paintMenuIcons();
  }

  window.ChronosOpen = {
    setCalDate: function (y, m, d) {
      state.calDate = new Date(y, m - 1, d);
      if (current === "kalender") renderCalendar();
    },
    skipTo: function (name) {
      ChronosAudio.unlock();
      show(name);
    },
    unlocked: function () { return state.unlocked.slice(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
