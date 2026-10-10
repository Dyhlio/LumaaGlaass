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
    const assetUrl = typeof host.assetUrl === 'function' ? host.assetUrl : path => host.assets + path;

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
            SettingsProfiles: 'Profiles',
            SettingsProfilesHelp: 'Apply the recommended settings, import a JSON profile from a file or URL, or export the current settings. ' +
                'URL imports need a CORS-enabled HTTP(S) endpoint. Save writes changes to the account; Recommended leaves theme variables unchanged.',
            SettingsProfile: 'Profile',
            SettingsProfileFileActions: 'JSON file',
            SettingsProfileRecommended: 'Recommended',
            SettingsProfileApply: 'Apply profile',
            SettingsProfileImport: 'Import JSON file',
            SettingsProfileUrlLabel: 'Profile JSON URL',
            SettingsProfileUrlPlaceholder: 'https://example.com/profile.json',
            SettingsProfileImportUrl: 'Import URL',
            SettingsProfileUrlRequired: 'Enter a profile URL.',
            SettingsProfileUrlInvalid: 'Enter a valid HTTP or HTTPS URL without embedded credentials.',
            SettingsProfileUrlLoading: 'Loading profile from URL…',
            SettingsProfileUrlReadError: 'Could not load the URL. Check that it serves JSON and allows browser access (CORS).',
            SettingsProfileExport: 'Export JSON',
            SettingsProfileActive: 'Current settings: ',
            SettingsProfileCustom: 'Custom',
            SettingsProfileImportedName: 'Imported profile',
            SettingsProfileApplied: 'Recommended settings loaded. Save to apply them to this account.',
            SettingsProfileAppliedPartial: 'Recommended settings loaded. Some options are controlled by the server and were left unchanged.',
            SettingsProfileImported: 'Profile loaded into the form. Review it, then save to apply it.',
            SettingsProfileImportedPartial: 'Profile loaded. Unsupported or invalid entries were ignored; review it before saving.',
            SettingsProfileExported: 'Profile downloaded.',
            SettingsProfileInvalid: 'This is not a supported LumaaGlaass profile.',
            SettingsProfileTooLarge: 'The profile exceeds the 256 KB size limit.',
            SettingsProfileNoSettings: 'The profile contains no supported settings.',
            SettingsProfileReadError: 'Could not read the profile. Check that it is a valid JSON file.',
            SettingsProfileExportError: 'The profile could not be exported.',
            SettingsTheme: 'Theme',
            SettingsHomeCarousel: 'Home carousel',
            SettingsHomeCarouselHelp: 'Rotating artwork on the home page. Off, a still media background remains.',
            SettingsHomeLibraryNamesOnly: 'Recently added titles',
            SettingsHomeLibraryNamesOnlyHelp: 'Shows only the library name on Recently Added rows on the home page.',
            SettingsCollectionFilter: 'Collection filter',
            SettingsCollectionFilterHelp: 'All / Movies / Shows above collections that mix movies and series.',
            SettingsCountIndicators: 'Hide count indicators',
            SettingsCountIndicatorsHelp: 'Hides the numeric badges on cards and lists.',
            SettingsPlayerControls: 'Player controls',
            SettingsPlayerControlsHelp: 'Buttons added to the integrated player.',
            SettingsVersions: 'Version switcher',
            SettingsEpisodes: 'Episode switcher',
            SettingsSourceSelection: 'Versions and tracks',
            SettingsSourceSelectionHelp: 'Choose how versions, audio tracks and subtitles are selected on ' +
                'item detail pages.',
            SettingsSourceMode: 'Mode',
            SettingsMediaActions: 'Media actions',
            SettingsMediaActionsHelp: 'Play shortcuts, corner actions and main buttons of details pages.',
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
            SettingsCornerMovies: 'Movie corner buttons',
            SettingsCornerEpisodes: 'Episode corner buttons',
            SettingsCornerSeries: 'Series corner buttons',
            SettingsCornerSeasons: 'Season corner buttons',
            SettingsCornerCollections: 'Collection corner buttons',
            SettingsCornerLibraries: 'Library corner buttons',
            SettingsCornerFolders: 'Folder corner buttons',
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
            SettingsDefaultsRestored: 'Recommended settings restored. Save to keep them.',
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
            SettingsProfiles: 'Profils',
            SettingsProfilesHelp: 'Appliquez les réglages recommandés, importez un profil JSON depuis un fichier ou une URL, ou exportez les réglages actuels. ' +
                'Une URL doit autoriser l’accès du navigateur (CORS) en HTTP(S). Enregistrer applique les changements au compte ; Recommandé conserve les variables du thème.',
            SettingsProfile: 'Profil',
            SettingsProfileFileActions: 'Fichier JSON',
            SettingsProfileRecommended: 'Recommandé',
            SettingsProfileApply: 'Appliquer le profil',
            SettingsProfileImport: 'Importer un fichier JSON',
            SettingsProfileUrlLabel: 'URL du profil JSON',
            SettingsProfileUrlPlaceholder: 'https://exemple.com/profil.json',
            SettingsProfileImportUrl: 'Importer l’URL',
            SettingsProfileUrlRequired: 'Saisissez l’URL d’un profil.',
            SettingsProfileUrlInvalid: 'Saisissez une URL HTTP ou HTTPS valide, sans identifiants intégrés.',
            SettingsProfileUrlLoading: 'Chargement du profil depuis l’URL…',
            SettingsProfileUrlReadError: 'Impossible de charger cette URL. Vérifiez qu’elle fournit du JSON et autorise l’accès du navigateur (CORS).',
            SettingsProfileExport: 'Exporter JSON',
            SettingsProfileActive: 'Réglages actuels : ',
            SettingsProfileCustom: 'Personnalisé',
            SettingsProfileImportedName: 'Profil importé',
            SettingsProfileApplied: 'Réglages recommandés chargés. Enregistrez pour les appliquer à ce compte.',
            SettingsProfileAppliedPartial: 'Réglages recommandés chargés. Certaines options gérées par le serveur sont restées inchangées.',
            SettingsProfileImported: 'Profil chargé dans le formulaire. Vérifiez-le, puis enregistrez pour l’appliquer.',
            SettingsProfileImportedPartial: 'Profil chargé. Les champs invalides ou non pris en charge ont été ignorés ; vérifiez avant d’enregistrer.',
            SettingsProfileExported: 'Profil téléchargé.',
            SettingsProfileInvalid: 'Ce fichier n’est pas un profil LumaaGlaass pris en charge.',
            SettingsProfileTooLarge: 'Le profil dépasse la taille maximale de 256 Ko.',
            SettingsProfileNoSettings: 'Le profil ne contient aucun réglage pris en charge.',
            SettingsProfileReadError: 'Impossible de lire le profil. Vérifiez qu’il s’agit d’un fichier JSON valide.',
            SettingsProfileExportError: 'Le profil n’a pas pu être exporté.',
            SettingsTheme: 'Thème',
            SettingsHomeCarousel: 'Carrousel d’accueil',
            SettingsHomeCarouselHelp: 'Images défilantes sur l’accueil. Désactivé, un fond fixe reste affiché.',
            SettingsHomeLibraryNamesOnly: 'Titres des ajouts récents',
            SettingsHomeLibraryNamesOnlyHelp: 'Affiche uniquement le nom de la médiathèque sur les rangées Ajouts récents de l’accueil.',
            SettingsCollectionFilter: 'Filtre des collections',
            SettingsCollectionFilterHelp: 'Tout / Films / Séries au-dessus des collections mêlant films et séries.',
            SettingsCountIndicators: 'Masquer les compteurs',
            SettingsCountIndicatorsHelp: 'Masque les pastilles numériques des vignettes et des listes.',
            SettingsPlayerControls: 'Contrôles du lecteur',
            SettingsPlayerControlsHelp: 'Boutons ajoutés au lecteur intégré.',
            SettingsVersions: 'Changement de version',
            SettingsEpisodes: 'Changement d’épisode',
            SettingsSourceSelection: 'Version et pistes',
            SettingsSourceSelectionHelp: 'Choix de l’interface pour sélectionner les versions, les pistes audio et les ' +
                'sous-titres sur les pages de détails.',
            SettingsSourceMode: 'Mode',
            SettingsMediaActions: 'Actions des médias',
            SettingsMediaActionsHelp: 'Raccourcis de lecture, boutons d’angle et boutons principaux des pages de détails.',
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
            SettingsCornerMovies: 'Boutons d’angle des films',
            SettingsCornerEpisodes: 'Boutons d’angle des épisodes',
            SettingsCornerSeries: 'Boutons d’angle des séries',
            SettingsCornerSeasons: 'Boutons d’angle des saisons',
            SettingsCornerCollections: 'Boutons d’angle des collections',
            SettingsCornerLibraries: 'Boutons d’angle des médiathèques',
            SettingsCornerFolders: 'Boutons d’angle des dossiers',
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
            SettingsDefaultsRestored: 'Réglages recommandés rétablis. Enregistrez pour les conserver.',
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
        style.href = assetUrl('extensions/preferences.css');
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
    // Recommended - Explicit per-account starting choices; it does not set public theme variables.
    const RECOMMENDED_VALUES = Object.freeze({
        homeCarousel: true,
        homeLibraryNamesOnly: true,
        collectionFilter: true,
        hideCountIndicators: true,
        'playerControls.versions': true,
        'playerControls.episodes': true,
        'sourceSelection.mode': 'native',
        'mediaActions.thumbnails.movies': 'hide',
        'mediaActions.thumbnails.episodes': 'details',
        'mediaActions.thumbnails.series': 'hide',
        'mediaActions.thumbnails.seasons': 'hide',
        'mediaActions.thumbnails.collections': 'hide',
        'mediaActions.thumbnails.libraries': 'hide',
        'mediaActions.thumbnails.folders': 'hide',
        'mediaActions.seasonEpisodeThumbnails': 'details',
        'mediaActions.nextUpThumbnails': 'details',
        'mediaActions.resumeThumbnails.home.movies': 'native',
        'mediaActions.resumeThumbnails.home.episodes': 'native',
        'mediaActions.resumeThumbnails.elsewhere.movies': 'hide',
        'mediaActions.resumeThumbnails.elsewhere.episodes': 'hide',
        'mediaActions.cornerButtons.movies': 'native',
        'mediaActions.cornerButtons.episodes': 'native',
        'mediaActions.cornerButtons.series': 'native',
        'mediaActions.cornerButtons.seasons': 'native',
        'mediaActions.cornerButtons.collections': 'hide',
        'mediaActions.cornerButtons.libraries': 'hide',
        'mediaActions.cornerButtons.folders': 'hide',
        'mediaActions.mainButtons.collections': 'hide',
        'mediaActions.mainButtons.series': 'details',
        'mediaActions.mainButtons.seasons': 'details'
    });
    const recommendedMedia = path => RECOMMENDED_VALUES['mediaActions.' + path];
    const MODE_LABELS = {
        native: 'SettingsModeNative', details: 'SettingsModeDetails', hide: 'SettingsModeHide',
        panel: 'SettingsModePanel', dialog: 'SettingsModeDialog'
    };
    // Fields - One control each, by its path in the saved object: choices make a select, no choices a
    // switch. requires names the switch that enables a field; asset, the file it loads (Assets).
    // Defaults here are the per-account Recommended profile; the main loader's global options remain separate.
    const PREFERENCE_SECTIONS = [
        {
            title: 'SettingsTheme', fields: [
                { path: 'homeCarousel', label: 'SettingsHomeCarousel', help: 'SettingsHomeCarouselHelp', fallback: RECOMMENDED_VALUES.homeCarousel },
                {
                    path: 'homeLibraryNamesOnly', label: 'SettingsHomeLibraryNamesOnly',
                    help: 'SettingsHomeLibraryNamesOnlyHelp', fallback: RECOMMENDED_VALUES.homeLibraryNamesOnly
                },
                {
                    path: 'collectionFilter', label: 'SettingsCollectionFilter', help: 'SettingsCollectionFilterHelp',
                    fallback: RECOMMENDED_VALUES.collectionFilter
                },
                {
                    path: 'hideCountIndicators', label: 'SettingsCountIndicators', help: 'SettingsCountIndicatorsHelp',
                    fallback: RECOMMENDED_VALUES.hideCountIndicators, asset: 'countIndicators'
                }
            ]
        },
        {
            title: 'SettingsPlayerControls', help: 'SettingsPlayerControlsHelp', asset: 'playerControls', fields: [
                { path: 'playerControls.versions', label: 'SettingsVersions', fallback: RECOMMENDED_VALUES['playerControls.versions'] },
                { path: 'playerControls.episodes', label: 'SettingsEpisodes', fallback: RECOMMENDED_VALUES['playerControls.episodes'] }
            ]
        },
        {
            title: 'SettingsSourceSelection', help: 'SettingsSourceSelectionHelp', asset: 'sourceSelection', fields: [
                {
                    path: 'sourceSelection.mode', label: 'SettingsSourceMode', choices: ['native', 'panel', 'dialog'],
                    fallback: RECOMMENDED_VALUES['sourceSelection.mode']
                }
            ]
        },
        {
            title: 'SettingsMediaActions', help: 'SettingsMediaActionsHelp', asset: 'mediaActions', fields: [
                ...[
                    ['thumbnails.movies', 'SettingsThumbnailsMovies', recommendedMedia('thumbnails.movies')],
                    ['thumbnails.episodes', 'SettingsThumbnailsEpisodes', recommendedMedia('thumbnails.episodes')],
                    ['thumbnails.series', 'SettingsThumbnailsSeries', recommendedMedia('thumbnails.series')],
                    ['thumbnails.seasons', 'SettingsThumbnailsSeasons', recommendedMedia('thumbnails.seasons')],
                    ['thumbnails.collections', 'SettingsThumbnailsCollections', recommendedMedia('thumbnails.collections')],
                    ['thumbnails.libraries', 'SettingsThumbnailsLibraries', recommendedMedia('thumbnails.libraries')],
                    ['thumbnails.folders', 'SettingsThumbnailsFolders', recommendedMedia('thumbnails.folders')],
                    ['seasonEpisodeThumbnails', 'SettingsSeasonEpisodes', recommendedMedia('seasonEpisodeThumbnails')],
                    ['nextUpThumbnails', 'SettingsNextUpEpisodes', recommendedMedia('nextUpThumbnails')],
                    ['resumeThumbnails.home.movies', 'SettingsResumeHomeMovies', recommendedMedia('resumeThumbnails.home.movies')],
                    ['resumeThumbnails.home.episodes', 'SettingsResumeHomeEpisodes', recommendedMedia('resumeThumbnails.home.episodes')],
                    ['resumeThumbnails.elsewhere.movies', 'SettingsResumeElsewhereMovies', recommendedMedia('resumeThumbnails.elsewhere.movies')],
                    ['resumeThumbnails.elsewhere.episodes', 'SettingsResumeElsewhereEpisodes', recommendedMedia('resumeThumbnails.elsewhere.episodes')],
                    ['cornerButtons.movies', 'SettingsCornerMovies', recommendedMedia('cornerButtons.movies'), BUTTON_MODES],
                    ['cornerButtons.episodes', 'SettingsCornerEpisodes', recommendedMedia('cornerButtons.episodes'), BUTTON_MODES],
                    ['cornerButtons.series', 'SettingsCornerSeries', recommendedMedia('cornerButtons.series'), BUTTON_MODES],
                    ['cornerButtons.seasons', 'SettingsCornerSeasons', recommendedMedia('cornerButtons.seasons'), BUTTON_MODES],
                    ['cornerButtons.collections', 'SettingsCornerCollections', recommendedMedia('cornerButtons.collections'), BUTTON_MODES],
                    ['cornerButtons.libraries', 'SettingsCornerLibraries', recommendedMedia('cornerButtons.libraries'), BUTTON_MODES],
                    ['cornerButtons.folders', 'SettingsCornerFolders', recommendedMedia('cornerButtons.folders'), BUTTON_MODES],
                    ['mainButtons.collections', 'SettingsMainButtonCollections', recommendedMedia('mainButtons.collections')],
                    ['mainButtons.series', 'SettingsMainButtonSeries', recommendedMedia('mainButtons.series')],
                    ['mainButtons.seasons', 'SettingsMainButtonSeasons', recommendedMedia('mainButtons.seasons')]
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
    const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
    function writePath(object, path, value) {
        const parts = path.split('.'), last = parts.pop();
        parts.reduce((node, part) => node[part] ||= {}, object)[last] = value;
    }
    const PROFILE_FORMAT = 'lumaaglaass-profile', PROFILE_VERSION = 1, PROFILE_MAX_BYTES = 256 * 1024;
    const PROFILE_FIELD_PATHS = new Set(PREFERENCE_FIELDS.map(field => field.path));
    const PROFILE_FIELD_PREFIXES = new Set(PREFERENCE_FIELDS.flatMap(field => {
        const parts = field.path.split('.');
        return parts.slice(1).map((_, index) => parts.slice(0, index + 1).join('.'));
    }));
    const THEME_VARIABLES_BY_NAME = new Map(THEME_VARIABLES.map(variable => [variable.name, variable]));
    const RECOMMENDED_PROFILE_SETTINGS = {};
    for (const [path, value] of Object.entries(RECOMMENDED_VALUES)) writePath(RECOMMENDED_PROFILE_SETTINGS, path, value);
    // Normalize - Every field once: its saved value when valid, else its default. Saves made before a
    // field existed gain it; unknown entries are dropped.
    function normalizePreferences(saved) {
        const result = {};
        // Migration - Preserve the old single cornerButtons choice by applying it to each new group.
        const legacyCornerButtons = saved?.mediaActions?.cornerButtons;
        for (const field of PREFERENCE_FIELDS) {
            const isCornerButton = field.path.startsWith('mediaActions.cornerButtons.');
            const value = isCornerButton && typeof legacyCornerButtons === 'string'
                ? legacyCornerButtons
                : readPath(saved, field.path);
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
            node.src = assetUrl(asset.file);
        } else {
            node.rel = 'stylesheet';
            node.href = assetUrl(asset.file);
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
    // Apply - Main-theme preferences change in place; files load or stop;
    // theme variables apply unless the open page previews its own.
    function applyPreferences(saved) {
        activePreferences = preferencesSession ? normalizePreferences(saved) : null;
        host.applyCore(activePreferences ? {
            homeCarousel: activePreferences.homeCarousel,
            homeLibraryNamesOnly: activePreferences.homeLibraryNamesOnly,
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
    function createProfileSection(state) {
        const block = element('div', 'verticalSection verticalSection-extrabottompadding lg-preferences-section lg-profile-section');
        block.append(element('h2', 'sectionTitle', translate('SettingsProfiles')),
            element('p', 'fieldDescription lg-preferences-description', translate('SettingsProfilesHelp')));

        const row = element('div', 'lg-preference lg-profile-row');
        const label = element('label', 'lg-preference-label', translate('SettingsProfile'));
        const picker = preferenceSelect();
        picker.control.id = 'lg-profile-picker';
        picker.trigger.id = 'lg-profile-picker-trigger';
        picker.trigger.setAttribute('aria-labelledby', 'lg-profile-picker-label');
        label.id = 'lg-profile-picker-label';
        label.htmlFor = picker.trigger.id;
        const recommended = element('option', '', translate('SettingsProfileRecommended'));
        recommended.value = 'recommended';
        picker.control.append(recommended);
        picker.control.value = 'recommended';
        picker.sync();

        const actions = element('div', 'lg-profile-actions');
        const apply = element('button', 'raised emby-button', translate('SettingsProfileApply'));
        apply.type = 'button';
        actions.append(picker.shell, apply);
        row.append(label, actions);

        const transfer = element('div', 'lg-profile-transfer');
        const transferRow = element('div', 'lg-preference lg-profile-transfer-row');
        const transferLabel = element('div', 'lg-preference-label', translate('SettingsProfileFileActions'));
        const transferActions = element('div', 'lg-profile-transfer-actions');
        const importButton = element('button', 'raised emby-button', translate('SettingsProfileImport'));
        importButton.type = 'button';
        const exportButton = element('button', 'raised emby-button', translate('SettingsProfileExport'));
        exportButton.type = 'button';
        transferActions.append(importButton, exportButton);
        transferRow.append(transferLabel, transferActions);

        const urlGroup = element('div', 'lg-profile-url');
        const urlLabel = element('label', 'fieldDescription lg-profile-url-label', translate('SettingsProfileUrlLabel'));
        const urlInput = element('input', 'emby-input lg-profile-url-input');
        urlInput.id = 'lg-profile-url';
        urlInput.type = 'url';
        urlInput.placeholder = translate('SettingsProfileUrlPlaceholder');
        urlInput.autocomplete = 'url';
        urlInput.spellcheck = false;
        urlLabel.htmlFor = urlInput.id;
        const urlButton = element('button', 'raised emby-button', translate('SettingsProfileImportUrl'));
        urlButton.type = 'button';
        urlGroup.append(urlLabel, urlInput, urlButton);
        transfer.append(transferRow, urlGroup);

        const input = element('input', 'lg-profile-file');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.hidden = true;
        const status = element('p', 'fieldDescription lg-profile-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');

        Object.assign(state, { profileSelect: picker, profileApply: apply, profileImportButton: importButton,
            profileImport: input, profileExport: exportButton, profileUrlInput: urlInput, profileUrlImport: urlButton,
            profileStatus: status, importedProfile: null, profileBusy: false });
        apply.addEventListener('click', () => applySelectedProfile(state));
        importButton.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            input.value = '';
            if (file) void importProfile(state, file);
        });
        urlButton.addEventListener('click', () => void importProfileUrl(state));
        urlInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                urlButton.click();
            }
        });
        exportButton.addEventListener('click', () => exportProfile(state));
        block.append(row, transfer, status, input);
        return block;
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
            secondary: element('button', 'raised emby-button lg-preferences-secondary')
        };
        const note = asset => {
            const node = element('p', 'fieldDescription lg-preferences-note', translate('SettingsExternal'));
            node.hidden = true;
            state.notes.set(asset, node);
            return node;
        };
        fields.append(element('p', 'fieldDescription lg-preferences-intro', translate('SettingsIntro')),
            createProfileSection(state));
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
            updateProfileStatus(state);
        });
        // Theme - Every edit previews at once; Save keeps it, leaving the page restores the saved values.
        form.addEventListener('input', event => {
            const entry = state.theme.get(event.target.dataset?.lgVariable);
            if (entry) {
                if (entry.variable.type.control === 'color') entry.set = true;
                previewTheme(state);
            }
            setText(state.status, '');
            updateProfileStatus(state);
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
        updateProfileStatus(state);
    }
    function profileMatchesForm(state, profileSettings) {
        for (const [path, { field, control }] of state.controls) {
            const expected = readPath(profileSettings, path);
            if (expected === undefined) continue;
            const actual = field.choices ? control.value : control.checked;
            if (actual !== expected) return false;
        }
        for (const [name, entry] of state.theme) {
            if (hasOwn(profileSettings.theme || {}, name) && themeEntryValue(entry) !== profileSettings.theme[name]) {
                return false;
            }
        }
        return true;
    }
    function currentProfileName(state) {
        if (profileMatchesForm(state, RECOMMENDED_PROFILE_SETTINGS)) return translate('SettingsProfileRecommended');
        if (state.importedProfile && profileMatchesForm(state, state.importedProfile.settings)) return state.importedProfile.name;
        return translate('SettingsProfileCustom');
    }
    function updateProfileStatus(state) {
        if (state.profileStatus) setText(state.profileStatus, translate('SettingsProfileActive') + currentProfileName(state));
    }
    function applyProfileSettings(state, settings) {
        let skipped = 0;
        for (const [path, { field, control }] of state.controls) {
            const value = readPath(settings, path);
            if (value === undefined) continue;
            const valid = field.choices ? field.choices.includes(value) : typeof value === 'boolean';
            if (!valid) continue;
            if (control.disabled) {
                skipped++;
                continue;
            }
            if (field.choices) control.value = value;
            else control.checked = value;
        }
        let themeChanged = false;
        for (const [name, entry] of state.theme) {
            if (!hasOwn(settings.theme || {}, name)) continue;
            setThemeEntry(entry, settings.theme[name]);
            themeChanged = true;
        }
        syncPreferenceControls(state);
        if (themeChanged) previewTheme(state);
        updateProfileStatus(state);
        return skipped;
    }
    function applySelectedProfile(state) {
        if (state.fields.disabled || state.profileBusy) return;
        if (state.profileSelect.control.value === 'recommended') {
            const skipped = applyProfileSettings(state, RECOMMENDED_PROFILE_SETTINGS);
            setText(state.profileStatus, translate(skipped ? 'SettingsProfileAppliedPartial' : 'SettingsProfileApplied'));
        } else if (state.profileSelect.control.value === 'imported' && state.importedProfile) {
            const skipped = applyProfileSettings(state, state.importedProfile.settings);
            setText(state.profileStatus, translate(state.importedProfile.skipped || skipped
                ? 'SettingsProfileImportedPartial' : 'SettingsProfileImported'));
        }
    }
    function decodeProfile(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            payload.format !== PROFILE_FORMAT || payload.version !== PROFILE_VERSION ||
            !payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings)) return null;

        const settings = {}, raw = payload.settings;
        let accepted = 0, skipped = false;
        for (const field of PREFERENCE_FIELDS) {
            const value = readPath(raw, field.path);
            if (value === undefined) continue;
            const valid = field.choices ? field.choices.includes(value) : typeof value === 'boolean';
            if (valid) {
                writePath(settings, field.path, value);
                accepted++;
            } else skipped = true;
        }
        if (raw.theme !== undefined) {
            if (!raw.theme || typeof raw.theme !== 'object' || Array.isArray(raw.theme)) skipped = true;
            else for (const [name, value] of Object.entries(raw.theme)) {
                const variable = THEME_VARIABLES_BY_NAME.get(name);
                if (!variable) {
                    skipped = true;
                    continue;
                }
                if (value === '') {
                    settings.theme ||= {};
                    settings.theme[name] = '';
                    accepted++;
                } else if (typeof value === 'string' && variable.type.valid(value.trim(), variable)) {
                    settings.theme ||= {};
                    settings.theme[name] = value.trim();
                    accepted++;
                } else skipped = true;
            }
        }

        const pending = [['', raw]];
        while (pending.length) {
            const [path, value] = pending.pop();
            if (PROFILE_FIELD_PATHS.has(path)) continue;
            if (path === 'theme') {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    for (const name of Object.keys(value)) if (!THEME_VARIABLES_BY_NAME.has(name)) skipped = true;
                } else skipped = true;
            } else if ((path === '' || PROFILE_FIELD_PREFIXES.has(path)) && value &&
                typeof value === 'object' && !Array.isArray(value)) {
                for (const [key, child] of Object.entries(value)) pending.push([path ? path + '.' + key : key, child]);
            } else if (path) skipped = true;
        }
        if (!accepted) return { error: 'noSettings' };

        const safeName = typeof payload.name === 'string'
            ? payload.name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 64)
            : '';
        return {
            name: safeName || translate('SettingsProfileImportedName'),
            settings, skipped, accepted
        };
    }
    function loadImportedProfile(state, payload) {
        if (preferencesPage !== state || state.fields.disabled) return;
        const profile = decodeProfile(payload);
        if (!profile) {
            setText(state.profileStatus, translate('SettingsProfileInvalid'));
            return;
        }
        if (profile.error === 'noSettings') {
            setText(state.profileStatus, translate('SettingsProfileNoSettings'));
            return;
        }
        state.importedProfile = profile;
        let option = state.profileSelect.control.querySelector('option[value="imported"]');
        if (!option) {
            option = element('option');
            option.value = 'imported';
            state.profileSelect.control.append(option);
        }
        setText(option, profile.name);
        state.profileSelect.control.value = 'imported';
        state.profileSelect.sync();
        const skipped = applyProfileSettings(state, profile.settings);
        setText(state.profileStatus, translate(profile.skipped || skipped ? 'SettingsProfileImportedPartial' : 'SettingsProfileImported'));
    }
    async function importProfile(state, file) {
        if (state.fields.disabled || state.profileBusy) return;
        if (file.size > PROFILE_MAX_BYTES) {
            setText(state.profileStatus, translate('SettingsProfileTooLarge'));
            return;
        }
        let payload;
        try {
            payload = JSON.parse(await file.text());
        } catch {
            setText(state.profileStatus, translate('SettingsProfileReadError'));
            return;
        }
        loadImportedProfile(state, payload);
    }
    function profileImportError(code) {
        const error = new Error(code);
        error.code = code;
        return error;
    }
    async function readProfileResponse(response) {
        const contentLength = response.headers.get('content-length');
        if (contentLength && Number(contentLength) > PROFILE_MAX_BYTES) throw profileImportError('tooLarge');

        const reader = response.body?.getReader?.();
        if (!reader) {
            const text = await response.text();
            if (new TextEncoder().encode(text).byteLength > PROFILE_MAX_BYTES) throw profileImportError('tooLarge');
            return text;
        }

        const chunks = [];
        let size = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > PROFILE_MAX_BYTES) {
                    void reader.cancel().catch(() => {});
                    throw profileImportError('tooLarge');
                }
                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    async function importProfileUrl(state) {
        if (state.fields.disabled || state.profileBusy) return;
        const value = state.profileUrlInput.value.trim();
        if (!value) {
            setText(state.profileStatus, translate('SettingsProfileUrlRequired'));
            state.profileUrlInput.focus();
            return;
        }

        let url;
        try {
            url = new URL(value);
        } catch {
            setText(state.profileStatus, translate('SettingsProfileUrlInvalid'));
            state.profileUrlInput.focus();
            return;
        }
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            setText(state.profileStatus, translate('SettingsProfileUrlInvalid'));
            state.profileUrlInput.focus();
            return;
        }
        url.hash = '';

        state.profileBusy = true;
        const busyControls = [state.profileApply, state.profileImportButton, state.profileImport,
            state.profileExport, state.profileUrlInput, state.profileUrlImport, state.submit].filter(Boolean);
        const priorDisabled = busyControls.map(control => control.disabled);
        busyControls.forEach(control => { control.disabled = true; });
        setText(state.profileStatus, translate('SettingsProfileUrlLoading'));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(url.href, {
                method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'follow',
                cache: 'no-store', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            if (!response.ok) throw new Error('request-failed');
            const finalUrl = new URL(response.url || url.href, url.href);
            if (!['http:', 'https:'].includes(finalUrl.protocol)) throw new Error('invalid-redirect');
            const payload = JSON.parse(await readProfileResponse(response));
            loadImportedProfile(state, payload);
        } catch (error) {
            setText(state.profileStatus, translate(error?.code === 'tooLarge'
                ? 'SettingsProfileTooLarge' : 'SettingsProfileUrlReadError'));
        } finally {
            clearTimeout(timeout);
            state.profileBusy = false;
            busyControls.forEach((control, index) => { control.disabled = priorDisabled[index]; });
        }
    }
    function collectPreferences(state) {
        const theme = collectTheme(state), saved = { theme: theme.values };
        for (const [path, { field, control }] of state.controls) {
            writePath(saved, path, field.choices ? control.value : control.checked);
        }
        return { values: normalizePreferences(saved), invalid: theme.invalid };
    }
    function exportProfile(state) {
        if (state.fields.disabled || state.profileBusy) return;
        const { values, invalid } = collectPreferences(state);
        if (invalid.length) {
            setText(state.profileStatus, translate('SettingsInvalid'));
            invalid[0].focus();
            return;
        }
        values.theme = Object.fromEntries(THEME_VARIABLES.map(({ name }) => [name, values.theme[name] || '']));
        const name = currentProfileName(state);
        const profile = { format: PROFILE_FORMAT, version: PROFILE_VERSION, name, settings: values };
        let url = '';
        try {
            const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
            url = URL.createObjectURL(blob);
            const anchor = element('a');
            const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
                .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
            anchor.href = url;
            anchor.download = 'lumaaglaass-' + slug + '.json';
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            setText(state.profileStatus, translate('SettingsProfileExported'));
        } catch {
            if (url) URL.revokeObjectURL(url);
            setText(state.profileStatus, translate('SettingsProfileExportError'));
        }
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
                updateProfileStatus(state);
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
            updateProfileStatus(state);
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
        if (state.fields.disabled || !state.dto || state.profileBusy) return;
        const { values, invalid } = collectPreferences(state);
        if (invalid.length) {
            setText(state.status, translate('SettingsInvalid'));
            invalid[0].focus();
            return;
        }
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
