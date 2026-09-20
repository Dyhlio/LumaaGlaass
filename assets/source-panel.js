/* LumaaGlaass v1.1.0 - Optional source selection panel. */
(() => {
    'use strict';

    const key = '__lumaaGlaassSourcePanel';
    window[key]?.stop();
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
        const page = Array.from(document.querySelectorAll('#itemDetailPage')).find(node => node.getClientRects().length && !node.closest('.hide,[hidden]'));
        const select = page?.querySelector('.selectSource');
        const row = select?.closest('.selectSourceContainer');
        const parent = page?.querySelector('.detailPagePrimaryContainer');
        const label = row?.querySelector('.selectLabel')?.textContent.trim() || select?.getAttribute('aria-label') || select?.getAttribute('label');
        if (!location.hash.includes('/details') || !select || !row || !parent || !label ||
            select.options.length < 2 || row.closest('.hide,[hidden]') ||
            page.classList.contains('aa-collection-page') || !parent.querySelector('.portraitCard,.backdropCard,.squareCard')) {
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
            select.closest('.trackSelections').before(panel);
            current = { page, select, row, panel, heading, list, route:location.hash, signature:'' };
            page.classList.add('lg-source-layout');
            row.setAttribute('data-lg-source-hidden', '');
            list.addEventListener('click', event => {
                const button = event.target.closest('.lg-source-option');
                if (!button || button.disabled || current?.list !== list || !select.isConnected) return;
                const index = Number(button.dataset.index);
                const option = select.options[index];
                if (!option || option.disabled || select.disabled) return;
                select.selectedIndex = index;
                // Keep playback and track updates in the native change handler.
                select.dispatchEvent(new Event('change', { bubbles:true }));
                sync();
            });
        }
        const { heading, list } = current;
        if (heading.textContent !== label) heading.textContent = label;
        list.setAttribute('aria-label', label);
        const options = Array.from(select.options);
        const signature = JSON.stringify(options.map(option => [option.value, option.textContent, option.disabled, option.parentElement.disabled]));
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

    // Polling also catches native value changes that do not emit DOM mutations.
    const timer = setInterval(sync, 350);
    document.addEventListener('change', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('resize', sync);
    window[key] = { stop() {
        clearInterval(timer);
        document.removeEventListener('change', sync);
        window.removeEventListener('hashchange', sync);
        window.removeEventListener('resize', sync);
        clear();
        style.remove();
        delete window[key];
    } };
    sync();
})();
