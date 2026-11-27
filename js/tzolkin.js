/* Tzolkin-Berechnung, GMT-Korrelation 584283.
   11. August 3114 v. Chr. (proleptisch gregorianisch) = 4 Ajaw = JDN 584283.
   Geprüft: 21.12.2012 = 4 Ajaw; 27.11.2026 = 10 Muluk. */
(function (global) {
  const GMT = 584283;

  const SIGNS = [
    { id: "imix", name: "Imix", meaning: "Energie der Quelle",
      text: "Der erste Atem des Wassers. Ein guter Tag, etwas zu beginnen, das lange leben soll." },
    { id: "ik", name: "Ik'", meaning: "Energie des Windes",
      text: "Atem, Stimme, Bewegung. Was festgehalten wird, darf heute weiterziehen." },
    { id: "akbal", name: "Ak'b'al", meaning: "Energie der Nacht",
      text: "Das innere Haus. In der Dunkelheit reifen die Bilder, bevor sie ans Licht treten." },
    { id: "kan", name: "K'an", meaning: "Energie der Reife",
      text: "Samen und Fülle. Was du gepflegt hast, darf heute sichtbar werden." },
    { id: "chikchan", name: "Chikchan", meaning: "Energie der Lebensschlange",
      text: "Kraft, die sich hebt. Ein Tag, um Mut und Lebenssaft nicht zu drosseln." },
    { id: "kimi", name: "Kimi", meaning: "Energie des Wandels",
      text: "Abschluss und Übergang. Was endet, macht dem nächsten Atem Platz." },
    { id: "manik", name: "Manik'", meaning: "Energie der Hand",
      text: "Gabe und Werk. Heute zählt, was du berührst und weitergibst." },
    { id: "lamat", name: "Lamat", meaning: "Energie des Sterns",
      text: "Venuslicht, Harmonien. Ein Tag für Wachstum, das nach außen strahlt." },
    { id: "muluk", name: "Muluk", meaning: "Energie des Wassers",
      text: "Jade, Opfer, Fluss. Gefühle klären sich, wenn du sie fließen lässt." },
    { id: "ok", name: "Ok", meaning: "Energie des Weges",
      text: "Treue Begleitung. Folge der Spur, die schon unter deinen Füßen leuchtet." },
    { id: "chuwen", name: "Chuwen", meaning: "Energie des Spiels",
      text: "Kunst, Witz, Webkunst. Heute darf der Ernst lockerer gewoben sein." },
    { id: "eb", name: "Eb'", meaning: "Energie der Schwelle",
      text: "Der Pfad, die Treppe. Jeder Schritt ist schon ein Ankommen." },
    { id: "ben", name: "B'en", meaning: "Energie des Schilfs",
      text: "Wachstum nach oben. Standhaft bleiben, ohne hart zu werden." },
    { id: "ix", name: "Ix", meaning: "Energie der Erde",
      text: "Jaguarherz, Magie des Stillen. Höre, was unter der Oberfläche atmet." },
    { id: "men", name: "Men", meaning: "Energie des Adlers",
      text: "Weitblick. Steige auf, um das Ganze zu sehen, nicht nur den Stein vor dir." },
    { id: "kib", name: "K'ib'", meaning: "Energie der Klärung",
      text: "Wachs und Vergeben. Altes loslassen, damit neues Licht haften kann." },
    { id: "kaban", name: "Kab'an", meaning: "Energie der Bewegung",
      text: "Erde, die denkt. Ein Tag für klare Gedanken und entschlossene Schritte." },
    { id: "etznab", name: "Etz'nab'", meaning: "Energie des Feuersteins",
      text: "Schnitt und Spiegel. Die Wahrheit ist scharf – führe sie behutsam." },
    { id: "kawak", name: "Kawak", meaning: "Energie des Sturms",
      text: "Regen, Donner, Reinigung. Was sich aufgestaut hat, darf heute niedergehen." },
    { id: "ajaw", name: "Ajaw", meaning: "Energie der Sonne",
      text: "Licht, Blüte, Herrschaft über sich selbst. Ein Tag, um zu strahlen ohne zu blenden." }
  ];

  const TONES = [
    "", "Anfang", "Atem", "Rhythmus", "Form", "Mitte", "Spiegel",
    "Geheimnis", "Harmonie", "Geduld", "Offenbarung", "Prüfung", "Kristall", "Vollendung"
  ];

  const MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];
  const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  // Fliegel/Van Flandern – JDN für ein gregorianisches (auch proleptisches) Datum, Mittag.
  function jdnFromYmd(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const y2 = y + 4800 - a;
    const m2 = m + 12 * a - 3;
    return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4)
      - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  }

  function ymdFromDate(date) {
    return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
  }

  function dateFromYmd(y, m, d) {
    return new Date(y, m - 1, d);
  }

  function addDays(date, n) {
    const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function tzolkinFromJdn(jdn) {
    const days = jdn - GMT;
    const number = ((3 + days) % 13 + 13) % 13 + 1;
    const signIndex = ((19 + days) % 20 + 20) % 20;
    const sign = SIGNS[signIndex];
    // Kin 1 = 1 Imix. 4 Ajaw ist Kin 160.
    const k = ((days + 159) % 260 + 260) % 260; // 0..259, 4 Ajaw -> 159
    const kin = k + 1;
    return {
      jdn, days, number, signIndex, sign, kin,
      tone: TONES[number],
      label: number + " " + sign.name
    };
  }

  function tzolkinFromDate(date) {
    const { y, m, d } = ymdFromDate(date);
    return Object.assign(tzolkinFromYmd(y, m, d), { y, m, d, date: dateFromYmd(y, m, d) });
  }

  function tzolkinFromYmd(y, m, d) {
    const jdn = jdnFromYmd(y, m, d);
    return Object.assign(tzolkinFromJdn(jdn), { y, m, d, date: dateFromYmd(y, m, d) });
  }

  function formatDate(date) {
    return WEEKDAYS[date.getDay()] + ", " + date.getDate() + ". " + MONTHS[date.getMonth()] + " " + date.getFullYear();
  }

  function formatDateShort(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return dd + "." + mm + "." + date.getFullYear();
  }

  // Selbsttest der Korrelation, wird beim Start ausgeführt.
  function selfTest() {
    const a = tzolkinFromYmd(2012, 12, 21);
    const b = tzolkinFromYmd(2026, 11, 27);
    const okA = a.number === 4 && a.sign.id === "ajaw";
    const okB = b.number === 10 && b.sign.id === "muluk";
    if (!okA || !okB) {
      console.error("Tzolkin-Selbsttest fehlgeschlagen", a, b);
      return false;
    }
    return true;
  }

  global.Tzolkin = {
    GMT, SIGNS, TONES, jdnFromYmd, tzolkinFromJdn, tzolkinFromDate, tzolkinFromYmd,
    addDays, formatDate, formatDateShort, selfTest, ymdFromDate
  };
})(window);
