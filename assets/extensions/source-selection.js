/* LumaaGlaass - Source selection extension. */
;
(() => {
    'use strict';

    // =====================================================================
    // Configuration
    // =====================================================================
    // Options - window.LumaaGlaassSourceSelectionOptions = { mode: 'native' | 'panel' | 'dialog' }.
    // Docs: customization.md#source-selection.
    const defaults = { mode: 'native' };
    const configured = window.LumaaGlaassSourceSelectionOptions || {};
    const choice = (value, fallback, allowed) => value === undefined ? fallback : allowed.includes(value) ? value : 'native';
    const settings = Object.freeze({
        mode: choice(configured.mode, defaults.mode, ['native', 'panel', 'dialog'])
    });

    // =====================================================================
    // Instance
    // =====================================================================
    const KEY = '__lumaaGlaassSourceSelection';
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
        ButtonClose: 'Close',
        Play: 'Play'
    };
    const translate = key => nativeI18n.translate(key) || ENGLISH[key] || key;

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

    // =====================================================================
    // Styles
    // =====================================================================
    const PANEL_STYLE = `
        body #itemDetailPage#itemDetailPage .trackSelections > .selectSourceContainer[data-lg-source-row-hidden],
        body #itemDetailPage#itemDetailPage .trackSelections[data-lg-source-form-empty] {
            display: none !important;
        }

        .lg-source-panel {
            position: relative;
            background: var(--lg-surface,rgba(30,30,32,.4));
            -webkit-backdrop-filter: blur(var(--lg-blur-panel,32px));
            backdrop-filter: blur(var(--lg-blur-panel,32px));
            border: 1px solid var(--lg-edge,rgba(255,255,255,.12));
            min-width: 0;
            padding: 18px 18px 28px;
            box-sizing: border-box;
            border-radius: var(--lg-radius,14px);
        }

        .lg-source-panel h2 {
            margin: 0 0 16px;
            font-weight: 600;
            font-size: 18px;
            line-height: 1.4;
        }

        .lg-source-panel::after {
            bottom: 11px;
        }

        /* Rows - lumaaglaass.css draws the option rows and their states; the panel's rows are taller. */
        .lg-source-panel .lg-source-panel-option {
            display: block;
            width: 100%;
            min-height: 64px;
            padding: 12px 14px;
            line-height: 1.45;
        }

        .lg-source-panel-option:has(.lg-source-panel-provider) {
            display: grid;
            grid-template-columns: minmax(0,1fr) minmax(0,2fr);
            gap: 14px;
            align-items: center;
        }

        .lg-source-panel-provider {
            font-weight: 600;
        }

        .lg-source-panel-option:disabled {
            opacity: .45;
        }

        /* Layout - The details grid gains the panel's column; the poster shape comes from the main
           script's data-lg-detail-poster mark, not a page-wide :has(). */
        body #itemDetailPage#itemDetailPage.lg-has-source-panel {
            @media (width >= 1200px) {
                & .detailPagePrimaryContainer {
                    grid-template-columns: clamp(150px,12vw,220px) minmax(0,1fr) clamp(360px,38vw,760px) !important;
                    column-gap: clamp(24px,2vw,40px) !important;
                }

                &[data-lg-detail-poster="portrait"] .detailPagePrimaryContainer {
                    grid-template-columns: clamp(200px,17vw,340px) minmax(0,1fr) clamp(360px,36vw,760px) !important;
                }

                & .lg-source-panel {
                    grid-column: 3;
                    grid-row: 1 / span 6;
                    align-self: start;
                    margin: 0;
                }

                & .lg-source-panel-list {
                    max-height: var(--lg-source-panel-height,560px);
                }
            }

            /* Narrow layouts - One column of rows: panel, tracks, overview, then metadata. */
            @media (width < 1200px) {
                & .lg-source-panel {
                    grid-column: 2;
                    grid-row: 2;
                    margin-top: 20px;
                }

                & .trackSelections:not(.hide) {
                    grid-column: 2;
                    grid-row: 3;
                    margin-top: 16px !important;
                }

                & .detailSectionContent {
                    grid-column: 2;
                    grid-row: 4;
                }

                & .itemDetailsGroup {
                    grid-column: 2;
                    grid-row: 5;
                }

                & .lg-source-panel-list {
                    max-height: max(var(--lg-source-panel-two-rows,0px),min(var(--lg-source-panel-height,560px),40vh));
                }
            }

            @media (max-width: 640px) {
                & .lg-source-panel-option {
                    padding: 14px;
                }

                & .lg-source-panel {
                    grid-column: 1;
                    grid-row: 3;
                }

                & .trackSelections:not(.hide) {
                    grid-column: 1;
                    grid-row: 4;
                }

                & .detailSectionContent {
                    grid-column: 1;
                    grid-row: 5;
                }

                & .itemDetailsGroup {
                    grid-column: 1;
                    grid-row: 6;
                }
            }
        }
    `;
    const DIALOG_STYLE = `
        body #itemDetailPage#itemDetailPage .trackSelections[data-lg-source-form-hidden] {
            display: none !important;
        }

        .lg-source-dialog-label,
        .lg-source-dialog-field span {
            display: block;
            margin: 0 0 8px;
            font-size: 13px;
            line-height: 1.4;
            font-weight: 600;
        }

        .lg-source-dialog-list {
            max-height: 38vh;
        }

        .lg-source-dialog-tracks {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .lg-source-dialog-field {
            min-width: 0;
        }

        .lg-source-dialog-field :is(select,.lg-select) {
            width: 100%;
            min-width: 0;
        }

        .lg-source-dialog-footer {
            border-top: 1px solid var(--lg-edge,rgba(255,255,255,.12));
            justify-content: center;
        }

        .lg-source-dialog-play::before {
            content: '';
            display: inline-block;
            border-block: 6px solid transparent;
            border-inline-start: 9px solid currentColor;
            margin-inline-end: 12px;
            vertical-align: -1px;
        }

        @media (max-width: 640px) {
            .lg-source-dialog-tracks {
                grid-template-columns: minmax(0,1fr);
            }
        }
    `;
    // Style - The chosen view's rules; lumaaglaass.css draws the shared dialog shell and lists.
    const style = element('style', '', settings.mode === 'panel' ? PANEL_STYLE : DIALOG_STYLE);

    // =====================================================================
    // Native model
    // =====================================================================
    // Form - Both views read and update the same Jellyfin form.
    // Hidden - By a class or attribute only, rendered or not: this script may hide the native form.
    const unhidden = node => node && !node.closest('.hide,[hidden]');
    const selectable = (select, option) => Boolean(option) && !select.disabled && !option.disabled && !option.parentElement.disabled;
    const labelFor = select => select.closest('.selectContainer')?.querySelector('.selectLabel')?.textContent.trim() ||
        select.getAttribute('label') || select.getAttribute('aria-label') || '';
    const optionSignature = select => JSON.stringify(Array.from(select.options,
        option => [option.value, option.textContent, option.disabled, Boolean(option.parentElement.disabled)]));
    function context() {
        const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(visible);
        const select = page?.querySelector('.selectSource');
        const form = select?.closest('.trackSelections');
        const label = select && labelFor(select);
        if (route() !== '#/details' || !form || !unhidden(form) || !select.options.length || !label ||
            page.classList.contains('lg-collection-page')) {
            return null;
        }
        return { page, select, form, label };
    }
    function choose(select, index) {
        if (!select?.isConnected || !selectable(select, select.options[index])) return false;
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    // =====================================================================
    // Source list
    // =====================================================================
    function syncScrollHint(list) {
        list.parentElement.toggleAttribute('data-lg-source-scroll-hint', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
    }
    // Rows - One button per native option; disabled and pressed follow the native select.
    function syncRows(list, select) {
        Array.from(list.children).forEach((button, index) => {
            setDisabled(button, !selectable(select, select.options[index]));
            setAttribute(button, 'aria-pressed', String(index === select.selectedIndex));
        });
    }

    // =====================================================================
    // Panel view
    // =====================================================================
    // Panel - Every source as a row beside the details, replacing the native source row, on details
    // pages with the theme's poster layout.
    function createPanel() {
        const wideLayout = window.matchMedia('(width >= 1200px)');
        let current = null;
        function clear() {
            if (!current) return;
            current.form.removeAttribute('data-lg-source-form-empty');
            current.row.removeAttribute('data-lg-source-row-hidden');
            current.page.classList.remove('lg-has-source-panel');
            current.panel.remove();
            current = null;
        }
        function sync() {
            const ctx = context();
            const { page, select, form, label } = ctx || {};
            const row = select?.closest('.selectSourceContainer');
            if (!ctx || !row || select.options.length < 2 || !unhidden(row) || !page.hasAttribute('data-lg-detail-poster')) {
                clear();
                return;
            }
            if (current && (current.select !== select || current.hash !== location.hash || !current.panel.isConnected)) clear();
            if (!current) {
                const panel = element('section', 'lg-source-panel');
                const heading = element('h2');
                const list = element('div', 'lg-source-panel-list');
                list.setAttribute('role', 'group');
                list.addEventListener('scroll', () => syncScrollHint(list), { passive: true });
                panel.append(heading, list);
                // Match keyboard reading order without changing the native track form.
                form.before(panel);
                current = { page, select, form, row, panel, heading, list, hash: location.hash, signature: '' };
                page.classList.add('lg-has-source-panel');
                row.setAttribute('data-lg-source-row-hidden', '');
                list.addEventListener('click', event => {
                    const button = event.target.closest('.lg-source-panel-option');
                    if (!button || button.disabled || current?.list !== list || !select.isConnected) return;
                    if (optionSignature(select) === current.signature) choose(select, Number(button.dataset.lgSourceIndex));
                    sync();
                });
            }
            const { heading, list } = current;
            // Check rows by their own visibility, not the form's (which we may hide), so late
            // tracks bring it back; read-only video summaries count as content.
            const rowVisible = node => {
                for (let ancestor = node; ancestor && ancestor !== form; ancestor = ancestor.parentElement) {
                    const css = getComputedStyle(ancestor);
                    if (ancestor.hidden || ancestor.classList.contains('hide') || css.display === 'none' || css.visibility === 'hidden') {
                        return false;
                    }
                }
                return true;
            };
            const hasContent = Array.from(form.children).some(child => {
                if (child === row || !rowVisible(child)) return false;
                if (child.getAttribute('data-lg-video-summary')?.trim()) return true;
                return Array.from(child.querySelectorAll('select')).some(control =>
                    rowVisible(control) && Array.from(control.options).some(option => option.textContent.trim()));
            });
            form.toggleAttribute('data-lg-source-form-empty', !hasContent);
            setText(heading, label);
            setAttribute(list, 'aria-label', label);
            const signature = optionSignature(select);
            if (current.signature !== signature) {
                const fragment = document.createDocumentFragment();
                Array.from(select.options).forEach((option, index) => {
                    const button = element('button', 'lg-source-panel-option');
                    button.type = 'button';
                    button.dataset.lgSourceIndex = String(index);
                    const text = option.textContent.trim();
                    const split = text.search(/[🎥🎞📺]/u);
                    if (split > 0) {
                        const provider = element('span', 'lg-source-panel-provider', text.slice(0, split).trim());
                        const details = element('span', '', text.slice(split).replace(/\s*([📦🌍🌐📁])/gu, '\n$1'));
                        button.append(provider, details);
                    } else {
                        button.textContent = text;
                    }
                    fragment.append(button);
                });
                list.replaceChildren(fragment);
                current.signature = signature;
            }
            syncRows(list, select);
            // Keep the desktop panel above the last metadata row, with at most six sources.
            const rowGap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
            const rowsHeight = rows => rows.reduce((total, button) => total + button.getBoundingClientRect().height, 0) +
                Math.max(0, rows.length - 1) * rowGap;
            const rows = Array.from(list.children).slice(0, 6);
            let height = Math.floor(rowsHeight(rows));
            if (wideLayout.matches) {
                const studio = Array.from(page.querySelectorAll('.studiosGroup')).find(visible);
                const fallback = Array.from(page.querySelectorAll('.detailsGroupItem,.detailSectionContent')).filter(visible);
                const bottom = studio?.getBoundingClientRect().bottom ??
                    Math.max(...fallback.map(node => node.getBoundingClientRect().bottom));
                if (Number.isFinite(bottom)) {
                    const panelStyle = getComputedStyle(current.panel);
                    const listStyle = getComputedStyle(list);
                    const inset = parseFloat(panelStyle.paddingBottom) + parseFloat(panelStyle.borderBottomWidth) +
                        parseFloat(listStyle.paddingTop) + parseFloat(listStyle.paddingBottom);
                    height = Math.min(height, Math.max(0, Math.floor(bottom - list.getBoundingClientRect().top - inset)));
                }
            }
            // Show two complete sources on narrow screens, even with long filenames.
            for (const [name, value] of [['--lg-source-panel-height', height + 'px'],
                ['--lg-source-panel-two-rows', Math.ceil(rowsHeight(rows.slice(0, 2))) + 'px']]) {
                if (list.style.getPropertyValue(name) !== value) list.style.setProperty(name, value);
            }
            syncScrollHint(list);
        }
        return { sync, stop: clear };
    }

    // =====================================================================
    // Dialog view
    // =====================================================================
    // Dialog - Choose the source and tracks in a dialog before Play; the native form stays
    // hidden and still starts playback.
    function createDialog() {
        if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return null;
        let hiddenForm = null;
        let active = null;
        let bypass = null;
        // Play stays locked for 500 ms after a source or track list change, while Jellyfin rebuilds
        // the tracks of the chosen source.
        const READY_DELAY = 500;
        function hideForm(form) {
            if (hiddenForm === form) return;
            hiddenForm?.removeAttribute('data-lg-source-form-hidden');
            hiddenForm = form;
            hiddenForm?.setAttribute('data-lg-source-form-hidden', '');
        }
        function close() {
            if (!active) return;
            const { dialog, trigger, fields } = active;
            active = null;
            fields.forEach(field => field.picker?.destroy());
            dialog.close();
            dialog.remove();
            if (trigger.isConnected) trigger.focus({ preventScroll: true });
        }
        function syncDialog(ctx) {
            if (!active) return;
            if (!ctx || ctx.select !== active.select || location.hash !== active.hash) {
                close();
                return;
            }
            const { list, fields, launch } = active;
            const signature = optionSignature(ctx.select);
            if (signature !== active.signature) {
                list.replaceChildren(...Array.from(ctx.select.options, (option, index) => {
                    const button = element('button', 'lg-source-dialog-option', option.textContent);
                    button.type = 'button';
                    button.addEventListener('click', () => {
                        if (active && optionSignature(ctx.select) === active.signature &&
                            selectable(ctx.select, ctx.select.options[index])) {
                            active.readyAt = Date.now() + READY_DELAY;
                            choose(ctx.select, index);
                        }
                        sync();
                    });
                    return button;
                }));
                active.signature = signature;
            }
            syncRows(list, ctx.select);
            for (const field of fields) {
                const native = ctx.form.querySelector(field.selector);
                const hidden = !native || !unhidden(native) || !native.options.length;
                if (field.wrapper.hidden !== hidden) field.wrapper.hidden = hidden;
                if (hidden) continue;
                setText(field.label, labelFor(native));
                const next = optionSignature(native);
                if (field.signature !== next) {
                    field.select.replaceChildren(...Array.from(native.options, option => {
                        const copy = new Option(option.textContent, option.value);
                        copy.disabled = option.disabled || Boolean(option.parentElement.disabled);
                        return copy;
                    }));
                    field.signature = next;
                    active.readyAt = Date.now() + READY_DELAY;
                }
                field.select.selectedIndex = native.selectedIndex;
                setDisabled(field.select, native.disabled);
                field.picker?.sync();
            }
            setAttribute(active.dismiss, 'aria-label', translate('ButtonClose'));
            setDisabled(launch, !selectable(ctx.select, ctx.select.selectedOptions[0]) || !active.trigger.isConnected ||
                active.trigger.disabled || Date.now() < active.readyAt);
            syncScrollHint(active.list);
        }
        function sync() {
            const ctx = context();
            hideForm(ctx?.form || null);
            syncDialog(ctx);
        }
        function open(ctx, trigger) {
            const dialog = element('dialog', 'dialog lg-source-dialog');
            // Reuse the current native typography, including user font overrides.
            dialog.style.fontFamily = getComputedStyle(ctx.select).fontFamily;
            const header = element('header', 'lg-source-dialog-header');
            const title = element('h2', '', ctx.page.querySelector('.itemName')?.textContent || labelFor(ctx.select));
            title.id = 'lg-source-dialog-title';
            dialog.setAttribute('aria-labelledby', title.id);
            const dismiss = element('button', 'lg-source-dialog-close');
            dismiss.type = 'button';
            const dismissIcon = element('span', 'material-icons', 'close');
            dismissIcon.setAttribute('aria-hidden', 'true');
            dismiss.append(dismissIcon);
            dismiss.setAttribute('aria-label', translate('ButtonClose'));
            dismiss.addEventListener('click', close);
            header.append(title, dismiss);
            const body = element('div', 'lg-source-dialog-body');
            const sourceLabel = element('div', 'lg-source-dialog-label', labelFor(ctx.select));
            const list = element('div', 'lg-source-dialog-list');
            list.setAttribute('role', 'group');
            list.setAttribute('aria-label', sourceLabel.textContent);
            list.addEventListener('scroll', () => syncScrollHint(list), { passive: true });
            const sourceArea = element('div', 'lg-source-dialog-area');
            sourceArea.append(list);
            const tracks = element('div', 'lg-source-dialog-tracks');
            const fields = ['.selectAudio', '.selectSubtitles'].map(selector => {
                const wrapper = element('label', 'lg-source-dialog-field');
                const label = element('span');
                const picker = selects?.create({ portal: dialog });
                const select = picker?.control || element('select', 'emby-select');
                label.id = 'lg-source-dialog-' + selector.slice(1) + '-label';
                if (picker) picker.trigger.setAttribute('aria-labelledby', label.id);
                wrapper.append(label, picker?.shell || select);
                tracks.append(wrapper);
                select.addEventListener('change', () => {
                    const native = ctx.form.querySelector(selector);
                    if (!native || native.disabled || optionSignature(native) !== field.signature) {
                        sync();
                        return;
                    }
                    choose(native, select.selectedIndex);
                    sync();
                });
                const field = { selector, wrapper, label, select, picker, signature: null };
                return field;
            });
            body.append(sourceLabel, sourceArea, tracks);
            const footer = element('footer', 'lg-source-dialog-footer');
            const launch = element('button', 'lg-source-dialog-play');
            launch.type = 'button';
            const buttonCopy = trigger.cloneNode(true);
            buttonCopy.querySelectorAll('.material-icons').forEach(icon => icon.remove());
            // The native button's text, else its title (Play or Resume); a legacy template may leave an
            // untranslated ${…} placeholder there, which is not a label.
            const nativeTitle = titleOf(trigger) || '';
            launch.textContent = buttonCopy.textContent.trim() || (!nativeTitle.includes('${') && nativeTitle) || translate('Play');
            launch.addEventListener('click', () => {
                sync();
                if (!active || launch.disabled) return;
                close();
                bypass = trigger;
                try { trigger.click(); } finally { bypass = null; }
            });
            footer.append(launch);
            dialog.append(header, body, footer);
            dialog.addEventListener('cancel', event => {
                event.preventDefault();
                close();
            });
            document.body.append(dialog);
            active = {
                ...ctx, dialog, trigger, hash: location.hash, list, fields, launch, dismiss, signature: null,
                readyAt: Date.now() + READY_DELAY
            };
            syncDialog(ctx);
            dialog.showModal();
            list.querySelector('[aria-pressed="true"]')?.focus();
            syncScrollHint(list);
        }
        // media-actions' Info button carries btnPlay too, but never plays.
        function intercept(event) {
            const trigger = event.target.closest?.('#itemDetailPage .mainDetailButtons :is(.btnPlay,.btnReplay):not(.lg-media-details)');
            if (!trigger || trigger === bypass || trigger.disabled) return;
            const ctx = context();
            if (!ctx || !ctx.page.contains(trigger)) return;
            if (!active) open(ctx, trigger);
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        return {
            sync,
            intercept,
            stop() {
                close();
                hideForm(null);
            }
        };
    }

    // =====================================================================
    // Scheduler
    // =====================================================================
    let view = null, timer = 0;
    const sync = () => { if (!stopped) view?.sync(); };
    function start() {
        view = settings.mode === 'panel' ? createPanel() : settings.mode === 'dialog' ? createDialog() : null;
        if (!view) return;
        document.head.append(style);
        if (view.intercept) listen(window, 'click', view.intercept, true);
        timer = setInterval(sync, 250);
        listen(document, 'change', sync);
        listen(window, 'hashchange', sync);
        listen(window, 'resize', sync);
        sync();
    }

    // =====================================================================
    // Lifecycle
    // =====================================================================
    window[KEY] = {
        stop() {
            stopped = true;
            clearInterval(timer);
            listeners.forEach(fn => fn());
            view?.stop();
            style.remove();
            delete window[KEY];
        }
    };
    start();
})();
