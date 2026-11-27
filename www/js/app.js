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
    rv: null
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
      return '<div class="log-item"><strong>' + escapeHtml(e.targetLabel) + "</strong> · "
        + escapeHtml(e.when) + " · " + escapeHtml(e.duration)
        + (e.drew ? " · mit Zeichnung" : "") + notes + "</div>";
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
      drew: !!drew
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

  /* ---------- Navigation ---------- */
  function goBack() {
    if (current === "fragment") {
      clearInterval(decodeTimer);
      show("archiv");
      return true;
    }
    if (current === "kalender" || current === "archiv" || current === "rv") {
      if (current === "rv" && state.rv && !state.rv.ended) {
        // stay in session; back goes to menu after abort confirm? just go menu and keep? Better abort prompt.
        // For prototype: going back aborts silently? Let's go to menu only from idle/reveal; from session treat as abort.
        abortSession();
      }
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
        show(btn.getAttribute("data-go"));
      });
    });
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
