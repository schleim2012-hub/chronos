/* Drei Ton-Modi, raumbezogene Betten, Crossfades, Gong. Alles lokal über WebAudio. */
(function (global) {
  const MODES = [
    { id: "off", label: "STILLE", hint: "Nur Berührungsgeräusche" },
    { id: "drone", label: "432 HZ", hint: "Meditative Fläche" },
    { id: "binaural", label: "BINAURAL", hint: "Kopfhörer empfohlen" }
  ];

  let ctx = null, master = null, uiGain = null;
  let bedGain = null, droneGain = null, binGain = null;
  let started = false;
  let mode = 1; // default: drone, unless saved
  let room = "menu";
  let nodes = [];
  let toastTimer = 0;
  let drone = {};
  let binaural = {};

  const ROOMS = {
    menu:     { droneLo: 108, droneMid: 216, droneHi: 432, filter: 420, shimmer: 0.03, beat: 8,  vol: 0.22, color: 0 },
    kalender: { droneLo: 108, droneMid: 216, droneHi: 432, filter: 400, shimmer: 0.035, beat: 7.5, vol: 0.2, color: 0 },
    archiv:   { droneLo: 96,  droneMid: 192, droneHi: 288, filter: 280, shimmer: 0.02, beat: 6,  vol: 0.2, color: 1 },
    rv:       { droneLo: 128, droneMid: 256, droneHi: 512, filter: 560, shimmer: 0.04, beat: 12, vol: 0.2, color: 2 },
    mandala:  { droneLo: 108, droneMid: 216, droneHi: 432, filter: 360, shimmer: 0.055, beat: 7,  vol: 0.22, color: 3 },
    atem:     { droneLo: 108, droneMid: 216, droneHi: 324, filter: 300, shimmer: 0.018, beat: 5,  vol: 0.16, color: 4 },
    traum:    { droneLo: 54,  droneMid: 108, droneHi: 162, filter: 180, shimmer: 0.01, beat: 4,  vol: 0.1, color: 5 },
    fragment: { droneLo: 96,  droneMid: 192, droneHi: 288, filter: 280, shimmer: 0.02, beat: 6,  vol: 0.2, color: 1 }
  };

  function loadMode() {
    try {
      const raw = localStorage.getItem("chronos.sound");
      if (raw === "0" || raw === "1" || raw === "2") return +raw;
      if (localStorage.getItem("chronos.mute") === "1") return 0;
    } catch (e) {}
    return 1;
  }
  function saveMode() {
    try { localStorage.setItem("chronos.sound", String(mode)); } catch (e) {}
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    uiGain = ctx.createGain();
    uiGain.gain.value = 0.7;
    uiGain.connect(master);
    bedGain = ctx.createGain();
    bedGain.gain.value = 0;
    bedGain.connect(master);
    droneGain = ctx.createGain();
    droneGain.gain.value = 1;
    droneGain.connect(bedGain);
    binGain = ctx.createGain();
    binGain.gain.value = 0;
    binGain.connect(bedGain);
    return ctx;
  }

  function ramp(param, value, sec) {
    if (!ctx) return;
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + sec);
  }

  function startBeds() {
    if (!ctx || nodes.length) return;
    const preset = ROOMS.menu;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset.filter;
    filter.Q.value = 0.7;
    filter.connect(droneGain);

    function tone(freq, type, vol) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = vol;
      o.connect(g); g.connect(filter);
      o.start();
      return { o, g };
    }
    drone.lo = tone(preset.droneLo, "sine", 0.55);
    drone.mid = tone(preset.droneMid, "sine", 0.28);
    drone.hi = tone(preset.droneHi, "sine", 0.12);
    drone.filter = filter;

    const shimmerF = ctx.createBiquadFilter();
    shimmerF.type = "highpass"; shimmerF.frequency.value = 600;
    const shimmerG = ctx.createGain(); shimmerG.gain.value = preset.shimmer;
    shimmerF.connect(shimmerG); shimmerG.connect(droneGain);
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine"; shimmer.frequency.value = 528;
    shimmer.connect(shimmerF); shimmer.start();
    const lfo = ctx.createOscillator();
    lfo.type = "sine"; lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 40;
    lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start();
    drone.shimmer = shimmer;
    drone.shimmerG = shimmerG;
    drone.lfo = lfo;

    /* Binaural: zwei Sinus in links/rechts, Beat = Frequenzdifferenz */
    const merger = ctx.createChannelMerger(2);
    merger.connect(binGain);
    function ear(freq, ch) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.22;
      const p = ctx.createStereoPanner();
      p.pan.value = ch < 0.5 ? -1 : 1;
      o.connect(g); g.connect(p); p.connect(binGain);
      o.start();
      return { o, g };
    }
    binaural.base = 200;
    binaural.left = ear(200, 0);
    binaural.right = ear(200 + preset.beat, 1);
    binaural.beat = preset.beat;

    nodes = [filter, shimmer, shimmerF, shimmerG, lfo, lfoG, merger];
    applyMode(true);
  }

  function applyMode(instant) {
    const sec = instant ? 0.05 : 0.9;
    const bedsOn = mode !== 0;
    const binOn = mode === 2;
    if (bedGain) ramp(bedGain.gain, bedsOn ? (ROOMS[room] || ROOMS.menu).vol : 0, sec);
    if (droneGain) ramp(droneGain.gain, binOn ? 0.28 : 1, sec);
    if (binGain) ramp(binGain.gain, binOn ? 1 : 0, sec);
    paintButtons();
  }

  function applyRoom(name, instant) {
    const p = ROOMS[name] || ROOMS.menu;
    room = ROOMS[name] ? name : "menu";
    if (!ctx || !drone.lo) return;
    const sec = instant ? 0.05 : 1.3;
    ramp(drone.lo.o.frequency, p.droneLo, sec);
    ramp(drone.mid.o.frequency, p.droneMid, sec);
    ramp(drone.hi.o.frequency, p.droneHi, sec);
    ramp(drone.filter.frequency, p.filter, sec);
    ramp(drone.shimmerG.gain, p.shimmer, sec);
    if (binaural.right) {
      ramp(binaural.left.o.frequency, 200, sec);
      ramp(binaural.right.o.frequency, 200 + p.beat, sec);
    }
    if (mode !== 0 && bedGain) ramp(bedGain.gain, p.vol, sec);
  }

  function paintButtons() {
    const m = MODES[mode];
    document.querySelectorAll("[data-mute]").forEach((el) => {
      el.classList.toggle("is-muted", mode === 0);
      el.classList.toggle("is-binaural", mode === 2);
      el.setAttribute("aria-pressed", mode === 0 ? "true" : "false");
      el.textContent = m.label;
    });
  }

  function showHint(text) {
    let el = document.getElementById("sound-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "sound-toast";
      el.className = "sound-toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2600);
  }

  function unlock() {
    if (started) {
      if (ctx && ctx.state === "suspended") ctx.resume();
      return;
    }
    mode = loadMode();
    if (!ensure()) return;
    started = true;
    ctx.resume();
    startBeds();
    applyRoom(room, true);
  }

  function cycleMode() {
    unlock();
    mode = (mode + 1) % 3;
    saveMode();
    applyMode(false);
    const m = MODES[mode];
    showHint(m.label + " · " + m.hint);
    return mode;
  }

  function setRoom(name) {
    if (name === room) return;
    applyRoom(name, false);
  }

  function setBedVolumeFactor(f) {
    if (!bedGain || mode === 0) return;
    const p = ROOMS[room] || ROOMS.menu;
    ramp(bedGain.gain, p.vol * f, 0.35);
  }

  function isSilent() { return mode === 0; }
  function getMode() { return mode; }
  function initMuteState() { mode = loadMode(); paintButtons(); }

  function bell(freq, dur, vol) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 1800;
    o.connect(f); f.connect(g); g.connect(uiGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function click() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(uiGain);
    o.start(t); o.stop(t + 0.12);
  }

  function glitch() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(f); f.connect(g); g.connect(uiGain);
    src.start(t);
  }

  function reveal() {
    bell(392, 1.6, 0.12);
    setTimeout(function () { bell(588, 1.8, 0.1); }, 180);
    setTimeout(function () { bell(784, 2.2, 0.08); }, 360);
  }

  function breathCue(kind) {
    if (!ctx) return;
    const map = { in: 432, hold: 324, out: 256, hold2: 324 };
    bell(map[kind] || 324, 0.9, 0.05);
  }

  function gong() {
    if (!ctx) unlock();
    if (!ctx) return;
    const t = ctx.currentTime;
    const partials = [110, 165, 220, 277, 330, 440];
    partials.forEach(function (freq, i) {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sine" : "triangle";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.97, t + 4.5);
      const g = ctx.createGain();
      const vol = 0.16 / (1 + i * 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.8 - i * 0.2);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 2400 - i * 200;
      o.connect(f); f.connect(g); g.connect(uiGain);
      o.start(t); o.stop(t + 5.1);
    });
  }

  /* Rückwärtskompatibel: alter Mute-Name bleibt als Zyklus */
  function toggleMute() { return cycleMode(); }
  function isMuted() { return mode === 0; }

  global.ChronosAudio = {
    unlock, cycleMode, toggleMute, isMuted, isSilent, getMode, initMuteState,
    setRoom, setBedVolumeFactor, click, glitch, bell, reveal, breathCue, gong, MODES
  };
})(window);
