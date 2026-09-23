/* LumaaGlaass - Optional configurable in-player controls. */
(() => {
    'use strict';

    // Configuration - Set window.LumaaGlaassPlayerControlsOptions before loading.
    // Example: { versions: true, episodes: true }. Defaults enable both controls.
    // Invalid values use defaults. Save and fully reload after changes.
    // Installation: docs/customization.md#in-player-controls.
    const configured = window.LumaaGlaassPlayerControlsOptions || {};
    const legacy = window.__lumaaGlaassPlayerControlRequests;
    const settings = Object.fromEntries(['versions', 'episodes'].map(name => [
        name, typeof configured[name] === 'boolean' ? configured[name] : legacy instanceof Set ? legacy.has(name) : true
    ]));

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
    const key = '__lumaaGlaassPlayerControls';
    window.__lumaaGlaassPlayerVersionSwitcher?.stop();
    window.__lumaaGlaassPlayerEpisodeSwitcher?.stop();
    window[key]?.stop();
    let manager, button, episodeButton, opener, dialog, dialogItem, container, stopped = false, busy = false, generation = 0;
    let dialogMode = 'versions', episodeRequest = 0;
    // Reuse the version dialog's theme classes; scope local layout to this extension.
    const style = document.createElement('style');
    style.textContent = `
      .dialog.lg-player-controls { font:inherit; color:var(--aa-text,#f5f5f7); margin:auto; inset:0; width:min(760px,calc(100vw - 32px)); max-width:calc(100% - 32px); max-height:calc(100dvh - 40px); padding:0; box-sizing:border-box; border-radius:24px; overflow:auto; color-scheme:dark; }
      .lg-player-controls::backdrop { background:rgba(0,0,0,.55); }
      .dialog.lg-player-controls[open] { display:flex; flex-direction:column; overflow:hidden; }
      .lg-player-controls header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px; flex-shrink:0; background:transparent; border-bottom:1px solid #ffffff20; }
      .lg-player-controls h2 { font-size:20px; margin:0; overflow-wrap:anywhere; }
      .lg-player-version-close { font:inherit; font-size:26px; color:inherit; background:var(--aa-surface); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:50%; width:46px; height:46px; flex-shrink:0; cursor:pointer; }
      .lg-player-version-body { padding:20px; min-height:0; overflow:auto; overscroll-behavior:contain; }
      .lg-player-version-area { position:relative; padding-bottom:22px; }
      .lg-player-version-area[data-can-scroll-down]::after { content:''; position:absolute; bottom:7px; left:calc(50% - 4px); width:7px; height:7px; border-right:2px solid rgba(255,255,255,.8); border-bottom:2px solid rgba(255,255,255,.8); transform:rotate(45deg); pointer-events:none; }
      .lg-player-version-list { display:flex; flex-direction:column; gap:8px; max-height:55dvh; overflow:auto; overscroll-behavior:contain; scrollbar-gutter:stable; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.55) rgba(255,255,255,.08); padding:3px; padding-inline-end:14px; touch-action:pan-y; }
      .lg-player-version-list::-webkit-scrollbar { width:8px; }
      .lg-player-version-list::-webkit-scrollbar-track { background:rgba(255,255,255,.08); border-radius:8px; }
      .lg-player-version-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.55); border-radius:8px; }
      .lg-player-version-list::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.75); }
      .lg-player-version-option { font:inherit; font-size:14px; color:inherit; text-align:start; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; flex-shrink:0; padding:12px; min-height:44px; border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:10px; background:var(--aa-surface); cursor:pointer; }
      .lg-player-version-option:is([aria-pressed=true],[aria-current=true]) { border-color:var(--aa-ui-selected-edge,rgba(255,255,255,.45)); background:var(--aa-ui-selected-surface,rgba(255,255,255,.16)); }
      .lg-player-version-option:hover:not(:disabled):not([aria-pressed=true]):not([aria-current=true]) { background:var(--aa-ui-hover-surface,rgba(30,30,32,.4)); }
      .lg-player-version-close:hover:not(:disabled) { background:var(--aa-media-hover-surface,rgba(30,30,32,.6)); }
      .lg-player-controls :focus-visible { outline:2px solid white; outline-offset:2px; }
      .lg-player-controls button:disabled { cursor:default; opacity:.45; }
      .lg-player-version-status { margin:12px 0 0; text-align:center; font:inherit; }
      .lg-player-version-status:empty { display:none; }
      .lg-player-episodes .lg-player-version-list { height:55dvh; box-sizing:border-box; }
      .lg-player-episodes .lg-player-version-status { display:block; min-height:1.5em; }
      .lg-player-season-list { margin-bottom:16px; padding:3px; }
      .lg-player-season-select { width:100%; max-width:100%; box-sizing:border-box; font:inherit; color:inherit; min-height:44px; }
      .lg-player-season-select:not(:disabled) { cursor:pointer; }
      .lg-player-season-select:disabled { cursor:default; }
      .lg-player-season-list:empty { display:none; }
      .lg-player-episode-option { display:flex; flex-direction:row; align-items:center; gap:14px; white-space:normal; }
      .lg-player-episode-art { position:relative; display:grid; place-items:center; width:clamp(88px,22vw,160px); aspect-ratio:16/9; flex-shrink:0; overflow:hidden; border-radius:8px; background:rgba(255,255,255,.08); }
      .lg-player-episode-art img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
      .lg-player-episode-copy { display:flex; flex-direction:column; gap:4px; min-width:0; }
      .lg-player-episode-meta { font-size:.875em; color:var(--aa-text-muted,#c5c5ca); }
      @media(max-width:640px) {
        .dialog.lg-player-controls { width:calc(100% - 24px); max-width:calc(100% - 24px); max-height:calc(100dvh - 32px); }
        .lg-player-controls header,.lg-player-version-body { padding:16px; }
      }
      @media(prefers-reduced-transparency:reduce),(forced-colors:active) { .dialog.lg-player-controls { background:Canvas!important; color:CanvasText; backdrop-filter:none!important; } }
    `;
    document.head.append(style);

    // Jellyfin does not expose this manager globally. Resolve only its matching
    // Webpack module, with capability checks; do not execute unrelated modules.
    function resolveManager() {
        if (manager) return manager;
        const chunks = window.webpackChunk;
        if (!Array.isArray(chunks) || chunks.push === Array.prototype.push) return null;
        let require;
        const marker = 'lg-player-versions-' + Date.now();
        chunks.push([[marker], {}, runtime => { require = runtime; }]);
        if (!require?.m) return null;
        const candidates = Object.entries(require.m).filter(([, factory]) => {
            const source = String(factory);
            return source.includes('getCurrentPlaylistIndex') && source.includes('getPlayerState') && source.includes('setAudioStreamIndex') && source.includes('playbackStartTime');
        });
        if (candidates.length !== 1) return null;
        const exports = require(candidates[0][0]);
        manager = Object.values(exports).find(value => value && ['getCurrentPlayer', 'getPlayerState', 'currentItem', 'currentMediaSource', 'play', 'getPlaylist', 'getCurrentPlaylistIndex'].every(method => typeof value[method] === 'function'));
        return manager || null;
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

    function label(mode = 'versions') {
        return mode === 'episodes' ? translate('Episodes', 'Episodes') : translate('LabelVersion', 'Version');
    }

    function translate(name, fallback) {
        return nativeI18n.translate(name) || fallback;
    }

    function setStatus(node, name, fallback) {
        node.dataset.translation = name;
        node.dataset.fallback = fallback;
        node.textContent = name ? translate(name, fallback) : '';
    }

    function syncLabels() {
        if (!dialog) return;
        dialog.querySelector('h2').textContent = label(dialogMode);
        dialog.querySelector('.lg-player-version-list').setAttribute('aria-label', label(dialogMode));
        dialog.querySelector('.lg-player-version-close').setAttribute('aria-label', translate('ButtonClose', 'Close'));
        const status = dialog.querySelector('.lg-player-version-status');
        if (status.dataset.translation) {
            const text = translate(status.dataset.translation, status.dataset.fallback);
            if (status.textContent !== text) status.textContent = text;
        }
    }

    function syncScrollHint() {
        const list = dialog?.querySelector('.lg-player-version-list');
        if (list) list.parentElement.toggleAttribute('data-can-scroll-down', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
    }

    function close() {
        const wasOpen = Boolean(dialog);
        generation++;
        episodeRequest++;
        dialog?.close();
        dialog?.remove();
        container?.remove();
        container = null;
        dialog = null;
        dialogItem = null;
        if (wasOpen && opener?.isConnected) opener.focus({ preventScroll:true });
        opener = null;
    }

    // Track indices belong to a source. Match language/type instead of copying
    // an index from another file; otherwise let the new source choose defaults.
    function trackOptions(ctx, source) {
        const options = {};
        for (const [type, field, option] of [['Audio', 'AudioStreamIndex', 'audioStreamIndex'], ['Subtitle', 'SubtitleStreamIndex', 'subtitleStreamIndex']]) {
            const index = ctx.state.PlayState[field];
            if (type === 'Subtitle' && index === -1) { options[option] = -1; continue; }
            const previous = ctx.state.MediaSource?.MediaStreams?.find(stream => stream.Type === type && stream.Index === index);
            if (!previous?.Language) continue;
            const matches = (source.MediaStreams || []).filter(stream => stream.Type === type && stream.Language === previous.Language && Boolean(stream.IsForced) === Boolean(previous.IsForced));
            const match = matches.find(stream => stream.Codec === previous.Codec && stream.Channels === previous.Channels) || matches[0];
            if (match) options[option] = match.Index;
        }
        return options;
    }

    async function change(source, original, status) {
        if (busy) return;
        let ctx = context();
        if (!ctx || ctx.player !== original.player || ctx.item.Id !== original.item.Id || ctx.item.ServerId !== original.item.ServerId) { close(); return; }
        if (ctx.state.PlayState.MediaSourceId === source.Id) { close(); return; }
        busy = true;
        dialog?.querySelectorAll('.lg-player-version-list button').forEach(node => { node.disabled = true; });
        setStatus(status, 'MessagePleaseWait', 'Please wait');
        const token = generation;
        try {
            const items = await ctx.pm.getPlaylist(ctx.player);
            ctx = context();
            if (stopped || token !== generation || !ctx || ctx.player !== original.player || ctx.item.Id !== original.item.Id || ctx.item.ServerId !== original.item.ServerId) return;
            const startIndex = ctx.pm.getCurrentPlaylistIndex(ctx.player);
            if (!Array.isArray(items) || items[startIndex]?.Id !== ctx.item.Id) throw new Error('The playback queue changed.');
            const ticks = ctx.state.PlayState.PositionTicks;
            if (!Number.isFinite(ticks) || ticks < 0 || (source.RunTimeTicks && ticks >= source.RunTimeTicks)) throw new Error('This version cannot resume at the current position.');
            const paused = ctx.state.PlayState.IsPaused;
            await ctx.pm.play({ items, startIndex, mediaSourceId:source.Id, startPositionTicks:ticks, enableRemotePlayers:false, fullscreen:false, ...trackOptions(ctx, source) });
            // The native play promise may resolve before the new source is ready.
            const until = Date.now() + 20000;
            let confirmed = false;
            while (!stopped && token === generation && Date.now() < until) {
                const next = context();
                if (next && next.item.Id !== original.item.Id) break;
                if (next?.state.PlayState.MediaSourceId === source.Id) {
                    if (paused) next.player.pause();
                    confirmed = true;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            if (!confirmed && !stopped && token === generation) throw new Error('The selected version did not start.');
            if (token === generation) close();
        } catch (error) {
            console.warn('LumaaGlaass player version switch failed.', error);
            if (dialog && token === generation) {
                setStatus(status, 'ErrorDefault', 'Unable to switch version. Close this window and try again.');
                dialog.querySelectorAll('.lg-player-version-list button').forEach(node => { node.disabled = false; });
            }
        } finally { busy = false; }
    }

    // Episodes use their own position and source defaults, never the previous
    // episode's stream indices or playback timestamp.
    async function changeEpisode(episode, items, original, status) {
        if (busy) return;
        const ctx = context(), token = generation;
        if (!ctx || ctx.player !== original.player || ctx.item.Id !== original.item.Id || ctx.item.ServerId !== original.item.ServerId) { close(); return; }
        if (episode.Id === ctx.item.Id) { close(); return; }
        busy = true;
        dialog.querySelectorAll('.lg-player-version-option,.lg-player-season-select').forEach(n => { n.disabled = true; });
        setStatus(status, 'MessagePleaseWait', 'Please wait');
        try {
            const position = episode.UserData?.PlaybackPositionTicks;
            const resume = !episode.UserData?.Played && Number.isFinite(position) && position > 0 && (!episode.RunTimeTicks || position < episode.RunTimeTicks) ? position : 0;
            await ctx.pm.play({ items, startIndex:items.indexOf(episode), startPositionTicks:resume, enableRemotePlayers:false, fullscreen:false });
            const until = Date.now() + 20000;
            let confirmed = false;
            while (!stopped && token === generation && Date.now() < until) {
                const next = context();
                if (next?.item.Id === episode.Id && next.item.ServerId === original.item.ServerId) { confirmed = true; break; }
                if (next && next.item.Id !== original.item.Id) break;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            if (!confirmed && !stopped && token === generation) throw new Error('The selected episode did not start.');
            if (token === generation) close();
        } catch {
            if (dialog && token === generation) {
                setStatus(status, 'ErrorDefault', 'Unable to play this episode. Try again or close this window.');
                dialog.querySelectorAll('.lg-player-version-option,.lg-player-season-select').forEach(n => { n.disabled = false; });
            }
        } finally { busy = false; }
    }

    async function loadEpisodes(api, ctx, node, list, status, seasons) {
        const token = generation;
        const valid = () => {
            const next = context();
            return !stopped && generation === token && dialog === node && next?.item.Id === ctx.item.Id && next.item.ServerId === ctx.item.ServerId && next.player === ctx.player && api.getCurrentUserId() === userId;
        };
        const userId = api.getCurrentUserId();
        const read = (path, query) => api.getJSON(api.getUrl(path, {UserId:userId, ...query}));
        const showSeason = async season => {
            if (busy || !valid()) return;
            const request = ++episodeRequest;
            // Keep the dialog and previous thumbnails stable while only this list loads.
            list.inert = true;
            list.setAttribute('aria-busy', 'true');
            const select = seasons.querySelector('select');
            if (select) select.value = season.Id;
            setStatus(status, 'MessagePleaseWait', 'Please wait');
            try {
                const items = [];
                let offset = 0;
                while (true) {
                    const result = await read('Shows/' + encodeURIComponent(ctx.item.SeriesId) + '/Episodes', {
                        SeasonId:season.Id, StartIndex:offset, Limit:100, Fields:'UserData,SeriesId', IsMissing:false
                    });
                    if (!valid() || request !== episodeRequest) return;
                    const batch = result.Items || [];
                    items.push(...batch.filter(item => item.Id && item.Type === 'Episode' && !item.IsMissing && item.LocationType !== 'Virtual' && (!item.SeriesId || item.SeriesId === ctx.item.SeriesId)).map(item => ({...item, ServerId:ctx.item.ServerId})));
                    offset += batch.length;
                    if (!batch.length || offset >= (result.TotalRecordCount ?? offset)) break;
                    if (offset >= 5000) throw new Error('Episode list too large.');
                }
                const fragment = document.createDocumentFragment();
                for (const episode of items) {
                    const choice = document.createElement('button');
                    choice.type = 'button'; choice.className = 'lg-player-version-option lg-player-episode-option';
                    const active = episode.Id === ctx.item.Id;
                    choice.setAttribute('aria-current', String(active));
                    // Share the theme's selected-option state with versions and seasons.
                    choice.setAttribute('aria-pressed', String(active));
                    const art = document.createElement('span'); art.className = 'lg-player-episode-art';
                    art.setAttribute('aria-hidden', 'true');
                    const placeholder = document.createElement('span'); placeholder.className = 'material-icons'; placeholder.textContent = 'movie';
                    art.append(placeholder);
                    const imageTag = episode.ImageTags?.Primary;
                    if (imageTag) {
                        const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
                        image.src = api.getUrl('Items/' + encodeURIComponent(episode.Id) + '/Images/Primary', {tag:imageTag, maxWidth:320, quality:85});
                        image.onerror = () => image.remove();
                        art.append(image);
                    }
                    const copy = document.createElement('span'); copy.className = 'lg-player-episode-copy';
                    choice.append(art, copy);
                    const title = document.createElement('span');
                    const prefix = Number.isFinite(episode.IndexNumber) ? episode.IndexNumber + ' · ' : '';
                    title.textContent = prefix + (episode.Name || translate('Episode', 'Episode'));
                    copy.append(title);
                    const detail = document.createElement('span'); detail.className = 'lg-player-episode-meta';
                    if (!active) detail.textContent = episode.UserData?.Played ? translate('Played', 'Played') : '';
                    if (detail.textContent) copy.append(detail);
                    choice.onclick = () => changeEpisode(episode, items, ctx, status);
                    fragment.append(choice);
                }
                list.replaceChildren(fragment);
                list.scrollTop = 0;
                list.dataset.season = season.Id;
                setStatus(status, items.length ? '' : 'MessageNoItemsAvailable', 'No episodes available.');
                syncScrollHint();
            } catch {
                if (valid() && request === episodeRequest) {
                    // If loading fails, keep the selector consistent with the retained list.
                    if (select && list.dataset.season) select.value = list.dataset.season;
                    setStatus(status, 'ErrorDefault', 'Unable to load episodes. Close this window and try again.');
                }
            } finally {
                if (valid() && request === episodeRequest) {
                    list.inert = false;
                    list.removeAttribute('aria-busy');
                }
            }
        };
        const result = await read('Shows/' + encodeURIComponent(ctx.item.SeriesId) + '/Seasons', {IsMissing:false});
        if (!valid()) return;
        const entries = (result.Items || []).filter(s => s.Id);
        if (!entries.length) { setStatus(status, 'MessageNoItemsAvailable', 'No seasons available.'); return; }
        const select = document.createElement('select');
        select.className = 'emby-select lg-player-season-select';
        select.setAttribute('aria-label', translate('Season', 'Season'));
        for (const season of entries) {
            const choice = document.createElement('option'); choice.value = season.Id;
            choice.textContent = season.Name || translate('Season', 'Season') + ' ' + (season.IndexNumber ?? '');
            select.append(choice);
        }
        if (entries.length > 1) {
            select.onchange = event => { event.stopPropagation(); const season = entries.find(s => s.Id === select.value); if (season) showSeason(season); };
            seasons.append(select);
        } else seasons.textContent = select.options[0].textContent;
        await showSeason(entries.find(s => s.Id === ctx.item.SeasonId) || entries.find(s => s.IndexNumber === ctx.item.ParentIndexNumber) || entries[0]);
    }

    async function open(mode = 'versions') {
        if (busy || dialog || typeof HTMLDialogElement === 'undefined') return;
        const ctx = context();
        if (!ctx) return;
        if (mode === 'episodes' && (!settings.episodes || ctx.item.Type !== 'Episode' || !ctx.item.SeriesId)) return;
        if (mode === 'versions' && !settings.versions) return;
        dialogMode = mode;
        const api = window.ApiClient;
        if (!api || api.serverId() !== ctx.item.ServerId) return;
        opener = mode === 'episodes' ? episodeButton : button;
        const node = document.createElement('dialog');
        dialog = node;
        dialogItem = ctx.item;
        // Keep the native dialog guard for player shortcuts, while matching the
        // optional playback dialog's visual treatment rather than action sheets.
        node.className = 'dialog opened lg-player-controls';
        if (mode === 'episodes') node.classList.add('lg-player-episodes');
        node.style.fontFamily = getComputedStyle(opener).fontFamily;
        const content = document.createElement('div');
        content.className = 'lg-player-version-body';
        const header = document.createElement('header');
        const title = document.createElement('h2');
        title.id = 'lg-player-controls-title';
        title.textContent = label(mode);
        node.setAttribute('aria-labelledby', title.id);
        const dismiss = document.createElement('button');
        dismiss.className = 'lg-player-version-close';
        dismiss.type = 'button';
        dismiss.textContent = '×';
        dismiss.setAttribute('aria-label', translate('ButtonClose', 'Close'));
        dismiss.onclick = close;
        header.append(title, dismiss);
        const list = document.createElement('div');
        list.className = 'lg-player-version-list';
        list.setAttribute('role', 'group');
        list.setAttribute('aria-label', title.textContent);
        list.addEventListener('scroll', syncScrollHint, { passive:true });
        const area = document.createElement('div');
        area.className = 'lg-player-version-area';
        area.append(list);
        const status = document.createElement('p');
        status.className = 'lg-player-version-status';
        status.setAttribute('role', 'status');
        setStatus(status, 'MessagePleaseWait', 'Please wait');
        const seasons = document.createElement('div'); seasons.className = 'lg-player-season-list';
        content.append(seasons, area, status);
        node.append(header, content);
        container = document.createElement('div');
        container.className = 'dialogContainer lg-player-version-container';
        container.append(node);
        (document.fullscreenElement || document.body).append(container);
        node.addEventListener('cancel', event => { event.preventDefault(); close(); });
        // Prevent player keyboard shortcuts while interacting with the dialog.
        node.addEventListener('keydown', event => event.stopPropagation());
        // Keep native scrolling, but do not forward wheel gestures to the player.
        node.addEventListener('wheel', event => event.stopPropagation(), { passive:true });
        node.showModal();
        const token = generation;
        try {
            if (mode === 'episodes') { await loadEpisodes(api, ctx, node, list, status, seasons); return; }
            const item = await api.getJSON(api.getUrl('Users/' + encodeURIComponent(api.getCurrentUserId()) + '/Items/' + encodeURIComponent(ctx.item.Id), { Fields:'MediaSources' }));
            if (stopped || token !== generation || dialog !== node) return;
            if (context()?.item.Id !== ctx.item.Id) { close(); return; }
            const sources = (item.MediaSources || []).filter(source => source.Id && !source.IsInfiniteStream);
            if (sources.length < 2) { setStatus(status, 'MessageNoItemsAvailable', 'No alternative version available.'); return; }
            for (const source of sources) {
                const choice = document.createElement('button');
                choice.type = 'button';
                choice.className = 'lg-player-version-option';
                const selected = ctx.state.PlayState.MediaSourceId === source.Id;
                choice.setAttribute('aria-pressed', String(selected));
                choice.textContent = source.Name || source.Id;
                choice.onclick = () => change(source, ctx, status);
                list.append(choice);
            }
            setStatus(status, '', '');
            syncScrollHint();
        } catch { if (dialog === node) setStatus(status, 'ErrorDefault', 'Unable to load this list. Close this window and try again.'); }
    }

    function sync() {
        if (stopped) return;
        syncLabels();
        syncScrollHint();
        try {
            const anchor = document.querySelector('#videoOsdPage:not(.hide) .btnVideoOsdSettings');
            const ctx = anchor && context();
            if (!ctx) { button?.remove(); episodeButton?.remove(); button = episodeButton = null; if (!busy) close(); return; }
            if (!busy && dialogItem && (ctx.item.Id !== dialogItem.Id || ctx.item.ServerId !== dialogItem.ServerId)) close();
            if (settings.versions) {
                if (!button?.isConnected) {
                    button = document.createElement('button'); button.type = 'button';
                    button.className = 'paper-icon-button-light autoSize lg-player-version-button';
                    const icon = document.createElement('span'); icon.className = 'largePaperIconButton material-icons';
                    icon.textContent = 'video_library'; icon.setAttribute('aria-hidden', 'true');
                    button.append(icon); button.onclick = () => open('versions'); anchor.before(button);
                }
                button.title = label(); button.setAttribute('aria-label', label()); button.disabled = busy;
            }
            if (settings.episodes && ctx.item.Type === 'Episode' && ctx.item.SeriesId) {
                if (!episodeButton?.isConnected) {
                    episodeButton = document.createElement('button'); episodeButton.type = 'button';
                    episodeButton.className = 'paper-icon-button-light autoSize lg-player-episode-button';
                    const icon = document.createElement('span'); icon.className = 'largePaperIconButton material-icons';
                    icon.textContent = 'playlist_play'; icon.setAttribute('aria-hidden', 'true');
                    episodeButton.append(icon); episodeButton.onclick = () => open('episodes');
                }
                const target = button || anchor;
                if (episodeButton.nextElementSibling !== target) target.before(episodeButton);
                episodeButton.title = label('episodes'); episodeButton.setAttribute('aria-label', label('episodes')); episodeButton.disabled = busy;
            } else { episodeButton?.remove(); episodeButton = null; }
        } catch (error) { console.debug('LumaaGlaass player controls are unavailable.', error); }
    }
    let timer = null;
    function start() {
        if (!settings.versions && !settings.episodes) return;
        if (!timer) timer = setInterval(sync, 1000);
        sync();
    }
    window[key] = {
        enableLegacy(name) {
            if (!['versions', 'episodes'].includes(name) || typeof configured[name] === 'boolean') return;
            settings[name] = true;
            start();
        },
        stop() {
            stopped = true; clearInterval(timer); close(); button?.remove(); episodeButton?.remove();
            style.remove(); delete window[key];
        }
    };
    start();
})();
