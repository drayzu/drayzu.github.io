export type Lang = 'en' | 'es';

const sup = (n: string) => `10<sup>${n}</sup>`;

const T: Record<Lang, Record<string, string>> = {
  en: {
    'intro.sub': 'A SERIES IN FOUR PIECES',
    'intro.skip': 'CLICK TO ENTER',
    'hud.live': '2 OF 4 LIVE',
    'hero.kick': 'DIEGO · DRAYZU',
    'hero.title': 'How small,<br>how brief, how far',
    'hero.tag': 'Interactive pieces about the universe, and our place in it.',
    'hero.hint': 'SCROLL TO TRAVEL',
    'live': 'LIVE', 'forming': 'FORMING', 'enter': 'ENTER', 'progress': 'IN PROGRESS',
    'pot.axis': '01 · SIZE', 'pot.tag': 'Everything is made of something smaller.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'astro.axis': '02 · WHAT WE COULD BUILD', 'astro.tag': 'From orbital habitats to rebuilt stars.',
    'astro.left': 'a habitat', 'astro.right': 'a star, rebuilt',
    'time.axis': '03 · TIME', 'time.tag': 'From before the Big Bang to the last light.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} yr`, 'time.note': 'the nebula is still collapsing',
    'civ.axis': '04 · CIVILIZATION', 'civ.tag': 'Watch a civilization outgrow its planet.',
    'civ.left': 'K 0.7', 'civ.right': 'K III', 'civ.note': 'a galaxy, waiting to be lit',
    'map.kick': 'THE OBSERVER · 33.45° S',
    'map.tag': 'I make interactive pieces about the universe. This is the series so far.',
    'rail.map': 'Map',
    'stop.0': 'ARRIVAL', 'stop.5': 'THE MAP',
    'lbl.pot': 'SIZE · LIVE', 'lbl.astro': 'BUILD · LIVE', 'lbl.time': 'TIME · FORMING', 'lbl.civ': 'CIVILIZATION · FORMING',
    'nogl': 'Your browser cannot show the 3D journey, so here is the series as a list.',
  },
  es: {
    'intro.sub': 'UNA SERIE EN CUATRO PIEZAS',
    'intro.skip': 'HAZ CLIC PARA ENTRAR',
    'hud.live': '2 DE 4 PUBLICADAS',
    'hero.kick': 'DIEGO · DRAYZU',
    'hero.title': 'Lo pequeño,<br>lo breve, lo lejano',
    'hero.tag': 'Piezas interactivas sobre el universo y nuestro lugar en él.',
    'hero.hint': 'DESLIZA PARA VIAJAR',
    'live': 'PUBLICADO', 'forming': 'EN FORMACIÓN', 'enter': 'ENTRAR', 'progress': 'EN PROGRESO',
    'pot.axis': '01 · TAMAÑO', 'pot.tag': 'Todo está hecho de algo más pequeño.',
    'pot.left': `${sup('−35')} m`, 'pot.right': `${sup('26')} m`,
    'astro.axis': '02 · LO QUE PODRÍAMOS CONSTRUIR', 'astro.tag': 'De hábitats orbitales a estrellas reconstruidas.',
    'astro.left': 'un hábitat', 'astro.right': 'una estrella, reconstruida',
    'time.axis': '03 · TIEMPO', 'time.tag': 'De antes del Big Bang a la última luz.',
    'time.left': `${sup('−43')} s`, 'time.right': `${sup('100')} años`, 'time.note': 'la nebulosa aún está colapsando',
    'civ.axis': '04 · CIVILIZACIÓN', 'civ.tag': 'Una civilización que deja atrás su planeta.',
    'civ.left': 'K 0,7', 'civ.right': 'K III', 'civ.note': 'una galaxia que espera encenderse',
    'map.kick': 'EL OBSERVADOR · 33,45° S',
    'map.tag': 'Hago piezas interactivas sobre el universo. Esta es la serie hasta ahora.',
    'rail.map': 'Mapa',
    'stop.0': 'LLEGADA', 'stop.5': 'EL MAPA',
    'lbl.pot': 'TAMAÑO · PUBLICADO', 'lbl.astro': 'CONSTRUIR · PUBLICADO', 'lbl.time': 'TIEMPO · EN FORMACIÓN', 'lbl.civ': 'CIVILIZACIÓN · EN FORMACIÓN',
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
