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
| [Playback selection dialog](#playback-selection-dialog) | Choose a version and its tracks after pressing Play | Custom JS |
| [Source selection panel](#source-selection-panel) | Browse versions directly on the details page | Custom JS |
| [In-player version switcher](#in-player-version-switcher) | Change versions during playback and resume at the current timestamp | Custom JS |
| [Media actions](#media-actions) | Configure native, information or hidden shortcuts by media type and context | Custom JS |
| [Filter mixed collections](#filter-mixed-collections) | Show all items, movies only, or series only | Custom JS |
| [Hide count indicators](#hide-count-indicators) | Hide numeric badges on cards and lists | Custom CSS |
| [Visual adjustments](#visual-adjustments) | Adjust shared panel and selection colors | Custom CSS |

**Choose either the playback dialog or the source panel.** They are alternative
ways to choose a version. The collection filter and hidden count badges can be
used with either one, or with the default version dropdown.
The in-player version switcher can also be used with either option or on its own.

## Media actions

One optional script controls thumbnail shortcuts and selected details-page buttons.
It replaces details-first navigation and image button hiding. Remove their loaders
or pasted scripts before installing this option. Keep the main theme and unrelated
extensions. The source panel, playback dialog and in-player version switcher remain
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

## Playback selection dialog

This optional extension hides the version and track block on supported media
details pages. **Play** or **Resume** opens a dialog instead of starting playback:

1. Choose a version from the source list.
2. Adjust the available audio and subtitle tracks, if needed.
3. Press the playback button inside the dialog to start.

Source selection alone does not start playback. The dialog mirrors the native
selectors and uses the original playback button, preserving its Play/Resume action.
Closing the dialog does not start playback; selected settings remain on the page.
The read-only video summary is hidden with the original track block.

The main theme is required. **Choose this dialog or the source selection panel
below, not both.** Remove the source panel loader or pasted script when enabling
the dialog. If both are loaded, the dialog takes priority and stops the panel.

Add this separate loader to **Custom JS**, keeping the main theme loader:

```js
(() => {
  const id = 'lumaaglaass-playback-dialog-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/playback-dialog.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass playback dialog could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [playback-dialog.js](../assets/extensions/playback-dialog.js) after the main
theme script. Use only one method and remove any pasted playback dialog prototype.
Styles are included; no extra CSS import is needed. Native labels and typography
are reused; Close and Play have English fallbacks if native labels are unavailable.

Save and fully reload. To disable it, remove its loader or pasted script and
reload. Restore the source panel loader only if you want that alternative.
Pages without a usable native version selector retain their normal playback
behavior. Home banner, trailer, and shuffle actions are not intercepted.
Native dropdown rendering may vary by browser. Available on `main`, not in v1.0.0.

## Source selection panel

The optional source panel replaces the Version dropdown with a scrollable list
on media details pages that offer multiple versions. It requires the main theme.
Use it instead of the playback selection dialog, not alongside it.

- Select a source, then use **Play** to start playback. Selecting a source does not autoplay.
- Uses the native version selector and its labels. Audio, video, and subtitle controls remain native.
- On desktop, the panel appears on the right and ends no lower than the Studio row
  when available, otherwise the remaining metadata. Up to six sources are visible;
  longer lists scroll within the panel.
- On mobile and tablet, it appears above the audio/video controls, with space for at least two complete sources when available.
- A bottom chevron indicates that more sources are available below.

Add this separate loader to **Custom JS**, keeping the main theme loader:

```js
(() => {
  const id = 'lumaaglaass-source-panel-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/extensions/source-panel.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass source panel could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [source-panel.js](../assets/extensions/source-panel.js) after the main theme
script. Use only one method and remove any previously pasted source panel prototype.
The extension includes its own styles; no additional CSS import is needed.

Save and fully reload. To disable it, remove only its loader or pasted script and
reload. The main theme files remain unchanged. Available on `main`, not in v1.0.0.

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
- **No source panel:** it appears only when the native details page offers multiple
  versions. It is stopped when the playback dialog is enabled.
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
