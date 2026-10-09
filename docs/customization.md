# Customization

The optional theme settings page chooses every feature and visual value for one
account. The existing manual loaders remain available for a fixed configuration
that applies to every account.

[Back to installation](../README.md#installation)

## Before you start

1. Install the main theme using the [installation instructions](../README.md#installation).
2. Back up your current **Polyfin → Settings → Web player → Custom CSS** and
   **Custom JavaScript**.
3. Either enable the settings page, or add the manual option or extension loader
   described below. Keep the main theme installed.
4. Save and fully reload the client after every change.

The theme targets Jellyfin Web 12.1 (tested on Polyfin and Remux). Earlier versions
are not supported. Keep the **Dark** base theme selected.

## Choose an option

Each script lists its options at the top. Set them in its loader, before the
script loads (or before a pasted copy), then save and fully reload. CSS overrides
go after the main theme import.

| Option | What it does | Where to add it |
| --- | --- | --- |
| [Settings page](#settings-page) | Choose theme appearance and optional features for this account | Enable `preferences: true` in main Custom JavaScript |
| [Home carousel](#home-carousel) | Hide the home banner while keeping a still media background | Main Custom JavaScript options |
| [Home library titles](#home-library-titles) | Show only the library name on Recently Added rows | Main Custom JavaScript options |
| [Collection filter](#collection-filter) | Show all items, movies only, or series only; enabled by default | Main Custom JavaScript options |
| [Media actions](#media-actions) | Configure native, information or hidden shortcuts by media type and context | Custom JavaScript |
| [Player controls](#player-controls) | Enable version switching, episode browsing, or both | Custom JavaScript |
| [Source selection](#source-selection) | Choose native controls, an inline panel or a playback dialog | Custom JavaScript |
| [Hide count indicators](#hide-count-indicators) | Hide numeric badges on cards and lists | Custom CSS |
| [Theme variables](#theme-variables) | Adjust the accent, glass, corners, spacing, text and timing | Custom CSS |

**Source selection provides one mode at a time: native, panel or dialog.**
The collection filter, hidden count badges, media actions and player controls
can be used with any source-selection mode.

## Settings page

`preferences` defaults to `false`. Add `preferences: true` to
`window.LumaaGlaassOptions` in the main loader to opt in, then open
**Settings → LumaaGlaass**. The page saves choices in this account's Jellyfin
display preferences, so they follow the account on every device. The browser
cache only applies the last saved choice while the server answer is loading.

Its initial values match the extension defaults: carousel and collection filter
on, library-only recent titles off, count indicators shown, both player controls
on, source selection native, and every media action native.

The page controls the home carousel, home library titles, collection filter,
count indicators, player controls, source selection, media actions (including
**À suivre**) and the public theme variables. Theme variables preview immediately; **Save** applies and
stores every setting for the account. The reset beside one theme variable clears
only that variable's saved value. **Reset to defaults** restores the whole form;
use **Save** to keep those defaults for the account.

The settings page offers all three source modes: **Native**, **Panel** and
**Dialog**.

Use this page instead of individual extension loaders. Player controls activate
when **Version** or **Episodes** is enabled; media actions activate automatically
when one of their menus changes from **Native**. If an old loader or count
indicator import remains in the server configuration, the matching control is
locked so two copies can never manage the same feature. Remove that legacy loader
to make the choice available per account. Leaving `preferences` out preserves
the existing manual configuration exactly.

Administrators can open another user's preferences from that user's settings.
Jellyfin remains responsible for enforcing who may update each account.

## Home carousel

The main loader in the [installation guide](../README.md#installation) includes
`window.LumaaGlaassOptions` with `homeCarousel: true`, the default.
To hide the carousel, change that value to `false` directly in the loader,
then save and fully reload. Do not add a second loader or configuration block.

If you paste the complete main script instead of using the loader, place this
configuration **before the pasted script**:

```javascript
window.LumaaGlaassOptions = {
    ...window.LumaaGlaassOptions,
    homeCarousel: false
};
```

Set `homeCarousel: true` or remove this property to restore the carousel.
Library and collection cards are unchanged.

The carousel and the still background pick up to eight movies and series at
random across your libraries, each library getting a share. A title found in
several libraries, or in both HD and 4K, appears once.

Home keeps a successfully loaded backdrop from the same movie/series selection,
without rotation. A full reload requests a new random selection. Up to four
images are tried; if none loads, the last valid background from the same
session/account is retained when available, otherwise the neutral background stays.

## Home library titles

`homeLibraryNamesOnly` defaults to `false`. Set it to `true` in the main loader
to replace each home-page Recently Added title with only its library's existing
name, including any icon already used by the library.

```javascript
window.LumaaGlaassOptions = {
    ...window.LumaaGlaassOptions,
    homeLibraryNamesOnly: true
};
```

The theme identifies these rows from their library link, not from translated
text. It therefore works with every interface language and does not change
library, search, detail or other page titles. Set the option back to `false` or
remove it to restore Jellyfin's native row titles.

## Collection filter

The main theme shows **All / Movies / Shows** above collections containing both
movies and series. It is enabled by default.

The main loader defines `window.LumaaGlaassOptions`. Set `collectionFilter: false`
there to disable the filter; save and fully reload. Missing or invalid values
default to `true`. For a pasted main script, put the configuration before the script:

```javascript
window.LumaaGlaassOptions = {
    ...window.LumaaGlaassOptions,
    collectionFilter: false
};
```

- Filters the native cards and section headings without changing their order.
- Does not alter collection membership, watch history, or the main Play/Shuffle actions.
- Shows other media types under **All** only.
- Resets to **All** when switching collections; single-type collections have no filter.
- Supports keyboard navigation, right-to-left layouts, and pointer feedback.
- Uses Jellyfin's own translations, with English as a fallback.

## Media actions

One optional script controls thumbnail shortcuts and selected details-page buttons.
Source selection and player controls remain independent.

### Install and configure

Paste this complete loader into **Custom JavaScript** after the main theme loader.
The values below are a complete starting configuration. Edit modes here, save and
fully reload the client; there is no need to edit the downloaded script.

```javascript
(() => {
    window.LumaaGlaassMediaActionsOptions = {
        thumbnails: {
            movies: 'native',
            episodes: 'native',
            series: 'native',
            seasons: 'native',
            collections: 'native',
            libraries: 'native',
            folders: 'native'
        },
        seasonEpisodeThumbnails: 'native',
        resumeThumbnails: {
            home: { movies: 'native', episodes: 'native' },
            elsewhere: { movies: 'native', episodes: 'native' }
        },
        nextUpThumbnails: 'native',
        cornerButtons: 'native',
        resumeButtons: { movies: 'native', episodes: 'native' },
        mainButtons: {
            collections: 'native',
            series: 'native',
            seasons: 'native'
        }
    };

    const id = 'lg-media-actions-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/media-actions.js';
    script.onerror = () => {
        script.remove();
        console.error('LumaaGlaass media actions could not be loaded.');
    };
    document.head.appendChild(script);
})();
```

Alternatively, define the same configuration object and paste the complete
[media-actions.js](../assets/extensions/media-actions.js) below it. Use one method
only. Pasted copies require manual updates. To remove the feature, remove its
configuration and loader or pasted script, then reload.

### Modes

| Mode | Thumbnail Play shortcut | Collection, series or season main button |
| --- | --- | --- |
| `native` | Keep native controls and actions | Keep the original button |
| `details` | Replace an existing Play shortcut with an information icon opening its details | Show Info and navigate to the selected content's details |
| `hide` | Hide the central Play shortcut, preserving image links, progress, badges and corner actions | Hide the main Play/Info button |

The information mode does not create buttons where none existed. Favorites, watched
and menu controls stay unchanged in information mode. Thumbnail hide mode removes
only the central Play shortcut; clicks on the image itself retain their native action.

`cornerButtons` controls those three corner buttons (watched, favorite, more) on every
thumbnail at once, independently of the Play shortcut: `native` preserves the
server's controls even when the Play shortcut is hidden; `hide` removes them
everywhere. Polyfin and other servers running the unmodified Jellyfin Web 12.1
interface show them; Remux already hides them in its own stylesheet.

### Settings and priority

| Setting | Scope |
| --- | --- |
| `thumbnails.movies` | Movie thumbnails |
| `thumbnails.episodes` | Episode thumbnails outside the higher-priority cases below |
| `thumbnails.series` | Series thumbnails |
| `thumbnails.seasons` | Season thumbnails |
| `thumbnails.collections` | BoxSet collection thumbnails |
| `thumbnails.libraries` | CollectionFolder and UserView library thumbnails |
| `thumbnails.folders` | Folder thumbnails |
| `seasonEpisodeThumbnails` | Episode thumbnails in a details page's episode list |
| `resumeThumbnails.home.movies/episodes` | Started movie/episode thumbnails on the home page |
| `resumeThumbnails.elsewhere.movies/episodes` | Started movie/episode thumbnails on other pages, except episodes in Next Up |
| `nextUpThumbnails` | Episode thumbnails on the Next Up page; omitted, it inherits `thumbnails.episodes` |
| `cornerButtons` | Watched, favorite and more buttons in every thumbnail corner (`native` or `hide`) |
| `resumeButtons.movies/episodes` | Resume button on a started movie/episode details page |
| `mainButtons.collections/series/seasons` | Main button on the corresponding container details page |

Types come from Jellyfin metadata, never from item names. Films inside a collection
follow movie rules, not collection rules. On the Next Up page, `nextUpThumbnails`
controls every episode thumbnail, including episodes with saved playback progress;
it takes priority over `resumeThumbnails.elsewhere.episodes` there. On other pages,
`resumeThumbnails` applies to saved positive playback positions and overrides
`seasonEpisodeThumbnails` and `thumbnails`. For episodes without saved progress,
`seasonEpisodeThumbnails` overrides `thumbnails.episodes` in a details-page episode
list. No setting deletes or rewrites saved playback progress.

`resumeButtons` accepts only `native` or `hide`: opening details when already
on the same page would be redundant. It does not hide the separate restart button.
Unstarted movie/episode main buttons and player controls remain unchanged.
Resumable series, seasons and collections retain native controls.

Missing options use the defaults shown above. Invalid modes fall back to native
behavior. For example, set `thumbnails.collections: 'native'` to preserve collection
thumbnail controls, or `resumeThumbnails.elsewhere.episodes: 'details'` to open details
from episode resume shortcuts on other pages outside Next Up. Set `nextUpThumbnails: 'native'`
to preserve native shortcuts in Next Up while keeping another episode rule elsewhere.

### Limitations

Info on a series uses Next Up; a season stays within its own episodes, selecting
the first unplayed episode or the first episode if all are watched. A collection
opens the first item in native collection playback order. Metadata failures do
not hide native controls; failed target lookup displays a translated status.

Labels use Jellyfin's own translations (its Info button label). If they are
unavailable, information replacements remain native. Music, live TV, chapters,
playlist items and player controls are excluded.

## Player controls

One optional extension provides both player controls. Enable either feature or both.
Set options before loading; missing or invalid values default to `true`.
Save and fully reload after changing options. Both disabled means no player polling.

```javascript
(() => {
    window.LumaaGlaassPlayerControlsOptions = {
        versions: true,
        episodes: true
    };
    const id = 'lg-player-controls-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/player-controls.js';
    script.onerror = () => {
        script.remove();
        console.error('LumaaGlaass player controls could not be loaded.');
    };
    document.head.appendChild(script);
})();
```

Keep the main theme installed. Alternatively, define the same configuration and
paste [player-controls.js](../assets/extensions/player-controls.js) below it.
Use one method only. Remove the loader or pasted code and reload to uninstall.
When both controls are enabled, their order is Episodes, Versions, Settings.

### Version switcher

Enabled by `versions`. Adds a **Version** button beside the settings button in the
integrated player. Choose another version to restart playback at the current
timestamp. A loading delay is expected; this is not a seamless stream switch.

- Supports seekable movies and episodes in the local integrated player, not casting or external players.
- Keeps the current queue and requests the same playback position.
- Matches audio and subtitle languages when the new source offers them; otherwise its defaults apply. Subtitles set to Off stay off.
- Uses Jellyfin's selected interface language and shared theme styling.
- Scrolling inside the dialog does not change player volume.

Different cuts of a movie can show different scenes at the same timestamp.
Switching to a version shorter than the current position is rejected. This option
uses internal Jellyfin modules; future client changes may require an update. If
switching remains pending, close the window and reload the client if needed.
Closing does not cancel a playback request already sent to Jellyfin.

### Episode switcher

Enabled by `episodes`. Adds an **Episodes** button for series episodes; films do
not show it. It opens the current season, marks the current episode and allows
selecting another season.

- Each entry shows its episode thumbnail when available, with a neutral placeholder
  otherwise. Images load lazily.
- Seasons use the shared themed dropdown. A single season is displayed as plain text;
  with several, Previous/Next arrows flank the dropdown and stop at the first and last season.
- Selecting a season only updates the list, not playback. Episode lists are paginated
  when fetched and scroll independently within a bounded height.
- Choosing an episode plays the selected season queue from that episode, using its
  saved progress when unfinished. Already watched episodes start from the beginning.
  Source and track indices are not copied from the previous episode.

A loading delay is expected; this is not a seamless switch. Closing the dialog does
not cancel a playback request already submitted. It supports seekable episodes in the
local integrated player, not casting or external players, and relies on internal
Jellyfin modules; future client changes may require an update.

## Source selection

One optional extension provides three mutually exclusive modes. The main theme
remains required; the selected mode adapts to desktop, tablet and mobile.

| Mode | Behavior |
| --- | --- |
| `native` | Keep Jellyfin's original version and track controls (default) |
| `panel` | Show a source list on the details page |
| `dialog` | Choose a version and available tracks after pressing Play or Resume |

### Install and choose a mode

Add this loader to **Custom JavaScript**, keeping the main theme:

```javascript
(() => {
    window.LumaaGlaassSourceSelectionOptions = {
        mode: 'native' // Change to 'panel' or 'dialog', save and fully reload.
    };
    const id = 'lg-source-selection-script';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/source-selection.js';
    script.onerror = () => {
        script.remove();
        console.error('LumaaGlaass source selection could not be loaded.');
    };
    document.head.appendChild(script);
})();
```

Change only `mode` in this loader to select the interface. For example,
`mode: 'panel'` enables the panel. Missing or invalid modes use `native`.
Changing the object after loading does not switch modes until a full reload.

Alternatively, define the configuration object and paste the complete
[source-selection.js](../assets/extensions/source-selection.js) below it.
Use one installation method only; pasted copies need manual updates.

### Panel mode

- Selecting a version updates the native selector without starting playback.
- Audio, subtitle and video controls remain native. Use Play to start.
- The panel appears only when the details page offers multiple versions.
- On desktop it appears on the right, with up to six sources and internal scrolling,
  limited by the Studio row or remaining metadata when available.
- On mobile and tablet it sits above the audio/video controls, with space for two
  complete sources when available. A chevron indicates more sources below.

### Dialog mode

Play or Resume opens the dialog on supported media details pages. Choose a version,
adjust available audio/subtitle tracks, then confirm playback. Selecting a source
alone never starts playback. The original Play/Resume action is preserved.
Closing without confirmation does not start playback; chosen settings remain on
the native form. The native track block, including its video summary, is hidden
while this mode is active.

Native labels, typography and controls are reused; Close and Play have English
fallbacks if native translations are unavailable. Unsupported browsers or pages
without a usable native version selector retain native behavior. Home banners,
trailers and shuffle are not intercepted.

### Limitations

Player controls act during playback and work with all three modes. No mode
manufactures audio/subtitle tracks missing from the server. Native dropdown rendering
can vary by browser. To return to native controls, set `mode: 'native'` or remove
this extension and reload.

## Hide count indicators

This optional stylesheet hides Jellyfin's numeric count badges. They remain
visible unless you enable it. Prefer **Settings → LumaaGlaass** for a per-account
choice; the import below remains for a fixed server-wide choice.

**Hidden:** unplayed/unwatched item counts, including episodes on series and season
cards; item-count badges on container cards; and their `99+` variants.

**Unchanged:** watched checkmarks, favorites, playback progress, ratings, years,
media-source indicators, and counts written as ordinary text.

To enable it, use these two lines at the top of **Custom CSS**:

```css
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/lumaaglaass.css');
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/hide-count-indicators.css');
```

If the theme import is already present, add only the second line, before any
other CSS rules. No JavaScript change is needed.

Alternatively, copy [hide-count-indicators.css](../assets/extensions/hide-count-indicators.css)
after your existing CSS. Its complete rule is:

```css
.countIndicator {
    display: none !important;
}
```

Save and fully reload the client. To restore the badges, remove the optional
import or pasted rule and reload again. Only elements using Jellyfin's
`countIndicator` class are hidden; no counts or watch history are deleted.

## Theme variables

Every color, glass effect, corner, spacing and timing of the theme comes from a
small set of CSS variables. Change one, and every control that uses it follows:
the theme writes no second copy of these values.

Paste an override block at the **end of Custom CSS**, after all imports and any
pasted theme styles, and keep only the lines you change:

```css
html:root {
    --lg-color-accent: #4f8cff;
    --lg-radius-scale: 0.5;
}
```

### Quick recipes

| Goal | Paste inside `html:root { … }` |
| --- | --- |
| Colored accent (Play, checkboxes, sliders, progress, scrollbars) | `--lg-color-accent: #4f8cff;` `--lg-color-text-on-primary: #ffffff;` |
| Square corners everywhere | `--lg-radius-scale: 0;` |
| Softer or rounder corners | `--lg-radius-scale: 0.5;` or `--lg-radius-scale: 1.5;` |
| More opaque glass | `--lg-surface: rgba(30, 30, 32, 0.7);` |
| Lighter blur, or none | `--lg-blur-control: 8px;` `--lg-blur-panel: 12px;` (or `0px` for both) |
| Snappier or calmer motion | `--lg-duration: 0.12s;` `--lg-duration-slow: 0.3s;` (double them for calmer) |
| Tighter page layout | `--lg-space-gutter: 16px;` `--lg-space-header-gap: 20px;` |
| Another font | `--lg-font: "Inter", sans-serif;` (load the font yourself, for example with an `@import` before the theme) |

### Colors

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-color-accent` | `#f5f5f7` | The one accent: Play and submit actions, the active tab, checked checkboxes, switches, sliders, progress bars, scrollbars and MUI tints. Every translucent variant derives from it |
| `--lg-color-text-on-primary` | `#151517` | Text on the accent; switch to white with a dark accent |
| `--lg-surface-primary-hover` | `#fff` | Primary actions under the pointer |
| `--lg-color-text` / `--lg-color-text-secondary` | `#f5f5f7` / `rgba(245, 245, 247, 0.72)` | Text on glass, then metadata and helper text; keep the second at least `0.65` opaque |
| `--lg-color-focus` | `#f5f5f7` | Keyboard focus ring of every control |
| `--lg-color-background` | `#25272c` | Page background behind the artwork |
| `--lg-color-panel` | `#353840` | Home carousel panel shown while artwork loads |

### Glass and depth

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-surface` | `rgba(30, 30, 32, 0.4)` | Glass tint of every panel and control; hover and open states derive from it |
| `--lg-surface-hover` / `--lg-surface-open` | 8% / 14% white mixed in | Hover and open/pressed glass; keep open above hover |
| `--lg-surface-row-hover` / `--lg-surface-row-selected` | white `0.08` / `0.12` | Hover and selection of list and menu rows |
| `--lg-surface-artwork-veil` | `rgba(30, 30, 32, 0.6)` | Darkening behind actions drawn over posters |
| `--lg-edge` / `--lg-edge-open` | white `0.12` / `0.24` | Borders and dividers, then the edge of open menus and focused fields |
| `--lg-blur-control` / `--lg-blur-panel` | `18px` / `32px` | Blur behind buttons and fields, then behind cards, panels, menus and tooltips |
| `--lg-blur-backdrop` | `12px` | Blur of the background artwork |
| `--lg-shadow-panel` / `--lg-shadow-card` | — | Depth of floating panels (menus, dialogs), then of cards on the page; lighten both together |

### Shape

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-radius-scale` | `1` | Multiplies every corner below and every other corner of the theme: `0` squares them all, `1.5` rounds them more. Circles stay round |
| `--lg-radius-pill` | `999px` | Buttons, tabs, chips and toolbar groups |
| `--lg-radius` | `14px` | Fields, selects, cards and posters |
| `--lg-radius-panel` / `--lg-radius-panel-compact` | `24px` / `18px` | Large panels (page card, home carousel, details, dialogs, player bars), then the same panels on phones; images inside them follow, 6px softer |
| `--lg-radius-popup` | `16px` | Menus and dropdown panels |
| `--lg-radius-option` | `10px` | Rows inside menus and dropdowns |
| `--lg-radius-drawer` / `--lg-radius-drawer-option` | `32px` / `12px` | Side navigation drawer, then its rows |
| `--lg-radius-small` | `8px` | Checkboxes, tooltips and small thumbnails |

Each radius default is written as a multiple of `--lg-radius-scale`. A value you
set directly, such as `--lg-radius: 6px;`, replaces that role at every scale.

### Spacing and size

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-space-gutter` | `clamp(16px, 3.4vw, 64px)` | Side inset of every page |
| `--lg-space-header-gap` | `32px` | Distance between the navigation bar and the first block of every page |
| `--lg-space-button-group` | `8px` | Space between neighbouring buttons |
| `--lg-space-option` / `--lg-space-popup` | `2px` / `6px` | Space between menu rows, then inside menus |
| `--lg-space-list-option` | `8px` | Space between source, version and episode choices (extensions) |
| `--lg-size-action` / `--lg-size-option` | `44px` / `44px` | Round actions, then menu rows; keep at least `44px` for touch |
| `--lg-page-card-height` | `304px` | Height of the library and collection page card |
| `--lg-cast-width` | `clamp(112px, 10vw, 180px)` | Width of cast cards on details pages |

### Text

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-font` | system font | Font of the whole interface |
| `--lg-font-section-title` | `clamp(21px, 2vw, 28px)` | Row titles on home, libraries and details |
| `--lg-page-card-title-size` / `--lg-page-card-title-weight` | `clamp(30px, 3.5vw, 56px)` / `600` | Title of the library and collection page card |

### Motion

| Variable | Default | Effect |
| --- | --- | --- |
| `--lg-duration` | `0.2s` | Hover, focus and open feedback of every control |
| `--lg-duration-slow` | `0.5s` | Larger movements: card focus zoom, carousel crossfade, favorite pop |
| `--lg-ease` | smooth deceleration | Easing of every transition |

Reduced-motion preferences remove these animations whatever their values.

### Internal variables

Variables not listed above are internal: the accent channels
(`--lg-color-accent-rgb`), the state hooks (`--lg-state-*`, overridden by the
accessibility modes), `--lg-focus-ring`, `--lg-motion`, `--lg-select-arrow` and the
values the script writes (`--lg-header-bottom`, `--lg-content-top`,
`--lg-scrollbar-width`, `--lg-library-controls-*`…) with `--lg-page-start`, derived
from them. Overriding them can break states or layout.

### Accessibility and design roles

Accessibility preferences change these same variables: reduced transparency, more
contrast and forced colors make `--lg-surface` opaque and the glass blurs `0px`,
reduced transparency also replaces the background artwork with the plain page color,
and more contrast brightens `--lg-edge` and `--lg-edge-open`. An override written after the import applies in
those modes too; wrap it in `@media (prefers-reduced-transparency: no-preference)`
to keep the accessible values. Check text contrast against bright and dark artwork
after changing colors or opacity. Native dropdown styling depends on browser
support; some browsers keep their system option menus.

The design roles are intentional: Play is a filled pill, secondary actions are
glass circles, navigation uses pills/tabs, and menus use selectable rows sharing
one muted selected surface, without a redundant checkmark. Keyboard focus is a
separate outline, and selection stays visible during hover.

To undo these adjustments, remove the override block and reload. Do not edit
the CDN files or replace the whole theme just to change these values.

## Copying the code

- CSS belongs in **Custom CSS**. All `@import` lines must come before ordinary CSS rules.
- JavaScript belongs in **Custom JavaScript**, without `<script>` tags.
- Keep the main theme loader and add the loader for each option you want.
- For each file, use either its loader/import or its full contents, never both.
- No download, build step or plugin is needed for these options.

## Updating and troubleshooting

- **An option does not appear:** save and fully reload first. Confirm that its code
  is in the correct field and that the base theme is still installed.
- **No source panel:** set source selection to `panel` and reload. The panel appears
  only when the native details page offers multiple versions.
- **No collection filter:** it appears only in collections containing both movies
  and series.
- **No audio or subtitle choices:** the dialog mirrors the options the server
  exposes for the selected version. It does not create missing tracks.
- **An old appearance remains:** remove duplicate loaders and personal overrides
  that no longer apply. On desktop, try **Ctrl+F5**. jsDelivr caching may still
  delay updates.
- **Returning to the default interface:** remove only the optional loader, import,
  or pasted code, then reload. Keep `lumaaglaass.css` and `lumaaglaass.js`.

The examples use `@main` to follow the current branch. For a fixed installation,
use the same published commit SHA or release tag in the main theme and optional
file URLs. The chosen revision must contain every file you use.
