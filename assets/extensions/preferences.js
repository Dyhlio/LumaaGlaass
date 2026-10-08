/* LumaaGlaass - Optional per-account preferences. */
;
(() => {
    'use strict';

    // =====================================================================
    // Instance
    // =====================================================================
    const KEY = '__lumaaGlaassPreferences';
    window[KEY]?.stop();
    const root = window.__lumaaGlaass;
    const host = root?.preferences;
    const selects = root?.selects;
    if (!host || !selects) return;

    let stopped = false;
    const { element, setAttribute, translate: nativeTranslate, language, params, route, sameId } = host;
    const listeners = [];
    const listen = (target, event, fn, options) => {
        target.addEventListener(event, fn, options);
        listeners.push(() => target.removeEventListener(event, fn, options));
    };
    const setText = (node, value) => {
        if (node && node.textContent !== value) node.textContent = value;
    };
    // Selects - Preference fields use the shared theme controller; this page owns its data and
    // layout, while the main script owns opening, placement, keyboard support and cleanup.
    const preferenceSelects = new Set();
    const preferenceSelect = () => {
        const state = selects.create({ shellClass: 'lg-preference-select' });
        preferenceSelects.add(state);
        return state;
    };

    // =====================================================================
    // Localization
    // =====================================================================
    // Localization - These labels belong only to this optional page. English is the fallback for
    // every language other than French; standard Jellyfin labels keep the host translation.
    const PREFERENCE_STRINGS = {
        en: {
            SettingsIntro: 'Choose the LumaaGlaass features for this account. They are saved on the server and follow ' +
                'the account on every device.',
            SettingsTheme: 'Theme',
            SettingsHomeCarousel: 'Home carousel',
            SettingsHomeCarouselHelp: 'Rotating artwork on the home page. Off, a still media background remains.',
            SettingsCollectionFilter: 'Collection filter',
            SettingsCollectionFilterHelp: 'All / Movies / Shows above collections that mix movies and series.',
            SettingsCountIndicators: 'Hide count indicators',
            SettingsCountIndicatorsHelp: 'Hides the numeric badges on cards and lists.',
            SettingsPlayerControls: 'Player controls',
            SettingsPlayerControlsHelp: 'Buttons added to the integrated player.',
            SettingsVersions: 'Version switcher',
            SettingsEpisodes: 'Episode switcher',
            SettingsSourceSelection: 'Source selection',
            SettingsSourceSelectionHelp: 'How versions and tracks are chosen on details pages.',
            SettingsSourceMode: 'Mode',
            SettingsMediaActions: 'Media actions',
            SettingsMediaActionsHelp: 'Play shortcuts on thumbnails and main buttons of details pages.',
            SettingsThumbnailsMovies: 'Movie thumbnails',
            SettingsThumbnailsEpisodes: 'Episode thumbnails',
            SettingsThumbnailsSeries: 'Series thumbnails',
            SettingsThumbnailsSeasons: 'Season thumbnails',
            SettingsThumbnailsCollections: 'Collection thumbnails',
            SettingsThumbnailsLibraries: 'Library thumbnails',
            SettingsThumbnailsFolders: 'Folder thumbnails',
            SettingsSeasonEpisodes: 'Episodes in a season list',
            SettingsNextUpEpisodes: 'Episodes in Next Up',
            SettingsResumeHomeMovies: 'Started movies on the home page',
            SettingsResumeHomeEpisodes: 'Started episodes on the home page',
            SettingsResumeElsewhereMovies: 'Started movies on other pages',
            SettingsResumeElsewhereEpisodes: 'Started episodes on other pages',
            SettingsCornerButtons: 'Thumbnail corner buttons (watched, favorite, more)',
            SettingsResumeButtonMovies: 'Resume button of a started movie',
            SettingsResumeButtonEpisodes: 'Resume button of a started episode',
            SettingsMainButtonCollections: 'Main button of a collection',
            SettingsMainButtonSeries: 'Main button of a series',
            SettingsMainButtonSeasons: 'Main button of a season',
            SettingsModeNative: 'Native',
            SettingsModeDetails: 'Information',
            SettingsModeHide: 'Hidden',
            SettingsModePanel: 'Panel',
            SettingsModeDialog: 'Dialog',
            SettingsExternal: 'Loaded by the server’s Custom JavaScript or CSS, which sets it for every account. ' +
                'Remove that loader or import to choose it here.',
            SettingsLoading: 'Loading settings…',
            SettingsLoadError: 'The settings could not be loaded. Check the connection, then try again.',
            SettingsRetry: 'Try again',
            SettingsResetDefaults: 'Reset to defaults',
            SettingsDefaultsRestored: 'Default settings restored. Save to keep them.',
            SettingsSaving: 'Saving…',
            SettingsSaved: 'Settings saved.',
            SettingsSavedOther: 'Settings saved. They apply the next time this user opens the web client.',
            SettingsSaveError: 'The settings could not be saved. Please try again.',
            SettingsVariables: 'Theme variables',
            SettingsVariablesHelp: 'Every color, glass effect, corner, spacing and timing of the theme. An empty or ' +
                'reset field keeps the theme’s value; changes preview at once, Save keeps them. Accessibility ' +
                'preferences (reduced transparency, more contrast, forced colors) keep their own values.',
            SettingsRecipes: 'Quick recipes',
            SettingsRecipeAccent: 'Colored accent',
            SettingsRecipeSquare: 'Square corners',
            SettingsRecipeSofter: 'Softer corners',
            SettingsRecipeRounder: 'Rounder corners',
            SettingsRecipeOpaque: 'More opaque glass',
            SettingsRecipeLightBlur: 'Lighter blur',
            SettingsRecipeNoBlur: 'No blur',
            SettingsRecipeSnappy: 'Snappier motion',
            SettingsRecipeCalm: 'Calmer motion',
            SettingsRecipeTight: 'Tighter page layout',
            SettingsResetAll: 'Reset every variable',
            SettingsReset: 'Reset',
            SettingsDefault: 'Default',
            SettingsOpacity: 'Opacity of',
            SettingsInvalid: 'A value is not valid for its variable: correct the highlighted field.',
            SettingsColors: 'Colors',
            SettingsGlass: 'Glass and depth',
            SettingsShape: 'Shape',
            SettingsSpacing: 'Spacing and size',
            SettingsText: 'Text',
            SettingsMotion: 'Motion',
            '--lg-color-accent': 'The one accent: Play and submit actions, the active tab, checked checkboxes, switches, ' +
                'sliders, progress bars, scrollbars and MUI tints. Every translucent variant derives from it.',
            '--lg-color-text-on-primary': 'Text on the accent; switch to white with a dark accent.',
            '--lg-surface-primary-hover': 'Primary actions under the pointer.',
            '--lg-color-text': 'Text on glass.',
            '--lg-color-text-secondary': 'Metadata and helper text; keep it at least 65% opaque.',
            '--lg-color-focus': 'Keyboard focus ring of every control.',
            '--lg-color-background': 'Page background behind the artwork.',
            '--lg-color-panel': 'Home carousel panel shown while artwork loads.',
            '--lg-surface': 'Glass tint of every panel and control; hover and open states derive from it.',
            '--lg-surface-hover': 'Hovered glass (8% white mixed in); keep it under the open glass.',
            '--lg-surface-open': 'Open or pressed glass (14% white mixed in).',
            '--lg-surface-row-hover': 'Hover of list and menu rows.',
            '--lg-surface-row-selected': 'Selection of list and menu rows.',
            '--lg-surface-artwork-veil': 'Darkening behind actions drawn over posters.',
            '--lg-edge': 'Borders and dividers.',
            '--lg-edge-open': 'Edge of open menus and focused fields.',
            '--lg-blur-control': 'Blur behind buttons and fields.',
            '--lg-blur-panel': 'Blur behind cards, panels, menus and tooltips.',
            '--lg-blur-backdrop': 'Blur of the background artwork.',
            '--lg-shadow-panel': 'Depth of floating panels (menus, dialogs); lighten it with the card shadow.',
            '--lg-shadow-card': 'Depth of cards on the page.',
            '--lg-radius-scale': 'Multiplies every corner: 0 squares them all, 1.5 rounds them more. Circles stay round.',
            '--lg-radius-pill': 'Buttons, tabs, chips and toolbar groups.',
            '--lg-radius': 'Fields, selects, cards and posters.',
            '--lg-radius-panel': 'Large panels: page card, home carousel, details, dialogs, player bars.',
            '--lg-radius-panel-compact': 'The same panels on phones.',
            '--lg-radius-popup': 'Menus and dropdown panels.',
            '--lg-radius-option': 'Rows inside menus and dropdowns.',
            '--lg-radius-drawer': 'Side navigation drawer.',
            '--lg-radius-drawer-option': 'Rows of the navigation drawer.',
            '--lg-radius-small': 'Checkboxes, tooltips and small thumbnails.',
            '--lg-space-gutter': 'Side inset of every page.',
            '--lg-space-header-gap': 'Distance between the navigation bar and the first block of every page.',
            '--lg-space-button-group': 'Space between neighbouring buttons.',
            '--lg-space-option': 'Space between menu rows.',
            '--lg-space-popup': 'Space inside menus.',
            '--lg-space-list-option': 'Space between source, version and episode choices (extensions).',
            '--lg-size-action': 'Round actions; keep at least 44px for touch.',
            '--lg-size-option': 'Menu rows; keep at least 44px for touch.',
            '--lg-page-card-height': 'Height of the library and collection page card.',
            '--lg-cast-width': 'Width of cast cards on details pages.',
            '--lg-font': 'Font of the whole interface; load the font itself with an @import in Custom CSS.',
            '--lg-font-section-title': 'Row titles on home, libraries and details.',
            '--lg-page-card-title-size': 'Title size of the library and collection page card.',
            '--lg-page-card-title-weight': 'Title weight of the library and collection page card.',
            '--lg-duration': 'Hover, focus and open feedback of every control.',
            '--lg-duration-slow': 'Larger movements: card focus zoom, carousel crossfade, favorite pop.',
            '--lg-ease': 'Easing of every transition.'
        },
        fr: {
            SettingsIntro: 'Choisissez les fonctions LumaaGlaass de ce compte. Elles sont enregistrées sur le serveur et ' +
                'suivent le compte sur tous les appareils.',
            SettingsTheme: 'Thème',
            SettingsHomeCarousel: 'Carrousel d’accueil',
            SettingsHomeCarouselHelp: 'Images défilantes sur l’accueil. Désactivé, un fond fixe reste affiché.',
            SettingsCollectionFilter: 'Filtre des collections',
            SettingsCollectionFilterHelp: 'Tout / Films / Séries au-dessus des collections mêlant films et séries.',
            SettingsCountIndicators: 'Masquer les compteurs',
            SettingsCountIndicatorsHelp: 'Masque les pastilles numériques des vignettes et des listes.',
            SettingsPlayerControls: 'Contrôles du lecteur',
            SettingsPlayerControlsHelp: 'Boutons ajoutés au lecteur intégré.',
            SettingsVersions: 'Changement de version',
            SettingsEpisodes: 'Changement d’épisode',
            SettingsSourceSelection: 'Sélection de la source',
            SettingsSourceSelectionHelp: 'Choix des versions et des pistes sur les pages de détails.',
            SettingsSourceMode: 'Mode',
            SettingsMediaActions: 'Actions des médias',
            SettingsMediaActionsHelp: 'Raccourcis de lecture des vignettes et boutons principaux des pages de détails.',
            SettingsThumbnailsMovies: 'Vignettes de films',
            SettingsThumbnailsEpisodes: 'Vignettes d’épisodes',
            SettingsThumbnailsSeries: 'Vignettes de séries',
            SettingsThumbnailsSeasons: 'Vignettes de saisons',
            SettingsThumbnailsCollections: 'Vignettes de collections',
            SettingsThumbnailsLibraries: 'Vignettes de médiathèques',
            SettingsThumbnailsFolders: 'Vignettes de dossiers',
            SettingsSeasonEpisodes: 'Épisodes dans la liste d’une saison',
            SettingsNextUpEpisodes: 'Épisodes dans À suivre',
            SettingsResumeHomeMovies: 'Films commencés sur l’accueil',
            SettingsResumeHomeEpisodes: 'Épisodes commencés sur l’accueil',
            SettingsResumeElsewhereMovies: 'Films commencés sur les autres pages',
            SettingsResumeElsewhereEpisodes: 'Épisodes commencés sur les autres pages',
            SettingsCornerButtons: 'Boutons d’angle des vignettes (vu, favori, plus)',
            SettingsResumeButtonMovies: 'Bouton Reprendre d’un film commencé',
            SettingsResumeButtonEpisodes: 'Bouton Reprendre d’un épisode commencé',
            SettingsMainButtonCollections: 'Bouton principal d’une collection',
            SettingsMainButtonSeries: 'Bouton principal d’une série',
            SettingsMainButtonSeasons: 'Bouton principal d’une saison',
            SettingsModeNative: 'Natif',
            SettingsModeDetails: 'Informations',
            SettingsModeHide: 'Masqué',
            SettingsModePanel: 'Panneau',
            SettingsModeDialog: 'Fenêtre',
            SettingsExternal: 'Chargé par le JavaScript ou le CSS personnalisé du serveur, qui le fixe pour tous les ' +
                'comptes. Retirez ce chargeur ou cet import pour le choisir ici.',
            SettingsLoading: 'Chargement des paramètres…',
            SettingsLoadError: 'Les paramètres n’ont pas pu être chargés. Vérifiez la connexion, puis réessayez.',
            SettingsRetry: 'Réessayer',
            SettingsResetDefaults: 'Réinitialiser par défaut',
            SettingsDefaultsRestored: 'Paramètres par défaut rétablis. Sauvegardez pour les conserver.',
            SettingsSaving: 'Enregistrement…',
            SettingsSaved: 'Paramètres enregistrés.',
            SettingsSavedOther: 'Paramètres enregistrés. Ils s’appliqueront à la prochaine ouverture du client web par cet ' +
                'utilisateur.',
            SettingsSaveError: 'Les paramètres n’ont pas pu être enregistrés. Veuillez réessayer.',
            SettingsVariables: 'Variables du thème',
            SettingsVariablesHelp: 'Chaque couleur, effet de verre, coin, espacement et durée du thème. Un champ vide ou ' +
                'réinitialisé garde la valeur du thème ; les changements s’affichent aussitôt, Enregistrer les garde. ' +
                'Les préférences d’accessibilité (transparence réduite, contraste élevé, couleurs forcées) gardent leurs ' +
                'propres valeurs.',
            SettingsRecipes: 'Recettes rapides',
            SettingsRecipeAccent: 'Accent coloré',
            SettingsRecipeSquare: 'Coins carrés',
            SettingsRecipeSofter: 'Coins plus doux',
            SettingsRecipeRounder: 'Coins plus ronds',
            SettingsRecipeOpaque: 'Verre plus opaque',
            SettingsRecipeLightBlur: 'Flou plus léger',
            SettingsRecipeNoBlur: 'Sans flou',
            SettingsRecipeSnappy: 'Animations plus vives',
            SettingsRecipeCalm: 'Animations plus calmes',
            SettingsRecipeTight: 'Mise en page plus serrée',
            SettingsResetAll: 'Réinitialiser toutes les variables',
            SettingsReset: 'Réinitialiser',
            SettingsDefault: 'Par défaut',
            SettingsOpacity: 'Opacité de',
            SettingsInvalid: 'Une valeur n’est pas valide pour sa variable : corrigez le champ signalé.',
            SettingsColors: 'Couleurs',
            SettingsGlass: 'Verre et profondeur',
            SettingsShape: 'Forme',
            SettingsSpacing: 'Espacements et tailles',
            SettingsText: 'Texte',
            SettingsMotion: 'Mouvement',
            '--lg-color-accent': 'L’accent unique : Lire et les actions de validation, l’onglet actif, les cases cochées, ' +
                'interrupteurs, curseurs, barres de progression, barres de défilement et teintes MUI. Toutes ses ' +
                'variantes translucides en dérivent.',
            '--lg-color-text-on-primary': 'Texte posé sur l’accent ; passez-le en blanc avec un accent foncé.',
            '--lg-surface-primary-hover': 'Actions principales sous le pointeur.',
            '--lg-color-text': 'Texte sur le verre.',
            '--lg-color-text-secondary': 'Métadonnées et textes d’aide ; gardez-le opaque à au moins 65 %.',
            '--lg-color-focus': 'Anneau de focus clavier de chaque contrôle.',
            '--lg-color-background': 'Fond de page derrière les images.',
            '--lg-color-panel': 'Panneau du carrousel d’accueil pendant le chargement des images.',
            '--lg-surface': 'Teinte du verre de chaque panneau et contrôle ; survol et ouverture en dérivent.',
            '--lg-surface-hover': 'Verre survolé (8 % de blanc mêlé) ; gardez-le sous le verre ouvert.',
            '--lg-surface-open': 'Verre ouvert ou pressé (14 % de blanc mêlé).',
            '--lg-surface-row-hover': 'Survol des lignes de listes et de menus.',
            '--lg-surface-row-selected': 'Sélection des lignes de listes et de menus.',
            '--lg-surface-artwork-veil': 'Assombrissement derrière les actions posées sur les affiches.',
            '--lg-edge': 'Bordures et séparateurs.',
            '--lg-edge-open': 'Bord des menus ouverts et des champs actifs.',
            '--lg-blur-control': 'Flou derrière les boutons et les champs.',
            '--lg-blur-panel': 'Flou derrière les cartes, panneaux, menus et infobulles.',
            '--lg-blur-backdrop': 'Flou de l’image de fond.',
            '--lg-shadow-panel': 'Profondeur des panneaux flottants (menus, fenêtres) ; allégez-la avec l’ombre des cartes.',
            '--lg-shadow-card': 'Profondeur des cartes de la page.',
            '--lg-radius-scale': 'Multiplie chaque coin : 0 les rend tous carrés, 1,5 les arrondit davantage. Les cercles ' +
                'restent ronds.',
            '--lg-radius-pill': 'Boutons, onglets, pastilles et groupes de la barre d’outils.',
            '--lg-radius': 'Champs, listes, cartes et affiches.',
            '--lg-radius-panel': 'Grands panneaux : carte de page, carrousel d’accueil, détails, fenêtres, barres du lecteur.',
            '--lg-radius-panel-compact': 'Les mêmes panneaux sur téléphone.',
            '--lg-radius-popup': 'Menus et panneaux déroulants.',
            '--lg-radius-option': 'Lignes des menus et listes déroulantes.',
            '--lg-radius-drawer': 'Tiroir de navigation latéral.',
            '--lg-radius-drawer-option': 'Lignes du tiroir de navigation.',
            '--lg-radius-small': 'Cases à cocher, infobulles et petites vignettes.',
            '--lg-space-gutter': 'Marge latérale de chaque page.',
            '--lg-space-header-gap': 'Distance entre la barre de navigation et le premier bloc de chaque page.',
            '--lg-space-button-group': 'Espace entre boutons voisins.',
            '--lg-space-option': 'Espace entre les lignes de menu.',
            '--lg-space-popup': 'Espace à l’intérieur des menus.',
            '--lg-space-list-option': 'Espace entre les choix de source, de version et d’épisode (extensions).',
            '--lg-size-action': 'Actions rondes ; gardez au moins 44 px pour le tactile.',
            '--lg-size-option': 'Lignes de menu ; gardez au moins 44 px pour le tactile.',
            '--lg-page-card-height': 'Hauteur de la carte de page des médiathèques et collections.',
            '--lg-cast-width': 'Largeur des cartes de distribution sur les pages de détails.',
            '--lg-font': 'Police de toute l’interface ; chargez la police elle-même par un @import dans le CSS personnalisé.',
            '--lg-font-section-title': 'Titres des rangées sur l’accueil, les médiathèques et les détails.',
            '--lg-page-card-title-size': 'Taille du titre de la carte de page des médiathèques et collections.',
            '--lg-page-card-title-weight': 'Graisse du titre de la carte de page des médiathèques et collections.',
            '--lg-duration': 'Retour de survol, de focus et d’ouverture de chaque contrôle.',
            '--lg-duration-slow': 'Mouvements plus amples : zoom des cartes, fondu du carrousel, animation des favoris.',
            '--lg-ease': 'Courbe d’accélération de chaque transition.'
        }
    };
    const translate = key => PREFERENCE_STRINGS[language()]?.[key] ?? PREFERENCE_STRINGS.en[key] ?? nativeTranslate(key);

    // =====================================================================
    // Styles
    // =====================================================================
    // Styles - The optional stylesheet is managed with the extension, so the main theme never
    // carries settings-page rules for accounts that do not enable preferences.
    const STYLE_ID = 'lg-preferences-style';
    const ensureStyle = () => {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('link');
        style.id = STYLE_ID;
        style.rel = 'stylesheet';
        style.href = host.assets + 'extensions/preferences.css';
        style.setAttribute('data-lg-managed', '');
        document.head.append(style);
    };

    // =====================================================================
    // User preferences
    // =====================================================================
    // Preferences - Each user's choices, made on the LumaaGlaass page of Jellyfin's settings menu
    // (#/mypreferenceslumaaglaass), live in the server's display preferences: they follow the account
    // on every device. The browser keeps the last answer, applied at start before the server's.
    const PREFERENCES_ID = 'lumaaglaass', PREFERENCES_CLIENT = 'lumaaglaass', PREFERENCES_ENTRY = 'settings';
    const PREFERENCES_ROUTE = '#/mypreferenceslumaaglaass', PREFERENCES_TITLE = 'LumaaGlaass';
    const PREFERENCES_CACHE = 'lumaaglaass-settings:';
    const ACTION_MODES = ['native', 'details', 'hide'], BUTTON_MODES = ['native', 'hide'];
    const MODE_LABELS = {
        native: 'SettingsModeNative', details: 'SettingsModeDetails', hide: 'SettingsModeHide',
        panel: 'SettingsModePanel', dialog: 'SettingsModeDialog'
    };
    // Fields - One control each, by its path in the saved object: choices make a select, no choices a
    // switch. requires names the switch that enables a field; asset, the file it loads (Assets).
    // Defaults are the documented ones; the main loader's options stand for the theme's two.
    const PREFERENCE_SECTIONS = [
        {
            title: 'SettingsTheme', fields: [
                { path: 'homeCarousel', label: 'SettingsHomeCarousel', help: 'SettingsHomeCarouselHelp', fallback: host.defaults.homeCarousel },
                {
                    path: 'collectionFilter', label: 'SettingsCollectionFilter', help: 'SettingsCollectionFilterHelp',
                    fallback: host.defaults.collectionFilter
                },
                {
                    path: 'hideCountIndicators', label: 'SettingsCountIndicators', help: 'SettingsCountIndicatorsHelp',
                    fallback: false, asset: 'countIndicators'
                }
            ]
        },
        {
            title: 'SettingsPlayerControls', help: 'SettingsPlayerControlsHelp', asset: 'playerControls', fields: [
                { path: 'playerControls.versions', label: 'SettingsVersions', fallback: true },
                { path: 'playerControls.episodes', label: 'SettingsEpisodes', fallback: true }
            ]
        },
        {
            title: 'SettingsSourceSelection', help: 'SettingsSourceSelectionHelp', asset: 'sourceSelection', fields: [
                { path: 'sourceSelection.mode', label: 'SettingsSourceMode', choices: ['native', 'panel', 'dialog'], fallback: 'native' }
            ]
        },
        {
            title: 'SettingsMediaActions', help: 'SettingsMediaActionsHelp', asset: 'mediaActions', fields: [
                ...[
                    ['thumbnails.movies', 'SettingsThumbnailsMovies', 'native'],
                    ['thumbnails.episodes', 'SettingsThumbnailsEpisodes', 'native'],
                    ['thumbnails.series', 'SettingsThumbnailsSeries', 'native'],
                    ['thumbnails.seasons', 'SettingsThumbnailsSeasons', 'native'],
                    ['thumbnails.collections', 'SettingsThumbnailsCollections', 'native'],
                    ['thumbnails.libraries', 'SettingsThumbnailsLibraries', 'native'],
                    ['thumbnails.folders', 'SettingsThumbnailsFolders', 'native'],
                    ['seasonEpisodeThumbnails', 'SettingsSeasonEpisodes', 'native'],
                    ['nextUpThumbnails', 'SettingsNextUpEpisodes', 'native'],
                    ['resumeThumbnails.home.movies', 'SettingsResumeHomeMovies', 'native'],
                    ['resumeThumbnails.home.episodes', 'SettingsResumeHomeEpisodes', 'native'],
                    ['resumeThumbnails.elsewhere.movies', 'SettingsResumeElsewhereMovies', 'native'],
                    ['resumeThumbnails.elsewhere.episodes', 'SettingsResumeElsewhereEpisodes', 'native'],
                    ['cornerButtons', 'SettingsCornerButtons', 'native', BUTTON_MODES],
                    ['resumeButtons.movies', 'SettingsResumeButtonMovies', 'native', BUTTON_MODES],
                    ['resumeButtons.episodes', 'SettingsResumeButtonEpisodes', 'native', BUTTON_MODES],
                    ['mainButtons.collections', 'SettingsMainButtonCollections', 'native'],
                    ['mainButtons.series', 'SettingsMainButtonSeries', 'native'],
                    ['mainButtons.seasons', 'SettingsMainButtonSeasons', 'native']
                ].map(([path, label, fallback, choices = ACTION_MODES]) =>
                    ({ path: 'mediaActions.' + path, label, choices, fallback }))
            ]
        }
    ];
    const PREFERENCE_FIELDS = PREFERENCE_SECTIONS.flatMap(section => section.fields);
    const nonNative = value => typeof value === 'string' ? value !== 'native' : Object.values(value).some(nonNative);
    // Assets - The optional files the settings load, by the element id their documented loaders use.
    // A script reads its options object when it runs and its key's stop() ends it; options() is null
    // while the file is not wanted.
    const PREFERENCE_ASSETS = {
        countIndicators: {
            id: 'lg-hide-count-indicators-style', file: 'extensions/hide-count-indicators.css',
            options: settings => settings.hideCountIndicators ? {} : null
        },
        playerControls: {
            id: 'lg-player-controls-script', file: 'extensions/player-controls.js',
            key: '__lumaaGlaassPlayerControls', global: 'LumaaGlaassPlayerControlsOptions',
            options: ({ playerControls }) => playerControls.versions || playerControls.episodes ? playerControls : null
        },
        sourceSelection: {
            id: 'lg-source-selection-script', file: 'extensions/source-selection.js',
            key: '__lumaaGlaassSourceSelection', global: 'LumaaGlaassSourceSelectionOptions',
            options: ({ sourceSelection }) => sourceSelection.mode === 'native' ? null : sourceSelection
        },
        mediaActions: {
            id: 'lg-media-actions-script', file: 'extensions/media-actions.js',
            key: '__lumaaGlaassMediaActions', global: 'LumaaGlaassMediaActionsOptions',
            options: ({ mediaActions }) => nonNative(mediaActions) ? mediaActions : null
        }
    };
    // Theme variables - Every public variable of customization.md#theme-variables, by its table. type
    // picks the control and unit; css variables name the property a value must be valid for, and
    // fallback is the documented default shown while the theme's own value applies.
    const number = unit => ({
        control: 'number', unit,
        valid: value => new RegExp('^\\d+(?:\\.\\d+)?' + unit + '$').test(value),
        toCss: input => input.trim() === '' ? '' : Number(input) + unit,
        fromCss: value => String(parseFloat(value))
    });
    const plain = value => !/[;{}<>\\]/.test(value);
    const THEME_TYPES = {
        color: { control: 'color', valid: value => plain(value) && CSS.supports('color', value) },
        px: { ...number('px'), step: 1 },
        scale: { ...number(''), step: 0.05 },
        seconds: { ...number('s'), step: 0.01 },
        weight: { control: 'weight', valid: value => /^[1-9]00$/.test(value) },
        css: {
            control: 'text', valid: (value, variable) => plain(value) && CSS.supports(variable.check, value),
            toCss: input => input.trim(), fromCss: value => value
        }
    };
    const THEME_SECTIONS = [
        ['SettingsColors', [
            ['color-accent', 'color'], ['color-text-on-primary', 'color'], ['surface-primary-hover', 'color'],
            ['color-text', 'color'], ['color-text-secondary', 'color'], ['color-focus', 'color'],
            ['color-background', 'color'], ['color-panel', 'color']
        ]],
        ['SettingsGlass', [
            ['surface', 'color'], ['surface-hover', 'color'], ['surface-open', 'color'], ['surface-row-hover', 'color'],
            ['surface-row-selected', 'color'], ['surface-artwork-veil', 'color'], ['edge', 'color'], ['edge-open', 'color'],
            ['blur-control', 'px', '18px'], ['blur-panel', 'px', '32px'], ['blur-backdrop', 'px', '12px'],
            ['shadow-panel', 'css', '0 12px 36px rgba(0,0,0,.3)', 'box-shadow'],
            ['shadow-card', 'css', '0 16px 42px rgba(0,0,0,.12)', 'box-shadow']
        ]],
        ['SettingsShape', [
            ['radius-scale', 'scale', '1'], ['radius-pill', 'px', '999px'], ['radius', 'px', '14px'],
            ['radius-panel', 'px', '24px'], ['radius-panel-compact', 'px', '18px'], ['radius-popup', 'px', '16px'],
            ['radius-option', 'px', '10px'], ['radius-drawer', 'px', '32px'], ['radius-drawer-option', 'px', '12px'],
            ['radius-small', 'px', '8px']
        ]],
        ['SettingsSpacing', [
            ['space-gutter', 'css', 'clamp(16px, 3.4vw, 64px)', 'width'], ['space-header-gap', 'px', '32px'],
            ['space-button-group', 'px', '8px'], ['space-option', 'px', '2px'], ['space-popup', 'px', '6px'],
            ['space-list-option', 'px', '8px'], ['size-action', 'px', '44px'], ['size-option', 'px', '44px'],
            ['page-card-height', 'px', '304px'], ['cast-width', 'css', 'clamp(112px, 10vw, 180px)', 'width']
        ]],
        ['SettingsText', [
            ['font', 'css', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 'font-family'],
            ['font-section-title', 'css', 'clamp(21px, 2vw, 28px)', 'font-size'],
            ['page-card-title-size', 'css', 'clamp(30px, 3.5vw, 56px)', 'font-size'],
            ['page-card-title-weight', 'weight', '600']
        ]],
        ['SettingsMotion', [
            ['duration', 'seconds', '0.2s'], ['duration-slow', 'seconds', '0.5s'],
            ['ease', 'css', 'cubic-bezier(0.16, 1, 0.3, 1)', 'transition-timing-function']
        ]]
    ].map(([title, variables]) => ({
        title,
        variables: variables.map(([name, type, fallback = '', check = '']) => ({ name, type: THEME_TYPES[type], fallback, check }))
    }));
    const THEME_VARIABLES = THEME_SECTIONS.flatMap(section => section.variables);
    // Recipes - customization.md#quick-recipes: each fills its variables in the form.
    const THEME_RECIPES = [
        ['SettingsRecipeAccent', { 'color-accent': '#4f8cff', 'color-text-on-primary': '#ffffff' }],
        ['SettingsRecipeSquare', { 'radius-scale': '0' }],
        ['SettingsRecipeSofter', { 'radius-scale': '0.5' }],
        ['SettingsRecipeRounder', { 'radius-scale': '1.5' }],
        ['SettingsRecipeOpaque', { surface: 'rgba(30, 30, 32, 0.7)' }],
        ['SettingsRecipeLightBlur', { 'blur-control': '8px', 'blur-panel': '12px' }],
        ['SettingsRecipeNoBlur', { 'blur-control': '0px', 'blur-panel': '0px' }],
        ['SettingsRecipeSnappy', { duration: '0.12s', 'duration-slow': '0.3s' }],
        ['SettingsRecipeCalm', { duration: '0.4s', 'duration-slow': '1s' }],
        ['SettingsRecipeTight', { 'space-gutter': '16px', 'space-header-gap': '20px' }]
    ];
    // Accessibility - The variables each system preference sets in the stylesheet keep its values
    // there, as the documentation's no-preference wrapper would: a choice never undoes them.
    const THEME_GUARDS = [
        ['(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)',
            ['surface', 'blur-control', 'blur-panel']],
        ['(prefers-reduced-transparency: reduce)', ['blur-backdrop']],
        ['(prefers-contrast: more)', ['edge', 'edge-open']],
        ['(forced-colors: active)', ['color-text', 'color-text-secondary', 'color-text-on-primary', 'color-focus']]
    ].map(([query, names]) => [matchMedia(query), names]);
    function normalizeTheme(saved) {
        const result = {};
        for (const variable of THEME_VARIABLES) {
            const value = saved?.[variable.name];
            if (typeof value === 'string' && variable.type.valid(value.trim(), variable)) result[variable.name] = value.trim();
        }
        return result;
    }
    // Apply - Written on the root's own style, above the stylesheet and Custom CSS overrides.
    let themeValues = {};
    function applyThemeVariables(values) {
        themeValues = values || {};
        const guarded = new Set(THEME_GUARDS.flatMap(([query, names]) => query.matches ? names : []));
        const style = document.documentElement.style;
        for (const { name } of THEME_VARIABLES) {
            const property = '--lg-' + name, value = guarded.has(name) ? '' : themeValues[name] || '';
            if (!value) style.removeProperty(property);
            else if (style.getPropertyValue(property) !== value) style.setProperty(property, value);
        }
    }
    THEME_GUARDS.forEach(([query]) => listen(query, 'change', () => applyThemeVariables(themeValues)));
    // Colors - A computed color as channels; color-mix() computes to color(srgb …) in some engines.
    function colorChannels(text) {
        const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?/.exec(text);
        const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?/.exec(text);
        const match = rgb || srgb;
        if (!match) return { r: 0, g: 0, b: 0, a: 1 };
        const scale = rgb ? 1 : 255;
        const alpha = match[4] === undefined ? 1 : Number(match[4]) / (match[5] ? 100 : 1);
        return { r: Math.round(match[1] * scale), g: Math.round(match[2] * scale), b: Math.round(match[3] * scale), a: alpha };
    }
    // Colors - What a value (or, empty, the theme's own value) computes to, read on a probe while
    // the root's own value is set aside.
    function computedColor(name, value) {
        const style = document.documentElement.style, property = '--lg-' + name;
        const own = style.getPropertyValue(property);
        if (!value) style.removeProperty(property);
        const probe = element('span');
        probe.hidden = true;
        probe.style.color = value || 'var(' + property + ')';
        document.body.append(probe);
        const channels = colorChannels(getComputedStyle(probe).color);
        probe.remove();
        if (!value && own) style.setProperty(property, own);
        return channels;
    }
    const hex = ({ r, g, b }) => '#' + [r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('');
    const readPath = (object, path) => path.split('.').reduce((value, part) => value?.[part], object);
    function writePath(object, path, value) {
        const parts = path.split('.'), last = parts.pop();
        parts.reduce((node, part) => node[part] ||= {}, object)[last] = value;
    }
    // Normalize - Every field once: its saved value when valid, else its default. Saves made before a
    // field existed gain it; unknown entries are dropped.
    function normalizePreferences(saved) {
        const result = {};
        for (const field of PREFERENCE_FIELDS) {
            const value = readPath(saved, field.path);
            const valid = field.choices ? field.choices.includes(value) : typeof value === 'boolean';
            writePath(result, field.path, valid ? value : field.fallback);
        }
        result.theme = normalizeTheme(saved?.theme);
        return result;
    }
    // Storage - One JSON entry in the custom preferences of the theme's own id and client.
    async function loadPreferences(api, userId) {
        const dto = await api.getDisplayPreferences(PREFERENCES_ID, userId, PREFERENCES_CLIENT);
        let saved = null;
        try {
            saved = JSON.parse(dto?.CustomPrefs?.[PREFERENCES_ENTRY] || 'null');
        } catch { /* A damaged entry reads as never saved. */ }
        return { dto, saved: saved && typeof saved === 'object' ? saved : null };
    }
    function savePreferences(api, userId, dto, saved) {
        const body = { ...dto, CustomPrefs: { ...dto?.CustomPrefs, [PREFERENCES_ENTRY]: JSON.stringify(saved) } };
        return api.updateDisplayPreferences(PREFERENCES_ID, body, userId, PREFERENCES_CLIENT);
    }
    const cachedPreferences = key => {
        try {
            return JSON.parse(localStorage.getItem(PREFERENCES_CACHE + key) || 'null');
        } catch { return null; }
    };
    const cachePreferences = (key, saved) => {
        try {
            localStorage.setItem(PREFERENCES_CACHE + key, JSON.stringify(saved));
        } catch { /* Private modes may refuse storage: the server's answer still applies. */ }
    };
    // External - A file the theme did not add came from the server's Custom JavaScript or CSS, which
    // decides for every account: the settings leave it alone. Stylesheets are found by their import.
    function externalAsset(asset) {
        const node = document.getElementById(asset.id);
        if (node) return !node.hasAttribute('data-lg-managed');
        if (asset.key) return false;
        for (const sheet of document.styleSheets) {
            let rules;
            try {
                rules = sheet.cssRules;
            } catch { continue; }
            // Imports lead a sheet, after @layer statements only.
            for (const rule of rules) {
                if (rule instanceof CSSImportRule) {
                    if (rule.href?.endsWith(asset.file)) return true;
                } else if (!(window.CSSLayerStatementRule && rule instanceof CSSLayerStatementRule)) {
                    break;
                }
            }
        }
        return false;
    }
    // Session - activePreferences: the signed-in user's normalized settings (null signed out).
    // preferencesRun drops answers for an earlier session or older than a save.
    let activePreferences = null, preferencesSession = '', preferencesRun = 0, preferencesState = 'idle';
    let preferencesRetryAt = 0;
    const assetStates = new Map();
    // Assets - One load at a time per file: a change made while one loads waits for it, so an older
    // script can never run after a newer one. A failed load is not retried until the choice changes.
    function syncAsset(name) {
        const asset = PREFERENCE_ASSETS[name];
        if (!assetStates.has(name)) assetStates.set(name, { running: '', failed: '', loading: false });
        const state = assetStates.get(name);
        if (stopped || state.loading || externalAsset(asset)) return;
        const options = activePreferences && asset.options(activePreferences);
        const wanted = options ? JSON.stringify(options) : '';
        if (wanted === state.running || (wanted && wanted === state.failed)) return;
        if (asset.key) window[asset.key]?.stop();
        document.getElementById(asset.id)?.remove();
        state.running = '';
        if (!options) return;
        const node = document.createElement(asset.key ? 'script' : 'link');
        node.id = asset.id;
        node.setAttribute('data-lg-managed', '');
        if (asset.key) {
            window[asset.global] = options;
            node.src = host.assets + asset.file;
        } else {
            node.rel = 'stylesheet';
            node.href = host.assets + asset.file;
        }
        const settle = loaded => {
            if (stopped) return;
            state.loading = false;
            state.running = loaded ? wanted : '';
            state.failed = loaded ? '' : wanted;
            if (!loaded) {
                node.remove();
                console.error('LumaaGlaass could not load ' + asset.file + '.');
            }
            syncAsset(name);
        };
        node.onload = () => settle(true);
        node.onerror = () => settle(false);
        state.loading = true;
        document.head.append(node);
    }
    // Apply - The theme's two settings change in place (the banner rebuilds); files load or stop;
    // theme variables apply unless the open page previews its own.
    function applyPreferences(saved) {
        activePreferences = preferencesSession ? normalizePreferences(saved) : null;
        host.applyCore(activePreferences ? {
            homeCarousel: activePreferences.homeCarousel,
            collectionFilter: activePreferences.collectionFilter
        } : null);
        Object.keys(PREFERENCE_ASSETS).forEach(syncAsset);
        if (!preferencesPage) applyThemeVariables(activePreferences?.theme);
    }
    // Session - A new account applies its cached settings at once, then the server's.
    function syncPreferences(api, key) {
        if (key !== preferencesSession) {
            preferencesSession = key;
            preferencesRun++;
            preferencesState = key ? 'stale' : 'idle';
            preferencesRetryAt = 0;
            applyPreferences(key ? cachedPreferences(key) : null);
        }
        if (preferencesState !== 'stale' || Date.now() < preferencesRetryAt) return;
        preferencesState = 'loading';
        const run = preferencesRun;
        loadPreferences(api, api.getCurrentUserId()).then(({ saved }) => {
            if (stopped || run !== preferencesRun) return;
            preferencesState = 'loaded';
            cachePreferences(key, saved);
            applyPreferences(saved);
        }, () => {
            if (stopped || run !== preferencesRun) return;
            preferencesState = 'stale';
            preferencesRetryAt = Date.now() + 30000;
        });
    }
    // Own save - The page's save for the signed-in user applies at once; a load already in flight
    // carries the older values and is dropped.
    function adoptPreferences(key, saved) {
        if (key !== preferencesSession) return;
        preferencesRun++;
        preferencesState = 'loaded';
        cachePreferences(key, saved);
        applyPreferences(saved);
    }
    // Menu - The entry follows Controls in Jellyfin's settings menu, or ends the user section where
    // Controls is not offered (mobile, nothing to control). It keeps the user being edited (?userId=).
    function syncPreferencesLink() {
        const section = document.querySelector('#myPreferencesMenuPage .readOnlyContent > .verticalSection:not(.adminSection)');
        if (!section) return;
        let link = section.querySelector(':scope > .lg-preferences-link');
        if (!link) {
            link = element('a', 'emby-button lg-preferences-link listItem-border');
            link.style.cssText = 'display:block;margin:0;padding:0';
            const item = element('div', 'listItem');
            const icon = element('span', 'material-icons listItemIcon listItemIcon-transparent');
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = 'palette';
            const body = element('div', 'listItemBody');
            body.append(element('div', 'listItemBodyText', PREFERENCES_TITLE));
            item.append(icon, body);
            link.append(item);
        }
        const controls = section.querySelector(':scope > .lnkControlsPreferences');
        if (controls ? controls.nextElementSibling !== link : section.lastElementChild !== link) {
            if (controls) controls.after(link);
            else section.append(link);
        }
        const userId = params().get('userId');
        setAttribute(link, 'href', PREFERENCES_ROUTE + (userId ? '?userId=' + encodeURIComponent(userId) : ''));
    }
    // Page - Jellyfin has no route for it and shows its "page not found" view there: while the route
    // lasts, the theme hides that view's content, adds the form after it and names the page.
    let preferencesPage = null;
    function syncPreferencesPage(api, key) {
        const page = key && route() === PREFERENCES_ROUTE ? document.getElementById('fallbackPage') : null;
        const userId = page ? params().get('userId') || api.getCurrentUserId() : '';
        const open = preferencesPage;
        if (open && (open.page !== page || !page.isConnected || open.key !== key || !sameId(open.userId, userId) ||
            open.language !== language())) {
            closePreferencesPage();
        }
        if (!page) return;
        if (!preferencesPage) openPreferencesPage(page, api, key, userId);
        setAttribute(page, 'data-title', PREFERENCES_TITLE);
        if (document.title !== PREFERENCES_TITLE) {
            if (typeof window.LibraryMenu?.setTitle === 'function') window.LibraryMenu.setTitle(PREFERENCES_TITLE);
            else document.title = PREFERENCES_TITLE;
        }
    }
    function openPreferencesPage(page, api, key, userId) {
        const container = element('div', 'lg-preferences padded-left padded-right padded-bottom-page padded-top');
        container.id = 'lg-preferences';
        const form = element('form', 'readOnlyContent');
        const fields = element('fieldset', 'lg-preferences-fields');
        fields.disabled = true;
        const own = sameId(userId, api.getCurrentUserId());
        const state = {
            page, key, userId, language: language(), container, fields, dto: null, load: 0,
            hidden: [...page.children].filter(node => !node.hidden), title: page.getAttribute('data-title'),
            controls: new Map(), notes: new Map(), theme: new Map(),
            submit: element('button', 'raised button-submit block emby-button'),
            submitText: element('span', '', translate('Save')),
            status: element('p', 'fieldDescription lg-preferences-status'),
            secondary: element('button', 'button-flat emby-button lg-preferences-secondary')
        };
        const note = asset => {
            const node = element('p', 'fieldDescription lg-preferences-note', translate('SettingsExternal'));
            node.hidden = true;
            state.notes.set(asset, node);
            return node;
        };
        fields.append(element('p', 'fieldDescription lg-preferences-intro', translate('SettingsIntro')));
        for (const section of PREFERENCE_SECTIONS) {
            const block = element('div', 'verticalSection verticalSection-extrabottompadding lg-preferences-section');
            block.append(element('h2', 'sectionTitle', translate(section.title)));
            if (section.help) block.append(element('p', 'fieldDescription lg-preferences-description', translate(section.help)));
            if (section.asset) block.append(note(section.asset));
            for (const field of section.fields) {
                const id = 'lg-setting-' + field.path.replace(/\./g, '-');
                let row, control, select;
                if (field.choices) {
                    row = element('div', 'lg-preference');
                    const label = element('label', 'lg-preference-label', translate(field.label));
                    select = preferenceSelect();
                    control = select.control;
                    for (const choice of field.choices) {
                        const option = element('option', '', translate(MODE_LABELS[choice]));
                        option.value = choice;
                        control.append(option);
                    }
                    control.id = id;
                    label.id = id + '-label';
                    select.trigger.id = id + '-trigger';
                    select.trigger.setAttribute('aria-labelledby', label.id);
                    label.htmlFor = select.trigger.id;
                    select.sync();
                    row.append(label, select.shell);
                    state.controls.set(field.path, { field, control, row, asset: field.asset || section.asset });
                } else {
                    row = element('label', 'lg-preference lg-preference-switch');
                    const text = element('span', 'lg-preference-text');
                    text.append(element('span', 'lg-preference-label', translate(field.label)));
                    if (field.help) text.append(element('span', 'fieldDescription lg-preference-help', translate(field.help)));
                    control = element('input', 'lg-switch');
                    control.type = 'checkbox';
                    control.setAttribute('role', 'switch');
                    row.append(text, control);
                    control.id = id;
                    state.controls.set(field.path, { field, control, row, asset: field.asset || section.asset });
                }
                control.name = field.path;
                block.append(row);
                if (field.asset) block.append(note(field.asset));
            }
            fields.append(block);
        }
        fields.append(...themeBlocks(state));
        state.status.setAttribute('role', 'status');
        state.submit.type = 'submit';
        state.submit.disabled = true;
        state.submit.append(state.submitText);
        state.secondary.type = 'button';
        state.secondary.hidden = true;
        form.append(fields, state.status, state.secondary, state.submit);
        container.append(form);
        form.addEventListener('change', () => {
            setText(state.status, '');
            syncPreferenceControls(state);
        });
        // Theme - Every edit previews at once; Save keeps it, leaving the page restores the saved values.
        form.addEventListener('input', event => {
            const entry = state.theme.get(event.target.dataset?.lgVariable);
            if (!entry) return;
            if (entry.variable.type.control === 'color') entry.set = true;
            setText(state.status, '');
            previewTheme(state);
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            void submitPreferences(state, api);
        });
        state.secondary.addEventListener('click', () => {
            if (state.secondary.dataset.lgAction === 'retry') {
                loadPagePreferences(state, api, own);
                return;
            }
            resetPreferences(state);
        });
        preferencesPage = state;
        fillPreferences(state, own && activePreferences || normalizePreferences(null));
        state.hidden.forEach(node => { node.hidden = true; });
        page.append(container);
        loadPagePreferences(state, api, own);
    }
    function closePreferencesPage() {
        const state = preferencesPage;
        if (!state) return;
        preferencesPage = null;
        for (const select of preferenceSelects) {
            if (state.container.contains(select.shell)) {
                select.destroy();
                preferenceSelects.delete(select);
            }
        }
        state.container.remove();
        state.hidden.forEach(node => { node.hidden = false; });
        if (state.title === null) state.page.removeAttribute('data-title');
        else setAttribute(state.page, 'data-title', state.title);
        applyThemeVariables(activePreferences?.theme);
    }
    function fillPreferences(state, values) {
        for (const [path, { field, control }] of state.controls) {
            if (field.choices) control.value = readPath(values, path);
            else control.checked = readPath(values, path);
        }
        for (const entry of state.theme.values()) setThemeEntry(entry, values.theme[entry.variable.name] || '');
        syncPreferenceControls(state);
    }
    // Theme - The variables section: recipes, then one table of the documentation per section. Each
    // row names its variable, says what it does and holds its control and a reset to the theme's value.
    function themeBlocks(state) {
        const intro = element('div', 'verticalSection verticalSection-extrabottompadding lg-preferences-section');
        intro.append(element('h2', 'sectionTitle', translate('SettingsVariables')),
            element('p', 'fieldDescription lg-preferences-description', translate('SettingsVariablesHelp')));
        const recipes = element('div', 'lg-theme-recipes');
        const recipeButton = (label, values) => {
            const button = element('button', 'raised emby-button lg-theme-recipe', translate(label));
            button.type = 'button';
            button.addEventListener('click', () => {
                for (const entry of state.theme.values()) {
                    const name = entry.variable.name;
                    if (!values || name in values) setThemeEntry(entry, values ? values[name] : '');
                }
                setText(state.status, '');
                previewTheme(state);
            });
            return button;
        };
        recipes.append(...THEME_RECIPES.map(([label, values]) => recipeButton(label, values)), recipeButton('SettingsResetAll', null));
        intro.append(element('h3', 'lg-theme-recipes-title', translate('SettingsRecipes')), recipes);
        return [intro, ...THEME_SECTIONS.map(section => {
            const block = element('div', 'verticalSection verticalSection-extrabottompadding lg-preferences-section');
            block.append(element('h2', 'sectionTitle', translate(section.title)));
            for (const variable of section.variables) block.append(themeRow(state, variable));
            return block;
        })];
    }
    function themeRow(state, variable) {
        const name = '--lg-' + variable.name, id = 'lg-setting-theme-' + variable.name, type = variable.type;
        const row = element('div', 'lg-preference lg-theme-variable');
        const text = element('label', 'lg-preference-text');
        const label = element('code', 'lg-preference-label', name);
        text.append(label, element('span', 'fieldDescription lg-preference-help', translate(name)));
        const control = element('div', 'lg-theme-control');
        const entry = { variable, set: false, input: null, alpha: null, reset: element('button', 'paper-icon-button-light lg-theme-reset') };
        if (type.control === 'color') {
            entry.input = element('input', 'lg-theme-color');
            entry.input.type = 'color';
            entry.alpha = element('input', 'lg-theme-alpha');
            Object.assign(entry.alpha, { type: 'range', min: '0', max: '100', step: '1' });
            entry.alpha.setAttribute('aria-label', translate('SettingsOpacity') + ' ' + name);
            entry.alpha.dataset.lgVariable = variable.name;
            control.append(entry.input, entry.alpha);
        } else if (type.control === 'weight') {
            const select = preferenceSelect();
            entry.input = select.control;
            for (const value of ['', '100', '200', '300', '400', '500', '600', '700', '800', '900']) {
                const option = element('option', '', value || translate('SettingsDefault') + ' (' + variable.fallback + ')');
                option.value = value;
                entry.input.append(option);
            }
            entry.select = select;
            select.sync();
        } else {
            entry.input = element('input', 'emby-input lg-theme-input');
            if (type.control === 'number') {
                Object.assign(entry.input, { type: 'number', min: '0', step: String(type.step), inputMode: 'decimal' });
                entry.input.placeholder = type.fromCss(variable.fallback);
            } else {
                Object.assign(entry.input, { type: 'text', spellcheck: false, autocomplete: 'off' });
                entry.input.placeholder = variable.fallback;
            }
            control.append(entry.input);
            if (type.unit) control.append(element('span', 'lg-theme-unit', type.unit));
        }
        entry.input.id = id;
        entry.input.dataset.lgVariable = variable.name;
        if (type.control === 'weight') {
            label.id = id + '-label';
            entry.select.trigger.id = id + '-trigger';
            entry.select.trigger.setAttribute('aria-labelledby', label.id);
            control.append(entry.select.shell);
        }
        entry.reset.type = 'button';
        entry.reset.setAttribute('aria-label', translate('SettingsReset') + ' ' + name);
        const icon = element('span', 'material-icons undo');
        icon.setAttribute('aria-hidden', 'true');
        entry.reset.append(icon);
        entry.reset.addEventListener('click', () => {
            setThemeEntry(entry, '');
            previewTheme(state);
            (entry.select?.trigger || entry.input).focus();
        });
        control.append(entry.reset);
        state.theme.set(variable.name, entry);
        row.append(text, control);
        return row;
    }
    // Theme - Shows a value in its row; empty shows the theme's own (colors read it from the page).
    function setThemeEntry(entry, value) {
        const { variable, input, alpha } = entry;
        input.removeAttribute('aria-invalid');
        if (variable.type.control === 'color') {
            entry.set = Boolean(value);
            const channels = computedColor(variable.name, value);
            input.value = hex(channels);
            alpha.value = String(Math.round(channels.a * 100));
        } else if (variable.type.control === 'weight' || variable.type.control === 'text') {
            input.value = value;
        } else {
            input.value = value ? variable.type.fromCss(value) : '';
        }
        entry.select?.sync();
        entry.reset.disabled = !value;
    }
    function themeEntryValue({ variable, input, alpha, set }) {
        if (variable.type.control === 'color') {
            if (!set) return '';
            if (alpha.value === '100') return input.value;
            const [r, g, b] = [1, 3, 5].map(start => parseInt(input.value.slice(start, start + 2), 16));
            return `rgba(${r}, ${g}, ${b}, ${Number(alpha.value) / 100})`;
        }
        if (variable.type.control === 'weight') return input.value;
        return variable.type.toCss(input.value);
    }
    // Theme - The form's values; a value invalid for its variable is marked and not kept.
    function collectTheme(state) {
        const values = {}, invalid = [];
        for (const entry of state.theme.values()) {
            const value = themeEntryValue(entry);
            const bad = Boolean(value) && !entry.variable.type.valid(value, entry.variable);
            if (bad) invalid.push(entry.input);
            else if (value) values[entry.variable.name] = value;
            if (bad) setAttribute(entry.input, 'aria-invalid', 'true');
            else entry.input.removeAttribute('aria-invalid');
            entry.reset.disabled = !value;
        }
        return { values, invalid };
    }
    function previewTheme(state) {
        applyThemeVariables(collectTheme(state).values);
    }
    // Controls - A field waits for the switch it requires; inactive dependent rows stay out of the
    // way. A file the server loads locks its fields instead, with a note explaining why.
    function syncPreferenceControls(state) {
        const locked = new Map();
        for (const asset of state.notes.keys()) locked.set(asset, externalAsset(PREFERENCE_ASSETS[asset]));
        for (const { field, control, row, asset } of state.controls.values()) {
            const required = !field.requires || state.controls.get(field.requires).control.checked;
            const externallyManaged = Boolean(asset && locked.get(asset));
            row.hidden = !externallyManaged && !required;
            control.disabled = externallyManaged || !required;
        }
        for (const select of preferenceSelects) select.sync();
        for (const [asset, node] of state.notes) node.hidden = !locked.get(asset);
    }
    // Reset - Defaults update the form and its theme preview only. Save remains the explicit
    // server write, so users can compare the defaults without changing their account.
    function resetPreferences(state) {
        if (state.fields.disabled || !state.dto) return;
        fillPreferences(state, normalizePreferences(null));
        previewTheme(state);
        setText(state.status, translate('SettingsDefaultsRestored'));
    }
    // Secondary action - Reset after a successful load, or retry only when loading failed.
    // The secondary action never competes with the primary Save action.
    function setSecondaryAction(state, action) {
        state.secondary.dataset.lgAction = action;
        setText(state.secondary, translate(action === 'retry' ? 'SettingsRetry' : 'SettingsResetDefaults'));
        state.secondary.hidden = false;
        state.secondary.disabled = false;
    }
    // Load - Keep the form unavailable until its server copy is known, but expose a retry instead
    // of leaving every control permanently disabled after a failed request.
    function loadPagePreferences(state, api, own) {
        const run = ++state.load;
        state.fields.disabled = true;
        state.submit.disabled = true;
        state.secondary.hidden = true;
        state.secondary.disabled = true;
        setText(state.status, translate('SettingsLoading'));
        loadPreferences(api, state.userId).then(({ dto, saved }) => {
            if (preferencesPage !== state || state.load !== run) return;
            if (own) adoptPreferences(state.key, saved);
            state.dto = dto;
            fillPreferences(state, normalizePreferences(saved));
            previewTheme(state);
            state.fields.disabled = false;
            state.submit.disabled = false;
            syncPreferenceControls(state);
            setSecondaryAction(state, 'reset');
            setText(state.status, '');
        }, () => {
            if (preferencesPage !== state || state.load !== run) return;
            setText(state.status, translate('SettingsLoadError'));
            setSecondaryAction(state, 'retry');
        });
    }
    async function submitPreferences(state, api) {
        if (state.fields.disabled || !state.dto) return;
        const theme = collectTheme(state);
        if (theme.invalid.length) {
            setText(state.status, translate('SettingsInvalid'));
            theme.invalid[0].focus();
            return;
        }
        const saved = { theme: theme.values };
        for (const [path, { field, control }] of state.controls) writePath(saved, path, field.choices ? control.value : control.checked);
        const values = normalizePreferences(saved);
        state.fields.disabled = true;
        state.submit.disabled = true;
        state.secondary.disabled = true;
        state.submit.setAttribute('aria-busy', 'true');
        setText(state.submitText, translate('SettingsSaving'));
        setText(state.status, '');
        const own = sameId(state.userId, api.getCurrentUserId());
        let message = 'SettingsSaveError';
        try {
            await savePreferences(api, state.userId, state.dto, values);
            if (own) adoptPreferences(state.key, values);
            message = own ? 'SettingsSaved' : 'SettingsSavedOther';
        } catch { /* The form keeps the choices for another try. */ }
        if (preferencesPage !== state) return;
        state.fields.disabled = false;
        state.submit.disabled = false;
        state.secondary.disabled = false;
        syncPreferenceControls(state);
        state.submit.removeAttribute('aria-busy');
        setText(state.submitText, translate('Save'));
        setText(state.status, translate(message));
    }
    // Stop - The page, the menu entry and the files the settings loaded go; the server's own stay.
    function clearPreferences() {
        closePreferencesPage();
        applyThemeVariables({});
        document.querySelectorAll('.lg-preferences-link').forEach(node => node.remove());
        for (const asset of Object.values(PREFERENCE_ASSETS)) {
            const node = document.getElementById(asset.id);
            if (!node?.hasAttribute('data-lg-managed')) continue;
            if (asset.key) window[asset.key]?.stop();
            node.remove();
        }
    }
    function sync() {
        const api = host.api();
        const key = host.sessionKey(api);
        syncPreferences(api, key);
        syncPreferencesLink();
        syncPreferencesPage(api, key);
    }
    let scheduled = 0;
    const schedule = () => {
        if (scheduled || stopped) return;
        scheduled = requestAnimationFrame(() => {
            scheduled = 0;
            sync();
        });
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    ensureStyle();
    window[KEY] = {
        stop() {
            stopped = true;
            cancelAnimationFrame(scheduled);
            observer.disconnect();
            window.removeEventListener('hashchange', schedule);
            listeners.forEach(fn => fn());
            for (const select of preferenceSelects) select.destroy();
            preferenceSelects.clear();
            clearPreferences();
            document.getElementById(STYLE_ID)?.remove();
            host.applyCore(null);
            delete window[KEY];
        }
    };
    sync();
})();
