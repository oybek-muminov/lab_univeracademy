"""Run from apps/mini-app after npm run build. Uses existing local browser tools."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import shutil
from playwright.sync_api import sync_playwright, expect

for asset in Path('dist').rglob('*.js'):
    content = asset.read_text()
    assert 'sample-q1' not in content
    assert 'sample-physics' not in content
    assert 'Namuna holatlarini sinash' not in content

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory='dist'))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        requests = []
        errors = []
        page.on('request', lambda request: requests.append(request.url))
        page.on('pageerror', lambda error: errors.append(str(error)))
        origin = f'http://127.0.0.1:{server.server_address[1]}'
        page.goto(origin)
        expect(page.get_by_role('heading', name='Ulanish tayyorlanmoqda')).to_be_visible()
        assert page.get_by_role('button', name='Namunani ochish').count() == 0
        assert not any('demo-' in request for request in requests)
        assert all(request.startswith(origin) for request in requests)
        assert not errors, errors
        browser.close()
        print('PASS: production closed screen; no demo code/requests, no external requests or page errors')
finally:
    server.shutdown()
    server.server_close()
