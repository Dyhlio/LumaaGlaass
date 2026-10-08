/* LumaaGlaass - Main script. */
;
(() => {
    'use strict';

    // =====================================================================
    // Configuration
    // =====================================================================
    // Options - window.LumaaGlaassOptions = { preferences, homeCarousel, homeLibraryNamesOnly, collectionFilter }.
    // homeCarousel and collectionFilter default to true. homeLibraryNamesOnly and preferences default to false.
    // Docs: customization.md#home-carousel, #home-library-titles, #collection-filter, #settings-page.
    const defaults = { preferences: false, homeCarousel: true, homeLibraryNamesOnly: false, collectionFilter: true };
    const configured = window.LumaaGlaassOptions || {};
    const flag = (value, fallback) => typeof value === 'boolean' ? value : fallback;
    const loaderSettings = Object.freeze({
        homeCarousel: flag(configured.homeCarousel, defaults.homeCarousel),
        homeLibraryNamesOnly: flag(configured.homeLibraryNamesOnly, defaults.homeLibraryNamesOnly),
        collectionFilter: flag(configured.collectionFilter, defaults.collectionFilter)
    });
    const preferencesEnabled = flag(configured.preferences, defaults.preferences);
    let settings = loaderSettings;
    // Assets - Extensions load from this script's folder when it comes from the repository, so a pinned
    // revision stays pinned. A query suffix also follows every extension, which makes a cache-busted
    // main script and its dependent files update as one unit. A pasted copy uses the main branch.
    const ASSET_SOURCE = (() => {
        const source = document.currentScript?.src || '';
        const match = source.match(/^(.*\/assets\/)lumaaglaass\.js([?#].*)?$/);
        return match ? { root: match[1], suffix: match[2] || '' } :
            { root: 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/', suffix: '' };
    })();
    const ASSETS = ASSET_SOURCE.root;
    const assetUrl = path => ASSETS + path + ASSET_SOURCE.suffix;
    // Settings - Used by the optional preferences extension. It changes only the main-theme options that
    // belong to the main theme; all extension-specific choices stay in that extension.
    function applyCoreSettings(values) {
        const next = values ? Object.freeze({
            homeCarousel: flag(values.homeCarousel, loaderSettings.homeCarousel),
            homeLibraryNamesOnly: flag(values.homeLibraryNamesOnly, loaderSettings.homeLibraryNamesOnly),
            collectionFilter: flag(values.collectionFilter, loaderSettings.collectionFilter)
        }) : loaderSettings;
        if (next.homeCarousel !== settings.homeCarousel) clearHome();
        settings = next;
        schedule();
    }

    // =====================================================================
    // Instance
    // =====================================================================
    const KEY = '__lumaaGlaass';
    window[KEY]?.stop();
    let stopped = false;

    // =====================================================================
    // Localization
    // =====================================================================
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
    // Localization - English text of the Jellyfin keys used here, for when Jellyfin has no string.
    const ENGLISH = {
        Play: 'Play',
        ButtonResume: 'Resume',
        Movie: 'Movie',
        Series: 'Series',
        ItemDetails: 'Item Details',
        MessagePleaseWait: 'Please wait. This may take a minute.',
        ErrorDefault: 'There was an error processing the request. Please try again later.',
        MoviesAndShows: 'Movies and Shows',
        ViewSettings: 'View settings',
        NewCollection: 'New Collection',
        NewPlaylist: 'New Playlist',
        All: 'All',
        Movies: 'Movies',
        Shows: 'Shows',
        Filter: 'Filter',
        Save: 'Save'
    };
    // Localization - The theme's own strings, by language. Jellyfin does not have them, and asking
    // it for a missing key logs an error.
    const THEME_STRINGS = {
        en: {
            PlaybackUnavailable: 'Automatic playback did not start. Check the available sources, then use Play to retry.',
        },
        fr: {
            PlaybackUnavailable:
                'La lecture automatique n’a pas démarré. Vérifiez les sources disponibles, puis utilisez Lire pour réessayer.',
        }
    };
    const language = () => (document.documentElement.lang || navigator.language).slice(0, 2).toLowerCase();
    // Localization - Theme strings never go through Jellyfin; other keys use Jellyfin's string, else English.
    const translate = key => key in THEME_STRINGS.en ?
        THEME_STRINGS[language()]?.[key] || THEME_STRINGS.en[key] :
        nativeI18n.translate(key) || ENGLISH[key] || key;

    // =====================================================================
    // Shared helpers
    // =====================================================================
    // Listeners - Added through listen() so stop() removes them all.
    const listeners = [];
    const listen = (target, event, fn, options) => {
        target.addEventListener(event, fn, options);
        listeners.push(() => target.removeEventListener(event, fn, options));
    };
    const element = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text) node.textContent = text;
        return node;
    };
    const route = () => location.hash.split('?')[0].replace(/\.html$/, '');
    const home = () => route() === '#/home';
    const enabled = () => getComputedStyle(document.documentElement).getPropertyValue('--lg-color-accent').trim() !== '';
    const currentClient = () => {
        try {
            return window.ApiClient || window.ConnectionManager?.currentApiClient?.();
        } catch { return null; }
    };
    const sessionKey = c => {
        try {
            const u = c?.getCurrentUserId?.();
            return u ? String(c.serverId?.() || '') + ':' + u : '';
        } catch { return ''; }
    };
    const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
    const idKey = value => String(value || '').replace(/-/g, '').toLowerCase();
    const sameId = (a, b) => !!a && !!b && idKey(a) === idKey(b);
    const visible = node => node && !node.closest('.hide,[hidden]') && node.getClientRects().length > 0;
    // Writes - Only real changes: the page observer and the tooltip claim react to each write.
    const setText = (node, value) => {
        if (node && node.textContent !== value) node.textContent = value;
    };
    const setAttribute = (node, name, value) => {
        if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
    };

    // Selects - The browser's customizable picker can lose its anchor inside a scrolling host view.
    // Managed selects share one viewport-positioned picker, while their native controls remain the
    // source of truth for values, forms and change events.
    function createSelectController() {
        let active = null;
        let generatedId = 0;
        const states = new Set();
        const stateByControl = new WeakMap();
        const picker = element('div', 'lg-select-picker');
        picker.id = 'lg-select-picker';
        picker.setAttribute('role', 'listbox');
        picker.hidden = true;
        const selectedIndex = state => {
            const index = state.control.selectedIndex;
            return index >= 0 && !state.control.options[index]?.disabled ? index :
                [...state.control.options].findIndex(option => !option.disabled);
        };
        const choices = () => [...picker.querySelectorAll('.lg-select-option:not(:disabled)')];
        const close = focus => {
            const state = active;
            if (!state) return;
            active = null;
            picker.hidden = true;
            picker.replaceChildren();
            state.trigger.setAttribute('aria-expanded', 'false');
            if (focus && state.trigger.isConnected) state.trigger.focus();
        };
        const sync = state => {
            if (!states.has(state)) return;
            setText(state.trigger, state.control.selectedOptions[0]?.textContent || '');
            state.trigger.disabled = state.control.disabled;
        };
        const position = () => {
            const state = active;
            if (!state || picker.hidden) return;
            const rect = state.trigger.getBoundingClientRect();
            const inset = 12, gap = 8;
            const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
            const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
            const width = Math.min(rect.width, Math.max(0, viewportWidth - inset * 2));
            const left = Math.min(Math.max(inset, rect.left), viewportWidth - inset - width);
            picker.style.width = width + 'px';
            picker.style.maxHeight = Math.min(360, viewportHeight * .55) + 'px';
            picker.style.left = '0px';
            picker.style.right = 'auto';
            picker.style.top = '0px';
            picker.style.bottom = 'auto';
            picker.style.visibility = 'hidden';
            const origin = picker.getBoundingClientRect();
            const host = origin.left || origin.top ? state.portal.getBoundingClientRect() : null;
            const minX = Math.max(inset, host?.left ?? -Infinity);
            const maxX = Math.min(viewportWidth - inset, host?.right ?? Infinity);
            const boundedLeft = Math.max(minX, Math.min(left, maxX - width));
            const minY = Math.max(inset, host?.top ?? 0) + inset;
            const maxY = Math.min(viewportHeight - inset, host?.bottom ?? Infinity) - inset;
            const height = picker.getBoundingClientRect().height;
            const below = Math.max(0, maxY - rect.bottom - gap);
            const above = Math.max(0, rect.top - minY - gap);
            const top = below < Math.min(height, 160) && above > below ? rect.top - height - gap : rect.bottom + gap;
            picker.style.left = Math.round(boundedLeft - origin.left) + 'px';
            picker.style.top = Math.round(Math.max(minY, Math.min(top, maxY - height)) - origin.top) + 'px';
            picker.style.visibility = '';
        };
        const choose = (state, index) => {
            const option = state.control.options[index];
            if (!option || option.disabled) return;
            if (state.control.selectedIndex !== index) {
                state.control.selectedIndex = index;
                state.control.dispatchEvent(new Event('change', { bubbles: true }));
            }
            sync(state);
            close(true);
        };
        const open = (state, direction) => {
            if (!states.has(state) || state.control.disabled || !state.control.options.length) return;
            if (active === state) {
                close(true);
                return;
            }
            close(false);
            active = state;
            if (picker.parentElement !== state.portal) state.portal.append(picker);
            state.trigger.setAttribute('aria-expanded', 'true');
            [...state.control.options].forEach((option, index) => {
                const choice = element('button', 'lg-select-option', option.textContent);
                choice.type = 'button';
                choice.dataset.lgSelectIndex = String(index);
                choice.setAttribute('role', 'option');
                choice.setAttribute('aria-selected', String(option.selected));
                choice.tabIndex = option.selected ? 0 : -1;
                choice.disabled = option.disabled;
                choice.addEventListener('click', () => choose(state, index));
                picker.append(choice);
            });
            picker.hidden = false;
            position();
            const current = selectedIndex(state);
            const options = choices();
            const choice = options.find(node => Number(node.dataset.lgSelectIndex) === current) || options[
                direction === 'up' ? options.length - 1 : 0
            ];
            choice?.focus();
        };
        const triggerElement = triggerClass => {
            const trigger = element('button', 'emby-button lg-select-trigger' + (triggerClass ? ' ' + triggerClass : ''));
            trigger.type = 'button';
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');
            return trigger;
        };
        const register = ({ control, shell, trigger, portal, restore = null }) => {
            const state = { control, shell, trigger, portal, sync: () => sync(state) };
            states.add(state);
            stateByControl.set(control, state);
            trigger.addEventListener('click', () => open(state));
            trigger.addEventListener('keydown', event => {
                if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
                event.preventDefault();
                open(state, event.key === 'ArrowDown' ? 'down' : 'up');
            });
            control.addEventListener('change', state.sync);
            const observer = new MutationObserver(state.sync);
            observer.observe(control, { attributes: true, attributeFilter: ['disabled'], childList: true, subtree: true });
            state.destroy = () => {
                if (!states.delete(state)) return;
                if (active === state) close(false);
                observer.disconnect();
                stateByControl.delete(control);
                restore?.();
            };
            return state;
        };
        const create = ({ shellClass = '', controlClass = '', triggerClass = '', portal = document.body } = {}) => {
            const control = element('select', 'lg-select-native' + (controlClass ? ' ' + controlClass : ''));
            const shell = element('div', 'lg-select' + (shellClass ? ' ' + shellClass : ''));
            const trigger = triggerElement(triggerClass);
            control.tabIndex = -1;
            control.setAttribute('aria-hidden', 'true');
            shell.append(control, trigger);
            return register({ control, shell, trigger, portal });
        };
        const adopt = (control, { shellClass = '', triggerClass = '', portal = document.body } = {}) => {
            const existing = stateByControl.get(control);
            if (existing) return existing;
            if (!(control instanceof HTMLSelectElement) || !control.parentElement) return null;
            const parent = control.parentElement;
            const shell = element('div', 'lg-select' + (shellClass ? ' ' + shellClass : ''));
            const trigger = triggerElement(triggerClass);
            const original = {
                tabIndex: control.tabIndex,
                ariaHidden: control.getAttribute('aria-hidden'),
                labels: []
            };
            const triggerId = control.id ? control.id + '-trigger' : 'lg-select-trigger-' + ++generatedId;
            trigger.id = triggerId;
            if (control.id) {
                const labels = [...document.querySelectorAll('label[for]')].filter(label => label.htmlFor === control.id);
                labels.forEach((label, index) => {
                    original.labels.push({ label, htmlFor: label.htmlFor, id: label.id });
                    if (!label.id) label.id = control.id + '-label-' + index;
                    label.htmlFor = triggerId;
                });
                if (labels.length) trigger.setAttribute('aria-labelledby', labels.map(label => label.id).join(' '));
            }
            if (!trigger.hasAttribute('aria-labelledby') && control.hasAttribute('aria-labelledby')) {
                trigger.setAttribute('aria-labelledby', control.getAttribute('aria-labelledby'));
            }
            if (!trigger.hasAttribute('aria-labelledby') && control.hasAttribute('aria-label')) {
                trigger.setAttribute('aria-label', control.getAttribute('aria-label'));
            }
            control.classList.add('lg-select-native');
            control.tabIndex = -1;
            control.setAttribute('aria-hidden', 'true');
            parent.insertBefore(shell, control);
            shell.append(control, trigger);
            return register({
                control, shell, trigger, portal,
                restore: () => {
                    original.labels.forEach(({ label, htmlFor, id }) => {
                        label.htmlFor = htmlFor;
                        if (id) label.id = id;
                        else label.removeAttribute('id');
                    });
                    control.classList.remove('lg-select-native');
                    control.tabIndex = original.tabIndex;
                    if (original.ariaHidden === null) control.removeAttribute('aria-hidden');
                    else control.setAttribute('aria-hidden', original.ariaHidden);
                    if (shell.parentElement) shell.before(control);
                    shell.remove();
                }
            });
        };
        listen(document, 'pointerdown', event => {
            if (active && !active.shell.contains(event.target) && !picker.contains(event.target)) close(false);
        }, true);
        listen(document, 'keydown', event => {
            if (!active) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                close(true);
                return;
            }
            const options = choices();
            const current = options.indexOf(document.activeElement);
            if (event.key === 'Home' || event.key === 'End' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
                    Math.min(options.length - 1, Math.max(0, current + (event.key === 'ArrowDown' ? 1 : -1)));
                options[index]?.focus();
                return;
            }
            if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.dataset.lgSelectIndex !== undefined) {
                event.preventDefault();
                choose(active, Number(document.activeElement.dataset.lgSelectIndex));
            }
        });
        listen(window, 'resize', position);
        listen(window, 'scroll', position, true);
        listen(document, 'visibilitychange', () => { if (document.hidden) close(false); });
        return {
            create,
            adopt,
            get: control => stateByControl.get(control) || null,
            stop() {
                close(false);
                [...states].forEach(state => state.destroy());
                picker.remove();
            }
        };
    }
    const selectController = createSelectController();
    // Preference selects - Host pages use native selects inside a scrolling view. Adopt each regular
    // field on those pages so the shared picker keeps its viewport position; media-track selects keep
    // their dedicated playback behavior.
    const preferenceSelects = new Set();
    function clearPreferenceSelects() {
        for (const select of preferenceSelects) select.destroy();
        preferenceSelects.clear();
    }
    function syncPreferenceSelects() {
        if (!route().startsWith('#/mypreferences')) {
            clearPreferenceSelects();
            return;
        }
        const current = new Set();
        for (const control of document.querySelectorAll('select.emby-select,select.emby-select-withcolor')) {
            if (!(control instanceof HTMLSelectElement)) continue;
            const existing = selectController.get(control);
            if (existing) {
                if (existing.shell.classList.contains('lg-host-select')) {
                    existing.sync();
                    preferenceSelects.add(existing);
                    current.add(existing);
                }
                continue;
            }
            if (control.multiple || control.size > 1 || control.classList.contains('detailTrackSelect') ||
                control.classList.contains('lg-select-native')) continue;
            const select = selectController.adopt(control, { shellClass: 'lg-host-select' });
            if (!select) continue;
            select.sync();
            preferenceSelects.add(select);
            current.add(select);
        }
        for (const select of [...preferenceSelects]) {
            if (!select.control.isConnected || !current.has(select)) {
                select.destroy();
                preferenceSelects.delete(select);
            }
        }
    }
    // Owned attributes - Attributes written on native controls keep the value they replaced and one
    // value per owner; releasing one shows the next, unless the page has written its own since.
    const ownedAttributes = new Map();
    const writeAttribute = (node, name, value) => value === null ? node.removeAttribute(name) : node.setAttribute(name, value);
    // Owners - By precedence: a compact library label is visible, a title the tooltip moved is not.
    const OWNERS = ['library-label', 'tooltip', 'library-popovers', 'menus'];
    const ownedValue = entry => {
        const owner = OWNERS.find(name => entry.claims.has(name));
        return owner ? entry.claims.get(owner) : entry.original;
    };
    function setOwnedAttribute(node, name, value, owner) {
        const owned = ownedAttributes.get(node) || new Map();
        if (!owned.has(name)) {
            if (node.getAttribute(name) === value) return;
            owned.set(name, { original: node.getAttribute(name), claims: new Map() });
            ownedAttributes.set(node, owned);
        }
        const entry = owned.get(name);
        entry.claims.set(owner, value);
        const shown = ownedValue(entry);
        if (node.getAttribute(name) !== shown) writeAttribute(node, name, shown);
    }
    function releaseOwnedAttribute(node, name, owner) {
        const owned = ownedAttributes.get(node), entry = owned?.get(name);
        if (!entry?.claims.has(owner)) return;
        const shown = ownedValue(entry);
        entry.claims.delete(owner);
        const next = ownedValue(entry);
        if (node.getAttribute(name) === shown && next !== shown) writeAttribute(node, name, next);
        if (entry.claims.size) return;
        owned.delete(name);
        if (!owned.size) ownedAttributes.delete(node);
    }
    function restoreOwnedAttributes() {
        for (const [node, owned] of ownedAttributes) {
            for (const [name, entry] of owned) {
                const shown = ownedValue(entry);
                if (node.getAttribute(name) === shown && entry.original !== shown) writeAttribute(node, name, entry.original);
            }
        }
        ownedAttributes.clear();
    }
    function pruneOwnedAttributes() {
        for (const node of ownedAttributes.keys()) if (!node.isConnected) ownedAttributes.delete(node);
    }
    // Names - The text a control gives assistive technology: hidden parts (aria-hidden icons) do not count.
    const ownText = node => [...node.childNodes].map(child => child.nodeType === Node.TEXT_NODE ? child.nodeValue :
        child instanceof Element && !child.matches('[aria-hidden="true"],.hide,[hidden]') ? ownText(child) : '').join('');
    // Names - The theme names a control only while it has no name of its own: no text, no
    // aria-labelledby, and no aria-label but the one the theme shows (the page may replace it).
    function mayName(node) {
        const entry = ownedAttributes.get(node)?.get('aria-label'), label = node.getAttribute('aria-label');
        if (node.hasAttribute('aria-labelledby') || ownText(node).trim()) return false;
        return !label?.trim() || (Boolean(entry) && label === ownedValue(entry));
    }
    // Page cards - The pages syncPageCard() marks; Backdrops reads them too.
    const PAGE_CARD_PAGES = '.lg-collection-page,.lg-library-page';

    // =====================================================================
    // Backdrops
    // =====================================================================
    let lastBackdrop = '', lastBackdropKey = '', backdropRequest = null;
    // Backdrops - The item fields a backdrop URL needs.
    const BACKDROP_FIELDS = 'BackdropImageTags,ParentBackdropImageTags,ParentBackdropItemId';
    const backdropArt = url => 'url(' + JSON.stringify(url) + ')';
    const imageUrl = (api, id, type, tag, maxWidth) =>
        api.getUrl('Items/' + encodeURIComponent(id) + '/Images/' + type, { tag, maxWidth, quality: 90 });
    function backdropUrl(api, item) {
        const id = item.BackdropImageTags?.length ? item.Id : item.ParentBackdropItemId;
        const tag = item.BackdropImageTags?.[0] || item.ParentBackdropImageTags?.[0];
        if (!id || !tag) return '';
        try {
            return imageUrl(api, id, 'Backdrop/0', tag, 1920);
        } catch { return ''; }
    }
    // Images - Load off-screen: loaded resolves with the image once it has pixels, or with null on
    // an error, after timeout ms (0: none) or on cancel(), which also stops the download.
    function loadImage(url, timeout = 0) {
        const image = new Image();
        let cancel = () => {};
        const loaded = new Promise(resolve => {
            let done = false, timer = 0;
            const finish = ok => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                image.onload = image.onerror = null;
                if (!ok) image.removeAttribute('src');
                resolve(ok ? image : null);
            };
            if (timeout) timer = setTimeout(() => finish(false), timeout);
            cancel = () => finish(false);
            image.onload = () => finish(image.naturalWidth > 0);
            image.onerror = () => finish(false);
            image.src = url;
        });
        return { loaded, cancel };
    }
    function cancelBackdropRequest() {
        backdropRequest?.cancel();
        backdropRequest = null;
    }
    // Backdrops - The URL of the first of four items whose backdrop loads within 5 s, or null.
    // scene.cancelImage ends the wait early, and a scene that stops being current ends the search.
    async function firstLoadedBackdrop(api, items, scene, current) {
        for (const url of items.map(item => backdropUrl(api, item)).filter(Boolean).slice(0, 4)) {
            if (!current()) return null;
            const request = loadImage(url, 5000);
            scene.cancelImage = request.cancel;
            const image = await request.loaded;
            if (scene.cancelImage === request.cancel) scene.cancelImage = null;
            if (!current()) return null;
            if (image) return url;
        }
        return null;
    }
    function rememberBackdrop(art, key, page) {
        if (stopped || !key) return;
        const match = /^url\(["']?(.*?)["']?\)$/.exec(art || '');
        if (!match || !match[1]) return;
        const hash = location.hash, remembered = art === lastBackdrop && key === lastBackdropKey;
        const requested = backdropRequest?.art === art && backdropRequest.key === key && backdropRequest.page === page &&
            backdropRequest.hash === hash;
        // Remembered with no other load, or already requested: return before the checks below,
        // which would read a computed style on every pass.
        if (remembered ? !backdropRequest || backdropRequest.art === art : requested) return;
        if (!enabled() || key !== sessionKey(currentClient()) || !visible(page)) return;
        cancelBackdropRequest();
        if (remembered) return;
        // A failed request is kept, so the same art is not refetched until the view or URL changes.
        const request = { art, key, page, hash, ...loadImage(match[1]) };
        backdropRequest = request;
        void request.loaded.then(image => {
            if (!image || backdropRequest !== request || stopped || !enabled() ||
                key !== sessionKey(currentClient()) || location.hash !== hash || !visible(page)) {
                return;
            }
            lastBackdrop = art;
            lastBackdropKey = key;
        });
    }
    function clearLastBackdrop() {
        lastBackdrop = '';
        lastBackdropKey = '';
        cancelBackdropRequest();
        document.documentElement.classList.toggle('lg-has-last-backdrop', false);
        document.documentElement.style.removeProperty('--lg-last-backdrop');
    }
    // Backdrops - Reuse the session's last backdrop on pages without their own (search, settings).
    // key is empty while the theme is inactive or nobody is signed in.
    function syncLastBackdrop(key) {
        const root = document.documentElement;
        if (!key || (lastBackdropKey && key !== lastBackdropKey)) {
            clearLastBackdrop();
            return;
        }
        const currentRoute = route();
        const page = [...document.querySelectorAll('.page')].find(visible);
        // Whole route segments only: preference routes also contain "home" or "playback".
        const excluded = /^#\/(?:home|details|video|playback|queue|login|signin|wizard|setup)(?:\/|$)/i.test(currentRoute);
        const hasOwnBackdrop = page && (page.matches('.itemDetailPage,' + PAGE_CARD_PAGES) ||
            [...page.querySelectorAll('.itemBackdrop')].some(visible));
        // Loading routes may have no page: keep this boolean, or the class toggle below would loop.
        const eligible = currentRoute === '#/search' || Boolean(page && !excluded && !hasOwnBackdrop);
        const active = eligible && !!lastBackdrop && key === lastBackdropKey;
        root.classList.toggle('lg-has-last-backdrop', active);
        if (!active) {
            root.style.removeProperty('--lg-last-backdrop');
        } else if (root.style.getPropertyValue('--lg-last-backdrop') !== lastBackdrop) {
            root.style.setProperty('--lg-last-backdrop', lastBackdrop);
        }
    }
    const shuffle = list => {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    };
    // Random items - A one-item probe gives the total, then a window at a random index reaches the
    // whole catalog even when a client ignores random sorting.
    async function randomItems(api, userId, query, limit) {
        const probe = await api.getItems(userId, { ...query, Limit: 1 });
        if (!probe?.Items?.length) return [];
        const start = Math.floor(Math.random() * Math.max(1, (probe.TotalRecordCount || 0) - limit + 1));
        const result = await api.getItems(userId, { ...query, SortBy: 'Random', StartIndex: start, Limit: limit });
        return shuffle(result?.Items?.length ? result.Items : probe.Items);
    }
    // Picked items - One request: the variety of collections comes from which ones are picked.
    async function pickedItems(api, userId, query, limit, pool) {
        const result = await api.getItems(userId, { ...query, SortBy: 'Random', Limit: pool });
        return shuffle(result?.Items || []).slice(0, limit);
    }
    // Collections - A folder of collections has no media: two random collections
    // stand in for it, each passed to onItems as it answers, so a slow one never holds the other.
    async function collectionItems(api, userId, parentId, query, limit, onItems) {
        const collections = await pickedItems(api, userId,
            { ParentId: parentId, IncludeItemTypes: 'BoxSet', EnableImages: false, EnableUserData: false }, 2, 100);
        await Promise.all(collections.map(collection =>
            pickedItems(api, userId, { ...query, ParentId: collection.Id }, limit, limit).then(onItems, () => {})));
    }
    async function randomMedia(api, userId, parentId, query, limit) {
        const items = await randomItems(api, userId, { ...query, ParentId: parentId }, limit);
        if (items.length) return items;
        const found = [];
        await collectionItems(api, userId, parentId, query, limit, part => found.push(...part));
        return shuffle(found).slice(0, limit);
    }
    // Budget - Waits for a promise at most ms; the caller ignores what settles later.
    const within = (promise, ms) => new Promise(resolve => {
        const timer = setTimeout(resolve, ms);
        const done = () => {
            clearTimeout(timer);
            resolve();
        };
        promise.then(done, done);
    });

    // =====================================================================
    // Home
    // =====================================================================
    // State - generation and action drop stale loads and Play requests; pending is a Play awaiting its
    // page; heroParts holds the banner's nodes (null for the empty shell); heroEmpty: nothing to show.
    let hero = null, heroParts = null, homeScene = null, items = [], client = null, identity = '', index = 0;
    let loading = false, retryAt = 0, generation = 0, lastError = '', heroEmpty = false;
    let elapsed = 0, lastTick = 0, frame = 0, wasRunning = false, hovered = false, touching = false;
    let pending = null, action = 0;
    const SLIDE_COUNT = 8, SLIDE_DURATION = 9000, COLLECTION_BUDGET = 60;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    // Details pages - The item id each page last showed (viewbeforeshow, in the task that shows the page;
    // viewshow comes frames later): a Play and the collection mark wait for the page of their item.
    const viewIds = new WeakMap();
    const rememberViewId = e => {
        if (e.target instanceof Element && e.target.matches('.itemDetailPage') && e.detail?.params?.id) {
            viewIds.set(e.target, e.detail.params.id);
        }
    };
    listen(document, 'viewbeforeshow', rememberViewId, true);
    listen(document, 'viewshow', rememberViewId, true);
    const details = item => {
        const q = new URLSearchParams({ id: item.Id });
        const server = client?.serverId?.();
        if (server) q.set('serverId', server);
        return '#/details?' + q;
    };
    function removeHero() {
        homeScene?.cancelImage?.();
        homeScene = null;
        hero?.remove();
        hero = null;
        heroParts = null;
        cancelAnimationFrame(frame);
        frame = 0;
        document.documentElement.classList.toggle('lg-has-home-backdrop', false);
        document.documentElement.style.removeProperty('--lg-backdrop');
        hovered = touching = false;
    }
    function removePlayNotices() {
        document.querySelectorAll('.lg-playback-notice').forEach(node => node.remove());
    }
    // Reset - Drops in-flight loads and Play requests: the next mount loads again.
    function clearHome() {
        generation++;
        action++;
        pending = null;
        loading = false;
        removeHero();
        removePlayNotices();
    }
    // Session - Another user or server drops the items and whatever is in flight for the last one.
    function syncHomeSession(api, key) {
        client = api;
        if (key === identity) return;
        clearHome();
        items = [];
        retryAt = 0;
        heroEmpty = false;
        identity = key;
    }
    const homeSections = page => page && [...page.querySelectorAll('.homeSectionsContainer')].find(visible);
    // Recent titles - A home row links to tab=1 of one library. Its matching navigation link provides
    // the library label already chosen by Jellyfin, so simplification never needs translated title text.
    function clearHomeLibraryTitles() {
        document.querySelectorAll('[data-lg-home-recent-title]').forEach(heading => {
            if (heading.textContent === heading.dataset.lgHomeRecentLabel) {
                setText(heading, heading.dataset.lgHomeRecentTitle);
            }
            delete heading.dataset.lgHomeRecentTitle;
            delete heading.dataset.lgHomeRecentLabel;
        });
    }
    function syncHomeLibraryTitles() {
        if (!enabled() || !settings.homeLibraryNamesOnly || !home()) {
            clearHomeLibraryTitles();
            return;
        }
        const page = [...document.querySelectorAll('.homePage')].find(visible);
        if (!page) return;
        const labels = new Map();
        for (const link of document.querySelectorAll('.lnkMediaFolder[href]')) {
            const query = new URLSearchParams(link.getAttribute('href').split('?')[1] || '');
            const id = idKey(query.get('topParentId')), label = link.textContent.trim();
            if (id && label && !labels.has(id)) labels.set(id, label);
        }
        for (const heading of page.querySelectorAll('.verticalSection .sectionTitleContainer > a.more.sectionTitleTextButton[href] > .sectionTitle')) {
            const query = new URLSearchParams(heading.parentElement.getAttribute('href').split('?')[1] || '');
            const label = labels.get(idKey(query.get('topParentId')));
            if (query.get('tab') !== '1' || !label) continue;
            if (heading.textContent !== heading.dataset.lgHomeRecentLabel) {
                heading.dataset.lgHomeRecentTitle = heading.textContent;
            }
            heading.dataset.lgHomeRecentLabel = label;
            setText(heading, label);
        }
    }
    // Banner - A shell of its final size holds its place from the first home frame, filled by the
    // session's items or a load; none after an empty load (a later find then moves the rows once).
    function syncHero() {
        if (!settings.homeCarousel || !home() || !identity || (!items.length && heroEmpty)) return;
        const sections = homeSections([...document.querySelectorAll('.homePage')].find(visible));
        if (!sections) return;
        if (!hero?.isConnected || hero.parentNode !== sections.parentNode) {
            removeHero();
            sections.before(createHero());
            if (!items.length) return;
        } else if (heroParts || !items.length) {
            return;
        } else {
            // Slides that arrive in a shell already shown fade in (stylesheet).
            hero.classList.toggle('lg-is-arriving', true);
        }
        fillHero();
        render(0);
    }
    async function mount() {
        if (stopped) return;
        if (!enabled()) {
            clearHome();
            return;
        }
        consumePlay();
        const api = currentClient(), key = sessionKey(api);
        syncHomeSession(api, key);
        if (!home() || !key) {
            // The banner stays while its page still shows: Jellyfin swaps pages after the route.
            if (!visible(hero)) removeHero();
            return;
        }
        const page = [...document.querySelectorAll('.homePage')].find(visible);
        const sections = homeSections(page);
        if (!sections) return;
        if (!settings.homeCarousel && homeScene?.page === page && homeScene.key === key) return;
        if (heroParts && hero?.isConnected && hero.parentNode === sections.parentNode) return;
        if (!items.length) {
            if (loading || Date.now() < retryAt) return;
            loading = true;
            const run = ++generation;
            try {
                const userId = api.getCurrentUserId();
                const query = {
                    IncludeItemTypes: 'Movie,Series', Recursive: true, EnableImages: true, ImageTypes: 'Backdrop,Primary',
                    Fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear,ProviderIds,' + BACKDROP_FIELDS
                };
                // Library-scoped queries make each library contribute. Ten
                // items per view give every library a share instead of the largest one.
                const views = (await api.getUserViews({}, userId))?.Items || [];
                const parts = views.map(() => []);
                const direct = views.map((view, i) => randomItems(api, userId, { ...query, ParentId: view.Id }, 10)
                    .then(items => { parts[i] = items; }, () => {}));
                // A folder of collections turns to them at once; a slow response joins only within the
                // budget and can finish warming up in the background.
                const collections = direct.map((done, i) => done.then(() => parts[i].length ? null :
                    collectionItems(api, userId, views[i].Id, query, 10, items => parts[i].push(...items))).catch(() => {}));
                await Promise.all(direct);
                await within(Promise.all(collections), COLLECTION_BUDGET);
                // Each work once: one film can sit in two libraries (HD, 4K) under two ids. Provider ids
                // compare within a type, as TMDB numbers films and series apart.
                const seen = new Set();
                const work = x => x.Type + ':' + (x.ProviderIds?.Tmdb || x.ProviderIds?.Imdb || x.ProviderIds?.Tvdb || x.Id);
                const candidates = shuffle(parts.flatMap(part => shuffle([...part]).slice(0, 10))
                    .filter(x => x.Id && x.Name && backdropUrl(api, x) && !seen.has(work(x)) && seen.add(work(x))));
                if (stopped || run !== generation || key !== sessionKey(currentClient())) return;
                lastError = '';
                items = candidates.slice(0, SLIDE_COUNT);
            } catch {
                lastError = 'Library loading failed; retrying in 30 seconds.';
            } finally {
                if (run === generation) {
                    loading = false;
                    retryAt = Date.now() + 30000;
                }
            }
        }
        if (stopped || !home() || !enabled() || key !== sessionKey(currentClient()) || !sections.isConnected || !visible(page)) return;
        if (!settings.homeCarousel) {
            void mountHomeBackdrop(page, key);
            return;
        }
        // No item to show: the shell leaves, and the rows move up once.
        heroEmpty = !items.length;
        if (heroEmpty) {
            removeHero();
            return;
        }
        syncHero();
    }
    // Home backdrop - --lg-backdrop and the class that shows it, for the banner and the still backdrop.
    function showHomeBackdrop(art) {
        const root = document.documentElement;
        if (root.style.getPropertyValue('--lg-backdrop') !== art) root.style.setProperty('--lg-backdrop', art);
        root.classList.toggle('lg-has-home-backdrop', true);
    }
    // Still backdrop - Show the first of four candidates whose image loads; no retries.
    async function mountHomeBackdrop(page, key) {
        const scene = { page, key, cancelImage: null };
        homeScene = scene;
        const current = () => homeScene === scene && !stopped && enabled() && home() &&
            visible(page) && key === sessionKey(currentClient());
        if (!current()) return;
        if (lastBackdrop && lastBackdropKey === key) showHomeBackdrop(lastBackdrop);
        const url = await firstLoadedBackdrop(client, items, scene, current);
        if (!url) return;
        showHomeBackdrop(backdropArt(url));
        rememberBackdrop(backdropArt(url), key, page);
    }
    // Banner - The section and its listeners; fillHero() adds the slides.
    function createHero() {
        hero = element('section', 'lg-hero');
        hero.id = 'lg-hero';
        hero.addEventListener('mouseenter', () => { hovered = true; });
        hero.addEventListener('mouseleave', () => {
            hovered = false;
            resumeClock();
        });
        hero.addEventListener('focusout', resumeClock);
        // Stop touches from reaching Jellyfin's tab swipe; passive keeps native scrolling and zoom.
        for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
            hero.addEventListener(type, e => e.stopPropagation(), { passive: true });
        }
        // Swipes use pointer events (the stylesheet sets pan-y): 48px, mostly horizontal. A
        // vertical move over 12px is left to scrolling. Listeners go away with the banner.
        let gesture = null, suppressClickUntil = 0;
        const endGesture = () => {
            gesture = null;
            touching = false;
            resumeClock();
        };
        hero.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
            if (!e.isPrimary) {
                endGesture();
                return;
            }
            suppressClickUntil = 0;
            if (items.length < 2) return;
            gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
            touching = true;
        }, { passive: true });
        hero.addEventListener('pointermove', e => {
            if (!gesture || gesture.id !== e.pointerId) return;
            const dx = Math.abs(e.clientX - gesture.x), dy = Math.abs(e.clientY - gesture.y);
            if (dy > 12 && dy > dx) endGesture();
        }, { passive: true });
        hero.addEventListener('pointerup', e => {
            if (!gesture || gesture.id !== e.pointerId) return;
            const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
            endGesture();
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
            suppressClickUntil = performance.now() + 700;
            render(index + (dx < 0 ? 1 : -1));
        }, { passive: true });
        hero.addEventListener('pointercancel', endGesture, { passive: true });
        hero.addEventListener('click', e => {
            // Swallow the click a swipe fires (within 700 ms): it must not play or open details.
            if (e.detail !== 0 && performance.now() < suppressClickUntil) {
                e.preventDefault();
                e.stopImmediatePropagation();
                suppressClickUntil = 0;
            }
        }, true);
        return hero;
    }
    function fillHero() {
        const backdrops = element('div', 'lg-hero-backdrops');
        backdrops.setAttribute('aria-hidden', 'true');
        for (const item of items) {
            const slide = element('div');
            slide.style.backgroundImage = backdropArt(backdropUrl(client, item));
            backdrops.append(slide);
        }
        const parts = {
            slides: [...backdrops.children], kicker: element('div', 'lg-hero-kicker'), title: element('a'),
            meta: element('div', 'lg-hero-meta'), overview: element('p', 'lg-hero-overview'),
            play: element('button', 'lg-hero-button lg-hero-play'), info: element('a', 'lg-hero-button lg-hero-info'),
            dots: [], status: element('p', 'lg-hero-status')
        };
        const inner = element('div', 'lg-hero-content'), title = element('h1', 'lg-hero-title');
        title.append(parts.title);
        inner.append(parts.kicker, title, parts.meta, parts.overview);
        const actions = element('div', 'lg-hero-actions');
        parts.play.type = 'button';
        parts.play.addEventListener('click', () => play(items[index], parts.play));
        const infoIcon = element('span', 'material-icons info');
        infoIcon.setAttribute('aria-hidden', 'true');
        parts.info.append(infoIcon);
        actions.append(parts.play, parts.info);
        inner.append(actions);
        const controls = element('div', 'lg-hero-controls'), dots = element('div', 'lg-hero-dots');
        items.forEach((item, i) => {
            const button = element('button', 'lg-hero-dot');
            button.type = 'button';
            button.setAttribute('aria-label', item.Name);
            button.addEventListener('click', () => render(i));
            parts.dots.push(button);
            dots.append(button);
        });
        controls.append(dots);
        parts.status.setAttribute('role', 'status');
        parts.status.hidden = true;
        hero.append(backdrops, element('div', 'lg-hero-scrim'), inner, controls, parts.status);
        heroParts = parts;
    }
    // Labels - Written by every render and language pass, so a language change needs no rebuild.
    function syncHeroLabels() {
        const parts = heroParts;
        if (!parts) return;
        setAttribute(hero, 'aria-label', translate('MoviesAndShows'));
        setText(parts.play, translate('Play'));
        setText(parts.kicker, items[index] ? translate(items[index].Type === 'Series' ? 'Series' : 'Movie') : '');
        setAttribute(parts.info, 'aria-label', translate('ItemDetails'));
        // The tooltip controller moves title to data-lg-tooltip.
        setAttribute(parts.info, parts.info.hasAttribute('data-lg-tooltip') ? 'data-lg-tooltip' : 'title', translate('ItemDetails'));
        setText(parts.status, parts.status.dataset.lgHeroStatus ? translate(parts.status.dataset.lgHeroStatus) : '');
    }
    function render(next) {
        if (!heroParts || !items.length) return;
        elapsed = 0;
        lastTick = performance.now();
        wasRunning = false;
        index = (next + items.length) % items.length;
        const item = items[index], parts = heroParts;
        const art = backdropArt(backdropUrl(client, item));
        showHomeBackdrop(art);
        rememberBackdrop(art, identity, hero);
        parts.slides.forEach((n, i) => n.classList.toggle('lg-is-active', i === index));
        parts.dots.forEach((n, i) => {
            n.classList.toggle('lg-is-active', i === index);
            n.setAttribute('aria-current', String(i === index));
        });
        parts.title.textContent = item.Name;
        parts.title.href = details(item);
        const meta = [item.ProductionYear, item.CommunityRating ? '★ ' + Number(item.CommunityRating).toFixed(1) : '',
            item.OfficialRating, item.Genres?.[0]].filter(Boolean);
        parts.meta.textContent = meta.join(' · ');
        parts.overview.textContent = item.Overview || '';
        parts.info.href = details(item);
        setStatus('');
        syncHeroLabels();
        resumeClock();
    }
    // Carousel - The clock runs on animation frames only while the banner can advance; whatever
    // paused it (hover, touch, focus, a Play request, a hidden tab) resumes it.
    function resumeClock() {
        if (!frame && hero) frame = requestAnimationFrame(tick);
    }
    function tick(now) {
        frame = 0;
        const running = !!(hero?.isConnected && items.length > 1 && home() && !document.hidden && !motion.matches &&
            !hovered && !touching && !hero.contains(document.activeElement) && !hero.querySelector('[aria-busy="true"]'));
        if (running && wasRunning && lastTick) {
            const delta = now - lastTick;
            // A gap over 250 ms means the tab or device was suspended: do not count it.
            if (delta < 250) elapsed += delta;
            if (elapsed >= SLIDE_DURATION) render(index + 1);
        }
        wasRunning = running;
        lastTick = now;
        if (running) resumeClock();
    }
    // Playback - Open the details page (a series' next episode) for consumePlay() to start.
    async function play(item, button) {
        const attempt = ++action, key = identity, api = client, user = api.getCurrentUserId();
        const initialRoute = location.hash;
        const current = () => !stopped && attempt === action && key === sessionKey(currentClient()) && location.hash === initialRoute;
        let status = '';
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        setStatus('MessagePleaseWait');
        try {
            let target = item;
            if (item.Type === 'Series') {
                const next = await api.getNextUpEpisodes({ UserId: user, SeriesId: item.Id, Limit: 1 });
                target = next?.Items?.[0];
                if (!target) {
                    if (current()) location.hash = details(item);
                    return;
                }
            }
            if (!current()) return;
            removePlayNotices();
            pending = { id: target.Id, key, until: Date.now() + 45000 };
            location.hash = details(target);
        } catch {
            status = 'ErrorDefault';
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            if (attempt === action) setStatus(status);
            resumeClock();
        }
    }
    // Playback - Press the native Play once streams are ready, within 45 s; past that,
    // explain on the page why playback did not start.
    function consumePlay() {
        if (!pending) return;
        const sameDetails = route() === '#/details' && sameId(params().get('id'), pending.id);
        const page = sameDetails &&
            [...document.querySelectorAll('.itemDetailPage')].find(n => visible(n) && sameId(viewIds.get(n), pending.id));
        const expired = Date.now() > pending.until;
        if (expired || !enabled() || sessionKey(currentClient()) !== pending.key || !sameDetails) {
            if (expired && sameDetails) announcePlayFailure(page);
            pending = null;
            return;
        }
        if (!page) return;
        if (page.querySelector('.remux-no-streams')) {
            announcePlayFailure(page);
            pending = null;
            return;
        }
        const button = page.querySelector('.mainDetailButtons .btnPlay, .detailPagePrimaryContainer .btnPlay');
        const ready = page.querySelector('.remux-streams-ready') || button?.closest('.remux-streams-ready');
        if (!ready || !visible(button) || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
        pending = null;
        button.click();
    }
    function announcePlayFailure(page) {
        const actions = page?.querySelector('.mainDetailButtons');
        if (!actions) return;
        let notice = page.querySelector('.lg-playback-notice');
        if (!notice) {
            notice = element('p', 'lg-playback-notice');
            notice.setAttribute('role', 'status');
            actions.after(notice);
        }
        notice.textContent = translate('PlaybackUnavailable');
    }
    // Status - The key is stored so the language pass retranslates the line.
    function setStatus(key) {
        const n = heroParts?.status;
        if (!n) return;
        n.dataset.lgHeroStatus = key;
        n.hidden = !key;
        setText(n, key ? translate(key) : '');
    }
    // Carousel - The clock restarts after the tab was hidden; reduced motion rebuilds the banner.
    listen(document, 'visibilitychange', () => {
        lastTick = 0;
        wasRunning = false;
        resumeClock();
    });
    listen(motion, 'change', removeHero);

    // =====================================================================
    // Header gap
    // =====================================================================
    // Header gap - The stylesheet derives --lg-page-start from the bar's bottom and main's top, written
    // here on every pass and every size change of the bar (layout observer), never later.
    let headerInset = '';
    // Header - The v12 AppBar: the navigation row, then the library controls row.
    const APP_BAR = 'header.MuiAppBar-root';
    function clearHeaderInset() {
        headerInset = '';
        const root = document.documentElement;
        root.classList.toggle('lg-has-header-gap', false);
        root.style.removeProperty('--lg-header-bottom');
        root.style.removeProperty('--lg-content-top');
        root.style.removeProperty('--lg-scrollbar-width');
    }
    // Result - Whether the values changed: the page start moved.
    function syncHeaderInset(on) {
        const header = document.querySelector(APP_BAR);
        const main = document.querySelector('main');
        let bottom = 0;
        if (on && visible(header) && main) {
            // Rows moved into a library card are absolute and no longer part of the bar.
            for (const row of header.querySelectorAll(':scope > .MuiToolbar-root')) {
                if (!visible(row) || getComputedStyle(row).position === 'absolute') continue;
                for (const child of row.children) if (visible(child)) bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
            }
        }
        if (!bottom) {
            if (!headerInset) return false;
            clearHeaderInset();
            return true;
        }
        const round = value => Math.round(value * 10) / 10;
        // Scrollbar width, read while the page can scroll: MUI pads the body by this much
        // when a menu locks scrolling, and the fixed navigation row follows (stylesheet).
        const locked = getComputedStyle(document.body).overflowY === 'hidden';
        const gutter = locked ? (headerInset.split('|')[2] || '0') : String(Math.max(0, innerWidth - document.documentElement.clientWidth));
        const root = document.documentElement;
        // The class first: it collapses Jellyfin's spacer above main (stylesheet), so main's top is
        // read where it stays, not where React would move it a frame later.
        root.classList.toggle('lg-has-header-gap', true);
        const next = `${round(bottom)}|${round(main.getBoundingClientRect().top + scrollY)}|${gutter}`;
        if (next === headerInset) return false;
        headerInset = next;
        const [headerBottom, contentTop, scrollbar] = next.split('|');
        root.style.setProperty('--lg-header-bottom', `${headerBottom}px`);
        root.style.setProperty('--lg-content-top', `${contentTop}px`);
        root.style.setProperty('--lg-scrollbar-width', `${scrollbar}px`);
        return true;
    }
    // Playback - The app navigation belongs to browsing, never to the player or its startup spinner.
    function syncPlaybackPage(on) {
        document.documentElement.classList.toggle('lg-is-playback-page', on && route() === '#/video');
    }
    // Page marks - Set on <html> while their selector matches, for rules a page-wide :has() would
    // slow down: the legacy header (rendered, hidden, in every layout), home, the now playing bar.
    const PAGE_MARKS = {
        'lg-has-legacy-header': '.skinHeader:not(.osdHeader)',
        'lg-has-home-page': '#indexPage.homePage:not(.hide)',
        'lg-has-now-playing-bar': '.nowPlayingBar:not(.hide)'
    };
    function clearPageMarks() {
        for (const name of Object.keys(PAGE_MARKS)) document.documentElement.classList.toggle(name, false);
    }
    function syncPageMarks(on) {
        for (const [name, selector] of Object.entries(PAGE_MARKS)) {
            document.documentElement.classList.toggle(name, on && document.querySelector(selector) !== null);
        }
    }

    // =====================================================================
    // Library and collection pages
    // =====================================================================
    // Scene - The open library or collection page; responses for an older scene are dropped.
    let pageCardScene = null;
    // Collections - The native items block that makes a details page a collection.
    const COLLECTION_ITEMS = '.collectionItems:not(.hide):not([hidden])';
    // Items - Name, image and type of the route's library or details item, asked once per session and
    // id as soon as the route shows it, before the page's own image requests queue up ahead of it.
    // Types - A details item's type, also read from the card that opened it: React removes a
    // library's cards before Jellyfin shows the details page.
    const routeItems = new Map(), itemTypes = new Map();
    let routeItemsKey = '';
    // Session - Both caches belong to one user on one server; returns the id's cache key.
    function routeItemName(key, id) {
        if (key !== routeItemsKey) {
            routeItems.clear();
            itemTypes.clear();
            routeItemsKey = key;
        }
        return idKey(id);
    }
    // Item - Returned when known; otherwise asked for (again 30 s after a failure), and its answer
    // runs a pass.
    function routeItem(api, key, id) {
        if (!key || !id) return null;
        const name = routeItemName(key, id);
        const known = routeItems.get(name);
        if (known && (known.item || known.loading || Date.now() < known.retry)) return known.item;
        if (typeof api?.getItem !== 'function') return null;
        const entry = { item: null, loading: true, retry: 0 };
        routeItems.set(name, entry);
        void api.getItem(api.getCurrentUserId(), id).then(item => {
            if (item && typeof item === 'object') entry.item = { Name: item.Name || '', Type: item.Type || '', ImageTags: item.ImageTags };
        }, () => {}).finally(() => {
            entry.loading = false;
            if (!entry.item) entry.retry = Date.now() + 30000;
            if (routeItems.get(name) === entry) schedule();
        });
        return null;
    }
    // Collections - A details item's type: from the card that opened it, read while it is still in
    // the document (the route changes first), else from the route's item.
    function detailsType(api, key, id) {
        if (!key) return '';
        const name = routeItemName(key, id);
        const card = itemTypes.has(name) ? null : document.querySelector(`[data-id="${CSS.escape(id)}"][data-type]`);
        if (card) itemTypes.set(name, card.getAttribute('data-type'));
        return itemTypes.get(name) || routeItem(api, key, id)?.Type || '';
    }
    // Context - The library page shown (v12 libraries use topParentId; item links may still use
    // #/list), or a collection's details page.
    function pageCardContext() {
        const path = route(), api = currentClient(), key = sessionKey(api);
        const libraryId = path !== '#/details' && (params().get('topParentId') || params().get('parentId'));
        const id = path === '#/details' && params().get('id');
        if (libraryId) {
            routeItem(api, key, libraryId);
            // Every library route shares this layout, so the page is recognized by it, not by route;
            // a known page stays recognized while a sort, filter or view change swaps its items.
            const page = [...document.querySelectorAll('.libraryPage:not(.itemDetailPage)')].find(node => visible(node) &&
                (node.querySelector('.itemsViewSettingsContainer') ||
                    node.querySelector(':scope > .padded-bottom-page .itemsContainer') ||
                    node.querySelector(':scope > :is(.verticalSection,.noItemsMessage)') ||
                    (pageCardScene?.page === node && pageCardScene.id === libraryId)));
            if (page) return { page, id: libraryId, kind: 'library', className: 'lg-library-page' };
        } else if (id) {
            // Known by its type, on the page showing its id: the old page may show until Jellyfin swaps
            // them, and a new one has no id for a frame, until Jellyfin names its item (viewinit).
            const collection = detailsType(api, key, id) === 'BoxSet';
            const page = [...document.querySelectorAll('.itemDetailPage')].find(node => visible(node) &&
                (!viewIds.has(node) || sameId(viewIds.get(node), id)) && (collection || node.querySelector(COLLECTION_ITEMS)));
            if (page) return { page, id, kind: 'collection', className: 'lg-collection-page' };
        }
        // Until Jellyfin swaps pages after a route change, the page still shown keeps its card.
        const scene = pageCardScene;
        return scene && visible(scene.page) ? {
            page: scene.page, id: scene.id, kind: scene.kind, className: scene.kind === 'library' ? 'lg-library-page' : 'lg-collection-page'
        } : null;
    }
    const releasePageCard = node => node.classList.remove('lg-collection-page', 'lg-library-page');
    function clearPageCardScene() {
        clearLibraryCard();
        pageCardScene?.cancelImage?.();
        pageCardScene = null;
    }
    function clearPageCard() {
        clearPageCardScene();
        document.querySelectorAll(PAGE_CARD_PAGES).forEach(releasePageCard);
        document.documentElement.classList.toggle('lg-has-library-card', false);
        document.documentElement.classList.toggle('lg-has-alpha-picker', false);
        document.documentElement.classList.toggle('lg-has-page-card-backdrop', false);
        document.documentElement.style.removeProperty('--lg-page-card-backdrop');
    }
    function syncPageCard(context) {
        if (!context) {
            clearPageCard();
            return;
        }
        const { page, id, kind, className } = context;
        const root = document.documentElement;
        document.querySelectorAll(PAGE_CARD_PAGES).forEach(node => {
            if (node !== page) releasePageCard(node);
        });
        page.classList.toggle(kind === 'library' ? 'lg-collection-page' : 'lg-library-page', false);
        page.classList.toggle(className, true);
        const api = currentClient(), key = sessionKey(api);
        if (!pageCardScene || pageCardScene.id !== id || pageCardScene.key !== key || pageCardScene.kind !== kind ||
            pageCardScene.page !== page) {
            clearPageCardScene();
            pageCardScene = { id, key, kind, page, art: 'none', loading: false, retry: 0 };
        }
        const scene = pageCardScene, art = scene.art;
        if (kind === 'library') syncLibraryCard(scene, api, key);
        // The card is marked on <html>, as a page-wide :has() made each menu open in 130 ms instead
        // of 15; read after the card is built, in the same pass: no off-on flicker.
        root.classList.toggle('lg-has-library-card', Boolean(page.querySelector('.lg-library-section')));
        // Jellyfin's letter picker shows on the library page: content reserves its width.
        root.classList.toggle('lg-has-alpha-picker', kind === 'library' && Boolean(page.querySelector('.alphaPicker-fixed-right')));
        rememberBackdrop(art, key, page);
        if (root.style.getPropertyValue('--lg-page-card-backdrop') !== art) root.style.setProperty('--lg-page-card-backdrop', art);
        root.classList.toggle('lg-has-page-card-backdrop', true);
        if (!scene.loading && scene.art === 'none' && Date.now() >= scene.retry && typeof api.getItems === 'function') {
            void loadPageCardBackdrop(scene, api);
        }
    }
    // Scene - Still the page shown, for the same session, while the theme runs.
    function sceneIsCurrent(scene) {
        const context = pageCardContext();
        return !stopped && enabled() && pageCardScene === scene && sessionKey(currentClient()) === scene.key &&
            context?.page === scene.page && context.id === scene.id && context.kind === scene.kind;
    }
    async function loadPageCardBackdrop(scene, api) {
        scene.loading = true;
        const current = () => sceneIsCurrent(scene);
        try {
            const items = await randomMedia(api, api.getCurrentUserId(), scene.id, {
                IncludeItemTypes: 'Movie,Series', Recursive: true, Fields: BACKDROP_FIELDS, EnableImages: true, ImageTypes: 'Backdrop'
            }, 8);
            if (!current()) return;
            const url = await firstLoadedBackdrop(api, items, scene, current);
            if (url) {
                scene.art = backdropArt(url);
                syncPageCard(pageCardContext());
            }
        } catch {
            // Keep the neutral background.
        } finally {
            scene.loading = false;
            scene.retry = Date.now() + 60000;
        }
    }

    // =====================================================================
    // Library card
    // =====================================================================
    // Controls - The AppBar row (node) currently drawn inside the library card.
    let libraryControlFrame = 0, libraryControlNode = null, libraryControlCard = null;
    let libraryRangeLabel = null, libraryRangeResizeObserver = null;
    // Image - The cards whose library image was asked for, once each.
    const libraryImageCards = new WeakSet();
    // Rebuild hold - Jellyfin replaces the grid (and our card) after a view, sort or filter
    // change; the controls keep their place until the card is back on the same route.
    let libraryControlRoute = '', libraryControlHoldUntil = 0, libraryControlHoldTimer = 0;
    // Placement - The last control coordinates: a change under an open popover needs a resize.
    let libraryControlPlacement = '';
    const LIBRARY_TOOLBAR = ':scope > .MuiToolbar-root:nth-child(2)';
    const libraryToolbar = () => document.querySelector(APP_BAR)?.querySelector(LIBRARY_TOOLBAR);
    const LIBRARY_CONTROL_CLASSES = ['lg-is-in-card', 'lg-is-compact', 'lg-has-view-picker', 'lg-has-pager', 'lg-has-counter'];
    const LIBRARY_CONTROL_PROPERTIES = [
        '--lg-library-controls-top', '--lg-library-controls-start', '--lg-library-controls-width',
        '--lg-library-pager-start',
        '--lg-library-view-top', '--lg-library-view-start'
    ];
    const LIBRARY_CARD_PROPERTIES = [
        '--lg-library-content-height', '--lg-library-title-offset',
        '--lg-library-view-reserve', '--lg-library-controls-reserve'
    ];
    // Libraries - The stylesheet's 699px breakpoint, where the card stacks like a collection.
    const compactLibrary = matchMedia('(max-width:699px)');
    // Labels - Compact primaries share one row, so icon-only ones (New collection, New playlist)
    // get a visible label like Play All, drawn by the stylesheet from data-lg-library-label.
    const LIBRARY_PRIMARY_LABEL_KEYS = { AddIcon: 'NewCollection', PlaylistAddIcon: 'NewPlaylist' };
    // Popovers - Each toolbar popover, its trigger (found by icon: Jellyfin links none) and the row
    // of the current choice; the view picker opens a plain MUI menu, linked by aria-controls.
    const LIBRARY_POPOVERS = [
        { kind: 'filter', id: 'filter-popover', trigger: 'svg[data-testid="FilterAltIcon"]' },
        {
            kind: 'sort', id: 'sort-popover', trigger: 'svg[data-testid="SortByAlphaIcon"]',
            current: '.MuiMenuItem-root:has(.MuiListItemIcon-root svg)'
        },
        {
            kind: 'selectview', id: 'selectview-popover', trigger: 'svg:is([data-testid="ViewModuleIcon"],[data-testid="ViewListIcon"])',
            current: '.MuiMenuItem-root:has(svg[data-testid="CheckIcon"])'
        },
        { id: 'library-view-menu', current: '.MuiMenuItem-root.Mui-selected' }
    ];
    // Popovers - MUI places a popover only when it opens or on window resize.
    const refitPopovers = () => window.dispatchEvent(new Event('resize'));
    // Popover fit - The open library popover and its settled height, to refit it once.
    const OPEN_LIBRARY_POPOVER = '[data-lg-library-popover]:not([aria-hidden="true"])';
    let libraryPopoverFit = '';
    const fittedPopovers = new Set();
    const POPOVER_FIT_TRANSITION = 'top var(--lg-duration) var(--lg-ease)';
    // Card - The library name and image drawn in the page; the AppBar controls stay native.
    function clearLibraryCard() {
        clearLibraryControls();
        document.querySelectorAll('.lg-library-section,.lg-library-title,.lg-library-image').forEach(node => node.remove());
        document.querySelectorAll('.lg-library-card').forEach(node => node.classList.remove('lg-library-card', 'lg-has-image'));
    }
    // Card - Built in the pass that recognizes the page, at its final size: the title holds its line
    // until the name arrives, the image its half once the library has one, so loads move nothing.
    function syncLibraryCard(scene, api, key) {
        let card = scene.page.querySelector('.lg-library-card');
        if (!card) {
            const nativeToolbar = scene.page.querySelector('.itemsViewSettingsContainer');
            // Grid views wrap their items; Suggestions rows and the empty message sit in the page.
            const modernContainer = scene.page.querySelector(':scope > .padded-bottom-page') ||
                (scene.page.querySelector(':scope > :is(.verticalSection,.noItemsMessage)') ? scene.page : null);
            card = nativeToolbar || (modernContainer && element('section', 'lg-library-card lg-library-section'));
            if (!card) return;
            if (!nativeToolbar) modernContainer.prepend(card);
            card.classList.toggle('lg-library-card', true);
        }
        let heading = card.querySelector('.lg-library-title');
        if (!heading) {
            heading = element('h1', 'lg-library-title');
            card.prepend(heading);
        }
        // A view switch drops the card: the session's metadata restores it at once.
        const item = routeItem(api, key, scene.id);
        if (!item) return;
        if (!heading.textContent) setText(heading, item.Name);
        // Only the library's configured image belongs here, never a random child's poster.
        if (!item.ImageTags?.Primary || libraryImageCards.has(card)) return;
        libraryImageCards.add(card);
        card.classList.toggle('lg-has-image', true);
        void loadImage(imageUrl(api, scene.id, 'Primary', item.ImageTags.Primary, 880)).loaded.then(image => {
            if (!card.isConnected || !sceneIsCurrent(scene)) return;
            // An image that fails gives its half back to the title.
            if (!image) {
                card.classList.toggle('lg-has-image', false);
                return;
            }
            image.className = 'lg-library-image';
            image.alt = '';
            card.append(image);
        });
    }
    // Pending row - On a library route Jellyfin draws the controls row under the bar before its page
    // and the card exist: the row stays hidden until it is placed in the card, at most 2 s.
    let pendingRoute = '', pendingUntil = 0;
    function clearPendingControls() {
        pendingRoute = '';
        pendingUntil = 0;
        document.querySelectorAll('[data-lg-library-pending]').forEach(node => node.removeAttribute('data-lg-library-pending'));
    }
    function syncPendingControls(on) {
        const toolbar = libraryToolbar();
        const library = on && route() !== '#/details' && Boolean(params().get('topParentId') || params().get('parentId'));
        if (library && location.hash !== pendingRoute) {
            pendingRoute = location.hash;
            pendingUntil = Date.now() + 2000;
        }
        const pending = library && Date.now() < pendingUntil && !toolbar?.classList.contains('lg-is-in-card');
        toolbar?.toggleAttribute('data-lg-library-pending', pending);
    }
    function clearLibraryControls() {
        if (libraryControlFrame) cancelAnimationFrame(libraryControlFrame);
        libraryControlFrame = 0;
        clearTimeout(libraryControlHoldTimer);
        libraryControlHoldTimer = 0;
        libraryControlHoldUntil = 0;
        libraryControlRoute = '';
        libraryRangeResizeObserver?.disconnect();
        libraryRangeLabel = null;
        if (libraryControlNode) {
            libraryControlNode.classList.remove(...LIBRARY_CONTROL_CLASSES);
            LIBRARY_CONTROL_PROPERTIES.forEach(name => libraryControlNode.style.removeProperty(name));
            clearLibraryPrimaryLabels();
        }
        LIBRARY_CARD_PROPERTIES.forEach(name => libraryControlCard?.style.removeProperty(name));
        libraryControlNode = null;
        libraryControlCard = null;
    }
    function clearLibraryPrimaryLabel(button) {
        // The label also names an unnamed button: its previous name (the tooltip's title) returns.
        releaseOwnedAttribute(button, 'aria-label', 'library-label');
        button.removeAttribute('data-lg-library-label');
    }
    function clearLibraryPrimaryLabels(root = document) {
        root.querySelectorAll('[data-lg-library-label]').forEach(clearLibraryPrimaryLabel);
    }
    function syncLibraryPrimaryLabels(toolbar, compact) {
        if (!compact) return clearLibraryPrimaryLabels(toolbar);
        for (const button of toolbar.querySelectorAll('button.MuiButton-containedPrimary')) {
            if (button.textContent.trim() || button.querySelector('.MuiButton-startIcon') ||
                button.matches('.MuiButtonGroup-grouped:not(.MuiButtonGroup-firstButton)')) {
                clearLibraryPrimaryLabel(button);
                continue;
            }
            // A name the theme wrote is not the button's own: the label follows the title instead.
            const free = mayName(button);
            const key = LIBRARY_PRIMARY_LABEL_KEYS[button.querySelector('svg[data-testid]')?.dataset.testid];
            const label = (key && translate(key)) || (!free && button.getAttribute('aria-label')) ||
                button.getAttribute('data-lg-tooltip') || button.title || '';
            if (!label) continue;
            setAttribute(button, 'data-lg-library-label', label);
            if (free) setOwnedAttribute(button, 'aria-label', label, 'library-label');
        }
    }
    // Controls - Draw the native AppBar controls inside the card: page coordinates written once per
    // layout change (never from a scroll handler), held while the grid reloads.
    function syncLibraryControls() {
        if (!libraryControlFrame) libraryControlFrame = requestAnimationFrame(placeLibraryControls);
    }
    function placeLibraryControls() {
        cancelAnimationFrame(libraryControlFrame);
        libraryControlFrame = 0;
        const card = [...document.querySelectorAll('.lg-library-page .lg-library-section')].find(visible);
        const heading = card?.querySelector('.lg-library-title');
        const toolbar = libraryToolbar(), header = toolbar?.parentElement;
        if (!heading && toolbar && libraryControlNode && location.hash === libraryControlRoute) {
            // Card rebuilding: hold the controls (and any open popover) up to 1.5 s, checked
            // every 250 ms. Sorting and filtering re-create the row: carry the placement over.
            libraryControlHoldUntil ||= Date.now() + 1500;
            if (Date.now() < libraryControlHoldUntil) {
                if (toolbar !== libraryControlNode) {
                    const previous = libraryControlNode;
                    for (const name of LIBRARY_CONTROL_CLASSES) toolbar.classList.toggle(name, previous.classList.contains(name));
                    for (const name of LIBRARY_CONTROL_PROPERTIES) {
                        const value = previous.style.getPropertyValue(name);
                        if (value) toolbar.style.setProperty(name, value);
                    }
                    libraryControlNode = toolbar;
                }
                clearTimeout(libraryControlHoldTimer);
                libraryControlHoldTimer = setTimeout(syncLibraryControls, 250);
                return;
            }
        }
        if ((libraryControlNode && libraryControlNode !== toolbar) ||
            (libraryControlCard && libraryControlCard !== card)) {
            clearLibraryControls();
        }
        if (!heading || !toolbar) {
            clearLibraryControls();
            libraryControlPlacement = '';
            return;
        }
        clearTimeout(libraryControlHoldTimer);
        libraryControlHoldTimer = 0;
        libraryControlHoldUntil = 0;
        libraryControlRoute = location.hash;
        libraryControlNode = toolbar;
        libraryControlCard = card;
        const compact = compactLibrary.matches;
        const viewButton = toolbar.querySelector('button[aria-controls="library-view-menu"]');
        const hasViewButton = Boolean(visible(viewButton));
        toolbar.classList.toggle('lg-has-view-picker', hasViewButton);
        const pager = toolbar.querySelector(':scope > .MuiStack-root > .MuiButtonGroup-root:nth-child(3)');
        const rangeLabel = toolbar.querySelector(':scope > .MuiBox-root .MuiChip-label');
        if (rangeLabel !== libraryRangeLabel) {
            libraryRangeResizeObserver?.disconnect();
            libraryRangeLabel = rangeLabel;
            if (rangeLabel) {
                libraryRangeResizeObserver ||= new ResizeObserver(syncLibraryControls);
                libraryRangeResizeObserver.observe(rangeLabel);
            }
        }
        const hasCounter = Boolean(visible(rangeLabel));
        const hasPager = Boolean(visible(pager) && hasCounter);
        toolbar.classList.toggle('lg-has-counter', hasCounter);
        toolbar.classList.toggle('lg-has-pager', hasPager);
        // Apply the card layout before measuring its controls.
        toolbar.classList.toggle('lg-is-in-card', true);
        toolbar.classList.toggle('lg-is-compact', compact);
        syncLibraryPrimaryLabels(toolbar, compact);
        const cardStyle = getComputedStyle(card);
        const insetTop = parseFloat(cardStyle.paddingTop) || 0;
        const insetBottom = parseFloat(cardStyle.paddingBottom) || 0;
        const borderTop = parseFloat(cardStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(cardStyle.borderBottomWidth) || 0;
        const headerRect = header.getBoundingClientRect();
        // Offsets run from the inline-start edge (the right one in RTL), as the stylesheet places
        // them; their -left names stay so either file can reach users first from the CDN.
        const rtl = getComputedStyle(toolbar).direction === 'rtl';
        const fromStart = (rect, box) => rtl ? box.right - rect.right : rect.left - box.left;
        if (compact) {
            // Compact: image, title and controls in one column; the card reserves their height.
            card.style.removeProperty('--lg-library-content-height');
            card.style.removeProperty('--lg-library-title-offset');
            toolbar.style.removeProperty('--lg-library-pager-start');
            const insetLeft = (parseFloat(cardStyle.paddingLeft) || 0) + (parseFloat(cardStyle.borderLeftWidth) || 0);
            const insetRight = (parseFloat(cardStyle.paddingRight) || 0) + (parseFloat(cardStyle.borderRightWidth) || 0);
            const contentWidth = card.getBoundingClientRect().width - insetLeft - insetRight;
            toolbar.style.setProperty('--lg-library-controls-width', `${contentWidth}px`);
            // Views without controls here (Suggestions) need no title gap.
            const controlsHeight = toolbar.getBoundingClientRect().height;
            const titleToControlsGap = controlsHeight ? 16 : 0;
            card.style.setProperty('--lg-library-controls-reserve',
                `${Math.ceil(controlsHeight + titleToControlsGap)}px`);
            const titleRect = heading.getBoundingClientRect();
            toolbar.style.setProperty('--lg-library-controls-top', `${titleRect.bottom + titleToControlsGap - headerRect.top}px`);
            toolbar.style.setProperty('--lg-library-controls-start',
                `${fromStart(card.getBoundingClientRect(), headerRect) + (rtl ? insetRight : insetLeft)}px`);
        } else {
            card.style.removeProperty('--lg-library-controls-reserve');
            toolbar.style.removeProperty('--lg-library-controls-width');
            // Center title and controls as one group, as the collection ribbon does natively.
            const titleHeight = heading.getBoundingClientRect().height;
            const toolbarHeight = toolbar.getBoundingClientRect().height;
            // The range text sits centered in the pager's 44px row, so 6px gives the same
            // title-to-text rhythm as collection metadata.
            const titleToControlsGap = !toolbarHeight ? 0 : hasPager ? 6 : hasCounter ? 18 : 20;
            const groupHeight = titleHeight + titleToControlsGap + toolbarHeight;
            const contentHeight = Math.ceil(groupHeight + insetTop + insetBottom + borderTop + borderBottom);
            card.style.setProperty('--lg-library-content-height', `${contentHeight}px`);
            const cardRect = card.getBoundingClientRect();
            const headingOffset = Math.max(0, (cardRect.height - groupHeight) / 2 - insetTop - borderTop);
            card.style.setProperty('--lg-library-title-offset', `${headingOffset}px`);
            const titleRect = heading.getBoundingClientRect();
            const naturalTop = titleRect.bottom + titleToControlsGap;
            toolbar.style.setProperty('--lg-library-controls-top', `${naturalTop - headerRect.top}px`);
            toolbar.style.setProperty('--lg-library-controls-start', `${fromStart(titleRect, headerRect)}px`);
            if (hasPager) {
                // The page arrows start 12px after the range text ends.
                const rangeRect = rangeLabel.getBoundingClientRect();
                toolbar.style.setProperty('--lg-library-pager-start',
                    `${fromStart(rangeRect, toolbar.getBoundingClientRect()) + rangeRect.width + 12}px`);
            } else {
                toolbar.style.removeProperty('--lg-library-pager-start');
            }
        }
        // The view picker sits 16px under the final card edge (wrapped titles included), like
        // the collection type tabs; toolbar-relative offsets make it scroll with the card.
        const cardRect = card.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        if (hasViewButton) {
            toolbar.style.setProperty('--lg-library-view-top', `${cardRect.bottom + 16 - toolbarRect.top}px`);
            toolbar.style.setProperty('--lg-library-view-start', `${fromStart(cardRect, toolbarRect)}px`);
            card.style.setProperty('--lg-library-view-reserve', `${Math.ceil(viewButton.getBoundingClientRect().height) + 16}px`);
        } else {
            toolbar.style.removeProperty('--lg-library-view-top');
            toolbar.style.removeProperty('--lg-library-view-start');
            card.style.removeProperty('--lg-library-view-reserve');
        }
        // An open popover follows its moved anchor.
        const placement = LIBRARY_CONTROL_PROPERTIES.map(name => toolbar.style.getPropertyValue(name)).join('|');
        if (libraryControlPlacement && placement !== libraryControlPlacement &&
            document.querySelector(OPEN_LIBRARY_POPOVER + ', header button[aria-expanded="true"]')) {
            refitPopovers();
        }
        libraryControlPlacement = placement;
    }
    function clearLibraryPopovers() {
        for (const paper of fittedPopovers) {
            paper.style.transition = paper.style.transition.split(/,\s*(?![^(]*\))/)
                .filter(part => part !== POPOVER_FIT_TRANSITION).join(', ');
        }
        fittedPopovers.clear();
        libraryPopoverFit = '';
        document.querySelectorAll('[data-lg-library-popover]').forEach(node => node.removeAttribute('data-lg-library-popover'));
    }
    function syncLibraryPopovers() {
        // Jellyfin removes these popover ids as soon as closing starts, while the
        // exit transition still shows them. A stable marker keeps the theme styles.
        for (const { kind, id } of LIBRARY_POPOVERS) {
            if (kind) setAttribute(document.getElementById(id), 'data-lg-library-popover', kind);
        }
        // Once the view settings expand or collapse, one resize refits the paper in the viewport.
        // Closed popovers leave the page: their papers are forgotten.
        for (const paper of fittedPopovers) if (!paper.isConnected) fittedPopovers.delete(paper);
        const paper = document.querySelector(OPEN_LIBRARY_POPOVER + ' > .MuiPopover-paper');
        const settled = paper && !paper.querySelector('.MuiCollapse-root:not(.MuiCollapse-entered):not(.MuiCollapse-hidden)');
        const kind = paper?.parentElement.dataset.lgLibraryPopover;
        const fit = settled ? `${kind}|${paper.offsetHeight}` : '';
        if (settled && libraryPopoverFit.split('|')[0] === kind && fit !== libraryPopoverFit) {
            if (!paper.style.transition.includes('top')) {
                paper.style.transition = [paper.style.transition, POPOVER_FIT_TRANSITION].filter(Boolean).join(', ');
                fittedPopovers.add(paper);
            }
            refitPopovers();
        }
        if (!paper || settled) libraryPopoverFit = fit;
        // The view settings gear is an unnamed icon button.
        const gear = document.querySelector('#selectview-popover .MuiMenuItem-root > button.MuiIconButton-root');
        if (gear && mayName(gear)) setOwnedAttribute(gear, 'aria-label', translate('ViewSettings'), 'library-popovers');
        for (const { id, current } of LIBRARY_POPOVERS) {
            const menu = current && document.getElementById(id);
            if (!menu) continue;
            menu.querySelectorAll('.MuiMenuItem-root').forEach(item => {
                setOwnedAttribute(item, 'aria-current', item.matches(current) ? 'true' : null, 'library-popovers');
            });
        }
    }

    // =====================================================================
    // Collection filter
    // =====================================================================
    // Filter - All / Movies / Shows above collections that mix both, driven by the main scheduler.
    function createCollectionFilter() {
        // Cards stay native and in order; the stylesheet hides those marked
        // data-lg-collection-filter-hidden.
        let collectionFilter = null;
        function clearCollectionFilter() {
            if (!collectionFilter) return;
            collectionFilter.bar.remove();
            collectionFilter.container.querySelectorAll('[data-lg-collection-filter-hidden]')
                .forEach(node => node.removeAttribute('data-lg-collection-filter-hidden'));
            collectionFilter = null;
        }
        function syncCollectionFilter(context, key) {
            const id = context?.id;
            const container = context?.kind === 'collection' ? context.page.querySelector(COLLECTION_ITEMS) : null;
            if (collectionFilter && (!container || collectionFilter.container !== container || collectionFilter.id !== id ||
                collectionFilter.key !== key)) {
                clearCollectionFilter();
            }
            if (!container) return;
            const cards = [...container.querySelectorAll('.card[data-type]')];
            const mixed = cards.some(node => node.dataset.type === 'Movie') && cards.some(node => node.dataset.type === 'Series');
            if (!mixed) {
                clearCollectionFilter();
                return;
            }
            if (!collectionFilter) {
                const bar = element('div', 'lg-collection-filter');
                const group = element('div', 'lg-collection-filter-group');
                group.setAttribute('role', 'group');
                const state = { container, bar, group, id, key, selected: 'All', buttons: [] };
                for (const [value, label] of [['All', 'All'], ['Movie', 'Movies'], ['Series', 'Shows']]) {
                    const button = element('button', 'lg-collection-filter-button');
                    button.type = 'button';
                    button.dataset.lgCollectionFilter = value;
                    state.buttons.push({ button, value, label });
                    button.addEventListener('click', () => {
                        if (collectionFilter !== state) return;
                        state.selected = value;
                        const session = sessionKey(currentClient());
                        syncCollectionFilter(enabled() && session ? pageCardContext() : null, session);
                    });
                    group.append(button);
                }
                group.addEventListener('keydown', event => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    const buttons = [...group.querySelectorAll('button')], current = buttons.indexOf(document.activeElement);
                    if (current < 0) return;
                    const direction = getComputedStyle(group).direction === 'rtl' ? -1 : 1;
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
                        (current + (event.key === 'ArrowRight' ? direction : -direction) + buttons.length) % buttons.length;
                    event.preventDefault();
                    buttons[next].focus();
                    buttons[next].click();
                });
                bar.append(group);
                container.before(bar);
                collectionFilter = state;
            }
            const state = collectionFilter;
            if (!state.bar.isConnected) container.before(state.bar);
            setAttribute(state.group, 'aria-label', translate('Filter'));
            for (const { button, value, label } of state.buttons) {
                setText(button, translate(label));
                setAttribute(button, 'aria-pressed', String(value === state.selected));
            }
            cards.forEach(card => {
                card.toggleAttribute('data-lg-collection-filter-hidden', state.selected !== 'All' && card.dataset.type !== state.selected);
            });
            container.querySelectorAll('.verticalSection').forEach(section => {
                const children = [...section.querySelectorAll('.card[data-type]')];
                section.toggleAttribute('data-lg-collection-filter-hidden', state.selected !== 'All' && children.length > 0 &&
                    children.every(card => card.dataset.type !== state.selected));
            });
        }
        return {
            sync: syncCollectionFilter,
            stop: clearCollectionFilter
        };
    }
    // Filter - Always built: the user's settings turn it on and off during the session.
    const collectionFilterController = createCollectionFilter();

    // =====================================================================
    // Details
    // =====================================================================
    // State - Wrapped metadata blocks and fallback backdrops, undone by stop().
    const detailMetadata = new Map();
    const detailFallbacks = new Set();
    const POSTER_SHAPES = { portraitCard: 'portrait', backdropCard: 'backdrop', squareCard: 'square' };
    const DETAILS_WITH_POSTER = '.itemDetailPage[data-lg-detail-poster]';
    function releaseFallback(backdrop) {
        backdrop.style.removeProperty('--lg-detail-fallback-backdrop');
        backdrop.classList.toggle('lg-is-fallback', false);
        detailFallbacks.delete(backdrop);
    }
    function unwrapMetadata(wrapper, tags) {
        if (wrapper.isConnected && tags.parentNode === wrapper) wrapper.before(tags);
        wrapper.remove();
        detailMetadata.delete(tags);
    }
    function clearDetails() {
        detailFallbacks.forEach(releaseFallback);
        detailMetadata.forEach(unwrapMetadata);
        for (const name of ['data-lg-track-label', 'data-lg-video-summary', 'data-lg-play-label', 'data-lg-detail-poster']) {
            document.querySelectorAll(`[${name}]`).forEach(node => node.removeAttribute(name));
        }
        document.querySelectorAll('.lg-detail-page').forEach(node => node.classList.remove('lg-detail-page'));
    }
    // Pages - lg-detail-page (not a collection) and data-lg-detail-poster (its poster's shape) replace
    // a page-wide :has(); context is this pass's collection page, known by its type before its items.
    function syncDetailPages(context) {
        document.querySelectorAll('.itemDetailPage').forEach(page => {
            const detail = context?.page !== page && !page.querySelector(COLLECTION_ITEMS);
            page.classList.toggle('lg-detail-page', detail);
            const card = detail ? page.querySelector('.detailImageContainer :is(.portraitCard,.backdropCard,.squareCard)') : null;
            // Until Jellyfin renders the item (its name), the empty page already takes the poster
            // layout's place, where the item then renders; an item without a poster leaves it.
            const shape = card ? Object.entries(POSTER_SHAPES).find(([name]) => card.classList.contains(name))[1] :
                detail && !page.querySelector('.nameContainer > *') ? 'pending' : '';
            if (shape) {
                setAttribute(page, 'data-lg-detail-poster', shape);
            } else {
                page.removeAttribute('data-lg-detail-poster');
            }
        });
    }
    // Tracks - Expose the selected track label as attributes for the stylesheet: editing a
    // select's children (selectedcontent included) can reset the selection.
    function syncTrackLabels() {
        document.querySelectorAll('.trackSelections select').forEach(select => {
            const label = select.selectedOptions[0]?.textContent || '';
            setAttribute(select, 'data-lg-track-label', label);
            const row = select.closest('.selectVideoContainer');
            if (!row) return;
            if (select.disabled) {
                setAttribute(row, 'data-lg-video-summary', label);
            } else {
                row.removeAttribute('data-lg-video-summary');
            }
        });
    }
    listen(document, 'change', () => { if (enabled()) syncTrackLabels(); }, true);
    // Play - Phones show the script's Play or Resume label (data-lg-play-label) in the button.
    function syncPlayLabels() {
        document.querySelectorAll('.itemDetailPage .btnPlay .detailButton-content').forEach(node => {
            const resume = node.closest('.itemDetailPage').querySelector('.btnReplay:not(.hide)');
            setAttribute(node, 'data-lg-play-label', translate(resume ? 'ButtonResume' : 'Play'));
        });
    }
    // Details - The poster as fallback backdrop, and secondary metadata in a collapsible block.
    function syncDetails(key, context) {
        syncDetailPages(context);
        syncTrackLabels();
        syncPlayLabels();
        for (const backdrop of detailFallbacks) {
            if (!backdrop.isConnected || !backdrop.closest(DETAILS_WITH_POSTER)) releaseFallback(backdrop);
        }
        document.querySelectorAll(DETAILS_WITH_POSTER).forEach(page => {
            const backdrop = page.querySelector('.itemBackdrop');
            const poster = page.querySelector('.detailImageContainer .cardImageContainer');
            if (!backdrop || !poster) return;
            const missing = !backdrop.style.backgroundImage || backdrop.style.backgroundImage === 'none';
            backdrop.classList.toggle('lg-is-fallback', missing);
            const posterImage = getComputedStyle(poster).backgroundImage;
            if (posterImage && posterImage !== 'none' && backdrop.style.getPropertyValue('--lg-detail-fallback-backdrop') !== posterImage) {
                backdrop.style.setProperty('--lg-detail-fallback-backdrop', posterImage);
            }
            // Tracked whenever touched, so stop() also clears a class set without a poster image.
            detailFallbacks.add(backdrop);
            if (route() === '#/details' && visible(page)) {
                rememberBackdrop(missing ? posterImage : getComputedStyle(backdrop).backgroundImage, key, page);
            }
        });
        detailMetadata.forEach((wrapper, tags) => {
            if (!tags.isConnected || !tags.closest(DETAILS_WITH_POSTER)) unwrapMetadata(wrapper, tags);
        });
        document.querySelectorAll(DETAILS_WITH_POSTER + ' .itemTags').forEach(tags => {
            if (detailMetadata.has(tags)) return;
            const wrapper = element('details', 'lg-detail-metadata');
            wrapper.append(element('summary', '', translate('ItemDetails')));
            tags.before(wrapper);
            wrapper.append(tags);
            detailMetadata.set(tags, wrapper);
        });
    }

    // =====================================================================
    // Language
    // =====================================================================
    // Language - Retranslate labels in place, without rebuilding controls or resetting the slide.
    function syncLanguage() {
        syncHeroLabels();
        document.querySelectorAll('.lg-detail-metadata > summary').forEach(node => setText(node, translate('ItemDetails')));
        document.querySelectorAll('.lg-playback-notice').forEach(node => setText(node, translate('PlaybackUnavailable')));
    }

    // =====================================================================
    // Menus
    // =====================================================================
    // Open state - MUI menus are linked through aria-controls; legacy action sheets have no link,
    // so the control clicked just before a sheet appears (within 1.5 s) is marked.
    let sheetOpener = null, sheetOpenerAt = 0, sheetTrigger = null;
    listen(document, 'click', event => {
        const control = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
        if (control && !control.closest('.dialogContainer')) {
            sheetOpener = control;
            sheetOpenerAt = Date.now();
        }
    }, true);
    function clearSheetTrigger() {
        sheetTrigger?.removeAttribute('data-lg-menu-open');
        sheetTrigger = null;
    }
    function syncMenuTriggers() {
        // Kept-mounted MUI menus stay in the DOM while closed, marked aria-hidden.
        const expanded = id => {
            const menu = document.getElementById(id);
            return String(Boolean(menu && menu.getAttribute('aria-hidden') !== 'true' && visible(menu)));
        };
        for (const trigger of document.querySelectorAll('button[aria-haspopup="true"][aria-controls]')) {
            setOwnedAttribute(trigger, 'aria-expanded', expanded(trigger.getAttribute('aria-controls')), 'menus');
        }
        // Library popover triggers have no aria-controls: they are found by icon.
        const toolbar = libraryToolbar();
        for (const { id, trigger } of LIBRARY_POPOVERS) {
            const button = trigger && toolbar?.querySelector(trigger)?.closest('button');
            if (button) setOwnedAttribute(button, 'aria-expanded', expanded(id), 'menus');
        }
        const sheet = [...document.querySelectorAll('.dialogContainer .actionSheet')].find(visible);
        if (!sheet || (sheetTrigger && !sheetTrigger.isConnected)) clearSheetTrigger();
        if (sheet && !sheetTrigger && sheetOpener?.isConnected && Date.now() - sheetOpenerAt < 1500) {
            sheetTrigger = sheetOpener;
            sheetTrigger.setAttribute('data-lg-menu-open', '');
        }
    }

    // =====================================================================
    // Tooltips
    // =====================================================================
    // Tooltips - Native title bubbles cannot be styled: while the theme is active, every title
    // moves to data-lg-tooltip as it appears, and one themed popup shows them all.
    function createTooltips() {
        // The popup joins its host (body, an open dialog or the fullscreen element) when shown.
        const popup = element('div', 'lg-tooltip');
        popup.id = 'lg-tooltip';
        popup.setAttribute('role', 'tooltip');
        popup.hidden = true;
        // described is the control the shown popup describes (aria-describedby), as its title did.
        let active = null, described = null, source = '', timer = 0, claiming = false;
        // A script that puts a title back as soon as it moves would
        // loop with the claim forever: a title moved three times in one task stays native.
        let moves = new Map(), movesTimer = 0, rivals = new WeakMap();
        // Non-rendered elements keep their title semantics.
        const claimable = node => !node.matches('link,style,meta,script,template,iframe');
        const labelOf = node => node?.getAttribute('data-lg-tooltip')?.trim() || '';
        const targetOf = event => event.target instanceof Element ? event.target.closest('[data-lg-tooltip]') : null;
        const hide = () => {
            clearTimeout(timer);
            timer = 0;
            popup.hidden = true;
            if (described) releaseOwnedAttribute(described, 'aria-describedby', 'tooltip');
            described = null;
        };
        const reset = () => {
            hide();
            active = null;
            source = '';
        };
        const forgetMoves = () => {
            clearTimeout(movesTimer);
            movesTimer = 0;
            moves.clear();
            rivals = new WeakMap();
        };
        function contested(node, value) {
            if (rivals.get(node) === value) return true;
            // The loop never yields, so a count kept until the task ends catches it.
            const last = moves.get(node);
            const count = last?.value === value ? last.count + 1 : 1;
            moves.set(node, { value, count });
            movesTimer ||= setTimeout(() => {
                movesTimer = 0;
                moves.clear();
            });
            if (count <= 3) return false;
            rivals.set(node, value);
            return true;
        }
        // An empty title still moves: it stops a parent hint, as natively. A title also names an
        // unnamed control, as natively, until it empties or the page names the control.
        function claim(node) {
            if (!claiming || !(node instanceof Element) || !node.hasAttribute('title') || !claimable(node)) return;
            const fresh = node.getAttribute('title');
            if (contested(node, fresh)) {
                if (node.hasAttribute('data-lg-tooltip')) release(node);
                if (node === active) reset();
                return;
            }
            node.removeAttribute('title');
            setAttribute(node, 'data-lg-tooltip', fresh);
            if (fresh.trim() && node.matches('button,a,[role="button"]') && mayName(node)) {
                setOwnedAttribute(node, 'aria-label', fresh, 'tooltip');
            } else {
                releaseOwnedAttribute(node, 'aria-label', 'tooltip');
            }
            if (node === active && !popup.hidden) show();
        }
        const claimTree = root => {
            if (root.matches('[title]')) claim(root);
            root.querySelectorAll('[title]').forEach(claim);
        };
        function release(node) {
            const label = node.getAttribute('data-lg-tooltip');
            if (label !== null && !node.hasAttribute('title')) node.setAttribute('title', label);
            releaseOwnedAttribute(node, 'aria-label', 'tooltip');
            node.removeAttribute('data-lg-tooltip');
        }
        // Claim titles in the same microtask as their insertion or update.
        const titleObserver = new MutationObserver(records => {
            for (const record of records) {
                if (record.type === 'attributes') {
                    claim(record.target);
                } else {
                    record.addedNodes.forEach(node => { if (node instanceof Element) claimTree(node); });
                }
            }
        });
        // Follow the theme state: native titles return when the theme is inactive.
        function sync(themeOn) {
            const on = themeOn && document.documentElement.getAttribute('data-theme') === 'dark';
            if (on === claiming) return;
            claiming = on;
            reset();
            forgetMoves();
            if (on) {
                titleObserver.observe(document.documentElement, {
                    childList: true, subtree: true, attributes: true,
                    attributeFilter: ['title']
                });
                claimTree(document.documentElement);
            } else {
                titleObserver.disconnect();
                document.querySelectorAll('[data-lg-tooltip]').forEach(release);
            }
        }
        function show() {
            if (!claiming || !visible(active)) {
                reset();
                return;
            }
            const label = labelOf(active);
            if (!label) {
                reset();
                return;
            }
            const host = active.closest('dialog[open]') || document.fullscreenElement || document.body;
            if (host instanceof HTMLElement && popup.parentElement !== host) host.append(popup);
            setText(popup, label);
            // A control named otherwise (its text, its own label) gets the hint as description.
            if (!described && !active.hasAttribute('aria-describedby') && active.getAttribute('aria-label') !== label &&
                ownText(active).trim() !== label) {
                described = active;
                setOwnedAttribute(active, 'aria-describedby', popup.id, 'tooltip');
            }
            // Measured from 0,0: an open dialog's backdrop-filter makes it the box its fixed children are
            // placed in (and clipped to), and the last position must not narrow the hint.
            popup.style.left = '0px';
            popup.style.top = '0px';
            popup.style.visibility = 'hidden';
            popup.hidden = false;
            const origin = popup.getBoundingClientRect();
            const box = origin.left || origin.top ? host.getBoundingClientRect() : null;
            const rect = active.getBoundingClientRect(), gap = 8;
            const width = popup.offsetWidth, height = popup.offsetHeight;
            const minX = Math.max(0, box?.left ?? 0) + gap, minY = Math.max(0, box?.top ?? 0) + gap;
            const maxX = Math.min(document.documentElement.clientWidth || innerWidth, box?.right ?? Infinity) - gap;
            const maxY = Math.min(document.documentElement.clientHeight || innerHeight, box?.bottom ?? Infinity) - gap;
            const left = Math.max(minX, Math.min(rect.left + (rect.width - width) / 2, maxX - width));
            const below = rect.bottom + gap;
            const top = below + height <= maxY ? below : Math.max(minY, rect.top - height - gap);
            popup.style.left = `${Math.round(left - origin.left)}px`;
            popup.style.top = `${Math.round(top - origin.top)}px`;
            popup.style.visibility = '';
        }
        function activate(node, kind) {
            if (!node || !claiming || !labelOf(node)) {
                reset();
                return;
            }
            if (node !== active) {
                reset();
                active = node;
            }
            source = kind;
            if (kind === 'focus') {
                clearTimeout(timer);
                timer = 0;
                show();
            } else if (popup.hidden && !timer) {
                timer = setTimeout(() => {
                    timer = 0;
                    show();
                }, 400);
            }
        }
        listen(document, 'pointerover', event => {
            if (event.pointerType === 'touch') return;
            const node = targetOf(event);
            if (node !== active) activate(node, 'pointer');
        }, true);
        listen(document, 'pointerout', event => {
            if (source === 'pointer' && active?.contains(event.target) &&
                (!event.relatedTarget || !active.contains(event.relatedTarget))) {
                reset();
            }
        }, true);
        listen(document, 'pointerdown', hide, true);
        listen(document, 'keydown', event => { if (event.key === 'Escape') reset(); }, true);
        // Focus shows the hint for keyboard navigation only (Input modality below).
        listen(document, 'focusin', event => {
            const node = document.documentElement.dataset.lgInput === 'keyboard' && targetOf(event);
            if (node) activate(node, 'focus');
        }, true);
        listen(document, 'focusout', event => {
            if (source === 'focus' && active === targetOf(event) &&
                (!event.relatedTarget || !active.contains(event.relatedTarget))) {
                reset();
            }
        }, true);
        // Hide on scroll like native bubbles: following the target would lag compositor scrolling.
        listen(window, 'scroll', () => { if (!popup.hidden) reset(); }, true);
        listen(window, 'resize', () => { if (!popup.hidden) show(); });
        listen(window, 'hashchange', reset);
        listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
        sync(enabled());
        return {
            popup,
            sync,
            stop() {
                reset();
                forgetMoves();
                titleObserver.disconnect();
                popup.remove();
                document.querySelectorAll('[data-lg-tooltip]').forEach(release);
            }
        };
    }
    const tooltipController = createTooltips();

    // =====================================================================
    // Input modality
    // =====================================================================
    // Input modality - data-lg-input tells the stylesheet when to show rings (Chromium matches a select's
    // :focus-visible after a click). Escape only dismisses; in a text field only Tab means keyboard.
    const TEXT_ENTRY =
        'input:not([type="checkbox"],[type="radio"],[type="range"],[type="button"],[type="submit"],[type="reset"],[type="color"],[type="file"],[type="image"]),textarea,[contenteditable]:not([contenteditable="false"])';
    const clearInputModality = () => {
        delete document.documentElement.dataset.lgInput;
    };
    const setInputModality = kind => {
        if (document.documentElement.dataset.lgInput !== kind) document.documentElement.dataset.lgInput = kind;
    };
    setInputModality('pointer');
    listen(document, 'pointerdown', () => setInputModality('pointer'), true);
    listen(document, 'keydown', event => {
        if (event.key === 'Escape' || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key !== 'Tab' && event.target instanceof Element && event.target.matches(TEXT_ENTRY)) return;
        setInputModality('keyboard');
    }, true);

    // =====================================================================
    // Scheduler
    // =====================================================================
    let scheduled = 0;
    // Stylesheet pending - Jellyfin adds Custom CSS after this script starts (after its branding
    // request): the app, not its splash, waits up to 2 s for the theme's styles.
    let styleGate = null, styleGateTimer = 0;
    function openStyleGate() {
        clearTimeout(styleGateTimer);
        styleGate?.remove();
        styleGate = null;
    }
    if (!enabled()) {
        styleGate = element('style');
        styleGate.id = 'lg-style-pending';
        styleGate.textContent = `#reactRoot > :not(.splashLogo) {
    opacity: 0 !important;
}`;
        document.head.append(styleGate);
        styleGateTimer = setTimeout(openStyleGate, 2000);
    }
    // Layout - Sizes that change without a mutation (a web font, a wrapping row) are read again in
    // the frame they change, before it paints: the bar and its rows, and the library card's title.
    let layoutNodes = [];
    const layoutObserver = new ResizeObserver(() => {
        if (stopped) return;
        placeLibraryControlsIf(syncHeaderInset(enabled()), false);
    });
    // Controls - Placed before the frame paints when the header gap moved the card or a card first shows
    // (not from the layout observer: it watches the row this resizes); other changes wait one frame.
    function placeLibraryControlsIf(moved, first) {
        const toolbar = libraryToolbar();
        const card = document.querySelector('.lg-library-page .lg-library-section .lg-library-title');
        const placed = toolbar?.classList.contains('lg-is-in-card') &&
            toolbar.classList.contains('lg-is-compact') === compactLibrary.matches;
        if (card && toolbar && (placed ? moved : first)) {
            placeLibraryControls();
        } else {
            syncLibraryControls();
        }
    }
    function observeLayout(on) {
        const header = on ? document.querySelector(APP_BAR) : null;
        const title = on ? document.querySelector('.lg-library-page .lg-library-title') : null;
        const rows = header ? [...header.querySelectorAll(':scope > .MuiToolbar-root')] : [];
        const nodes = [header, ...rows, title].filter(Boolean);
        if (nodes.length === layoutNodes.length && nodes.every((node, i) => node === layoutNodes[i])) return;
        layoutObserver.disconnect();
        nodes.forEach(node => layoutObserver.observe(node));
        layoutNodes = nodes;
    }
    // Schedule - Cheap syncs run at once (a page's first frame is final), home mounting at most once per
    // 150 ms; state, session and page are read before any write, which would force a style recalc.
    const schedule = () => {
        if (stopped) return;
        const on = enabled(), api = on ? currentClient() : null, key = on ? sessionKey(api) : '';
        const context = key ? pageCardContext() : null;
        if (on && styleGate) openStyleGate();
        tooltipController.sync(on);
        pruneOwnedAttributes();
        observeLayout(on);
        const moved = syncHeaderInset(on);
        syncPageMarks(on);
        syncPlaybackPage(on);
        if (on) {
            syncDetails(key, context);
        } else {
            clearDetails();
        }
        syncLanguage();
        syncPageCard(context);
        placeLibraryControlsIf(moved, true);
        syncPendingControls(on);
        if (on) syncPreferenceSelects();
        else clearPreferenceSelects();
        if (on) {
            syncLibraryPopovers();
            syncMenuTriggers();
        } else {
            clearLibraryPopovers();
            clearSheetTrigger();
            restoreOwnedAttributes();
        }
        syncLastBackdrop(key);
        if (settings.collectionFilter) {
            collectionFilterController.sync(context, key);
        } else {
            collectionFilterController.stop();
        }
        syncHomeLibraryTitles();
        if (on) {
            syncHomeSession(api, key);
            syncHero();
        }
        resumeClock();
        if (scheduled) return;
        scheduled = setTimeout(() => {
            scheduled = 0;
            void mount();
        }, 150);
    };
    // Observer - One for the whole page. The banner, the tooltip popup (written on every hover) and the
    // settings form are ignored: their own writes would run the passes again, and mount the banner in a loop.
    const ownMutation = record => record.target instanceof Element &&
        (record.target.closest('#lg-hero,#lg-tooltip,#lg-preferences') !== null ||
        (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every(node => node === tooltipController.popup)));
    const observer = new MutationObserver(records => {
        if (!records.every(ownMutation)) schedule();
    });
    observer.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['class', 'hidden', 'data-id', 'data-type', 'disabled', 'lang', 'data-culture', 'data-theme']
    });
    listen(window, 'hashchange', schedule);
    listen(window, 'popstate', schedule);
    listen(window, 'resize', () => {
        syncHeaderInset(enabled());
        syncLibraryControls();
    });
    // Pages - Jellyfin shows a legacy page, then names its item (viewbeforeshow) in a later microtask
    // of the same task: a pass then marks the page before its first frame.
    listen(document, 'viewbeforeshow', schedule, true);
    listen(document, 'viewshow', schedule, true);
    // Images - Posters and the library image change the layout when they load, without a mutation.
    listen(document, 'load', schedule, true);
    // Clock - Once a second for what nothing reports: the 30 s and 60 s retries, the 45 s Play
    // expiry, a paused carousel, layout changes the layout observer does not watch.
    const poll = setInterval(schedule, 1000);

    // =====================================================================
    // Lifecycle
    // =====================================================================
    window[KEY] = {
        get status() {
            return { active: Boolean(heroParts && hero?.isConnected), items: items.length, loading, error: lastError };
        },
        selects: selectController,
        preferences: {
            assets: ASSETS,
            assetUrl,
            defaults: loaderSettings,
            api: currentClient,
            sessionKey,
            element,
            setAttribute,
            translate,
            language,
            params,
            route,
            sameId,
            enabled,
            applyCore: applyCoreSettings
        },
        stop() {
            stopped = true;
            openStyleGate();
            clearTimeout(scheduled);
            clearInterval(poll);
            observer.disconnect();
            layoutObserver.disconnect();
            listeners.forEach(fn => fn());
            clearLastBackdrop();
            clearHome();
            clearHeaderInset();
            syncPlaybackPage(false);
            clearPageMarks();
            clearPendingControls();
            clearPageCard();
            clearLibraryPopovers();
            collectionFilterController.stop();
            window.__lumaaGlaassPreferences?.stop();
            clearDetails();
            clearSheetTrigger();
            tooltipController.stop();
            clearPreferenceSelects();
            selectController.stop();
            restoreOwnedAttributes();
            clearInputModality();
            delete window[KEY];
        }
    };
    schedule();
    if (preferencesEnabled && !document.getElementById('lg-preferences-script')) {
        const script = document.createElement('script');
        script.id = 'lg-preferences-script';
        script.src = assetUrl('extensions/preferences.js');
        script.setAttribute('data-lg-managed', '');
        script.onerror = () => {
            script.remove();
            console.error('LumaaGlaass could not load the preferences extension.');
        };
        document.head.append(script);
    }
})();
