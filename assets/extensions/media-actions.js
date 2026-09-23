/* LumaaGlaass - Optional configurable media actions. */
(() => {
    'use strict';

    // Configuration - Set window.LumaaGlaassMediaActionsOptions before loading.
    // Edit the loader configuration, then save and fully reload; do not modify runtime code.
    // Installation, defaults and examples: docs/customization.md#media-actions.
    // Modes: native keeps controls, details opens information, hide removes controls.
    // Missing values use these defaults; invalid values safely use native.
    const defaults = {
        catalog: {
            movies: 'hide', episodes: 'hide', series: 'hide', seasons: 'hide',
            collections: 'hide', libraries: 'hide', folders: 'hide'
        },
        seasonEpisodeImages: 'details',
        resumeImages: {
            home: { movies: 'native', episodes: 'native' },
            elsewhere: { movies: 'hide', episodes: 'hide' }
        },
        resumeDetailButtons: { movies: 'native', episodes: 'native' },
        detailPages: { collections: 'hide', series: 'details', seasons: 'details' }
    };
    const configured = window.LumaaGlaassMediaActionsOptions || {};
    const mode = (value, fallback) => value === undefined ? fallback :
        ['native', 'details', 'hide'].includes(value) ? value : 'native';
    const group = (values, fallback) => Object.freeze(Object.fromEntries(
        Object.entries(fallback).map(([name, value]) => [name, mode(values?.[name], value)])));
    const settings = Object.freeze({
        catalog: group(configured.catalog, defaults.catalog),
        seasonEpisodeImages: mode(configured.seasonEpisodeImages, defaults.seasonEpisodeImages),
        resumeImages: Object.freeze({
            home: group(configured.resumeImages?.home, defaults.resumeImages.home),
            elsewhere: group(configured.resumeImages?.elsewhere, defaults.resumeImages.elsewhere)
        }),
        resumeDetailButtons: Object.freeze(Object.fromEntries(Object.entries(defaults.resumeDetailButtons).map(([name, fallback]) =>
            [name, configured.resumeDetailButtons?.[name] === undefined ? fallback :
                configured.resumeDetailButtons[name] === 'hide' ? 'hide' : 'native']))),
        detailPages: group(configured.detailPages, defaults.detailPages)
    });

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
    // Lifecycle - Replace the earlier local prototype if it is still running.
    window.__lumaaGlaassEpisodeDetails?.stop();
    window.__lumaaGlaassDetailsFirst?.stop();
    window.__lumaaGlaassHideImageButtons?.stop();
    const key = '__lumaaGlaassMediaActions';
    window[key]?.stop();
    let current = null, stopped = false;
    const typeNames = {
        Movie: 'movies', Episode: 'episodes', BoxSet: 'collections', Series: 'series',
        Season: 'seasons', CollectionFolder: 'libraries', UserView: 'libraries', Folder: 'folders'
    };
    const hideAttribute = 'data-lg-media-hide-play';
    const viewIds = new WeakMap();
    const translate = name => nativeI18n.translate(name);
    const sameId = (a, b) => !!a && !!b && String(a).replace(/-/g, '').toLowerCase() === String(b).replace(/-/g, '').toLowerCase();
    const visible = node => node && !node.closest('.hide,[hidden]') && node.getClientRects().length > 0;
    const cards = new Map();
    const hiddenImages = new Set();
    const itemSelector = '.card[data-id][data-type],.listItem[data-id][data-type]';
    const cardSelector = '.card[data-id][data-type] button.cardOverlayButton.itemAction,.listItem[data-id][data-type] button.listItemImageButton.itemAction';
    const setAttribute = (node, name, value) => {
        if (node.getAttribute(name) !== value) {
            if (value === null) node.removeAttribute(name);
            else node.setAttribute(name, value);
        }
    };
    const style = document.createElement('style');
    style.textContent = `
      [data-lg-media-hide-image] :is(.cardOverlayButton,.listItemImageButton) { display:none!important; }
      html body #itemDetailPage#itemDetailPage[data-lg-media-hide-resume] .mainDetailButtons .btnPlay { display:none!important; }
      html body #itemDetailPage#itemDetailPage[${hideAttribute}] .mainDetailButtons :is(.btnPlay,.btnReplay,.lg-media-details) { display:none!important; }
      html body #itemDetailPage [data-lg-media-original] { display:none!important; }
      html body #itemDetailPage#itemDetailPage .mainDetailButtons .lg-media-details {
        min-height:46px; max-width:100%; white-space:nowrap;
        display:inline-flex!important; flex-direction:row!important; align-items:center; justify-content:center; gap:8px;
      }
      .lg-media-details > .material-icons { flex-shrink:0; }
      .lg-media-details-label { font:inherit; font-weight:700; }
      .lg-media-details-status { font:inherit; font-size:.875rem; line-height:1.5; margin:12px 0 0; overflow-wrap:anywhere; }
      .lg-media-details-status:empty { display:none; }
      .lg-media-details:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
    `;
    document.head.append(style);

    // Cards - Reuse Jellyfin's native link action instead of replacing its router.
    // Chapters, playlists, live TV, music and player controls are outside this scope.
    function imageMode(card) {
        if (!card || !typeNames[card.dataset.type] || !card.dataset.serverid ||
            card.closest('#videoOsdPage,.chapterCard,.playlistItems') ||
            card.hasAttribute('data-playlistitemid') || card.hasAttribute('data-playlistid')) return 'native';
        const position = Number(card.getAttribute('data-positionticks') || 0);
        if (!Number.isFinite(position) || position < 0) return 'native';
        // Resume rules take precedence in every image section, without changing progress.
        if (position > 0) {
            const home = !!card.closest('#indexPage,.homePage') && /^#\/(?:home|home\.html|index\.html)(?:[?\/]|$)/.test(location.hash);
            return settings.resumeImages[home ? 'home' : 'elsewhere'][typeNames[card.dataset.type]] || 'native';
        }
        const seasonEpisode = card.dataset.type === 'Episode' &&
            card.closest('#itemDetailPage :is(#childrenCollapsible, #listChildrenCollapsible)');
        return seasonEpisode ? settings.seasonEpisodeImages : settings.catalog[typeNames[card.dataset.type]];
    }

    function cardContext(button) {
        const card = button.closest(itemSelector);
        if (imageMode(card) !== 'details') return null;
        const action = button.getAttribute('data-action');
        if (!['play', 'resume'].includes(action) && !(cards.has(button) && action === 'link')) return null;
        const icon = button.querySelector('.material-icons.play_arrow,.material-icons.info');
        if (!icon) return null;
        return { card, icon, identity:[card.dataset.id, card.dataset.serverid, card.dataset.type].join(':') };
    }

    function restoreCard(button, saved) {
        for (const [name, value] of Object.entries(saved.original)) {
            if (button.getAttribute(name) === saved.written[name]) setAttribute(button, name, value);
        }
        if (saved.icon.classList.contains('info')) saved.icon.classList.replace('info', 'play_arrow');
        cards.delete(button);
    }

    function syncCard(button) {
        const saved = cards.get(button);
        const ctx = button.isConnected ? cardContext(button) : null;
        if (saved && (!ctx || ctx.identity !== saved.identity || ctx.icon !== saved.icon)) {
            restoreCard(button, saved);
            return syncCard(button);
        }
        const label = translate('ButtonOpen');
        if (!ctx || !label) return;
        let entry = saved;
        if (!entry) {
            entry = { ...ctx, original:{}, written:{} };
            for (const name of ['data-action', 'title', 'aria-label']) entry.original[name] = button.getAttribute(name);
            cards.set(button, entry);
        }
        entry.written = { 'data-action':'link', title:label, 'aria-label':label };
        for (const [name, value] of Object.entries(entry.written)) setAttribute(button, name, value);
        if (entry.icon.classList.contains('play_arrow')) entry.icon.classList.replace('play_arrow', 'info');
    }

    function syncCards() {
        for (const card of hiddenImages) {
            if (!card.isConnected || imageMode(card) !== 'hide') {
                card.removeAttribute('data-lg-media-hide-image');
                hiddenImages.delete(card);
            }
        }
        document.querySelectorAll(itemSelector).forEach(card => {
            if (imageMode(card) === 'hide' && !hiddenImages.has(card)) {
                card.setAttribute('data-lg-media-hide-image', '');
                hiddenImages.add(card);
            }
        });
        for (const button of cards.keys()) syncCard(button);
        document.querySelectorAll(cardSelector).forEach(syncCard);
    }

    function context() {
        if (Object.values(settings.detailPages).every(value => value === 'native') &&
            Object.values(settings.resumeDetailButtons).every(value => value === 'native')) return null;
        try {
            const [route, query] = location.hash.split('?');
            if (!/^#\/details(?:\.html)?$/.test(route)) return null;
            const params = new URLSearchParams(query || '');
            const id = params.get('id');
            const api = window.ApiClient || window.ConnectionManager?.currentApiClient?.();
            const user = api?.getCurrentUserId?.();
            const server = api?.serverId?.();
            if (!id || !user || !server || (params.get('serverId') && !sameId(params.get('serverId'), server))) return null;
            const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(visible);
            if (!page || (viewIds.has(page) && !sameId(viewIds.get(page), id))) return null;
            return { api, user, server, id, page, route:location.hash };
        } catch { return null; }
    }

    function matches(a, b) {
        return a && b && a.page === b.page && a.api === b.api && a.user === b.user &&
            a.server === b.server && a.route === b.route;
    }

    function valid(state) {
        return !stopped && current === state && matches(state, context());
    }

    // Requests - Bound waiting time; ignore late responses after navigation or sign-out.
    async function request(state, path, query) {
        let timeout;
        try {
            const result = await Promise.race([
                state.api.getJSON(state.api.getUrl(path, query)),
                new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Request timed out')), 12000); })
            ]);
            if (!valid(state)) throw new Error('Details context changed');
            return result;
        } finally { clearTimeout(timeout); }
    }

    // Selection - Mirror Jellyfin Web 10.11's ordered container playback.
    // Collections retain server ordering; series use Next Up; seasons stay scoped.
    async function resolveTarget(state) {
        if (state.item.Type === 'BoxSet') {
            const result = await request(state, 'Users/' + encodeURIComponent(state.user) + '/Items', {
                ParentId:state.item.Id, Filters:'IsNotFolder', Recursive:true,
                MediaTypes:'Audio,Video', ExcludeLocationTypes:'Virtual',
                CollapseBoxSetItems:false, EnableTotalRecordCount:false, Limit:1
            });
            if (!Array.isArray(result.Items)) throw new Error('Invalid collection response');
            const item = result.Items[0];
            if (!item) return null;
            if (!item.Id || item.IsFolder || item.LocationType === 'Virtual' || sameId(item.Id, state.item.Id)) {
                throw new Error('Invalid collection target');
            }
            return item;
        }
        const series = state.item.Type === 'Series' ? state.item.Id : state.item.SeriesId;
        if (!series) throw new Error('Season has no series');
        const season = state.item.Type === 'Season' ? state.item.Id : null;
        let startItemId;
        if (!season) {
            const next = await request(state, 'Shows/NextUp', { SeriesId:series, UserId:state.user });
            startItemId = next.Items?.[0]?.Id;
        }
        let first = null, offset = 0;
        const seen = new Set();
        do {
            const query = { UserId:state.user, IsVirtualUnaired:false, IsMissing:false, Limit:100 };
            if (season) { query.SeasonId = season; query.StartIndex = offset; }
            else if (startItemId) query.StartItemId = startItemId;
            const result = await request(state, 'Shows/' + encodeURIComponent(series) + '/Episodes', query);
            if (!Array.isArray(result.Items)) throw new Error('Invalid episode response');
            const items = result.Items;
            for (const episode of items) {
                if (episode.Id && seen.has(episode.Id)) throw new Error('Repeated episode page');
                if (episode.Id) seen.add(episode.Id);
                if (episode.Type !== 'Episode' || !episode.Id || episode.IsMissing || episode.LocationType === 'Virtual' ||
                    (episode.SeriesId && !sameId(episode.SeriesId, series)) ||
                    (season && !sameId(episode.SeasonId, season))) continue;
                first ||= episode;
                if (!episode.UserData?.Played) return episode;
            }
            offset += items.length;
            if (!season || items.length < 100 || (Number.isFinite(result.TotalRecordCount) && offset >= result.TotalRecordCount)) break;
        } while (valid(state));
        return first;
    }

    function episodeName(episode) {
        if (!episode) return '';
        const season = episode.SeasonName || (episode.ParentIndexNumber != null && translate('Season')
            ? translate('Season') + ' ' + episode.ParentIndexNumber : '');
        const number = episode.IndexNumber != null ? episode.IndexNumber + '. ' : '';
        return [season, number + (episode.Name || translate('Episode') || '')].filter(Boolean).join(' · ');
    }

    function render(state) {
        if (!state.button) return;
        const label = translate('ButtonOpen');
        if (!label) return;
        const name = episodeName(state.episode);
        if (state.label.textContent !== label) state.label.textContent = label;
        state.button.title = [translate('ItemDetails') || label, name].filter(Boolean).join(': ');
        state.button.setAttribute('aria-label', [label, name].filter(Boolean).join(': '));
        state.button.disabled = state.busy;
        state.button.setAttribute('aria-busy', String(state.busy));
        const message = state.message ? translate(state.message) || '' : '';
        if (state.status.textContent !== message) state.status.textContent = message;
    }

    async function loadEpisode(state, navigate) {
        if (state.busy || !valid(state)) return;
        state.busy = true;
        state.message = navigate ? 'MessagePleaseWait' : null;
        render(state);
        try {
            const episode = await resolveTarget(state);
            if (!valid(state)) return;
            state.episode = episode;
            state.message = episode ? null : 'MessageNoItemsAvailable';
            if (navigate && episode) {
                const query = new URLSearchParams({ id:episode.Id, serverId:state.server });
                location.hash = '#/details?' + query;
            }
        } catch {
            if (valid(state)) state.message = 'ErrorDefault';
        } finally {
            state.busy = false;
            if (valid(state)) render(state);
        }
    }

    function mount(state) {
        if (!translate('ButtonOpen')) return;
        const actions = state.page.querySelector('.mainDetailButtons');
        const originals = actions && Array.from(actions.querySelectorAll('.btnPlay,.btnReplay')).filter(node => !node.classList.contains('lg-media-details'));
        if (!originals?.some(visible)) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button-flat btnPlay detailButton emby-button lg-media-details';
        const icon = document.createElement('span');
        icon.className = 'material-icons info';
        icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'lg-media-details-label';
        button.append(icon, label);
        const status = document.createElement('p');
        status.className = 'lg-media-details-status';
        status.setAttribute('role', 'status');
        state.originals = originals.map(node => ({ node, hidden:node.getAttribute('hidden') }));
        for (const {node} of state.originals) { node.setAttribute('data-lg-media-original', ''); node.hidden = true; }
        originals[0].before(button);
        actions.after(status);
        Object.assign(state, {button, label, status});
        render(state);
        void loadEpisode(state, false);
    }

    function clear() {
        if (!current) return;
        current.page.removeAttribute(hideAttribute);
        current.page.removeAttribute('data-lg-media-hide-resume');
        current.button?.remove();
        current.status?.remove();
        for (const {node, hidden} of current.originals || []) {
            node.removeAttribute('data-lg-media-original');
            if (hidden === null) node.removeAttribute('hidden');
            else node.setAttribute('hidden', hidden);
        }
        current = null;
    }

    async function inspect(state) {
        try {
            const item = await request(state, 'Users/' + encodeURIComponent(state.user) + '/Items/' + encodeURIComponent(state.id));
            if (!sameId(item?.Id, state.id)) throw new Error('Unexpected item response');
            state.item = item;
        } catch { state.retryAt = Date.now() + 15000; }
        finally { state.loading = false; }
        if (valid(state)) sync();
    }

    function sync() {
        if (stopped) return;
        syncCards();
        const ctx = context();
        if (!matches(current, ctx)) {
            clear();
            if (!ctx) return;
            current = {...ctx, loading:false};
        }
        const state = current;
        if (!state) return;
        if (!state.item) {
            if (!state.loading && Date.now() >= (state.retryAt || 0)) { state.loading = true; void inspect(state); }
            return;
        }
        const position = Number(state.item.UserData?.PlaybackPositionTicks ?? 0);
        if (['Movie', 'Episode'].includes(state.item.Type)) {
            state.page.toggleAttribute('data-lg-media-hide-resume', Number.isFinite(position) && position > 0 &&
                settings.resumeDetailButtons[typeNames[state.item.Type]] === 'hide');
            return;
        }
        if (!['Series', 'Season', 'BoxSet'].includes(state.item.Type)) return;
        if (!Number.isFinite(position) || position !== 0) return;
        // Visibility takes precedence over Open; do not resolve an unused target.
        if (settings.detailPages[typeNames[state.item.Type]] === 'hide') {
            state.page.setAttribute(hideAttribute, '');
            return;
        }
        if (settings.detailPages[typeNames[state.item.Type]] !== 'details') return;
        if (state.button && !state.button.isConnected) { clear(); return; }
        if (!state.button) mount(state);
        else render(state);
    }

    // Events - Never forward the replacement control to a native playback handler.
    function intercept(event) {
        // Refresh just before native delegation so a newly resumable card stays resumable.
        const cardButton = event.target.closest?.(cardSelector);
        if (cardButton) syncCard(cardButton);
        const button = event.target.closest?.('.lg-media-details');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (current?.button === button && !button.disabled) void loadEpisode(current, true);
    }
    function onViewShow(event) {
        if (event.target instanceof Element && event.target.matches('#itemDetailPage') && event.detail?.params?.id) {
            viewIds.set(event.target, event.detail.params.id);
            clear();
        }
        sync();
    }
    window.addEventListener('click', intercept, true);
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    document.addEventListener('viewshow', onViewShow, true);
    let scheduled = 0;
    const observer = new MutationObserver(() => {
        if (!stopped && !scheduled) scheduled = requestAnimationFrame(() => { scheduled = 0; syncCards(); });
    });
    observer.observe(document.documentElement, {childList:true, subtree:true, attributes:true,
        attributeFilter:['data-action', 'data-id', 'data-type', 'data-serverid', 'data-positionticks', 'class', 'lang', 'data-culture']});
    const timer = setInterval(sync, 500);
    window[key] = { stop() {
        stopped = true;
        clearInterval(timer);
        observer.disconnect();
        cancelAnimationFrame(scheduled);
        window.removeEventListener('click', intercept, true);
        window.removeEventListener('hashchange', sync);
        window.removeEventListener('popstate', sync);
        document.removeEventListener('viewshow', onViewShow, true);
        clear();
        for (const [button, saved] of cards) restoreCard(button, saved);
        for (const card of hiddenImages) card.removeAttribute('data-lg-media-hide-image');
        hiddenImages.clear();
        style.remove();
        delete window[key];
    } };
    sync();
})();
