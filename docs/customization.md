# Customization

Choose only the options you need. The base theme works without any of them.

[Back to installation](../README.md#installation)

## Before you start

1. Install the main theme using the [installation instructions](../README.md#installation).
2. Back up your current **Remux > Branding > Custom CSS** and **Custom JS**.
3. Add the option in the field shown below. Keep the main theme installed.
4. Save and fully reload the client after every change.

The theme has been tested only on Remux using Jellyfin Web 10.11.11.
Keep the **Dark** base theme selected.

## Choose an option

| Option | What it does | Where to add it |
| --- | --- | --- |
| [Source selection](#source-selection) | Choose native controls, an inline panel or a playback dialog | Custom JS |
| [In-player version switcher](#in-player-version-switcher) | Change versions during playback and resume at the current timestamp | Custom JS |
| [Media actions](#media-actions) | Configure native, information or hidden shortcuts by media type and context | Custom JS |
| [Filter mixed collections](#filter-mixed-collections) | Show all items, movies only, or series only | Custom JS |
| [Hide count indicators](#hide-count-indicators) | Hide numeric badges on cards and lists | Custom CSS |
| [Visual adjustments](#visual-adjustments) | Adjust shared panel and selection colors | Custom CSS |

**Source selection provides one mode at a time: native, panel or dialog.**
The collection filter, hidden count badges, media actions and in-player version
switcher can be used with any mode or independently.

## Media actions

One optional script controls thumbnail shortcuts and selected details-page buttons.
It replaces details-first navigation and image button hiding. Remove their loaders
or pasted scripts before installing this option. Keep the main theme and unrelated
extensions. Source selection and the in-player version switcher remain
independent.

### Install and configure

Paste this complete loader into **Remux > Branding > Custom JS** after the main
theme loader. The values below are the defaults. Edit modes here, save and fully
reload Remux; there is no need to edit the downloaded script.

```javascript
(() => {
  window.LumaaGlaassMediaActionsOptions = {
    catalog: {
      movies: 'hide',
      episodes: 'hide',
      series: 'hide',
      seasons: 'hide',
      collections: 'hide',
      libraries: 'hide',
      folders: 'hide'
    },
    seasonEpisodeImages: 'details',
    resumeImages: {
      home: { movies: 'native', episodes: 'native' },
      elsewhere: { movies: 'hide', episodes: 'hide' }
    },
    resumeDetailButtons: { movies: 'native', episodes: 'native' },
    detailPages: {
      collections: 'hide',
      series: 'details',
      seasons: 'details'
    }
  };

  const id = 'lumaaglaass-media-actions-script';
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

| Mode | Image shortcuts | Collection, series or season main button |
| --- | --- | --- |
| `native` | Keep native controls and actions | Keep the original button |
| `details` | Replace an existing Play shortcut with an information icon opening its details | Show Open and navigate to the selected content's details |
| `hide` | Hide overlay controls, preserving image links, progress and badges | Hide the main Play/Open button |

The information mode does not create buttons where none existed. Favorites, watched
and menu controls stay unchanged in information mode; image hide mode hides those
overlay controls too. Clicks on the image itself retain their native action.

### Settings and priority

| Setting | Scope |
| --- | --- |
| `catalog.movies` | Movie thumbnails |
| `catalog.episodes` | Episode thumbnails outside the higher-priority cases below |
| `catalog.series` | Series thumbnails |
| `catalog.seasons` | Season thumbnails |
| `catalog.collections` | BoxSet collection thumbnails |
| `catalog.libraries` | CollectionFolder and UserView library thumbnails |
| `catalog.folders` | Folder thumbnails |
| `seasonEpisodeImages` | Episode images in a details page's child list |
| `resumeImages.home.movies/episodes` | Started movie/episode thumbnails on the home page |
| `resumeImages.elsewhere.movies/episodes` | Started movie/episode thumbnails on other pages |
| `resumeDetailButtons.movies/episodes` | Resume button on a started movie/episode details page |
| `detailPages.collections/series/seasons` | Main button on the corresponding container details page |

Types are determined from Jellyfin metadata, never names such as Netflix or
Populaire. Films inside a collection follow movie rules, not collection rules.
Home detection uses the home route and home page container, not translated headings.
Resume image rules apply to saved positive playback positions and override both
season episode image and catalog rules. Season episode image rules override catalog
episode rules. No setting deletes or rewrites saved playback progress.

`resumeDetailButtons` accepts only `native` or `hide`: opening details when already
on the same page would be redundant. It does not hide the separate restart button.
Unstarted movie/episode main buttons and player controls remain unchanged.
Resumable series, seasons and collections retain native controls.

Missing options use the defaults shown above. Invalid modes fall back to native
behavior. For example, set `catalog.collections: 'native'` to preserve collection
image controls, or `resumeImages.elsewhere.episodes: 'details'` to open details
from episode resume shortcuts outside the home page.

### Compatibility and limitations

Open on a series uses Next Up; a season stays within its own episodes, selecting
the first unplayed episode or the first episode if all are watched. A collection
opens the first item in native collection playback order. Metadata failures do
not hide native controls; failed target lookup displays a translated status.

Labels use Jellyfin's native translator. If translation is unavailable, information
replacements remain native. Music, live TV, chapters, playlist items and player
controls are excluded. Only Remux using Jellyfin Web 10.11.11 has been validated.

Do not also load `details-first.js` or `hide-image-buttons.js`. Those retired
installation URLs are replaced by this single option. Their settings objects are
not automatically migrated: use the explicit configuration above. The new script
stops already-running legacy instances when loaded, but removing their loaders is
still necessary to avoid asynchronous reactivation.

## In-player version switcher

Adds a **Version** button beside the settings button in the integrated player.
Choose another version to restart playback at the current timestamp. A loading
delay is expected; this is not a seamless stream switch.

- Supports seekable movies and episodes in the local integrated player, not casting or external players.
- Keeps the current queue and requests the same playback position.
- Matches audio and subtitle languages when the new source offers them; otherwise its defaults apply. Subtitles set to Off stay off.
- Uses Jellyfin's selected interface language and shared theme styling.
- Scrolling inside the dialog does not change player volume.

Different cuts of a movie can show different scenes at the same timestamp.
Switching to a version shorter than the current position is rejected. This option
uses internal Jellyfin modules and has only been tested on the Remux setup noted
above; future client changes may require an update. If switching remains pending,
close the window and reload the client if needed. Closing does not cancel a
playback request already sent to Jellyfin.

Add this loader to **Custom JS**, keeping the main theme loader:

```javascript
(() => {
  const id = 'lumaaglaass-player-version-switcher-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/player-version-switcher.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass player version switcher could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [player-version-switcher.js](../assets/extensions/player-version-switcher.js)
after the main script. Use only one method and remove the local prototype first.
Styles are included. To remove the option, remove its loader or pasted script and reload.

## Copying the code

- CSS belongs in **Custom CSS**. All `@import` lines must come before ordinary CSS rules.
- JavaScript belongs in **Custom JS**, without `<script>` tags.
- Keep the main theme loader and add the loader for each option you want.
- For each file, use either its loader/import or its full contents, never both.
- Remove old prototypes of the same feature before enabling its published file.
- No download, build step, or extra plugin is required for these options in Remux.

## Source selection

One optional extension provides three mutually exclusive modes. The main theme
remains required; the selected mode adapts to desktop, tablet and mobile.

| Mode | Behavior |
| --- | --- |
| `native` | Keep Jellyfin's original version and track controls (default) |
| `panel` | Show a source list on the details page |
| `dialog` | Choose a version and available tracks after pressing Play or Resume |

### Installation and mode selection

Remove the old `source-panel.js` and `playback-dialog.js` loaders or pasted scripts,
including local prototypes. Those files have been replaced by this extension.
Then add this loader to **Custom JS**, keeping the main theme:

```javascript
(() => {
  window.LumaaGlaassSourceSelectionOptions = {
    mode: 'native' // Change to 'panel' or 'dialog', save and fully reload.
  };
  const id = 'lumaaglaass-source-selection-script';
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
Styles are included, with no extra CSS import.

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

### Compatibility and removal

Use only this loader, not the retired panel/dialog loaders. The extension stops
already-running legacy instances when loaded, but their loaders must be removed
to prevent later asynchronous reactivation.

Media actions and the in-player version switcher remain separate options.
The latter changes versions during playback and works with all three modes.
No mode manufactures audio/subtitle tracks missing from Remux.
Native dropdown rendering can vary by browser. Tested on Remux using Jellyfin Web
10.11.11; other clients and versions have not been validated.

To return to native controls, set `mode: 'native'` or remove this extension and
reload. Keep the main theme installed. Available on `main`; older release tags
may not contain this file.

## Filter mixed collections

The optional collection filter adds **All / Movies / Shows** above collections
containing both movies and series. It uses Jellyfin's internal media types,
not translated titles, and follows the language selected in Jellyfin.

Add this separate loader to **Custom JS**, keeping the main theme loader:

```js
(() => {
  const id = 'lumaaglaass-collection-filter-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/collection-filter.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass collection filter could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [collection-filter.js](../assets/extensions/collection-filter.js) after
the main theme script. Use only one method. The extension includes its own styles;
the main CSS and JavaScript do not need to be replaced.

- Filters the native cards and section headings without changing their order.
- Does not alter collection membership, watch history, or the main Play/Shuffle actions.
- Shows other media types under **All** only.
- Resets to **All** when switching collections; single-type collections have no filter.
- Supports keyboard navigation, right-to-left layouts, and pointer feedback.
- Uses the client translator when exposed, otherwise bundled native Jellyfin strings.
  Missing translations fall back to English. No translation service or extra library query is used.

Save and fully reload. To disable it, remove its loader or pasted script and
reload again. This extension is available on `main`, not in the v1.0.0 release.

## Hide count indicators

This optional stylesheet hides Jellyfin's numeric count badges. They remain
visible unless you enable it.

**Hidden:** unplayed/unwatched item counts, including episodes on series and season
cards; item-count badges on container cards; and their `99+` variants.

**Unchanged:** watched checkmarks, favorites, playback progress, ratings, years,
media-source indicators, and counts written as ordinary text.

To enable it, use these two lines at the top of **Custom CSS**:

```css
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/branding.css');
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
import or pasted rule and reload again. If you added both, remove both.

Only elements using Jellyfin's `countIndicator` class are hidden. This is a visual
change: no counts or watch history are deleted. The rule also works with the
v1.0.0 base theme; the optional file is available on `main`, not in older release tags.

## Visual adjustments

These are optional overrides for existing shared CSS variables, not a separate
settings screen. They affect the components that use those variables, not every
color or corner in Jellyfin.

Paste this block at the **end of Custom CSS**, after all imports and any pasted
theme styles. Change only the values you want:

```css
html:root {
  --aa-surface: rgba(30, 30, 32, 0.4);
  --aa-hover-surface: rgba(255, 255, 255, 0.08);
  --aa-selected-surface: rgba(255, 255, 255, 0.16);
  --aa-option-gap: 2px;
}
```

The values above are the current defaults, so pasting them alone does not change
the appearance.

| Variable | Effect | Example adjustment |
| --- | --- | --- |
| `--aa-surface` | Shared panel background | Change the final value from `0.4` to `0.65` for a more opaque background |
| `--aa-hover-surface` | Shared hover background | Change `0.08` to `0.12` for a stronger hover highlight |
| `--aa-selected-surface` | Shared selected background | Change `0.16` to `0.22` for a stronger selection highlight |
| `--aa-option-gap` | Space between styled native dropdown options | Change `2px` to `4px` for more spacing |

Opacity values run from `0` (transparent) to `1` (opaque). Check text contrast
against both bright and dark artwork after changing them. Native dropdown styling
depends on browser support; some browsers keep their system option menus.
Keep operating-system accessibility preferences enabled.

To undo these adjustments, remove the override block and reload. Do not edit
the CDN files or replace the whole theme just to change these values.

## Updating and troubleshooting

- **An option does not appear:** save and fully reload first. Confirm that its code
  is in the correct field and that the base theme is still installed.
- **No source panel:** set source selection to `panel` and reload. The panel appears
  only when the native details page offers multiple versions.
- **No collection filter:** it appears only in collections containing both movies
  and series.
- **No audio or subtitle choices:** the dialog mirrors the options exposed by
  Remux for the selected version. It does not create missing tracks.
- **An old appearance remains:** remove duplicate loaders, pasted prototypes, and
  obsolete personal overrides. On desktop, try **Ctrl+F5**. jsDelivr caching may
  still delay updates.
- **Returning to the default interface:** remove only the optional loader, import,
  or pasted code, then reload. Keep `branding.css` and `branding.js`.

The examples use `@main` to follow the current branch. For a fixed installation,
use the same published commit SHA or release tag in the main theme and optional
file URLs. The chosen revision must contain every file you use. Do not assume an
option exists in an older release, and do not use a tag before it is published.
