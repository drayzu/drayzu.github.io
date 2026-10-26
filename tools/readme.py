"""Records the camera journey for the README: media/vuelo.avif (1840 px, 30 fps), a WebP fallback and the link button.

    npm run dev                      # in another terminal
    python tools/readme.py           # reuses captured frames in tools/frames/ if present
    python tools/readme.py --fresh   # captures them again

Frames come from the real site in ?capture mode (no interface, each instant drawn on demand by window.renderAt).
Fonts, palette and the SVG helper come from the profile README pipeline (E:/Proyectos/ChatGPT/drayzu-perfil/tools/build.py).
"""
import base64, importlib.util, io, json, math, os, shutil, socket, subprocess, sys, tempfile, time, urllib.request

import websocket
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, 'tools', 'frames')
MEDIA = os.path.join(ROOT, 'media')
URL = 'http://localhost:5173/?capture'
CHROME = r'C:/Program Files/Google/Chrome/Application/chrome.exe'

spec = importlib.util.spec_from_file_location('build', r'E:/Proyectos/ChatGPT/drayzu-perfil/tools/build.py')
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)

CSS_W, CSS_H, DSF = 920, 400, 2          # captured at 1840 x 800
FPS, SECONDS = 30, 9
N = FPS * SECONDS
FADE = 12                                 # frames of fade to and from black, so the loop is seamless
P0, P1 = .75, 4.0                         # from just before Espacio to the map
AVIF_CRF, AVIF_PRESET = 34, 5
WEBP_W, WEBP_Q = 920, 55

def journey(k):
    """Where the camera is at frame k: eased at both ends, steady in between (the site's own dwell does the stops)."""
    x = k / (N - 1)
    e = x * x * (3 - 2 * x)
    return P0 + (P1 - P0) * (.35 * e + .65 * x)

def capture():
    shutil.rmtree(FRAMES, ignore_errors=True); os.makedirs(FRAMES)
    tmp = tempfile.mkdtemp(prefix='chrome-')
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}', f'--user-data-dir={tmp}',
                             '--hide-scrollbars', '--force-color-profile=srgb', '--enable-gpu', '--use-angle=d3d11', 'about:blank'],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try:
                page = next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type'] == 'page'); break
            except Exception:
                time.sleep(.1)
        ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True)
        n = [0]
        def call(method, **params):
            n[0] += 1
            ws.send(json.dumps({'id': n[0], 'method': method, 'params': params}))
            while True:
                msg = json.loads(ws.recv())
                if msg.get('id') == n[0]:
                    if 'error' in msg: raise RuntimeError(msg['error'])
                    return msg.get('result', {})
        js = lambda e: call('Runtime.evaluate', expression=e, awaitPromise=True, returnByValue=True)['result'].get('value')
        call('Emulation.setDeviceMetricsOverride', width=CSS_W, height=CSS_H, deviceScaleFactor=DSF, mobile=False)
        call('Page.navigate', url=URL)
        for _ in range(300):
            if js('window.sceneReady === true'): break
            time.sleep(.1)
        else:
            raise RuntimeError('the site did not load in capture mode')
        for k in range(N):
            js(f'window.renderAt({20 + k / FPS}, {journey(k)}); new Promise(r => requestAnimationFrame(() => r(true)))')
            shot = call('Page.captureScreenshot', format='png')
            open(os.path.join(FRAMES, f'{k:04d}.png'), 'wb').write(base64.b64decode(shot['data']))
            if k % 30 == 0: print(f'  captured {k}/{N}')
    finally:
        proc.kill()

def frame(k):
    im = Image.open(os.path.join(FRAMES, f'{k:04d}.png')).convert('RGB')
    a = min(k / FADE, (N - 1 - k) / FADE, 1)
    if a < 1:
        im = Image.blend(Image.new('RGB', im.size, B.CARD['card']), im, max(a, 0) ** 1.5)
    return im

def encode():
    os.makedirs(MEDIA, exist_ok=True)
    w, h = Image.open(os.path.join(FRAMES, '0000.png')).size
    dst = os.path.join(MEDIA, 'vuelo.avif')
    ff = subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(FPS), '-i', '-',
         '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
         '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-colorspace', 'bt709', '-color_range', 'tv',
         '-c:v', 'libsvtav1', '-preset', str(AVIF_PRESET), '-crf', str(AVIF_CRF), '-g', '600', '-loop', '0', dst],
        stdin=subprocess.PIPE)
    small = []
    for k in range(N):
        im = frame(k)
        ff.stdin.write(im.tobytes())
        if k % 2 == 0:
            small.append(im.resize((WEBP_W, round(h * WEBP_W / w)), Image.LANCZOS))
    ff.stdin.close(); ff.wait()
    print(f'  vuelo.avif  {os.path.getsize(dst) / 1e6:.2f} MB  ({w}x{h}, {N} frames)')
    fb = os.path.join(MEDIA, 'vuelo.webp')
    small[0].save(fb, save_all=True, append_images=small[1:], duration=round(2000 / FPS), loop=0, quality=WEBP_Q, method=4)
    print(f'  vuelo.webp  {os.path.getsize(fb) / 1e6:.2f} MB')

def link(t):
    ink, c = t['ink'], t['pot']
    body = (f'<rect x="20" y="16" width="560" height="60" rx="30" fill="{t["panel"]}" stroke="{ink}" stroke-opacity=".3"/>'
            f'<circle cx="54" cy="46" r="6" fill="{c}"/>'
            f'<text x="76" y="56" font-family="S,serif" font-size="28" fill="{ink}">drayzu.github.io</text>'
            f'<text x="536" y="51" text-anchor="end" font-family="M,monospace" font-size="13" letter-spacing="2" fill="{ink}" fill-opacity=".6">ENTER</text>'
            f'<path d="M546,46h16M556,40l6,6l-6,6" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
    return B.svg(600, 92, 'Enter drayzu.github.io', '', body)

if __name__ == '__main__':
    if '--fresh' in sys.argv or not os.path.exists(os.path.join(FRAMES, f'{N - 1:04d}.png')):
        print('capturing the journey...'); capture()
    encode()
    for th, t in B.THEMES.items():
        open(os.path.join(MEDIA, f'link-{th}.svg'), 'w', encoding='utf-8', newline='\n').write(link(t))
    print('  link-dark.svg, link-light.svg')
