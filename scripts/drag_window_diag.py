from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=False)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.mouse.move(200, 180)
    page.mouse.down()
    page.mouse.move(260, 220, steps=8)
    page.mouse.move(320, 260, steps=8)
    page.mouse.up()
    page.wait_for_timeout(1000)
    browser.close()
