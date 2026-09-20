/* LumaaGlaass - Optional playback selection dialog. */
(() => {
    'use strict';
    const key = '__lumaaGlaassPlaybackDialog';
    window[key]?.stop();
    if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
    const style = document.createElement('style');
    style.textContent = `
      body #itemDetailPage#itemDetailPage .trackSelections[data-lg-playback-hidden] { display:none!important; }
      .lg-playback-dialog { color:var(--aa-text,#f5f5f7); background:var(--aa-surface,rgba(30,30,32,.4)); backdrop-filter:blur(var(--aa-panel-blur,23px)); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:24px; width:min(760px,calc(100vw - 32px)); max-height:calc(100dvh - 40px); padding:0; box-sizing:border-box; font:inherit; overflow:auto; color-scheme:dark; box-shadow:0 12px 36px rgba(0,0,0,.3); }
      .lg-playback-dialog::backdrop { background:rgba(0,0,0,.55); }
      .lg-playback-header,.lg-playback-footer { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px; background:var(--aa-surface,rgba(30,30,32,.4)); backdrop-filter:blur(var(--aa-panel-blur,23px)); position:sticky; z-index:1; }
      .lg-playback-header { top:0; border-bottom:1px solid #ffffff20; }
      .lg-playback-header h2 { font-size:20px; margin:0; overflow-wrap:anywhere; }
      .lg-playback-close { font:inherit; font-size:26px; color:inherit; background:var(--aa-surface); border:1px solid var(--aa-glass-edge,rgba(255,255,255,.12)); border-radius:50%; width:46px; height:46px; flex-shrink:0; cursor:pointer; }
      .lg-playback-body { padding:20px; }
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
      .lg-playback-footer { bottom:0; border-top:1px solid #ffffff20; justify-content:flex-end; }
      .lg-playback-launch { padding:12px 30px; min-height:46px; border:0; border-radius:30px; background:#f5f5f7; color:#151518; font:inherit; font-weight:600; cursor:pointer; }
      .lg-playback-launch::before { content:''; display:inline-block; border-block:6px solid transparent; border-inline-start:9px solid currentColor; margin-inline-end:12px; vertical-align:-1px; }
      .lg-playback-dialog button:disabled { opacity:.45; cursor:default; }
      .lg-playback-dialog :focus-visible { outline:2px solid white; outline-offset:2px; }
      @media(max-width:640px) { .lg-playback-dialog { margin:auto auto 0; width:100%; max-height:92dvh; border-radius:24px 24px 0 0; } .lg-playback-tracks { grid-template-columns:minmax(0,1fr); } .lg-playback-field select { font-size:16px; } }
      @media(prefers-reduced-transparency:reduce),(forced-colors:active) { .lg-playback-dialog,.lg-playback-header,.lg-playback-footer,.lg-playback-field select::picker(select) { background:Canvas; color:CanvasText; backdrop-filter:none; } }
    `;
    document.head.append(style);
    let hiddenForm = null;
    let active = null;
    let bypass = null;
    const visible = node => node && !node.closest('.hide,[hidden]');
    const labelFor = select => select.closest('.selectContainer')?.querySelector('.selectLabel')?.textContent.trim() || select.getAttribute('label') || select.getAttribute('aria-label') || '';
    const optionSignature = select => JSON.stringify(Array.from(select.options, option => [option.value, option.textContent, option.disabled, Boolean(option.parentElement.disabled)]));

    function syncScrollHint() {
        if (!active) return;
        const { list } = active;
        list.parentElement.toggleAttribute('data-can-scroll-down', list.scrollHeight - list.clientHeight - list.scrollTop > 2);
    }

    function context() {
        const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(node => visible(node) && node.getClientRects().length);
        const select = page?.querySelector('.selectSource');
        const form = select?.closest('.trackSelections');
        if (!location.hash.includes('/details') || !form || !visible(form) || !select.options.length || !labelFor(select) || page.classList.contains('aa-collection-page')) return null;
        return { page, select, form };
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
                    ctx.select.selectedIndex = index;
                    active.readyAt = Date.now() + 500;
                    ctx.select.dispatchEvent(new Event('change', { bubbles:true }));
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
        // The dialog replaces the optional sidebar, including delayed CDN loads.
        window.__lumaaGlaassSourcePanel?.stop();
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
        const translator = window.globalize || window.Globalize;
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
                native.selectedIndex = select.selectedIndex;
                native.dispatchEvent(new Event('change', { bubbles:true }));
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
    const timer = setInterval(sync, 250);
    window.addEventListener('hashchange', sync);
    window[key] = { stop() {
        clearInterval(timer);
        window.removeEventListener('click', intercept, true);
        window.removeEventListener('hashchange', sync);
        close();
        hiddenForm?.removeAttribute('data-lg-playback-hidden');
        style.remove();
        delete window[key];
    } };
    sync();
})();
