/* LumaaGlaass - Optional mixed collection filter. */
;(() => {
  'use strict';

    // Localization - Share access to Jellyfin's translator across independent scripts.
    const nativeI18n = window.__lumaaGlaassI18n ||= (() => {
        let translator = null, runtime = null, retryAt = 0;
        function resolve() {
            const exposed = window.globalize || window.Globalize;
            if (typeof exposed?.translate === 'function') return exposed;
            if (translator) return translator;
            if (Date.now() < retryAt) return null;
            retryAt = Date.now() + 5000;
            const chunks = window.webpackChunk;
            if (!runtime && Array.isArray(chunks) && chunks.push !== Array.prototype.push) {
                chunks.push([['lg-i18n-' + Date.now()], {}, value => { runtime = value; }]);
            }
            if (!runtime?.m) return null;
            const matches = Object.entries(runtime.m).filter(([, factory]) => {
                const source = String(factory);
                return source.includes('Translation dictionary is empty.') && source.includes('data-culture');
            });
            if (matches.length === 1) {
                translator = Object.values(runtime(matches[0][0])).find(value =>
                    value && typeof value.translate === 'function' && typeof value.getCurrentLocale === 'function');
            }
            return translator;
        }
        return {
            translate(key) {
                try {
                    const value = resolve()?.translate(key);
                    return typeof value === 'string' && value.trim() && value !== key ? value : null;
                } catch { return null; }
            }
        };
    })();
  const KEY = '__lumaaGlaassCollectionFilter';
  window[KEY]?.stop();
  let stopped = false, scheduled = 0;
  // Localization - Jellyfin's own strings cover clients without an exposed translator.
  const translations = {
    "af": {"All":"Als","Movies":"Flieks","Shows":"Televisie Reekse","Filter":"Filtreerder"},
    "ar": {"All":"الكل","Movies":"الأفلام","Shows":"العروض","Filter":"تصفية"},
    "as": {"Movies":"চলচ্চিত্ৰ"},
    "be-by": {"All":"Усе","Movies":"Фільмы","Shows":"Шоу","Filter":"Фільтраваць"},
    "bg-bg": {"All":"Всички","Movies":"Филми","Shows":"Сериали","Filter":"Филтър"},
    "bn": {"All":"সব","Movies":"চলচ্চিত্রসমূহ","Shows":"শো সমূহ"},
    "bn_bd": {"All":"সবগুলি","Filter":"ফিল্টার"},
    "br": {"All":"An holl"},
    "ca": {"All":"Tot","Movies":"Pel·lícules","Shows":"Sèries","Filter":"Filtre"},
    "ch": {},
    "ckb": {},
    "cs": {"All":"Vše","Movies":"Filmy","Shows":"Seriály","Filter":"Filtr"},
    "cy": {"All":"Y cyfan","Movies":"Ffilmiau","Shows":"Rhaglenni","Filter":"Hidlo"},
    "da": {"All":"Alle","Movies":"Film","Shows":"Serier","Filter":"Filtrer"},
    "de": {"All":"Alle","Movies":"Filme","Shows":"Serien","Filter":"Filter"},
    "dv": {"All":"ހުރިހާ"},
    "el": {"All":"Όλα","Movies":"Ταινίες","Shows":"Σειρές","Filter":"Φιλτράρισμα"},
    "en-gb": {"All":"All","Movies":"Movies","Shows":"Shows","Filter":"Filter"},
    "en-us": {"All":"All","Movies":"Movies","Shows":"Shows","Filter":"Filter"},
    "enm": {},
    "eo": {"All":"Ĉiuj","Movies":"Filmoj","Shows":"Serioj","Filter":"Filtru"},
    "es-ar": {"All":"Todos","Movies":"Películas","Shows":"Programas","Filter":"Filtrar"},
    "es-mx": {"All":"Todo","Movies":"Películas","Shows":"Programas","Filter":"Filtro"},
    "es": {"All":"Todo","Movies":"Películas","Shows":"Series","Filter":"Filtro"},
    "es_419": {"All":"Todo","Movies":"Películas","Shows":"Programas","Filter":"Filtro"},
    "es_do": {"Movies":"Películas","Shows":"Series"},
    "et": {"All":"Kõik","Movies":"Filmid","Shows":"Sarjad","Filter":"Filter"},
    "eu": {"All":"Dena","Movies":"Filmak","Shows":"Serieak","Filter":"Iragazkia"},
    "fa": {"All":"همه","Movies":"فیلم ها","Shows":"سریال‌ها","Filter":"Filter"},
    "fi": {"All":"Kaikki","Movies":"Elokuvat","Shows":"Sarjat","Filter":"Suodata"},
    "fil": {"All":"Lahat","Movies":"Mga Pelikula","Shows":"Mga Pelikula","Filter":"Filter"},
    "fo": {"All":"Øll","Shows":"Røðir"},
    "fr-ca": {"All":"Tout","Movies":"Films","Shows":"Séries","Filter":"Filtre"},
    "fr": {"All":"Tout","Movies":"Films","Shows":"Séries","Filter":"Filtrer"},
    "ga": {"All":"Uilig","Movies":"Scannáin","Shows":"Seónna","Filter":"Scagaire"},
    "gl": {"All":"Todo","Movies":"Películas","Shows":"Programas","Filter":"Filtro"},
    "gsw": {"All":"Alli","Movies":"Film","Shows":"Serie"},
    "gu": {"All":"સર્વ"},
    "he": {"All":"הכול","Movies":"סרטים","Shows":"סדרות","Filter":"סינון"},
    "hi-in": {"All":"सारे","Movies":"फ़िल्म","Shows":"शो"},
    "hr": {"All":"Sve","Movies":"Filmovi","Shows":"Serije","Filter":"Filter"},
    "ht": {"All":"Tout","Movies":"Fim","Shows":"Emisyon yo"},
    "hu": {"All":"Mind","Movies":"Filmek","Shows":"Sorozatok","Filter":"Szűrés"},
    "hy": {"All":"Բոլորը","Movies":"Ֆիլմեր"},
    "id": {"All":"Semua","Movies":"Film","Shows":"Tayangan","Filter":"Filter"},
    "is-is": {"All":"Allt","Movies":"Kvikmyndir","Shows":"Þættir","Filter":"Sía"},
    "it": {"All":"Tutto","Movies":"Film","Shows":"Serie TV","Filter":"Filtro"},
    "ja": {"All":"すべて","Movies":"映画","Shows":"番組","Filter":"フィルター"},
    "jbo": {"All":"ro"},
    "ka": {"All":"ყველა","Movies":"ფილმები","Shows":"სერიალები"},
    "kab": {"Movies":"Isura"},
    "kk": {"All":"Bärı","Movies":"Filmder","Shows":"Körsetımder","Filter":"Süzu"},
    "kn": {"All":"ಎಲ್ಲಾ","Movies":"ಚಲನಚಿತ್ರಗಳು","Shows":"ಧಾರವಾಹಿಗಳು"},
    "ko": {"All":"모두","Movies":"영화","Shows":"시리즈","Filter":"필터"},
    "kw": {"All":"Oll","Movies":"Fylmow","Shows":"Diskwedhyansow"},
    "ky": {},
    "lb": {"All":"All","Movies":"Filmer","Shows":"Shows","Filter":"Filter"},
    "lt-lt": {"All":"Visi","Movies":"Filmai","Shows":"Laidos","Filter":"Filtras"},
    "lv": {"All":"Viss/i","Movies":"Filmas","Shows":"Šovi","Filter":"Filtrs"},
    "mg": {"All":"Rehetra"},
    "mk": {"All":"Сите","Movies":"Филмови","Shows":"Серии","Filter":"Филтер"},
    "ml": {"All":"എല്ലാം","Movies":"സിനിമകൾ","Shows":"ഷോകൾ","Filter":"ഫിൽട്ടർ ചെയ്യുക"},
    "mn": {"All":"Бүгд","Movies":"Кинонууд","Shows":"Шоу","Filter":"Шүүлтүүр"},
    "mr": {"All":"सर्व","Movies":"चित्रपट","Shows":"कार्यक्रम"},
    "ms": {"All":"Semua","Movies":"Filem-filem","Shows":"Tayangan"},
    "mt": {"All":"Kollha","Movies":"Films","Shows":"Serje"},
    "my": {"All":"အားလုံး","Movies":"ရုပ်ရှင်များ","Shows":"ဇာတ်လမ်းတွဲများ"},
    "nb": {"All":"Alle","Movies":"Filmer","Shows":"Serier","Filter":"Filter"},
    "ne": {"All":"सबै","Movies":"चलचित्रहरू","Shows":"शोहरू"},
    "nl": {"All":"Alle","Movies":"Films","Shows":"Series","Filter":"Filter"},
    "nn": {"All":"Alle","Movies":"Filmar","Shows":"Seriar","Filter":"Filter"},
    "pa": {"All":"ਸਾਰੇ","Movies":"ਫਿਲਮਾਂ","Shows":"ਸ਼ੋਅ"},
    "pl": {"All":"Wszystkie","Movies":"Filmy","Shows":"Seriale","Filter":"Filtruj"},
    "pr": {"Movies":"Moving pictures","Shows":"Sagas"},
    "pt-br": {"All":"Todos","Movies":"Filmes","Shows":"Séries","Filter":"Filtro"},
    "pt-pt": {"All":"Todos","Movies":"Filmes","Shows":"Séries","Filter":"Filtro"},
    "pt": {"All":"Todos","Movies":"Filmes","Shows":"Séries","Filter":"Filtro"},
    "ro": {"All":"Toate","Movies":"Filme","Shows":"Seriale","Filter":"Filtru"},
    "ru": {"All":"Все","Movies":"Фильмы","Shows":"Сериалы","Filter":"Фильтрoвать"},
    "si": {"All":"සියලුම"},
    "sk": {"All":"Všetko","Movies":"Filmy","Shows":"Seriály","Filter":"Filter"},
    "sl-si": {"All":"Vse","Movies":"Filmi","Shows":"Serije","Filter":"Filter"},
    "so": {"All":"Dhamaan"},
    "sq": {"All":"Të gjithë","Movies":"Filmat","Shows":"Serialet","Filter":"Filtro"},
    "sr": {"All":"Све","Movies":"Филмови","Shows":"Серије","Filter":"Филтер"},
    "sv": {"All":"Alla","Movies":"Filmer","Shows":"Serier","Filter":"Filter"},
    "ta": {"All":"அனைத்தும்","Movies":"திரைப்படங்கள்","Shows":"நிகழ்ச்சிகள்","Filter":"வடிகட்டு"},
    "te": {"All":"అన్నీ","Movies":"సినిమాలు","Shows":"ప్రదర్శనలు","Filter":"ఫిల్టర్"},
    "th": {"All":"ทั้งหมด","Movies":"ภาพยนตร์","Shows":"รายการ"},
    "tr": {"All":"Tümü","Movies":"Filmler","Shows":"Diziler","Filter":"Filtre"},
    "ug": {"Movies":"فىلىملەر","Shows":"پروگراممىلار"},
    "uk": {"All":"Всі","Movies":"Фільми","Shows":"Серіали","Filter":"Фільтр"},
    "ur_pk": {"All":"تمام","Movies":"فلمیں","Shows":"دکھاتا ہے","Filter":"فلٹر"},
    "uz": {"All":"Barchasi","Movies":"Kinolar","Shows":"Teleko'rsatuv","Filter":"Filtr"},
    "vi": {"All":"Tất cả","Movies":"Phim","Shows":"Chương Trình TV","Filter":"Bộ lọc"},
    "zh-cn": {"All":"全部","Movies":"电影","Shows":"节目","Filter":"筛选"},
    "zh-hk": {"All":"全部","Movies":"電影","Shows":"節目","Filter":"篩選"},
    "zh-tw": {"All":"全部","Movies":"電影","Shows":"節目","Filter":"篩選器"},
    "zu": {"All":"Konke","Movies":"Amamuvi","Shows":"Izinhlelo","Filter":"Isihlungi"}
  };
  const locale = () => (document.documentElement.lang || document.documentElement.getAttribute('data-culture') || navigator.language || 'en-us').replace(/_/g, '-').toLowerCase();
  const translate = key => {
    const language = locale();
    const native = nativeI18n;
    try {
      const value = native?.translate?.(key);
      if (typeof value === 'string' && value && value !== key) return value;
    } catch { /* Localization - Use bundled native strings when the client API is unavailable. */ }
    return translations[language]?.[key] || translations[language.split('-')[0]]?.[key] || translations['en-us'][key] || key;
  };

  const style = document.createElement('style');
  style.id = 'lumaaglaass-collection-filter-style';
  style.textContent = `
/* Collections - Optional type selection appears only for mixed collections. */
.aa-collection-filter {
    display: flex;
    justify-content: flex-start;
    box-sizing: border-box;
    width: 100%;
    padding: 0;
    margin-inline: 0;
    margin-block: 0 8px;
}
.aa-collection-filter-group {
    display: inline-flex;
    align-items: stretch;
    gap: 4px;
    padding: 4px;
    max-width: 100%;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 999px;
    background: var(--aa-surface, rgba(30,30,32,.4));
}
.aa-collection-filter-button {
    appearance: none;
    border: 0;
    border-radius: 999px;
    min-height: 44px;
    min-width: 0;
    padding: 8px 20px;
    font: inherit;
    font-weight: 600;
    color: rgba(255,255,255,.85);
    background: transparent;
    cursor: pointer;
    overflow-wrap: anywhere;
}
.aa-collection-filter-button:hover { background: rgba(255,255,255,.08); }
.aa-collection-filter-button[aria-pressed="true"] {
    background: var(--aa-selected-surface, rgba(255,255,255,.16));
    color: #fff;
}
.aa-collection-filter-button:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }
.collectionItems [data-aa-filter-hidden] { display: none !important; }
@media (max-width: 640px) {
    .aa-collection-filter { justify-content: center; }
    .aa-collection-filter-group { width: 100%; }
    .aa-collection-filter-button { flex: 1 1 0; padding-inline: 10px; }
}
@media (forced-colors: active) {
    .aa-collection-filter-group { border-color: ButtonText; }
    .aa-collection-filter-button[aria-pressed="true"] { outline: 2px solid Highlight; outline-offset: -3px; }
}
`;
  document.head.append(style);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const route = () => location.hash.split('?')[0].replace(/\.html$/, '');
  const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const enabled = () => getComputedStyle(document.documentElement).getPropertyValue('--aa-accent').trim() !== '';
  const currentClient = () => {
    try { return window.ApiClient || window.ConnectionManager?.currentApiClient?.(); }
    catch { return null; }
  };
  const sessionKey = api => {
    try { const user = api?.getCurrentUserId?.(); return user ? String(api.serverId?.() || '') + ':' + user : ''; }
    catch { return ''; }
  };
  const visible = node => node && !node.closest('.hide,[hidden]') && node.getClientRects().length > 0;
  // Collections - Filter native cards without changing their order or watch state.
  let collectionFilter = null;
  function clearCollectionFilter() {
    if (!collectionFilter) return;
    collectionFilter.bar.remove();
    collectionFilter.container.querySelectorAll('[data-aa-filter-hidden]').forEach(node => node.removeAttribute('data-aa-filter-hidden'));
    collectionFilter = null;
  }
  function syncCollectionFilter() {
    const api = currentClient(), key = sessionKey(api), id = params().get('id');
    const page = !stopped && enabled() && key && id && route() === '#/details' &&
      [...document.querySelectorAll('.itemDetailPage')].find(node => visible(node) && node.querySelector('.collectionItems:not(.hide):not([hidden])'));
    const container = page && page.querySelector('.collectionItems:not(.hide):not([hidden])');
    if (collectionFilter && (!container || collectionFilter.container !== container || collectionFilter.id !== id || collectionFilter.key !== key)) clearCollectionFilter();
    if (!container) return;
    const cards = [...container.querySelectorAll('.card[data-type]')];
    const mixed = cards.some(node => node.dataset.type === 'Movie') && cards.some(node => node.dataset.type === 'Series');
    if (!mixed) { clearCollectionFilter(); return; }
    if (!collectionFilter) {
      const bar = element('div', 'aa-collection-filter');
      const group = element('div', 'aa-collection-filter-group');
      group.setAttribute('role', 'group');
      const state = { container, bar, group, id, key, selected: 'All' };
      for (const [value, label] of [['All', 'All'], ['Movie', 'Movies'], ['Series', 'Shows']]) {
        const button = element('button', 'aa-collection-filter-button', translate(label));
        button.type = 'button'; button.dataset.filter = value; button.dataset.label = label;
        button.addEventListener('click', () => {
          if (collectionFilter !== state) return;
          state.selected = value; syncCollectionFilter();
        });
        group.append(button);
      }
      // Keyboard - Keep native Tab activation and offer directional navigation.
      group.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const buttons = [...group.querySelectorAll('button')], current = buttons.indexOf(document.activeElement);
        if (current < 0) return;
        const direction = getComputedStyle(group).direction === 'rtl' ? -1 : 1;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
          (current + (event.key === 'ArrowRight' ? direction : -direction) + buttons.length) % buttons.length;
        event.preventDefault(); buttons[next].focus(); buttons[next].click();
      });
      bar.append(group); container.before(bar); collectionFilter = state;
    }
    const state = collectionFilter;
    if (!state.bar.isConnected) container.before(state.bar);
    const label = translate('Filter');
    if (state.group.getAttribute('aria-label') !== label) state.group.setAttribute('aria-label', label);
    state.group.querySelectorAll('button').forEach(button => {
      const text = translate(button.dataset.label), pressed = String(button.dataset.filter === state.selected);
      if (button.textContent !== text) button.textContent = text;
      if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    });
    const hide = (node, hidden) => {
      if (node.hasAttribute('data-aa-filter-hidden') !== hidden) node.toggleAttribute('data-aa-filter-hidden', hidden);
    };
    cards.forEach(card => hide(card, state.selected !== 'All' && card.dataset.type !== state.selected));
    container.querySelectorAll('.verticalSection').forEach(section => {
      const children = [...section.querySelectorAll('.card[data-type]')];
      hide(section, state.selected !== 'All' && children.length > 0 && children.every(card => card.dataset.type !== state.selected));
    });
  }

  // Lifecycle - Observe native rerenders; coalesce changes without polling or API calls.
  function schedule() {
    if (stopped || scheduled) return;
    scheduled = requestAnimationFrame(() => {
      scheduled = 0;
      if (!stopped) syncCollectionFilter();
    });
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => !(record.target instanceof Element) || !record.target.closest('.aa-collection-filter'))) schedule();
  });
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'data-type', 'lang', 'data-culture', 'style']
  });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('viewshow', schedule, true);
  window[KEY] = { stop() {
    stopped = true;
    observer.disconnect();
    cancelAnimationFrame(scheduled);
    window.removeEventListener('hashchange', schedule);
    window.removeEventListener('popstate', schedule);
    document.removeEventListener('viewshow', schedule, true);
    clearCollectionFilter();
    style.remove();
    delete window[KEY];
  } };
  schedule();
})();
