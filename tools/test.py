#!/usr/bin/env python3
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("CHRONOS_URL", "http://127.0.0.1:8765/index.html")
SHOTS = Path("/workspace/chronos/shots")
SHOTS.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

def shot(page, name):
    page.screenshot(path=str(SHOTS / name), full_page=False)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME,
        headless=True,
        args=["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
    )
    context = browser.new_context(
        viewport={"width": 412, "height": 915},
        device_scale_factor=2.5,
        is_mobile=True,
        has_touch=True,
        locale="de-DE",
        timezone_id="Europe/Berlin",
        color_scheme="dark",
    )
    page = context.new_page()
    page.on("pageerror", lambda e: print("PAGEERROR", e))
    page.on("console", lambda m: print("CONSOLE", m.type, m.text) if m.type == "error" else None)

    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    shot(page, "01-siegel.png")

    page.tap("#screen-seal")
    page.wait_for_timeout(900)
    shot(page, "02-boot.png")
    page.wait_for_selector("#screen-menu:not(.is-hidden)", timeout=8000)
    page.wait_for_timeout(500)
    shot(page, "03-menue.png")

    today = page.evaluate("""() => {
      const t = Tzolkin.tzolkinFromDate(new Date());
      return { label: t.label, kin: t.kin, sign: t.sign.name, number: t.number, date: Tzolkin.formatDate(new Date()) };
    }""")
    print("TODAY", json.dumps(today, ensure_ascii=False))

    check2012 = page.evaluate("""() => {
      const t = Tzolkin.tzolkinFromYmd(2012, 12, 21);
      return { label: t.label, ok: t.number === 4 && t.sign.id === 'ajaw', jdn: t.jdn };
    }""")
    print("2012-12-21", json.dumps(check2012, ensure_ascii=False))

    checkToday = page.evaluate("""() => {
      const t = Tzolkin.tzolkinFromYmd(2026, 11, 27);
      return { label: t.label, ok: t.number === 10 && t.sign.id === 'muluk', jdn: t.jdn, kin: t.kin };
    }""")
    print("2026-11-27", json.dumps(checkToday, ensure_ascii=False))

    self_ok = page.evaluate("() => Tzolkin.selfTest()")
    print("SELFTEST", self_ok)

    page.locator("#screen-menu [data-go=kalender]").tap()
    page.wait_for_timeout(800)
    shot(page, "04-kalender-heute.png")

    shown = page.evaluate("""() => ({
      num: document.getElementById('cal-num').textContent,
      name: document.getElementById('cal-name').textContent,
      meaning: document.getElementById('cal-meaning').textContent
    })""")
    print("CAL_SHOWN", json.dumps(shown, ensure_ascii=False))

    page.evaluate("() => ChronosOpen.setCalDate(2012, 12, 21)")
    page.wait_for_timeout(400)
    shot(page, "05-kalender-2012.png")
    shown2012 = page.evaluate("""() => ({
      num: document.getElementById('cal-num').textContent,
      name: document.getElementById('cal-name').textContent,
      date: document.getElementById('cal-date').textContent
    })""")
    print("CAL_2012", json.dumps(shown2012, ensure_ascii=False))

    page.evaluate("() => ChronosOpen.setCalDate(2026, 11, 27)")
    page.wait_for_timeout(200)
    page.tap("#cal-next")
    page.wait_for_timeout(300)
    next_day = page.evaluate("() => document.getElementById('cal-num').textContent + ' ' + document.getElementById('cal-name').textContent")
    print("NEXT_AFTER_27", next_day)
    page.tap("#cal-today")
    page.wait_for_timeout(250)

    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(550)
    page.locator(".screen.is-active [data-go=archiv], #screen-menu [data-go=archiv]").first.tap()
    page.wait_for_timeout(550)
    shot(page, "06-archiv.png")

    page.locator("#arch-files .file").first.tap()
    page.wait_for_timeout(800)
    shot(page, "07-fragment-decode.png")
    page.wait_for_timeout(2800)
    shot(page, "08-fragment-offen.png")

    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(550)
    shot(page, "09-archiv-fortschritt.png")

    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(450)
    page.locator("#screen-menu [data-go=rv]").tap()
    page.wait_for_timeout(550)
    shot(page, "10-rv-start.png")

    page.tap("#rv-start")
    page.wait_for_timeout(400)
    page.fill("#rv-notes", "Goldenes Licht, viel Stein, ein Gefühl von Höhe.")
    shot(page, "11-rv-session.png")

    page.tap("#rv-end")
    page.wait_for_timeout(800)
    shot(page, "12-rv-ziel.png")

    page.locator(".screen.is-active [data-back]").tap()
    page.wait_for_timeout(450)
    shot(page, "13-menue-danach.png")

    page.locator("#screen-menu [data-go=rv]").tap()
    page.wait_for_timeout(400)
    page.tap("#rv-start")
    page.wait_for_timeout(200)
    page.tap("#rv-abort")
    page.wait_for_timeout(400)
    idle = page.evaluate("() => !document.getElementById('rv-idle').classList.contains('hidden')")
    print("ABORT_OK", idle)

    errors = []
    if not self_ok:
        errors.append("Tzolkin-Selbsttest fehlgeschlagen")
    if not check2012["ok"]:
        errors.append("2012-12-21 ist nicht 4 Ajaw")
    if not checkToday["ok"]:
        errors.append("2026-11-27 ist nicht 10 Muluk")
    if shown2012["num"] != "4" or shown2012["name"] != "Ajaw":
        errors.append("Kalender-UI 2012 stimmt nicht: %s" % shown2012)
    if next_day.strip() != "11 Ok":
        errors.append("Nächster Tag nach 10 Muluk sollte 11 Ok sein: %s" % next_day)
    if today["number"] != 10 or today["sign"] != "Muluk":
        print("WARN today is not 10 Muluk", today)
    if not idle:
        errors.append("Abbruch kehrt nicht zum Start zurück")
    if errors:
        raise SystemExit("; ".join(errors))
    print("ALL_OK")
    browser.close()
