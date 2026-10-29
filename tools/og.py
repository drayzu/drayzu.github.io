"""Captures public/og.jpg (the link preview) from the running dev server with headless Chrome.

    npm run dev            # in another terminal
    python tools/og.py
"""
import base64, io, json, os, socket, subprocess, sys, tempfile, time, urllib.request

import websocket
from PIL import Image

CHROME = r'C:/Program Files/Google/Chrome/Application/chrome.exe'
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173/?og'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'og.jpg')
W, H = 1200, 630

tmp = tempfile.mkdtemp(prefix='chrome-')
with socket.socket() as s:
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}', f'--user-data-dir={tmp}',
                         '--hide-scrollbars', '--force-color-profile=srgb', '--enable-gpu', '--use-angle=d3d11', 'about:blank'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(100):
        try:
            page = next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type'] == 'page')
            break
        except Exception:
            time.sleep(.1)
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True)
    n = 0

    def call(method, **params):
        global n
        n += 1
        ws.send(json.dumps({'id': n, 'method': method, 'params': params}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == n:
                if 'error' in msg:
                    raise RuntimeError(msg['error'])
                return msg.get('result', {})

    call('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=2, mobile=False)
    call('Page.navigate', url=URL)
    time.sleep(12)  # the title card and the arrival take about 9 s, then the text settles
    shot = call('Page.captureScreenshot', format='png')
    im = Image.open(io.BytesIO(base64.b64decode(shot['data']))).convert('RGB').resize((W, H), Image.LANCZOS)
    im.save(OUT, quality=88, optimize=True, progressive=True)
    print(OUT, os.path.getsize(OUT) // 1024, 'KB')
finally:
    proc.kill()
