#!/usr/bin/env python3
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("CHRONOS_URL", "http://127.0.0.1:8765/index.html")
SHOTS = Path("/workspace/chronos/shots/v11")
SHOTS.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

def shot(page, name):
    page.screenshot(path=str(SHOTS / name), full_page=False)

def skip_intro(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(500)
    page.tap("#screen-seal")
    page.wait_for_selector("#screen-menu:not(.is-hidden)", timeout=8000)
    page.wait_for_timeout(400)

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME, headless=True,
        args=["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
    )
    context = browser.new_context(
        viewport={"width": 412, "height": 915},
        device_scale_factor=2.5,
        is_mobile=True, has_touch=True,
        locale="de-DE", timezone_id="Europe/Berlin", color_scheme="dark",
    )
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)) or print("PAGEERROR", e))
    page.on("console", lambda m: print("CONSOLE", m.type, m.text) if m.type == "error" else None)

    skip_intro(page)
    shot(page, "01-menue-initiat.png")

    today = page.evaluate("""() => {
      const t = Tzolkin.tzolkinFromDate(new Date());
      return { label: t.label, ok2012: Tzolkin.selfTest(), stage: ChronosProgress.stage() };
    }""")
    print("TODAY", json.dumps(today, ensure_ascii=False))
    if not today["ok2012"]:
        errors.append("Tzolkin-Selbsttest fehlgeschlagen")
    if today["stage"] != 1:
        errors.append("Startstufe sollte 1 sein, ist %s" % today["stage"])

    fx = page.evaluate("() => { const c = document.getElementById('fx'); return !!(c && c.getContext('2d') && c.width > 0); }")
    print("FX_CANVAS", fx)
    if not fx:
        errors.append("Partikel-Canvas fehlt")

    # parallax fallback via pointer
    page.mouse.move(40, 200)
    page.wait_for_timeout(200)
    page.mouse.move(370, 700)
    page.wait_for_timeout(200)
    shot(page, "02-menue-parallax.png")

    # sound cycle
    labels = []
    for i in range(3):
        page.locator("#screen-menu [data-mute]").tap()
        page.wait_for_timeout(400)
        labels.append(page.locator("#screen-menu [data-mute]").inner_text())
    print("SOUND_CYCLE", labels)
    if "BINAURAL" not in labels or "STILLE" not in labels or "432 HZ" not in labels:
        errors.append("Ton-Modi unvollständig: %s" % labels)
    shot(page, "03-ton-hinweis.png")

    # calendar still works
    page.locator("#screen-menu [data-go=kalender]").tap()
    page.wait_for_timeout(700)
    shot(page, "04-kalender.png")
    cal = page.evaluate("""() => ({
      num: document.getElementById('cal-num').textContent,
      name: document.getElementById('cal-name').textContent
    })""")
    print("CAL", cal)
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)

    # intention + archive: only first text free
    page.locator("#screen-menu [data-go=archiv]").tap()
    page.wait_for_timeout(500)
    shot(page, "05-intention.png")
    intend = page.evaluate("() => document.querySelector('.screen.is-active').getAttribute('data-screen')")
    print("AFTER_ARCHIV_TAP", intend)
    if intend != "intention":
        errors.append("Intention-Screen fehlte vor dem Archiv, war: %s" % intend)
    page.fill("#intent-field", "Die Spur hinter dem Stein")
    page.locator("#intent-enter").tap()
    page.wait_for_timeout(600)
    shot(page, "06-archiv-versiegelt.png")
    locked = page.evaluate("() => document.querySelectorAll('#arch-files .file.is-locked').length")
    print("ARCHIV_LOCKED", locked)
    if locked != 2:
        errors.append("Es sollten 2 Archivtexte versiegelt sein, sind %s" % locked)
    page.locator("#arch-files .file").first.tap()
    page.wait_for_timeout(3200)
    shot(page, "07-fragment.png")
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(400)
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)

    # locked atem
    page.locator("#card-atem").tap()
    page.wait_for_timeout(400)
    still_menu = page.evaluate("() => document.querySelector('.screen.is-active').getAttribute('data-screen')")
    print("ATEM_LOCKED_STAYS", still_menu)
    if still_menu != "menu":
        errors.append("Atem sollte auf Stufe 1 versiegelt bleiben")
    shot(page, "08-menue-atem-versiegelt.png")

    # mandala
    page.locator("#screen-menu [data-go=mandala]").tap()
    page.wait_for_timeout(700)
    shot(page, "09-mandala.png")
    # tap center and a few points
    box = page.locator("#mandala-cv").bounding_box()
    if box:
        cx, cy = box["x"] + box["width"]/2, box["y"] + box["height"]/2
        for dx, dy in ((0, 0), (40, 0), (0, 60), (-50, 40), (70, -30)):
            page.mouse.click(cx + dx, cy + dy)
            page.wait_for_timeout(150)
    shot(page, "10-mandala-color.png")
    page.locator("#mandala-save").tap()
    page.wait_for_timeout(400)
    gall = page.evaluate("() => document.querySelectorAll('#mandala-gallery img').length")
    print("GALLERY", gall)
    if gall < 1:
        errors.append("Mandala wurde nicht in der Galerie gespeichert")
    page.locator("#mandala-new").tap()
    page.wait_for_timeout(300)
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)

    # RV session (intention already asked)
    page.locator("#screen-menu [data-go=rv]").tap()
    page.wait_for_timeout(500)
    shot(page, "11-rv.png")
    page.locator("#rv-warmup").tap()
    page.wait_for_timeout(500)
    warm = page.evaluate("() => document.querySelector('.screen.is-active').getAttribute('data-screen')")
    print("WARMUP", warm)
    if warm != "mandala":
        errors.append("RV-Aufwärmung führte nicht zum Mandala")
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)
    # should return to RV
    back = page.evaluate("() => document.querySelector('.screen.is-active').getAttribute('data-screen')")
    print("WARMUP_BACK", back)
    page.locator("#rv-start").tap()
    page.wait_for_timeout(300)
    page.fill("#rv-notes", "Gold, Stein, Höhe.")
    page.locator("#rv-end").tap()
    page.wait_for_timeout(700)
    shot(page, "12-rv-ziel.png")
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)

    # options + hidden switch
    page.locator("#screen-menu [data-go=optionen]").tap()
    page.wait_for_timeout(500)
    shot(page, "13-optionen.png")
    hidden = page.evaluate("() => document.getElementById('opt-test').classList.contains('hidden')")
    print("SECRET_HIDDEN", hidden)
    if not hidden:
        errors.append("Test-Schalter war nicht versteckt")
    # long press version
    page.locator("#opt-version").hover()
    page.mouse.down()
    page.wait_for_timeout(2200)
    page.mouse.up()
    page.wait_for_timeout(300)
    hidden2 = page.evaluate("() => document.getElementById('opt-test').classList.contains('hidden')")
    print("SECRET_AFTER_HOLD", hidden2)
    if hidden2:
        errors.append("Langes Drücken auf die Version hat den Schalter nicht gezeigt")
    shot(page, "14-optionen-schalter.png")
    page.locator("#opt-unlock").tap()
    page.wait_for_timeout(800)
    shot(page, "15-freischaltung.png")
    st = page.evaluate("() => ChronosProgress.stage()")
    print("STAGE_AFTER_UNLOCK", st)
    if st != 3:
        errors.append("Test-Freischaltung erreichte nicht Stufe 3")
    page.wait_for_timeout(2500)
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)
    shot(page, "16-menue-archivar.png")

    # atem now free
    page.locator("#card-atem").tap()
    page.wait_for_timeout(600)
    atem = page.evaluate("() => document.querySelector('.screen.is-active').getAttribute('data-screen')")
    print("ATEM", atem)
    if atem != "atem":
        errors.append("Atem nach Freischaltung nicht offen")
    page.locator("#atem-toggle").tap()
    page.wait_for_timeout(1200)
    shot(page, "17-atem.png")
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(500)

    # traum + short nap
    page.locator("#card-traum").tap()
    page.wait_for_timeout(500)
    shot(page, "18-traum.png")
    page.evaluate("() => ChronosOpen.startNap(900)")
    page.wait_for_timeout(400)
    shot(page, "19-traum-nap.png")
    page.wait_for_timeout(1200)
    wake = page.evaluate("() => document.querySelector('.screen.is-active #traum-wake') && !document.getElementById('traum-wake').classList.contains('hidden')")
    print("NAP_WAKE", wake)
    if not wake:
        errors.append("Gong/Aufwachen nach kurzem Nap ausgeblieben")
    shot(page, "20-traum-journal.png")
    page.fill("#traum-notes", "Ein goldenes Tor am Wasser.")
    page.locator("#traum-save").tap()
    page.wait_for_timeout(400)

    # archive now all open
    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(400)
    page.locator("#screen-menu [data-go=archiv]").tap()
    page.wait_for_timeout(500)
    locked2 = page.evaluate("() => document.querySelectorAll('#arch-files .file.is-locked').length")
    print("ARCHIV_UNLOCKED_LOCKEDCOUNT", locked2)
    if locked2 != 0:
        errors.append("Nach Stufe 3 sollten keine Archivtexte mehr versiegelt sein")
    shot(page, "21-archiv-offen.png")

    watermark = page.evaluate("() => document.getElementById('watermark').textContent")
    print("WATERMARK", watermark)
    if "Stein" not in (watermark or ""):
        errors.append("Wasserzeichen zeigt die Intention nicht")

    if errors:
        print("ERRORS", errors)
        raise SystemExit("; ".join(errors))
    print("ALL_OK")
    browser.close()
