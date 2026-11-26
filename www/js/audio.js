/* Prozedurales Ambient und UI-Klänge. Kein externes Audio nötig. */
(function (global) {
  let ctx = null, master = null, ambientGain = null, uiGain = null;
  let nodes = [];
  let started = false;
  let muted = false;
  let tickTimer = null;

  function loadMute() {
    try { return localStorage.getItem("chronos.mute") === "1"; } catch (e) { return false; }
  }
  function saveMute() {
    try { localStorage.setItem("chronos.mute", muted ? "1" : "0"); } catch (e) {}
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.0;
    ambientGain.connect(master);
    uiGain = ctx.createGain();
    uiGain.gain.value = 0.7;
    uiGain.connect(master);
    return ctx;
  }

  function osc(type, freq, dest) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    return o;
  }

  function startAmbient() {
    if (!ctx || nodes.length) return;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    filter.Q.value = 0.7;
    filter.connect(ambientGain);

    const o1 = osc("sine", 55, filter);
    const o2 = osc("sine", 82.5, filter);
    const o3 = osc("triangle", 110, filter);
    const g3 = ctx.createGain(); g3.gain.value = 0.15;
    // reconnect o3 through quieter gain
    o3.disconnect(); o3.connect(g3); g3.connect(filter);

    const lfo = osc("sine", 0.07, ctx.createGain());
    const lfoG = ctx.createGain(); lfoG.gain.value = 40;
    lfo.disconnect();
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);

    const high = ctx.createBiquadFilter();
    high.type = "highpass"; high.frequency.value = 600;
    const highG = ctx.createGain(); highG.gain.value = 0.04;
    high.connect(highG); highG.connect(ambientGain);
    const shimmer = osc("sine", 528, high);

    const lfo2 = ctx.createOscillator();
    lfo2.type = "sine"; lfo2.frequency.value = 0.13;
    const lfo2g = ctx.createGain(); lfo2g.gain.value = 0.025;
    lfo2.connect(lfo2g); lfo2g.connect(highG.gain);

    [o1, o2, o3, lfo, shimmer, lfo2].forEach((o) => o.start());
    nodes = [o1, o2, o3, lfo, shimmer, lfo2, filter, g3, lfoG, high, highG, lfo2g];

    const now = ctx.currentTime;
    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.linearRampToValueAtTime(0.22, now + 2.4);
  }

  function bell(freq, dur, vol) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
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
    if (!ctx || muted) return;
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
    if (!ctx || muted) return;
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
    setTimeout(() => bell(588, 1.8, 0.1), 180);
    setTimeout(() => bell(784, 2.2, 0.08), 360);
  }

  function unlock() {
    if (started) {
      if (ctx && ctx.state === "suspended") ctx.resume();
      return;
    }
    muted = loadMute();
    if (!ensure()) return;
    started = true;
    ctx.resume();
    startAmbient();
    applyMute();
  }

  function applyMute() {
    if (master && ctx) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.15);
    }
    saveMute();
    document.querySelectorAll("[data-mute]").forEach((el) => {
      el.classList.toggle("is-muted", muted);
      el.setAttribute("aria-pressed", muted ? "true" : "false");
      el.textContent = muted ? "TON AUS" : "TON";
    });
  }

  function toggleMute() {
    muted = !muted;
    unlock();
    applyMute();
    return muted;
  }

  function isMuted() { return muted; }
  function initMuteState() { muted = loadMute(); applyMute(); }

  global.ChronosAudio = {
    unlock, toggleMute, isMuted, initMuteState, click, glitch, bell, reveal
  };
})(window);
