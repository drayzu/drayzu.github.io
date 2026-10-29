export type Lang = 'en' | 'es';

const sup = (n: string) => `10<sup>${n}</sup>`;

const T: Record<Lang, Record<string, string>> = {
  en: {
    'series': 'A SERIES IN FOUR PIECES',
    'hero.tag': 'Everything, from here.',
    'hero.lede': 'Interactive pieces about the universe, and our place in it.',
    'hero.hint': 'SCROLL TO TRAVEL',
    'enter': 'ENTER',
    'name.space': 'Espacio', 'name.time': 'Tiempo', 'name.civ': 'Destino', 'name.inf': 'Infinito', 'atlas.what': ' · THE LIBRARY',
    'pot.axis': '01 · WHERE?', 'pot.tag': 'From a quark to the edge of everything.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'time.axis': '02 · WHEN?', 'time.tag': 'From before the Big Bang to the last light.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} yr`,
    'civ.axis': '03 · HOW FAR?', 'civ.tag': 'From the first thought to the last thing we could ever build.',
    'civ.left': 'K 0.7', 'civ.right': 'K III',
    'inf.axis': "04 · WHAT'S BEYOND?", 'inf.tag': 'Beyond the last thing we could know.',
    'inf.left': '1', 'inf.right': '∞',
    'map.kick': '33.45° S',
    'map.tag': 'Someone down here, looking out.',
    'rail.map': 'Map',
    'lbl.pot': 'WHERE?', 'lbl.astro': 'THE LIBRARY', 'lbl.time': 'WHEN?', 'lbl.civ': 'HOW FAR?', 'lbl.inf': "WHAT'S BEYOND?",
    'nogl': 'Your browser cannot show the 3D journey, so here is the series as a list.',
  },
  es: {
    'series': 'UNA SERIE EN CUATRO PIEZAS',
    'hero.tag': 'Todo, desde aquí.',
    'hero.lede': 'Piezas interactivas sobre el universo y nuestro lugar en él.',
    'hero.hint': 'DESLIZA PARA VIAJAR',
    'enter': 'ENTRAR',
    'name.space': 'Espacio', 'name.time': 'Tiempo', 'name.civ': 'Destino', 'name.inf': 'Infinito', 'atlas.what': ' · LA BIBLIOTECA',
    'pot.axis': '01 · ¿DÓNDE?', 'pot.tag': 'De un quark al borde de todo.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'time.axis': '02 · ¿CUÁNDO?', 'time.tag': 'De antes del Big Bang a la última luz.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} años`,
    'civ.axis': '03 · ¿ADÓNDE?', 'civ.tag': 'Del primer pensamiento a lo último que podríamos construir.',
    'civ.left': 'K 0,7', 'civ.right': 'K III',
    'inf.axis': '04 · ¿QUÉ HAY MÁS ALLÁ?', 'inf.tag': 'Más allá de lo último que podríamos saber.',
    'inf.left': '1', 'inf.right': '∞',
    'map.kick': '33,45° S',
    'map.tag': 'Alguien aquí abajo, mirando hacia afuera.',
    'rail.map': 'Mapa',
    'lbl.pot': '¿DÓNDE?', 'lbl.astro': 'LA BIBLIOTECA', 'lbl.time': '¿CUÁNDO?', 'lbl.civ': '¿ADÓNDE?', 'lbl.inf': '¿QUÉ HAY MÁS ALLÁ?',
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
