/* Stufen durch Praxis, kein Punktesystem. */
(function (global) {
  const NAMES = { 1: "Initiat", 2: "Seher", 3: "Archivar" };
  let listeners = [];

  function loadDays() {
    try { return JSON.parse(localStorage.getItem("chronos.days") || "[]"); } catch (e) { return []; }
  }
  function saveDays(d) {
    try { localStorage.setItem("chronos.days", JSON.stringify(d)); } catch (e) {}
  }
  function todayKey() {
    const x = new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function rvCount() {
    try {
      const log = JSON.parse(localStorage.getItem("chronos.rvlog") || "[]");
      return Array.isArray(log) ? log.length : 0;
    } catch (e) { return 0; }
  }
  function dayCount() { return loadDays().length; }
  function isTest() {
    try { return localStorage.getItem("chronos.testunlock") === "1"; } catch (e) { return false; }
  }
  function setTest(on) {
    try { localStorage.setItem("chronos.testunlock", on ? "1" : "0"); } catch (e) {}
  }

  function stage() {
    if (isTest()) return 3;
    if (dayCount() >= 7) return 3;
    if (rvCount() >= 3) return 2;
    return 1;
  }

  function recordVisit() {
    const days = loadDays();
    const k = todayKey();
    if (days.indexOf(k) === -1) {
      days.push(k);
      saveDays(days);
    }
    return maybePromote();
  }

  function maybePromote() {
    const now = stage();
    let prev = 1;
    try { prev = parseInt(localStorage.getItem("chronos.stageSeen") || "1", 10) || 1; } catch (e) {}
    if (now > prev) {
      try { localStorage.setItem("chronos.stageSeen", String(now)); } catch (e) {}
      listeners.forEach(function (fn) { try { fn(now, prev); } catch (e) {} });
      return { promoted: true, from: prev, to: now };
    }
    try { localStorage.setItem("chronos.stageSeen", String(Math.max(prev, now))); } catch (e) {}
    return { promoted: false, from: prev, to: now };
  }

  function canEnter(name) {
    const s = stage();
    if (name === "atem") return s >= 2;
    if (name === "traum") return s >= 3;
    return true;
  }

  function canOpenFragment(index) {
    if (index === 0) return true;
    return stage() >= 3;
  }

  function lockHint(name) {
    const s = stage();
    if (name === "atem" && s < 2) {
      const left = Math.max(0, 3 - rvCount());
      return "Versiegelt · noch " + left + " Remote-Viewing-Sitzung" + (left === 1 ? "" : "en") + " bis zur Stufe Seher";
    }
    if (name === "traum" && s < 3) {
      const left = Math.max(0, 7 - dayCount());
      return "Versiegelt · noch " + left + " Nutzungstag" + (left === 1 ? "" : "e") + " bis zur Stufe Archivar";
    }
    if (name === "archiv-more" && s < 3) {
      const left = Math.max(0, 7 - dayCount());
      return "Ab Stufe Archivar · noch " + left + " Nutzungstag" + (left === 1 ? "" : "e");
    }
    return "";
  }

  function onPromote(fn) { listeners.push(fn); }

  function unlockAll(on) {
    setTest(!!on);
    if (on) {
      try { localStorage.setItem("chronos.stageSeen", "3"); } catch (e) {}
    }
    return stage();
  }

  function label(s) { s = s || stage(); return "Stufe " + s + " · " + (NAMES[s] || ""); }

  global.ChronosProgress = {
    NAMES, stage, label, recordVisit, maybePromote, canEnter, canOpenFragment,
    lockHint, rvCount, dayCount, isTest, unlockAll, onPromote, todayKey
  };
})(window);
