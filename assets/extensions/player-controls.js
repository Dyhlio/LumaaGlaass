/* LumaaGlaass - Player controls extension. */
;
(() => {
    'use strict';

    // =====================================================================
    // Configuration
    // =====================================================================
    // Options - window.LumaaGlaassPlayerControlsOptions = { versions, episodes }, default true.
    // Docs: customization.md#player-controls.
    const defaults = { versions: true, episodes: true };
    const configured = window.LumaaGlaassPlayerControlsOptions || {};
    const flag = (value, fallback) => typeof value === 'boolean' ? value : fallback;
    const settings = Object.freeze({
        versions: flag(configured.versions, defaults.versions),
        episodes: flag(configured.episodes, defaults.episodes)
    });

    // =====================================================================
    // Instance
    // =====================================================================
    const KEY = '__lumaaGlaassPlayerControls';
    window[KEY]?.stop();
    let stopped = false;
    const selects = window.__lumaaGlaass?.selects || null;

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
        Episodes: 'Episodes',
        Episode: 'Episode',
        Season: 'Season',
        LabelVersion: 'Version',
        ButtonClose: 'Close',
        Played: 'Played',
        MessagePleaseWait: 'Please wait. This may take a minute.',
        MessageNoItemsAvailable: 'No Items are currently available.'
    };
    // Localization - The extension's own strings, by language. Jellyfin does not have them, and asking
    // it for a missing key logs an error.
    const THEME_STRINGS = {
        en: {
            PreviousSeason: 'Previous season',
            NextSeason: 'Next season',
            SeasonTarget: '{action}: {season}',
            ListFailed: 'Unable to load this list. Close this window and try again.',
            VersionFailed: 'Unable to switch version. Close this window and try again.',
            EpisodeFailed: 'Unable to play this episode. Try again or close this window.',
            EpisodesFailed: 'Unable to load episodes. Close this window and try again.'
        },
        fr: {
            PreviousSeason: 'Saison précédente',
            NextSeason: 'Saison suivante',
            SeasonTarget: '{action} : {season}',
            ListFailed: 'Impossible de charger cette liste. Fermez cette fenêtre et réessayez.',
            VersionFailed: 'Impossible de changer de version. Fermez cette fenêtre et réessayez.',
            EpisodeFailed: 'Impossible de lire cet épisode. Réessayez ou fermez cette fenêtre.',
            EpisodesFailed: 'Impossible de charger les épisodes. Fermez cette fenêtre et réessayez.'
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
    const element = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text) node.textContent = text;
        return node;
    };
    const currentClient = () => {
        try {
            return window.ApiClient || window.ConnectionManager?.currentApiClient?.();
        } catch { return null; }
    };
    const sameId = (a, b) => !!a && !!b && String(a).replace(/-/g, '').toLowerCase() === String(b).replace(/-/g, '').toLowerCase();
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
    // Styles - lumaaglaass.css draws the dialog shell and glass, the lists, the close, option and
    // season buttons with their states and every focus ring; this keeps the player's own layout.
    const style = element('style', '', `
        .lg-player-dialog-list {
            max-height: 55dvh;
            touch-action: pan-y;
        }

        .lg-player-dialog-status {
            margin: 12px 0 0;
            text-align: center;
            font: inherit;
        }

        .lg-player-dialog-status:empty,
        .lg-player-seasons:empty {
            display: none;
        }

        .lg-player-dialog-episodes .lg-player-dialog-list {
            height: 55dvh;
            box-sizing: border-box;
        }

        .lg-player-seasons {
            margin-bottom: 16px;
            padding: 3px;
        }

        .lg-player-season-navigation {
            display: grid;
            grid-template-columns: var(--lg-size-action,44px) minmax(0,1fr) var(--lg-size-action,44px);
            align-items: center;
            gap: var(--lg-space-button-group,8px);
        }

        /* Season selector - The shared field fills the space between its previous and next actions. */
        :is(.lg-player-season-select,.lg-player-season-select-shell) {
            width: 100%;
            min-width: 0;
            max-width: 100%;
        }

        .lg-player-season-arrow .material-icons {
            font-size: 24px;
            line-height: 1;
        }

        .lg-player-episode {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            white-space: normal;
        }

        .lg-player-episode-image {
            position: relative;
            display: grid;
            place-items: center;
            width: clamp(88px,22vw,160px);
            aspect-ratio: 16/9;
            flex-shrink: 0;
            overflow: hidden;
            border-radius: var(--lg-radius-small,8px);
            background: rgba(255,255,255,.08);
        }

        .lg-player-episode-image img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .lg-player-episode-image .lg-player-episode-watched {
            position: absolute;
            z-index: 1;
            top: 6px;
            right: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .lg-player-episode-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }
    `);

    // =====================================================================
    // Player context
    // =====================================================================
    let manager = null, runtime = null, retryAt = 0;
    // Playback manager - Not exposed globally: find its one webpack module by signature, without
    // running unrelated modules. The search runs at most every 5 s until it succeeds.
    function resolveManager() {
        if (manager || Date.now() < retryAt) return manager;
        retryAt = Date.now() + 5000;
        const chunks = window.webpackChunk;
        if (!runtime && Array.isArray(chunks) && chunks.push !== Array.prototype.push) {
            chunks.push([['lg-player-manager-' + Date.now()], {}, value => { runtime = value; }]);
        }
        if (!runtime?.m) return null;
        const candidates = Object.entries(runtime.m).filter(([, factory]) => {
            const source = String(factory);
            return source.includes('getCurrentPlaylistIndex') && source.includes('getPlayerState') &&
                source.includes('setAudioStreamIndex') && source.includes('playbackStartTime');
        });
        if (candidates.length !== 1) return null;
        manager = Object.values(runtime(candidates[0][0])).find(value => value &&
            ['getCurrentPlayer', 'getPlayerState', 'currentItem', 'currentMediaSource', 'play', 'getPlaylist', 'getCurrentPlaylistIndex']
                .every(method => typeof value[method] === 'function')) || null;
        return manager;
    }
    function context() {
        const pm = resolveManager();
        const player = pm?.getCurrentPlayer();
        if (!player?.isLocalPlayer || player.isExternalPlayer) return null;
        const item = pm.currentItem(player);
        const state = pm.getPlayerState(player);
        if (!item?.Id || !['Movie', 'Episode'].includes(item.Type) || !state.PlayState?.CanSeek) return null;
        return { pm, player, item, state };
    }
    const sameItem = (item, other) => item?.Id === other.Id && item.ServerId === other.ServerId;
    const samePlayback = (ctx, original) => ctx?.player === original.player && sameItem(ctx.item, original.item);

    // =====================================================================
    // Dialog
    // =====================================================================
    // State - active is the open dialog with its parts; generation invalidates late responses once it
    // closes; episodeRequest, a superseded season load.
    let opener = null, active = null, busy = false, generation = 0, episodeRequest = 0;
    function label(mode) {
        return translate(mode === 'episodes' ? 'Episodes' : 'LabelVersion');
    }
    // Status - The key is stored so a language change retranslates the line.
    const statusText = node => node.dataset.lgPlayerStatus ? translate(node.dataset.lgPlayerStatus) : '';
    function setStatus(node, key) {
        node.dataset.lgPlayerStatus = key;
        setText(node, statusText(node));
    }
    function close() {
        const wasOpen = Boolean(active);
        generation++;
        episodeRequest++;
        active?.seasonPicker?.destroy();
        active?.dialog.close();
        active?.dialog.remove();
        active?.container.remove();
        active = null;
        if (wasOpen && opener?.isConnected) {
            // The player buttons are disabled during a switch; once it is over, the opener must be
            // enabled before the next sync, or it cannot take focus.
            if (!busy) setDisabled(opener, false);
            opener.focus({ preventScroll: true });
        }
        opener = null;
    }
    function syncScrollHint() {
        const list = active?.list;
        if (!list) return;
        list.parentElement.toggleAttribute('data-lg-player-scroll-hint', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
    }
    function syncSeasonArrows(seasons) {
        const select = seasons?.querySelector('.lg-player-season-select');
        if (!select) return;
        for (const [direction, className, key] of [[-1, '.lg-player-season-previous', 'PreviousSeason'],
            [1, '.lg-player-season-next', 'NextSeason']]) {
            const arrow = seasons.querySelector(className);
            if (!arrow) continue;
            const target = select.options[select.selectedIndex + direction];
            setDisabled(arrow, busy || select.disabled || !target);
            const action = translate(key);
            const name = target ?
                translate('SeasonTarget').replace('{action}', action).replace('{season}', target.textContent.trim()) : action;
            setAttribute(arrow, 'aria-label', name);
            setTitle(arrow, name);
        }
    }
    // Dialog - Closed once its playback ends or changes item (not during a switch, which closes it
    // itself); otherwise retranslated in place.
    function syncDialog(ctx) {
        if (!active) return;
        if (!busy && (!ctx || !sameItem(ctx.item, active.item))) {
            close();
            return;
        }
        setText(active.heading, label(active.mode));
        setAttribute(active.list, 'aria-label', label(active.mode));
        setAttribute(active.dismiss, 'aria-label', translate('ButtonClose'));
        syncSeasonArrows(active.seasons);
        setText(active.status, statusText(active.status));
        syncScrollHint();
    }
    function focusCurrentChoice(dialog, list) {
        if (active?.dialog !== dialog || !dialog.open) return;
        const focused = document.activeElement;
        if (focused !== dialog && focused !== active.dismiss) return;
        (list.querySelector('[aria-pressed="true"],[aria-current="true"]') || list.querySelector('button:not(:disabled)'))?.focus();
    }
    async function open(mode, trigger) {
        if (busy || active || typeof HTMLDialogElement === 'undefined') return;
        const ctx = context();
        if (!ctx) return;
        if (mode === 'episodes' && (!settings.episodes || ctx.item.Type !== 'Episode' || !ctx.item.SeriesId)) return;
        if (mode === 'versions' && !settings.versions) return;
        const api = currentClient();
        if (!api || api.serverId() !== ctx.item.ServerId) return;
        opener = trigger;
        // The native dialog classes keep the player's shortcut guard and the theme's dialog glass.
        const dialog = element('dialog', 'dialog opened lg-player-dialog');
        if (mode === 'episodes') dialog.classList.add('lg-player-dialog-episodes');
        dialog.style.fontFamily = getComputedStyle(opener).fontFamily;
        const content = element('div', 'lg-player-dialog-body');
        const header = element('header', 'lg-player-dialog-header');
        const heading = element('h2', '', label(mode));
        heading.id = 'lg-player-dialog-title';
        dialog.setAttribute('aria-labelledby', heading.id);
        const dismiss = element('button', 'lg-player-dialog-close');
        dismiss.type = 'button';
        const dismissIcon = element('span', 'material-icons', 'close');
        dismissIcon.setAttribute('aria-hidden', 'true');
        dismiss.append(dismissIcon);
        dismiss.setAttribute('aria-label', translate('ButtonClose'));
        dismiss.addEventListener('click', close);
        header.append(heading, dismiss);
        const list = element('div', 'lg-player-dialog-list');
        list.setAttribute('role', 'group');
        list.setAttribute('aria-label', heading.textContent);
        list.addEventListener('scroll', syncScrollHint, { passive: true });
        const area = element('div', 'lg-player-dialog-area');
        area.append(list);
        const status = element('p', 'lg-player-dialog-status');
        status.setAttribute('role', 'status');
        setStatus(status, 'MessagePleaseWait');
        const seasons = element('div', 'lg-player-seasons');
        content.append(seasons, area, status);
        dialog.append(header, content);
        const container = element('div', 'dialogContainer');
        container.append(dialog);
        active = { dialog, container, item: ctx.item, mode, heading, dismiss, list, status, seasons };
        (document.fullscreenElement || document.body).append(container);
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            close();
        });
        // Prevent player keyboard shortcuts while interacting with the dialog.
        dialog.addEventListener('keydown', event => event.stopPropagation());
        // Keep native scrolling, but do not forward wheel gestures to the player.
        dialog.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
        dialog.showModal();
        if (mode === 'episodes') {
            await loadEpisodes(api, ctx, dialog, list, status, seasons);
        } else {
            await loadVersions(api, ctx, dialog, list, status);
        }
    }
    // Playback - play() may resolve before the new stream runs: poll every 200 ms for up to 20 s.
    // started(next) returns true once it runs, false when another item took over, else nothing.
    async function waitForPlayback(token, started) {
        const until = Date.now() + 20000;
        while (!stopped && token === generation && Date.now() < until) {
            const verdict = started(context());
            if (verdict !== undefined) return verdict;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return false;
    }
    // Switch - Lock the choices, start the new playback, close once it runs. play(token) returns whether
    // it started, or null when playback moved on by itself, which also closes the obsolete dialog.
    async function switchPlayback(status, failure, play) {
        const controls = '.lg-player-dialog-option,.lg-player-season-select,.lg-player-season-arrow';
        const token = generation;
        busy = true;
        active.dialog.querySelectorAll(controls).forEach(node => { node.disabled = true; });
        setStatus(status, 'MessagePleaseWait');
        let done = false;
        try {
            const started = await play(token);
            if (started === false && !stopped && token === generation) throw new Error('The new playback did not start.');
            done = true;
        } catch (error) {
            console.warn('LumaaGlaass player switch failed.', error);
            if (active && token === generation) {
                setStatus(status, failure);
                active.dialog.querySelectorAll(controls).forEach(node => { node.disabled = false; });
            }
        } finally {
            busy = false;
            syncSeasonArrows(active?.seasons);
        }
        if (done && token === generation) close();
    }

    // =====================================================================
    // Versions
    // =====================================================================
    async function loadVersions(api, ctx, dialog, list, status) {
        const token = generation;
        try {
            const item = await api.getJSON(api.getUrl('Users/' + encodeURIComponent(api.getCurrentUserId()) + '/Items/' +
                encodeURIComponent(ctx.item.Id), { Fields: 'MediaSources' }));
            if (stopped || token !== generation || active?.dialog !== dialog) return;
            if (!sameItem(context()?.item, ctx.item)) {
                close();
                return;
            }
            const sources = (item.MediaSources || []).filter(source => source.Id && !source.IsInfiniteStream);
            if (sources.length < 2) {
                setStatus(status, 'MessageNoItemsAvailable');
                return;
            }
            for (const source of sources) {
                const choice = element('button', 'lg-player-dialog-option', source.Name || source.Id);
                choice.type = 'button';
                choice.setAttribute('aria-pressed', String(ctx.state.PlayState.MediaSourceId === source.Id));
                choice.addEventListener('click', () => changeVersion(source, ctx, status));
                list.append(choice);
            }
            setStatus(status, '');
            syncScrollHint();
            focusCurrentChoice(dialog, list);
        } catch {
            if (active?.dialog === dialog) setStatus(status, 'ListFailed');
        }
    }
    // Tracks - Track indices belong to a source. Match language/type instead of copying
    // an index from another file; otherwise let the new source choose defaults.
    function trackOptions(ctx, source) {
        const options = {};
        for (const [type, field, option] of [['Audio', 'AudioStreamIndex', 'audioStreamIndex'],
            ['Subtitle', 'SubtitleStreamIndex', 'subtitleStreamIndex']]) {
            const index = ctx.state.PlayState[field];
            if (type === 'Subtitle' && index === -1) {
                options[option] = -1;
                continue;
            }
            const previous = ctx.state.MediaSource?.MediaStreams?.find(stream => stream.Type === type && stream.Index === index);
            if (!previous?.Language) continue;
            const matches = (source.MediaStreams || []).filter(stream => stream.Type === type && stream.Language === previous.Language &&
                Boolean(stream.IsForced) === Boolean(previous.IsForced));
            const match = matches.find(stream => stream.Codec === previous.Codec && stream.Channels === previous.Channels) || matches[0];
            if (match) options[option] = match.Index;
        }
        return options;
    }
    function changeVersion(source, original, status) {
        if (busy) return;
        const ctx = context();
        if (!samePlayback(ctx, original) || ctx.state.PlayState.MediaSourceId === source.Id) {
            close();
            return;
        }
        void switchPlayback(status, 'VersionFailed', async token => {
            const items = await ctx.pm.getPlaylist(ctx.player);
            const now = context();
            if (stopped || token !== generation || !samePlayback(now, original)) return null;
            const startIndex = now.pm.getCurrentPlaylistIndex(now.player);
            if (!Array.isArray(items) || items[startIndex]?.Id !== now.item.Id) throw new Error('The playback queue changed.');
            const ticks = now.state.PlayState.PositionTicks;
            if (!Number.isFinite(ticks) || ticks < 0 || (source.RunTimeTicks && ticks >= source.RunTimeTicks)) {
                throw new Error('This version cannot resume at the current position.');
            }
            const paused = now.state.PlayState.IsPaused;
            await now.pm.play({
                items, startIndex, mediaSourceId: source.Id, startPositionTicks: ticks,
                enableRemotePlayers: false, fullscreen: false, ...trackOptions(now, source)
            });
            return waitForPlayback(token, next => {
                if (next && next.item.Id !== original.item.Id) return false;
                if (next?.state.PlayState.MediaSourceId !== source.Id) return undefined;
                if (paused) next.player.pause();
                return true;
            });
        });
    }

    // =====================================================================
    // Episodes
    // =====================================================================
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
    // Switch - An episode starts from its own position and source defaults, never the
    // previous episode's stream indices or playback timestamp.
    function changeEpisode(episode, items, original, status) {
        if (busy) return;
        const ctx = context();
        if (!samePlayback(ctx, original) || episode.Id === ctx.item.Id) {
            close();
            return;
        }
        void switchPlayback(status, 'EpisodeFailed', async token => {
            const position = episode.UserData?.PlaybackPositionTicks;
            const resume = !episode.UserData?.Played && Number.isFinite(position) && position > 0 &&
                (!episode.RunTimeTicks || position < episode.RunTimeTicks) ? position : 0;
            await ctx.pm.play({
                items, startIndex: items.indexOf(episode), startPositionTicks: resume,
                enableRemotePlayers: false, fullscreen: false
            });
            return waitForPlayback(token, next => {
                if (sameItem(next?.item, { Id: episode.Id, ServerId: original.item.ServerId })) return true;
                return next && next.item.Id !== original.item.Id ? false : undefined;
            });
        });
    }
    function episodeChoice(api, episode, items, ctx, status) {
        const choice = element('button', 'lg-player-dialog-option lg-player-episode');
        choice.type = 'button';
        choice.setAttribute('aria-current', String(episode.Id === ctx.item.Id));
        const thumbnail = element('span', 'lg-player-episode-image');
        thumbnail.setAttribute('aria-hidden', 'true');
        thumbnail.append(element('span', 'material-icons', 'movie'));
        const imageTag = episode.ImageTags?.Primary;
        if (imageTag) {
            const image = element('img');
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.src = api.getUrl('Items/' + encodeURIComponent(episode.Id) + '/Images/Primary',
                { tag: imageTag, maxWidth: 320, quality: 85 });
            image.addEventListener('error', () => image.remove());
            thumbnail.append(image);
        }
        const copy = element('span', 'lg-player-episode-copy');
        const prefix = Number.isFinite(episode.IndexNumber) ? episode.IndexNumber + ' · ' : '';
        const title = element('span', '', prefix + (episode.Name || translate('Episode')));
        copy.append(title);
        choice.append(thumbnail, copy);
        if (episode.UserData?.Played) {
            const watched = element('span', 'lg-player-episode-watched playedIndicator indicator');
            const check = element('span', 'material-icons indicatorIcon check');
            check.setAttribute('aria-hidden', 'true');
            watched.append(check);
            thumbnail.append(watched);
            choice.setAttribute('aria-label', title.textContent + ' · ' + translate('Played'));
        }
        choice.addEventListener('click', () => changeEpisode(episode, items, ctx, status));
        return choice;
    }
    async function loadEpisodes(api, ctx, dialog, list, status, seasons) {
        const token = generation;
        const userId = api.getCurrentUserId();
        const valid = () => !stopped && generation === token && active?.dialog === dialog && samePlayback(context(), ctx) &&
            api.getCurrentUserId() === userId;
        const read = (path, query) => api.getJSON(api.getUrl(path, { UserId: userId, ...query }));
        let entries;
        try {
            const result = await read('Shows/' + encodeURIComponent(ctx.item.SeriesId) + '/Seasons', { IsMissing: false });
            if (!valid()) return;
            entries = (result.Items || []).filter(season => season.Id).sort((a, b) =>
                (Number.isFinite(a.IndexNumber) ? a.IndexNumber : Infinity) - (Number.isFinite(b.IndexNumber) ? b.IndexNumber : Infinity));
        } catch {
            if (active?.dialog === dialog) setStatus(status, 'ListFailed');
            return;
        }
        if (!entries.length) {
            setStatus(status, 'MessageNoItemsAvailable');
            return;
        }
        const seasonPicker = selects?.create({
            controlClass: 'lg-player-season-select', shellClass: 'lg-player-season-select-shell', portal: dialog
        });
        const select = seasonPicker?.control || element('select', 'emby-select lg-player-season-select');
        if (active?.dialog === dialog) active.seasonPicker = seasonPicker;
        select.setAttribute('aria-label', translate('Season'));
        if (seasonPicker) seasonPicker.trigger.setAttribute('aria-label', translate('Season'));
        for (const season of entries) {
            const choice = element('option', '', season.Name || translate('Season') + ' ' + (season.IndexNumber ?? ''));
            choice.value = season.Id;
            select.append(choice);
        }
        seasonPicker?.sync();
        const showSeason = async season => {
            if (busy || !valid()) return;
            const request = ++episodeRequest;
            // Keep the dialog and previous thumbnails stable while only this list loads.
            list.inert = true;
            list.setAttribute('aria-busy', 'true');
            select.value = season.Id;
            seasonPicker?.sync();
            syncSeasonArrows(seasons);
            setStatus(status, 'MessagePleaseWait');
            try {
                const items = [];
                const query = { SeasonId: season.Id, IsMissing: false, Fields: 'UserData,SeriesId' };
                for await (const episodes of episodePages(read, ctx.item.SeriesId, query)) {
                    if (!valid() || request !== episodeRequest) return;
                    items.push(...episodes.map(item => ({ ...item, ServerId: ctx.item.ServerId })));
                }
                list.replaceChildren(...items.map(episode => episodeChoice(api, episode, items, ctx, status)));
                list.scrollTop = 0;
                list.dataset.lgPlayerSeason = season.Id;
                setStatus(status, items.length ? '' : 'MessageNoItemsAvailable');
                syncScrollHint();
            } catch {
                if (valid() && request === episodeRequest) {
                    // If loading fails, keep the selector consistent with the retained list.
                    if (list.dataset.lgPlayerSeason) select.value = list.dataset.lgPlayerSeason;
                    seasonPicker?.sync();
                    syncSeasonArrows(seasons);
                    setStatus(status, 'EpisodesFailed');
                }
            } finally {
                if (valid() && request === episodeRequest) {
                    list.inert = false;
                    list.removeAttribute('aria-busy');
                }
            }
        };
        if (entries.length > 1) {
            select.addEventListener('change', event => {
                event.stopPropagation();
                const season = entries.find(entry => entry.Id === select.value);
                if (season) void showSeason(season);
            });
            const arrow = (direction, className, icon) => {
                const button = element('button', 'lg-player-season-arrow ' + className);
                button.type = 'button';
                const glyph = element('span', 'material-icons', icon);
                glyph.setAttribute('aria-hidden', 'true');
                button.append(glyph);
                button.addEventListener('click', () => {
                    const season = entries[select.selectedIndex + direction];
                    if (season) void showSeason(season);
                });
                return button;
            };
            const navigation = element('div', 'lg-player-season-navigation');
            navigation.append(arrow(-1, 'lg-player-season-previous', 'chevron_left'), seasonPicker?.shell || select,
                arrow(1, 'lg-player-season-next', 'chevron_right'));
            seasons.append(navigation);
        } else {
            seasons.textContent = select.options[0].textContent;
        }
        await showSeason(entries.find(season => season.Id === ctx.item.SeasonId) ||
            entries.find(season => season.IndexNumber === ctx.item.ParentIndexNumber) || entries[0]);
        if (valid()) focusCurrentChoice(dialog, list);
    }

    // =====================================================================
    // Player buttons
    // =====================================================================
    let button = null, episodeButton = null;
    function clearButtons() {
        button?.remove();
        episodeButton?.remove();
        button = episodeButton = null;
    }
    function playerButton(className, icon, mode) {
        const node = element('button', 'paper-icon-button-light autoSize ' + className);
        node.type = 'button';
        const glyph = element('span', 'largePaperIconButton material-icons', icon);
        glyph.setAttribute('aria-hidden', 'true');
        node.append(glyph);
        node.addEventListener('click', () => void open(mode, node));
        return node;
    }
    function syncButton(node, mode) {
        setTitle(node, label(mode));
        setAttribute(node, 'aria-label', label(mode));
        setDisabled(node, busy);
    }
    function syncButtons(ctx) {
        if (!ctx) {
            clearButtons();
            return;
        }
        // The OSD hides itself during playback; its buttons stay until it returns.
        const anchor = document.querySelector('#videoOsdPage:not(.hide) .btnVideoOsdSettings');
        if (!anchor) return;
        if (settings.versions) {
            if (!button?.isConnected) {
                button = playerButton('lg-player-versions-button', 'video_library', 'versions');
                anchor.before(button);
            }
            syncButton(button, 'versions');
        }
        if (settings.episodes && ctx.item.Type === 'Episode' && ctx.item.SeriesId) {
            if (!episodeButton?.isConnected) episodeButton = playerButton('lg-player-episodes-button', 'playlist_play', 'episodes');
            const target = button || anchor;
            if (episodeButton.nextElementSibling !== target) target.before(episodeButton);
            syncButton(episodeButton, 'episodes');
        } else {
            episodeButton?.remove();
            episodeButton = null;
        }
    }

    // =====================================================================
    // Scheduler
    // =====================================================================
    let timer = 0;
    function sync() {
        if (stopped) return;
        try {
            const ctx = context();
            syncDialog(ctx);
            syncButtons(ctx);
        } catch (error) { console.debug('LumaaGlaass player controls are unavailable.', error); }
    }
    function start() {
        if (!settings.versions && !settings.episodes) return;
        document.head.append(style);
        timer = setInterval(sync, 1000);
        sync();
    }

    // =====================================================================
    // Lifecycle
    // =====================================================================
    window[KEY] = {
        stop() {
            stopped = true;
            clearInterval(timer);
            close();
            clearButtons();
            style.remove();
            delete window[KEY];
        }
    };
    start();
})();
