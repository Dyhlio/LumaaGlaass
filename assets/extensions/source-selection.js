/* LumaaGlaass - Optional source selection interface. */
(() => {
    'use strict';

    // Configuration - Set before loading; save and reload after changing the mode.
    // native: Jellyfin controls, panel: inline source list, dialog: selection before Play.
    const requested = window.LumaaGlaassSourceSelectionOptions?.mode;
    const mode = ['native', 'panel', 'dialog'].includes(requested) ? requested : 'native';
    const key = '__lumaaGlaassSourceSelection';
    window[key]?.stop();
    window.__lumaaGlaassSourcePanel?.stop();
    window.__lumaaGlaassPlaybackDialog?.stop();

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

    // Native model - Both views read and update the same Jellyfin form.
    const visible = node => node && !node.closest('.hide,[hidden]');
    const labelFor = select => select.closest('.selectContainer')?.querySelector('.selectLabel')?.textContent.trim() || select.getAttribute('label') || select.getAttribute('aria-label') || '';
    const optionSignature = select => JSON.stringify(Array.from(select.options, option => [option.value, option.textContent, option.disabled, Boolean(option.parentElement.disabled)]));
    function context() {
        const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(node => visible(node) && node.getClientRects().length);
        const select = page?.querySelector('.selectSource');
        const form = select?.closest('.trackSelections');
        const label = select && labelFor(select);
        if (!/^#\/details(?:\.html)?(?:\?|$)/.test(location.hash) || !form || !visible(form) ||
            !select.options.length || !label || page.classList.contains('aa-collection-page')) return null;
        return {page, select, form, label};
    }
    function choose(select, index) {
        const option = select?.options[index];
        if (!select?.isConnected || select.disabled || !option || option.disabled || option.parentElement.disabled) return false;
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', {bubbles:true}));
        return true;
    }

    // Views - Only the selected presentation installs its styles and controls.
    function createPanel() {
        const style = document.createElement('style');
        style.textContent = `
            body #itemDetailPage#itemDetailPage .trackSelections > .selectSourceContainer[data-lg-source-hidden] { display:none!important; }
            .lg-source-panel { position:relative; grid-column:1 / -1; grid-row:20; min-width:0; margin-top:24px; padding:18px 18px 28px; box-sizing:border-box; background:var(--aa-surface,rgba(30,30,32,.4)); border:1px solid rgba(255,255,255,.12); border-radius:14px; color:inherit; }
            .lg-source-panel h2 { margin:0 0 16px; font-family:inherit; font-weight:600; font-size:18px; line-height:1.4; }
            .lg-source-list { display:flex; flex-direction:column; gap:8px; max-height:min(var(--lg-source-list-height,560px),65vh); overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.55) rgba(255,255,255,.08); scrollbar-gutter:stable; padding:3px; padding-inline-end:14px; }
            .lg-source-list::-webkit-scrollbar { width:8px; }
            .lg-source-list::-webkit-scrollbar-track { background:rgba(255,255,255,.08); border-radius:8px; }
            .lg-source-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.55); border-radius:8px; }
            .lg-source-list::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.75); }
            .lg-source-panel[data-can-scroll-down]::after { content:''; position:absolute; bottom:11px; left:calc(50% - 4px); width:7px; height:7px; border-right:2px solid rgba(255,255,255,.8); border-bottom:2px solid rgba(255,255,255,.8); transform:rotate(45deg); pointer-events:none; }
            .lg-source-option { display:block; flex-shrink:0; width:100%; box-sizing:border-box; min-height:64px; padding:12px 14px; border:1px solid transparent; border-radius:14px; background:rgba(255,255,255,.035); color:inherit; font:inherit; font-size:14px; line-height:1.45; text-align:start; white-space:pre-wrap; overflow-wrap:anywhere; cursor:pointer; }
            .lg-source-option:hover:not(:disabled) { background:rgba(255,255,255,.09); }
            .lg-source-option[aria-pressed="true"] { border-color:rgba(255,255,255,.65); background:rgba(255,255,255,.13); }
            .lg-source-option:focus-visible { outline:2px solid currentColor; outline-offset:1px; }
            .lg-source-option:disabled { opacity:.45; cursor:default; }
            .lg-source-option:has(.lg-source-provider) { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:14px; align-items:center; }
            .lg-source-provider { font-weight:600; }
            @media(min-width:1200px) {
                body #itemDetailPage#itemDetailPage.lg-source-layout .detailPagePrimaryContainer { grid-template-columns:clamp(150px,12vw,220px) minmax(0,1fr) clamp(360px,38vw,760px)!important; column-gap:clamp(24px,2vw,40px)!important; }
                body #itemDetailPage#itemDetailPage.lg-source-layout:has(.detailImageContainer .portraitCard) .detailPagePrimaryContainer { grid-template-columns:clamp(200px,17vw,340px) minmax(0,1fr) clamp(360px,36vw,760px)!important; }
                .lg-source-panel { grid-column:3; grid-row:1 / span 6; align-self:start; margin:0; }
                .lg-source-list { max-height:var(--lg-source-list-height,560px); }
            }
            @media(max-width:1199px) {
                body #itemDetailPage#itemDetailPage.lg-source-layout .lg-source-panel { grid-column:2; grid-row:2; margin-top:20px; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .trackSelections:not(.hide) { grid-column:2; grid-row:3; margin-top:16px!important; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .detailSectionContent { grid-column:2; grid-row:4; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .itemDetailsGroup { grid-column:2; grid-row:5; }
                .lg-source-list { max-height:max(var(--lg-source-two-rows,0px),min(var(--lg-source-list-height,560px),40vh)); }
            }
            @media(max-width:640px) {
                .lg-source-option { padding:14px; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .lg-source-panel { grid-column:1; grid-row:3; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .trackSelections:not(.hide) { grid-column:1; grid-row:4; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .detailSectionContent { grid-column:1; grid-row:5; }
                body #itemDetailPage#itemDetailPage.lg-source-layout .itemDetailsGroup { grid-column:1; grid-row:6; }
            }
        `;
        document.head.append(style);
        let current = null;

        function syncScrollHint() {
            if (!current) return;
            const { list, panel } = current;
            panel.toggleAttribute('data-can-scroll-down', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
        }

        function clear() {
            if (!current) return;
            current.row.removeAttribute('data-lg-source-hidden');
            current.page.classList.remove('lg-source-layout');
            current.panel.remove();
            current = null;
        }

        function sync() {
            const ctx = context();
            const {page, select, form, label} = ctx || {};
            const row = select?.closest('.selectSourceContainer');
            const parent = page?.querySelector('.detailPagePrimaryContainer');
            if (!ctx || !row || !parent || select.options.length < 2 ||
                row.closest('.hide,[hidden]') || !parent.querySelector('.portraitCard,.backdropCard,.squareCard')) {
                clear();
                return;
            }
            if (current && (current.select !== select || current.route !== location.hash || !current.panel.isConnected)) clear();
            if (!current) {
                const panel = document.createElement('section');
                panel.className = 'lg-source-panel';
                const heading = document.createElement('h2');
                const list = document.createElement('div');
                list.className = 'lg-source-list';
                list.setAttribute('role', 'group');
                list.addEventListener('scroll', syncScrollHint, { passive:true });
                panel.append(heading, list);
                // Match keyboard reading order without changing the native track form.
                form.before(panel);
                current = { page, select, row, panel, heading, list, route:location.hash, signature:'' };
                page.classList.add('lg-source-layout');
                row.setAttribute('data-lg-source-hidden', '');
                list.addEventListener('click', event => {
                    const button = event.target.closest('.lg-source-option');
                    if (!button || button.disabled || current?.list !== list || !select.isConnected) return;
                    const index = Number(button.dataset.index);
                    const option = select.options[index];
                    if (optionSignature(select) !== current.signature || !choose(select, index)) { sync(); return; }
                    sync();
                });
            }
            const { heading, list } = current;
            if (heading.textContent !== label) heading.textContent = label;
            list.setAttribute('aria-label', label);
            const options = Array.from(select.options);
            const signature = optionSignature(select);
            if (current.signature !== signature) {
                const fragment = document.createDocumentFragment();
                options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'lg-source-option';
                    button.dataset.index = String(index);
                    const text = option.textContent.trim();
                    const split = text.search(/[🎥🎞📺]/u);
                    if (split > 0) {
                        const provider = document.createElement('span');
                        provider.className = 'lg-source-provider';
                        provider.textContent = text.slice(0, split).trim();
                        const details = document.createElement('span');
                        details.textContent = text.slice(split).replace(/\s*([📦🌍🌐📁])/gu, '\n$1');
                        button.append(provider, details);
                    } else button.textContent = text;
                    fragment.append(button);
                });
                list.replaceChildren(fragment);
                current.signature = signature;
            }
            Array.from(list.children).forEach((button, index) => {
                button.disabled = select.disabled || options[index].disabled || Boolean(options[index].parentElement.disabled);
                button.setAttribute('aria-pressed', String(index === select.selectedIndex));
            });
            // Keep the desktop panel above the last metadata row, with at most six sources.
            const rows = Array.from(list.children).slice(0, 6);
            let height = Math.floor(rows.reduce((total, button) => total + button.getBoundingClientRect().height, 0) + Math.max(0, rows.length - 1) * 8);
            if (window.matchMedia('(min-width:1200px)').matches) {
                const visible = node => node.getClientRects().length && !node.closest('.hide,[hidden]');
                const studio = Array.from(page.querySelectorAll('.studiosGroup')).find(visible);
                const fallback = Array.from(page.querySelectorAll('.detailsGroupItem,.detailSectionContent')).filter(visible);
                const bottom = studio?.getBoundingClientRect().bottom ?? Math.max(...fallback.map(node => node.getBoundingClientRect().bottom));
                if (Number.isFinite(bottom)) {
                    const panelStyle = getComputedStyle(current.panel);
                    const listStyle = getComputedStyle(list);
                    const inset = parseFloat(panelStyle.paddingBottom) + parseFloat(panelStyle.borderBottomWidth) + parseFloat(listStyle.paddingTop) + parseFloat(listStyle.paddingBottom);
                    height = Math.min(height, Math.max(0, Math.floor(bottom - list.getBoundingClientRect().top - inset)));
                }
            }
            const listHeight = `${height}px`;
            if (list.style.getPropertyValue('--lg-source-list-height') !== listHeight) list.style.setProperty('--lg-source-list-height', listHeight);
            // Show two complete sources on narrow screens, even with long filenames.
            const firstTwo = rows.slice(0, 2);
            const twoRowsHeight = `${Math.ceil(firstTwo.reduce((total, button) => total + button.getBoundingClientRect().height, 0) + Math.max(0, firstTwo.length - 1) * 8)}px`;
            if (list.style.getPropertyValue('--lg-source-two-rows') !== twoRowsHeight) list.style.setProperty('--lg-source-two-rows', twoRowsHeight);
            syncScrollHint();
        }

        return { sync, stop() {
            clear();
            style.remove();
        } };

    }
    function createDialog() {
        if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return null;
        const style = document.createElement('style');
        style.textContent = `
          body #itemDetailPage#itemDetailPage .trackSelections[data-lg-playback-hidden] { display:none!important; }
          .lg-playback-dialog { color:var(--aa-text,#f5f5f7); background:var(--aa-surface,rgba(30,30,32,.4)); backdrop-filter:blur(var(--aa-panel-blur,23px)); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:24px; width:min(760px,calc(100vw - 32px)); max-height:calc(100dvh - 40px); padding:0; box-sizing:border-box; font:inherit; overflow:auto; color-scheme:dark; box-shadow:0 12px 36px rgba(0,0,0,.3); }
          .lg-playback-dialog::backdrop { background:rgba(0,0,0,.55); }
          .lg-playback-dialog[open] { display:flex; flex-direction:column; overflow:hidden; }
          .lg-playback-header,.lg-playback-footer { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px; background:transparent; flex-shrink:0; }
          .lg-playback-header { border-bottom:1px solid #ffffff20; }
          .lg-playback-header h2 { font-size:20px; margin:0; overflow-wrap:anywhere; }
          .lg-playback-close { font:inherit; font-size:26px; color:inherit; background:var(--aa-surface); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:50%; width:46px; height:46px; flex-shrink:0; cursor:pointer; }
          .lg-playback-body { padding:20px; min-height:0; overflow:auto; overscroll-behavior:contain; }
          .lg-playback-label { display:block; margin:0 0 8px; font-size:13px; line-height:1.4; font-weight:600; color:#e0e0e5; }
          .lg-playback-source-area { position:relative; padding-bottom:22px; }
          .lg-playback-source-area[data-can-scroll-down]::after { content:''; position:absolute; bottom:7px; left:calc(50% - 4px); width:7px; height:7px; border-right:2px solid rgba(255,255,255,.8); border-bottom:2px solid rgba(255,255,255,.8); transform:rotate(45deg); pointer-events:none; }
          .lg-playback-sources { display:flex; flex-direction:column; gap:8px; max-height:38vh; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-gutter:stable; scrollbar-color:rgba(255,255,255,.55) rgba(255,255,255,.08); padding:3px; padding-inline-end:14px; }
          .lg-playback-sources::-webkit-scrollbar { width:8px; }
          .lg-playback-sources::-webkit-scrollbar-track { background:rgba(255,255,255,.08); border-radius:8px; }
          .lg-playback-sources::-webkit-scrollbar-thumb { background:rgba(255,255,255,.55); border-radius:8px; }
          .lg-playback-sources::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.75); }
          .lg-playback-source { font:inherit; font-size:14px; color:inherit; text-align:start; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; flex-shrink:0; padding:12px; min-height:44px; border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:10px; background:var(--aa-surface); cursor:pointer; }
          .lg-playback-source[aria-pressed=true] { border-color:rgba(255,255,255,.3); background:var(--aa-selected-surface,rgba(255,255,255,.12)); }
          .lg-playback-source:hover:not(:disabled),.lg-playback-close:hover { background:var(--aa-hover-surface,rgba(255,255,255,.08)); }
          .lg-playback-tracks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:20px; }
          .lg-playback-field { min-width:0; }
          .lg-playback-field select { width:100%; min-width:0; min-height:48px; box-sizing:border-box; padding:12px 56px 12px 14px; border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:10px; background:var(--aa-surface); color:inherit; font:inherit; font-size:15px; line-height:1.5; box-shadow:var(--aa-glass-shadow); appearance:none; background-image:var(--lg-playback-arrow); background-repeat:no-repeat; background-position:right 10px center; cursor:pointer; }
          .lg-playback-field select:dir(rtl) { padding-inline:14px 56px; background-position:left 10px center; }
          .lg-playback-field span { display:block; margin-bottom:8px; font-size:13px; line-height:1.4; font-weight:600; color:#e0e0e5; }
          .lg-playback-field select option { background:#23262c; color:#f5f5f7; font:inherit; }
          @supports (appearance:base-select) {
            .lg-playback-field select,.lg-playback-field select::picker(select) { appearance:base-select; }
            .lg-playback-field select { background-image:none; padding:7px 10px 7px 14px; display:flex; align-items:center; gap:12px; }
            .lg-playback-field select::picker-icon { content:''; display:block; flex:0 0 32px; width:32px; height:32px; margin-inline-start:auto; background:var(--lg-playback-arrow) center/32px 32px no-repeat; }
            .lg-playback-field select::picker(select) { background:var(--aa-surface); color:#f5f5f7; backdrop-filter:blur(var(--aa-panel-blur,23px)); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:16px; padding:6px; margin-block:8px; box-shadow:0 12px 36px rgba(0,0,0,.3); box-sizing:border-box; width:anchor-size(width); max-width:calc(100vw - 24px); max-height:min(360px,55dvh); overflow:auto; overscroll-behavior:contain; font:inherit; }
            .lg-playback-field select option { padding:12px; min-height:44px; box-sizing:border-box; border-radius:10px; background:transparent; line-height:1.5; white-space:normal; overflow-wrap:anywhere; cursor:pointer; gap:12px; }
            .lg-playback-field select option + option { margin-block-start:var(--aa-option-gap); }
            .lg-playback-field select option:checked { background:var(--aa-selected-surface); font-weight:600; }
            .lg-playback-field select option:hover,.lg-playback-field select option:focus-visible { background:var(--aa-hover-surface); outline:1px solid rgba(255,255,255,.3); outline-offset:-1px; }
          }
          .lg-playback-footer { border-top:1px solid #ffffff20; justify-content:center; }
          .lg-playback-launch { padding:12px 30px; min-height:46px; border:0; border-radius:30px; background:#f5f5f7; color:#151518; font:inherit; font-weight:600; cursor:pointer; }
          .lg-playback-launch:not(:disabled):hover { transform:scale(1.03); box-shadow:none; }
          @media(prefers-reduced-motion:reduce) { .lg-playback-launch { transition:none!important; } .lg-playback-launch:not(:disabled):hover { transform:none; } }
          .lg-playback-launch::before { content:''; display:inline-block; border-block:6px solid transparent; border-inline-start:9px solid currentColor; margin-inline-end:12px; vertical-align:-1px; }
          .lg-playback-dialog button:disabled { opacity:.45; cursor:default; }
          .lg-playback-dialog :focus-visible { outline:2px solid white; outline-offset:2px; }
          @media(max-width:640px) {
            .lg-playback-dialog { inset:0; margin:auto; width:calc(100% - 24px); max-width:calc(100% - 24px); max-height:calc(100dvh - 32px); border-radius:24px; }
            .lg-playback-header,.lg-playback-footer,.lg-playback-body { padding:16px; }
            .lg-playback-tracks { grid-template-columns:minmax(0,1fr); }
            .lg-playback-field select { font-size:16px; }
          }
          @media(prefers-reduced-transparency:reduce),(forced-colors:active) { .lg-playback-dialog,.lg-playback-field select::picker(select) { background:Canvas; color:CanvasText; backdrop-filter:none; } }
        `;
        document.head.append(style);
        let hiddenForm = null;
        let active = null;
        let bypass = null;


        function syncScrollHint() {
            if (!active) return;
            const { list } = active;
            list.parentElement.toggleAttribute('data-can-scroll-down', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
        }


        function close() {
            if (!active) return;
            const { dialog, trigger } = active;
            active = null;
            dialog.close();
            dialog.remove();
            if (trigger.isConnected) trigger.focus({ preventScroll:true });
        }

        function syncDialog(ctx) {
            if (!active) return;
            if (!ctx || ctx.select !== active.select || location.hash !== active.route) { close(); return; }
            const { list, fields, launch } = active;
            const signature = optionSignature(ctx.select);
            if (signature !== active.signature) {
                list.replaceChildren(...Array.from(ctx.select.options, (option, index) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'lg-playback-source';
                    button.textContent = option.textContent;
                    button.addEventListener('click', () => {
                        const nativeOption = ctx.select.options[index];
                        if (!active || optionSignature(ctx.select) !== active.signature || !nativeOption || nativeOption.disabled || nativeOption.parentElement.disabled || ctx.select.disabled) { sync(); return; }
                        active.readyAt = Date.now() + 500;
                        choose(ctx.select, index);
                        sync();
                    });
                    return button;
                }));
                active.signature = signature;
            }
            Array.from(list.children).forEach((button, index) => {
                const option = ctx.select.options[index];
                button.disabled = ctx.select.disabled || option.disabled || Boolean(option.parentElement.disabled);
                button.setAttribute('aria-pressed', String(ctx.select.selectedIndex === index));
            });
            for (const field of fields) {
                const native = ctx.form.querySelector(field.selector);
                field.wrapper.hidden = !native || !visible(native) || !native.options.length;
                if (field.wrapper.hidden) continue;
                field.label.textContent = labelFor(native);
                const next = optionSignature(native);
                if (field.signature !== next) {
                    field.select.replaceChildren(...Array.from(native.options, option => {
                        const copy = new Option(option.textContent, option.value);
                        copy.disabled = option.disabled || Boolean(option.parentElement.disabled);
                        return copy;
                    }));
                    field.signature = next;
                    active.readyAt = Date.now() + 500;
                }
                field.select.selectedIndex = native.selectedIndex;
                field.select.disabled = native.disabled;
            }
            const selected = ctx.select.selectedOptions[0];
            launch.disabled = ctx.select.disabled || !selected || selected.disabled || Boolean(selected.parentElement.disabled) || !active.trigger.isConnected || active.trigger.disabled || Date.now() < active.readyAt;
            syncScrollHint();
        }

        function sync() {
            const ctx = context();
            if (hiddenForm !== ctx?.form) {
                hiddenForm?.removeAttribute('data-lg-playback-hidden');
                hiddenForm = ctx?.form || null;
                hiddenForm?.setAttribute('data-lg-playback-hidden', '');
            }
            syncDialog(ctx);
        }

        function open(ctx, trigger) {
            const dialog = document.createElement('dialog');
            dialog.className = 'lg-playback-dialog';
            // Reuse the current native typography, including user font overrides.
            dialog.style.fontFamily = getComputedStyle(ctx.select).fontFamily;
            dialog.style.setProperty('--lg-playback-arrow', `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='white' fill-opacity='.12' stroke='white' stroke-opacity='.3'/%3E%3Cpath d='m12 14 4 4 4-4' fill='none' stroke='%23f5f5f7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`);
            const header = document.createElement('header');
            header.className = 'lg-playback-header';
            const title = document.createElement('h2');
            title.id = 'lg-playback-title';
            title.textContent = ctx.page.querySelector('.itemName')?.textContent || labelFor(ctx.select);
            dialog.setAttribute('aria-labelledby', title.id);
            const dismiss = document.createElement('button');
            dismiss.type = 'button';
            dismiss.className = 'lg-playback-close';
            dismiss.textContent = '×';
            const translator = nativeI18n;
            let closeLabel = 'Close';
            try { closeLabel = translator?.translate?.('ButtonClose') || closeLabel; } catch {}
            dismiss.setAttribute('aria-label', closeLabel);
            dismiss.onclick = close;
            header.append(title, dismiss);
            const body = document.createElement('div');
            body.className = 'lg-playback-body';
            const sourceLabel = document.createElement('div');
            sourceLabel.className = 'lg-playback-label';
            sourceLabel.textContent = labelFor(ctx.select);
            const list = document.createElement('div');
            list.className = 'lg-playback-sources';
            list.setAttribute('role', 'group');
            list.setAttribute('aria-label', sourceLabel.textContent);
            list.addEventListener('scroll', syncScrollHint, { passive:true });
            const sourceArea = document.createElement('div');
            sourceArea.className = 'lg-playback-source-area';
            sourceArea.append(list);
            const tracks = document.createElement('div');
            tracks.className = 'lg-playback-tracks';
            const fields = ['.selectAudio', '.selectSubtitles'].map(selector => {
                const wrapper = document.createElement('label');
                wrapper.className = 'lg-playback-field';
                const label = document.createElement('span');
                const select = document.createElement('select');
                wrapper.append(label, select);
                tracks.append(wrapper);
                select.addEventListener('change', () => {
                    const native = ctx.form.querySelector(selector);
                    if (!native || native.disabled || optionSignature(native) !== field.signature) { sync(); return; }
                    choose(native, select.selectedIndex);
                    sync();
                });
                const field = { selector, wrapper, label, select, signature:null };
                return field;
            });
            body.append(sourceLabel, sourceArea, tracks);
            const footer = document.createElement('footer');
            footer.className = 'lg-playback-footer';
            const launch = document.createElement('button');
            launch.type = 'button';
            launch.className = 'lg-playback-launch';
            // Match the native playback button's transition without duplicating its timing.
            launch.style.transition = getComputedStyle(trigger).transition;
            const buttonCopy = trigger.cloneNode(true);
            buttonCopy.querySelectorAll('.material-icons').forEach(icon => icon.remove());
            const nativeTitle = trigger.getAttribute('title') || '';
            let playLabel = 'Play';
            try { playLabel = translator?.translate?.('Play') || playLabel; } catch {}
            launch.textContent = trigger.getAttribute('data-aa-play-label') || buttonCopy.textContent.trim() || (!nativeTitle.includes('${') && nativeTitle) || playLabel;
            launch.onclick = () => {
                sync();
                if (!active || launch.disabled) return;
                close();
                bypass = trigger;
                try { trigger.click(); } finally { bypass = null; }
            };
            footer.append(launch);
            dialog.append(header, body, footer);
            dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
            document.body.append(dialog);
            active = { ...ctx, dialog, trigger, route:location.hash, list, fields, launch, signature:null, readyAt:Date.now() + 500 };
            syncDialog(ctx);
            dialog.showModal();
            list.querySelector('[aria-pressed="true"]')?.focus();
            syncScrollHint();
        }

        function intercept(event) {
            const trigger = event.target.closest?.('#itemDetailPage .mainDetailButtons .btnPlay, #itemDetailPage .mainDetailButtons .btnReplay');
            if (!trigger || trigger === bypass || trigger.disabled) return;
            const ctx = context();
            if (!ctx || !ctx.page.contains(trigger)) return;
            if (!active) open(ctx, trigger);
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        window.addEventListener('click', intercept, true);
        return { sync, stop() {
            window.removeEventListener('click', intercept, true);
            close();
            hiddenForm?.removeAttribute('data-lg-playback-hidden');
            style.remove();
        } };

    }

    // Lifecycle - One scheduler owns the selected view and restores native controls.
    let stopped = false;
    const view = mode === 'panel' ? createPanel() : mode === 'dialog' ? createDialog() : null;
    const sync = () => { if (!stopped) view?.sync(); };
    let timer = null;
    if (view) {
        timer = setInterval(sync, 250);
        document.addEventListener('change', sync);
        window.addEventListener('hashchange', sync);
        window.addEventListener('resize', sync);
    }
    window[key] = {mode: view ? mode : 'native', stop() {
        stopped = true;
        clearInterval(timer);
        document.removeEventListener('change', sync);
        window.removeEventListener('hashchange', sync);
        window.removeEventListener('resize', sync);
        view?.stop();
        delete window[key];
    }};
    sync();
})();
