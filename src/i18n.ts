export type Lang = 'en' | 'es';

const sup = (n: string) => `10<sup>${n}</sup>`;

const T: Record<Lang, Record<string, string>> = {
  en: {
    'intro.sub': 'HORIZONTES · A SERIES IN FOUR PIECES',
    'hud.live': '2 OF 4 LIVE',
    'hero.kick': 'DIEGO · DRAYZU',
    'hero.title': 'Everything,<br>from here.',
    'hero.tag': 'Interactive pieces about the universe, and our place in it.',
    'hero.hint': 'SCROLL TO TRAVEL',
    'live': 'LIVE', 'forming': 'FORMING', 'enter': 'ENTER', 'progress': 'IN PROGRESS',
    'name.space': 'Espacio', 'name.time': 'Tiempo', 'name.civ': 'Destino', 'name.inf': 'Infinito', 'atlas.what': ' · THE LIBRARY',
    'pot.axis': '01 · WHERE?', 'pot.tag': 'Everything is made of something smaller.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'time.axis': '02 · WHEN?', 'time.tag': 'From before the Big Bang to the last light.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} yr`,
    'civ.axis': '03 · HOW FAR?', 'civ.tag': 'Watch a civilization outgrow its planet.',
    'civ.left': 'K 0.7', 'civ.right': 'K III', 'civ.note': 'a galaxy, waiting to be lit',
    'inf.axis': "04 · WHAT'S BEYOND?", 'inf.tag': 'What no ruler can reach.',
    'inf.left': '1', 'inf.right': '∞', 'inf.note': 'still taking shape',
    'map.kick': 'THE OBSERVER · 33.45° S',
    'map.tag': 'I make interactive pieces about the universe. This is the series so far.',
    'rail.map': 'Map',
    'stop.0': 'ARRIVAL', 'stop.5': 'THE MAP',
    'lbl.pot': 'WHERE? · LIVE', 'lbl.astro': 'THE LIBRARY', 'lbl.time': 'WHEN? · LIVE', 'lbl.civ': 'HOW FAR? · FORMING', 'lbl.inf': 'BEYOND? · FORMING',
    'nogl': 'Your browser cannot show the 3D journey, so here is the series as a list.',
  },
  es: {
    'intro.sub': 'HORIZONTES · UNA SERIE EN CUATRO PIEZAS',
    'hud.live': '2 DE 4 PUBLICADAS',
    'hero.kick': 'DIEGO · DRAYZU',
    'hero.title': 'Todo,<br>desde aquí.',
    'hero.tag': 'Piezas interactivas sobre el universo y nuestro lugar en él.',
    'hero.hint': 'DESLIZA PARA VIAJAR',
    'live': 'PUBLICADO', 'forming': 'EN FORMACIÓN', 'enter': 'ENTRAR', 'progress': 'EN PROGRESO',
    'name.space': 'Espacio', 'name.time': 'Tiempo', 'name.civ': 'Destino', 'name.inf': 'Infinito', 'atlas.what': ' · LA BIBLIOTECA',
    'pot.axis': '01 · ¿DÓNDE?', 'pot.tag': 'Todo está hecho de algo más pequeño.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'time.axis': '02 · ¿CUÁNDO?', 'time.tag': 'De antes del Big Bang a la última luz.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} años`,
    'civ.axis': '03 · ¿ADÓNDE?', 'civ.tag': 'Una civilización que deja atrás su planeta.',
    'civ.left': 'K 0,7', 'civ.right': 'K III', 'civ.note': 'una galaxia que espera encenderse',
    'inf.axis': '04 · ¿QUÉ HAY MÁS ALLÁ?', 'inf.tag': 'Lo que ninguna regla alcanza.',
    'inf.left': '1', 'inf.right': '∞', 'inf.note': 'aún sin forma',
    'map.kick': 'EL OBSERVADOR · 33,45° S',
    'map.tag': 'Hago piezas interactivas sobre el universo. Esta es la serie hasta ahora.',
    'rail.map': 'Mapa',
    'stop.0': 'LLEGADA', 'stop.5': 'EL MAPA',
    'lbl.pot': '¿DÓNDE? · PUBLICADO', 'lbl.astro': 'LA BIBLIOTECA', 'lbl.time': '¿CUÁNDO? · PUBLICADO', 'lbl.civ': '¿ADÓNDE? · EN FORMACIÓN', 'lbl.inf': '¿MÁS ALLÁ? · EN FORMACIÓN',
    'nogl': 'Tu navegador no puede mostrar el viaje en 3D, así que aquí está la serie como lista.',
  },
};

function initial(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch { /* storage may be blocked */ }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export let lang: Lang = initial();
export const t = (key: string) => T[lang][key] ?? key;

export function apply(next: Lang = lang) {
  lang = next;
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t!); });
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach(el => el.classList.toggle('on', el.dataset.lang === lang));
}
