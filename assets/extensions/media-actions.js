/* LumaaGlaass - Media actions extension. */
;
(() => {
    'use strict';

    // =====================================================================
    // Configuration
    // =====================================================================
    // Options - window.LumaaGlaassMediaActionsOptions: native, details or hide (cornerButtons: native or hide per item group).
    // Docs: customization.md#media-actions.
    // Item groups - Shared by thumbnail and corner-button settings; changing one setting never changes the other.
    const TYPE_GROUPS = Object.freeze({
        Movie: 'movies', Episode: 'episodes', Series: 'series', Season: 'seasons', BoxSet: 'collections',
        CollectionFolder: 'libraries', UserView: 'libraries', Folder: 'folders'
    });
    const GROUP_KEYS = Object.freeze([...new Set(Object.values(TYPE_GROUPS))]);
    const nativeGroup = () => Object.fromEntries(GROUP_KEYS.map(name => [name, 'native']));
    const defaults = {
        thumbnails: nativeGroup(),
        seasonEpisodeThumbnails: 'native',
        resumeThumbnails: {
            home: { movies: 'native', episodes: 'native' },
            elsewhere: { movies: 'native', episodes: 'native' }
        },
        // Corner buttons - Watched, favorite and more actions in a thumbnail's corner.
        // This remains independent from the central thumbnail Play shortcut.
        cornerButtons: nativeGroup(),
        mainButtons: { collections: 'native', series: 'native', seasons: 'native' }
    };
    const configured = window.LumaaGlaassMediaActionsOptions || {};
    const MODES = ['native', 'details', 'hide'];
    const BUTTON_MODES = ['native', 'hide'];
    const choice = (value, fallback, allowed) => value === undefined ? fallback : allowed.includes(value) ? value : 'native';
    const group = (values, fallbacks, allowed) => Object.freeze(Object.fromEntries(
        Object.entries(fallbacks).map(([name, fallback]) => [name, choice(values?.[name], fallback, allowed)])));
    const thumbnails = group(configured.thumbnails, defaults.thumbnails, MODES);
    // Compatibility - A previous scalar applied one corner-button mode to every item group.
    const configuredCornerButtons = typeof configured.cornerButtons === 'string'
        ? Object.fromEntries(GROUP_KEYS.map(name => [name, configured.cornerButtons]))
        : configured.cornerButtons;
    const settings = Object.freeze({
        thumbnails,
        seasonEpisodeThumbnails: choice(configured.seasonEpisodeThumbnails, defaults.seasonEpisodeThumbnails, MODES),
        nextUpThumbnails: choice(configured.nextUpThumbnails, thumbnails.episodes, MODES),
        resumeThumbnails: Object.freeze({
            home: group(configured.resumeThumbnails?.home, defaults.resumeThumbnails.home, MODES),
            elsewhere: group(configured.resumeThumbnails?.elsewhere, defaults.resumeThumbnails.elsewhere, MODES)
        }),
        cornerButtons: group(configuredCornerButtons, defaults.cornerButtons, BUTTON_MODES),
        mainButtons: group(configured.mainButtons, defaults.mainButtons, MODES)
    });
    // Features - Card and details actions run only when one of their options is not native;
    // corner buttons share the card observer, but keep their own per-group setting and marker.
    const changed = groups => groups.flatMap(Object.values).some(mode => mode !== 'native');
    const CARDS_ACTIVE = changed([settings.cornerButtons]) || settings.seasonEpisodeThumbnails !== 'native' ||
        settings.nextUpThumbnails !== 'native' ||
        changed([settings.thumbnails, settings.resumeThumbnails.home, settings.resumeThumbnails.elsewhere]);
    const DETAILS_ACTIVE = changed([settings.mainButtons]);

    // =====================================================================
    // Instance
    // =====================================================================
    const KEY = '__lumaaGlaassMediaActions';
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
        Season: 'Season',
        Episode: 'Episode',
        ItemDetails: 'Item Details',
        MessagePleaseWait: 'Please wait. This may take a minute.',
        MessageNoItemsAvailable: 'No Items are currently available.',
        ErrorDefault: 'There was an error processing the request. Please try again later.'
    };
    const translate = key => nativeI18n.translate(key) || ENGLISH[key] || key;
    // Info - Only Jellyfin's own label: without its translator, cards and details stay native.
    const infoLabel = () => nativeI18n.translate('ButtonInfo');

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
    const nextUp = () => route() === '#/list' && params().get('type')?.toLowerCase() === 'nextup';
    const currentClient = () => {
        try {
            return window.ApiClient || window.ConnectionManager?.currentApiClient?.();
        } catch { return null; }
    };
    const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
    const sameId = (a, b) => !!a && !!b && String(a).replace(/-/g, '').toLowerCase() === String(b).replace(/-/g, '').toLowerCase();
    const visible = node => node && !node.closest('.hide,[hidden]') && node.getClientRects().length > 0;
    // Writes - Only real changes: the main theme's page observer and tooltip claim react to each write.
    const setText = (node, value) => {
        if (node && node.textContent !== value) node.textContent = value;
    };
    const setAttribute = (node, name, value) => {
        if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
    };
    const setDisabled = (node, value) => {
        if (node.disabled !== value) node.disabled = value;
    };
    // Titles - The main theme moves title to data-lg-tooltip for its styled hint: a title is read from
    // either, and written (removed for null) only when it changes.
    const titleOf = node => node.hasAttribute('title') ? node.getAttribute('title') : node.getAttribute('data-lg-tooltip');
    const setTitle = (node, value) => {
        if (titleOf(node) === value) return;
        if (value === null) {
            node.removeAttribute('title');
            node.removeAttribute('data-lg-tooltip');
        } else {
            node.setAttribute('title', value);
        }
    };

    // =====================================================================
    // Styles
    // =====================================================================
    const style = element('style', '', `
        /* Hide only the central image Play shortcut. Corner actions follow cornerButtons. */
        [data-lg-media-hide-thumbnail] :is(.cardOverlayContainer > .cardOverlayButton,.listItemImageButton),
        html body #itemDetailPage#itemDetailPage[data-lg-media-hide-main] .mainDetailButtons :is(.btnPlay,.btnReplay),
        html body #itemDetailPage [data-lg-media-replaced] {
            display: none !important;
        }

        /* Corner actions - Hide the desktop action group or only More in the mobile group, which also contains Play. */
        [data-lg-media-hide-corner-buttons] .cardOverlayContainer > .cardOverlayButton-br:not(.cardIndicators),
        [data-lg-media-hide-corner-buttons] .cardOverlayButton-br:not(.cardIndicators) > [data-action="menu"] {
            display: none !important;
        }

        html body #itemDetailPage#itemDetailPage .mainDetailButtons .lg-media-details {
            max-width: 100%;
            white-space: nowrap;
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .lg-media-details > .material-icons {
            flex-shrink: 0;
        }

        .lg-media-details-status {
            font: inherit;
            font-size: .875rem;
            line-height: 1.5;
            margin: 12px 0 0;
            overflow-wrap: anywhere;
        }

        .lg-media-details-status:empty {
            display: none;
        }
    `);
    // =====================================================================
    // Card actions
    // =====================================================================
    const ITEM_CARDS = '.card[data-id][data-type],.listItem[data-id][data-type]';
    const IMAGE_BUTTONS =
        '.card[data-id][data-type] button.cardOverlayButton.itemAction,.listItem[data-id][data-type] button.listItemImageButton.itemAction';
    // Icons - Legacy buttons draw a Material Icons glyph, switched by class; React buttons (library
    // pages) draw MUI's PlayArrow svg, whose path takes the outline of MUI's Info icon.
    const PLAY_ICONS = '.material-icons:is(.play_arrow,.info),svg[data-testid="PlayArrowIcon"] > path';
    const INFO_PATH = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-6h2zm0-8h-2V7h2z';
    // State - Rewritten thumbnail buttons with their card identity and icon, and cards whose thumbnail
    // actions are hidden, for stop().
    const cards = new Map();
    const hiddenThumbnails = new Set();
    const hiddenCornerButtons = new Set();
    // Owned attributes - As in the main script: an attribute written on a native button is restored on
    // release unless the page wrote its own since; titles go through the main theme's tooltip.
    const ownedAttributes = new Map();
    const ownedValue = (node, name) => name === 'title' ? titleOf(node) : node.getAttribute(name);
    function writeOwned(node, name, value) {
        if (name === 'title') {
            setTitle(node, value);
        } else if (value === null) {
            node.removeAttribute(name);
        } else {
            node.setAttribute(name, value);
        }
    }
    function setOwnedAttribute(node, name, value) {
        const owned = ownedAttributes.get(node) || new Map();
        if (!owned.has(name)) {
            if (ownedValue(node, name) === value) return;
            owned.set(name, { original: ownedValue(node, name), value });
            ownedAttributes.set(node, owned);
        }
        owned.get(name).value = value;
        if (ownedValue(node, name) !== value) writeOwned(node, name, value);
    }
    function releaseOwnedAttribute(node, name) {
        const owned = ownedAttributes.get(node), entry = owned?.get(name);
        if (!entry) return;
        if (ownedValue(node, name) === entry.value) writeOwned(node, name, entry.original);
        owned.delete(name);
        if (!owned.size) ownedAttributes.delete(node);
    }
    // Cards - One eligibility check and item-group mapping feed independent thumbnail and corner settings.
    // Chapters, playlists, live TV, music and player controls stay native.
    function cardGroup(card) {
        if (!card || !TYPE_GROUPS[card.dataset.type] || !card.dataset.serverid ||
            card.closest('#videoOsdPage,.chapterCard,.playlistItems') ||
            card.hasAttribute('data-playlistitemid') || card.hasAttribute('data-playlistid')) {
            return null;
        }
        return TYPE_GROUPS[card.dataset.type];
    }
    function cornerButtonMode(card) {
        const group = cardGroup(card);
        return group ? settings.cornerButtons[group] : 'native';
    }
    // Cards - "details" reuses Jellyfin's native link action rather than its router.
    function thumbnailMode(card) {
        const group = cardGroup(card);
        if (!group) return 'native';
        // The page-specific episode rule takes priority over started-item rules.
        if (card.dataset.type === 'Episode' && nextUp()) return settings.nextUpThumbnails;
        const position = Number(card.getAttribute('data-positionticks') || 0);
        if (!Number.isFinite(position) || position < 0) return 'native';
        // Resume rules apply to started items everywhere else; progress itself is left untouched.
        if (position > 0) {
            const onHome = home() && !!card.closest('#indexPage,.homePage');
            return settings.resumeThumbnails[onHome ? 'home' : 'elsewhere'][group] || 'native';
        }
        const seasonEpisode = card.dataset.type === 'Episode' &&
            card.closest('#itemDetailPage :is(#childrenCollapsible, #listChildrenCollapsible)');
        return seasonEpisode ? settings.seasonEpisodeThumbnails : settings.thumbnails[group];
    }
    function cardContext(button) {
        const card = button.closest(ITEM_CARDS);
        if (thumbnailMode(card) !== 'details') return null;
        const action = button.getAttribute('data-action');
        if (!['play', 'resume'].includes(action) && !(cards.has(button) && action === 'link')) return null;
        const icon = button.querySelector(PLAY_ICONS);
        if (!icon) return null;
        return { icon, identity: [card.dataset.id, card.dataset.serverid, card.dataset.type].join(':') };
    }
    function setInfoIcon(icon, info) {
        if (icon instanceof SVGElement) {
            if (info) {
                setOwnedAttribute(icon, 'd', INFO_PATH);
            } else {
                releaseOwnedAttribute(icon, 'd');
            }
            return;
        }
        const [from, to] = info ? ['play_arrow', 'info'] : ['info', 'play_arrow'];
        if (icon.classList.contains(from)) icon.classList.replace(from, to);
    }
    function restoreCard(button, saved) {
        for (const name of ['data-action', 'title', 'aria-label']) releaseOwnedAttribute(button, name);
        setInfoIcon(saved.icon, false);
        cards.delete(button);
    }
    function releaseThumbnail(card) {
        card.removeAttribute('data-lg-media-hide-thumbnail');
        hiddenThumbnails.delete(card);
    }
    function releaseCornerButtons(card) {
        card.removeAttribute('data-lg-media-hide-corner-buttons');
        hiddenCornerButtons.delete(card);
    }
    function clearCards() {
        cards.forEach((saved, button) => restoreCard(button, saved));
        hiddenThumbnails.forEach(releaseThumbnail);
        hiddenCornerButtons.forEach(releaseCornerButtons);
    }
    function syncCard(button) {
        const saved = cards.get(button);
        const ctx = button.isConnected ? cardContext(button) : null;
        if (saved && (!ctx || ctx.identity !== saved.identity || ctx.icon !== saved.icon)) {
            restoreCard(button, saved);
            return syncCard(button);
        }
        const label = infoLabel();
        if (!ctx || !label) return;
        if (!saved) cards.set(button, ctx);
        setOwnedAttribute(button, 'data-action', 'link');
        setOwnedAttribute(button, 'title', label);
        setOwnedAttribute(button, 'aria-label', label);
        setInfoIcon(ctx.icon, true);
    }
    function syncCards() {
        for (const card of hiddenThumbnails) {
            if (!card.isConnected || thumbnailMode(card) !== 'hide') releaseThumbnail(card);
        }
        for (const card of hiddenCornerButtons) {
            if (!card.isConnected || cornerButtonMode(card) !== 'hide') releaseCornerButtons(card);
        }
        document.querySelectorAll(ITEM_CARDS).forEach(card => {
            if (thumbnailMode(card) === 'hide' && !hiddenThumbnails.has(card)) {
                card.setAttribute('data-lg-media-hide-thumbnail', '');
                hiddenThumbnails.add(card);
            }
            if (cornerButtonMode(card) === 'hide' && !hiddenCornerButtons.has(card)) {
                card.setAttribute('data-lg-media-hide-corner-buttons', '');
                hiddenCornerButtons.add(card);
            }
        });
        for (const button of cards.keys()) syncCard(button);
        document.querySelectorAll(IMAGE_BUTTONS).forEach(syncCard);
    }
    // Clicks - Refresh a button just before Jellyfin's delegated handler reads its action, so a card
    // that just became resumable stays resumable.
    function onCardClick(event) {
        const button = event.target.closest?.(IMAGE_BUTTONS);
        if (button) syncCard(button);
    }

    // =====================================================================
    // Details page
    // =====================================================================
    // State - The handled details page; viewIds holds each page's last item id (viewshow).
    let current = null;
    const viewIds = new WeakMap();
    function context() {
        try {
            if (route() !== '#/details') return null;
            const query = params();
            const id = query.get('id');
            const api = currentClient();
            const user = api?.getCurrentUserId?.();
            const server = api?.serverId?.();
            if (!id || !user || !server || (query.get('serverId') && !sameId(query.get('serverId'), server))) return null;
            const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(visible);
            if (!page || (viewIds.has(page) && !sameId(viewIds.get(page), id))) return null;
            return { api, user, server, id, page, hash: location.hash };
        } catch { return null; }
    }
    function matches(a, b) {
        return a && b && a.page === b.page && a.api === b.api && a.user === b.user &&
            a.server === b.server && a.hash === b.hash;
    }
    function valid(state) {
        return !stopped && current === state && matches(state, context());
    }
    // Requests - 12 s timeout; responses after navigation or sign-out are dropped.
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
    // Episodes - A series' playable episodes, 100 per request until a short page or the total. A
    // repeated episode (the server ignored StartIndex) or more than 5000 episodes is an error.
    async function* episodePages(read, series, query) {
        const seen = new Set();
        for (let offset = 0; offset < 5000;) {
            const result = await read('Shows/' + encodeURIComponent(series) + '/Episodes', { ...query, StartIndex: offset, Limit: 100 });
            const items = result?.Items;
            if (!Array.isArray(items)) throw new Error('Invalid episode response.');
            for (const episode of items) {
                if (episode.Id && seen.has(episode.Id)) throw new Error('Repeated episode page.');
                if (episode.Id) seen.add(episode.Id);
            }
            yield items.filter(episode => episode.Type === 'Episode' && episode.Id && !episode.IsMissing &&
                episode.LocationType !== 'Virtual' && (!episode.SeriesId || sameId(episode.SeriesId, series)));
            offset += items.length;
            if (items.length < 100 || (Number.isFinite(result.TotalRecordCount) && offset >= result.TotalRecordCount)) return;
        }
        throw new Error('Episode list too large.');
    }
    // Selection - Mirror Jellyfin Web's ordered container playback.
    // Collections retain server ordering; series use Next Up; seasons stay scoped.
    async function resolveTarget(state) {
        if (state.item.Type === 'BoxSet') {
            const result = await request(state, 'Users/' + encodeURIComponent(state.user) + '/Items', {
                ParentId: state.item.Id, Filters: 'IsNotFolder', Recursive: true,
                MediaTypes: 'Audio,Video', ExcludeLocationTypes: 'Virtual',
                CollapseBoxSetItems: false, EnableTotalRecordCount: false, Limit: 1
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
        const query = { UserId: state.user, IsMissing: false };
        if (season) {
            query.SeasonId = season;
        } else {
            const next = await request(state, 'Shows/NextUp', { SeriesId: series, UserId: state.user });
            if (next.Items?.[0]?.Id) query.StartItemId = next.Items[0].Id;
        }
        let first = null;
        for await (const episodes of episodePages((path, options) => request(state, path, options), series, query)) {
            for (const episode of episodes) {
                // Specials listed within a season belong to another one; Jellyfin starts after them too.
                if (season && !sameId(episode.SeasonId, season)) continue;
                first ||= episode;
                if (!episode.UserData?.Played) return episode;
            }
            // A series reads one page from Next Up, as Jellyfin's own series playback does.
            if (!season) break;
        }
        return first;
    }
    function episodeName(episode) {
        if (!episode) return '';
        const season = episode.SeasonName ||
            (episode.ParentIndexNumber != null ? translate('Season') + ' ' + episode.ParentIndexNumber : '');
        const number = episode.IndexNumber != null ? episode.IndexNumber + '. ' : '';
        return [season, number + (episode.Name || translate('Episode'))].filter(Boolean).join(' · ');
    }
    function render(state) {
        if (!state.button) return;
        const label = infoLabel();
        if (!label) return;
        const name = episodeName(state.episode);
        setText(state.label, label);
        setTitle(state.button, [translate('ItemDetails'), name].filter(Boolean).join(': '));
        setAttribute(state.button, 'aria-label', [label, name].filter(Boolean).join(': '));
        setDisabled(state.button, state.busy);
        setAttribute(state.button, 'aria-busy', String(state.busy));
        setText(state.status, state.message ? translate(state.message) : '');
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
                const query = new URLSearchParams({ id: episode.Id, serverId: state.server });
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
        if (!infoLabel()) return;
        const actions = state.page.querySelector('.mainDetailButtons');
        const originals = actions && Array.from(actions.querySelectorAll('.btnPlay,.btnReplay'))
            .filter(node => !node.classList.contains('lg-media-details'));
        if (!originals?.some(visible)) return;
        const button = element('button', 'button-flat btnPlay detailButton emby-button lg-media-details');
        button.type = 'button';
        const icon = element('span', 'material-icons info');
        icon.setAttribute('aria-hidden', 'true');
        const label = element('span', 'lg-media-details-label');
        button.append(icon, label);
        const status = element('p', 'lg-media-details-status');
        status.setAttribute('role', 'status');
        state.originals = originals.map(node => ({ node, hidden: node.getAttribute('hidden') }));
        for (const { node } of state.originals) {
            node.setAttribute('data-lg-media-replaced', '');
            node.hidden = true;
        }
        originals[0].before(button);
        actions.after(status);
        Object.assign(state, { button, label, status });
        render(state);
        void loadEpisode(state, false);
    }
    function clearDetails() {
        if (!current) return;
        current.page.removeAttribute('data-lg-media-hide-main');
        current.button?.remove();
        current.status?.remove();
        for (const { node, hidden } of current.originals || []) {
            node.removeAttribute('data-lg-media-replaced');
            if (hidden === null) {
                node.removeAttribute('hidden');
            } else {
                node.setAttribute('hidden', hidden);
            }
        }
        current = null;
    }
    async function inspect(state) {
        try {
            const item = await request(state, 'Users/' + encodeURIComponent(state.user) + '/Items/' + encodeURIComponent(state.id));
            if (!sameId(item?.Id, state.id)) throw new Error('Unexpected item response');
            state.item = item;
        } catch {
            state.retryAt = Date.now() + 15000;
        } finally {
            state.loading = false;
        }
        if (valid(state)) syncDetails();
    }
    function syncDetails() {
        const ctx = context();
        if (!matches(current, ctx)) {
            clearDetails();
            if (!ctx) return;
            current = { ...ctx, loading: false };
        }
        const state = current;
        if (!state.item) {
            if (!state.loading && Date.now() >= (state.retryAt || 0)) {
                state.loading = true;
                void inspect(state);
            }
            return;
        }
        const position = Number(state.item.UserData?.PlaybackPositionTicks ?? 0);
        if (!['Series', 'Season', 'BoxSet'].includes(state.item.Type)) return;
        if (!Number.isFinite(position) || position !== 0) return;
        const mode = settings.mainButtons[TYPE_GROUPS[state.item.Type]];
        // hide wins over details: no target is resolved for a hidden button.
        if (mode === 'hide') {
            state.page.toggleAttribute('data-lg-media-hide-main', true);
            return;
        }
        if (mode !== 'details') return;
        if (state.button && !state.button.isConnected) {
            clearDetails();
            return;
        }
        if (!state.button) {
            mount(state);
        } else {
            render(state);
        }
    }
    // Clicks - The Info button never reaches a native playback handler.
    function onDetailsClick(event) {
        const button = event.target.closest?.('.lg-media-details');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (current?.button === button && !button.disabled) void loadEpisode(current, true);
    }
    function onViewShow(event) {
        if (event.target instanceof Element && event.target.matches('#itemDetailPage') && event.detail?.params?.id) {
            viewIds.set(event.target, event.detail.params.id);
            clearDetails();
        }
        syncDetails();
    }

    // =====================================================================
    // Scheduler
    // =====================================================================
    let scheduled = 0, timer = 0;
    function sync() {
        if (stopped) return;
        if (CARDS_ACTIVE) syncCards();
        if (DETAILS_ACTIVE) syncDetails();
    }
    // Cards - Added or changed cards are synchronized once per frame; the timer covers the rest
    // (Jellyfin's translator becoming available).
    const observer = new MutationObserver(() => {
        if (stopped || scheduled) return;
        scheduled = requestAnimationFrame(() => {
            scheduled = 0;
            syncCards();
        });
    });
    function start() {
        if (!CARDS_ACTIVE && !DETAILS_ACTIVE) return;
        document.head.append(style);
        if (CARDS_ACTIVE) {
            listen(window, 'click', onCardClick, true);
            observer.observe(document.documentElement, {
                childList: true, subtree: true, attributes: true,
                attributeFilter: ['data-action', 'data-id', 'data-type', 'data-serverid', 'data-positionticks', 'lang', 'data-culture']
            });
        }
        if (DETAILS_ACTIVE) {
            listen(window, 'click', onDetailsClick, true);
            listen(document, 'viewshow', onViewShow, true);
        }
        listen(window, 'hashchange', sync);
        listen(window, 'popstate', sync);
        timer = setInterval(sync, 500);
        sync();
    }

    // =====================================================================
    // Lifecycle
    // =====================================================================
    window[KEY] = {
        stop() {
            stopped = true;
            clearInterval(timer);
            observer.disconnect();
            cancelAnimationFrame(scheduled);
            listeners.forEach(fn => fn());
            clearDetails();
            clearCards();
            style.remove();
            delete window[KEY];
        }
    };
    start();
})();
