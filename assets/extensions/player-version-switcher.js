/* LumaaGlaass - Compatibility loader for in-player versions. */
(() => {
    'use strict';

    // Configuration - This legacy URL enables only versions.
    // Prefer player-controls.js with LumaaGlaassPlayerControlsOptions for new installs.
    // Explicit new options take precedence. Save and fully reload after changes.
    const feature = 'versions';
    const requests = window.__lumaaGlaassPlayerControlRequests ||= new Set();
    requests.add(feature);
    const active = window.__lumaaGlaassPlayerControls;
    if (active) { active.enableLegacy(feature); return; }
    if (window.__lumaaGlaassPlayerControlsLoading) return;
    const source = document.currentScript?.src;
    const script = document.createElement('script');
    script.src = source ? new URL('player-controls.js', source).href :
        'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/player-controls.js';
    window.__lumaaGlaassPlayerControlsLoading = true;
    script.onload = () => {
        delete window.__lumaaGlaassPlayerControlsLoading;
        for (const name of requests) window.__lumaaGlaassPlayerControls?.enableLegacy(name);
    };
    script.onerror = () => {
        delete window.__lumaaGlaassPlayerControlsLoading;
        script.remove();
        console.error('LumaaGlaass player controls could not be loaded. Reload to retry.');
    };
    document.head.appendChild(script);
})();
