/* LumaaGlaass - Legacy collection filter compatibility. */
(() => {
    'use strict';

    // Configuration - The main theme now owns this feature.
    // Set window.LumaaGlaassOptions.collectionFilter before loading branding.js.
    // Defaults to true. This legacy file never overrides an explicit false.
    // Keep the main theme installed and remove this obsolete loader when convenient.
    window.__lumaaGlaassCollectionFilter?.stop();
})();
